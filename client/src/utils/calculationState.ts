import type { ZodError } from 'zod'

export interface CalculationSuccess<T> {
  success: true
  data: T
}

export interface CalculationFailure {
  success: false
  errorCode: string
  message: string
}

export type CalculationState<T> = CalculationSuccess<T> | CalculationFailure

export function calculationSuccess<T>(data: T): CalculationSuccess<T> {
  return { success: true, data }
}

export function calculationFailure(error: ZodError): CalculationFailure {
  const issue = error.issues[0]
  const field = String(issue?.path[0] ?? 'input').replace(/[^a-zA-Z0-9_]/g, '')
  return {
    success: false,
    errorCode: `invalid_${field || 'input'}`,
    message: '입력 범위를 확인해 주세요. 마지막 정상 결과를 유지하고 있습니다.',
  }
}
