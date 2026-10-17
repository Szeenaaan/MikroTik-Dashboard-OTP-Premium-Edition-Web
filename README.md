# netddash — React Frontend

React 19 + TypeScript + Vite frontend for the Laravel 12 OTP / MikroTik management API.

## Features

- Light theme: white and sky blue (default)
- Dark theme: charcoal and green
- Global animated connected-network Canvas with neon blue/green hover and gently bending edges
- Responsive header, navigation sidebar, buttons, filters, action menus, dialogs, loading states, inline errors and toasts
- One-time browser activation via HttpOnly cookie and `GET /api/v1/application/status`
- Login by Laravel Sanctum bearer token; Login is the default tab, with Sign Up UI available
- Dashboard: selected-period download, upload and total cards, three-series Recharts traffic graph
- Users: search, date/status filters, sorting, pagination, block/unblock, bypass/remove bypass, Excel export
- Sessions: search, filters, sorting, pagination, Excel export, terminate, change session data limit in whole GB
- Monitoring: Nginx, PHP-FPM, Redis, RADIUS, scheduler, default/SMS workers
- Settings: update global data limit in whole GB and session duration in whole hours
- About page: application name, version, developer name, email, GitHub and copyright only
- Dedicated 401, 403, 404, 405 and 500 pages, with inline activation/login errors and toasts for routine action errors
- Users and Sessions list failures stay on their page with a visible table-level loading error, Retry button, and backend-message toast
- 15-minute user inactivity logout, with activity-triggered session heartbeats (requires Laravel changes in `BACKEND_15_MIN_SESSION.md`)

## Run locally

Prerequisites: Node.js 20.19+ or 22.12+; a running Laravel API with Sanctum and the application-activation cookie flow.

```bash
cd OTP-Dashboard-Frontend
cp .env.example .env
npm install
npm run dev
```

Open `http://127.0.0.1:5173/console/` (or the corresponding `/console/` address shown by Vite).

Run Laravel on the same machine at `http://127.0.0.1:8000`.

The Vite development proxy forwards `/api` to Laravel. Browsers see one origin for requests, so the HttpOnly activation cookie can be sent without a cross-origin-cookie workaround. Use **the same hostname** (`127.0.0.1` versus `localhost`) consistently. In production, Nginx serves the static frontend under `/console/` and keeps `/api/v1` routed to Laravel on the same HTTPS origin.

### Configuration

```dotenv
VITE_APP_BASE_PATH=/console/
VITE_LARAVEL_TARGET=http://127.0.0.1:8000
VITE_ENABLE_SIGNUP=false
VITE_SETTINGS_READ_ENDPOINT=
VITE_DEVELOPER_NAME=Sinan
VITE_CONTACT_EMAIL=
VITE_CONTACT_GITHUB=https://github.com/Szeenaaan
VITE_COPYRIGHT_TEXT=
```

- `VITE_APP_BASE_PATH`: Public React path under Nginx (default `/console/`); changing this path requires a rebuild. It is not a hostname.
- All application API requests use `/api/v1` on the current browser origin; individual modules provide endpoint paths only.
- `VITE_ENABLE_SIGNUP`: Keep **false** until the Laravel signup endpoint is secured against unauthorized privileged-user creation. The Sign Up tab is visible but will display a safe inline notice when disabled.
- `VITE_SETTINGS_READ_ENDPOINT`: Optional API path such as `/monitoring/configuration`, relative to `/api/v1`. Leave blank until Laravel implements a read endpoint with the expected JSON structure; otherwise the Settings page shows a placeholder for saved values and still allows updates.
- `VITE_DEVELOPER_NAME`: Name shown on About.
- `VITE_CONTACT_EMAIL`: Email shown on About. Until configured, the field displays a dash.
- `VITE_COPYRIGHT_TEXT`: Your exact copyright notice; field displays a dash until configured.
- `VITE_CONTACT_GITHUB`: GitHub profile linked from About.
- `VITE_LARAVEL_TARGET`: Used by Vite **dev server only**. Set the target URL for the local Laravel server.
- Do not put secrets in `VITE_` variables. They are publicly embedded in the frontend bundle.

### Session expiration

The frontend signs the user out after **15 minutes with no keyboard, mouse, touch, or scrolling activity**. While the user is active, React periodically calls `/auth/heartbeat` so the backend does not time out during normal use. **Laravel:** If you already changed the middleware timeout to 900 seconds and both cache lifetimes to 16 minutes, only the protected heartbeat endpoint and cache cleanup on logout remain to check in `BACKEND_15_MIN_SESSION.md`. Without the heartbeat, continuous UI interaction alone does not refresh Laravel inactivity time.

### Build

```bash
npm run typecheck
npm run build
npm run preview
```

`dist/` is the static deployment output. Build it and serve over HTTPS on the same site as Laravel. The frontend uses React Router under the `/console/` basename. See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) for the verified target structure and required Nginx configuration, preserving Laravel `/api` and `/hotspot`.

## Project modules

```text
src/
  api/                 Axios instance and endpoint wrappers
  background/          Global animated connected network
  components/common/   Buttons, cards, menus, badges, dialogs, pagination
  components/form/     Labeled inputs, password visibility, search and filters
  components/layout/   Header, sidebar, auth and dashboard layouts
  components/feedback/ Inline messages, toast notifications, loading/errors
  pages/               Activation, Auth, Dashboard, Users, Sessions,
                       Monitoring, Settings, About and Error
  routes/              Authentication route guards and error navigation
  services/            Auth state, token storage and download helper
  theme/               Theme provider and shared styles
  types/               Laravel API contracts
  utils/               Presentation/formatting helpers
```

## Routes

| React URL | Description |
| --- | --- |
| `/console/` | Auto-select Activation, Login or Dashboard |
| `/console/activate` | First-time browser activation |
| `/console/login` | Login (default) / Sign Up tabs |
| `/console/dashboard` | Usage summary and chart |
| `/console/users` | Wi-Fi user management |
| `/console/sessions` | Hotspot sessions |
| `/console/monitoring` | Infrastructure health |
| `/console/settings` | Default data/session limits |
| `/console/about` | Application name, version, developer, email, GitHub, copyright |
| `/console/error/401` | Unauthorized |
| `/console/error/403` | Forbidden |
| `/console/error/404` | Not Found |
| `/console/error/405` | Method Not Allowed |
| `/console/error/500` | Server Error |

## Authentication notes

- The activation key is sent only in the `POST /application/activate` request. React does **not** persist the generated activation token; Laravel stores it in an HttpOnly cookie.
- The browser calls `/application/status` to determine whether activation is valid and skips the activation form when already activated.
- Sanctum bearer token is stored in **sessionStorage** for the current browser tab. It persists across refreshes but is not durable across all browser restarts. JavaScript-accessible bearer tokens require XSS defenses and a production security review.
- Browser refresh with a stored token verifies it through the existing protected `/dashboard` API, avoiding an additional `/auth/me` endpoint.
- Requests that fail protected authentication go to 401, permission failures to 403, and server/method errors to 500/405; login/signup and activation failures remain inline. Ordinary resource-not-found failures are handled on the current page.
- The intended Laravel inactivity timeout is **900 seconds**. Set both middleware and login cache TTL to **16 minutes**, and add the protected heartbeat route as described in `BACKEND_15_MIN_SESSION.md`.

## Important backend integration checklist

See [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md) for required Laravel corrections and expected API response shapes. In particular, Users and Sessions list controllers currently assume an `array['statuscode']` even when the service returns a `LengthAwarePaginator` and will need to be fixed for those pages to load. Settings has no implemented read endpoint yet. Public signup is intentionally disabled by default until secured.

## Implementation/verification status

The source tree and UI logic are provided. Syntax parsing was checked locally with TypeScript's transpiler. **Dependency installation, full TypeScript type-checking, a production build, and live Laravel integration could not be completed in the generation environment**, so run the commands above in your local project and resolve any version/API mismatches that appear.

## Users / Sessions data-loading fix

See `USERS_SESSIONS_FIX.md` for the required Laravel API paginator-response correction and the frontend error behavior.


## Manual static production deployment

See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md). The private repo intentionally tracks `dist/` to allow an Ubuntu server to sparse-checkout ONLY compiled assets. Build and commit `dist/` for every release. API modules use relative paths via the shared `/api/v1` Axios client; no production domain is hardcoded.
