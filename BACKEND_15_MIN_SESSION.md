# Laravel changes required for a 15-minute inactivity timeout

The React patch tracks keyboard, pointer, touch, wheel and scroll activity and calls a lightweight authenticated heartbeat at most once every 60 seconds **only while a person is interacting**. Both the Laravel inactivity limit and its cache-entry lifetime must allow 15 minutes. Otherwise active users will still be logged out unexpectedly.

These are manual backend changes; this ZIP contains React files, not your Laravel project.

## 1. `app/Http/Middleware/Api/ApiAdminMiddleware.php`

Keep your existing role, token and missing-cache validation. Use 900 seconds for inactivity, and a 16-minute cache expiration. Ensure the cache timestamp is refreshed before `$next($request)`:

```php
$cacheKey = 'dashboard_api_last_seen:' . $token->getKey();
$lastSeen = Cache::get($cacheKey);

if ($lastSeen === null || (now()->timestamp - (int) $lastSeen) >= 900) {
    $token->delete();
    Cache::forget($cacheKey);

    return response()->json([
        'success' => false,
        'statuscode' => 401,
        'message' => 'Session expired due to inactivity.',
    ], 401);
}

Cache::put($cacheKey, now()->timestamp, now()->addMinutes(16));
$response = $next($request);
```

Retain the existing response-cache headers and `return $response`. Remove any second timestamp write after `$next()`; the snippet above is the only update required. The cache TTL is longer than the 15-minute inactivity window so a cache entry cannot silently disappear early.

## 2. `app/Services/AuthenticationService.php`

Inside `apiLogin()`, change the existing cache entry creation from `now()->addMinutes(2)` to:

```php
now()->addMinutes(16)
```

Keep the token creation, rollback and credential checks unchanged.

Inside `apiLogout()` clean up the cache entry when revoking a token:

```php
$tokenId = $token->getKey();
$token->delete();
Cache::forget('dashboard_api_last_seen:' . $tokenId);
```

You can add the following service method to satisfy the existing service-response, try/catch and error-log convention:

```php
public function apiHeartbeat(): array
{
    try {
        return [
            'success' => true,
            'statuscode' => 200,
            'message' => 'Session active.',
        ];
    } catch (\Throwable $e) {
        Log::channel('error')->error('API heartbeat failed.', [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]);

        return [
            'success' => false,
            'statuscode' => 500,
            'message' => 'Unable to check session.',
        ];
    }
}
```

The existing `api.admin` middleware actually authenticates, applies the inactivity limit, and refreshes the timestamp. This service method just gives React a small JSON response without querying dashboard charts.

## 3. `app/Http/Controllers/Api/AuthController.php`

Add:

```php
public function heartbeat(): JsonResponse
{
    $result = $this->authenticationService->apiHeartbeat();

    return response()->json($result, $result['statuscode']);
}
```

## 4. `routes/api.php`

Inside the **existing** group protected by `['auth:sanctum', 'api.admin']`, add:

```php
Route::get('/auth/heartbeat', [AuthController::class, 'heartbeat']);
```

The endpoint must also remain within the `api.application.activated` group. Do not create an unprotected heartbeat route.

## 5. Verification

Run `php artisan optimize:clear` and `php artisan route:list --path=api/v1/auth/heartbeat -v`.

Then test these cases:

1. Log in, and with an activation cookie and bearer token call `/api/v1/auth/heartbeat` — expect 200.
2. Keep interacting with React for longer than 2 minutes — you should stay logged in.
3. Keep interacting for longer than 15 minutes — you should stay logged in because the heartbeat refreshes the server timestamp.
4. Stop all interaction for at least 15 minutes — React should clear the token and return to Login; the next protected request using that old token will be rejected by Laravel.
5. Verify logout invalidates the token and leaves the activation cookie intact.

The frontend includes a temporary fallback to `GET /dashboard` when `/auth/heartbeat` does not exist. That fallback makes an expensive chart request and is not intended as the final configuration: implement this route before relying on the 15-minute policy.

The Laravel backend remains authoritative for authentication. A browser's 15-minute activity timer is a user-interface safeguard, not a replacement for backend token revocation.
