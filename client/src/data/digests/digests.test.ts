import { describe, expect, it } from "vitest";

import { BIZ_BREAK_EVEN_GUIDE, BIZ_CORP_TAX_GUIDE, BIZ_HOME_GUIDE, BIZ_INDIVIDUAL_VS_CORP_GUIDE, BIZ_LABOR_COST_GUIDE, BIZ_VAT_GUIDE } from "../seoGuides";
import { INDIVIDUAL_VS_CORP_FAQS } from "../individualVsCorpContent";
import { LABOR_COST_FAQS } from "../laborCost";
import { EXPENSE_RATE_FAQS } from "../standardExpenseRate";
import { DIGEST_ENTRIES } from "./index";
import { manwon, num, pct, pp, won } from "./format";

// 규율: 페이지당 파생 발견 8개 이상. 법령 수치를 단순 인용한 문장은 발견이 아니므로,
// 발견마다 경계·차액·역전·상쇄 같은 파생 수치가 여럿 들어 있어야 한다(숫자 토큰 4개 이상).
const MIN_FINDINGS = 8;
const MIN_NUMBER_TOKENS = 4;
// scaled content abuse 방지: 새 산문 전 쌍 유사도 0.5 미만, 기존 본문·FAQ와는 0.85 미만
const MAX_PAIR_SIMILARITY = 0.5;
const MAX_LEGACY_SIMILARITY = 0.85;
// /about의 자기한정 문구("최근 반영 … 데이터 확인일 …")와 모순되는 갱신 약속은 어떤 문장에도 못 들어온다
const CADENCE_PROMISE = /매월\s*\S*\s*(반영|갱신|업데이트)|주\s*1회|매주|정기적으로\s*(갱신|업데이트)/;

// 뷰·다이제스트 소스를 문자열로 읽는다 — node:fs 대신 Vite의 ?raw 글롭을 쓰므로 @types/node가 필요 없다
const VIEW_SOURCES = import.meta.glob("../../views/*.vue", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const DIGEST_SOURCES = import.meta.glob("./*Digest.ts", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const sourceOf = (table: Record<string, string>, file: string) => {
  const key = Object.keys(table).find((k) => k.endsWith(`/${file}`));
  if (!key) throw new Error(`source not found: ${file}`);
  return table[key];
};
const ALL = DIGEST_ENTRIES.flatMap(({ route, digest }) =>
  digest.findings.map((f, i) => ({ id: `${route}#${i + 1}`, route, digest, ...f })),
);

const compact = (text: string) => text.replace(/\s+/g, "");

function bigrams(text: string): Map<string, number> {
  const map = new Map<string, number>();
  const t = compact(text);
  for (let i = 0; i < t.length - 1; i += 1) {
    const g = t.slice(i, i + 2);
    map.set(g, (map.get(g) ?? 0) + 1);
  }
  return map;
}

/** 문자 바이그램 Dice 계수 — 0(무관)~1(동일). 순서를 무시하므로 문장 재배열 복제도 잡는다. */
export function similarity(a: string, b: string): number {
  const ga = bigrams(a);
  const gb = bigrams(b);
  let shared = 0;
  for (const [g, n] of ga) shared += Math.min(n, gb.get(g) ?? 0);
  const total = [...ga.values()].reduce((s, n) => s + n, 0) + [...gb.values()].reduce((s, n) => s + n, 0);
  return total === 0 ? 0 : (2 * shared) / total;
}

/** 산문 속 숫자 토큰 — "3,562,521원"의 "3,562,521", "18.75%"의 "18.75". 문장 끝 마침표는 뗀다. */
function numberTokens(text: string): string[] {
  return (text.match(/\d[\d,.]*/g) ?? []).map((t) => t.replace(/[.,]+$/, ""));
}

/** facts·inputs의 모든 값을 산문이 쓸 수 있는 모든 포맷으로 펼친 뒤 같은 규칙으로 토큰화한다 */
function allowedTokens(values: number[]): Set<string> {
  const out = new Set<string>();
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    const forms = [
      won(v), manwon(v), manwon(v, 1), pct(v, 1), pct(v, 2), pct(v, 3), pp(v, 1), pp(v, 2),
      num(v), num(v, 1), num(v, 2), num(v / 10_000), num(v * 100),
    ];
    for (const form of forms) for (const t of numberTokens(form)) out.add(t);
  }
  return out;
}

describe("파생 다이제스트 — 발견 밀도", () => {
  it.each(DIGEST_ENTRIES.map((e) => [e.route, e.digest] as const))(`%s 페이지는 발견 ${MIN_FINDINGS}개 이상`, (_route, digest) => {
    expect(digest.findings.length).toBeGreaterThanOrEqual(MIN_FINDINGS);
  });

  it("발견마다 파생 수치가 여럿 들어 있다", () => {
    for (const f of ALL) {
      expect(numberTokens(f.body).length, f.id).toBeGreaterThanOrEqual(MIN_NUMBER_TOKENS);
      expect(f.body.length, f.id).toBeGreaterThan(200);
    }
  });

  it("산문의 숫자는 전부 엔진 실행값(facts) 아니면 명시된 입력값(inputs)에서 온다 — 손으로 적은 숫자 금지", () => {
    const violations: string[] = [];
    for (const f of ALL) {
      const allowed = allowedTokens([...Object.values(f.digest.facts), ...Object.values(f.digest.inputs)]);
      for (const token of numberTokens(`${f.h2} ${f.body}`)) {
        // 한 자리·두 자리 정수는 "4대보험"·"1원당"·"12개월" 같은 서수·단위라 허용한다
        if (/^\d{1,2}$/.test(token)) continue;
        if (!allowed.has(token)) violations.push(`${f.id}: "${token}"`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("엔진 실행값은 전부 유한한 수다 — 스캔이 경계를 못 찾으면 NaN이 산문에 새어 나간다", () => {
    for (const { route, digest } of DIGEST_ENTRIES) {
      for (const [key, value] of Object.entries(digest.facts)) expect(Number.isFinite(value), `${route} facts.${key}`).toBe(true);
      expect(`${digest.findings.map((f) => f.h2 + f.body)}`, route).not.toMatch(/NaN|Infinity|undefined/);
    }
  });

  it("갱신 주기 약속·조사 오류가 없다", () => {
    const violations: string[] = [];
    for (const f of ALL) {
      const text = `${f.h2} ${f.body}`;
      expect(text, f.id).not.toMatch(CADENCE_PROMISE);
      // 원(받침 있음)에는 으로, %·%p(받침 없음)에는 는/가/를/와만 붙는다
      for (const m of text.matchAll(/.{6}(원로 |%을 |%과 |%이 |%은 |%p을 |%p과 |%p이 |%p은 )/g)) violations.push(`${f.id}: …${m[0]}`);
    }
    expect(violations).toEqual([]);
  });
});

describe("파생 다이제스트 — 복제 방지", () => {
  it(`새 산문 전 쌍 유사도 ${MAX_PAIR_SIMILARITY} 미만`, () => {
    for (let i = 0; i < ALL.length; i += 1) {
      for (let j = i + 1; j < ALL.length; j += 1) {
        const s = similarity(ALL[i].body, ALL[j].body);
        expect(s, `${ALL[i].id} vs ${ALL[j].id}`).toBeLessThan(MAX_PAIR_SIMILARITY);
      }
    }
  });

  it(`기존 가이드 본문·FAQ와 유사도 ${MAX_LEGACY_SIMILARITY} 미만`, () => {
    const legacy = [BIZ_HOME_GUIDE, BIZ_INDIVIDUAL_VS_CORP_GUIDE, BIZ_CORP_TAX_GUIDE, BIZ_VAT_GUIDE, BIZ_BREAK_EVEN_GUIDE, BIZ_LABOR_COST_GUIDE]
      .flatMap((g) => [g.intro, ...(g.sections ?? []).map((s) => s.body), ...(g.faqs ?? []).map((q) => q.a)])
      .concat([...INDIVIDUAL_VS_CORP_FAQS, ...LABOR_COST_FAQS, ...EXPENSE_RATE_FAQS].map((q) => q.a));
    for (const f of ALL) {
      for (const body of legacy) expect(similarity(f.body, body), f.id).toBeLessThan(MAX_LEGACY_SIMILARITY);
    }
  });
});

describe("파생 다이제스트 — 뷰 배선", () => {
  it("각 뷰가 withDigest(가이드, 자기 다이제스트)로 섹션을 합성한다", () => {
    for (const { route, view, exportName: name } of DIGEST_ENTRIES) {
      const source = sourceOf(VIEW_SOURCES, view);
      expect(source, `${route} imports ${name}`).toMatch(new RegExp(`import \\{[^}]*\\b${name}\\b[^}]*\\} from "@/data/digests/`));
      expect(source, `${route} composes sections`).toMatch(new RegExp(`withDigest\\(\\s*BIZ_\\w+_GUIDE,\\s*${name}\\s*\\)`));
      expect(source, `${route} binds composed sections`).toContain(':sections="guideSections"');
    }
  });

  it("다이제스트 파일 본문에는 1,000 이상의 숫자 리터럴이 없다 — 값은 INPUTS 선언과 엔진에서만 온다", () => {
    for (const { file } of DIGEST_ENTRIES) {
      const source = sourceOf(DIGEST_SOURCES, file)
        .replace(/\/\/[^\n]*/g, "")
        .replace(/export const \w+_INPUTS = \{[\s\S]*?\n\};/, "");
      const literals = source.match(/(?<![\w.])\d[\d_]*(?:\.\d+)?(?:e\d+)?(?![\w.])/g) ?? [];
      const big = literals.filter((l: string) => Number(l.replace(/_/g, "")) >= 1000);
      expect(big, `${file}: ${big.join(", ")}`).toEqual([]);
    }
  });
});
