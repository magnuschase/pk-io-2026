import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IngredientCombobox } from '@/components/domain/IngredientCombobox'
import type { Ingredient, PantryItem } from '@/types/domain'

const schema = z.object({
  quantity: z.coerce.number().positive('Ilość musi być dodatnia'),
  unit: z.string().min(1, 'Podaj jednostkę').max(50),
})

type FormValues = z.infer<typeof schema>

interface UpsertPantryItemDialogProps {
  trigger: React.ReactNode
  item?: PantryItem
  onSubmit: (ingredientId: string, values: FormValues) => void
}

export function UpsertPantryItemDialog({ trigger, item, onSubmit }: UpsertPantryItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [ingredient, setIngredient] = useState<Ingredient | null>(
    item?.ingredient ?? (item ? { id: item.ingredientId, name: '' } : null),
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: item ? Number(item.quantity) : 1, unit: item?.unit ?? 'g' },
  })

  useEffect(() => {
    if (open && item) {
      reset({ quantity: Number(item.quantity), unit: item.unit })
      setIngredient(item.ingredient ?? { id: item.ingredientId, name: '' })
    }
  }, [open, item, reset])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? 'Edytuj pozycję' : 'Dodaj do spiżarni'}</DialogTitle>
        </DialogHeader>
        {!item ? <IngredientCombobox onSelect={setIngredient} /> : null}
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={handleSubmit((values) => {
            if (!ingredient) return
            onSubmit(ingredient.id, values)
            setOpen(false)
          })}
        >
          <div>
            <Label htmlFor="qty">Ilość</Label>
            <Input id="qty" type="number" step="any" {...register('quantity')} />
            {errors.quantity ? (
              <p className="text-sm text-[var(--color-destructive)]">{errors.quantity.message}</p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="unit">Jednostka</Label>
            <Input id="unit" {...register('unit')} />
            {errors.unit ? (
              <p className="text-sm text-[var(--color-destructive)]">{errors.unit.message}</p>
            ) : null}
          </div>
          <Button type="submit" disabled={!ingredient}>
            Zapisz
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
