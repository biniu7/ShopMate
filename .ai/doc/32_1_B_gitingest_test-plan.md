<analiza_projektu>

**1. Kluczowe komponenty projektu wynikające z analizy kodu:**

- **Moduł Przepisów (Recipes):** Kompleksowy CRUD oparty na `react-hook-form` i `zod`. Kluczowe elementy to dynamiczne listy składników, walidacja formularzy, paginacja, sortowanie i wyszukiwanie (infinite scroll).
- **Moduł Kalendarza (Calendar):** Centralny punkt planowania. Wykorzystuje `TanStack Query` do zarządzania stanem i optymistycznych aktualizacji (optimistic updates). Obsługuje nawigację między tygodniami oraz przypisywanie przepisów do slotów czasowych.
- **Moduł List Zakupów (Shopping Lists):** Generator list z dwóch źródeł (kalendarz lub wybrane przepisy). Zawiera logikę agregacji składników, kategoryzację (potencjalnie AI/OpenRouter) oraz eksport do PDF i TXT.
- **System Uwierzytelniania (Auth):** Integracja z Supabase Auth. Logowanie, rejestracja, reset hasła. Middleware chroniący routy.
- **Dashboard:** Agregacja danych (statystyki, nadchodzące posiłki) pobierana z wielu endpointów API równolegle.
- **API (Server-side):** Endpointy w Astro (`src/pages/api/...`) obsługujące logikę biznesową i komunikację z bazą danych Supabase.

**2. Specyfika stosu technologicznego i wpływ na testowanie:**

- **Astro & React (Islands Architecture):** Aplikacja jest hybrydowa. Część to statyczny HTML/SSR, część to interaktywne "wyspy" Reacta.
  - _Implikacja:_ Należy testować, czy interaktywne komponenty (np. `RecipesListViewWrapper`) poprawnie "hydrują" się na kliencie i czy stan jest zachowany.
- **TanStack Query:** Intensywne wykorzystanie do cache'owania i mutacji.
  - _Implikacja:_ Testy muszą weryfikować inwalidację cache'u (np. czy dodanie przepisu odświeża listę) oraz zachowanie UI podczas ładowania (Skeletons) i błędów.
- **Supabase (PostgreSQL):** Relacyjna baza danych.
  - _Implikacja:_ Konieczność przygotowania danych testowych (seed) uwzględniających relacje (przepis -> składniki, meal_plan -> user). Testy bezpieczeństwa RLS (Row Level Security).
- **Zod:** Silna walidacja typów.
  - _Implikacja:_ Można polegać na unit testach schematów walidacji, co odciąża testy E2E z testowania każdego błędnego formatu danych.

**3. Priorytety testowe:**

1.  **Ścieżka Krytyczna (Critical Path):** Rejestracja -> Dodanie Przepisu -> Przypisanie do Kalendarza -> Wygenerowanie Listy Zakupów.
2.  **Integracja Danych:** Czy zmiana przepisu aktualizuje kalendarz? Czy usunięcie przepisu czyści przypisania (widoczne w `DeleteConfirmationDialog`)?
3.  **Generator Listy Zakupów:** Poprawność sumowania składników (np. 200g mąki + 300g mąki = 500g mąki) i ich kategoryzacja.
4.  **Eksport i Formatowanie:** Generowanie PDF/TXT (czy polskie znaki są obsługiwane, czy układ się nie rozsypuje).

**4. Potencjalne obszary ryzyka:**

- **Optymistyczne aktualizacje w Kalendarzu:** Ryzyko desynchronizacji stanu UI z bazą danych w przypadku błędu API (rollback).
- **Wydajność przy dużej ilości danych:** Paginacja w przepisach (Infinite Query) i renderowanie dużego kalendarza na urządzeniach mobilnych.
- **Usługi Zewnętrzne (AI/OpenRouter):** Możliwe awarie lub limity API przy kategoryzacji składników. System musi mieć fallback (kategoria "Inne").
- **Błędy Hydracji:** Ze względu na użycie Astro z Reactem, mogą wystąpić problemy z niezgodnością HTML serwerowego i klienckiego.

</analiza_projektu>

<plan_testów>

# Plan Testów Projektu ShopMate

## 1. Wprowadzenie i Cele

Celem niniejszego planu jest zapewnienie wysokiej jakości aplikacji webowej **ShopMate** – narzędzia do planowania posiłków i generowania list zakupów. Aplikacja oparta jest na nowoczesnym stacku (Astro, React, Supabase). Głównym celem testów jest weryfikacja poprawności procesów biznesowych (tworzenie przepisów, planowanie, zakupy) oraz stabilności interfejsu użytkownika przy intensywnym wykorzystaniu asynchronicznych operacji danych (TanStack Query).

## 2. Zakres Testów

### W Zakresie (In-Scope):

- **Moduły Funkcjonalne:** Dashboard, Przepisy (CRUD), Kalendarz, Listy Zakupów (Generator + Edycja).
- **API:** Endpointy `src/pages/api/**` (walidacja requestów, odpowiedzi, kody błędów).
- **Interfejs Użytkownika:** Responsywność (Mobile/Desktop), stany ładowania (Skeletony), obsługa błędów.
- **Integracja:** Współpraca komponentów React z Astro oraz komunikacja z Supabase.
- **Eksport:** Generowanie plików PDF i TXT.

### Poza Zakresem (Out-of-Scope):

- Testy wydajnościowe infrastruktury Supabase (zakładamy SLA dostawcy).
- Testy bezpieczeństwa penetracyjnego (poza podstawową weryfikacją RLS i autoryzacji).
- Szczegółowa weryfikacja poprawności merytorycznej samych przepisów kulinarnych.

## 3. Strategia i Typy Testów

### 3.1. Testy Jednostkowe (Unit Tests)

- **Cel:** Weryfikacja logiki biznesowej w izolacji.
- **Obszary:**
  - Schematy walidacji Zod (`src/lib/validation/*.schema.ts`).
  - Funkcje użytkowe (`src/lib/utils/*.ts`), np. formatowanie dat, agregacja składników.
  - Serwisy logiczne (`src/lib/services/*.ts`), np. logika kategoryzacji AI (z mockowaniem API).

### 3.2. Testy Integracyjne (Integration Tests)

- **Cel:** Weryfikacja współpracy między modułami a API/Bazą danych.
- **Obszary:**
  - Endpointy API (testy request/response z testową bazą danych).
  - Komponenty złożone używające hooków (np. `useCalendar`, `useRecipesList`) – weryfikacja `TanStack Query` (caching, invalidation).
  - Integracja formularzy (`react-hook-form`) z mutacjami API.

### 3.3. Testy E2E (End-to-End)

- **Cel:** Symulacja zachowania rzeczywistego użytkownika na pełnym środowisku.
- **Obszary:** Ścieżki krytyczne aplikacji (Rejestracja -> Utworzenie przepisu -> Planowanie -> Lista zakupów).

### 3.4. Testy UI/UX

- **Cel:** Weryfikacja responsywności i stanów interfejsu.
- **Obszary:** Wyświetlanie na mobile (widok akordeonu w kalendarzu) vs desktop, działanie modali, stany "Empty State" i "Skeleton Loading".

## 4. Scenariusze Testowe (Kluczowe Funkcjonalności)

### 4.1. Moduł Uwierzytelniania (Auth)

| ID      | Scenariusz                                         | Oczekiwany Rezultat                                            | Priorytet |
| ------- | -------------------------------------------------- | -------------------------------------------------------------- | --------- |
| AUTH-01 | Rejestracja nowego użytkownika z poprawnymi danymi | Utworzenie konta, przekierowanie do Dashboardu, toast sukcesu. | Wysoki    |
| AUTH-02 | Próba logowania z błędnym hasłem                   | Komunikat błędu, brak przekierowania.                          | Wysoki    |
| AUTH-03 | Reset hasła (flow)                                 | Wysłanie maila, możliwość ustawienia nowego hasła przez token. | Średni    |
| AUTH-04 | Dostęp do chronionych routów bez sesji             | Przekierowanie do `/login`.                                    | Wysoki    |

### 4.2. Zarządzanie Przepisami (Recipes)

| ID     | Scenariusz                                    | Oczekiwany Rezultat                                                                                               | Priorytet |
| ------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------- |
| REC-01 | Dodanie przepisu (walidacja)                  | Blokada zapisu przy pustej nazwie lub braku składników. Wyświetlenie błędów pod polami.                           | Wysoki    |
| REC-02 | Dodanie przepisu (sukces)                     | Zapis do bazy, przekierowanie do widoku szczegółów, toast sukcesu.                                                | Wysoki    |
| REC-03 | Edycja przepisu i "Dirty Check"               | Próba wyjścia z formularza bez zapisu wywołuje `DiscardChangesDialog`.                                            | Średni    |
| REC-04 | Usunięcie przepisu przypisanego do kalendarza | Wyświetlenie `DeleteConfirmationDialog` z ostrzeżeniem o liczbie przypisań. Po potwierdzeniu usunięcie kaskadowe. | Wysoki    |
| REC-05 | Lista przepisów (Infinite Scroll)             | Ładowanie kolejnych partii danych po przewinięciu w dół.                                                          | Średni    |

### 4.3. Kalendarz i Planowanie (Calendar)

| ID     | Scenariusz                                        | Oczekiwany Rezultat                                                                                    | Priorytet |
| ------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------- |
| CAL-01 | Przypisanie przepisu do slotu (Optimistic Update) | Natychmiastowe pojawienie się przepisu w slocie (przed odpowiedzią serwera). W razie błędu – rollback. | Wysoki    |
| CAL-02 | Nawigacja między tygodniami                       | Poprawne ładowanie przypisań dla wybranego zakresu dat. URL update (`?week=...`).                      | Wysoki    |
| CAL-03 | Responsywność kalendarza (Mobile)                 | Widok akordeonu zamiast siatki. Poprawne działanie rozwijania dni.                                     | Średni    |

### 4.4. Listy Zakupów (Shopping Lists)

| ID      | Scenariusz                        | Oczekiwany Rezultat                                                                                        | Priorytet |
| ------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------- |
| LIST-01 | Generowanie z kalendarza (Wizard) | Poprawne pobranie przepisów z wybranego tygodnia, agregacja tych samych składników.                        | Wysoki    |
| LIST-02 | Kategoryzacja AI (Fallback)       | W przypadku błędu API AI, składniki trafiają do kategorii "Inne" lub domyślnej, proces nie jest blokowany. | Średni    |
| LIST-03 | Edycja listy przed zapisem        | Możliwość usunięcia, zmiany ilości lub kategorii składnika w kroku Preview.                                | Średni    |
| LIST-04 | Eksport PDF                       | Pobranie pliku PDF, czytelność polskich znaków, poprawna lista składników.                                 | Średni    |
| LIST-05 | Odhaczanie składników             | Zmiana stanu `is_checked` (przekreślenie), stan zachowany po odświeżeniu (persystencja w DB).              | Wysoki    |

## 5. Środowisko i Dane Testowe

- **Środowisko Lokalne (Dev):** Uruchomienie lokalne z podpiętą bazą Supabase (projekt testowy/lokalny Docker).
- **Środowisko Staging:** Deploy (np. Vercel/Netlify) podpięty pod oddzielną bazę Supabase Staging.
- **Dane Testowe (Seed):**
  - Użytkownik standardowy (z przepisami i planami).
  - Użytkownik "Nowy" (pusty dashboard - weryfikacja `EmptyState`).
  - Zestaw 50+ przepisów do testów paginacji.

## 6. Narzędzia do Testowania

- **Unit & Integration:** `Vitest` (kompatybilny z Astro/Vite) + `React Testing Library`.
- **E2E:** `Playwright` (zalecany dla nowoczesnych aplikacji webowych, łatwa obsługa wielu kart/kontekstów auth).
- **API Testing:** `Postman` lub testy integracyjne w `Vitest` (supertest-like).
- **Linting/Static Analysis:** `ESLint`, `Prettier`, `TypeScript` (strict mode).

## 7. Harmonogram Testów (Przykładowy Sprint)

1.  **Dzień 1-2:** Konfiguracja środowiska testowego, napisanie testów jednostkowych dla krytycznych utilsów i schematów Zod.
2.  **Dzień 3-4:** Testy komponentów (React) – skupienie na formularzach i logice `Wizard`.
3.  **Dzień 5-6:** Implementacja testów E2E dla "Happy Path" (Rejestracja -> Zakupy).
4.  **Dzień 7:** Testy manualne (eksploracyjne), weryfikacja UI na urządzeniach mobilnych, testy eksportu PDF.
5.  **Dzień 8:** Raportowanie błędów i re-testy poprawek.

## 8. Kryteria Akceptacji

- Wszystkie testy automatyczne (Unit/E2E) przechodzą (Pass).
- Brak błędów krytycznych (Critical) i wysokich (High) w Backlogu.
- Pokrycie kodu (Code Coverage): min. 80% dla logiki biznesowej (`src/lib`), min. 60% dla komponentów UI.
- Aplikacja buduje się i uruchamia bez błędów w konsoli (zarówno serwerowej jak i przeglądarki).
- Poprawna walidacja dostępności (Accessibility) – podstawowa nawigacja klawiaturą (tabindex, focus visible).

## 9. Procedury Raportowania Błędów

Zgłoszenia błędów (Issues) powinny zawierać:

1.  **Tytuł:** Zwięzły opis problemu [MODUŁ] Opis.
2.  **Opis:** Kroki do reprodukcji (Steps to reproduce).
3.  **Oczekiwany rezultat:** Co powinno się stać.
4.  **Rzeczywisty rezultat:** Co się stało.
5.  **Środowisko:** Przeglądarka, OS, wersja aplikacji.
6.  **Załączniki:** Screenshoty, logi z konsoli, nagranie wideo (dla błędów UI).
7.  **Priorytet:** Critical / High / Medium / Low.

</plan_testów>
