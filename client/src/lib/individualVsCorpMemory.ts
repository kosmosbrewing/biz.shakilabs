import { z } from "zod";

// 입력 기억 저장본의 형태. 저장소·TTL(8시간)·키는 패키지 ShMemoryControl이 소유하고,
// 앱은 "무엇을 저장/복원할지"만 정한다 — 이 계산기는 입력을 URL에 싣지 않으므로
// 경로가 아니라 입력 세 값 자체를 담는다.
// sessionStorage는 같은 출처의 스크립트·확장 프로그램이 고칠 수 있어 신뢰 경계 밖이다.
// 그래서 복원 값도 사용자 입력과 똑같이 범위를 검증한다(옛 초안 스키마와 같은 범위).
const individualVsCorpMemorySchema = z.object({
  revenue: z.number().finite().min(0).max(100_000_000_000),
  expenseRate: z.number().finite().min(0.1).max(0.8),
  corpSalary: z.number().finite().min(0).max(10_000_000_000),
  // 경과 구간(age_bucket) 계산용 — 값이 아니라 구간만 분석으로 나간다
  savedAt: z.number().int().nonnegative(),
});

export type IndividualVsCorpMemory = z.infer<typeof individualVsCorpMemorySchema>;

export function parseIndividualVsCorpMemory(payload: unknown): IndividualVsCorpMemory | null {
  const parsed = individualVsCorpMemorySchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}
