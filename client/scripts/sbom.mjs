import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const repoRoot = resolve(projectRoot, "..");
const outputDir = resolve(projectRoot, "artifacts", "sbom");

const packageJson = JSON.parse(readFileSync(resolve(projectRoot, "package.json"), "utf8"));
const repositoryUrl = resolveRepositoryUrl();
const baseArgs = [
  "sbom",
  "--package-lock-only",
  "--omit=dev",
  "--omit=optional",
  "--sbom-type",
  "application",
];

mkdirSync(outputDir, { recursive: true });

const cyclonedx = JSON.parse(runNpmSbom([...baseArgs, "--sbom-format", "cyclonedx"]));
normalizeCyclonedx(cyclonedx);

const spdx = JSON.parse(runNpmSbom([...baseArgs, "--sbom-format", "spdx"]));
normalizeSpdx(spdx);

writeJson(resolve(outputDir, "production.cyclonedx.json"), cyclonedx);
writeJson(resolve(outputDir, "production.spdx.json"), spdx);

console.log("Wrote client/artifacts/sbom/production.cyclonedx.json");
console.log("Wrote client/artifacts/sbom/production.spdx.json");

function runNpmSbom(args) {
  return execFileSync("npm", args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
}

function normalizeCyclonedx(document) {
  for (const item of document.components ?? []) {
    for (const reference of item.externalReferences ?? []) {
      reference.url = toRepoRelativeVendorUrl(reference.url);
    }
  }

  const component = document.metadata?.component ?? {};

  component.type = "application";
  component.name = packageJson.name;
  component.version = packageJson.version;
  component.purl = component.purl || toPurl(packageJson.name, packageJson.version);
  component.externalReferences = mergeVcsReference(component.externalReferences ?? []);
  component.properties = mergeProperties(component.properties ?? [], {
    "shakilabs:sbom:target": "production-artifact",
    "shakilabs:sbom:source": "npm sbom --package-lock-only --omit=dev --omit=optional",
  });

  document.metadata = {
    ...document.metadata,
    lifecycles: [{ phase: "build" }],
    component,
  };

  const componentRefs = new Set((document.components ?? []).map((item) => item["bom-ref"]));

  if (Array.isArray(document.dependencies)) {
    document.dependencies = document.dependencies
      .filter((entry) => entry.ref === component["bom-ref"] || componentRefs.has(entry.ref))
      .map((entry) => ({
        ...entry,
        dependsOn: (entry.dependsOn ?? []).filter((ref) => componentRefs.has(ref)),
      }));
  }
}

function normalizeSpdx(document) {
  for (const item of document.packages ?? []) {
    item.downloadLocation = toRepoRelativeVendorUrl(item.downloadLocation);
  }

  const rootId = document.documentDescribes?.[0];
  const rootPackage = document.packages?.find((item) => item.SPDXID === rootId) ?? document.packages?.[0];

  if (!rootPackage) {
    return;
  }

  rootPackage.name = packageJson.name;
  rootPackage.versionInfo = packageJson.version;
  rootPackage.packageFileName = "client/dist";
  rootPackage.primaryPackagePurpose = "APPLICATION";
  rootPackage.comment = "Generated from the production dependency graph (package-lock-only, omit=dev, omit=optional).";

  document.comment = "Production artifact SBOM generated from npm lockfile.";
}

// npm은 file: 의존성(vendor tgz)의 위치를 "생성한 머신의 절대 경로"로 기록한다.
// 게다가 npm 11의 redactor가 UUID처럼 보이는 경로 조각을 ***로 마스킹하므로,
// 커밋된 SBOM에 어느 머신에서도 존재하지 않는 경로가 남는다(예: file:/private/tmp/.../***/client/vendor/x.tgz).
// 저장소 어디에서 재생성하든 같은 값이 나오도록 repo 루트 기준 상대 경로로 되돌린다.
function toRepoRelativeVendorUrl(url) {
  if (typeof url !== "string" || !url.startsWith("file:")) {
    return url;
  }

  const fileName = basename(url);

  // vendor 디렉터리에 실제로 존재하는 파일일 때만 치환한다(오탐 방지).
  if (!fileName || !existsSync(resolve(projectRoot, "vendor", fileName))) {
    return url;
  }

  return `file:client/vendor/${fileName}`;
}

function mergeVcsReference(references) {
  if (!repositoryUrl) {
    return references;
  }

  const hasVcsReference = references.some(
    (reference) => reference.type === "vcs" && normalizeGitUrl(reference.url) === repositoryUrl,
  );

  if (hasVcsReference) {
    return references;
  }

  return [...references, { type: "vcs", url: repositoryUrl }];
}

function mergeProperties(properties, additions) {
  const merged = new Map(properties.map((property) => [property.name, property.value]));

  for (const [name, value] of Object.entries(additions)) {
    merged.set(name, value);
  }

  return [...merged.entries()].map(([name, value]) => ({ name, value }));
}

function resolveRepositoryUrl() {
  try {
    const raw = execFileSync("git", ["config", "--get", "remote.origin.url"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    return normalizeGitUrl(raw);
  } catch {
    return "";
  }
}

function normalizeGitUrl(url) {
  if (!url) {
    return "";
  }

  if (url.startsWith("git@github.com:")) {
    return `https://github.com/${url.slice("git@github.com:".length).replace(/\.git$/, "")}`;
  }

  return url.replace(/\.git$/, "");
}

function toPurl(name, version) {
  return `pkg:npm/${encodePurlName(name)}@${version}`;
}

function encodePurlName(name) {
  return name.replace(/^@/, "%40");
}

function writeJson(filePath, content) {
  writeFileSync(filePath, `${JSON.stringify(content, null, 2)}\n`);
}
