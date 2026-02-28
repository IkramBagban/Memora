# features/auth/frontend.md + backend.md

> Read `AGENT_CONTEXT.md` first.

---

## Overview

Auth is handled almost entirely by Supabase Auth. There is minimal custom backend code needed. This doc covers both frontend and backend since auth is tightly coupled.

---

## Frontend

### Screens

**`app/auth/login.tsx`**
```
Memora logo (text, green)
"Welcome back" heading

Email input
Password input
[Login] button (green pill, full width)
─────────
"Don't have an account?" [Sign up]
```

**`app/auth/signup.tsx`**
```
"Create account" heading

Email input
Password input (min 8 chars)
[Sign up] button
─────────
"Already have an account?" [Login]
```

**Auth gate (`app/_layout.tsx`):**
```ts
// On app start, check session
const { data: { session } } = await supabase.auth.getSession()

// If no session → redirect to /auth/login
// If session → redirect to /(tabs)/
```

### Supabase Client (`lib/supabase.ts`)

```ts
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

// Custom storage adapter using SecureStore (not AsyncStorage)
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```

### Auth Store (`stores/auth.store.ts`)

```ts
interface AuthStore {
  user: User | null
  session: Session | null
  isLoading: boolean

  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}
```

Listen to auth state changes:
```ts
supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.getState().setSession(session)
})
```

---

## Backend

No custom edge functions needed for auth. Supabase Auth handles:
- Email/password signup and login
- JWT generation and refresh
- Email verification (enable in Supabase dashboard)

### RLS is the backend

Every table has RLS enabled. The policies use `auth.uid()` to ensure users only see their own data. This is the primary authorization mechanism.

### Profile table (optional, for future)

If you want to store user preferences (notification preferences, email for reminders):
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  push_token TEXT,   -- Expo push token for notifications
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own profile"
  ON profiles FOR ALL USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Push Token Storage

When a user logs in and grants notification permission, save their Expo push token:
```ts
// After getting notification permission:
const token = await Notifications.getExpoPushTokenAsync()
await supabase.from('profiles').upsert({ id: user.id, push_token: token.data })
```


### Profile & settings screen (`app/profile.tsx`)

After login, users can open profile from the Home header.

Recommended profile/settings sections:
- **Account details**: email (read-only), editable display name
- **Security**: update password (min 8 chars)
- **Notifications**: show permission status and enable prompt
- **Session**: sign out action

Implementation notes:
- Use `supabase.auth.updateUser()` for display name and password updates
- Keep business logic in a `useProfile` hook, not directly in the component
- Show errors/success via alerts or toast; never fail silently
