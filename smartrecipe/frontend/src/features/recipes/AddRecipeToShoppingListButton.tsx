import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { fillShoppingList } from "@/api/shopping-list";

interface AddRecipeToShoppingListButtonProps {
  recipeId: string;
  className?: string;
}

export function AddRecipeToShoppingListButton({
  recipeId,
  className = "recipe-detail-view__shop-btn",
}: AddRecipeToShoppingListButtonProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => fillShoppingList([recipeId]),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [{ resource: "shopping-list" }] });
      toast.success("Brakujące składniki dodane do listy zakupów", {
        action: {
          label: "Zobacz listę",
          onClick: () => navigate("/shopping-list"),
        },
      });
    },
    onError: () => toast.error("Nie udało się uzupełnić listy zakupów"),
  });

  return (
    <button
      type="button"
      className={className}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending ? "Dodawanie…" : "Dodaj braki do listy zakupów"}
    </button>
  );
}
