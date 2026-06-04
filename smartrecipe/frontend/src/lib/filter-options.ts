import { CuisineType, DietType } from '@/types/domain'
import type { ComboboxOption } from '@/components/ui/combobox'
import { displayEnum } from '@/lib/utils'

const ALL_VALUE = 'all'

export function dietFilterOptions(): ComboboxOption[] {
  return [
    { value: ALL_VALUE, label: 'Wszystkie' },
    ...Object.values(DietType).map((d) => ({ value: d, label: displayEnum(d) })),
  ]
}

export function cuisineFilterOptions(): ComboboxOption[] {
  return [
    { value: ALL_VALUE, label: 'Wszystkie' },
    ...Object.values(CuisineType).map((c) => ({ value: c, label: displayEnum(c) })),
  ]
}

export function parseFilterValue<T extends string>(value: string): T | undefined {
  return value === ALL_VALUE ? undefined : (value as T)
}

export function toFilterValue(value?: string): string {
  return value ?? ALL_VALUE
}
