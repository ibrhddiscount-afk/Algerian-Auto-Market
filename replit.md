# AutoDZ — Le marché auto en Algérie

A production-ready Algerian automotive marketplace frontend built with React + Vite + TailwindCSS.

## Run & Operate

- `pnpm --filter @workspace/autodz run dev` — run the frontend (auto-assigned port)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7 + TailwindCSS v4
- Routing: Wouter
- Icons: Lucide React
- State: React hooks (useState, useMemo)

## Where things live

- `artifacts/autodz/src/pages/Home.tsx` — homepage
- `artifacts/autodz/src/pages/Listings.tsx` — full search/filter/sort/paginate page
- `artifacts/autodz/src/components/` — all UI components
- `artifacts/autodz/src/data/listings.ts` — mock data (30 listings) + filter constants
- `artifacts/autodz/src/components/CarCard.tsx` — shared car listing card
- `attached_assets/` — hero background image (Peugeot 208 + Algiers cityscape)

## Architecture decisions

- All mock data lives in `src/data/listings.ts` with typed interfaces — easy to swap for real API data
- Filter logic is pure `useMemo` over the full dataset for instant client-side filtering
- `CarCard` is a shared component used by both the homepage grid and the listings page
- Green brand color: `#1a7a3c` — consistent across all components via inline classes
- No external state library; wouter handles routing, React hooks handle everything else

## Product

- **Homepage**: Hero with search form (marque/modèle/prix/wilaya), vehicle category grid (7 types), recent listings, trust sidebar, features strip, stats bar, footer
- **Listings page** (`/annonces`): Left filter sidebar (marque, wilaya, carburant, transmission, budget, année, kilométrage, vérifié only), sort bar (5 sort options), grid/list view toggle, active filter chips with one-click removal, pagination (9 per page), mobile drawer for filters, empty state

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The hero background image uses the attached reference screenshot — replace with a real car/cityscape photo for production
- `BASE_URL` from `import.meta.env.BASE_URL` is used for routing base — do not hardcode `/`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
