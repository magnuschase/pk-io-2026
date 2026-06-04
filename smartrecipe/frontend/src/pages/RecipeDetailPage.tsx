import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { getRecipe, setRecipeIngredients, updateRecipe } from "@/api/recipes";
import { Skeleton } from "@/components/ui/skeleton";
import { IngredientListEditor } from "@/features/recipes/IngredientListEditor";
import { LifecycleActions } from "@/features/recipes/LifecycleActions";
import {
  RecipeForm,
  type RecipeFormValues,
} from "@/features/recipes/RecipeForm";
import { RecipeEditorShell } from "@/features/recipes/RecipeEditorShell";
import { queryKeys } from "@/lib/query-keys";
import { normalizeIngredientLine } from "@/lib/recipe-ingredients";
import { displayEnum, formatUnit } from "@/lib/utils";
import {
  RecipeLifecycleStatus,
  type RecipeIngredientLine,
} from "@/types/domain";

interface SaveRecipePayload {
  values: RecipeFormValues;
  lines: RecipeIngredientLine[];
  saveIngredients: boolean;
}

export function RecipeDetailPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const submitFormRef = useRef<() => void>(() => {});
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

  const isDraft = recipe?.lifecycleStatus === RecipeLifecycleStatus.DRAFT;
  const ingredientLines = recipe?.ingredients ?? [];
  const ingredientsEditable = isDraft || editingIngredients;

  useEffect(() => {
    if (!recipe || !ingredientsEditable) return;
    setLines((recipe.ingredients ?? []).map(normalizeIngredientLine));
  }, [recipe, ingredientsEditable]);

  const saveMutation = useMutation({
    mutationFn: async ({ values, lines, saveIngredients }: SaveRecipePayload) => {
      await updateRecipe(id, {
        title: values.title,
        instructions: values.instructions,
        estimatedKcalPerServing: values.estimatedKcalPerServing || undefined,
        dietType: values.dietType,
        cuisineType: values.cuisineType,
      });
      if (saveIngredients) {
        await setRecipeIngredients(id, lines);
      }
    },
    onSuccess: () => {
      setEditingIngredients(false);
      void qc.invalidateQueries({ queryKey: [{ resource: "recipes" }] });
      toast.success("Zmiany zapisane");
    },
    onError: () => toast.error("Nie udało się zapisać zmian"),
  });

  const handleSave = () => {
    submitFormRef.current();
  };

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (isError || !recipe) {
    return (
      <p className="recipes-error" role="alert">
        Nie znaleziono przepisu.
      </p>
    );
  }

  const aside = ingredientsEditable ? (
    <div className="recipe-editor__aside-stack">
      <IngredientListEditor lines={lines} onChange={setLines} />
      {editingIngredients && !isDraft ? (
        <button
          type="button"
          className="recipe-editor__aside-cancel"
          onClick={() => setEditingIngredients(false)}
        >
          Anuluj edycję składników
        </button>
      ) : null}
    </div>
  ) : (
    <div className="recipe-editor__aside-read">
      {ingredientLines.length > 0 ? (
        <ul className="recipe-detail__ingredients-read">
          {ingredientLines.map((l) => (
            <li key={l.ingredientId}>
              <span className="recipe-detail__ingredient-name">
                {l.ingredient?.name ?? l.ingredientId}
              </span>
              {l.unit ? (
                <span className="recipe-detail__ingredient-qty">
                  {formatUnit(Number(l.quantity), l.unit)}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="recipe-ingredients__empty">
          Brak składników w tym przepisie.
        </p>
      )}
      <button
        type="button"
        className="recipe-editor__aside-edit"
        onClick={() => {
          setLines(ingredientLines.map(normalizeIngredientLine));
          setEditingIngredients(true);
        }}
      >
        Edytuj składniki
      </button>
    </div>
  );

  const toolbar = (
    <div className="recipe-editor__toolbar-actions">
      <button
        type="button"
        className="recipe-form__submit recipe-editor__toolbar-save"
        disabled={saveMutation.isPending}
        onClick={handleSave}
      >
        {saveMutation.isPending ? "Zapisywanie…" : "Zapisz zmiany"}
      </button>
      <LifecycleActions recipe={recipe} />
    </div>
  );

  return (
    <RecipeEditorShell
      title={recipe.title}
      lede={
        isDraft
          ? "Szkic — uzupełnij dane i składniki, zapisz zmiany, a gdy będzie gotowy opublikuj."
          : undefined
      }
      status={
        <span
          className={`recipe-editor__status recipe-editor__status--${recipe.lifecycleStatus.toLowerCase()}`}
        >
          {displayEnum(recipe.lifecycleStatus)}
        </span>
      }
      toolbar={toolbar}
      main={
        <RecipeForm
          defaultValues={recipe}
          onSubmit={(values) =>
            saveMutation.mutate({
              values,
              lines,
              saveIngredients: ingredientsEditable,
            })
          }
          isPending={saveMutation.isPending}
          submitPlacement="none"
          onRegisterSubmit={(submit) => {
            submitFormRef.current = submit;
          }}
        />
      }
      aside={aside}
    />
  );
}
