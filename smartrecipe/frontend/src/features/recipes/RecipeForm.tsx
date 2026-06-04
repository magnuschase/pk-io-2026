import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CuisineType, DietType, type Recipe } from '@/types/domain'
import { displayEnum } from '@/lib/utils'

const schema = z.object({
  title: z.string().min(1, 'Tytuł jest wymagany').max(300),
  instructions: z.string().optional(),
  estimatedKcalPerServing: z.coerce.number().int().positive().optional(),
  dietType: z.nativeEnum(DietType).optional(),
  cuisineType: z.nativeEnum(CuisineType).optional(),
})

export type RecipeFormValues = z.infer<typeof schema>

interface RecipeFormProps {
  defaultValues?: Partial<Recipe>
  onSubmit: (values: RecipeFormValues) => void
  isPending?: boolean
  submitLabel?: string
}

export function RecipeForm({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel = 'Zapisz',
}: RecipeFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      instructions: defaultValues?.instructions ?? '',
      estimatedKcalPerServing: defaultValues?.estimatedKcalPerServing ?? undefined,
      dietType: defaultValues?.dietType ?? undefined,
      cuisineType: defaultValues?.cuisineType ?? undefined,
    },
  })

  const dietType = watch('dietType')
  const cuisineType = watch('cuisineType')

  return (
    <form className="flex max-w-xl flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Label htmlFor="title">Tytuł</Label>
        <Input id="title" {...register('title')} />
        {errors.title ? <p className="text-sm text-[var(--color-destructive)]">{errors.title.message}</p> : null}
      </div>
      <div>
        <Label htmlFor="instructions">Instrukcje</Label>
        <textarea
          id="instructions"
          className="flex min-h-28 w-full rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-sm"
          {...register('instructions')}
        />
      </div>
      <div>
        <Label htmlFor="kcal">kcal / porcja</Label>
        <Input id="kcal" type="number" {...register('estimatedKcalPerServing')} />
      </div>
      <div>
        <Label>Dieta</Label>
        <Select
          value={dietType ?? 'none'}
          onValueChange={(v) => setValue('dietType', v === 'none' ? undefined : (v as DietType))}
        >
          <SelectTrigger>
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {Object.values(DietType).map((d) => (
              <SelectItem key={d} value={d}>
                {displayEnum(d)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Kuchnia</Label>
        <Select
          value={cuisineType ?? 'none'}
          onValueChange={(v) => setValue('cuisineType', v === 'none' ? undefined : (v as CuisineType))}
        >
          <SelectTrigger>
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {Object.values(CuisineType).map((c) => (
              <SelectItem key={c} value={c}>
                {displayEnum(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Zapisywanie…' : submitLabel}
      </Button>
    </form>
  )
}
