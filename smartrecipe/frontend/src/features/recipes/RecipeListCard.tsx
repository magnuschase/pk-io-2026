import { Link } from 'react-router-dom'
import { recipeIngredientSummary } from '@/components/domain/RecipeCard'
import { displayEnum } from '@/lib/utils'
import { RecipeLifecycleStatus, type Recipe } from '@/types/domain'

const STATUS_CLASS: Record<RecipeLifecycleStatus, string> = {
  [RecipeLifecycleStatus.DRAFT]: 'recipes-card__status--draft',
  [RecipeLifecycleStatus.ACTIVE]: 'recipes-card__status--active',
  [RecipeLifecycleStatus.ARCHIVED]: 'recipes-card__status--archived',
}

interface RecipeListCardProps {
  recipe: Recipe
}

export function RecipeListCard({ recipe }: RecipeListCardProps) {
  const hasIngredients = (recipe.ingredients?.length ?? 0) > 0
  const preview = hasIngredients ? recipeIngredientSummary(recipe) : 'Brak składników'

  return (
    <article className="recipes-card">
      <div className="recipes-card__top">
        <span className={`recipes-card__status ${STATUS_CLASS[recipe.lifecycleStatus]}`}>
          {displayEnum(recipe.lifecycleStatus)}
        </span>
        {recipe.estimatedKcalPerServing ? (
          <span className="recipes-card__kcal">{recipe.estimatedKcalPerServing} kcal</span>
        ) : null}
      </div>
      <h2 className="recipes-card__title">
        <Link to={`/recipes/${recipe.id}`}>{recipe.title}</Link>
      </h2>
      {(recipe.dietType || recipe.cuisineType) && (
        <div className="recipes-card__meta">
          {recipe.dietType ? <span className="recipes-card__chip">{displayEnum(recipe.dietType)}</span> : null}
          {recipe.cuisineType ? (
            <span className="recipes-card__chip">{displayEnum(recipe.cuisineType)}</span>
          ) : null}
        </div>
      )}
      <p className="recipes-card__preview">{preview}</p>
      <Link className="recipes-card__cta" to={`/recipes/${recipe.id}`}>
        Otwórz przepis →
      </Link>
    </article>
  )
}
