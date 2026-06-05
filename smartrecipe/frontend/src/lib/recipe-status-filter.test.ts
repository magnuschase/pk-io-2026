import { describe, expect, it } from 'vitest'
import {
  DEFAULT_RECIPE_STATUS_FILTER,
  matchesRecipeStatusFilter,
} from '@/lib/recipe-status-filter'
import { RecipeLifecycleStatus, type Recipe } from '@/types/domain'

const recipe = (status: RecipeLifecycleStatus): Recipe => ({
  id: 'r1',
  title: 'Test',
  lifecycleStatus: status,
})

describe('matchesRecipeStatusFilter', () => {
  it('hides archived recipes in default filter', () => {
    expect(matchesRecipeStatusFilter(recipe(RecipeLifecycleStatus.ACTIVE), 'default')).toBe(
      true,
    )
    expect(
      matchesRecipeStatusFilter(recipe(RecipeLifecycleStatus.ARCHIVED), 'default'),
    ).toBe(false)
  })

  it('shows only archived when archive filter selected', () => {
    expect(
      matchesRecipeStatusFilter(recipe(RecipeLifecycleStatus.ARCHIVED), RecipeLifecycleStatus.ARCHIVED),
    ).toBe(true)
    expect(
      matchesRecipeStatusFilter(recipe(RecipeLifecycleStatus.ACTIVE), RecipeLifecycleStatus.ARCHIVED),
    ).toBe(false)
  })

  it('uses default when filter omitted', () => {
    expect(
      matchesRecipeStatusFilter(recipe(RecipeLifecycleStatus.ARCHIVED), DEFAULT_RECIPE_STATUS_FILTER),
    ).toBe(false)
  })
})
