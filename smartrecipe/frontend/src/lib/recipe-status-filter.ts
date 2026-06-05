import { RecipeLifecycleStatus, type Recipe } from '@/types/domain'

export type RecipeStatusFilter = 'default' | 'all' | RecipeLifecycleStatus

export const DEFAULT_RECIPE_STATUS_FILTER: RecipeStatusFilter = 'default'

export function recipeStatusFilterOptions(): { value: string; label: string }[] {
  return [
    { value: 'default', label: 'Bez archiwum' },
    { value: RecipeLifecycleStatus.DRAFT, label: 'Szkice' },
    { value: RecipeLifecycleStatus.ACTIVE, label: 'Aktywne' },
    { value: RecipeLifecycleStatus.ARCHIVED, label: 'Archiwum' },
    { value: 'all', label: 'Wszystkie statusy' },
  ]
}

export function recipeStatusFilterLabel(filter: RecipeStatusFilter): string {
  return (
    recipeStatusFilterOptions().find((option) => option.value === filter)?.label ??
    'Bez archiwum'
  )
}

export function matchesRecipeStatusFilter(
  recipe: Recipe,
  filter: RecipeStatusFilter = DEFAULT_RECIPE_STATUS_FILTER,
): boolean {
  if (filter === 'all') return true
  if (filter === 'default') {
    return recipe.lifecycleStatus !== RecipeLifecycleStatus.ARCHIVED
  }
  return recipe.lifecycleStatus === filter
}
