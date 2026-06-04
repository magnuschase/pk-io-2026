import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deletePantryItem, getPantry, upsertPantryItem } from '@/api/pantry'
import { PantryItemRow } from '@/components/domain/PantryItemRow'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { UpsertPantryItemDialog } from '@/features/pantry/UpsertPantryItemDialog'
import { queryKeys } from '@/lib/query-keys'
import type { PantryItem } from '@/types/domain'

export function PantryList() {
  const qc = useQueryClient()
  const { data = [], isLoading, isError } = useQuery({
    queryKey: queryKeys.pantry(),
    queryFn: getPantry,
    staleTime: 30_000,
  })

  const upsertMutation = useMutation({
    mutationFn: ({
      ingredientId,
      quantity,
      unit,
    }: {
      ingredientId: string
      quantity: number
      unit: string
    }) => upsertPantryItem(ingredientId, { quantity, unit }),
    onMutate: async ({ ingredientId, quantity, unit }) => {
      await qc.cancelQueries({ queryKey: queryKeys.pantry() })
      const prev = qc.getQueryData<PantryItem[]>(queryKeys.pantry())
      qc.setQueryData<PantryItem[]>(queryKeys.pantry(), (old = []) => {
        const idx = old.findIndex((i) => i.ingredientId === ingredientId)
        const next = { id: `opt-${ingredientId}`, ingredientId, quantity, unit } as PantryItem
        if (idx >= 0) {
          const copy = [...old]
          copy[idx] = { ...copy[idx], quantity, unit }
          return copy
        }
        return [...old, next]
      })
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.pantry(), ctx.prev)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: [{ resource: 'pantry' }] })
      void qc.invalidateQueries({ queryKey: [{ resource: 'suggestions' }] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (ingredientId: string) => deletePantryItem(ingredientId),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: [{ resource: 'pantry' }] })
      void qc.invalidateQueries({ queryKey: [{ resource: 'suggestions' }] })
    },
  })

  function confirmDelete(item: PantryItem) {
    const name = item.ingredient?.name ?? 'ten składnik'
    if (window.confirm(`Usunąć ${name} ze spiżarni?`)) {
      deleteMutation.mutate(item.ingredientId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (isError) return <p className="text-[var(--color-destructive)]">Nie udało się wczytać spiżarni.</p>

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <UpsertPantryItemDialog
          trigger={<Button>Dodaj składnik</Button>}
          onSubmit={(ingredientId, v) => upsertMutation.mutate({ ingredientId, ...v })}
        />
      </div>
      {data.length === 0 ? (
        <p className="text-[var(--color-muted)]">Spiżarnia jest pusta. Dodaj pierwszy składnik.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-ink)] text-xs uppercase tracking-wide text-[var(--color-muted)]">
              <th className="pb-2 pr-4">Składnik</th>
              <th className="pb-2 pr-4">Ilość</th>
              <th className="pb-2 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <PantryItemRow
                key={item.id}
                item={item}
                editTrigger={
                  <UpsertPantryItemDialog
                    item={item}
                    trigger={
                      <Button type="button" variant="outline" size="sm">
                        Edytuj
                      </Button>
                    }
                    onSubmit={(ingredientId, v) => upsertMutation.mutate({ ingredientId, ...v })}
                  />
                }
                onDelete={confirmDelete}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
