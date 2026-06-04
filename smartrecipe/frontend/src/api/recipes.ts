import { apiClient } from '@/api/client'
import { normalizeRecipeIngredientLines } from '@/lib/recipe-ingredients'
import type { CuisineType, DietType, Recipe, RecipeIngredientLine } from '@/types/domain'

export interface RecipeFilters {
  diet?: DietType
  cuisine?: CuisineType
  kcalMin?: number
  kcalMax?: number
}

export async function listRecipes(filters?: RecipeFilters): Promise<Recipe[]> {
  const { data } = await apiClient.get<Recipe[]>('/recipes', { params: filters })
  return data
}

export async function getRecipe(id: string): Promise<Recipe> {
  const { data } = await apiClient.get<Recipe>(`/recipes/${id}`)
  return data
}

export async function createRecipe(body: {
  title: string
  instructions?: string
  estimatedKcalPerServing?: number
  dietType?: DietType
  cuisineType?: CuisineType
}): Promise<Recipe> {
  const { data } = await apiClient.post<Recipe>('/recipes', body)
  return data
}

export async function updateRecipe(
  id: string,
  body: Partial<{
    title: string
    instructions: string
    estimatedKcalPerServing: number
    dietType: DietType
    cuisineType: CuisineType
  }>,
): Promise<Recipe> {
  const { data } = await apiClient.patch<Recipe>(`/recipes/${id}`, body)
  return data
}

export async function setRecipeIngredients(
  id: string,
  ingredients: RecipeIngredientLine[],
): Promise<Recipe> {
  const { data } = await apiClient.put<Recipe>(`/recipes/${id}/ingredients`, {
    ingredients: normalizeRecipeIngredientLines(ingredients),
  })
  return data
}

export async function deleteRecipe(id: string): Promise<void> {
  await apiClient.delete(`/recipes/${id}`)
}

type LifecycleAction = 'publish' | 'archive' | 'unarchive' | 'draft'

export async function recipeLifecycle(id: string, action: LifecycleAction): Promise<Recipe> {
  const { data } = await apiClient.post<Recipe>(`/recipes/${id}/${action}`)
  return data
}
