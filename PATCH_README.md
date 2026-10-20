# netddash — frontend cleanup patch

Apply file paths relative to your **Kali React repository root**, not `/var/www/otp-dashboard` (Laravel) and not `/var/www/netddash/` (compiled production output).

## What changes
- `src/pages/Auth/AuthPage.tsx`: hide Signup entirely unless `VITE_ENABLE_SIGNUP=true` at build time. No technical warnings or nonfunctional signup control in production. If signup is enabled only after securing Laravel `/api/v1/auth/signup`, its actual API success/failure `message` is shown as a toast.
- `src/pages/Activation/ActivationPage.tsx`: remove extra explanatory text; show actual backend activation success/failure messages as toast.
- `src/pages/Settings/SettingsPage.tsx`: change allowed defaults to **1–100 GB** and **1–24 hours**; remove the developer-facing read-endpoint warning and unset-value placeholders. An actual read failure shows a user-facing error. Existing session durations are unchanged.
- `src/pages/Sessions/SessionsPage.tsx`: allow existing session data-limit adjustment **1–100 GB**, not session duration.
- `src/pages/Dashboard/DashboardPage.tsx`: chart has only Download + Upload lines; total summary card remains.
- `src/utils/errorMessage.ts`: show Laravel response `message`, falling back to validation errors, then a short generic message.
- `src/services/authService.tsx` and mutation API modules: treat `success: false` as an error even if Laravel returns HTTP 200; show Laravel `message` instead of reporting false success.
- `src/api/usersApi.ts` and `src/api/sessionsApi.ts`: don't mention the API controller in user-facing errors.

## URLs (unchanged)
- React app: `https://hotspot.vmc.local/console/`
- API: same-origin `/api/v1` (e.g. `/api/v1/auth/login`, `/api/v1/application/activate`)
- Existing captive portal: `/hotspot`

## Important security behavior
`VITE_ENABLE_SIGNUP=false` (default) means there is **no Signup button, tab, or form**. This is intentional because exposing public account creation requires secured Laravel authorization. The patch **does not** make backend signup public or create an endpoint. Set `VITE_ENABLE_SIGNUP=true` only once the Laravel route and access policy have been verified.

The read API route for Settings is still optional via `VITE_SETTINGS_READ_ENDPOINT` because no verified route has been provided. This patch does not invent an endpoint. The existing POST routes remain unchanged.

## Install locally (Kali)
From the directory containing `package.json`, copy these patched files into matching `src/...` paths. Do not copy `FRONTEND_CLEANUP_PATCH.md` if you don't want it in your project.

Build with your existing `.env.production` including:

```env
VITE_APP_BASE_PATH=/console/
VITE_ENABLE_SIGNUP=false
```

Then:

```bash
npm run build
git add src/ dist/
git commit -m "Clean up frontend forms and settings validation"
git push origin main
```

`dist/` is tracked intentionally in your deployment workflow. On Ubuntu, pull the sparse Git checkout and copy compiled files:

```bash
cd /var/www/netddash-repo
git pull --ff-only origin main
sudo rsync -av --delete dist/ /var/www/netddash/
```

No Nginx, MikroTik DNS, SSL, or Laravel changes are needed for this UI patch.
