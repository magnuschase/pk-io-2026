import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { formatUnit } from '@/lib/utils'
import type { ShoppingListItem } from '@/types/domain'

interface ShoppingItemRowProps {
  item: ShoppingListItem
  onToggle: (item: ShoppingListItem, purchased: boolean) => void
  onDelete: (item: ShoppingListItem) => void
}

export function ShoppingItemRow({ item, onToggle, onDelete }: ShoppingItemRowProps) {
  const name = item.ingredient?.name ?? item.ingredientId

  return (
    <li className="flex items-center gap-3 border-b border-[var(--color-rule)] py-3">
      <Checkbox
        checked={item.purchased}
        onCheckedChange={(v) => onToggle(item, v === true)}
        aria-label={`Kupione: ${name}`}
      />
      <span className={`flex-1 min-w-0 ${item.purchased ? 'line-through text-[var(--color-muted)]' : ''}`}>
        {name} — {formatUnit(Number(item.quantityNeeded), item.unit)}
      </span>
      <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(item)}>
        Usuń
      </Button>
    </li>
  )
}
