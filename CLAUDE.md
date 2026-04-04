# Todo List

AI-powered personal todo list with smart task sorting and time tracking.

## Tech Stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- Anthropic SDK for AI task sorting
- localStorage for data persistence
- Deployed on Vercel

## Development
```bash
npm run dev    # Start dev server on port 3000
npm run build  # Production build
npm run test   # Run vitest tests
```

## Environment
- `ANTHROPIC_API_KEY` - Required for AI sorting (set in .env.local or Vercel env vars)

## Architecture
- `src/lib/types.ts` - Type definitions
- `src/lib/store.ts` - localStorage-based state management
- `src/lib/dates.ts` - Todoist-style natural language date parsing
- `src/app/api/sort/route.ts` - AI sorting API route
- `src/app/page.tsx` - Main app (client component with Plan/Do modes)

## Deploy
```bash
vercel --prod
```
Requires ANTHROPIC_API_KEY set in Vercel environment variables.
