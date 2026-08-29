# QR Menu â€” Customer Ordering Experience

Live Demo: https://gourab775.github.io/qr-menu-app

Category: Hospitality Tech Â· Food & Beverage Commerce

Stack: React 19 Â· Vite Â· Supabase Â· Wouter Â· Framer Motion Â· Tailwind CSS 3

## Overview

QR Menu is a mobile-first, QR-driven ordering platform for restaurants â€” built as a high-performance single-page application that lets guests browse menus, customize dishes, and place service requests directly from their table. The system pairs a polished consumer interface (animations, gesture-aware layouts, Lottie feedback) with a Supabase-backed data layer for real-time menu, cart, and waiter-call workflows.

Designed for low-friction dine-in commerce, the app supports restaurant-scoped configuration via URL slug/ID, category-driven discovery, and an extensible store/context architecture ready for multi-location expansion.

## Features

- **QR-Ready Menu Discovery** â€” Category navigation, search, and rich dish detail with imagery, pricing, and availability sourced from Supabase.
- **Cart & Ordering Workspace** â€” Persistent cart state, quantity management, customizations, and order summary with responsive checkout flow.
- **Waiter Call & Table Services** â€” On-demand service requests (waiter calls with request fields) integrated with restaurant operations and Supabase migrations.
- **Restaurant-Scoped Theming** â€” Configurable per-restaurant identity via `VITE_RESTAURANT_SLUG` / `VITE_RESTAURANT_ID`, with tax and metadata migrations included.
- **Production-Grade UX** â€” Framer Motion transitions, Lottie animations, Tailwind styling, and optimized mobile viewport (`user-scalable=no`, themed color) for kiosk-like reliability.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 8, Wouter (routing), Framer Motion, Lottie React |
| Styling | Tailwind CSS 3, PostCSS, Autoprefixer, clsx + tailwind-merge |
| Data & Backend | Supabase JS 2.99 (Postgres, Auth, Realtime) |
| Utilities | date-fns, Lucide React (icons) |
| Build | Vite, ESLint |
| Hosting | Vercel (SPA rewrites), GitHub Pages compatible |

## Project Structure

```
qr-menu-app/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ App.jsx               # Application shell, routing (Wouter), providers
â”‚   â”œâ”€â”€ main.jsx              # Entry point
â”‚   â”œâ”€â”€ index.css             # Tailwind base and design tokens
â”‚   â”œâ”€â”€ assets/               # Static assets
â”‚   â”œâ”€â”€ components/           # Reusable UI components (menu cards, cart, modals)
â”‚   â”œâ”€â”€ pages/                # Route views (menu, cart, checkout, dish detail)
â”‚   â”œâ”€â”€ context/              # React context providers (cart, restaurant, theme)
â”‚   â”œâ”€â”€ store/                # State management (cart, menu, orders)
â”‚   â”œâ”€â”€ lib/                  # Supabase client, helpers
â”‚   â”œâ”€â”€ hooks/                # Custom hooks (menu, cart, supabase data)
â”‚   â”œâ”€â”€ utils/                # Formatting, pricing, helpers
â”‚   â””â”€â”€ graphify-out/         # Generated analysis artifacts
â”œâ”€â”€ services/                 # Extensibility layer for platform services
â”‚   â””â”€â”€ config/               # Environment and service bindings (SERVICE_* convention)
â”œâ”€â”€ public/                   # Static public assets (favicon, etc.)
â”œâ”€â”€ database_sql.md           # Full schema reference
â”œâ”€â”€ migration_*.sql           # Incremental migrations (taxes, waiter call fields)
â”œâ”€â”€ vite.config.js
â”œâ”€â”€ tailwind.config.js
â”œâ”€â”€ vercel.json               # SPA rewrite config
â””â”€â”€ package.json
```

> `services/` is reserved for optional platform integrations. Environment variables follow the `SERVICE_*` convention â€” `SERVICE_* (alias for AI_GATEWAY_* for backward compat)` where applicable.

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project (URL + anon key)
- Restaurant record configured in Supabase (slug + ID)

### Installation

```bash
npm install
cp .env.example .env
```

Configure `.env`:

```bash
VITE_SUPABASE_URL=your_database_url_here
VITE_SUPABASE_ANON_KEY=your_secret_here
VITE_RESTAURANT_SLUG=your_restaurant_slug_here
VITE_RESTAURANT_ID=your_restaurant_id_here
# Optional platform services
# SERVICE_API_KEY=your_service_key
# SERVICE_BASE_URL=https://api.example.com
# SERVICE_* (alias for AI_GATEWAY_* for backward compat)
```

### Development

```bash
npm run dev
```

Runs Vite at `http://localhost:5173` with HMR.

### Build

```bash
npm run build
npm run preview
```

Build outputs to `dist/` for production deployment.

## Deployment

### Vercel (Recommended)

`vercel.json` handles SPA rewrites for Wouter. Connect the repo â€” build command `npm run build`, output directory `dist`, framework Vite. Set `VITE_*` variables in project settings.

### GitHub Pages

1. Update `vite.config.js` `base` if serving from `https://gourab775.github.io/qr-menu-app/` (e.g., `base: '/qr-menu-app/'`).
2. Run `npm run build` and deploy `dist/` via `gh-pages` or Actions.

Live demo at `https://gourab775.github.io/qr-menu-app`.

### Supabase Setup

1. Create a new Supabase project.
2. Run `database_sql.md` SQL to create tables (restaurants, menus, orders, waiter_calls).
3. Apply migrations: `migration_restaurant_taxes.sql`, `migration_waiter_calls_add_request_fields.sql`.
4. Copy URL and anon key into `.env`.

## Customization

- **Branding & Theme** â€” Adjust `tailwind.config.js`, `src/index.css`, and `index.html` theme-color/meta for per-restaurant identity.
- **Menu & Categories** â€” Extend `src/components/` and `src/pages/` for custom layouts, filters, or featured sections; update Supabase schema per `database_sql.md`.
- **Cart & Checkout** â€” Modify `src/store/` and `src/context/` to add coupons, taxes (see `migration_restaurant_taxes.sql`), or payment providers.
- **Waiter & Table Services** â€” Enhance `migration_waiter_calls_add_request_fields.sql` and related UI to support new request types or table mapping.
- **Routing** â€” Add locations or admin routes via Wouter in `src/App.jsx`; integrate with the admin dashboard for operational management.

## License

MIT
