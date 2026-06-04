import type { ComboboxOption } from '@/components/ui/combobox'

/** Jednostki zgodne z UnitNormalizationService (backend). */
export const UNIT_OPTIONS: ComboboxOption[] = [
  { value: 'g', label: 'g — gram' },
  { value: 'kg', label: 'kg — kilogram' },
  { value: 'ml', label: 'ml — mililitr' },
  { value: 'l', label: 'l — litr' },
  { value: 'szt', label: 'szt — sztuka' },
  { value: 'łyżka', label: 'łyżka' },
  { value: 'łyżeczka', label: 'łyżeczka' },
  { value: 'garść', label: 'garść' },
  { value: 'cup', label: 'szklanka (240 ml)' },
  { value: 'tbsp', label: 'tbsp — łyżka stołowa' },
  { value: 'tsp', label: 'tsp — łyżeczka' },
]

export const DEFAULT_UNIT = 'g'

export function isKnownUnit(unit: string): boolean {
  return UNIT_OPTIONS.some((o) => o.value === unit)
}
