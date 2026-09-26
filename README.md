# SwimFlow AI

SwimFlow AI is a live meet operations platform for swim events, built to simplify roster management, timing workflows, spectator access, and post-event reporting for clubs, teams, and meet organizers.

This repository combines a production-style Next.js application with supporting operational tooling for meet creation, public portals, scoring workflows, and event automation. The focus is on delivering a polished, deployable product experience while keeping the underlying app logic traceable and maintainable.

## What this project includes

- Meet setup and dashboard flows for organizers
- Public spectator portals for meet pages and live status views
- Roster import, event personalization, and meet management workflows
- Stripe billing and product onboarding paths
- PWA-friendly client behaviors and offline-ready UI patterns
- AI-assisted summary generation for post-event recaps
- Real-time event, deck, and notification integrations across the app

## Tech stack

- Next.js 14
- TypeScript
- Supabase
- Stripe
- OpenAI
- Tailwind CSS

## Local development

### Requirements

- Node.js 18+
- npm
- A Supabase project
- Optional OpenAI and Stripe keys for full app functionality

### Setup

```bash
git clone https://github.com/tlqtlq/swimflow-ai.git
cd swimflow-ai
npm install
cp .env.example .env.local
npm run dev
```

Then open http://localhost:3000 to view the app.

### Environment variables

Use the provided template in [.env.example](.env.example) and fill in your own project values:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Repository structure

```text
app/                 # Next.js app routes and pages
components/          # UI and feature components
hooks/               # client-side hooks
lib/                 # shared logic and integrations
store/               # client state and event stores
supabase/            # schema and migrations
public/              # static assets and service worker files
scripts/             # local tooling and helpers
```

## Production checks

```bash
npm run lint
npm run build
```

## Roadmap

- tighten production deployment and security checks
- improve the event dashboard polish and accessibility
- add stronger automated testing around core meet flows
- expand reporting and automation for completed meets

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
