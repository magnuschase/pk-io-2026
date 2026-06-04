import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

const links = [
  { to: '/suggestions', label: 'Sugestie' },
  { to: '/pantry', label: 'Spiżarnia' },
  { to: '/recipes', label: 'Przepisy' },
  { to: '/shopping-list', label: 'Zakupy' },
  { to: '/external', label: 'Import' },
]

export function Navbar() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="app-nav">
      <div className="app-nav__inner">
        <NavLink className="app-nav__brand" to="/suggestions">
          SmartRecipe
        </NavLink>
        <nav className="app-nav__links" aria-label="Główna nawigacja">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `app-nav__link${isActive ? ' font-medium text-[var(--color-ink)]' : ''}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
          Wyloguj
        </Button>
      </div>
    </header>
  )
}
