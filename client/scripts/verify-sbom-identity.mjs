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

// @shakilabs/ui는 vendor tgz로 핀 고정된 file: 의존성이라 npm이 자동으로 버전
// 드리프트를 잡아주지 않는다 — package.json 핀을 올려도 SBOM을 재생성하지 않으면
// 구버전이 그대로 남는다(2026-08-21 함대 감사에서 9버전 낡은 SBOM 발견, biz는
// 0.3.15 vs 0.3.24). 위 메타데이터 검증은 "이 앱 자신"만 보므로 dependency로
// 들어간 @shakilabs/ui는 별도로 검증해야 한다.
const uiPin = packageJson.dependencies?.["@shakilabs/ui"];
const uiPinMatch = typeof uiPin === "string" ? uiPin.match(/shakilabs-ui-(\d+\.\d+\.\d+)\.tgz$/) : null;

if (uiPinMatch) {
  const expectedUiVersion = uiPinMatch[1];
  const uiComponent = (cyclonedx.components ?? []).find((item) => item.name === "@shakilabs/ui");

  expect(
    uiComponent?.version === expectedUiVersion,
    `cyclonedx components[] @shakilabs/ui version is "${uiComponent?.version}", expected "${expectedUiVersion}" (from package.json dependencies["@shakilabs/ui"]="${uiPin}")`,
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
