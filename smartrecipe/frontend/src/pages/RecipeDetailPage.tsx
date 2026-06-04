import DOMPurify from "dompurify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getRecipe, setRecipeIngredients, updateRecipe } from "@/api/recipes";
import { Skeleton } from "@/components/ui/skeleton";
import { IngredientListEditor } from "@/features/recipes/IngredientListEditor";
import { LifecycleActions } from "@/features/recipes/LifecycleActions";
import {
  RecipeForm,
  type RecipeFormValues,
} from "@/features/recipes/RecipeForm";
import { queryKeys } from "@/lib/query-keys";
import { displayEnum, formatUnit } from "@/lib/utils";
import type { RecipeIngredientLine } from "@/types/domain";

export function RecipeDetailPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const [editingIngredients, setEditingIngredients] = useState(false);
  const [lines, setLines] = useState<RecipeIngredientLine[]>([]);

  const {
    data: recipe,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.recipes.detail(id),
    queryFn: () => getRecipe(id),
    enabled: Boolean(id),
    staleTime: 120_000,
  });

  const updateMutation = useMutation({
    mutationFn: (values: RecipeFormValues) =>
      updateRecipe(id, {
        title: values.title,
        instructions: values.instructions,
        estimatedKcalPerServing: values.estimatedKcalPerServing || undefined,
        dietType: values.dietType,
        cuisineType: values.cuisineType,
      }),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: [{ resource: "recipes" }] }),
  });

  const ingredientsMutation = useMutation({
    mutationFn: () =>
      setRecipeIngredients(
        id,
        lines.map(({ ingredientId, quantity, unit }) => ({
          ingredientId,
          quantity,
          unit,
        })),
      ),
    onSuccess: () => {
      setEditingIngredients(false);
      void qc.invalidateQueries({ queryKey: [{ resource: "recipes" }] });
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (isError || !recipe) {
    return (
      <p className="recipes-error" role="alert">
        Nie znaleziono przepisu.
      </p>
    );
  }

  const ingredientLines = recipe.ingredients ?? [];

  return (
    <div className="recipe-detail">
      <nav className="recipe-detail__crumb" aria-label="Nawigacja">
        <Link className="recipe-editor__back" to="/recipes">
          ← Przepisy
        </Link>
      </nav>

      <header className="recipe-detail__header">
        <h1 className="recipe-detail__title">{recipe.title}</h1>
        <span className="recipe-detail__status">
          {displayEnum(recipe.lifecycleStatus)}
        </span>
      </header>

      <LifecycleActions recipe={recipe} />

      <section
        className="recipe-detail__section"
        aria-labelledby="recipe-detail-data"
      >
        <h2 id="recipe-detail-data" className="recipe-detail__section-title">
          Dane podstawowe
        </h2>
        <RecipeForm
          defaultValues={recipe}
          onSubmit={(v) => updateMutation.mutate(v)}
          isPending={updateMutation.isPending}
        />
      </section>

      <section
        className="recipe-detail__section"
        aria-labelledby="recipe-detail-ingredients"
      >
        <div className="recipe-detail__section-head">
          <h2
            id="recipe-detail-ingredients"
            className="recipe-detail__section-title"
          >
            Składniki
          </h2>
          <button
            type="button"
            className="recipe-detail__edit-toggle"
            onClick={() => {
              setLines(ingredientLines);
              setEditingIngredients((v) => !v);
            }}
          >
            {editingIngredients ? "Anuluj" : "Edytuj składniki"}
          </button>
        </div>

        {editingIngredients ? (
          <>
            <IngredientListEditor lines={lines} onChange={setLines} />
            <button
              type="button"
              className="recipe-detail__save-ingredients"
              onClick={() => ingredientsMutation.mutate()}
              disabled={ingredientsMutation.isPending}
            >
              {ingredientsMutation.isPending
                ? "Zapisywanie…"
                : "Zapisz składniki"}
            </button>
          </>
        ) : ingredientLines.length > 0 ? (
          <ul className="recipe-detail__ingredients-read">
            {ingredientLines.map((l) => (
              <li key={l.ingredientId}>
                {l.ingredient?.name ?? l.ingredientId} —{" "}
                {formatUnit(Number(l.quantity), l.unit)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="recipe-ingredients__empty">
            Brak składników w tym przepisie.
          </p>
        )}
      </section>

      {recipe.instructions ? (
        <section
          className="recipe-detail__section"
          aria-labelledby="recipe-detail-instructions"
        >
          <h2
            id="recipe-detail-instructions"
            className="recipe-detail__section-title"
          >
            Instrukcje
          </h2>
          <div
            className="recipe-detail__instructions rte-output"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(recipe.instructions),
            }}
          />
        </section>
      ) : null}
    </div>
  );
}
