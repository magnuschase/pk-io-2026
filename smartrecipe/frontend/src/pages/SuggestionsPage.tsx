import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { getPantry } from '@/api/pantry'
import { getSuggestions } from '@/api/suggestions'
import { FillFromRecipesDialog } from '@/features/shopping-list/FillFromRecipesDialog'
import { SuggestionFilters } from '@/features/suggestions/SuggestionFilters'
import { SuggestionRecipeRow } from '@/features/suggestions/SuggestionRecipeRow'
import { SuggestionsPageHeader } from '@/features/suggestions/SuggestionsPageHeader'
import { SuggestionsSection } from '@/features/suggestions/SuggestionsSection'
import { queryKeys } from '@/lib/query-keys'
import { CuisineType, DietType } from '@/types/domain'

export function SuggestionsPage() {
  const [params, setParams] = useSearchParams()
  const diet = (params.get('diet') as DietType | null) ?? undefined
  const cuisine = (params.get('cuisine') as CuisineType | null) ?? undefined
  const filters = { diet, cuisine }

  const pantryQuery = useQuery({
    queryKey: queryKeys.pantry(),
    queryFn: getPantry,
    staleTime: 30_000,
  })

  const suggestionsQuery = useQuery({
    queryKey: queryKeys.suggestions(filters),
    queryFn: () => getSuggestions(filters),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  function setFilter(key: 'diet' | 'cuisine', value?: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  function clearAllFilters() {
    setParams({}, { replace: true })
  }

  const pantryCount = pantryQuery.data?.length ?? 0
  const suggestionData = suggestionsQuery.data
  const { available = [], almostAvailable = [] } = suggestionData ?? {}
  const isInitialSuggestionsLoad = suggestionsQuery.isPending && !suggestionData
  const isRefetchingSuggestions = suggestionsQuery.isFetching && !isInitialSuggestionsLoad

  return (
    <div className="suggest-page">
      <SuggestionsPageHeader pantryCount={pantryCount} />

      <SuggestionFilters
        diet={diet}
        cuisine={cuisine}
        onDietChange={(d) => setFilter('diet', d)}
        onCuisineChange={(c) => setFilter('cuisine', c)}
        onClearAll={clearAllFilters}
        isUpdating={isRefetchingSuggestions}
      />

      {isInitialSuggestionsLoad ? (
        <div className="suggest-list" aria-busy="true" aria-label="Ładowanie sugestii">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="suggest-skeleton-row" />
          ))}
        </div>
      ) : null}

      {suggestionsQuery.isError && !suggestionData ? (
        <p className="suggest-error" role="alert">
          Nie udało się wczytać sugestii. Sprawdź połączenie i spróbuj odświeżyć stronę.
        </p>
      ) : null}

      {pantryCount === 0 && !isInitialSuggestionsLoad ? (
        <div className="suggest-empty">
          <p className="suggest-empty__title">Spiżarnia jest pusta</p>
          <p className="suggest-empty__text">
            Dodaj składniki, które masz w domu — wtedy pokażemy przepisy dopasowane do Twoich zapasów.
          </p>
          <Link className="suggest-empty__btn" to="/pantry">
            Uzupełnij spiżarnię
          </Link>
        </div>
      ) : null}

      {pantryCount > 0 && suggestionData ? (
        <div
          className={isRefetchingSuggestions ? 'suggest-content suggest-content--loading' : 'suggest-content'}
          aria-busy={isRefetchingSuggestions}
        >
          <SuggestionsSection label="Gotowe" title="Z Twojej spiżarni" count={available.length}>
            {available.length === 0 ? (
              <p className="suggest-muted">Brak w pełni dopasowanych przepisów przy tych filtrach.</p>
            ) : (
              <ul className="suggest-list">
                {available.map((recipe) => (
                  <SuggestionRecipeRow
                    key={recipe.id}
                    recipe={recipe}
                    actions={
                      <FillFromRecipesDialog
                        preselectedIds={[recipe.id]}
                        trigger={
                          <button type="button" className="suggest-row__cta">
                            Na listę zakupów
                          </button>
                        }
                      />
                    }
                  />
                ))}
              </ul>
            )}
          </SuggestionsSection>

          <SuggestionsSection label="Prawie" title="Brakuje co najwyżej dwóch składników" count={almostAvailable.length}>
            {almostAvailable.length === 0 ? (
              <p className="suggest-muted">Żaden przepis nie mieści się w tym progu.</p>
            ) : (
              <ul className="suggest-list">
                {almostAvailable.map(({ recipe, missingCount }) => (
                  <SuggestionRecipeRow
                    key={recipe.id}
                    recipe={recipe}
                    missingCount={missingCount}
                    actions={
                      <FillFromRecipesDialog
                        preselectedIds={[recipe.id]}
                        trigger={
                          <button type="button" className="suggest-row__cta">
                            Dodaj braki
                          </button>
                        }
                      />
                    }
                  />
                ))}
              </ul>
            )}
          </SuggestionsSection>
        </div>
      ) : null}
    </div>
  )
}
