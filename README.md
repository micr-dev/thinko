# thinko

`thinko` is a browser-based Windows XP desktop recreation running at [thinko.micr.dev](https://thinko.micr.dev).

It started from the `winXP` React desktop project, but this repo now contains the current custom site and deployment setup for the `micr-dev/thinko` GitHub repo and the Vercel project behind `thinko.micr.dev`.

## What it includes

- Windows XP-style desktop, windows, taskbar, and Start menu
- Custom desktop apps like `Paint`, `Winamp`, `My Pictures`, and `My Computer`
- 13 embedded browser-playable games (Touhou 1-5, Quake 3, ULTRAKILL, Syobon Action, Super Monkey Ball Jr., Portal 2D, Vampire Survivors, IWBTG, Nyan Cat)
- Paint submission flow with manual moderation
- Admin page for reviewing drawings and publishing commissions
- Mobile-first alternative experience (About, Drawings, Commissions, Paint sections) auto-triggered at <=820px viewport width; append `?desktop=1` to force the desktop experience on mobile
- Vercel-backed API routes for submissions, moderation, commissions, and image serving
- `demo/demo.gif` — animated preview of the desktop experience

## Live URLs

- Site: [https://thinko.micr.dev](https://thinko.micr.dev)
- Admin moderation: [https://thinko.micr.dev/admin/drawings](https://thinko.micr.dev/admin/drawings)
- Layout debug route: [https://thinko.micr.dev/layout](https://thinko.micr.dev/layout)

## Tech stack

- React 18
- `react-scripts`
- `styled-components`
- `webamp`
- Vercel Functions
- Vercel Blob
- GitHub OAuth for admin auth

## Local development

Install dependencies:

```bash
yarn install
```

Run the web app and local API together:

```bash
yarn start
```

That starts:

- CRA dev server on `http://localhost:3000` (react-scripts default; override with `PORT` env var)
- local API server on `http://127.0.0.1:4748`
- optional local agentation proxy on `http://127.0.0.1:4747` (see `AGENTATION_PROXY_TARGET` below)

Useful scripts:

```bash
yarn start
yarn start:web
yarn start:api
yarn build
yarn test
yarn lint
```

## Required environment variables

For production or full local API behavior, configure:

```bash
APP_BASE_URL
SESSION_SECRET
BLOB_READ_WRITE_TOKEN
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
GITHUB_ADMIN_LOGIN
NTFY_TOPIC
NTFY_BASE_URL
AGENTATION_PROXY_TARGET
```

Notes:

- `BLOB_READ_WRITE_TOKEN` is required for drawings and commissions storage.
- `GITHUB_*` values are required for `/admin/drawings`.
- `NTFY_*` is optional but used for new drawing notifications.
- `AGENTATION_PROXY_TARGET` routes `/agentation` traffic to a local agentation service (default: `http://127.0.0.1:4747`).

## Admin page

The admin page (`/admin/drawings`) provides:

- Pending drawing submissions queue with approve/reject actions
- Commission draft management (commission-drafts system stored in `src/admin/commission-drafts.json` and `public/custom/commission-drafts/`)
- Image uploads to catbox.moe for commission artwork
- Commission icon placement on the desktop grid via `WinXP/apps/commission-placement.json`

Auth is via GitHub OAuth (configured with `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `GITHUB_ADMIN_LOGIN`).

Users can draw inside the XP Paint app and submit artwork for review.

Current behavior:

- submission goes into a moderation queue, not straight to public view
- approved drawings appear in `My Pictures`
- commissions are published separately from the admin page and show up as desktop icons

## Repo structure

Key paths:

- [src/App.js](src/App.js) - route split between desktop, admin, and layout debug
- [src/app-mode.js](src/app-mode.js) - mobile/desktop experience switcher (`MOBILE_BREAKPOINT = 820`)
- [src/mobile-site/](src/mobile-site/) - mobile-first experience (About, Drawings, Commissions, Paint)
- [src/WinXP](src/WinXP) - desktop shell and apps
- [src/admin/DrawingsAdminPage.js](src/admin/DrawingsAdminPage.js) - admin moderation and commissions UI
- [src/admin/commission-drafts.json](src/admin/commission-drafts.json) - commission draft records
- [public/custom/commission-drafts/](public/custom/commission-drafts/) - commission artwork assets
- [api](api) - Vercel API handlers
- [server/index.js](server/index.js) - local Express API for development
- [public/custom](public/custom) - custom game, media, and desktop asset payloads
- [vercel.json](vercel.json) - Vercel routing and build config

## Deployment

This repo is intended to deploy from Vercel to `thinko.micr.dev`.

Current deployment model:

- static frontend build from CRA
- single Vercel API entrypoint in [api/index.js](api/index.js)
- Vercel Blob for image storage
- GitHub OAuth for admin login

The desktop shell also includes Tauri integration code (detected via `window.__TAURI__` / `window.__TAURI_INTERNALS__`) for potential future desktop builds, though the primary target is the Vercel web deployment.

## Notes

- This repo contains large binary assets for icons, music, and browser-playable games.
- Temporary local junk like `downloads/`, `opensrc/`, and ad hoc screenshots should not be committed.
- The codebase still carries some upstream naming from the original `winXP` project, but the repo target is now `micr-dev/thinko`.

## License

See [LICENSE](LICENSE).
