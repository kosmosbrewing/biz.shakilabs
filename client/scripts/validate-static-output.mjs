import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SEO_ROUTES,
  SITEMAP_ROUTES,
  PARAM_ROUTES,
  canonicalPathFor,
} from "./seo-routes.mjs";
import { validateUtilitiesAreGenerated } from "./validate-tailwind-utilities.mjs";

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

// cleanUrls가 "/biz/"를 "/biz"로 보내므로 홈은 어디서나 슬래시 없이 주소를 잡는다:
// canonical·og:url·사이트맵 loc이 모두 같은 규칙을 써야 대조가 성립한다.
function canonicalUrlFor(route) {
  return route === "/" ? canonicalBase : `${canonicalBase}${route}`;
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
  const expectedCanonical = canonicalUrlFor(canonicalPathFor(route));
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
  const expectedUrls = SITEMAP_ROUTES.map(canonicalUrlFor);
  const variantUrls = new Set(PARAM_ROUTES.map((route) => `${canonicalBase}${route}`));

  assert(JSON.stringify(actualUrls) === JSON.stringify(expectedUrls),
    "Sitemap must contain exactly the self-canonical routes");
  assert(actualUrls.every((url) => !variantUrls.has(url)),
    "Sitemap must not list canonicalized amount-variant routes");
  return new Set(actualUrls);
}

// 라우터에 선언된 경로를 뜯어 { path, redirect } 목록으로 돌려준다.
// 라우터 파일이 진실의 원천이라 소스를 직접 읽는다 — seo-routes.mjs의 SEO_ROUTES는
// 사람이 손으로 맞추는 사본이고, 사본이 원본과 어긋나도 아무 게이트도 울지 않았다.
// 추출에 실패하면 폴백 없이 즉시 실패한다: 조용히 0건을 검사하는 게이트는
// 게이트가 없는 것보다 나쁘다(통과 로그가 안전하다는 착각을 준다).
function parseRouterRoutes(source) {
  const start = source.indexOf("export const routes");
  assert(start !== -1,
    "router/index.ts: could not find `export const routes` — route extraction failed");

  const body = source.slice(start);
  const marks = [...body.matchAll(/path:\s*"([^"]+)"/g)].map((match) => ({
    path: match[1],
    index: match.index,
  }));
  assert(marks.length > 0,
    "router/index.ts: no `path:` declarations parsed — route extraction failed");

  return marks.map((mark, i) => ({
    path: mark.path,
    // 다음 path: 선언 전까지가 이 라우트의 본문이다
    redirect: /redirect:/.test(body.slice(mark.index, marks[i + 1]?.index ?? body.length)),
  }));
}

// 회귀 게이트: 라우터에 등록된 정적 라우트가 사이트맵에 있는가(그리고 리다이렉트
// 라우트는 없는가). SEO_ROUTES는 손으로 유지하는 사본이라, 라우트를 추가하고
// 열거를 빼먹어도 빌드·프리렌더·라이브가 전부 200을 돌려준다. 사이트맵에서만
// 조용히 사라져 색인 후보 밖으로 나가는데, 사람이 XML을 세는 것 말고는 잡을 길이 없었다.
//
// 양방향인 이유: 리다이렉트 라우트는 자기 화면이 없어 다른 페이지로 canonical이 모이므로
// 사이트맵에 실으면 안 된다. "등록된 건 다 넣어라"만 검사하면 홈을 리다이렉트로 바꾼 뒤
// 사이트맵에는 URL을 남기는, 더 나쁜 모순 상태를 그대로 통과시킨다.
function validateRouterRoutesAreListed(sitemapUrls) {
  const routerSource = readFileSync(
    resolve(projectRoot, "src", "router", "index.ts"),
    "utf8"
  );
  const routerRoutes = parseRouterRoutes(routerSource);
  const indexRoute = routerRoutes.find((route) => route.path === "/");

  assert(indexRoute, "router/index.ts must register an index route");
  assert(!indexRoute.redirect,
    "Index route must render its own view: a redirect home canonicalizes to the "
      + "target page, and a page that points its canonical elsewhere cannot be listed");

  for (const route of routerRoutes) {
    // 파라미터·캐치올 라우트는 정적 URL이 아니고, 리다이렉트는 위 규칙대로 제외한다
    if (route.redirect || route.path.includes(":")) continue;
    assert(sitemapUrls.has(canonicalUrlFor(route.path)),
      `Router route is missing from the sitemap: ${canonicalUrlFor(route.path)}`);
  }

  for (const route of routerRoutes) {
    if (!route.redirect) continue;
    assert(!sitemapUrls.has(canonicalUrlFor(route.path)),
      `Redirect route must not be listed in the sitemap: ${canonicalUrlFor(route.path)}`);
  }
}

// 파생 다이제스트가 SSR 산출물에 실제로 실렸는지. 다이제스트는 가이드 섹션 앞에 8건 이상 붙으므로
// 계산기 라우트의 seo-rich-guide 안 <article> 수는 (다이제스트 8 + 일반 섹션 5) = 13 이상이어야 한다.
// 뷰가 :sections 바인딩을 원래 가이드로 되돌리면 5로 떨어져 여기서 잡힌다.
const DIGEST_ROUTES = SITEMAP_ROUTES.filter((route) => !["/about", "/terms", "/privacy"].includes(route));
const MIN_GUIDE_ARTICLES = 13;
function validateDigestRendered(route) {
  const html = readFileSync(routeOutputPath(route), "utf8");
  const guide = html.match(/<section class="seo-rich-guide[\s\S]*?<\/section>/)?.[0] ?? "";
  const articles = guide.match(/<article\b/g)?.length ?? 0;
  assert(articles >= MIN_GUIDE_ARTICLES,
    `${route}: expected at least ${MIN_GUIDE_ARTICLES} guide articles (digest + guide), found ${articles}`);
}

validateVercelConfig(resolve(repositoryRoot, "vercel.json"));
validateVercelConfig(resolve(projectRoot, "vercel.json"));
// validateRoute는 PARAM_ROUTES에도 돈다: 사이트맵에서 빠졌더라도 정적 HTML은
// 계속 존재해야 한다 (soft-404 가드).
SEO_ROUTES.forEach(validateRoute);
DIGEST_ROUTES.forEach(validateDigestRendered);
const sitemapUrls = validateSitemap();
validateRouterRoutesAreListed(sitemapUrls);
const utilityCount = validateUtilitiesAreGenerated({ projectRoot, distRoot });

// 홈이 자기 콘텐츠를 갖고 렌더됐는지. 라우터가 홈을 리다이렉트로 바꾸면 vite-ssg는
// 대상 페이지를 그대로 index.html에 복사해 /biz가 다른 계산기의 사본이 된다 —
// 그 상태에서는 위 "사이트맵에 있어야 한다" 규칙을 만족시키는 것 자체가 잘못이다.
const rootHtml = readFileSync(resolve(distRoot, "index.html"), "utf8");
const titleOf = (html) => html.match(/<title>([^<]+)<\/title>/)?.[1] ?? "";
assert(!/<div id="app">\s*<\/div>/.test(rootHtml),
  "Home must be prerendered, not shipped as the empty shell");
for (const twin of ["/individual-vs-corp", "/corp-tax"]) {
  assert(titleOf(rootHtml) !== titleOf(readFileSync(routeOutputPath(twin), "utf8")),
    `Home must not duplicate ${twin}: identical titles mean the home has no page of its own`);
}

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
// 역방향: 정상 라우트의 광고 배선까지 같이 날아가면 안 된다. 위 어서션만 있으면
// 셸에서 로더를 통째로 지워도 "통과"라서, 수익 배선이 조용히 사라진다.
const calculatorHtml = readFileSync(routeOutputPath("/individual-vs-corp"), "utf8");
assert(/googlesyndication\.com/i.test(calculatorHtml),
  "Content routes must keep the AdSense loader (the 404-only strip must not leak)");

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

console.log(`Validated ${SEO_ROUTES.length} prerendered routes (${SITEMAP_ROUTES.length} sitemap + ${PARAM_ROUTES.length} canonicalized variants), ${utilityCount} generated colour utilities, and custom 404 output.`);
