# SmartRecipe — frontend

React + Vite + TypeScript. Package manager: **pnpm** (`packageManager: pnpm@10.23.0`).

## Uruchomienie

```bash
cd smartrecipe/frontend
cp .env.example .env
pnpm install
pnpm dev
```

Aplikacja: http://localhost:5173  
Backend (domyślnie): http://localhost:3000 — ustaw `VITE_API_URL` w `.env`.

## Skrypty

| Polecenie      | Opis              |
|----------------|-------------------|
| `pnpm dev`     | dev server        |
| `pnpm build`   | produkcja         |
| `pnpm preview` | podgląd buildu    |
| `pnpm lint`    | ESLint            |

## Struktura

Zgodna z `FRONTEND_PLAN.md`: `api/`, `features/`, `pages/`, `components/`, auth (Zustand + axios refresh), TanStack Query.

Landing portowany z `smartrecipe/landing/` (tokeny Garden + BEM).
