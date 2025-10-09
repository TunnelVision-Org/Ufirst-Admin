# Copilot Instructions for Ufirst-Admin

## Project Overview
This is the **Ufirst Admin Dashboard** - a Next.js 15 web application that serves as the administrative interface for the Ufirst mobile app. The project uses modern React 19 with TypeScript and Tailwind CSS v4.

## Architecture & Structure
- **Monorepo pattern**: Main application lives in `mainapp/ufirst/` (not project root)
- **Next.js App Router**: Uses the modern `src/app/` directory structure
- **Component-first**: React Server Components by default, Client Components when needed
- **TypeScript strict mode**: All files must be properly typed

## Development Workflow
```bash
cd mainapp/ufirst
npm run dev          # Start dev server with Turbopack
npm run build        # Production build with Turbopack  
npm run lint         # ESLint with Next.js rules
```

## Key Technologies & Patterns
- **Next.js 15.5.4** with Turbopack for fast builds/dev
- **React 19.1.0** with latest concurrent features
- **Tailwind CSS v4** with `@theme inline` configuration
- **TypeScript 5** with path aliases (`@/*` → `./src/*`)
- **Geist fonts** (sans & mono) loaded via `next/font/google`

## Styling Conventions
- Uses **Tailwind v4 syntax** with CSS custom properties
- Dark mode via `prefers-color-scheme` media query
- Font variables: `--font-geist-sans`, `--font-geist-mono`
- Color tokens: `--background`, `--foreground` with theme switching
- Apply styles with `className` using Tailwind utilities

## File Organization
```
src/app/
├── layout.tsx          # Root layout with fonts & metadata
├── page.tsx            # Homepage component
├── globals.css         # Global styles with Tailwind imports
└── favicon.ico
```

## Code Style
- **ESLint**: Extends `next/core-web-vitals` and `next/typescript`
- **Imports**: Use `@/` alias for src imports
- **Components**: Functional components with TypeScript interfaces
- **Async/await**: Prefer over promises for async operations
- **Image optimization**: Always use `next/image` for images

## Development Notes
- This appears to be early-stage (still has default Next.js boilerplate)
- Built for modern browsers (ES2017 target)
- Uses strict TypeScript configuration
- Turbopack enabled for faster development builds
- Project structure suggests this will expand into a full admin dashboard

## When Adding Features
- Create new pages in `src/app/` following App Router conventions
- Use Server Components by default, add `'use client'` only when needed
- Import images from `/public/` directory
- Follow the established font and color variable patterns
- Test responsive design (mobile-first with Tailwind breakpoints)