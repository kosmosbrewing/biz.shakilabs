// vendor tgz ↔ vendor/README.md ↔ package.json 3자를 대조한다.
// README에 적힌 버전·SHA-256이 실제 tgz와 어긋나면 무결성 검증을 하려는 사람에게 오답을 주므로,
// "오래된 문서"가 아니라 "틀린 공급망 기록"으로 취급해 CI에서 막는다.
// 네트워크 불필요, 완전 결정적. vendor 디렉터리가 없으면 그대로 통과(no-op)한다.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vendorDir = resolve(projectRoot, "vendor");

if (!existsSync(vendorDir)) {
  console.log("verify-vendor-artifacts: no vendor directory, skipped");
  process.exit(0);
}

const packageJson = JSON.parse(readFileSync(resolve(projectRoot, "package.json"), "utf8"));
const tarballs = readdirSync(vendorDir).filter((name) => name.endsWith(".tgz"));
const errors = [];

// 활성 아티팩트 1개만 커밋하는 것이 이 저장소 관례다(롤백본은 Git 히스토리에서 꺼낸다).
if (tarballs.length !== 1) {
  fail(`expected exactly 1 vendored tgz, found ${tarballs.length}: ${tarballs.join(", ") || "(none)"}`);
  report();
}

const tarball = tarballs[0];
const actualSha256 = createHash("sha256").update(readFileSync(resolve(vendorDir, tarball))).digest("hex");

// 1) package.json이 실제 커밋된 tgz를 가리키는가
const references = Object.entries(packageJson.dependencies ?? {}).filter(([, spec]) =>
  String(spec).startsWith("file:vendor/"),
);

if (references.length === 0) {
  fail(`package.json has no "file:vendor/..." dependency but ${tarball} is committed`);
}

for (const [name, spec] of references) {
  const expectedSpec = `file:vendor/${tarball}`;

  if (spec !== expectedSpec) {
    fail(`package.json "${name}" is "${spec}", expected "${expectedSpec}"`);
  }
}

// 2) README가 실제 tgz 파일명을 명시하는가
const readmePath = resolve(vendorDir, "README.md");

if (!existsSync(readmePath)) {
  fail("vendor/README.md is missing");
} else {
  const readme = readFileSync(readmePath, "utf8");

  if (!readme.includes(tarball)) {
    fail(`vendor/README.md does not mention the committed artifact "${tarball}"`);
  }

  // 3) README에 적힌 SHA-256이 실제 tgz 해시와 같은가
  const documented = readme.match(/\b[0-9a-f]{64}\b/g) ?? [];

  if (documented.length === 0) {
    fail("vendor/README.md records no SHA-256 for the committed artifact");
  } else if (!documented.includes(actualSha256)) {
    fail(
      `vendor/README.md SHA-256 ${documented.join(", ")} does not match ${tarball} (${actualSha256})`,
    );
  }
}

report();

console.log(`verify-vendor-artifacts: OK (${tarball}, sha256 ${actualSha256.slice(0, 12)}…)`);

function fail(message) {
  errors.push(message);
}

function report() {
  if (errors.length === 0) {
    return;
  }

  console.error("verify-vendor-artifacts: FAILED — vendored artifact records are inconsistent");
  for (const message of errors) {
    console.error(`  - ${message}`);
  }
  process.exit(1);
}
