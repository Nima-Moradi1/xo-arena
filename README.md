# XO Arena

A full, modular, type-safe X-O / Tic-Tac-Toe fullstack website.

## Stack

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS, shadCN-style reusable UI components, light/dark mode via CSS variables and `next-themes`
- **Backend:** Node.js, Express, Socket.IO, TypeScript
- **Database:** MySQL via Prisma ORM
- **Auth:** Email/password, bcrypt password hashing, email verification, database-backed sessions, httpOnly cookies
- **Realtime:** Online multiplayer through Socket.IO rooms
- **PWA:** Android/iOS install support with manifest, service worker, icons, Apple web app metadata
- **Storage:** Local disk avatar uploads, no paid storage service required

## Folder structure

```txt
xo-arena/
  apps/
    web/                 # Next.js frontend
    server/              # Express + Socket.IO backend
  packages/
    db/                  # Prisma schema, client helper, seed
    shared/              # Shared Zod schemas, game engine, DTO/event types
```

## Requirements

- macOS with Node.js 22+ recommended
- pnpm via Corepack
- Local MySQL server installed and running

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

## 1. Create the MySQL database

Login to MySQL locally:

```bash
mysql -u root -p
```

Create a database:

```sql
CREATE DATABASE xo_arena CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Exit MySQL:

```sql
exit;
```

## 2. Configure environment variables

Copy the example env file:

```bash
cp .env.example .env
```

Edit `.env` and set your real MySQL credentials:

```env
DATABASE_URL="mysql://root:your_mysql_password@localhost:3306/xo_arena"
APP_ORIGIN="http://localhost:3000"
API_BASE_URL="http://localhost:4000"
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
NEXT_PUBLIC_SOCKET_URL="http://localhost:4000"
```

If your local root user has no password, use:

```env
DATABASE_URL="mysql://root:@localhost:3306/xo_arena"
```

## 3. Install dependencies

```bash
pnpm install
```

This project uses Prisma 7.8 with MySQL. Prisma 7 keeps the database URL in `packages/db/prisma.config.ts`, generates the client into `packages/db/generated/prisma`, and uses `@prisma/adapter-mariadb` at runtime.

## 4. Generate Prisma client and migrate MySQL

```bash
pnpm db:generate
pnpm db:migrate
```

`pnpm db:migrate` applies the checked-in Prisma migrations to MySQL. This avoids Prisma's shadow-database requirement, so it works with local users that only have access to the target database.

Optional seed users:

```bash
pnpm db:seed
```

Seed login accounts:

```txt
demo@xo.local / Password123!
rival@xo.local / Password123!
```

## 5. Run the full app

```bash
pnpm dev
```

Open:

```txt
http://localhost:3000
```

API health check:

```txt
http://localhost:4000/health
```

## Email verification setup

The app works without any paid email provider.

### Development mode with zero signup

Leave SMTP values empty in `.env`:

```env
SMTP_HOST=""
```

When a user signs up, the backend prints the verification link in the terminal. Copy it and open it in the browser.

### Real SMTP options

Use any SMTP provider you can access. The backend only needs these values:

```env
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your_username"
SMTP_PASS="your_password_or_api_key"
EMAIL_FROM="XO Arena <your@email.com>"
```

Free-friendly choices:

1. **Gmail SMTP with App Password**
   - Requires 2-Step Verification on the Google account.
   - Use the generated 16-digit app password as `SMTP_PASS`.
   - Common settings:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="yourgmail@gmail.com"
SMTP_PASS="your_16_digit_app_password"
EMAIL_FROM="XO Arena <yourgmail@gmail.com>"
```

2. **Brevo free SMTP**
   - Free plan is commonly enough for a portfolio/demo app.
   - Create a free account, open SMTP/API settings, copy SMTP server/login/key.

3. **Mailtrap free sandbox**
   - Best for testing because emails go to a test inbox, not real users.
   - Create a free sandbox inbox, copy SMTP credentials.

## How the auth flow works

1. User signs up with email, username, nickname, password.
2. Password is hashed with bcrypt.
3. User is saved as `isEmailVerified = false`.
4. A verification token is stored hashed in MySQL.
5. User opens the verification link.
6. Backend marks email verified.
7. User logs in.
8. Backend creates a database session and sends an **httpOnly** session cookie.
9. Frontend calls authenticated APIs using `credentials: "include"`.

## How online multiplayer works

- `POST /api/games/online/quick-match` joins the oldest waiting game or creates a new waiting game.
- `/play/[gameId]` opens a Socket.IO connection with the same httpOnly session cookie.
- The backend validates the cookie, joins the socket to the game room, validates turns, saves moves, and broadcasts the updated game state.

## PWA testing

1. Run `pnpm dev`.
2. Open Chrome DevTools > Application > Manifest.
3. Check that icons and service worker are registered.
4. On Android Chrome, use **Add to Home screen**.
5. On iOS Safari, use **Share > Add to Home Screen**.

For production PWA install on mobile, serve the website over HTTPS.

## GitHub publishing

```bash
git init
git add .
git commit -m "Build XO Arena fullstack app"
git branch -M main
git remote add origin git@github.com:YOUR_USERNAME/xo-arena.git
git push -u origin main
```

If SSH is blocked, use GitHub Desktop or HTTPS remote instead.

## Production notes

- Set `NODE_ENV="production"`.
- Use HTTPS for both frontend and backend.
- Set production `APP_ORIGIN`, `API_BASE_URL`, `NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_SOCKET_URL`.
- Keep `.env` out of Git.
- For separate frontend/backend domains, the backend already uses `SameSite=None; Secure` cookies in production.
- Local avatar uploads are fine for one server. For multi-server deployments, switch avatar storage to S3-compatible storage or a mounted volume.

## Useful scripts

```bash
pnpm dev              # web + server
pnpm build            # build all packages/apps
pnpm typecheck        # typecheck all packages/apps
pnpm db:generate      # generate Prisma client
pnpm db:migrate       # apply checked-in MySQL migrations
pnpm db:studio        # open Prisma Studio
pnpm db:seed          # create demo users
```
