// 파생 다이제스트 레지스트리 — 라우트 ↔ 다이제스트 ↔ 뷰 파일.
// digests.test.ts가 이 표를 돌며 밀도·복제·수치 게이트를 걸고, 뷰가 실제로 배선했는지 소스를 읽어 확인한다.
import type { GuideData, GuideSection } from "../seoGuides";
import type { Digest } from "./format";
import { IVC_DIGEST } from "./ivcDigest";
import { CORP_TAX_DIGEST } from "./corpTaxDigest";
import { VAT_DIGEST } from "./vatDigest";
import { LABOR_DIGEST } from "./laborDigest";
import { BREAK_EVEN_DIGEST } from "./breakEvenDigest";
import { DELIVERY_DIGEST } from "./deliveryDigest";
import { CAR_DIGEST } from "./carDigest";
import { MEETING_DIGEST } from "./meetingDigest";
import { EXPENSE_RATE_DIGEST } from "./expenseRateDigest";
import { HOME_DIGEST } from "./homeDigest";

export interface DigestEntry {
  route: string;
  /** src/views 아래 파일명 — 테스트가 배선을 소스에서 확인한다 */
  view: string;
  /** 이 디렉터리의 모듈 파일명과 export 이름 — 테스트가 숫자 리터럴·import를 대조한다 */
  file: string;
  exportName: string;
  digest: Digest;
}

export const DIGEST_ENTRIES: DigestEntry[] = [
  { route: "/", view: "HomeView.vue", file: "homeDigest.ts", exportName: "HOME_DIGEST", digest: HOME_DIGEST },
  { route: "/individual-vs-corp", view: "IndividualVsCorpView.vue", file: "ivcDigest.ts", exportName: "IVC_DIGEST", digest: IVC_DIGEST },
  { route: "/corp-tax", view: "CorpTaxView.vue", file: "corpTaxDigest.ts", exportName: "CORP_TAX_DIGEST", digest: CORP_TAX_DIGEST },
  { route: "/vat-compare", view: "VatCompareView.vue", file: "vatDigest.ts", exportName: "VAT_DIGEST", digest: VAT_DIGEST },
  { route: "/labor-cost", view: "LaborCostView.vue", file: "laborDigest.ts", exportName: "LABOR_DIGEST", digest: LABOR_DIGEST },
  { route: "/break-even", view: "BreakEvenView.vue", file: "breakEvenDigest.ts", exportName: "BREAK_EVEN_DIGEST", digest: BREAK_EVEN_DIGEST },
  { route: "/delivery-fee", view: "DeliveryFeeView.vue", file: "deliveryDigest.ts", exportName: "DELIVERY_DIGEST", digest: DELIVERY_DIGEST },
  { route: "/car-expense", view: "CarExpenseView.vue", file: "carDigest.ts", exportName: "CAR_DIGEST", digest: CAR_DIGEST },
  { route: "/meeting-cost", view: "MeetingCostView.vue", file: "meetingDigest.ts", exportName: "MEETING_DIGEST", digest: MEETING_DIGEST },
  { route: "/standard-expense-rate", view: "StandardExpenseRateView.vue", file: "expenseRateDigest.ts", exportName: "EXPENSE_RATE_DIGEST", digest: EXPENSE_RATE_DIGEST },
];

/**
 * 가이드 섹션 앞에 다이제스트를 붙인다 — 페이지 고유 내용이 먼저, 어디에나 있는 설명은 뒤에.
 * 다섯 뷰가 BIZ_HOME_GUIDE 하나를 공유하므로 가이드 객체를 고치지 않고 뷰에서 합성한다.
 */
export function withDigest(guide: GuideData, digest: Digest): GuideSection[] {
  return [...digest.findings, ...(guide.sections ?? [])];
}
