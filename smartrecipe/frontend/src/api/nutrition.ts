import { apiClient } from '@/api/client'
import type { Ingredient } from '@/types/domain'

export interface NutritionSearchHit {
  fdcId: number
  description: string
  kcalPer100g: number | null
  dataType?: string | null
}

export interface NutritionSearchResult {
  proposed: NutritionSearchHit | null
  hits: NutritionSearchHit[]
}

export async function searchNutritionFoods(
  q: string,
  limit = 8,
): Promise<NutritionSearchResult> {
  const { data } = await apiClient.get<NutritionSearchResult>('/nutrition/search', {
    params: { q, limit },
  })
  return data
}

export async function enrichIngredientAuto(ingredientId: string): Promise<Ingredient> {
  const { data } = await apiClient.post<Ingredient>(`/nutrition/enrich/${ingredientId}`)
  return data
}

export async function enrichIngredientByFdc(
  ingredientId: string,
  fdcId: number,
): Promise<Ingredient> {
  const { data } = await apiClient.post<Ingredient>(
    `/nutrition/enrich/${ingredientId}/fdc/${fdcId}`,
  )
  return data
}

export async function setIngredientManualKcal(
  ingredientId: string,
  kcalPer100g: number,
): Promise<Ingredient> {
  const { data } = await apiClient.post<Ingredient>(
    `/nutrition/enrich/${ingredientId}/manual`,
    { kcalPer100g },
  )
  return data
}
