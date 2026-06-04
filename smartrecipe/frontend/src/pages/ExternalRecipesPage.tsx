import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { searchExternalRecipes } from '@/api/external'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalRecipeCard } from '@/features/external/ExternalRecipeCard'
import { ExternalUnavailableBanner } from '@/features/external/ExternalUnavailableBanner'
import { useDebounce } from '@/hooks/useDebounce'
import { queryKeys } from '@/lib/query-keys'

export function ExternalRecipesPage() {
  const [q, setQ] = useState('')
  const debounced = useDebounce(q, 400)

  const { data = [], isFetching, isError } = useQuery({
    queryKey: queryKeys.externalRecipes(debounced),
    queryFn: () => searchExternalRecipes(debounced),
    enabled: debounced.length > 2,
    retry: 0,
    staleTime: 300_000,
  })

  return (
    <div>
      <h1 className="page-heading">Przepisy zewnętrzne</h1>
      <Input
        className="mb-6 max-w-md"
        placeholder="Szukaj (min. 3 znaki)…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Szukaj przepisów zewnętrznych"
      />
      {isError ? <ExternalUnavailableBanner /> : null}
      {isFetching && debounced.length > 2 ? (
        <div className="recipe-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : null}
      {!isError && debounced.length > 2 && !isFetching ? (
        <div className="recipe-grid">
          {data.map((hit) => (
            <ExternalRecipeCard key={String(hit.id)} hit={hit} />
          ))}
        </div>
      ) : null}
      {!isError && debounced.length > 2 && data.length === 0 && !isFetching ? (
        <p className="text-sm text-[var(--color-muted)]">Brak wyników.</p>
      ) : null}
    </div>
  )
}
