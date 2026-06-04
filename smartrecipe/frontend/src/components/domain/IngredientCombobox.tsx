import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { createIngredient, searchIngredients } from '@/api/ingredients'
import { useDebounce } from '@/hooks/useDebounce'
import { queryKeys } from '@/lib/query-keys'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Ingredient } from '@/types/domain'

interface IngredientComboboxProps {
  onSelect: (ingredient: Ingredient) => void
  label?: string
}

export function IngredientCombobox({ onSelect, label = 'Szukaj składnika' }: IngredientComboboxProps) {
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 300)

  const { data = [], isFetching } = useQuery({
    queryKey: queryKeys.ingredients(debounced),
    queryFn: () => searchIngredients(debounced),
    staleTime: 300_000,
    enabled: debounced.length >= 1,
  })

  async function handleCreate() {
    const name = search.trim()
    if (!name) return
    const created = await createIngredient(name)
    onSelect(created)
    setSearch('')
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{label}</label>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="np. mąka pszenna"
        aria-autocomplete="list"
      />
      {isFetching ? <p className="text-xs text-[var(--color-muted)]">Szukam…</p> : null}
      <ul className="max-h-40 overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--color-rule)]">
        {data.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-paper-2)]"
              onClick={() => {
                onSelect(item)
                setSearch('')
              }}
            >
              {item.name}
            </button>
          </li>
        ))}
      </ul>
      {debounced.length >= 2 && !data.some((i) => i.name.toLowerCase() === debounced.toLowerCase()) ? (
        <Button type="button" variant="outline" size="sm" onClick={() => void handleCreate()}>
          Utwórz „{search.trim()}”
        </Button>
      ) : null}
    </div>
  )
}
