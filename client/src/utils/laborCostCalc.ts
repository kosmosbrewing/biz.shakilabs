import { z } from "zod";
import { SOCIAL_INSURANCE } from "@/data/bizConstants";
import { INDUSTRY_ACCIDENT_RATES } from "@/data/laborCost";

const schema = z.object({
  monthlySalary: z.number().min(100_000).max(100_000_000),
  employeeCount: z.number().int().min(1).max(10_000),
  industryKey: z.string(),
  includeRetirement: z.boolean(),
});

export interface LaborCostBreakdown {
  nationalPension: number;
  healthInsurance: number;
  longTermCare: number;
  employmentInsurance: number;
  industrialAccident: number;
  totalInsurance: number;
}

export interface LaborCostResult {
  monthlySalary: number;
  employeeCount: number;
  /** 사업주 부담 4대보험 (1인 기준) */
  employer: LaborCostBreakdown;
  /** 근로자 부담 4대보험 (1인 기준) */
  employee: LaborCostBreakdown;
  /** 퇴직급여 적립분 (1인, 월) */
  retirementReserve: number;
  /** 사업주 실제 인건비 (1인, 월) = 급여 + 사업주4대보험 + 퇴직금 */
  totalCostPerEmployee: number;
  /** 근로자 실수령 (4대보험 공제 후, 소득세 제외) */
  employeeNetPay: number;
  /** 전체 직원 월 인건비 합계 */
  totalMonthlyCost: number;
  /** 전체 직원 연 인건비 합계 */
  totalAnnualCost: number;
  /** 급여 대비 사업주 추가부담 비율 */
  overheadRate: number;
}

function round(v: number): number {
  return Math.round(v);
}

function calcInsurance(
  salary: number,
  accidentRate: number,
  side: "employer" | "employee",
): LaborCostBreakdown {
  const si = SOCIAL_INSURANCE;

  // 국민연금: 상한액 적용
  const pensionBase = Math.min(salary, si.nationalPension.upperLimit);
  const nationalPension = round(pensionBase * si.nationalPension[side === "employer" ? "employer" : "employee"]);

  // 건강보험
  const healthInsurance = round(salary * si.healthInsurance[side === "employer" ? "employer" : "employee"]);

  // 장기요양: 건보료 × 장기요양률
  const longTermCare = round(healthInsurance * si.longTermCare.rate);

  // 고용보험
  const employmentInsurance = round(salary * si.employmentInsurance[side === "employer" ? "employer" : "employee"]);

  // 산재보험: 사업주만 부담
  const industrialAccident = side === "employer" ? round(salary * accidentRate) : 0;

  const totalInsurance = nationalPension + healthInsurance + longTermCare + employmentInsurance + industrialAccident;

  return {
    nationalPension,
    healthInsurance,
    longTermCare,
    employmentInsurance,
    industrialAccident,
    totalInsurance,
  };
}

export function calculateLaborCost(input: z.input<typeof schema>): LaborCostResult {
  const parsed = schema.parse(input);
  const { monthlySalary, employeeCount, industryKey, includeRetirement } = parsed;

  const accidentRate = INDUSTRY_ACCIDENT_RATES.find((r) => r.key === industryKey)?.rate
    ?? INDUSTRY_ACCIDENT_RATES.find((r) => r.key === "average")!.rate;

  const employer = calcInsurance(monthlySalary, accidentRate, "employer");
  const employee = calcInsurance(monthlySalary, accidentRate, "employee");

  // 퇴직급여: 월급의 1/12
  const retirementReserve = includeRetirement ? round(monthlySalary / 12) : 0;

  const totalCostPerEmployee = monthlySalary + employer.totalInsurance + retirementReserve;
  const employeeNetPay = monthlySalary - employee.totalInsurance;

  const totalMonthlyCost = totalCostPerEmployee * employeeCount;
  const totalAnnualCost = totalMonthlyCost * 12;

  const overheadRate = monthlySalary > 0
    ? (totalCostPerEmployee - monthlySalary) / monthlySalary
    : 0;

  return {
    monthlySalary,
    employeeCount,
    employer,
    employee,
    retirementReserve,
    totalCostPerEmployee,
    employeeNetPay,
    totalMonthlyCost,
    totalAnnualCost,
    overheadRate,
  };
}
