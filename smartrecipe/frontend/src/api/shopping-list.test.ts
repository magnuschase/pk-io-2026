import { describe, expect, it, vi } from 'vitest'
import {
  fillShoppingList,
  getShoppingList,
  syncPurchasedToPantry,
} from '@/api/shopping-list'
import { apiClient } from '@/api/client'

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('shopping list API (ShoppingListService / UC04)', () => {
  it('loads active shopping list', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { id: 'sl-1', items: [] },
    })
    const list = await getShoppingList()
    expect(apiClient.get).toHaveBeenCalledWith('/shopping-list')
    expect(list.id).toBe('sl-1')
  })

  it('fillMissingFromRecipes posts recipe ids', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { id: 'sl-1', items: [{ id: 'item-1' }] },
    })
    await fillShoppingList(['r1', 'r2'])
    expect(apiClient.post).toHaveBeenCalledWith('/shopping-list/fill', {
      recipeIds: ['r1', 'r2'],
    })
  })

  it('syncPurchasedToPantry moves bought items to pantry', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { id: 'sl-1', items: [] },
    })
    await syncPurchasedToPantry()
    expect(apiClient.post).toHaveBeenCalledWith('/shopping-list/sync-pantry')
  })
})
