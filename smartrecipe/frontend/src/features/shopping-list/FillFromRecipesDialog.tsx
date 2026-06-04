import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { listRecipes } from '@/api/recipes'
import { fillShoppingList } from '@/api/shopping-list'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { queryKeys } from '@/lib/query-keys'
import { RecipeLifecycleStatus } from '@/types/domain'

interface FillFromRecipesDialogProps {
  trigger: React.ReactNode
  preselectedIds?: string[]
}

export function FillFromRecipesDialog({ trigger, preselectedIds = [] }: FillFromRecipesDialogProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(() => new Set(preselectedIds))
  const qc = useQueryClient()

  const { data: recipes = [] } = useQuery({
    queryKey: queryKeys.recipes.list(),
    queryFn: () => listRecipes(),
    enabled: open,
    staleTime: 120_000,
  })

  const active = recipes.filter((r) => r.lifecycleStatus === RecipeLifecycleStatus.ACTIVE)

  const mutation = useMutation({
    mutationFn: () => fillShoppingList([...selected]),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [{ resource: 'shopping-list' }] })
      setOpen(false)
    },
  })

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v) setSelected(new Set(preselectedIds))
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[80dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dodaj braki z przepisów</DialogTitle>
        </DialogHeader>
        <ul className="my-4 flex max-h-60 flex-col gap-2 overflow-y-auto">
          {active.map((r) => (
            <li key={r.id} className="flex items-center gap-2">
              <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} id={`r-${r.id}`} />
              <label htmlFor={`r-${r.id}`} className="text-sm">
                {r.title}
              </label>
            </li>
          ))}
        </ul>
        <Button type="button" disabled={selected.size === 0 || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'Uzupełnianie…' : 'Uzupełnij listę'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
