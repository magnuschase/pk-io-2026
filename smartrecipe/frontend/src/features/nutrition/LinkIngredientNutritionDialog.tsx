import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  enrichIngredientAuto,
  enrichIngredientByFdc,
  searchNutritionFoods,
  setIngredientManualKcal,
} from '@/api/nutrition'
import type { NutritionSearchHit } from '@/api/nutrition'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useDebounce } from '@/hooks/useDebounce'
import {
  formatIngredientKcal,
  hasIngredientKcal,
  normalizeIngredient,
} from '@/lib/ingredient-nutrition'
import type { Ingredient } from '@/types/domain'
import { toast } from 'sonner'

interface LinkIngredientNutritionDialogProps {
  ingredient: Ingredient
  open: boolean
  onOpenChange: (open: boolean) => void
  onLinked: (ingredient: Ingredient) => void
}

function handleEnrichResult(
  updated: Ingredient,
  onLinked: (ingredient: Ingredient) => void,
  onOpenChange: (open: boolean) => void,
) {
  const normalized = normalizeIngredient(updated)
  if (!hasIngredientKcal(normalized)) {
    toast.error('Nie znaleziono kaloryki dla tego składnika - wybierz inną pozycję z listy.')
    return
  }
  onLinked(normalized)
  toast.success(`Zapisano: ${formatIngredientKcal(normalized)}`)
  onOpenChange(false)
}

function formatHitKcal(hit: NutritionSearchHit): string {
  return hit.kcalPer100g != null
    ? `${hit.kcalPer100g} kcal / 100 g`
    : 'brak danych o kcal'
}

interface NutritionHitButtonProps {
  hit: NutritionSearchHit
  disabled: boolean
  onPick: (fdcId: number) => void
  className?: string
}

function NutritionHitButton({
  hit,
  disabled,
  onPick,
  className = 'nutrition-dialog__hit',
}: NutritionHitButtonProps) {
  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      onClick={() => onPick(hit.fdcId)}
    >
      <span className="nutrition-dialog__hit-name">{hit.description}</span>
      <span className="nutrition-dialog__hit-kcal">{formatHitKcal(hit)}</span>
    </button>
  )
}

export function LinkIngredientNutritionDialog({
  ingredient,
  open,
  onOpenChange,
  onLinked,
}: LinkIngredientNutritionDialogProps) {
  const [manualQuery, setManualQuery] = useState('')
  const [manualKcal, setManualKcal] = useState('')
  const debouncedManual = useDebounce(manualQuery, 350)
  const searchTerm = debouncedManual.trim() || ingredient.name

  const { data: searchResult, isFetching, isError } = useQuery({
    queryKey: [{ resource: 'nutrition', scope: 'search', q: searchTerm }],
    queryFn: () => searchNutritionFoods(searchTerm),
    enabled: open && searchTerm.length >= 2,
    staleTime: 60_000,
  })

  const proposed = searchResult?.proposed ?? null
  const hits = searchResult?.hits ?? []
  const hasResults = proposed != null || hits.length > 0

  const autoMutation = useMutation({
    mutationFn: () => enrichIngredientAuto(ingredient.id),
    onSuccess: (updated) => handleEnrichResult(updated, onLinked, onOpenChange),
    onError: () => toast.error('Nie udało się pobrać kaloryki'),
  })

  const pickMutation = useMutation({
    mutationFn: (fdcId: number) => enrichIngredientByFdc(ingredient.id, fdcId),
    onSuccess: (updated) => handleEnrichResult(updated, onLinked, onOpenChange),
    onError: () => toast.error('Zapis nie powiódł się'),
  })

  const manualMutation = useMutation({
    mutationFn: (kcalPer100g: number) =>
      setIngredientManualKcal(ingredient.id, kcalPer100g),
    onSuccess: (updated) => handleEnrichResult(updated, onLinked, onOpenChange),
    onError: () => toast.error('Zapis ręcznej kaloryki nie powiódł się'),
  })

  const busy =
    autoMutation.isPending || pickMutation.isPending || manualMutation.isPending

  const handleManualSave = () => {
    const parsed = Number.parseFloat(manualKcal.replace(',', '.'))
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Podaj poprawną wartość kcal (liczba ≥ 0).')
      return
    }
    manualMutation.mutate(Math.round(parsed * 100) / 100)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nutrition-dialog">
        <DialogHeader>
          <DialogTitle className="nutrition-dialog__title">
            Kaloryka - {ingredient.name}
          </DialogTitle>
          <p className="nutrition-dialog__lede">
            Szukamy wartości na 100 g w bazie żywności. Polskie nazwy tłumaczymy
            przez DeepL - możesz też wpisać własną frazę po angielsku (np. „wheat flour”).
          </p>
        </DialogHeader>

        <div className="nutrition-dialog__actions">
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => autoMutation.mutate()}
          >
            {autoMutation.isPending ? 'Pobieram...' : 'Pobierz automatycznie'}
          </Button>
        </div>

        <label className="nutrition-dialog__label" htmlFor="nutrition-manual-q">
          Szukaj ręcznie
        </label>
        <input
          id="nutrition-manual-q"
          className="app-input nutrition-dialog__input"
          value={manualQuery}
          onChange={(e) => setManualQuery(e.target.value)}
          placeholder="np. chicken breast, wheat flour"
          autoComplete="off"
        />

        {isError ? (
          <p className="nutrition-dialog__error" role="alert">
            Baza kaloryczna niedostępna - sprawdź konfigurację API w backendzie.
          </p>
        ) : null}

        {isFetching ? <p className="nutrition-dialog__status">Szukam...</p> : null}

        {!isFetching && !isError && proposed ? (
          <div className="nutrition-dialog__proposed">
            <p className="nutrition-dialog__proposed-label">Proponowane</p>
            <NutritionHitButton
              hit={proposed}
              disabled={busy}
              onPick={(fdcId) => pickMutation.mutate(fdcId)}
              className="nutrition-dialog__hit nutrition-dialog__hit--proposed"
            />
          </div>
        ) : null}

        {!isFetching && !isError && hits.length > 0 ? (
          <ul className="nutrition-dialog__hits">
            {hits.map((hit) => (
              <li key={hit.fdcId}>
                <NutritionHitButton
                  hit={hit}
                  disabled={busy}
                  onPick={(fdcId) => pickMutation.mutate(fdcId)}
                />
              </li>
            ))}
          </ul>
        ) : null}

        {!isFetching && !isError && searchTerm.length >= 2 && !hasResults ? (
          <p className="nutrition-dialog__status">
            Brak wyników - spróbuj innej nazwy (najlepiej po angielsku).
          </p>
        ) : null}

        <div className="nutrition-dialog__manual">
          <label className="nutrition-dialog__label" htmlFor="nutrition-manual-kcal">
            Wpisz ręcznie (kcal / 100 g)
          </label>
          <div className="nutrition-dialog__manual-row">
            <input
              id="nutrition-manual-kcal"
              className="app-input nutrition-dialog__manual-input"
              type="number"
              min={0}
              step={1}
              inputMode="decimal"
              value={manualKcal}
              onChange={(e) => setManualKcal(e.target.value)}
              placeholder="np. 100"
              autoComplete="off"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy || manualKcal.trim() === ''}
              onClick={handleManualSave}
            >
              {manualMutation.isPending ? 'Zapisuję...' : 'Zapisz'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
