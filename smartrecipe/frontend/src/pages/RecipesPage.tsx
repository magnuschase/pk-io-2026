import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { listRecipes } from '@/api/recipes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RecipeFilters, type RecipeFilterValues } from '@/features/recipes/RecipeFilters'
import { queryKeys } from '@/lib/query-keys'
import { displayEnum } from '@/lib/utils'

export function RecipesPage() {
  const [filters, setFilters] = useState<RecipeFilterValues>({})

  const { data = [], isLoading, isError } = useQuery({
    queryKey: queryKeys.recipes.list(filters),
    queryFn: () => listRecipes(filters),
    staleTime: 120_000,
  })

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="page-heading mb-0">Moje przepisy</h1>
        <Button asChild>
          <Link to="/recipes/new">Nowy przepis</Link>
        </Button>
      </div>
      <RecipeFilters values={filters} onChange={setFilters} />
      {isLoading ? (
        <div className="recipe-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : null}
      {isError ? <p className="text-[var(--color-destructive)]">Błąd wczytywania przepisów.</p> : null}
      <div className="recipe-grid">
        {data.map((r) => (
          <article key={r.id} className="recipe-card">
            <h3 className="recipe-card__title">
              <Link to={`/recipes/${r.id}`}>{r.title}</Link>
            </h3>
            <Badge>{displayEnum(r.lifecycleStatus)}</Badge>
            {r.estimatedKcalPerServing ? (
              <span className="text-sm text-[var(--color-muted)]">{r.estimatedKcalPerServing} kcal</span>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  )
}
