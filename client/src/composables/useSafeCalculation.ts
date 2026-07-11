import { computed } from 'vue'
import type { CalculationState } from '@/utils/calculationState'

export function useSafeCalculation<T>(
  calculate: () => CalculationState<T>,
  fallback: CalculationState<T>,
) {
  if (!fallback.success) {
    throw new Error('Calculator fallback must be valid')
  }

  let lastValidResult = fallback.data
  const calculation = computed(calculate)
  const result = computed(() => {
    if (calculation.value.success) {
      lastValidResult = calculation.value.data
    }
    return lastValidResult
  })
  const validationError = computed(() =>
    calculation.value.success ? null : calculation.value.message,
  )
  const validationErrorCode = computed(() =>
    calculation.value.success ? null : calculation.value.errorCode,
  )

  return { result, validationError, validationErrorCode }
}
