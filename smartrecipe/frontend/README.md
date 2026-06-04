# SmartRecipe — frontend

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
Backend (domyślnie): http://localhost:3000 — ustaw `VITE_API_URL` w `.env`.

## Skrypty

| Polecenie      | Opis           |
| -------------- | -------------- |
| `pnpm dev`     | dev server     |
| `pnpm build`   | produkcja      |
| `pnpm preview` | podgląd buildu |
| `pnpm lint`    | ESLint         |
