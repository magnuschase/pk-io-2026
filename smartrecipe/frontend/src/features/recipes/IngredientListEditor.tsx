import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IngredientCombobox } from '@/components/domain/IngredientCombobox'
import { UnitCombobox } from '@/components/domain/UnitCombobox'
import { DEFAULT_UNIT } from '@/lib/unit-options'
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
    <div className="flex flex-col gap-4">
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
        label="Dodaj składnik do przepisu"
      />
      <ul className="flex flex-col gap-2">
        {lines.map((line, i) => (
          <li key={line.ingredientId} className="flex flex-wrap items-end gap-2 rounded border border-[var(--color-rule)] p-3">
            <span className="min-w-[8rem] flex-1 text-sm font-medium">
              {line.ingredient?.name ?? line.ingredientId}
            </span>
            <Input
              type="number"
              step="any"
              className="w-24"
              value={line.quantity}
              onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
            />
            <UnitCombobox
              className="w-[11rem]"
              value={line.unit}
              onValueChange={(unit) => updateLine(i, { unit })}
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(i)}>
              Usuń
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
