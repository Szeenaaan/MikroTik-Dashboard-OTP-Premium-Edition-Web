# netddash combined patch

Includes all files from the previous 15-minute session and branding cleanup patch, plus a simplified About page.

The About page now displays only:
- Application name: netddash
- Application version: from package.json
- Developer name: VITE_DEVELOPER_NAME (default Sinan)
- Email: VITE_CONTACT_EMAIL (blank until provided)
- GitHub: VITE_CONTACT_GITHUB
- Copyright: VITE_COPYRIGHT_TEXT (blank until provided)

IMPORTANT: This does not include a `.env` file. If you already have one in your React project, add the new variables manually (see .env.example). Vite needs a restart after editing .env.

Laravel: You reported setting inactivity to 900 seconds and cache lifetimes to 16 minutes. Check if the authenticated heartbeat route and logout cache cleanup are already implemented; if not, consult BACKEND_15_MIN_SESSION.md. Without heartbeat, active frontend interaction with no authenticated network request may still time out on the backend.

Install: unzip this patch and rsync the OTP-Dashboard-Frontend directory into your existing React project. Back up files before overwriting if you have local customizations.
