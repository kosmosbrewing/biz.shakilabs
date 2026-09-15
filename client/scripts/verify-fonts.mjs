import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { brandCharsetPath, fontJobs } from "./font-subset-config.mjs";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(scriptRoot, "..");
const distRoot = resolve(clientRoot, "dist");
const manifest = JSON.parse(readFileSync(resolve(scriptRoot, "font-subset-manifest.json"), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hash(content) {
  return createHash("sha256").update(content).digest("hex");
}

// 브라우저로 전 라우트를 다시 스캔하진 않는다(빌드마다 하기엔 비용이 크다) —
// 대신 체크인된 문자셋 파일이 manifest 생성 시점과 그대로인지만 해시로 확인한다.
// 문자셋 자체의 정확성(렌더 결과와 일치하는지)은 재생성 시 fontTools cmap
// 대조로 보장된다(scripts/subset-fonts.mjs 실행 시 수행, docs/BRAND_FONT_SUBSET.md §6).
const characters = readFileSync(brandCharsetPath, "utf8");
assert(manifest.characterSha256 === hash(characters),
  "브랜드 폰트 문자셋이 바뀌었다; npm run fonts:subset 재실행 필요");

const manifestFonts = new Map(manifest.fonts.map((font) => [font.publicName, font]));

const css = readdirSync(resolve(distRoot, "assets"))
  .filter((file) => file.endsWith(".css"))
  .map((file) => readFileSync(resolve(distRoot, "assets", file), "utf8"))
  .join("\n");

for (const fontJob of fontJobs) {
  const fontPath = resolve(distRoot, "fonts", fontJob.publicName);
  assert(existsSync(fontPath), `Missing shipped font: ${fontJob.publicName}`);
  const font = readFileSync(fontPath);
  const manifestFont = manifestFonts.get(fontJob.publicName);
  assert(font.subarray(0, 4).toString("ascii") === "wOF2", "Shipped font must be WOFF2");
  assert(font.byteLength <= fontJob.maxBytes,
    `${fontJob.publicName} exceeds its ${fontJob.maxBytes}-byte budget`);
  assert(manifestFont?.bytes === font.byteLength, `${fontJob.publicName} manifest size is stale`);
  assert(manifestFont?.sha256 === hash(font), `${fontJob.publicName} hash does not match`);
  assert(css.includes(`/biz/fonts/${fontJob.publicName}`), `Built CSS misses ${fontJob.publicName}`);
}

console.log(`Validated ${fontJobs.length} brand font subset(s).`);
