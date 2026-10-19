# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault: online games platform where players compete for the highest score. Developed with Spec Driven Design (`/spec` and `/spec-impl` skills, installed via `npx skills@latest add Klerith/fernando-skills`). The repo is still the fresh Create Next App scaffold (`app/page.tsx`, `app/layout.tsx`); no tests or test runner are configured.

## Next.js version caveat

Next.js 16.4.2 / React 19.3 with breaking changes versus common training data (see `AGENTS.md`). Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` (`01-app`, `02-pages`, `03-architecture`, `04-community`).

## Architecture notes

- App Router only (`app/`). Route props use the globally generated type helpers (e.g. `LayoutProps<"/">`) instead of hand-written types.
- `next.config.ts` enables `cacheComponents`, `partialPrefetching` and `experimental.agentFeedback`. `cacheComponents` changes caching/dynamic rendering semantics, so check the docs before using data fetching or caching APIs.
- Tailwind CSS v4 is wired through a Turbopack rule (`@tailwindcss/turbopack` loader for `*.css`) rather than PostCSS. Theme tokens live in `app/globals.css` (`@theme inline`, light/dark via `prefers-color-scheme`).
- Path alias `@/*` maps to the repo root.

## Skills
Usa siempre /frontend-design para diseñar la interfaz de usuario

## Supabase
Para cualquier tipo de creacion o modificacion relacinado con la base de datos de Supabase siempre crea las migraciones respectivas.