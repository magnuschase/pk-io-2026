import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { IngredientListEditor } from '@/features/recipes/IngredientListEditor'
import type { Ingredient, RecipeIngredientLine } from '@/types/domain'
import { renderWithProviders } from '@/test/test-utils'

vi.mock('@/components/domain/IngredientCombobox', () => ({
  IngredientCombobox: () => <div data-testid="ingredient-combobox" />,
}))

vi.mock('@/components/domain/UnitCombobox', () => ({
  UnitCombobox: () => <div data-testid="unit-combobox" />,
}))

vi.mock('@/features/nutrition/IngredientNutritionBadge', () => ({
  IngredientNutritionBadge: () => <span>kcal badge</span>,
}))

const flour: Ingredient = {
  id: 'ing-1',
  name: 'mąka pszenna',
  kcalPer100g: 361,
  externalFoodId: null,
}

function Harness({ initialLines }: { initialLines: RecipeIngredientLine[] }) {
  const [lines, setLines] = useState(initialLines)
  return <IngredientListEditor lines={lines} onChange={setLines} />
}

describe('IngredientListEditor quantity input', () => {
  it('allows clearing the default quantity while editing', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <Harness
        initialLines={[
          {
            ingredientId: flour.id,
            quantity: 1,
            unit: 'g',
            ingredient: flour,
          },
        ]}
      />,
    )

    const qtyInput = screen.getByRole('spinbutton', { name: /Ilość: mąka pszenna/i })
    expect(qtyInput).toHaveValue(1)

    await user.clear(qtyInput)
    expect(qtyInput).toHaveValue(null)
  })

  it('restores default quantity on blur when left empty', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <Harness
        initialLines={[
          {
            ingredientId: flour.id,
            quantity: 1,
            unit: 'g',
            ingredient: flour,
          },
        ]}
      />,
    )

    const qtyInput = screen.getByRole('spinbutton', { name: /Ilość: mąka pszenna/i })
    await user.clear(qtyInput)
    await user.tab()

    expect(qtyInput).toHaveValue(1)
  })
})
