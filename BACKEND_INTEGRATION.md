# Laravel integration checklist

This frontend uses the API code shared for the Laravel Dashboard project. It is not a substitute for completing and securing the backend.

## 1. Existing routes

Expected relative to `/api/v1`:

```text
GET  /application/status       public; reads decrypted activation cookie
POST /application/activate     public; sets HttpOnly activation cookie
POST /auth/login               requires activation; issues Sanctum bearer token
POST /auth/signup              requires activation; SECURITY REVIEW REQUIRED
POST /auth/logout              requires activation + Sanctum + ADMIN
GET  /dashboard                requires activation + Sanctum + ADMIN
GET  /users                    requires activation + Sanctum + ADMIN
POST /users/{id}/block
POST /users/{id}/unblock
POST /users/{id}/bypass
POST /users/{id}/remove-bypass
GET  /users/export             Excel binary download
GET  /sessions
POST /sessions/{id}/terminate
POST /sessions/{id}/data-limit
GET  /sessions/export          Excel binary download
GET  /monitoring/status        200 healthy or 503 unhealthy, both JSON
POST /settings/data-limit
POST /settings/session-hours
```

## 2. Fix paginated list response wrappers

`DashboardService::getUsers()` and `getSessions()` return either `LengthAwarePaginator` or an error array. Current controller code does:

```php
return response()->json($result, $result['statuscode']);
```

A successful paginator doesn't have a `statuscode` field, and the service's invalid-date-range response is `['error' => '...']` without one. Handle the two cases explicitly and return a consistent JSON envelope:

```php
$result = $this->dashboardService->getUsers(/* existing arguments */);

if ($result instanceof \Illuminate\Pagination\LengthAwarePaginator) {
    return response()->json([
        'success' => true,
        'statuscode' => 200,
        'message' => 'Users retrieved successfully.',
        'data' => $result->toArray(),
    ], 200);
}

if (isset($result['error'])) {
    return response()->json([
        'success' => false,
        'statuscode' => 422,
        'message' => $result['error'],
    ], 422);
}

return response()->json($result, $result['statuscode'] ?? 500);
```

Apply the equivalent wrapping to `sessions()`.

The frontend understands both an envelope containing a Laravel paginator and a direct JSON Laravel paginator.

## 3. Complete a read-only Settings endpoint (optional initially)

Settings currently exposes update methods only. When a read endpoint is added, it should return the stored bytes and session hours, for example:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Settings retrieved successfully.",
  "data": {
    "session_data_limit": 5368709120,
    "session_hours": 24
  }
}
```

The data limit is expressed in **bytes for display**, while the update requests send **integer GB**:

```json
{"data_limit": 5}
```

Session duration update sends integer hours:

```json
{"session_hours": 24}
```

Until this endpoint exists, leave `VITE_SETTINGS_READ_ENDPOINT` blank. When implemented, configure it to `/monitoring/configuration` (or another matching route).

## 4. Signup must be secured

Current `AuthenticationService::createUser()` assigns `role_id => 1`, while the API signup endpoint is accessible to any browser with a valid activation cookie. That is an authorization vulnerability if role 1 is privileged, and should not be exposed to public users. **Do not set `VITE_ENABLE_SIGNUP=true` until signup is secured on the server.** A frontend switch is not security; the Laravel route/service must enforce appropriate permissions and role restrictions.

## 5. Login validation and token lifecycle

- Validate `username` and `password` with `required|string` in the API controller before calling typed service methods. This prevents null arguments causing a PHP `TypeError` and misleading 500 responses.
- Remove temporary `Log::debug` statements from API AuthController.
- On `apiLogout()`, delete the revoked token's `dashboard_api_last_seen:{tokenId}` cache entry as well.
- Keep the ADMIN role authorization and activation middleware in place.
- Reassess the intentionally configured 10-second inactivity policy for a human-facing dashboard.
- In `apiLogin()`, if an exception occurs after token creation, ensure the token gets revoked; initialization cleanup is already implemented, but user update can also fail afterward.

## 6. Dashboard response failures

`DashboardController::index()` always wraps the service result in a successful 200 response. Both `getDateData()` and `getChartData()` can return error arrays. Check service error results and return their non-200 codes before producing a successful dashboard envelope.

Default Dashboard request:

```http
GET /api/v1/dashboard?type=total&period=d
```

Expected successful envelope:

```json
{
  "success": true,
  "statuscode": 200,
  "message": "Dashboard data retrieved successfully.",
  "data": {
    "summary": {"type":"total","period":"d","download_data":0,"upload_data":0,"total_data":0},
    "chart": [{"time":"2026-10-17 09:00:00","download":0,"upload":0,"total":0}]
  }
}
```

## 7. Monitoring fixes

- Fix the Redis success-check typo `messege` to `message` in `HealthCheckService`. The frontend accepts either spelling during migration.
- Preserve HTTP 503 and the full `data` object when one or more dependencies are unhealthy. The frontend treats this as a legitimate monitoring result and displays each check.
- Ensure `config('services.health.php_fpm')` matches the deployed PHP-FPM service name, rather than relying on the `php8.5-fpm` default.

## 8. Fields and units

- `WifiUser`: `id`, `mac_address`, `phone_number`, `ip_address`, `last_login_at`, `download_bytes`, `upload_bytes`, `is_active`, `status`, `permanent_access`, `session_count`.
- `HotspotSession`: `id`, `mac`, `radius_username`, `ip`, `session_start`, `session_end`, `download_bytes`, `upload_bytes`, `data_limit`, `session_time`, `status`, `is_active`.
- `download_bytes`, `upload_bytes`, and `data_limit` are displayed as formatted bytes.
- All data-limit **inputs** send integer GB; the existing `convertGbToBytes(int $gb)` helper does not accept 2.5 GB. To allow fractional GB later, update and validate the backend first.
- The unit of `session_time` isn't established by the supplied code, so the frontend displays the backend value without appending an invented unit.
- Status filter options should be adjusted if the deployed database uses different string values than the common `active`, `blocked`, `bypassed`, `terminated`, `expired` labels.

## 9. Hosting and security

- Production: configure HTTPS, Secure HttpOnly activation cookies, correct SameSite, trusted proxy headers, and same-site `/api/v1` requests.
- Keep Laravel captive portal web routes (`/hotspot`) unchanged; there are intentionally no OTP verification APIs in this React frontend.
- BrowserRouter paths need SPA fallback routing (except `/api/*` and `/hotspot/*`).
- Do not log raw activation keys or bearer tokens; do not embed backend secrets in Vite variables.
