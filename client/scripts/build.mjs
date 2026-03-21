import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  SEO_ROUTES,
  INDIVIDUAL_VS_CORP_REVENUES,
  CORP_TAX_REVENUES,
  VAT_COMPARE_REVENUES,
  STANDARD_EXPENSE_RATE_REVENUES,
  LABOR_COST_AMOUNTS,
} from "./seo-routes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const sitemapPath = resolve(projectRoot, "public", "sitemap.xml");
const viteSsgBin = resolve(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "vite-ssg.cmd" : "vite-ssg"
);

const paramPaths = new Set([
  ...INDIVIDUAL_VS_CORP_REVENUES.map((a) => `/individual-vs-corp/${a}`),
  ...CORP_TAX_REVENUES.map((a) => `/corp-tax/${a}`),
  ...VAT_COMPARE_REVENUES.map((a) => `/vat-compare/${a}`),
  ...STANDARD_EXPENSE_RATE_REVENUES.map((a) => `/standard-expense-rate/${a}`),
  ...LABOR_COST_AMOUNTS.map((a) => `/labor-cost/${a}`),
]);

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
  if (paramPaths.has(path)) {
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
  const baseUrl = "https://shakilabs.com/biz";
  const urls = SEO_ROUTES.map((path) => {
    const { changefreq, priority } = getRouteConfig(path);
    return `  <url>
    <loc>${path === "/" ? `${baseUrl}/` : `${baseUrl}${path}`}</loc>
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

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);
