import { describe, expect, it } from "vitest";

// BizResultHero 로드 카운트업 계약.
//
// BL-020은 "마운트에서 세지 마라"로 이 동작을 금지했었다. 기록된 증상은
// `-121,973원`·`+-13,841원`처럼 **부호가 뒤집힌 프레임**이 스치는 것이었는데,
// 재현해 보니 원인은 "마운트에서 센다"가 아니라 **rAF 진행도에 하한이 없던 것**이었다.
// requestAnimationFrame 콜백의 타임스탬프는 프레임 시작 시각이라 직전에 찍은
// performance.now()보다 **이를 수 있다**. 하한이 없으면 진행도가 음수가 되고
// ease-out 곡선이 음수를 돌려줘 첫 프레임 값의 부호가 뒤집힌다.
//
// 그래서 금지하는 대신 재발 조건을 고정한다. 이 파일은 소스에 적힌 진행도·이징
// 식을 **그대로 꺼내 실행**하므로, 하한(Math.max(…, 0))을 빼면 빨개진다.

// ?raw glob으로 읽는다 — node:fs를 쓰면 클라이언트 tsconfig(@types/node 없음)에서
// 타입체크가 깨진다(참조 구현 02.finance resultHeroGrammar.test.ts와 같은 방식).
const vueSources = import.meta.glob("/src/**/*.vue", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const HERO_PATH = "/src/components/biz/BizResultHero.vue";
const source = vueSources[HERO_PATH];
const script = source.slice(0, source.indexOf("<template>"));
// 주석에 적힌 문구가 아니라 코드를 판정한다
const code = script.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const DURATION_MS = Number(/const DURATION_MS = (\d+);/.exec(code)?.[1]);
const progressMatch = /const (progress|t) = (.+?);\n/.exec(code);
const easedMatch = /const eased = (.+?);/.exec(code);

/**
 * 소스에 적힌 진행도·이징 식을 그대로 평가한다. 테스트가 자기 사본을 들고 있으면
 * 구현이 바뀌어도 초록으로 남는 가짜 게이트가 된다.
 */
function easedAt(now: number, start: number): { progress: number; eased: number } {
  const [, name, progressExpr] = progressMatch!;
  const [, easedExpr] = easedMatch!;
  const evaluate = new Function(
    "now",
    "start",
    "DURATION_MS",
    `const ${name} = ${progressExpr}; const eased = ${easedExpr}; return { progress: ${name}, eased };`
  ) as (now: number, start: number, duration: number) => { progress: number; eased: number };
  return evaluate(now, start, DURATION_MS);
}

describe("BizResultHero load count-up", () => {
  it("exposes the progress and easing expressions the component actually uses", () => {
    expect(Number.isFinite(DURATION_MS)).toBe(true);
    expect(progressMatch).not.toBeNull();
    expect(easedMatch).not.toBeNull();
  });

  // ↓ 이 한 건이 BL-020 증상의 재발 게이트다. Math.max(…, 0)을 빼면 빨개진다.
  it("clamps progress at zero when the rAF timestamp precedes the start time", () => {
    // 60Hz 한 프레임(16.7ms)만큼 이른 타임스탬프 — 실측에서 관측된 조건
    for (const earlyBy of [0.01, 1, 16.7, 50]) {
      const { progress, eased } = easedAt(1000 - earlyBy, 1000);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(eased).toBeGreaterThanOrEqual(0);
    }
  });

  it("never paints a frame whose sign differs from the final value", () => {
    // 로드 카운트업은 from=0 → target. 중간 값 = target * eased 이므로
    // eased가 음수면 그 프레임만 부호가 뒤집힌다(= `+-13,841원`의 정체).
    for (const target of [3_510_489, -121_973, 13_841, -0.5]) {
      for (let offset = -50; offset <= DURATION_MS + 50; offset += 1) {
        const { eased } = easedAt(1000 + offset, 1000);
        const shown = 0 + (target - 0) * eased;
        expect(Math.sign(shown) === 0 || Math.sign(shown) === Math.sign(target)).toBe(true);
      }
    }
  });

  it("keeps progress inside [0,1] and really moves in between", () => {
    expect(easedAt(1000 + DURATION_MS, 1000).progress).toBe(1);
    expect(easedAt(1000 + DURATION_MS * 3, 1000).progress).toBe(1);
    const mid = easedAt(1000 + DURATION_MS / 2, 1000).eased;
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });

  it("counts once per load, only after the value settles", () => {
    // 마운트에서 센다 — 옛 계약("onMounted 금지")을 새 계약으로 교체한 자리
    expect(code).toContain("onMounted");
    // 값이 확정되기 전에 시작하면 과도 값을 향해 달려간다 → settle 후 1회만
    expect(code).toMatch(/SETTLE_MS/);
    expect(code).toMatch(/loadAnimationDone/);
    // 로드 애니메이션은 0에서 시작한다
    expect(code).toMatch(/animateTo\(0, props\.value\)/);
  });

  it("skips the animation under prefers-reduced-motion", () => {
    expect(code).toMatch(/prefersReducedMotion\(\)/);
    expect(code).toMatch(/prefers-reduced-motion: reduce/);
  });

  it("does not animate a recalculation landing on the same formatted string", () => {
    expect(code).toMatch(/if \(next === previous\) return;/);
  });

  it("clears both the rAF and the settle timer on unmount", () => {
    const teardown = /onBeforeUnmount\(\(\) => \{([\s\S]*?)\}\);/.exec(code)?.[1] ?? "";
    expect(teardown).toMatch(/cancelAnimationFrame|cancelRaf/);
    expect(teardown).toMatch(/clearSettleTimer/);
  });
});
