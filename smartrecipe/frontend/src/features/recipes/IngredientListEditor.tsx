import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { IngredientCombobox } from '@/components/domain/IngredientCombobox'
import { UnitCombobox } from '@/components/domain/UnitCombobox'
import { DEFAULT_UNIT, NO_UNIT } from '@/lib/unit-options'
import type { Ingredient, RecipeIngredientLine } from '@/types/domain'

interface IngredientListEditorProps {
  lines: RecipeIngredientLine[]
  onChange: (lines: RecipeIngredientLine[]) => void
}

export function IngredientListEditor({ lines, onChange }: IngredientListEditorProps) {
  const [picker, setPicker] = useState<Ingredient | null>(null)

  function addLine(ingredient: Ingredient) {
    if (lines.some((l) => l.ingredientId === ingredient.id)) return
    onChange([...lines, { ingredientId: ingredient.id, quantity: 1, unit: DEFAULT_UNIT, ingredient }])
  }

  function updateLine(index: number, patch: Partial<RecipeIngredientLine>) {
    const next = [...lines]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  function removeLine(index: number) {
    onChange(lines.filter((_, i) => i !== index))
  }

  return (
    <div className="recipe-ingredients">
      <IngredientCombobox
        value={picker}
        onChange={(ing) => {
          if (ing) {
            addLine(ing)
            setPicker(null)
          } else {
            setPicker(null)
          }
        }}
        label="Dodaj składnik"
      />

      {lines.length === 0 ? (
        <p className="recipe-ingredients__empty" role="status">
          Jeszcze bez składników — wyszukaj powyżej, aby dodać pierwszy.
        </p>
      ) : (
        <div className="recipe-ingredients__table">
          <div className="recipe-ingredients__cols" aria-hidden="true">
            <span className="recipe-ingredients__col">Składnik</span>
            <span className="recipe-ingredients__col">Ilość</span>
            <span className="recipe-ingredients__col">Jednostka</span>
            <span />
          </div>
          <ul className="recipe-ingredients__list">
            {lines.map((line, i) => (
              <li key={line.ingredientId} className="recipe-ingredient-line">
                <span className="recipe-ingredient-line__name">
                  {line.ingredient?.name ?? line.ingredientId}
                </span>
                {line.unit !== NO_UNIT && (
                  <Input
                    type="number"
                    step="any"
                    className="recipe-ingredient-line__qty recipe-form__input"
                    aria-label={`Ilość: ${line.ingredient?.name ?? line.ingredientId}`}
                    value={line.quantity}
                    onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
                  />
                )}
                <UnitCombobox
                  className="recipe-ingredient-line__unit"
                  value={line.unit}
                  onValueChange={(unit) => updateLine(i, { unit })}
                />
                <button
                  type="button"
                  className="recipe-ingredient-line__remove"
                  aria-label={`Usuń ${line.ingredient?.name ?? line.ingredientId}`}
                  onClick={() => removeLine(i)}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
