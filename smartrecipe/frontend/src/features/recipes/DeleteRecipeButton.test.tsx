import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { toast } from 'sonner'
import { deleteRecipe } from '@/api/recipes'
import { DeleteRecipeButton } from '@/features/recipes/DeleteRecipeButton'
import { renderWithProviders } from '@/test/test-utils'

const navigate = vi.fn()

vi.mock('@/api/recipes', () => ({
  deleteRecipe: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

describe('DeleteRecipeButton', () => {
  beforeEach(() => {
    vi.mocked(deleteRecipe).mockReset()
    vi.mocked(deleteRecipe).mockResolvedValue(undefined)
    navigate.mockReset()
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
  })

  it('opens confirmation dialog for draft variant', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <DeleteRecipeButton variant="draft" recipeId="draft-1" recipeTitle="Mój szkic" />,
      { route: '/recipes/draft-1' },
    )

    await user.click(screen.getByRole('button', { name: 'Usuń szkic' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Mój szkic/)).toBeInTheDocument()
    expect(deleteRecipe).not.toHaveBeenCalled()
  })

  it('deletes draft after confirmation', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <DeleteRecipeButton variant="draft" recipeId="draft-1" recipeTitle="Mój szkic" />,
      { route: '/recipes/draft-1' },
    )

    await user.click(screen.getByRole('button', { name: 'Usuń szkic' }))
    await user.click(screen.getByRole('button', { name: 'Tak, usuń szkic' }))

    await waitFor(() => {
      expect(deleteRecipe).toHaveBeenCalledWith('draft-1')
    })
    expect(toast.success).toHaveBeenCalledWith('Szkic został usunięty')
    expect(navigate).toHaveBeenCalledWith('/recipes')
  })

  it('opens confirmation dialog for archived variant', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <DeleteRecipeButton variant="archived" recipeId="arch-1" recipeTitle="Stary przepis" />,
      { route: '/recipes/arch-1' },
    )

    await user.click(screen.getByRole('button', { name: 'Usuń z archiwum' }))

    expect(screen.getByRole('heading', { name: 'Usunąć przepis z archiwum?' })).toBeInTheDocument()
    expect(deleteRecipe).not.toHaveBeenCalled()
  })

  it('deletes archived recipe after confirmation', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <DeleteRecipeButton variant="archived" recipeId="arch-1" recipeTitle="Stary przepis" />,
      { route: '/recipes/arch-1' },
    )

    await user.click(screen.getByRole('button', { name: 'Usuń z archiwum' }))
    await user.click(screen.getByRole('button', { name: 'Tak, usuń przepis' }))

    await waitFor(() => {
      expect(deleteRecipe).toHaveBeenCalledWith('arch-1')
    })
    expect(toast.success).toHaveBeenCalledWith('Przepis został usunięty')
    expect(navigate).toHaveBeenCalledWith('/recipes')
  })

  it('does not delete when cancelled', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <DeleteRecipeButton variant="archived" recipeId="arch-1" recipeTitle="Stary przepis" />,
      { route: '/recipes/arch-1' },
    )

    await user.click(screen.getByRole('button', { name: 'Usuń z archiwum' }))
    await user.click(screen.getByRole('button', { name: 'Anuluj' }))

    expect(deleteRecipe).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
