import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { listRecipes } from '@/api/recipes'
import { RecipeFilters, type RecipeFilterValues } from '@/features/recipes/RecipeFilters'
import { RecipeListCard } from '@/features/recipes/RecipeListCard'
import { RecipesPageHeader } from '@/features/recipes/RecipesPageHeader'
import {
  DEFAULT_RECIPE_STATUS_FILTER,
  matchesRecipeStatusFilter,
} from '@/lib/recipe-status-filter'
import { queryKeys } from '@/lib/query-keys'

export function RecipesPage() {
  const [filters, setFilters] = useState<RecipeFilterValues>({
    statusFilter: DEFAULT_RECIPE_STATUS_FILTER,
  })
  const filterKey = useMemo(() => JSON.stringify(filters), [filters])

  const apiFilters = useMemo(
    () => ({
      diet: filters.diet,
      cuisine: filters.cuisine,
      kcalMin: filters.kcalMin,
      kcalMax: filters.kcalMax,
    }),
    [filters.diet, filters.cuisine, filters.kcalMin, filters.kcalMax],
  )

  const { data = [], isLoading, isError } = useQuery({
    queryKey: queryKeys.recipes.list(apiFilters),
    queryFn: () => listRecipes(apiFilters),
    staleTime: 120_000,
  })

  const visibleRecipes = useMemo(
    () =>
      data.filter((recipe) =>
        matchesRecipeStatusFilter(recipe, filters.statusFilter ?? DEFAULT_RECIPE_STATUS_FILTER),
      ),
    [data, filters.statusFilter],
  )

  const showEmpty = !isLoading && !isError && visibleRecipes.length === 0
  const showFilteredEmpty = showEmpty && data.length > 0

  return (
    <div className="recipes-page">
      <RecipesPageHeader
        recipeCount={visibleRecipes.length}
        actions={
          <Link className="recipes-add-btn" to="/recipes/new">
            Nowy przepis
          </Link>
        }
      />

      <RecipeFilters values={filters} onChange={setFilters} />

      {isError ? (
        <p className="recipes-error" role="alert">
          Błąd wczytywania przepisów.
        </p>
      ) : null}

      {isLoading ? (
        <ul className="recipes-grid" aria-busy="true" aria-label="Ładowanie przepisów">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <div className="recipes-skeleton-card" />
            </li>
          ))}
        </ul>
      ) : null}

      {showEmpty ? (
        <div className="recipes-shelf-empty" role="status">
          <p className="recipes-shelf-empty__title">
            {showFilteredEmpty ? 'Brak przepisów dla wybranych filtrów' : 'Katalog jest pusty'}
          </p>
          <p className="recipes-shelf-empty__hint">
            {showFilteredEmpty
              ? 'Zmień filtr statusu lub wyczyść pozostałe kryteria, aby zobaczyć więcej pozycji.'
              : 'Dodaj pierwszy przepis - potem pojawi się tutaj i w sugestiach po uzupełnieniu spiżarni.'}
          </p>
          {showFilteredEmpty ? null : (
            <Link className="recipes-add-btn" to="/recipes/new">
              Utwórz przepis
            </Link>
          )}
        </div>
      ) : null}

      {!isLoading && !isError && visibleRecipes.length > 0 ? (
        <ul
          key={filterKey}
          className="recipes-grid recipes-grid--fade"
          aria-label="Katalog przepisów"
        >
          {visibleRecipes.map((r) => (
            <li key={r.id}>
              <RecipeListCard recipe={r} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
