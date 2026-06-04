import type { PantryItem } from '@/types/domain'
import { formatUnit } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface PantryItemRowProps {
  item: PantryItem
  editTrigger: React.ReactNode
  onDelete: (item: PantryItem) => void
}

export function PantryItemRow({ item, editTrigger, onDelete }: PantryItemRowProps) {
  const name = item.ingredient?.name ?? item.ingredientId

  return (
    <tr className="border-b border-[var(--color-rule)]">
      <td className="py-3 pr-4">{name}</td>
      <td className="py-3 pr-4 tabular-nums">{formatUnit(Number(item.quantity), item.unit)}</td>
      <td className="py-3 text-right">
        <div className="flex justify-end gap-2">
          {editTrigger}
          <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(item)}>
            Usuń
          </Button>
        </div>
      </td>
    </tr>
  )
}
