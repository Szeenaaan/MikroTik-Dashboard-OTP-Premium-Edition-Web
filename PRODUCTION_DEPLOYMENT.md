# netddash – manual deployment from private Git repository

The React app and Laravel API are served on **one HTTPS origin**. No production hostname, IP, or DNS appears in React application code:

- Browser visits `https://<your-server-host>/console/` (hostname configured in Nginx only).
- React Router basename comes from `VITE_APP_BASE_PATH=/console/` at **build time**.
- Axios baseURL is `/api/v1`, and API modules call endpoints like `/dashboard` or `/auth/login`.
- Laravel continues to handle `/api/v1/*`, `/hotspot`, and existing PHP/web routes.
- Only the compiled `dist/` folder is served publicly. Node/npm are NOT needed on Ubuntu.

## First: create and commit the compiled build on Kali

In the React repository:

```bash
cp -n production.env.example .env.production
npm ci                         # requires package-lock.json committed
npm run build
# Confirm dist/index.html and dist/assets/ exist.
git status --short
# Review carefully: dist/ will be committed intentionally for this private repository.
git add .gitignore .env.example production.env.example vite.config.ts src/api/axiosClient.ts src/vite-env.d.ts PRODUCTION_DEPLOYMENT.md dist/
# If package-lock.json is untracked, also add it: git add package-lock.json
git commit -m "Prepare netddash production build for static Git deployment"
git push origin main
```

**Important:** A new `dist/` must be built AND committed/pushed with every frontend release. Pushing TSX source alone does not update the deployed application. Do not use `git add .` without reviewing staged files. Never commit `.env` or `.env.production`.

## On Ubuntu: clone ONLY the dist folder (sparse checkout)

Ensure the Ubuntu deployment user (`vmc`) has *read-only* access to the private repository, e.g. a GitHub SSH deploy key. Keep credentials out of Nginx's public directory. Run the clone as `vmc`, not root, and ensure `/var/www` permits creating that directory (or have an administrator create and `chown` it to `vmc` first).

```bash
# Clone once into a new directory using YOUR private GitHub URL.
# The server needs an authorized read-only SSH deploy key.
git clone --no-checkout --depth 1 --filter=blob:none --branch main YOUR_PRIVATE_GIT_URL /var/www/netddash-repo
cd /var/www/netddash-repo
git sparse-checkout init --no-cone
git sparse-checkout set '/dist/'
git checkout main
```

The example shows the directory convention; use the actual accessible private repository URL. Sparse checkout extracts just `dist/` rather than a full React working tree. Git metadata is still present in the private checkout directory.

Deploy only the compiled files to Nginx's static directory:

```bash
sudo install -d -m 755 /var/www/netddash
sudo rsync -av --delete /var/www/netddash-repo/dist/ /var/www/netddash/
sudo find /var/www/netddash -type d -exec chmod 755 {} +
sudo find /var/www/netddash -type f -exec chmod 644 {} +
```

For later versions:

```bash
cd /var/www/netddash-repo
git pull --ff-only origin main
sudo rsync -av --delete dist/ /var/www/netddash/
```

For safer releases, take a backup of `/var/www/netddash` before replacing the build. Do not expose `/var/www/netddash-repo` directly to Nginx.

## Nginx (same existing Laravel HTTPS server block)

Leave the Laravel document root and PHP-FPM locations untouched. Add before `location /`:

```nginx
location = /console {
    return 301 /console/;
}
location ^~ /console/ {
    alias /var/www/netddash/;
    index index.html;
    try_files $uri $uri/ /console/index.html;
}
```

Then:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

If you change the React path (e.g. `/portal/`), rebuild with `VITE_APP_BASE_PATH=/portal/` and change the Nginx locations accordingly. Changing DNS/hostname alone requires **no React rebuild**.

## Verification checklist

1. `/console/` renders React; `/console/dashboard` refresh succeeds (no Nginx 404).
2. Browser JS/CSS URLs begin `/console/assets/`, not `/assets/`.
3. Network tab: all application API requests begin `/api/v1/` on the SAME current hostname. No absolute backend hostname/IP is embedded.
4. Activation cookie survives access to `/console/`; login and heartbeat routes respond through Laravel.
5. `/hotspot` and `/api/v1/` still work after Nginx reload.
6. Confirm the production HTTPS cookie flags, Sanctum permissions, 15-minute inactivity timeout, and disabled public admin signup on Laravel.

Note: Laravel authentication endpoints and cookie settings must already work over HTTPS. The frontend cannot secure an unrestricted Laravel signup route.
