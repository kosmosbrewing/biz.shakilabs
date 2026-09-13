import { useHead } from "@unhead/vue";
import { toValue, type MaybeRefOrGetter } from "vue";
import { useRoute } from "vue-router";
import { getSiteUrl } from "@/lib/site";

// 정본 규칙(디자인 시스템 §11.1): "{페이지} | {카테고리} | ShakiLabs".
const CATEGORY = "사업자 계산기";
const TITLE_SUFFIX = ` | ${CATEGORY} | ShakiLabs`;
const DEFAULT_TITLE = CATEGORY;
const LEGACY_TITLE_SUFFIXES = [
  TITLE_SUFFIX,
  " | shakilabs.com/biz",
  " | 오픈마켓 수수료 비교 계산기",
  " | 오픈마켓 수수료 계산기",
  " | ShakiLabs",
  ` | ${CATEGORY}`,
] as const;

type SEOOptions = {
  title: MaybeRefOrGetter<string>;
  description: MaybeRefOrGetter<string>;
  ogImage?: MaybeRefOrGetter<string | undefined>;
  noindex?: MaybeRefOrGetter<boolean | undefined>;
  jsonLd?: MaybeRefOrGetter<
    Record<string, unknown> | Record<string, unknown>[] | undefined
  >;
  /**
   * canonical / hreflang / og:url에 쓸 경로 오버라이드.
   * 금액 변형 라우트(예: /labor-cost/300)는 프리렌더 본문이 기본 계산기와
   * 동일하므로 기본 경로("/labor-cost")를 넘긴다 — noindex 대신 canonical
   * 통합을 써서 변형에 쌓인 랭킹 신호를 기본 페이지로 합친다.
   */
  canonicalPath?: MaybeRefOrGetter<string | undefined>;
};

// 뷰가 넘기는 title에 이미 "|"가 들어있어도(서브타이틀 병기) 배지를 건너뛰지
// 않는다 — 예전에는 pipe 유무로 두 레시피가 섞였다(카테고리 배지 있음/없음).
// 항상 한 레시피만 적용해 배지 유무가 페이지마다 갈리지 않게 한다.
function normalizeTitle(rawTitle: string): string {
  const trimmed = rawTitle.trim();
  let baseTitle = trimmed || DEFAULT_TITLE;

  for (const suffix of LEGACY_TITLE_SUFFIXES) {
    if (baseTitle.endsWith(suffix)) {
      baseTitle = baseTitle.slice(0, -suffix.length).trimEnd();
      break;
    }
  }

  if (!baseTitle) {
    baseTitle = DEFAULT_TITLE;
  }

  // v3 §11.1의 레시피는 `{페이지} | {카테고리} | ShakiLabs` 3단이다.
  // 페이지 이름이 자체 부제를 pipe로 달고 있으면 4단이 되어 어디까지가 페이지명인지
  // 읽히지 않는다. 부제는 검색 키워드를 담고 있으므로 버리지 않고 구분자만 중점으로 바꾼다.
  baseTitle = baseTitle.replace(/\s*\|\s*/g, " · ");

  // 카테고리 없는 루트 예외(§11.1): 페이지 이름이 이미 카테고리로 시작하면
  // ("사업자 계산기 | ..." 같은 홈) 배지를 또 붙이지 않고 ShakiLabs만 추가한다.
  if (baseTitle.startsWith(CATEGORY)) {
    return `${baseTitle} | ShakiLabs`;
  }

  return `${baseTitle}${TITLE_SUFFIX}`;
}

export function useSEO({
  title,
  description,
  ogImage,
  noindex = false,
  jsonLd,
  canonicalPath,
}: SEOOptions): void {
  const route = useRoute();

  useHead(() => {
    const resolvedTitle = normalizeTitle(toValue(title));
    const resolvedDescription = toValue(description);
    const resolvedNoindex = Boolean(toValue(noindex));
    const resolvedOgImage = toValue(ogImage);
    const resolvedJsonLd = toValue(jsonLd);
    const resolvedJsonLdArray = Array.isArray(resolvedJsonLd)
      ? resolvedJsonLd.filter(
          (entry): entry is Record<string, unknown> =>
            Boolean(entry) && typeof entry === "object"
        )
      : resolvedJsonLd && typeof resolvedJsonLd === "object"
        ? [resolvedJsonLd]
        : [];
    const siteUrl = getSiteUrl().replace(/\/+$/, "");
    // canonical·hreflang·og:url은 항상 서로 일치해야 하므로 같은 경로에서
    // 한 번만 해석한다 (오버라이드 우선, 없으면 라우트 경로).
    const resolvedCanonicalPath = toValue(canonicalPath);
    const currentPath = resolvedCanonicalPath || route.path || "/";
    const currentUrl = currentPath === "/" ? siteUrl : `${siteUrl}${currentPath}`;

    return {
      htmlAttrs: {
        lang: "ko",
      },
      title: resolvedTitle,
      link: currentUrl
        ? [
            { rel: "canonical", href: currentUrl },
            { rel: "alternate", hreflang: "ko", href: currentUrl },
            { rel: "alternate", hreflang: "x-default", href: currentUrl },
          ]
        : [],
      meta: [
        { name: "description", content: resolvedDescription },
        { property: "og:title", content: resolvedTitle },
        { property: "og:description", content: resolvedDescription },
        { name: "twitter:title", content: resolvedTitle },
        { name: "twitter:description", content: resolvedDescription },
        ...(currentUrl ? [{ property: "og:url", content: currentUrl }] : []),
        ...(resolvedNoindex ? [{ name: "robots", content: "noindex,nofollow" }] : []),
        ...(resolvedOgImage
          ? [
              { property: "og:image", content: resolvedOgImage },
              { name: "twitter:image", content: resolvedOgImage },
            ]
          : []),
      ],
      script: resolvedJsonLdArray.map((entry, index) => ({
        key: `json-ld-${index}`,
        type: "application/ld+json",
        textContent: JSON.stringify(entry),
      })),
    };
  });
}
