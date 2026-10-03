// BRIEF-V8B(2026-10-03): 렌더 시 문단 분할 — 250자를 넘는 본문을 문장 경계에서만 나눈다.
// 원문 문자열·숫자는 손대지 않으므로 문장 삭제·수치 변경이 구조적으로 불가능하다.
export function splitSentences(text: string): string[] {
  // 마침표·물음표·느낌표 뒤에 공백이 오는 지점만 경계 — "3.5%"처럼 숫자 안의 점은 뒤에 공백이 없다.
  return text.split(/(?<=[.!?])\s+(?=\S)/).filter((s) => s.length > 0);
}

export function packSentences(sentences: string[], maxChars = 200): string[] {
  const paragraphs: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length > maxChars && current) {
      paragraphs.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }
  if (current) paragraphs.push(current);
  return paragraphs;
}

/** 250자 이하면 그대로 1개, 넘으면 ≤200자 문단 여러 개(문장 경계 유지). */
export function chunkParagraph(text: string, limit = 250, maxChars = 200): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= limit) return [trimmed];
  return packSentences(splitSentences(trimmed), maxChars);
}
