import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SEO_ROUTES,
  SITEMAP_ROUTES,
  PARAM_ROUTES,
  canonicalPathFor,
} from "./seo-routes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const repositoryRoot = resolve(projectRoot, "..");
const distRoot = resolve(projectRoot, "dist");
const canonicalBase = "https://shakilabs.com/biz";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function routeOutputPath(route) {
  return route === "/"
    ? resolve(distRoot, "index.html")
    : resolve(distRoot, `${route.slice(1)}.html`);
}

function validateVercelConfig(configPath) {
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const rewrites = config.rewrites ?? [];
  const indexRewrites = rewrites.filter(
    (rewrite) => rewrite.destination === "/index.html"
  );
  const routeRewrite = rewrites.find(
    (rewrite) => rewrite.source === "/biz/:path*"
  );

  assert(config.cleanUrls === true, `${configPath}: cleanUrls must be true`);
  assert(indexRewrites.length === 0, `${configPath}: index.html catch-all rewrite is forbidden`);
  assert(routeRewrite?.destination === "/:path*",
    `${configPath}: biz rewrite must preserve the requested path`);
}

function validateRoute(route) {
  const outputPath = routeOutputPath(route);
  assert(existsSync(outputPath), `Missing static output for ${route}: ${outputPath}`);

  const html = readFileSync(outputPath, "utf8");
  // 금액 변형은 기본 계산기 페이지로 canonical을 모아야 하고(doorway 통합),
  // 그 외 라우트는 전부 self-canonical이어야 한다.
  const canonicalRoute = canonicalPathFor(route);
  const expectedCanonical =
    canonicalRoute === "/" ? canonicalBase : `${canonicalBase}${canonicalRoute}`;
  const actualCanonical = html.match(/<link rel="canonical" href="([^"]+)"\s*\/?>/)?.[1];
  const h1Count = html.match(/<h1\b/gi)?.length ?? 0;

  assert(actualCanonical === expectedCanonical,
    `Invalid canonical for ${route}: expected ${expectedCanonical}`);
  assert(/<title>[^<]+<\/title>/.test(html), `Missing title for ${route}`);
  assert(h1Count === 1, `Expected one H1 for ${route}, found ${h1Count}`);
  assert(!/<noscript>/i.test(html),
    `Rendered route must not retain the shell noscript for ${route}`);
  assert(html.includes('id="app"'), `Missing app root for ${route}`);
}

function validateSitemap() {
  const sitemap = readFileSync(resolve(distRoot, "sitemap.xml"), "utf8");
  const actualUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const expectedUrls = SITEMAP_ROUTES.map((route) =>
    route === "/" ? canonicalBase : `${canonicalBase}${route}`
  );
  const variantUrls = new Set(PARAM_ROUTES.map((route) => `${canonicalBase}${route}`));

  assert(JSON.stringify(actualUrls) === JSON.stringify(expectedUrls),
    "Sitemap must contain exactly the self-canonical routes");
  assert(actualUrls.every((url) => !variantUrls.has(url)),
    "Sitemap must not list canonicalized amount-variant routes");
}

validateVercelConfig(resolve(repositoryRoot, "vercel.json"));
validateVercelConfig(resolve(projectRoot, "vercel.json"));
// validateRoute는 PARAM_ROUTES에도 돈다: 사이트맵에서 빠졌더라도 정적 HTML은
// 계속 존재해야 한다 (soft-404 가드).
SEO_ROUTES.forEach(validateRoute);
validateSitemap();

const notFoundPath = resolve(distRoot, "404.html");
assert(existsSync(notFoundPath), "Missing custom 404.html output");
const notFoundHtml = readFileSync(notFoundPath, "utf8");
assert(/name="robots" content="noindex,nofollow"/.test(notFoundHtml),
  "404.html must be noindex,nofollow");
assert(notFoundHtml.includes('href="/biz/individual-vs-corp"'),
  "404.html must link to an existing calculator");
// 콘텐츠가 없는 화면의 광고는 Google "Valuable Inventory" 위반이다. noindex는 색인만
// 막을 뿐 정책은 로더의 존재로 판정하므로, build.mjs가 404에서 태그를 지운 상태를
// 여기서 고정한다. 셸(index.html)은 나머지 전 라우트에 로더를 싣기 때문에,
// 이 어서션이 없으면 셸을 손대는 순간 조용히 되살아난다.
assert(!/adsbygoogle|googlesyndication/i.test(notFoundHtml),
  "404.html must not load the AdSense script (Valuable Inventory: no ads on a contentless screen)");

// 애드센스 심사 필수 3요소(제3자 광고 쿠키 고지·맞춤 광고 고지·옵트아웃 2링크)와
// 운영자 신원은 13자산 공통 기준이다. 방침 문구를 다듬다 실수로 빠뜨리면 심사에서
// 바로 걸리므로 정적 출력에 실제로 남아 있는지 빌드에서 확인한다.
const privacyHtml = readFileSync(routeOutputPath("/privacy"), "utf8");
const termsHtml = readFileSync(routeOutputPath("/terms"), "utf8");

for (const [needle, label] of [
  ["adssettings.google.com", "Google 광고 설정 옵트아웃 링크"],
  ["aboutads.info", "aboutads.info 옵트아웃 링크"],
  ["제3자", "제3자 광고 쿠키 고지"],
  ["맞춤 광고", "맞춤 광고 고지"],
]) {
  assert(privacyHtml.includes(needle), `/privacy must retain the ${label}`);
}

for (const html of [privacyHtml, termsHtml]) {
  assert(/운영:\s*ShakiLabs/.test(html), "Policy pages must state the operator (운영: ShakiLabs)");
  assert(html.includes("skdba1313@gmail.com"), "Policy pages must state the contact address");
}

console.log(`Validated ${SEO_ROUTES.length} prerendered routes (${SITEMAP_ROUTES.length} sitemap + ${PARAM_ROUTES.length} canonicalized variants) and custom 404 output.`);
