import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importExternalRecipe } from '@/api/external'
import { Button } from '@/components/ui/button'
import type { ExternalRecipeHit } from '@/types/domain'
import { toast } from 'sonner'

interface ExternalRecipeCardProps {
  hit: ExternalRecipeHit
}

export function ExternalRecipeCard({ hit }: ExternalRecipeCardProps) {
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => importExternalRecipe(hit.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [{ resource: 'recipes' }] })
      toast.success('Przepis zaimportowany jako szkic')
    },
    onError: () => toast.error('Import nie powiódł się'),
  })

  return (
    <article className="recipe-card">
      <h3 className="recipe-card__title">{hit.title}</h3>
      {hit.sourceUrl ? (
        <a
          href={hit.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-[var(--color-accent)] underline"
        >
          Źródło
        </a>
      ) : null}
      <Button type="button" size="sm" className="mt-2" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
        {mutation.isPending ? 'Import…' : 'Importuj jako szkic'}
      </Button>
    </article>
  )
}
