import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { deleteRecipe } from '@/api/recipes'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { queryKeys } from '@/lib/query-keys'

export type DeleteRecipeVariant = 'draft' | 'archived'

const COPY = {
  draft: {
    triggerLabel: 'Usuń szkic',
    pendingLabel: 'Usuwanie...',
    dialogTitle: 'Usunąć szkic?',
    confirmLabel: 'Tak, usuń szkic',
    successToast: 'Szkic został usunięty',
    errorToast: 'Nie udało się usunąć szkicu',
    descriptionPrefix: 'Czy na pewno chcesz usunąć szkic',
    descriptionSuffix:
      'Tej operacji nie można cofnąć — przepis zostanie trwale usunięty z katalogu.',
  },
  archived: {
    triggerLabel: 'Usuń z archiwum',
    pendingLabel: 'Usuwanie...',
    dialogTitle: 'Usunąć przepis z archiwum?',
    confirmLabel: 'Tak, usuń przepis',
    successToast: 'Przepis został usunięty',
    errorToast: 'Nie udało się usunąć przepisu',
    descriptionPrefix: 'Czy na pewno chcesz trwale usunąć przepis',
    descriptionSuffix:
      'Tej operacji nie można cofnąć — przepis zniknie z archiwum i nie będzie można go przywrócić.',
  },
} as const satisfies Record<
  DeleteRecipeVariant,
  {
    triggerLabel: string
    pendingLabel: string
    dialogTitle: string
    confirmLabel: string
    successToast: string
    errorToast: string
    descriptionPrefix: string
    descriptionSuffix: string
  }
>

interface DeleteRecipeButtonProps {
  variant: DeleteRecipeVariant
  recipeId: string
  recipeTitle: string
  disabled?: boolean
  onDeletingChange?: (isDeleting: boolean) => void
}

export function DeleteRecipeButton({
  variant,
  recipeId,
  recipeTitle,
  disabled,
  onDeletingChange,
}: DeleteRecipeButtonProps) {
  const copy = COPY[variant]
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteRecipe(recipeId),
    onMutate: () => {
      onDeletingChange?.(true)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [{ resource: 'recipes' }] })
      void qc.removeQueries({ queryKey: queryKeys.recipes.detail(recipeId) })
      toast.success(copy.successToast)
      navigate('/recipes')
    },
    onError: () => {
      onDeletingChange?.(false)
      toast.error(copy.errorToast)
    },
  })

  function handleOpenChange(nextOpen: boolean) {
    if (mutation.isPending) return
    setOpen(nextOpen)
  }

  return (
    <>
      <button
        type="button"
        className="recipe-editor__toolbar-delete"
        disabled={disabled || mutation.isPending}
        onClick={() => setOpen(true)}
      >
        {mutation.isPending ? copy.pendingLabel : copy.triggerLabel}
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="delete-draft-dialog">
          <DialogHeader>
            <DialogTitle className="delete-draft-dialog__title">{copy.dialogTitle}</DialogTitle>
            <p className="delete-draft-dialog__lede">
              {copy.descriptionPrefix}{' '}
              <strong className="delete-draft-dialog__name">{recipeTitle}</strong>?{' '}
              {copy.descriptionSuffix}
            </p>
          </DialogHeader>
          <div className="delete-draft-dialog__actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              Anuluj
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? copy.pendingLabel : copy.confirmLabel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
