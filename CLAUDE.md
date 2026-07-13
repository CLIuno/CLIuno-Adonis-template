# CLIuno AdonisJS template

AdonisJS 6 + Lucid (better-sqlite3) REST API serving the CLIuno contract: access-token
auth (refresh via `refresh`-ability tokens, reset, email verification, OTP), users,
todos, posts+comments, follows, roles — under `/api/v1`.

## Commands

```bash
node ace serve --hmr        # dev server (pnpm dev)
node ace migration:run      # sqlite tmp/db.sqlite3
node ace build              # production build
pnpm lint                   # oxlint
pnpm typecheck              # tsc --noEmit
```

`.env` requires `APP_KEY` (32+ chars), `PORT`, `HOST`, `LOG_LEVEL`, `NODE_ENV`, `TZ`.

## Structure

- `start/routes.ts` — the whole contract, grouped under `/api/v1`, auth'd group uses
  `middleware.auth()` (access-tokens guard).
- `app/controllers/` — one controller per resource; `app/models/` — Lucid models with
  **snake_case property names** (deliberate: serialization then matches the contract).
  Secret columns carry `serializeAs: null`. `otp_base32` needs its explicit
  `columnName` — Lucid's naming strategy would otherwise mangle it to `otp_base_32`.
- Lucid relations declare explicit `foreignKey` (`user_id`, `post_id`, `role_id`)
  because properties are snake_case.
- `app/services/totp.ts` — RFC 6238 TOTP (otpauth; note `hi-base32` is CJS —
  default-import it, named imports break under ESM).

## Contract rules this codebase follows

- Responses: `{status, message, data}` with exact keys (`data.users/user/todos/todo/`
  `posts/post/followers/following/isFollowing`, login `data.token` + `data.refreshToken`).
- Request keys: camelCase; `forgot-password` takes `email`.
- One-time tokens on the user row (`reset_token`, `verify_token`), lookup by token;
  the `user` role is `firstOrCreate` on registration.
- Refresh tokens are Sanctum-style access tokens with the `refresh` ability; refresh
  rotates the pair.

## Conventions

oxlint + AdonisJS prettier config; conventional commits (commitlint + husky).
