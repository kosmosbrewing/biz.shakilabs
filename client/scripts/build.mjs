import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { SEO_ROUTES, SITEMAP_ROUTES } from "./seo-routes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const sitemapPath = resolve(projectRoot, "public", "sitemap.xml");
const viteSsgBin = resolve(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "vite-ssg.cmd" : "vite-ssg"
);

// 금액 변형 라우트("/family/12345") 판별. 현재는 5개 패밀리 전부 canonical 통합으로
// 사이트맵에서 빠져 있어 이 분기를 타지 않지만, 어느 패밀리가 고유 본문을 갖춰
// PARAM_ROUTES에서 빠지면 열거를 고칠 필요 없이 바로 0.7 우선순위를 받는다.
const PARAM_PATH_PATTERN = /^\/[a-z-]+\/\d+$/;

const basePriority = {
  "/": "1.0",
  "/individual-vs-corp": "0.9",
  "/break-even": "0.8",
  "/vat-compare": "0.8",
  "/delivery-fee": "0.8",
  "/corp-tax": "0.9",
  "/car-expense": "0.8",
  "/meeting-cost": "0.8",
  "/standard-expense-rate": "0.9",
  "/labor-cost": "0.8",
  "/about": "0.4",
  "/terms": "0.3",
  "/privacy": "0.3",
};

function getRouteConfig(path) {
  if (basePriority[path]) {
    const isInfo = ["about", "terms", "privacy"].some((s) => path.includes(s));
    return {
      changefreq: path === "/" ? "weekly" : isInfo ? "yearly" : "monthly",
      priority: basePriority[path],
    };
  }
  if (PARAM_PATH_PATTERN.test(path)) {
    return { changefreq: "monthly", priority: "0.7" };
  }
  return { changefreq: "monthly", priority: "0.5" };
}

function resolveBuildDate() {
  const candidate = process.env.BUILD_DATE?.trim();
  if (candidate && /^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
    return candidate;
  }

  return new Date().toISOString().slice(0, 10);
}

function renderSitemap(buildDate) {
  // 금액 변형(PARAM_ROUTES)은 의도적으로 빠져 있다: canonical이 기본 페이지를
  // 가리키므로 사이트맵에 실으면 "곧바로 딴 곳을 가리키는 URL"을 광고하는 셈이다.
  const baseUrl = "https://shakilabs.com/biz";
  const urls = SITEMAP_ROUTES.map((path) => {
    const { changefreq, priority } = getRouteConfig(path);
    return `  <url>
    <loc>${path === "/" ? baseUrl : `${baseUrl}${path}`}</loc>
    <lastmod>${buildDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function routeOutputPath(route) {
  return route === "/"
    ? resolve(projectRoot, "dist", "index.html")
    : resolve(projectRoot, "dist", `${route.slice(1)}.html`);
}

function removeRenderedNoscriptFallbacks() {
  for (const route of [...SEO_ROUTES, "/404"]) {
    const outputPath = routeOutputPath(route);
    if (!existsSync(outputPath)) continue;

    const html = readFileSync(outputPath, "utf8");
    const nextHtml = html.replace(
      /\n?\s*<noscript>[\s\S]*?<\/noscript>/i,
      "",
    );
    writeFileSync(outputPath, nextHtml, "utf8");
  }
}

// 404 셸에서만 애드센스 로더를 걷어낸다. 404 화면은 제목·안내 한 줄·복귀 링크뿐이라
// 게시자 콘텐츠가 사실상 없는데, 콘텐츠 없는 화면에 광고를 싣는 것이 Google의
// "Valuable Inventory"(가치 있는 인벤토리) 정책이 금지하는 바로 그 상황이다.
// noindex는 색인만 막을 뿐 정책 판정은 로더의 존재로 이뤄지므로 태그 자체를 지운다.
//
// 정상 라우트의 광고 배선은 건드리지 않는다: 이 앱의 광고는 전부 셸의 이 태그 하나에서
// 나오고(AdSlot.vue는 어디에서도 import되지 않는다) 404.html만 후처리하기 때문이다.
function stripAdsenseLoaderFromNotFound() {
  const outputPath = routeOutputPath("/404");
  if (!existsSync(outputPath)) return;

  const html = readFileSync(outputPath, "utf8");
  writeFileSync(
    outputPath,
    html.replace(/\n?\s*<script[^>]*\bdata-adsense="true"[^>]*><\/script>/i, ""),
    "utf8",
  );
}

const buildDate = resolveBuildDate();

mkdirSync(dirname(sitemapPath), { recursive: true });
writeFileSync(sitemapPath, renderSitemap(buildDate), "utf8");

const result = spawnSync(viteSsgBin, ["build"], {
  cwd: projectRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    BUILD_DATE: buildDate,
  },
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

removeRenderedNoscriptFallbacks();
stripAdsenseLoaderFromNotFound();

const validationResult = spawnSync(
  process.execPath,
  [resolve(projectRoot, "scripts", "validate-static-output.mjs")],
  {
    cwd: projectRoot,
    stdio: "inherit",
  }
);

process.exit(validationResult.status ?? 1);
