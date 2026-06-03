# src/lib

## supabase.ts

Exports a single Supabase client singleton.

- **Anon key** (`VITE_SUPABASE_ANON_KEY`): used for all client-side auth operations (sign in, sign out, session checks).
- **Service role key** (`VITE_SUPABASE_SERVICE_ROLE_KEY`): optional, used only for admin operations (`inviteUser`, `deleteUser` in `authService.ts`). Never expose beyond Vite build-time injection.

## CODEOWNERS note

`src/lib/supabase.ts` is in `.github/CODEOWNERS`. Any PR modifying this file **requires human
approval** even if the auto-fix classifier marks it low-risk. Auth client configuration changes
can affect every user in production.
