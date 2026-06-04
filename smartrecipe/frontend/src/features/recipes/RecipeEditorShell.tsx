import { Link } from 'react-router-dom'

interface RecipeEditorShellProps {
  title: string
  lede?: string
  main: React.ReactNode
  aside: React.ReactNode
  /** Sticky page footer — used for primary submit on mobile (below ingredients). */
  footer?: React.ReactNode
}

export function RecipeEditorShell({ title, lede, main, aside, footer }: RecipeEditorShellProps) {
  return (
    <div className={`recipe-editor${footer ? ' recipe-editor--has-footer' : ''}`}>
      <nav className="recipe-editor__crumb" aria-label="Nawigacja">
        <Link className="recipe-editor__back" to="/recipes">
          ← Przepisy
        </Link>
      </nav>

      <header className="recipe-editor__header">
        <h1 className="recipe-editor__title">{title}</h1>
        {lede ? <p className="recipe-editor__lede">{lede}</p> : null}
      </header>

      <div className="recipe-editor__split">
        <section className="recipe-editor__panel recipe-editor__panel--main" aria-labelledby="recipe-panel-main">
          <h2 id="recipe-panel-main" className="recipe-editor__panel-title">
            Dane przepisu
          </h2>
          {main}
        </section>

        <aside className="recipe-editor__panel recipe-editor__panel--aside" aria-labelledby="recipe-panel-aside">
          <h2 id="recipe-panel-aside" className="recipe-editor__panel-title">
            Składniki
          </h2>
          {aside}
        </aside>
      </div>

      {footer ? <footer className="recipe-editor__footer">{footer}</footer> : null}
    </div>
  )
}
