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
- `start/model_serialization.ts` (first preload) makes snake_case properties actually
  reach the wire: Lucid's default strategy camelCases `serializedName`, so responses
  used to carry `firstName`/`isCompleted` while every frontend reads `first_name`.
  **Don't drop this preload** — and set `serializeAs` explicitly on any property whose
  wire name differs from its declaration (`Post.imageUrl` → `image_url`).
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

## AI agents (Claude Code and friends)

- **Check the CLIuno skills first**: `npx cliuno@latest skills status` — if any is
  `missing`/`outdated`, run `npx cliuno@latest skills install` (adds `.claude/skills/cliuno-*`:
  the generator workflow, the scaffold guide, and the shared REST contract).
- **Generate resources, don't hand-write them**:
  `npx cliuno@latest make:resource Product --fields name:string,price:number,inStock:boolean`
  creates `app/models/product.ts`, `database/migrations/<timestamp>_create_products_table.ts`, `app/controllers/products_controller.ts`, `app/validators/product.ts` and registers it in `start/routes.ts`, following this
  template's conventions and the `{status, message, data}` contract. `--dry-run` previews,
  re-running never duplicates registrations, `--force` overwrites.
- Single pieces: `make:model` (→ `node ace make:model`), `make:migration` (→ `node ace make:migration`), `make:controller` (→ `node ace make:controller`), `make:validator` (→ `node ace make:validator`). `npx cliuno@latest make` lists them.
- Then edit fields/business logic only, and run the gates above.
