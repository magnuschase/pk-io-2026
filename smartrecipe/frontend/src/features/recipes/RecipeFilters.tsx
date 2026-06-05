import { X } from 'lucide-react'
import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CuisineType, DietType } from '@/types/domain'
import {
  cuisineFilterOptions,
  dietFilterOptions,
  parseFilterValue,
  toFilterValue,
} from '@/lib/filter-options'
import {
  DEFAULT_RECIPE_STATUS_FILTER,
  recipeStatusFilterLabel,
  recipeStatusFilterOptions,
  type RecipeStatusFilter,
} from '@/lib/recipe-status-filter'
import { displayEnum } from '@/lib/utils'

export interface RecipeFilterValues {
  diet?: DietType
  cuisine?: CuisineType
  kcalMin?: number
  kcalMax?: number
  statusFilter?: RecipeStatusFilter
}

interface RecipeFiltersProps {
  values: RecipeFilterValues
  onChange: (v: RecipeFilterValues) => void
}

export function RecipeFilters({ values, onChange }: RecipeFiltersProps) {
  const statusFilter = values.statusFilter ?? DEFAULT_RECIPE_STATUS_FILTER
  const hasActiveFilters = Boolean(
    values.diet ||
      values.cuisine ||
      values.kcalMin ||
      values.kcalMax ||
      statusFilter !== DEFAULT_RECIPE_STATUS_FILTER,
  )

  function clearAll() {
    onChange({ statusFilter: DEFAULT_RECIPE_STATUS_FILTER })
  }

  return (
    <div className="recipes-filters">
      <div className="recipes-filters__grid">
        <div>
          <Label htmlFor="recipe-filter-diet">Dieta</Label>
          <Combobox
            id="recipe-filter-diet"
            value={toFilterValue(values.diet)}
            onValueChange={(v) => onChange({ ...values, diet: parseFilterValue<DietType>(v) })}
            options={dietFilterOptions()}
            placeholder="Wszystkie diety"
            allowSearch={false}
          />
        </div>
        <div>
          <Label htmlFor="recipe-filter-cuisine">Kuchnia</Label>
          <Combobox
            id="recipe-filter-cuisine"
            value={toFilterValue(values.cuisine)}
            onValueChange={(v) => onChange({ ...values, cuisine: parseFilterValue<CuisineType>(v) })}
            options={cuisineFilterOptions()}
            placeholder="Wszystkie kuchnie"
            searchPlaceholder="Szukaj kuchni..."
          />
        </div>
        <div>
          <Label htmlFor="recipe-filter-kcal-min">kcal min</Label>
          <Input
            id="recipe-filter-kcal-min"
            type="number"
            value={values.kcalMin ?? ''}
            onChange={(e) =>
              onChange({ ...values, kcalMin: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
        <div>
          <Label htmlFor="recipe-filter-kcal-max">kcal max</Label>
          <Input
            id="recipe-filter-kcal-max"
            type="number"
            value={values.kcalMax ?? ''}
            onChange={(e) =>
              onChange({ ...values, kcalMax: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
      </div>

      <div className="recipes-filters__status">
        <Label htmlFor="recipe-filter-status">Status</Label>
        <Combobox
          id="recipe-filter-status"
          value={statusFilter}
          onValueChange={(v) =>
            onChange({
              ...values,
              statusFilter: (v || DEFAULT_RECIPE_STATUS_FILTER) as RecipeStatusFilter,
            })
          }
          options={recipeStatusFilterOptions()}
          placeholder="Bez archiwum"
          allowSearch={false}
        />
      </div>

      {hasActiveFilters ? (
        <div className="recipes-filters__active">
          <div className="recipes-filters__chips">
            {values.diet ? (
              <span className="recipes-filters__chip">
                Dieta: {displayEnum(values.diet)}
                <button
                  type="button"
                  className="recipes-filters__chip-remove"
                  onClick={() => onChange({ ...values, diet: undefined })}
                  aria-label="Usuń filtr diety"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ) : null}
            {values.cuisine ? (
              <span className="recipes-filters__chip">
                Kuchnia: {displayEnum(values.cuisine)}
                <button
                  type="button"
                  className="recipes-filters__chip-remove"
                  onClick={() => onChange({ ...values, cuisine: undefined })}
                  aria-label="Usuń filtr kuchni"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ) : null}
            {values.kcalMin ? (
              <span className="recipes-filters__chip">
                min {values.kcalMin} kcal
                <button
                  type="button"
                  className="recipes-filters__chip-remove"
                  onClick={() => onChange({ ...values, kcalMin: undefined })}
                  aria-label="Usuń filtr kcal min"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ) : null}
            {values.kcalMax ? (
              <span className="recipes-filters__chip">
                max {values.kcalMax} kcal
                <button
                  type="button"
                  className="recipes-filters__chip-remove"
                  onClick={() => onChange({ ...values, kcalMax: undefined })}
                  aria-label="Usuń filtr kcal max"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ) : null}
            {statusFilter !== DEFAULT_RECIPE_STATUS_FILTER ? (
              <span className="recipes-filters__chip">
                Status: {recipeStatusFilterLabel(statusFilter)}
                <button
                  type="button"
                  className="recipes-filters__chip-remove"
                  onClick={() =>
                    onChange({ ...values, statusFilter: DEFAULT_RECIPE_STATUS_FILTER })
                  }
                  aria-label="Usuń filtr statusu"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ) : null}
          </div>
          <button type="button" className="recipes-filters__clear" onClick={clearAll}>
            Wyczyść filtry
          </button>
        </div>
      ) : null}
    </div>
  )
}
