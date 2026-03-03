# Hannah Portfolio

Personal portfolio and blog built with **React + Vite**, content managed with a **self-hosted [Directus](https://directus.io) CMS** running in Docker.

## Tech Stack

- **Frontend**: React 19, Vite, Framer Motion, GSAP, Tailwind CSS, SCSS
- **CMS**: Directus (self-hosted) — open-source, runs in Docker next to the frontend
- **Database**: SQLite (inside the Directus container)

---

## Local Development

### 1. Start Directus CMS

```bash
# First time only — copy and fill in secrets
cp .env.directus.example .env.directus

docker compose up directus
```

Open **http://localhost:8055** and log in with the credentials from `.env.directus`.

**First-time collection setup:**
1. Go to **Settings → Data Model → Create Collection** named `articles`.
2. Add the fields listed in `directus/seed/seed_articles.mjs` (or import the schema snapshot once you export one).
3. Go to **Settings → Roles & Permissions → Public → articles → Enable Read**.

**Seed placeholder data** (requires a Directus API token):
```bash
DIRECTUS_URL=http://localhost:8055 \
DIRECTUS_TOKEN=<your-token> \
node directus/seed/seed_articles.mjs
```

### 2. Start the Frontend

Create a `.env` file at the project root (already done):
```
VITE_DIRECTUS_URL=http://localhost:8055
```

```bash
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**.

---

## Production (Docker)

Both services run in Docker:

```bash
docker compose up --build
```

| Service    | URL                          |
|------------|------------------------------|
| Frontend   | http://localhost:4173        |
| Directus   | http://localhost:8055        |

The frontend `VITE_DIRECTUS_URL` is baked-in at build time. To point at a remote Directus instance:

```bash
docker compose build --build-arg VITE_DIRECTUS_URL=https://cms.yourdomain.com frontend
```

---

## Project Structure

```
hannah-portfolio/
├── src/                    # React + Vite frontend
│   ├── directus.js         # Directus SDK client
│   └── container/
│       └── Portfolio/      # Article fetching (was Sanity, now Directus)
├── directus/
│   └── seed/
│       └── seed_articles.mjs   # Seed script for articles collection
├── docker-compose.yml      # Directus + frontend services
├── Dockerfile              # Multi-stage frontend build
└── .env.directus.example   # Directus secrets template
```
