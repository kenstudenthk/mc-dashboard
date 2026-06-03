# Contexts

## Provider init order (wrap entire app in this order)

1. `PermissionProvider` — role-based access, auth state
2. `TutorProvider` — tutor mode toggle

## PermissionContext

Role hierarchy: `User (1) < Admin (2) < Global Admin (3) < Developer (4)`

Checks Supabase session on mount, then calls `VITE_API_PERMISSIONS_URL` with user email to
fetch role from SharePoint.

```ts
const { hasPermission, isAuthorized, loggedOut, forcePasswordChange, isPasswordRecovery } = usePermission();
hasPermission(2); // true if current user is Admin or higher
```

Auth state flags: `isAuthorized`, `loggedOut`, `forcePasswordChange`, `isPasswordRecovery`.

## TutorContext

`useTutor()` → `{ isTutorMode: boolean, isFeedbackMode: boolean, toggleTutorMode: () => void, toggleFeedbackMode: () => void }`

When `isTutorMode` is true, `TutorTooltip` wrappers become visible.
