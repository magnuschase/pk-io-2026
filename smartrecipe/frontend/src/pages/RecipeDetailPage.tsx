import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getRecipe, setRecipeIngredients, updateRecipe } from '@/api/recipes'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { IngredientListEditor } from '@/features/recipes/IngredientListEditor'
import { LifecycleActions } from '@/features/recipes/LifecycleActions'
import { RecipeForm, type RecipeFormValues } from '@/features/recipes/RecipeForm'
import { queryKeys } from '@/lib/query-keys'
import { displayEnum, formatUnit } from '@/lib/utils'
import type { RecipeIngredientLine } from '@/types/domain'

export function RecipeDetailPage() {
  const { id = '' } = useParams()
  const qc = useQueryClient()
  const [editingIngredients, setEditingIngredients] = useState(false)
  const [lines, setLines] = useState<RecipeIngredientLine[]>([])

  const { data: recipe, isLoading, isError } = useQuery({
    queryKey: queryKeys.recipes.detail(id),
    queryFn: () => getRecipe(id),
    enabled: Boolean(id),
    staleTime: 120_000,
  })

  const updateMutation = useMutation({
    mutationFn: (values: RecipeFormValues) =>
      updateRecipe(id, {
        title: values.title,
        instructions: values.instructions,
        estimatedKcalPerServing: values.estimatedKcalPerServing || undefined,
        dietType: values.dietType,
        cuisineType: values.cuisineType,
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: [{ resource: 'recipes' }] }),
  })

  const ingredientsMutation = useMutation({
    mutationFn: () =>
      setRecipeIngredients(
        id,
        lines.map(({ ingredientId, quantity, unit }) => ({ ingredientId, quantity, unit })),
      ),
    onSuccess: () => {
      setEditingIngredients(false)
      void qc.invalidateQueries({ queryKey: [{ resource: 'recipes' }] })
    },
  })

  if (isLoading) return <Skeleton className="h-40 w-full" />
  if (isError || !recipe) return <p className="text-[var(--color-destructive)]">Nie znaleziono przepisu.</p>

  const ingredientLines = recipe.ingredients ?? []

  return (
    <div>
      <p className="mb-2 text-sm">
        <Link to="/recipes" className="text-[var(--color-accent)] underline">
          ← Przepisy
        </Link>
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="page-heading mb-0">{recipe.title}</h1>
        <Badge>{displayEnum(recipe.lifecycleStatus)}</Badge>
      </div>
      <LifecycleActions recipe={recipe} />
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">Dane podstawowe</h2>
        <RecipeForm
          defaultValues={recipe}
          onSubmit={(v) => updateMutation.mutate(v)}
          isPending={updateMutation.isPending}
        />
      </section>
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold">Składniki</h2>
          <button
            type="button"
            className="text-sm text-[var(--color-accent)] underline"
            onClick={() => {
              setLines(ingredientLines)
              setEditingIngredients((v) => !v)
            }}
          >
            {editingIngredients ? 'Anuluj' : 'Edytuj składniki'}
          </button>
        </div>
        {editingIngredients ? (
          <>
            <IngredientListEditor lines={lines} onChange={setLines} />
            <button
              type="button"
              className="mt-4 rounded-[var(--radius-sm)] bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-paper)]"
              onClick={() => ingredientsMutation.mutate()}
              disabled={ingredientsMutation.isPending}
            >
              Zapisz składniki
            </button>
          </>
        ) : (
          <ul className="list-disc pl-5 text-sm">
            {ingredientLines.map((l) => (
              <li key={l.ingredientId}>
                {l.ingredient?.name ?? l.ingredientId} — {formatUnit(Number(l.quantity), l.unit)}
              </li>
            ))}
          </ul>
        )}
      </section>
      {recipe.instructions ? (
        <section className="mt-8">
          <h2 className="mb-2 text-lg font-bold">Instrukcje</h2>
          <p className="whitespace-pre-wrap text-sm text-[var(--color-muted)]">{recipe.instructions}</p>
        </section>
      ) : null}
    </div>
  )
}
