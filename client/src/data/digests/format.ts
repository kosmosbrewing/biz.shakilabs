// 파생 다이제스트 공용 포매터 (seller digests/format.ts와 같은 규약).
//
// 다이제스트 산문의 숫자는 전부 엔진 실행값이라, 문장 안에서 숫자를 손으로 적는 일이 없어야 한다.
// 여기 함수만 거치게 하면 "화면은 3,562,521원인데 산문은 356만원" 같은 드리프트가 생길 수 없다.
// digests.test.ts가 산문의 숫자 토큰을 FACTS·INPUTS의 포맷 결과와 대조하므로, 새 포맷을
// 추가하면 테스트의 allowedTokens에도 같은 포맷을 등록해야 한다.

export interface Finding {
  h2: string;
  body: string;
}

/** 다이제스트 모듈의 공개 계약 — 산문 + 산문이 인용한 엔진 실행값 + 명시된 입력값 */
export interface Digest {
  findings: Finding[];
  /** 엔진이 돌려준 값. 테스트가 같은 엔진으로 재계산해 대조한다. */
  facts: Record<string, number>;
  /** 계산기 기본값·프리셋·데이터 상수 등 "넣은" 값. 산문의 숫자는 facts 아니면 여기서만 온다. */
  inputs: Record<string, number>;
}

export function won(value: number): string {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

/** 0.04953 → "4.95%" */
export function pct(rate: number, digits = 2): string {
  return `${Number((rate * 100).toFixed(digits)).toString()}%`;
}

/** 비율 차이는 %가 아니라 %p — "24%와 15%의 차이 9%"로 읽히면 오독이다. */
export function pp(diff: number, digits = 2): string {
  return `${Number((diff * 100).toFixed(digits)).toString()}%p`;
}

/**
 * 1,020,000 → "102만원", 6,153,846 → "615.4만원"(digits=1), 300,000,000 → "3억원",
 * 124,000,000 → "1억 2,400만원". 억 단위는 만원 정수로 반올림한다.
 */
export function manwon(value: number, digits = 0): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const man = abs / 10_000;
  if (man < 10_000) {
    const fixed = Number(man.toFixed(digits));
    return `${sign}${fixed.toLocaleString("ko-KR", { maximumFractionDigits: digits })}만원`;
  }
  const rounded = Math.round(man);
  const eok = Math.floor(rounded / 10_000);
  const rest = rounded % 10_000;
  // 1조 이상은 조 단위로 — "10000억원"은 읽는 단위가 아니다
  if (eok >= 10_000 && rest === 0 && eok % 10_000 === 0) return `${sign}${(eok / 10_000).toLocaleString("ko-KR")}조원`;
  const eokText = eok.toLocaleString("ko-KR");
  return rest === 0 ? `${sign}${eokText}억원` : `${sign}${eokText}억 ${rest.toLocaleString("ko-KR")}만원`;
}

/** 단위 없는 수 — 건수·인원·배수 등 */
export function num(value: number, digits = 0): string {
  return Number(value.toFixed(digits)).toLocaleString("ko-KR", { maximumFractionDigits: digits });
}

/** 배수 — num()과 같은 자릿수 규칙을 써서 테스트의 토큰 대조와 어긋나지 않게 한다 */
export function times(a: number, b: number, digits = 1): string {
  return `${num(a / b, digits)}배`;
}

/**
 * 이름이 데이터에서 오므로 조사를 고정하면 "음식점업는"이 된다.
 * 마지막 글자의 종성 유무로 은/는을 고른다(한글 아닌 끝자리는 "는").
 */
export function eun(word: string): string {
  const last = word.charCodeAt(word.length - 1);
  const isHangul = last >= 0xac00 && last <= 0xd7a3;
  const particle = isHangul && (last - 0xac00) % 28 !== 0 ? "은" : "는";
  return `${word}${particle}`;
}

/** 한국어 나열 — "A·B·C" */
export function list(items: string[]): string {
  return items.join("·");
}
