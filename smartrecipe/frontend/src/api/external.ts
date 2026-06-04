import { apiClient } from '@/api/client'
import type { ExternalRecipeHit, Recipe } from '@/types/domain'

export async function searchExternalRecipes(q: string): Promise<ExternalRecipeHit[]> {
  const { data } = await apiClient.get<ExternalRecipeHit[]>('/external/recipes/search', {
    params: { q },
  })
  return data
}

export async function importExternalRecipe(externalId: string | number): Promise<Recipe> {
  const { data } = await apiClient.post<Recipe>('/external/recipes/import', { externalId })
  return data
}
