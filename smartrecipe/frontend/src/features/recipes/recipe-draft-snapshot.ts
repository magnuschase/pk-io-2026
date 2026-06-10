import type { RecipeFormValues } from '@/features/recipes/RecipeForm'
import type { Recipe, RecipeIngredientLine } from '@/types/domain'

export function recipeDraftSnapshot(
  values: RecipeFormValues,
  lines: RecipeIngredientLine[],
): string {
  return JSON.stringify({
    title: values.title?.trim() ?? '',
    instructions: values.instructions ?? '',
    estimatedKcalPerServing: values.estimatedKcalPerServing ?? null,
    servings: values.servings ?? null,
    dietType: values.dietType ?? null,
    cuisineType: values.cuisineType ?? null,
    lines: lines.map((line) => ({
      ingredientId: line.ingredientId,
      quantity: Number(line.quantity),
      unit: line.unit,
    })),
  })
}

export function recipeDraftSnapshotFromRecipe(recipe: Recipe): string {
  const lines = recipe.ingredients ?? []
  return recipeDraftSnapshot(
    {
      title: recipe.title,
      instructions: recipe.instructions ?? '',
      estimatedKcalPerServing: recipe.estimatedKcalPerServing ?? undefined,
      servings: recipe.servings ?? undefined,
      dietType: recipe.dietType ?? undefined,
      cuisineType: recipe.cuisineType ?? undefined,
    },
    lines,
  )
}
