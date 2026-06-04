import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRecipe, setRecipeIngredients } from '@/api/recipes'
import { IngredientListEditor } from '@/features/recipes/IngredientListEditor'
import { RecipeForm, type RecipeFormValues } from '@/features/recipes/RecipeForm'
import type { RecipeIngredientLine } from '@/types/domain'

export function RecipeNewPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [lines, setLines] = useState<RecipeIngredientLine[]>([])

  const mutation = useMutation({
    mutationFn: async (values: RecipeFormValues) => {
      const recipe = await createRecipe({
        title: values.title,
        instructions: values.instructions,
        estimatedKcalPerServing: values.estimatedKcalPerServing || undefined,
        dietType: values.dietType,
        cuisineType: values.cuisineType,
      })
      if (lines.length) {
        await setRecipeIngredients(
          recipe.id,
          lines.map(({ ingredientId, quantity, unit }) => ({ ingredientId, quantity, unit })),
        )
      }
      return recipe
    },
    onSuccess: (recipe) => {
      void qc.invalidateQueries({ queryKey: [{ resource: 'recipes' }] })
      navigate(`/recipes/${recipe.id}`)
    },
  })

  return (
    <div>
      <h1 className="page-heading">Nowy przepis</h1>
      <RecipeForm
        onSubmit={(v) => mutation.mutate(v)}
        isPending={mutation.isPending}
        submitLabel="Utwórz szkic"
      />
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold">Składniki</h2>
        <IngredientListEditor lines={lines} onChange={setLines} />
      </section>
    </div>
  )
}
