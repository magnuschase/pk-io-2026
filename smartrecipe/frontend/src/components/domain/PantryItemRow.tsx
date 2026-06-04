import type { PantryItem } from '@/types/domain'

interface PantryItemRowProps {
  item: PantryItem
  editTrigger: React.ReactNode
  onDelete: (item: PantryItem) => void
}

function formatQuantity(quantity: number): string {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(1)
}

export function PantryItemRow({ item, editTrigger, onDelete }: PantryItemRowProps) {
  const name = item.ingredient?.name ?? item.ingredientId
  const qty = Number(item.quantity)

  return (
    <li>
      <article className="pantry-card">
        <h2 className="pantry-card__name">{name}</h2>
        <p className="pantry-card__qty">
          {formatQuantity(qty)}
          <span className="pantry-card__unit"> {item.unit}</span>
        </p>
        <div className="pantry-card__actions">
          {editTrigger}
          <button
            type="button"
            className="pantry-card__btn pantry-card__btn--danger"
            onClick={() => onDelete(item)}
          >
            Usuń
          </button>
        </div>
      </article>
    </li>
  )
}
