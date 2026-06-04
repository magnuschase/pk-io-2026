# SmartRecipe - frontend

React + Vite + TypeScript. Package manager: **pnpm** (`packageManager: pnpm@10.23.0`).

## Dokumentacja projektu

| Dokument                                                 | Zawartość                                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [`../../README.md`](../../README.md)                     | Opis projektu, C4 Level 1 & 2, skład zespołu                                          |
| [`../../model-statyczny.md`](../../model-statyczny.md)   | Diagram klas, encji, pakietów, stany obiektów                                         |
| [`../../model-dynamiczny.md`](../../model-dynamiczny.md) | Aktorzy, przypadki użycia UC01–UC05, diagramy sekwencji i czynności, wymagania RF/RNF |
| [`../../diagrams/`](../../diagrams/)                     | Źródła Mermaid (C4, UC, sekwencje, diagram klas)                                      |

## Uruchomienie

```bash
cd smartrecipe/frontend
cp .env.example .env
pnpm install
pnpm dev
```

Aplikacja: http://localhost:5173  
Backend (domyślnie): http://localhost:3000 - ustaw `VITE_API_URL` w `.env`.

## Skrypty

| Polecenie       | Opis                              |
| --------------- | --------------------------------- |
| `pnpm dev`      | dev server                        |
| `pnpm build`    | produkcja                         |
| `pnpm preview`  | podgląd buildu                    |
| `pnpm lint`     | ESLint                            |
| `pnpm test`     | testy jednostkowe i komponentowe (Vitest) |
| `pnpm test:watch` | testy w trybie watch            |
| `pnpm test:cov` | testy z raportem pokrycia         |

Testy obejmują logikę UI powiązaną z modelem domenowym (spiżarnia, przepisy i cykl życia, sugestie posiłków, lista zakupów, szacowanie kcal, filtry diety/kuchni) - zgodnie z `model-statyczny.md` i `model-dynamiczny.md` (UC01–UC04, RF17). Raport `pnpm test:cov` mierzy warstwy `lib/`, `api/` (bez axios interceptora), `hooks/`, `store/` oraz kluczowe moduły w `features/`; pełne ekrany CRUD i formularze auth są testowane ręcznie / E2E.
