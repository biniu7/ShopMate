Jako starszy programista frontendu Twoim zadaniem jest stworzenie szczegółowego planu wdrożenia nowego widoku w aplikacji internetowej. Plan ten powinien być kompleksowy i wystarczająco jasny dla innego programisty frontendowego, aby mógł poprawnie i wydajnie wdrożyć widok.

Najpierw przejrzyj następujące informacje:

1. Product Requirements Document (PRD):
   <prd>
   @.ai/doc/4_prd.md
   </prd>

2. Opis widoku:
   <view_description>
#### 2.1.2 Login

**Ścieżka:** `/login`

**Główny cel:** Zalogować użytkownika do aplikacji

**Kluczowe informacje:**

- Email (input)
- Hasło (input type="password")
- Link "Nie pamiętam hasła" → `/reset-password`
- Link "Nie masz konta? Zarejestruj się" → `/register`
- Query param `?redirect=/calendar` dla powrotu po logowaniu

**Kluczowe komponenty:**

- `<LoginForm>` (React component, client:load)
    - `<Input>` email (Zod validation)
    - `<Input>` password (show/hide toggle)
    - `<Button>` "Zaloguj się" (disabled podczas submit)
    - `<FormMessage>` dla błędów walidacji
    - Link do reset hasła
    - Link do rejestracji

**UX considerations:**

- Auto-focus na email input
- Enter key submits form
- Loading state: disabled button + spinner
- Error handling: "Nieprawidłowy email lub hasło" (nie ujawniaj czy email istnieje)
- Success: redirect do `?redirect` lub `/dashboard`

**Accessibility:**

- Label powiązane z input (`htmlFor`)
- Error messages z `aria-describedby`
- Password toggle button z `aria-label`

**Security:**

- Supabase Auth (httpOnly cookies, JWT)
- Rate limiting (Supabase default: 100 req/min)
- HTTPS only

---

#### 2.1.3 Register

**Ścieżka:** `/register`

**Główny cel:** Utworzyć konto użytkownika

**Kluczowe informacje:**

- Email (validation: email format, lowercase, trim)
- Hasło (validation: 8-100 znaków, min 1 wielka litera, 1 cyfra)
- Potwierdzenie hasła (musi być identyczne)
- Link "Masz już konto? Zaloguj się" → `/login`

**Kluczowe komponenty:**

- `<RegisterForm>` (React component, client:load)
    - `<Input>` email
    - `<Input>` password (strength indicator)
    - `<Input>` confirmPassword
    - `<Button>` "Zarejestruj się"
    - Link do login

**UX considerations:**

- Password strength indicator (weak/medium/strong)
- Real-time validation (debounce 300ms)
- Success: auto-login + redirect do `/dashboard` + Toast "Witaj w ShopMate!"
- Error handling: komunikaty inline pod polami

**Accessibility:**

- Form z semantic `<form>` element
- Labels visible (nie tylko placeholders)
- Error messages announced z `aria-live="polite"`

**Security:**

- Zod schema validation (client + server)
- Supabase Auth email verification (opcjonalne w MVP)
- Password hashing (Supabase automatic)

---

#### 2.1.4 Reset Password

**Ścieżka:** `/reset-password`

**Główny cel:** Umożliwić resetowanie zapomnianego hasła

**Kluczowe informacje:**

- Email (input) - strona wysyłania linku
- Nowe hasło + potwierdzenie - strona po kliknięciu w link

**Kluczowe komponenty:**

- `<ResetPasswordForm>` (2 wersje):
    - **Step 1 (Request):** Email input + "Wyślij link"
    - **Step 2 (Reset):** Nowe hasło + Potwierdzenie + "Zmień hasło"

**UX considerations:**

- Step 1 success: "Sprawdź email. Link resetujący jest ważny przez 24h"
- Step 2 success: "Hasło zmienione" + redirect do `/login`
- Error: "Link wygasł" + CTA "Wyślij ponownie"

**Accessibility:**

- Clear instructions w każdym kroku
- Success messages z `role="status"`

**Security:**

- Supabase magic link (24h expiry)
- Rate limiting na wysyłanie emaili (max 3/hour)

---
   </view_description>

3. User Stories:
   <user_stories>
### 5.1 Rejestracja i autoryzacja

US-001: Rejestracja nowego użytkownika
Jako nowy użytkownik, chcę utworzyć konto w aplikacji, aby móc korzystać z funkcji planowania posiłków i list zakupów.

Kryteria akceptacji:

- Użytkownik może otworzyć stronę rejestracji pod adresem /register
- Formularz zawiera pola: email, hasło, potwierdzenie hasła
- Walidacja email: sprawdzenie formatu email, lowercase, trim
- Walidacja hasła: minimum 8 znaków, maksimum 100 znaków
- Potwierdzenie hasła: musi być identyczne z hasłem
- Komunikaty błędów wyświetlane inline pod polami w języku polskim
- Po udanej rejestracji użytkownik jest automatycznie zalogowany
- Przekierowanie do /dashboard po rejestracji
- Toast notification: "Witaj w ShopMate! Twoje konto zostało utworzone."
- Konto użytkownika zapisane w Supabase Auth
- Weryfikacja email opcjonalna (można pominąć w MVP)

US-002: Logowanie użytkownika
Jako zarejestrowany użytkownik, chcę zalogować się do aplikacji, aby uzyskać dostęp do moich przepisów i planów posiłków.

Kryteria akceptacji:

- Użytkownik może otworzyć stronę logowania pod adresem /login
- Formularz zawiera pola: email, hasło
- Przycisk "Zaloguj się"
- Link "Nie pamiętam hasła" kieruje do /reset-password
- Link "Nie masz konta? Zarejestruj się" kieruje do /register
- Po udanym logowaniu sesja zapisana w cookies
- Przekierowanie do /dashboard po logowaniu
- Błędne dane: komunikat "Nieprawidłowy email lub hasło"
- Przycisk "Zaloguj się" disabled podczas procesu logowania (loading state)

US-003: Reset hasła
Jako użytkownik, który zapomniał hasła, chcę zresetować hasło, aby odzyskać dostęp do konta.

Kryteria akceptacji:

- Strona reset hasła dostępna pod /reset-password
- Formularz z polem email
- Po wysłaniu formularza użytkownik otrzymuje email z linkiem resetującym
- Link w emailu kieruje do strony ustawiania nowego hasła
- Strona ustawiania nowego hasła zawiera: nowe hasło, potwierdzenie hasła
- Walidacja identyczna jak przy rejestracji
- Toast notification: "Hasło zostało zmienione"
- Automatyczne przekierowanie do /login
- Link resetujący ważny przez 24 godziny

US-004: Wylogowanie
Jako zalogowany użytkownik, chcę wylogować się z aplikacji, aby zakończyć sesję.

Kryteria akceptacji:

- Przycisk "Wyloguj" widoczny w nawigacji dla zalogowanych użytkowników
- Kliknięcie powoduje usunięcie sesji
- Przekierowanie do /login
- Toast notification: "Zostałeś wylogowany"
- Sesja usunięta z cookies
- Próba dostępu do chronionych tras przekierowuje do /login

US-005: Ochrona tras
Jako system, chcę chronić trasy przed nieautoryzowanym dostępem, aby zapewnić bezpieczeństwo danych użytkowników.

Kryteria akceptacji:

- Middleware sprawdza sesję użytkownika dla tras: /dashboard, /recipes, /calendar, /shopping-lists
- Niezalogowany użytkownik próbujący dostać się do chronionej trasy jest przekierowywany do /login
- URL chronionej trasy zapisywany jako redirect parameter: /login?redirect=/calendar
- Po zalogowaniu użytkownik przekierowywany do oryginalnie żądanej trasy
- Publiczne trasy dostępne bez logowania: /, /login, /register, /reset-password
   </user_stories>

4. Endpoint Description:
   <endpoint_description>
### Authentication Mechanism

**Provider:** Supabase Auth
**Method:** JWT-based session with httpOnly cookies

**Flow:**

1. User registers/logs in via Supabase Auth SDK (client-side)
2. Supabase returns JWT access token + refresh token
3. Tokens stored in httpOnly cookies (secure, immune to XSS)
4. Every API request includes cookies automatically
5. Middleware validates JWT on server-side via `context.locals.supabase.auth.getUser()`

**Implementation Details:**

**Middleware (Astro):**

```typescript
// src/middleware/index.ts
import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client";

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;
  return next();
});
```

**Protected API Endpoint Example:**

```typescript
// src/pages/api/recipes.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  // Check authentication
  const {
    data: { user },
    error,
  } = await locals.supabase.auth.getUser();

  if (error || !user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // User is authenticated, proceed with query
  const { data: recipes } = await locals.supabase.from("recipes").select("*");

  return new Response(JSON.stringify({ data: recipes }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
```

   </endpoint_description>

5. Endpoint Implementation:
   <endpoint_implementation>
   {{endpoint-implementation}} <- zamień na referencję do implementacji endpointów, z których będzie korzystał widok (np. @generations.ts, @flashcards.ts)
   </endpoint_implementation>

6. Type Definitions:
   <type_definitions>
   @src/types.ts
   </type_definitions>

7. Tech Stack:
   <tech_stack>
   @.ai/doc/tech-stack.md
   </tech_stack>

Przed utworzeniem ostatecznego planu wdrożenia przeprowadź analizę i planowanie wewnątrz tagów <implementation_breakdown> w swoim bloku myślenia. Ta sekcja może być dość długa, ponieważ ważne jest, aby być dokładnym.

W swoim podziale implementacji wykonaj następujące kroki:

1. Dla każdej sekcji wejściowej (PRD, User Stories, Endpoint Description, Endpoint Implementation, Type Definitions, Tech Stack):

- Podsumuj kluczowe punkty
- Wymień wszelkie wymagania lub ograniczenia
- Zwróć uwagę na wszelkie potencjalne wyzwania lub ważne kwestie

2. Wyodrębnienie i wypisanie kluczowych wymagań z PRD
3. Wypisanie wszystkich potrzebnych głównych komponentów, wraz z krótkim opisem ich opisu, potrzebnych typów, obsługiwanych zdarzeń i warunków walidacji
4. Stworzenie wysokopoziomowego diagramu drzewa komponentów
5. Zidentyfikuj wymagane DTO i niestandardowe typy ViewModel dla każdego komponentu widoku. Szczegółowo wyjaśnij te nowe typy, dzieląc ich pola i powiązane typy.
6. Zidentyfikuj potencjalne zmienne stanu i niestandardowe hooki, wyjaśniając ich cel i sposób ich użycia
7. Wymień wymagane wywołania API i odpowiadające im akcje frontendowe
8. Zmapuj każdej historii użytkownika do konkretnych szczegółów implementacji, komponentów lub funkcji
9. Wymień interakcje użytkownika i ich oczekiwane wyniki
10. Wymień warunki wymagane przez API i jak je weryfikować na poziomie komponentów
11. Zidentyfikuj potencjalne scenariusze błędów i zasugeruj, jak sobie z nimi poradzić
12. Wymień potencjalne wyzwania związane z wdrożeniem tego widoku i zasugeruj możliwe rozwiązania

Po przeprowadzeniu analizy dostarcz plan wdrożenia w formacie Markdown z następującymi sekcjami:

1. Przegląd: Krótkie podsumowanie widoku i jego celu.
2. Routing widoku: Określenie ścieżki, na której widok powinien być dostępny.
3. Struktura komponentów: Zarys głównych komponentów i ich hierarchii.
4. Szczegóły komponentu: Dla każdego komponentu należy opisać:

- Opis komponentu, jego przeznaczenie i z czego się składa
- Główne elementy HTML i komponenty dzieci, które budują komponent
- Obsługiwane zdarzenia
- Warunki walidacji (szczegółowe warunki, zgodnie z API)
- Typy (DTO i ViewModel) wymagane przez komponent
- Propsy, które komponent przyjmuje od rodzica (interfejs komponentu)

5. Typy: Szczegółowy opis typów wymaganych do implementacji widoku, w tym dokładny podział wszelkich nowych typów lub modeli widoku według pól i typów.
6. Zarządzanie stanem: Szczegółowy opis sposobu zarządzania stanem w widoku, określenie, czy wymagany jest customowy hook.
7. Integracja API: Wyjaśnienie sposobu integracji z dostarczonym punktem końcowym. Precyzyjnie wskazuje typy żądania i odpowiedzi.
8. Interakcje użytkownika: Szczegółowy opis interakcji użytkownika i sposobu ich obsługi.
9. Warunki i walidacja: Opisz jakie warunki są weryfikowane przez interfejs, których komponentów dotyczą i jak wpływają one na stan interfejsu
10. Obsługa błędów: Opis sposobu obsługi potencjalnych błędów lub przypadków brzegowych.
11. Kroki implementacji: Przewodnik krok po kroku dotyczący implementacji widoku.

Upewnij się, że Twój plan jest zgodny z PRD, historyjkami użytkownika i uwzględnia dostarczony stack technologiczny.

Ostateczne wyniki powinny być w języku polskim i zapisane w pliku o nazwie .ai/{view-name}-view-implementation-plan.md. Nie uwzględniaj żadnej analizy i planowania w końcowym wyniku.

Oto przykład tego, jak powinien wyglądać plik wyjściowy (treść jest do zastąpienia):

```markdown
# Plan implementacji widoku [Nazwa widoku]

## 1. Przegląd

[Krótki opis widoku i jego celu]

## 2. Routing widoku

[Ścieżka, na której widok powinien być dostępny]

## 3. Struktura komponentów

[Zarys głównych komponentów i ich hierarchii]

## 4. Szczegóły komponentów

### [Nazwa komponentu 1]

- Opis komponentu [opis]
- Główne elementy: [opis]
- Obsługiwane interakcje: [lista]
- Obsługiwana walidacja: [lista, szczegółowa]
- Typy: [lista]
- Propsy: [lista]

### [Nazwa komponentu 2]

[...]

## 5. Typy

[Szczegółowy opis wymaganych typów]

## 6. Zarządzanie stanem

[Opis zarządzania stanem w widoku]

## 7. Integracja API

[Wyjaśnienie integracji z dostarczonym endpointem, wskazanie typów żądania i odpowiedzi]

## 8. Interakcje użytkownika

[Szczegółowy opis interakcji użytkownika]

## 9. Warunki i walidacja

[Szczegółowy opis warunków i ich walidacji]

## 10. Obsługa błędów

[Opis obsługi potencjalnych błędów]

## 11. Kroki implementacji

1. [Krok 1]
2. [Krok 2]
3. [...]
```

Rozpocznij analizę i planowanie już teraz. Twój ostateczny wynik powinien składać się wyłącznie z planu wdrożenia w języku polskim w formacie markdown, który zapiszesz w pliku .ai/{view-name}-view-implementation-plan.md i nie powinien powielać ani powtarzać żadnej pracy wykonanej w podziale implementacji.
