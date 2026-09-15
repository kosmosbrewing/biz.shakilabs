import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
export const clientRoot = resolve(scriptRoot, "..");

// GmarketSans는 h1 제목·섹션 헤딩(.retro-title)·결과 히어로 금액에만 쓰인다.
// 이 문자셋은 소스 grep이 아니라 dist를 정적 서빙한 뒤 headless 브라우저로 전
// 라우트를 돌며 "computed fontFamily가 GmarketSans로 해석되는 리프 요소"만
// 수집해 만든 것이다(docs/BRAND_FONT_SUBSET.md §3). UI 문구가 바뀌면 같은
// 방식으로 다시 스캔해서 이 파일을 갱신해야 한다 — 손으로 고치거나 소스 전체를
// grep해서 채우면 과대/과소 수집된다(정본 문서의 개정 사유 참고).
export const brandCharsetPath = resolve(scriptRoot, "brand-font-charset.txt");

export const fontJobs = [
  {
    source: resolve(clientRoot, "public/fonts/GmarketSansBold.woff"),
    output: resolve(clientRoot, "public/fonts/GmarketSansBold-brand-v1.woff2"),
    publicName: "GmarketSansBold-brand-v1.woff2",
    maxBytes: 24 * 1024,
    preload: false,
  },
];
