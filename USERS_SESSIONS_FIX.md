# Users and Sessions loading fix

## Frontend behavior

Users and Sessions keep their table, filters and header visible when an API list request fails. The table displays **Data is not loaded**, plus a **Retry** button. The backend response message (or a connection error) appears in a toast. A successful empty response instead displays **No users found** or **No sessions found**. HTTP 401/403 still follow authorization handling, and 405 still opens the dedicated error page.

## Important Laravel API correction

The shared `DashboardService::getUsers()` and `getSessions()` methods return `LengthAwarePaginator` on success, not a response array containing `statuscode`.

Your current API controller code `return response()->json($result, $result['statuscode']);` can throw when a paginator is returned. This is a probable cause of your 500 errors on both lists. Fix the **API controller only**; the existing web controller and services can remain unchanged.

At the top of `app/Http/Controllers/Api/DashboardController.php`, import:

```php
use Illuminate\Pagination\LengthAwarePaginator;
```

Replace its `users()` and `sessions()` methods with:

```php
public function users(Request $request): JsonResponse
{
    $result = $this->dashboardService->getUsers(
        search: $request->search,
        status: $request->status,
        fromDate: $request->from_date,
        toDate: $request->to_date,
        order: $request->order ?? 'desc',
    );

    if ($result instanceof LengthAwarePaginator) {
        return response()->json([
            'success' => true,
            'statuscode' => 200,
            'message' => 'Users retrieved successfully.',
            'data' => $result,
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
}

public function sessions(Request $request): JsonResponse
{
    $result = $this->dashboardService->getSessions(
        status: $request->status,
        fromDate: $request->from_date,
        toDate: $request->to_date,
        order: $request->order ?? 'desc',
        search: $request->search,
    );

    if ($result instanceof LengthAwarePaginator) {
        return response()->json([
            'success' => true,
            'statuscode' => 200,
            'message' => 'Sessions retrieved successfully.',
            'data' => $result,
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
}
```

Afterwards, test `GET /api/v1/users` and `GET /api/v1/sessions` with a valid activation cookie and bearer token. Confirm both return HTTP 200 with a pagination object under `data`.

## Applying the frontend patch to an existing React project

Extract `OTP-Dashboard-Frontend-Patch.zip` to a temporary directory, then copy the files from its `OTP-Dashboard-Frontend/` directory into the root of your existing React project using `rsync -av`. No dependencies or package configuration have changed, so `npm install` is unnecessary for this patch. Restart `npm run dev` or refresh your browser.
