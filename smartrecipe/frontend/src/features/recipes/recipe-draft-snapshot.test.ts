import { describe, expect, it } from 'vitest'
import {
  recipeDraftSnapshot,
  recipeDraftSnapshotFromRecipe,
} from '@/features/recipes/recipe-draft-snapshot'
import { RecipeLifecycleStatus } from '@/types/domain'

describe('recipeDraftSnapshot', () => {
  it('detects changes in instructions and ingredients', () => {
    const base = recipeDraftSnapshotFromRecipe({
      id: 'r1',
      title: 'Zupa',
      lifecycleStatus: RecipeLifecycleStatus.DRAFT,
      instructions: 'Krok 1',
      ingredients: [
        {
          ingredientId: 'ing-1',
          quantity: 1,
          unit: 'szt',
        },
      ],
    })

    const changed = recipeDraftSnapshot(
      {
        title: 'Zupa',
        instructions: 'Krok 1 i 2',
      },
      [
        {
          ingredientId: 'ing-1',
          quantity: 1,
          unit: 'szt',
        },
      ],
    )

    expect(changed).not.toBe(base)
  })
})
