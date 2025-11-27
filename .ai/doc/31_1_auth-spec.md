# Specyfikacja architektury autentykacji - ShopMate MVP

**Dokument:** Techniczna specyfikacja modułu autentykacji
**Wersja:** 1.0
**Data:** 2025-01-25
**Autor:** System AI (na podstawie wymagań z 4_prd.md)

---

## 1. PRZEGLĄD OGÓLNY

### 1.1 Cel dokumentu

Dokument opisuje szczegółową architekturę systemu autentykacji i autoryzacji użytkowników w aplikacji ShopMate, obejmującą:
- Rejestrację nowych użytkowników (US-001)
- Logowanie istniejących użytkowników (US-002)
- Reset i odzyskiwanie hasła (US-003)
- Wylogowanie użytkownika (US-004)
- Ochronę tras przed nieautoryzowanym dostępem (US-005)

### 1.2 Zakres funkcjonalny

**W zakresie MVP:**
- Autentykacja email + hasło przez Supabase Auth
- Sesje oparte na httpOnly cookies
- Middleware do ochrony tras server-side
- Walidacja danych wejściowych (Zod schemas)
- Komunikaty błędów w języku polskim
- Responsywny interfejs (mobile-first)

**Poza zakresem MVP:**
- OAuth (Google, Facebook) - roadmap v1.1
- Uwierzytelnianie dwuskładnikowe (2FA) - roadmap v1.1
- Weryfikacja email - opcjonalna, można pominąć w MVP
- Logowanie przez SMS/Magic Link - roadmap v1.1

### 1.3 Kontekst technologiczny

- **Frontend:** Astro 5 (SSR mode) + React 18 + TypeScript 5
  - **Uwaga:** PRD błędnie wspomina React 19. Projekt używa React 18 zgodnie z CLAUDE.md
- **Backend:** Supabase Auth + PostgreSQL + Row Level Security
- **Routing:** Astro file-based routing (src/pages/)
- **Styling:** Tailwind CSS 4 + Shadcn/ui
- **Walidacja:** Zod schemas
- **Hosting:** Vercel (Node.js adapter, standalone mode)
- **Security:** HTTPS, httpOnly cookies, CSRF protection, RLS policies

---

## 2. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 2.1 Struktura stron i komponentów

#### 2.1.1 Nowe strony Astro (src/pages/)

**A. Strona rejestracji: `/register`**

```
src/pages/register.astro
```

**Odpowiedzialność:**
- Renderowanie formularza rejestracji (server-side)
- Sprawdzenie czy użytkownik jest już zalogowany (jeśli tak → redirect do /dashboard)
- Dostarczenie komponentu React z formularzem
- Obsługa przekierowań po pomyślnej rejestracji

**Struktura:**
```astro
---
// Server-side logic
import AuthLayout from '@/layouts/AuthLayout.astro';
import RegisterView from '@/components/auth/RegisterView.tsx';

// Check if user is already authenticated
const { data: { session } } = await Astro.locals.supabase.auth.getSession();
if (session) {
  return Astro.redirect('/dashboard');
}
---

<AuthLayout title="Rejestracja - ShopMate">
  <RegisterView client:load />
</AuthLayout>
```

**Routing:**
- URL: `/register`
- Query params: `?redirect=/calendar` (opcjonalnie, dla przekierowania po rejestracji)
- Publiczna trasa (dostępna bez logowania)

---

**B. Strona logowania: `/login`**

```
src/pages/login.astro
```

**Odpowiedzialność:**
- Renderowanie formularza logowania
- Sprawdzenie czy użytkownik jest już zalogowany (redirect do /dashboard)
- Obsługa query param `?redirect` dla przekierowania po zalogowaniu
- Linki do `/register` i `/reset-password`

**Struktura:**
```astro
---
import AuthLayout from '@/layouts/AuthLayout.astro';
import LoginView from '@/components/auth/LoginView.tsx';

const { data: { session } } = await Astro.locals.supabase.auth.getSession();
if (session) {
  return Astro.redirect('/dashboard');
}

// Get redirect URL from query params (for protected routes)
const redirectUrl = Astro.url.searchParams.get('redirect') || '/dashboard';
---

<AuthLayout title="Logowanie - ShopMate">
  <LoginView client:load redirectUrl={redirectUrl} />
</AuthLayout>
```

**Routing:**
- URL: `/login`
- Query params: `?redirect=/calendar` (opcjonalnie)
- Publiczna trasa

---

**C. Strona resetowania hasła: `/reset-password`**

```
src/pages/reset-password.astro
```

**Odpowiedzialność:**
- Renderowanie formularza żądania resetu hasła (email input)
- Informacja o wysłaniu linku resetującego
- Obsługa przekierowań z linku w emailu

**Struktura:**
```astro
---
import AuthLayout from '@/layouts/AuthLayout.astro';
import ResetPasswordView from '@/components/auth/ResetPasswordView.tsx';

// Check if this is a password reset callback (from email link)
const accessToken = Astro.url.searchParams.get('access_token');
const type = Astro.url.searchParams.get('type');
const isResetCallback = type === 'recovery' && accessToken;
---

<AuthLayout title="Reset hasła - ShopMate">
  <ResetPasswordView
    client:load
    isResetCallback={isResetCallback}
  />
</AuthLayout>
```

**Routing:**
- URL: `/reset-password` (żądanie resetu)
- URL: `/reset-password?access_token=XXX&type=recovery` (callback z email)
- Publiczna trasa

---

**D. Modyfikacja Landing Page: `/`**

```
src/pages/index.astro
```

**Modyfikacje:**
- Dodanie przycisku "Zaloguj się" i "Zarejestruj się" w nawigacji
- Jeśli użytkownik zalogowany → redirect do `/dashboard`
- CTA (Call To Action) prowadzące do `/register`

**Przykładowa struktura:**
```astro
---
// Check if user is logged in
const { data: { session } } = await Astro.locals.supabase.auth.getSession();
if (session) {
  return Astro.redirect('/dashboard');
}
---

<Layout title="ShopMate - Inteligentny planer posiłków">
  <!-- Hero section -->
  <section class="hero">
    <h1>Zaplanuj posiłki w mniej niż 10 minut</h1>
    <p>ShopMate pomaga tworzyć listy zakupów z przepisów w kalendarzu</p>
    <div class="cta-buttons">
      <a href="/register" class="btn-primary">Rozpocznij za darmo</a>
      <a href="/login" class="btn-secondary">Zaloguj się</a>
    </div>
  </section>

  <!-- Features, pricing, etc. -->
</Layout>
```

---

#### 2.1.2 Nowy Layout: AuthLayout.astro

**Lokalizacja:** `src/layouts/AuthLayout.astro`

**Odpowiedzialność:**
- Layout dedykowany dla stron autentykacji (login, register, reset)
- Centrowane formularze z logo
- Minimalistyczny design (bez pełnej nawigacji)
- Responsywny (mobile-first)

**Struktura:**
```astro
---
import '../styles/global.css';

interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <title>{title}</title>
  </head>
  <body class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <a href="/" class="inline-block">
          <h1 class="text-3xl font-bold text-primary">ShopMate</h1>
        </a>
      </div>

      <!-- Auth form content -->
      <div class="bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <slot />
      </div>

      <!-- Footer link to home -->
      <div class="text-center mt-6">
        <a href="/" class="text-sm text-gray-600 hover:text-gray-900">
          ← Powrót do strony głównej
        </a>
      </div>
    </div>
  </body>
</html>
```

**Kluczowe cechy:**
- Responsywny container (max-w-md dla desktop, full width na mobile z padding)
- Centrowanie vertical + horizontal
- Logo klikalne (prowadzi do landing page)
- Białe tło formularza z cieniem
- Minimalistyczna nawigacja

---

#### 2.1.3 Nowe komponenty React (src/components/auth/)

**A. RegisterView.tsx**

**Lokalizacja:** `src/components/auth/RegisterView.tsx`

**Odpowiedzialność:**
- Formularz rejestracji (email, hasło, potwierdzenie hasła)
- Walidacja client-side (real-time)
- Wywołanie Supabase Auth API
- Obsługa błędów i sukcesu
- Loading states
- Toast notifications

**Interfejs:**
```tsx
interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterView() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const validation = registerSchema.safeParse(formData);
    if (!validation.success) {
      setErrors(validation.error.flatten().fieldErrors);
      return;
    }

    setIsLoading(true);

    // Call Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    // Success - redirect to dashboard
    toast.success('Witaj w ShopMate! Twoje konto zostało utworzone.');
    window.location.href = '/dashboard';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Utwórz konto</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email field */}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="twoj@email.pl"
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-red-600 mt-1">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password field */}
        <div>
          <Label htmlFor="password">Hasło</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-red-600 mt-1">
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm password field */}
        <div>
          <Label htmlFor="confirmPassword">Powtórz hasło</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
          />
          {errors.confirmPassword && (
            <p id="confirm-password-error" className="text-sm text-red-600 mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Tworzę konto...' : 'Zarejestruj się'}
        </Button>
      </form>

      {/* Link to login */}
      <p className="text-center text-sm text-gray-600 mt-4">
        Masz już konto?{' '}
        <a href="/login" className="text-primary hover:underline">
          Zaloguj się
        </a>
      </p>
    </div>
  );
}
```

**Walidacja:**
- Email: format email, lowercase, trim
- Hasło: 8-100 znaków, minimum 1 wielka litera, 1 cyfra (zgodnie z US-001)
- Potwierdzenie hasła: musi być identyczne z hasłem
- Real-time validation podczas wpisywania (debounce 300ms)

**Komunikaty błędów:**
- Inline pod każdym polem
- Toast notification dla błędów serwera
- Polski język

---

**B. LoginView.tsx**

**Lokalizacja:** `src/components/auth/LoginView.tsx`

**Props:**
```tsx
interface LoginViewProps {
  redirectUrl?: string; // URL do przekierowania po zalogowaniu
}
```

**Odpowiedzialność:**
- Formularz logowania (email, hasło)
- Walidacja client-side
- Wywołanie Supabase Auth API
- Przekierowanie do `redirectUrl` lub `/dashboard`
- Linki do `/register` i `/reset-password`

**Struktura:**
```tsx
export default function LoginView({ redirectUrl = '/dashboard' }: LoginViewProps) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const validation = loginSchema.safeParse(formData);
    if (!validation.success) {
      setErrors(validation.error.flatten().fieldErrors);
      return;
    }

    setIsLoading(true);

    // Call Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      toast.error('Nieprawidłowy email lub hasło');
      setIsLoading(false);
      return;
    }

    // Success - redirect
    window.location.href = redirectUrl;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Zaloguj się</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email field */}
        {/* Password field */}
        {/* Submit button */}
      </form>

      {/* Links */}
      <div className="space-y-2 mt-4">
        <p className="text-center text-sm">
          <a href="/reset-password" className="text-primary hover:underline">
            Nie pamiętam hasła
          </a>
        </p>
        <p className="text-center text-sm text-gray-600">
          Nie masz konta?{' '}
          <a href="/register" className="text-primary hover:underline">
            Zarejestruj się
          </a>
        </p>
      </div>
    </div>
  );
}
```

**Walidacja:**
- Email: format email
- Hasło: minimum 8 znaków (basic check)

---

**C. ResetPasswordView.tsx**

**Lokalizacja:** `src/components/auth/ResetPasswordView.tsx`

**Props:**
```tsx
interface ResetPasswordViewProps {
  isResetCallback: boolean; // Czy to callback z email?
}
```

**Odpowiedzialność:**
- **Tryb 1:** Formularz żądania resetu (email input) → wysłanie email z linkiem
- **Tryb 2:** Formularz ustawiania nowego hasła (po kliknięciu w link w email)

**Struktura:**
```tsx
export default function ResetPasswordView({ isResetCallback }: ResetPasswordViewProps) {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Tryb 1: Request password reset
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error('Nie udało się wysłać emaila. Sprawdź adres email.');
      setIsLoading(false);
      return;
    }

    setEmailSent(true);
    toast.success('Link do resetowania hasła został wysłany na email');
  };

  // Tryb 2: Update password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Hasła nie są identyczne');
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast.error('Nie udało się zmienić hasła');
      setIsLoading(false);
      return;
    }

    toast.success('Hasło zostało zmienione');
    window.location.href = '/login';
  };

  // Render based on mode
  if (isResetCallback) {
    return (
      <div>
        <h2>Ustaw nowe hasło</h2>
        <form onSubmit={handleUpdatePassword}>
          {/* New password fields */}
        </form>
      </div>
    );
  }

  if (emailSent) {
    return (
      <div className="text-center">
        <h2>Sprawdź swoją skrzynkę email</h2>
        <p>Wysłaliśmy link do resetowania hasła na adres {email}</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Resetuj hasło</h2>
      <form onSubmit={handleRequestReset}>
        {/* Email field */}
      </form>
    </div>
  );
}
```

**Flow:**
1. Użytkownik wchodzi na `/reset-password` → widzi formularz z email input
2. Po wysłaniu → Supabase wysyła email z linkiem
3. Link prowadzi do `/reset-password?access_token=XXX&type=recovery`
4. Komponent wykrywa `isResetCallback=true` → pokazuje formularz nowego hasła
5. Po zmianie → przekierowanie do `/login`

---

### 2.2 Modyfikacje istniejących komponentów

#### 2.2.1 Layout.astro - dodanie nawigacji z przyciskiem wylogowania

**Lokalizacja:** `src/layouts/Layout.astro`

**Modyfikacje:**
- Dodanie komponentu `<Navigation />` z przyciskiem "Wyloguj" dla zalogowanych użytkowników
- Przekazanie informacji o sesji do komponentu nawigacji

**Nowa struktura:**
```astro
---
import '../styles/global.css';
import Navigation from '@/components/Navigation.tsx';

interface Props {
  title?: string;
}

const { title = "ShopMate" } = Astro.props;

// Get session for navigation
const { data: { session } } = await Astro.locals.supabase.auth.getSession();
const user = session?.user || null;
---

<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <title>{title}</title>
  </head>
  <body>
    <Navigation client:load user={user} />

    <main class="container mx-auto px-4 py-8">
      <slot />
    </main>
  </body>
</html>
```

---

#### 2.2.2 Navigation.tsx - nowy komponent nawigacji

**Lokalizacja:** `src/components/Navigation.tsx`

**Props:**
```tsx
interface NavigationProps {
  user: {
    id: string;
    email: string;
  } | null;
}
```

**Odpowiedzialność:**
- Wyświetlanie menu nawigacji (Desktop + Mobile hamburger)
- Przycisk "Wyloguj" dla zalogowanych użytkowników
- Przycisk "Zaloguj się" / "Zarejestruj się" dla niezalogowanych

**Struktura:**
```tsx
export default function Navigation({ user }: NavigationProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error('Nie udało się wylogować');
      setIsLoading(false);
      return;
    }

    toast.success('Zostałeś wylogowany');
    window.location.href = '/login';
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href={user ? '/dashboard' : '/'} className="text-2xl font-bold text-primary">
            ShopMate
          </a>

          {/* Desktop Navigation */}
          {user ? (
            <div className="hidden md:flex items-center space-x-6">
              <a href="/dashboard" className="hover:text-primary">Dashboard</a>
              <a href="/recipes" className="hover:text-primary">Przepisy</a>
              <a href="/calendar" className="hover:text-primary">Kalendarz</a>
              <a href="/shopping-lists" className="hover:text-primary">Listy zakupów</a>

              <Button
                onClick={handleLogout}
                variant="outline"
                disabled={isLoading}
              >
                {isLoading ? 'Wylogowuję...' : 'Wyloguj'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <a href="/login">
                <Button variant="outline">Zaloguj się</Button>
              </a>
              <a href="/register">
                <Button>Zarejestruj się</Button>
              </a>
            </div>
          )}

          {/* Mobile hamburger */}
          {/* ... */}
        </div>
      </div>
    </nav>
  );
}
```

**Kluczowe cechy:**
- Responsywny (desktop horizontal menu, mobile hamburger)
- Wylogowanie przez `supabase.auth.signOut()`
- Loading state na przycisku wylogowania
- Toast notification po wylogowaniu
- Przekierowanie do `/login` po wylogowaniu

---

### 2.3 Walidacja i komunikaty błędów

#### 2.3.1 Schematy walidacji Zod

**Lokalizacja:** `src/lib/validation/auth.schema.ts`

```typescript
import { z } from 'zod';

/**
 * Base email schema (used in all auth forms)
 */
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Nieprawidłowy format adresu email');

/**
 * Base password schema
 * Requirements: 8-100 chars, min 1 uppercase, min 1 digit
 */
const passwordSchema = z
  .string()
  .min(8, 'Hasło musi mieć minimum 8 znaków')
  .max(100, 'Hasło może mieć maksimum 100 znaków')
  .regex(/[A-Z]/, 'Hasło musi zawierać minimum 1 wielką literę')
  .regex(/[0-9]/, 'Hasło musi zawierać minimum 1 cyfrę');

/**
 * Register schema with password confirmation
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Hasła nie są identyczne',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Login schema (simpler - no password complexity check)
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Hasło jest wymagane'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Reset password request schema
 */
export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});

export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;

/**
 * Update password schema (after reset link)
 */
export const updatePasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Hasła nie są identyczne',
    path: ['confirmPassword'],
  });

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
```

**Kluczowe zasady:**
- Email: lowercase, trim, format email
- Hasło: 8-100 znaków, min 1 wielka litera, min 1 cyfra
- Wszystkie komunikaty w języku polskim
- Reużywalność (emailSchema, passwordSchema jako base)

---

#### 2.3.2 Komunikaty błędów

**Kategorie komunikatów:**

**A. Błędy walidacji (client-side):**
- Wyświetlane inline pod polami formularza
- Czerwony tekst (text-red-600)
- ARIA: `aria-describedby` powiązane z polem input
- Real-time (podczas wpisywania z debounce 300ms)

**Przykłady:**
- "Nieprawidłowy format adresu email"
- "Hasło musi mieć minimum 8 znaków"
- "Hasła nie są identyczne"

**B. Błędy API (server-side):**
- Wyświetlane jako toast notifications (Shadcn/ui Toast)
- Komunikaty w języku polskim
- Mapowanie błędów Supabase na user-friendly messages

**Mapowanie błędów Supabase:**

| Kod błędu Supabase | User-friendly komunikat (PL) |
|-------------------|------------------------------|
| `invalid_credentials` | "Nieprawidłowy email lub hasło" |
| `email_exists` | "Konto z tym adresem email już istnieje" |
| `weak_password` | "Hasło jest zbyt słabe" |
| `invalid_email` | "Nieprawidłowy adres email" |
| `user_not_found` | "Nie znaleziono użytkownika o tym adresie email" |
| Network error | "Brak połączenia. Sprawdź internet i spróbuj ponownie." |
| Other errors | "Coś poszło nie tak. Spróbuj ponownie za chwilę." |

**C. Komunikaty sukcesu:**
- Toast notifications (zielone)
- Wyświetlane po pomyślnych akcjach

**Przykłady:**
- "Witaj w ShopMate! Twoje konto zostało utworzone."
- "Zostałeś pomyślnie zalogowany"
- "Hasło zostało zmienione"
- "Zostałeś wylogowany"

---

### 2.4 Obsługa najważniejszych scenariuszy

#### Scenariusz 1: Nowy użytkownik rejestruje się

**Flow:**
1. Użytkownik wchodzi na `/register`
2. Server sprawdza sesję → brak sesji → renderuje formularz
3. Użytkownik wypełnia: email, hasło, potwierdzenie hasła
4. Client-side validation (Zod) → błędy inline
5. Po poprawnej walidacji → `supabase.auth.signUp()`
6. Supabase tworzy konto + automatycznie loguje
7. Toast: "Witaj w ShopMate! Twoje konto zostało utworzone."
8. Redirect do `/dashboard`

**Edge cases:**
- Email już istnieje → Toast: "Konto z tym adresem email już istnieje"
- Słabe hasło → Validation error inline
- Network error → Toast: "Brak połączenia..."

---

#### Scenariusz 2: Użytkownik loguje się

**Flow:**
1. Wejście na `/login` (lub redirect z chronionej trasy `/calendar?redirect=/calendar`)
2. Server sprawdza sesję → brak → renderuje formularz z `redirectUrl=/calendar`
3. Użytkownik wypełnia email + hasło
4. `supabase.auth.signInWithPassword()`
5. Sukces → Redirect do `redirectUrl` (lub `/dashboard` jeśli brak)
6. Błąd → Toast: "Nieprawidłowy email lub hasło"

**Edge cases:**
- Konto nie istnieje → ten sam komunikat (security: nie ujawniamy czy email istnieje)
- Już zalogowany → redirect do `/dashboard` (server-side check na początku)

---

#### Scenariusz 3: Użytkownik resetuje hasło

**Flow - Część 1: Request reset**
1. Wejście na `/reset-password`
2. Formularz z email input
3. Wysłanie → `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/reset-password' })`
4. Toast: "Link do resetowania hasła został wysłany na email"
5. Wyświetlenie komunikatu: "Sprawdź swoją skrzynkę email"

**Flow - Część 2: Update password**
6. Użytkownik klika link w email → redirect do `/reset-password?access_token=XXX&type=recovery`
7. Server wykrywa `type=recovery` → przekazuje `isResetCallback=true`
8. Komponent renderuje formularz nowego hasła
9. Użytkownik wpisuje nowe hasło + potwierdzenie
10. `supabase.auth.updateUser({ password: newPassword })`
11. Toast: "Hasło zostało zmienione"
12. Redirect do `/login`

**Edge cases:**
- Email nie istnieje → Supabase wysyła pusty email (security: nie ujawniamy czy email istnieje)
- Link wygasł (po 24 godzinach - zgodnie z US-003) → Toast: "Link resetujący wygasł. Poproś o nowy."

---

#### Scenariusz 4: Użytkownik wylogowuje się

**Flow:**
1. Kliknięcie przycisku "Wyloguj" w nawigacji
2. `supabase.auth.signOut()`
3. Usunięcie sesji z cookies
4. Toast: "Zostałeś wylogowany"
5. Redirect do `/login`

---

#### Scenariusz 5: Użytkownik próbuje dostać się do chronionej trasy

**Flow:**
1. Niezalogowany użytkownik próbuje wejść na `/calendar`
2. Middleware sprawdza sesję → brak sesji
3. Redirect do `/login?redirect=/calendar`
4. Po zalogowaniu → automatyczny redirect do `/calendar`

---

## 3. LOGIKA BACKENDOWA

### 3.1 Middleware do ochrony tras

**Lokalizacja:** `src/middleware/index.ts`

**Odpowiedzialność:**
- Sprawdzanie sesji użytkownika dla chronionych tras
- Przekierowanie do `/login` jeśli brak sesji
- Zapisanie oryginalnego URL jako query param `?redirect=`
- Obsługa publicznych tras (/, /login, /register, /reset-password)

**Implementacja:**

```typescript
import { defineMiddleware } from 'astro:middleware';
import { createServerClient } from '@supabase/ssr';

/**
 * Protected routes requiring authentication
 */
const protectedRoutes = [
  '/dashboard',
  '/recipes',
  '/calendar',
  '/shopping-lists',
];

/**
 * Public routes accessible without authentication
 */
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/reset-password',
];

/**
 * Check if route is protected
 */
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route));
}

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname === route);
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, url, redirect, locals } = context;

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookies: {
        get(key) {
          return cookies.get(key)?.value;
        },
        set(key, value, options) {
          cookies.set(key, value, options);
        },
        remove(key, options) {
          cookies.delete(key, options);
        },
      },
    }
  );

  // Make supabase client available in locals
  locals.supabase = supabase;

  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = url.pathname;

  // Protected route logic
  if (isProtectedRoute(pathname)) {
    if (!session) {
      // No session - redirect to login with original URL
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      return redirect(redirectUrl);
    }
  }

  // Public route logic (optional: redirect logged-in users from auth pages)
  if (pathname === '/login' || pathname === '/register') {
    if (session) {
      // Already logged in - redirect to dashboard
      return redirect('/dashboard');
    }
  }

  // Continue to the requested page
  return next();
});
```

**Kluczowe cechy:**
- Wykorzystanie Supabase SSR client z cookie handling
- Sprawdzanie sesji server-side (przed renderowaniem strony)
- Zapisanie `locals.supabase` dla dostępu w API endpoints i stronach
- Redirect pattern: `/login?redirect=/calendar`
- Obsługa edge case: zalogowany użytkownik próbuje wejść na `/login` → redirect do `/dashboard`

**Type definitions (src/env.d.ts):**
```typescript
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    supabase: import('@supabase/supabase-js').SupabaseClient<
      import('./db/database.types').Database
    >;
  }
}
```

---

### 3.2 Endpointy API

**Uwaga:** Większość logiki autentykacji jest obsługiwana przez Supabase Auth client-side. Backend API endpoints NIE SĄ potrzebne dla podstawowych operacji (signUp, signIn, signOut, resetPassword).

**Opcjonalnie (jeśli potrzebujemy server-side auth API):**

**A. POST /api/auth/register**

**Lokalizacja:** `src/pages/api/auth/register.ts`

**Uwaga:** Ten endpoint jest **opcjonalny**. W MVP możemy używać client-side Supabase Auth. Endpoint byłby potrzebny tylko jeśli chcemy server-side validation lub dodatkowe operacje po rejestracji (np. tworzenie powiązanych rekordów).

```typescript
export const prerender = false;

import type { APIRoute } from 'astro';
import { registerSchema } from '@/lib/validation/auth.schema';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Validate
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { email, password } = validation.data;

    // Create user via Supabase Auth
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ user: data.user }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Register error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

**REKOMENDACJA:** W MVP używaj client-side Supabase Auth. Ten endpoint jest potrzebny tylko jeśli:
- Chcemy server-side rate limiting
- Chcemy dodatkowe operacje post-registration (np. wysłanie welcome email, tworzenie default data)

---

### 3.3 Modele danych (Supabase Auth)

**Uwaga:** Supabase Auth zarządza tabelami użytkowników automatycznie. Nie musimy tworzyć własnych tabel dla autentykacji.

**A. Tabela `auth.users` (zarządzana przez Supabase)**

| Kolumna | Typ | Opis |
|---------|-----|------|
| `id` | uuid | Primary key, generowany automatycznie |
| `email` | text | Adres email użytkownika (unique) |
| `encrypted_password` | text | Zahashowane hasło (bcrypt) |
| `email_confirmed_at` | timestamp | Data potwierdzenia email (null jeśli nie potwierdzony) |
| `created_at` | timestamp | Data utworzenia konta |
| `updated_at` | timestamp | Data ostatniej aktualizacji |
| `last_sign_in_at` | timestamp | Data ostatniego logowania |

**B. Powiązanie z tabelami aplikacji**

Wszystkie tabele aplikacji (recipes, meal_plan, shopping_lists) mają kolumnę `user_id`:

```sql
-- Example: recipes table
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  instructions TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policy: users can only see their own recipes
CREATE POLICY "Users can view own recipes"
  ON recipes
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Kluczowe cechy:**
- Foreign key: `user_id REFERENCES auth.users(id)`
- Cascade delete: jeśli user usunięty → wszystkie jego dane usunięte
- RLS policies: `auth.uid() = user_id` zapewnia izolację danych

---

### 3.4 Walidacja danych wejściowych

**Zob. sekcja 2.3.1** - wszystkie schematy walidacji Zod znajdują się w `src/lib/validation/auth.schema.ts`.

**Zastosowanie:**
- Client-side: w komponentach React przed wywołaniem Supabase Auth
- Server-side: w API endpoints (jeśli używamy server-side auth API)

---

### 3.5 Obsługa wyjątków

**A. Błędy Supabase Auth**

**Mapowanie na user-friendly komunikaty:**

```typescript
// src/lib/utils/auth-errors.ts

/**
 * Map Supabase auth errors to user-friendly Polish messages
 */
export function getAuthErrorMessage(error: any): string {
  const errorCode = error?.code || error?.message || '';

  const errorMap: Record<string, string> = {
    'invalid_credentials': 'Nieprawidłowy email lub hasło',
    'email_exists': 'Konto z tym adresem email już istnieje',
    'weak_password': 'Hasło jest zbyt słabe',
    'invalid_email': 'Nieprawidłowy adres email',
    'user_not_found': 'Nie znaleziono użytkownika o tym adresie email',
    'email_not_confirmed': 'Email nie został potwierdzony. Sprawdź skrzynkę pocztową.',
    'over_email_send_rate_limit': 'Zbyt wiele prób. Spróbuj ponownie za chwilę.',
  };

  // Check if we have a mapped message
  for (const [code, message] of Object.entries(errorMap)) {
    if (errorCode.includes(code)) {
      return message;
    }
  }

  // Default fallback
  return 'Coś poszło nie tak. Spróbuj ponownie za chwilę.';
}
```

**Użycie w komponencie:**

```tsx
import { getAuthErrorMessage } from '@/lib/utils/auth-errors';

const { data, error } = await supabase.auth.signInWithPassword({
  email, password
});

if (error) {
  const message = getAuthErrorMessage(error);
  toast.error(message);
}
```

**B. Network errors**

```tsx
try {
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password
  });

  if (error) throw error;

} catch (error) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    toast.error('Brak połączenia. Sprawdź internet i spróbuj ponownie.');
  } else {
    toast.error(getAuthErrorMessage(error));
  }
}
```

**C. Logging (Sentry)**

```typescript
// In API endpoints or critical errors
try {
  // ... auth logic
} catch (error) {
  console.error('Auth error:', error);

  // TODO: Add Sentry logging in production
  // Sentry.captureException(error, {
  //   tags: { module: 'auth' },
  //   extra: { endpoint: 'POST /api/auth/register' }
  // });

  return new Response(
    JSON.stringify({ error: 'Internal server error' }),
    { status: 500 }
  );
}
```

---

### 3.6 Aktualizacja renderowania stron server-side

**Obecna konfiguracja:** `astro.config.mjs` ma `output: "server"` - wszystkie strony są renderowane server-side (SSR).

**Modyfikacje:**
- **Brak zmian w konfiguracji** - obecny setup jest odpowiedni
- Middleware sprawdza sesję przed renderowaniem każdej strony
- Chronione strony wymagają sesji (redirect w middleware)
- Publiczne strony dostępne bez logowania

**Opcjonalnie - Optymalizacja:**

Jeśli chcemy **hybrid rendering** (niektóre strony static, inne SSR):

```javascript
// astro.config.mjs
export default defineConfig({
  output: "hybrid", // Hybrid mode
  // ...
});
```

Następnie w każdej stronie:
```astro
---
// Static pages (landing page)
export const prerender = true; // Pre-render at build time
---

---
// Dynamic pages (dashboard, recipes)
export const prerender = false; // SSR on each request
---
```

**REKOMENDACJA dla MVP:** Zostań przy `output: "server"` (pełny SSR). Hybrid rendering można dodać później dla optymalizacji.

---

## 4. SYSTEM AUTENTYKACJI

### 4.1 Wykorzystanie Supabase Auth

**Architektura:**

```
┌─────────────────────────────────────────────────────────┐
│                    Astro Frontend                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  React Components (LoginView, RegisterView)      │   │
│  │  - Walidacja client-side (Zod)                   │   │
│  │  - Wywołanie Supabase Auth client-side           │   │
│  └─────────────────┬────────────────────────────────┘   │
│                    │                                      │
│                    ▼                                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │  @supabase/supabase-js (Browser Client)          │   │
│  │  - signUp(), signInWithPassword(), signOut()     │   │
│  │  - Session w localStorage + cookies              │   │
│  └─────────────────┬────────────────────────────────┘   │
└────────────────────┼────────────────────────────────────┘
                     │
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase Auth Service                       │
│  - Zarządzanie kontami (auth.users table)               │
│  - Hashowanie haseł (bcrypt)                             │
│  - Generowanie JWT tokens                                │
│  - Email templates (reset password)                      │
│  - Rate limiting                                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│          PostgreSQL Database (Supabase)                  │
│  - auth.users (zarządzane przez Supabase)                │
│  - public.recipes, meal_plan, shopping_lists             │
│    (RLS policies: auth.uid() = user_id)                  │
└──────────────────────────────────────────────────────────┘
```

**Middleware (Server-side):**
```
Astro Middleware
  └─ @supabase/ssr (createServerClient)
       - Odczyt cookies
       - Weryfikacja sesji
       - Przekierowania
       - Zapis locals.supabase dla API endpoints
```

---

### 4.2 Flow rejestracji

**Krok po kroku:**

1. **Użytkownik otwiera `/register`**
   - Middleware sprawdza sesję → brak → renderuje stronę
   - Server sprawdza sesję w `register.astro` → jeśli jest → redirect do `/dashboard`

2. **Renderowanie formularza**
   - `RegisterView.tsx` renderowany client-side (`client:load`)
   - Formularz: email, hasło, potwierdzenie hasła

3. **Użytkownik wypełnia formularz**
   - Real-time validation (Zod schema)
   - Błędy inline pod polami

4. **Submit formularza**
   ```tsx
   const { data, error } = await supabase.auth.signUp({
     email: formData.email,
     password: formData.password,
   });
   ```

5. **Supabase Auth wykonuje:**
   - Walidacja formatu email
   - Sprawdzenie czy email już istnieje
   - Hashowanie hasła (bcrypt)
   - Zapis do `auth.users` table
   - Generowanie JWT access token + refresh token
   - Zapis sesji w cookies (httpOnly)
   - (Opcjonalnie) Wysłanie email weryfikacyjnego

6. **Response handling**
   - **Sukces:**
     - Toast: "Witaj w ShopMate! Twoje konto zostało utworzone."
     - Redirect: `window.location.href = '/dashboard'`
   - **Błąd:**
     - Toast: getAuthErrorMessage(error)
     - Użytkownik pozostaje na formularzu

7. **Sesja aktywna**
   - Cookies zawierają access token + refresh token
   - Middleware wykryje sesję przy kolejnych requestach
   - User może dostać się do chronionych tras

---

### 4.3 Flow logowania

**Krok po kroku:**

1. **Wejście na `/login` (lub redirect z chronionej trasy)**
   ```
   /calendar → middleware wykrywa brak sesji → redirect /login?redirect=/calendar
   ```

2. **Renderowanie formularza**
   - `LoginView.tsx` otrzymuje prop `redirectUrl=/calendar`
   - Formularz: email, hasło

3. **Submit formularza**
   ```tsx
   const { data, error } = await supabase.auth.signInWithPassword({
     email: formData.email,
     password: formData.password,
   });
   ```

4. **Supabase Auth wykonuje:**
   - Walidacja email format
   - Query do `auth.users WHERE email = ?`
   - Weryfikacja hasła (bcrypt compare)
   - Generowanie nowych JWT tokens
   - Zapis sesji w cookies
   - Update `last_sign_in_at` timestamp

5. **Response handling**
   - **Sukces:**
     - Redirect: `window.location.href = redirectUrl` (lub `/dashboard`)
   - **Błąd:**
     - Toast: "Nieprawidłowy email lub hasło"

6. **Sesja aktywna**
   - Middleware wykryje sesję przy kolejnych requestach
   - Dostęp do chronionych tras

---

### 4.4 Flow wylogowania

**Krok po kroku:**

1. **Kliknięcie "Wyloguj" w nawigacji**
   ```tsx
   <Button onClick={handleLogout}>Wyloguj</Button>
   ```

2. **Wywołanie API**
   ```tsx
   const { error } = await supabase.auth.signOut();
   ```

3. **Supabase Auth wykonuje:**
   - Usunięcie sesji z `auth.sessions` table
   - Invalidacja JWT tokens
   - Usunięcie cookies

4. **Response handling**
   - Toast: "Zostałeś wylogowany"
   - Redirect: `window.location.href = '/login'`

5. **Brak sesji**
   - Middleware wykryje brak sesji
   - Próba wejścia na chronioną trasę → redirect do `/login`

---

### 4.5 Flow reset hasła

**Część 1: Request reset**

1. **Użytkownik wchodzi na `/reset-password`**
2. **Formularz z email input**
3. **Submit**
   ```tsx
   const { error } = await supabase.auth.resetPasswordForEmail(email, {
     redirectTo: `${window.location.origin}/reset-password`,
   });
   ```

4. **Supabase Auth wykonuje:**
   - Sprawdzenie czy email istnieje (bez ujawniania czy istnieje - security)
   - Generowanie unique token (ważny przez 24 godziny - zgodnie z US-003 z PRD)
   - Wysłanie emaila z linkiem:
     ```
     https://shopmate.com/reset-password?access_token=XXX&type=recovery
     ```

5. **Response**
   - Toast: "Link do resetowania hasła został wysłany na email"
   - Wyświetlenie komunikatu: "Sprawdź swoją skrzynkę email"

**Część 2: Update password**

6. **Użytkownik klika link w email**
   - Redirect do `/reset-password?access_token=XXX&type=recovery`

7. **Middleware i strona wykrywają callback**
   ```astro
   const type = Astro.url.searchParams.get('type');
   const isResetCallback = type === 'recovery';
   ```

8. **Formularz nowego hasła**
   ```tsx
   <ResetPasswordView isResetCallback={true} />
   ```

9. **Submit nowego hasła**
   ```tsx
   const { error } = await supabase.auth.updateUser({
     password: newPassword,
   });
   ```

10. **Supabase Auth wykonuje:**
    - Weryfikacja access_token
    - Sprawdzenie czy token nie wygasł
    - Hashowanie nowego hasła
    - Update `auth.users` table
    - Invalidacja starego tokenu

11. **Response**
    - Toast: "Hasło zostało zmienione"
    - Redirect: `window.location.href = '/login'`

---

### 4.6 Zarządzanie sesją (cookies)

**Supabase Session Management:**

Supabase używa **httpOnly cookies** do przechowywania JWT tokens:

**Cookies:**
- `sb-access-token` - JWT access token (krótkoterminowy, ~1h)
- `sb-refresh-token` - JWT refresh token (długoterminowy, ~30 dni)

**Middleware (Server-side):**
```typescript
const supabase = createServerClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_KEY,
  {
    cookies: {
      get(key) {
        return cookies.get(key)?.value;
      },
      set(key, value, options) {
        cookies.set(key, value, options);
      },
      remove(key, options) {
        cookies.delete(key, options);
      },
    },
  }
);

// Get session from cookies
const { data: { session } } = await supabase.auth.getSession();
```

**Client-side (React components):**
```tsx
import { supabaseClient } from '@/db/supabase.client';

// Session is automatically handled via cookies
const { data, error } = await supabaseClient.auth.signInWithPassword({
  email, password
});
```

**Token refresh:**
- Supabase automatycznie refreshuje access token gdy wygasa
- Refresh token jest używany do generowania nowego access token
- Jeśli refresh token wygasł → użytkownik musi się zalogować ponownie

**Session persistence:**
- Sesja persystuje między restartami przeglądarki (cookies)
- Default TTL: 30 dni (refresh token)

**Security:**
- httpOnly cookies = immune to XSS attacks
- Secure flag = tylko HTTPS (Vercel automatic)
- SameSite=Lax = protection against CSRF

---

### 4.7 Row Level Security (RLS) Policies

**Uwaga:** RLS policies dla tabel aplikacji (recipes, meal_plan, shopping_lists) powinny być już skonfigurowane. Tutaj potwierdzamy że są zgodne z systemem autentykacji.

**Przykład: recipes table**

```sql
-- Enable RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own recipes
CREATE POLICY "Users can view own recipes"
  ON recipes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own recipes
CREATE POLICY "Users can insert own recipes"
  ON recipes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own recipes
CREATE POLICY "Users can update own recipes"
  ON recipes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own recipes
CREATE POLICY "Users can delete own recipes"
  ON recipes
  FOR DELETE
  USING (auth.uid() = user_id);
```

**Funkcja `auth.uid()`:**
- Zwraca `user_id` z aktualnego JWT token
- Automatycznie wywoływana w każdym query
- Jeśli brak sesji → `auth.uid()` zwraca `NULL` → query zwraca 0 wyników

**Testowanie RLS:**
```sql
-- Login as user A
SELECT * FROM recipes; -- Returns only user A's recipes

-- Login as user B
SELECT * FROM recipes; -- Returns only user B's recipes

-- No session
SELECT * FROM recipes; -- Returns 0 rows
```

**Analogiczne policies dla:**
- `ingredients` (via `recipe_id` ownership)
- `meal_plan`
- `shopping_lists`
- `shopping_list_items` (via `shopping_list_id` ownership)

---

## 5. MIGRACJA I WDROŻENIE

### 5.1 Checklist wdrożenia

**A. Konfiguracja Supabase:**

- [ ] Utworzenie projektu Supabase (jeśli jeszcze nie istnieje)
- [ ] Konfiguracja Email Templates dla reset password
  - Supabase Dashboard → Authentication → Email Templates
  - Template: "Reset Password"
  - Customize subject + body (PL)
- [ ] (Opcjonalnie) Wyłączenie email confirmation jeśli nie potrzebujemy w MVP
  - Dashboard → Authentication → Providers → Email → Disable "Confirm email"
- [ ] Konfiguracja Redirect URLs
  - Dashboard → Authentication → URL Configuration
  - Site URL: `https://shopmate.com` (production)
  - Redirect URLs:
    - `https://shopmate.com/reset-password`
    - `http://localhost:3000/reset-password` (development)

**B. Environment variables:**

```env
# .env.local (development)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-anon-key

# Vercel Environment Variables (production)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-anon-key
```

**C. Dependency installation:**

```bash
npm install @supabase/supabase-js @supabase/ssr zod
```

**D. Tworzenie plików:**

- [ ] `src/layouts/AuthLayout.astro`
- [ ] `src/pages/login.astro`
- [ ] `src/pages/register.astro`
- [ ] `src/pages/reset-password.astro`
- [ ] `src/components/auth/LoginView.tsx`
- [ ] `src/components/auth/RegisterView.tsx`
- [ ] `src/components/auth/ResetPasswordView.tsx`
- [ ] `src/components/Navigation.tsx`
- [ ] `src/middleware/index.ts`
- [ ] `src/lib/validation/auth.schema.ts`
- [ ] `src/lib/utils/auth-errors.ts`

**E. Modyfikacje istniejących plików:**

- [ ] `src/layouts/Layout.astro` - dodanie `<Navigation />`
- [ ] `src/pages/index.astro` - dodanie CTA do `/register`
- [ ] `src/env.d.ts` - dodanie type definition dla `locals.supabase`

**F. Testing:**

- [ ] Test rejestracji (happy path)
- [ ] Test rejestracji (email już istnieje)
- [ ] Test logowania (poprawne credentials)
- [ ] Test logowania (niepoprawne credentials)
- [ ] Test reset hasła (request + update)
- [ ] Test wylogowania
- [ ] Test ochrony tras (middleware redirect)
- [ ] Test RLS policies (izolacja danych między użytkownikami)

---

### 5.2 Migracje bazy danych

**Uwaga:** Supabase Auth zarządza swoimi tabelami automatycznie. Jedyne migracje potrzebne to **RLS policies** dla tabel aplikacji.

**Przykładowa migracja:**

```sql
-- migrations/20250125_add_rls_policies.sql

-- Enable RLS on all application tables
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Recipes policies
CREATE POLICY "Users can view own recipes"
  ON recipes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes"
  ON recipes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE USING (auth.uid() = user_id);

-- Ingredients policies (via recipe ownership)
CREATE POLICY "Users can view ingredients of own recipes"
  ON ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert ingredients to own recipes"
  ON ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- Similar policies for meal_plan, shopping_lists, shopping_list_items...
```

**Uruchomienie migracji:**
- Supabase Dashboard → SQL Editor → New Query → Paste migration → Run
- Lub przez CLI: `supabase migration new add_rls_policies`

---

### 5.3 Security audit checklist

**Przed wdrożeniem na production:**

- [ ] **Supabase anon key jest public** - OK (RLS zabezpiecza dane)
- [ ] **Service role key NIE jest exposed w client code** - CRITICAL
- [ ] **RLS policies są poprawne** - penetration testing
- [ ] **HTTPS jest wymuszony** - Vercel automatic
- [ ] **httpOnly cookies są używane** - Supabase default
- [ ] **Rate limiting jest aktywny** - Supabase default (100 req/min)
- [ ] **Password requirements są zgodne z US-001** - 8+ chars, 1 uppercase, 1 digit
- [ ] **Error messages nie ujawniają czy email istnieje** - "Nieprawidłowy email lub hasło"
- [ ] **Brak SQL injection** - Supabase Client używa prepared statements
- [ ] **Brak XSS** - React automatic escaping
- [ ] **CSRF protection** - SameSite cookies
- [ ] **Dependencies są up-to-date** - `npm audit`

---

## 6. TESTOWANIE

### 6.1 Przypadki testowe

**A. Rejestracja**

| Test Case | Kroki | Oczekiwany rezultat |
|-----------|-------|---------------------|
| TC-001 | Poprawna rejestracja | Email: test@example.com, Hasło: Test1234, Potwierdzenie: Test1234 → Toast sukcesu → Redirect /dashboard |
| TC-002 | Email już istnieje | Email który już jest w bazie → Toast: "Konto z tym adresem email już istnieje" |
| TC-003 | Hasła nie pasują | Hasło: Test1234, Potwierdzenie: Test5678 → Błąd inline: "Hasła nie są identyczne" |
| TC-004 | Hasło za krótkie | Hasło: Test1 → Błąd inline: "Hasło musi mieć minimum 8 znaków" |
| TC-005 | Brak wielkiej litery w haśle | Hasło: test1234 → Błąd inline: "Hasło musi zawierać minimum 1 wielką literę" |
| TC-006 | Brak cyfry w haśle | Hasło: Testtest → Błąd inline: "Hasło musi zawierać minimum 1 cyfrę" |
| TC-007 | Nieprawidłowy format email | Email: testexample.com → Błąd inline: "Nieprawidłowy format adresu email" |

**B. Logowanie**

| Test Case | Kroki | Oczekiwany rezultat |
|-----------|-------|---------------------|
| TC-101 | Poprawne logowanie | Email + hasło poprawne → Redirect /dashboard |
| TC-102 | Nieprawidłowe hasło | Email poprawny, hasło złe → Toast: "Nieprawidłowy email lub hasło" |
| TC-103 | Nieistniejący email | Email nie w bazie → Toast: "Nieprawidłowy email lub hasło" (ten sam komunikat!) |
| TC-104 | Redirect po logowaniu | Próba wejścia /calendar → redirect /login?redirect=/calendar → po logowaniu → redirect /calendar |

**C. Reset hasła**

| Test Case | Kroki | Oczekiwany rezultat |
|-----------|-------|---------------------|
| TC-201 | Request reset dla istniejącego email | Email w bazie → Toast: "Link wysłany" → Email otrzymany |
| TC-202 | Request reset dla nieistniejącego email | Email nie w bazie → Toast: "Link wysłany" (security: nie ujawniamy czy email istnieje) |
| TC-203 | Update hasła z linku | Klik link w email → formularz nowego hasła → submit → Toast: "Hasło zmienione" → redirect /login |
| TC-204 | Wygasły link | Link starszy niż 24h → Toast: "Link wygasł. Poproś o nowy." |

**D. Wylogowanie**

| Test Case | Kroki | Oczekiwany rezultat |
|-----------|-------|---------------------|
| TC-301 | Wylogowanie | Klik "Wyloguj" → Toast: "Zostałeś wylogowany" → Redirect /login → cookies usunięte |
| TC-302 | Próba dostępu po wylogowaniu | Po wylogowaniu próba /dashboard → redirect /login?redirect=/dashboard |

**E. Middleware (ochrona tras)**

| Test Case | Kroki | Oczekiwany rezultat |
|-----------|-------|---------------------|
| TC-401 | Niezalogowany próbuje /dashboard | Brak sesji → redirect /login?redirect=/dashboard |
| TC-402 | Niezalogowany próbuje /recipes | Brak sesji → redirect /login?redirect=/recipes |
| TC-403 | Zalogowany próbuje /login | Sesja aktywna → redirect /dashboard |
| TC-404 | Zalogowany dostęp /dashboard | Sesja aktywna → renderowanie /dashboard |
| TC-405 | Publiczny dostęp / | Brak sesji → renderowanie landing page |

**F. RLS (izolacja danych)**

| Test Case | Kroki | Oczekiwany rezultat |
|-----------|-------|---------------------|
| TC-501 | User A widzi tylko swoje przepisy | Login jako User A → GET /api/recipes → tylko przepisy User A |
| TC-502 | User B nie widzi przepisów User A | Login jako User B → GET /api/recipes → 0 przepisów User A |
| TC-503 | Próba edycji przepisu innego usera | User B próbuje PUT /api/recipes/{id User A} → 404 lub 403 |

---

### 6.2 Manual testing checklist

**Przed release:**

- [ ] Rejestracja działa na desktop (Chrome, Firefox, Safari)
- [ ] Rejestracja działa na mobile (iOS Safari, Android Chrome)
- [ ] Logowanie działa na desktop
- [ ] Logowanie działa na mobile
- [ ] Reset hasła - request email działa
- [ ] Reset hasła - update password z linku działa
- [ ] Wylogowanie działa
- [ ] Middleware redirect działa (chronione trasy)
- [ ] RLS izolacja danych działa
- [ ] Komunikaty błędów są po polsku
- [ ] Toast notifications wyświetlają się poprawnie
- [ ] Formulary są responsywne (mobile-first)
- [ ] Accessibility: keyboard navigation działa (Tab, Enter, Escape)
- [ ] Accessibility: ARIA labels są obecne
- [ ] Performance: Lighthouse score ≥90/100

---

## 7. METRYKI SUKCESU

**Zgodnie z PRD, sukces modułu autentykacji mierzymy przez:**

### A. Kryteria funkcjonalne

| Metryka | Docelowa wartość | Sposób pomiaru |
|---------|------------------|----------------|
| Rejestracja działa | 100% success rate | UAT: 10/10 użytkowników potrafi się zarejestrować |
| Logowanie działa | 100% success rate | UAT: 10/10 użytkowników potrafi się zalogować |
| Reset hasła działa | 100% success rate | Manual testing: flow request → email → update |
| Ochrona tras działa | 100% | Manual testing: niezalogowany nie może dostać się do /dashboard |
| RLS izolacja danych | 100% | Penetration testing: User A nie widzi danych User B |

### B. Kryteria UX

| Metryka | Docelowa wartość | Sposób pomiaru |
|---------|------------------|----------------|
| Czas rejestracji | <2 minuty | UAT: średni czas od wejścia /register do zalogowania się |
| Liczba błędów podczas rejestracji | <1 błąd na użytkownika | UAT: tracking błędów walidacji (average attempts) |
| Satysfakcja (SUS) | ≥68/100 | Ankieta SUS po UAT |

### C. Kryteria techniczne

| Metryka | Docelowa wartość | Sposób pomiaru |
|---------|------------------|----------------|
| Security vulnerabilities | 0 critical | `npm audit` + manual security review |
| Lighthouse Accessibility | ≥90/100 | Lighthouse audit na /login, /register |
| Loading time (LCP) | <2.5s | Web Vitals na /login, /register |

---

## 8. RYZYKA I MITIGACJE

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitigacja |
|--------|-------------------|-------|-----------|
| Supabase downtime | Niskie | Wysoki | Monitoring + status page; Graceful error handling |
| RLS policies błędnie skonfigurowane | Średnie | Krytyczny | Penetration testing przed production; Code review |
| Email delivery issues (reset password) | Średnie | Średni | Fallback: komunikat "Jeśli email nie dotarł, sprawdź spam" |
| Session expires podczas użytkowania | Niskie | Średni | Supabase auto-refresh; User-friendly message jeśli fail |
| Brute force attacks (login) | Średnie | Średni | Supabase rate limiting (100 req/min); Możliwość dodania captcha post-MVP |

---

## 9. ROADMAP POST-MVP

**Funkcje do rozważenia w v1.1:**

1. **OAuth (Google, Facebook)**
   - Łatwiejsze logowanie
   - Wyższy conversion rate rejestracji

2. **Uwierzytelnianie dwuskładnikowe (2FA)**
   - TOTP (Authenticator apps)
   - SMS codes
   - Wyższe bezpieczeństwo dla premium users

3. **Weryfikacja email**
   - Obecnie opcjonalna
   - W v1.1 możemy wymusić potwierdzenie email przed pełnym dostępem

4. **Magic links (passwordless login)**
   - Logowanie przez link w email
   - Łatwiejsze dla użytkowników

5. **Profile settings**
   - Zmiana hasła z poziomu ustawień
   - Zmiana email
   - Usunięcie konta

---

## 10. PODSUMOWANIE

### Kluczowe decyzje architektoniczne:

1. **Supabase Auth** - zarządza autentykacją, hashowaniem haseł, sesjami
2. **Client-side auth calls** - React komponenty wywołują Supabase Auth bezpośrednio
3. **Server-side session check** - Middleware sprawdza sesję przed renderowaniem stron
4. **httpOnly cookies** - sesja przechowywana bezpiecznie
5. **Row Level Security** - izolacja danych na poziomie bazy danych
6. **Zod validation** - walidacja client-side i server-side
7. **Astro SSR mode** - wszystkie strony renderowane server-side

### Elementy do implementacji:

**Nowe pliki (18):**
- 3 strony Astro (login, register, reset-password)
- 1 layout (AuthLayout.astro)
- 3 komponenty React auth (LoginView, RegisterView, ResetPasswordView)
- 1 komponent Navigation
- 1 middleware
- 1 schema walidacji
- 1 utility (auth-errors)

**Modyfikacje (3):**
- Layout.astro (dodanie Navigation)
- index.astro (dodanie CTA)
- env.d.ts (type definitions)

**Konfiguracja:**
- Supabase Email Templates
- Environment variables
- RLS policies (migracja SQL)

### Zgodność z wymaganiami:

- ✅ **US-001:** Rejestracja użytkownika - COVERED
- ✅ **US-002:** Logowanie użytkownika - COVERED
- ✅ **US-003:** Reset hasła - COVERED
- ✅ **US-004:** Wylogowanie - COVERED
- ✅ **US-005:** Ochrona tras - COVERED

### Zgodność z zasadami projektu:

- ✅ **Stack:** Astro 5 + React 18 + Supabase + Vercel
- ✅ **Patterns:** `.astro` dla stron, `.tsx` dla interaktywności
- ✅ **Security:** RLS, httpOnly cookies, HTTPS
- ✅ **Validation:** Zod schemas
- ✅ **Accessibility:** WCAG AA (Shadcn/ui components)
- ✅ **Responsiveness:** Mobile-first design

---

**Koniec specyfikacji.**

Dokument ten stanowi kompletną architekturę techniczną modułu autentykacji dla ShopMate MVP. Implementacja powinna być zgodna z opisanymi wzorcami i strukturami, zapewniając bezpieczeństwo, wydajność i dobrą jakość kodu.
