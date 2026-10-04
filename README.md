# ShowSpotter

Find concerts for artists you like, inside a travel window you can change on the fly (e.g. within a 3.5-hour flight, a 1-2 hour drive, or just the city you're in). Alerts you to new shows. Multi-user with passkey login; Spotify used to discover your artists.

Status: milestone 1 (skeleton). See [docs/SCOPE.md](docs/SCOPE.md) for the plan and [docs/DEPLOY.md](docs/DEPLOY.md) to run it.

## Stack
Next.js (PWA, mobile-first), MariaDB via Drizzle, Docker.

## Configuration
All secrets and anything identifying the deployment (domain, keys, DB credentials) live in a git-ignored `.env`. Copy `.env.example` to start.

## Develop
```sh
cp .env.example .env   # edit
npm install
npm run dev
```

MIT licensed.
