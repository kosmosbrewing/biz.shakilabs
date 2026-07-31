import { describe, expect, it } from "vitest";

// formatPercent 호출 규약 가드는 소스 텍스트를 직접 읽어야 한다.
// @types/node 의존을 늘리지 않으려고 Vite의 raw glob으로 파일 본문을 가져온다.
const sources = import.meta.glob<string>("../**/*.{vue,ts}", {
  query: "?raw",
  import: "default",
  eager: true,
});

// formatPercent(x * 100) / formatPercent(x*100, 1) 같은 이중 곱 호출을 잡는다.
// 인자 안에 다른 괄호가 없는 단순 표현식만 검사하면 실사용 오탐이 없다.
const DOUBLE_MULTIPLY = /formatPercent\(\s*[^()]*?\*\s*100\b/g;

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split("\n").length;
}

describe("formatPercent 호출 규약", () => {
  it("스캔 대상 소스를 실제로 읽어온다", () => {
    // glob이 조용히 0건이 되면 가드가 무력화되므로 하한선을 둔다.
    expect(Object.keys(sources).length).toBeGreaterThan(20);
  });

  // formatPercent는 비율(0.188)을 받아 내부에서 ×100 한다.
  // 호출부에서 또 100을 곱해 "+1875.1%"가 노출된 사고(/biz/labor-cost)의 회귀 방지 가드다.
  it("앱 전체에서 formatPercent 인자에 ×100을 다시 곱하지 않는다", () => {
    const offenders: string[] = [];

    for (const [path, source] of Object.entries(sources)) {
      if (path.endsWith(".test.ts")) continue;
      for (const match of source.matchAll(DOUBLE_MULTIPLY)) {
        offenders.push(`${path}:${lineOf(source, match.index)} → ${match[0].trim()}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("가드 정규식이 실제 이중 곱 패턴을 탐지한다", () => {
    const broken = `{{ formatPercent(result.overheadRate * 100, 1) }}`;
    expect([...broken.matchAll(DOUBLE_MULTIPLY)]).toHaveLength(1);

    const fixed = `{{ formatPercent(result.overheadRate, 1) }}`;
    expect([...fixed.matchAll(DOUBLE_MULTIPLY)]).toHaveLength(0);
  });
});
