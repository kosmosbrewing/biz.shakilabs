// 커밋된 SBOM이 "이 저장소의 것"인지만 확인한다.
// 재생성 후 diff 방식은 timestamp·documentNamespace·npm CLI 버전 때문에 상시 실패하므로 쓰지 않는다.
// 네트워크·npm ci 불필요, 완전 결정적. 커밋된 SBOM이 없으면 그대로 통과(no-op)한다.
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cyclonedxPath = resolve(projectRoot, "artifacts", "sbom", "production.cyclonedx.json");
const spdxPath = resolve(projectRoot, "artifacts", "sbom", "production.spdx.json");

if (!existsSync(cyclonedxPath)) {
  console.log("verify-sbom-identity: no committed SBOM, skipped");
  process.exit(0);
}

const packageJson = readJson(resolve(projectRoot, "package.json"));
const cyclonedx = readJson(cyclonedxPath);
const component = cyclonedx.metadata?.component ?? {};
const errors = [];

expect(
  component.name === packageJson.name,
  `cyclonedx metadata.component.name is "${component.name}", expected "${packageJson.name}"`,
);
expect(
  component.version === packageJson.version,
  `cyclonedx metadata.component.version is "${component.version}", expected "${packageJson.version}"`,
);

// GITHUB_REPOSITORY는 CI에서만 채워진다. 로컬 실행에서는 이 항목만 건너뛴다.
if (process.env.GITHUB_REPOSITORY) {
  const expectedUrl = `https://github.com/${process.env.GITHUB_REPOSITORY}`;
  const vcs = (component.externalReferences ?? []).find((reference) => reference.type === "vcs");

  expect(vcs?.url === expectedUrl, `cyclonedx vcs url is "${vcs?.url}", expected "${expectedUrl}"`);
}

if (existsSync(spdxPath)) {
  const spdx = readJson(spdxPath);
  const rootId = spdx.documentDescribes?.[0];
  const rootPackage = spdx.packages?.find((item) => item.SPDXID === rootId);

  expect(
    rootPackage?.name === packageJson.name,
    `spdx root package name is "${rootPackage?.name}", expected "${packageJson.name}"`,
  );
}

if (errors.length > 0) {
  console.error("verify-sbom-identity: FAILED — committed SBOM does not describe this repository");
  for (const message of errors) {
    console.error(`  - ${message}`);
  }
  console.error("  fix: run `npm run sbom:prod` in this repository and commit the result");
  process.exit(1);
}

console.log(`verify-sbom-identity: OK (${packageJson.name}@${packageJson.version})`);

function expect(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}
