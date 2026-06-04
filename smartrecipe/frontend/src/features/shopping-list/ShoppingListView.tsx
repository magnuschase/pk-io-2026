import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteShoppingItem, getShoppingList, patchShoppingItem } from '@/api/shopping-list'
import { ShoppingItemRow } from '@/components/domain/ShoppingItemRow'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AddItemDialog } from '@/features/shopping-list/AddItemDialog'
import { FillFromRecipesDialog } from '@/features/shopping-list/FillFromRecipesDialog'
import { queryKeys } from '@/lib/query-keys'
import type { ShoppingList, ShoppingListItem } from '@/types/domain'

export function ShoppingListView() {
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.shoppingList(),
    queryFn: getShoppingList,
    staleTime: 20_000,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, purchased }: { id: string; purchased: boolean }) =>
      patchShoppingItem(id, { purchased }),
    onMutate: async ({ id, purchased }) => {
      await qc.cancelQueries({ queryKey: queryKeys.shoppingList() })
      const prev = qc.getQueryData<ShoppingList>(queryKeys.shoppingList())
      qc.setQueryData<ShoppingList>(queryKeys.shoppingList(), (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((i) => (i.id === id ? { ...i, purchased } : i)),
        }
      })
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.shoppingList(), ctx.prev)
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: [{ resource: 'shopping-list' }] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteShoppingItem(id),
    onSettled: () => void qc.invalidateQueries({ queryKey: [{ resource: 'shopping-list' }] }),
  })

  if (isLoading) return <Skeleton className="h-48 w-full" />
  if (isError) return <p className="text-[var(--color-destructive)]">Nie udało się wczytać listy.</p>

  const items = data?.items ?? []

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        <FillFromRecipesDialog trigger={<Button variant="outline">Uzupełnij z przepisów</Button>} />
        <AddItemDialog trigger={<Button>Dodaj ręcznie</Button>} />
      </div>
      {items.length === 0 ? (
        <p className="text-[var(--color-muted)]">Lista zakupów jest pusta.</p>
      ) : (
        <ul>
          {items.map((item: ShoppingListItem) => (
            <ShoppingItemRow
              key={item.id}
              item={item}
              onToggle={(row, purchased) => toggleMutation.mutate({ id: row.id, purchased })}
              onDelete={(row) => deleteMutation.mutate(row.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
