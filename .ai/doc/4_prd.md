# Dokument wymagań produktu (PRD) - ShopMate MVP

## 1. Przegląd produktu

### 1.1 Nazwa produktu

ShopMate - Inteligentny planer posiłków i list zakupów

### 1.2 Wersja dokumentu

Wersja: 1.0 MVP
Data utworzenia: 2025-01-23
Autor: Product Management Team

### 1.3 Streszczenie wykonawcze

ShopMate to aplikacja webowa umożliwiająca tworzenie list zakupów na podstawie przepisów kulinarnych przyporządkowanych do poszczególnych dni i posiłków w kalendarzu tygodniowym. Aplikacja automatyzuje proces planowania posiłków i generowania list zakupów z wykorzystaniem sztucznej inteligencji do kategoryzacji składników.

### 1.4 Cele produktu

- Umożliwienie użytkownikom zaplanowania tygodnia posiłków w czasie krótszym niż 10 minut
- Automatyzacja procesu tworzenia list zakupów z agregacją składników
- Oszczędność czasu użytkowników przy zakupach spożywczych
- Redukcja marnotrawstwa żywności poprzez systematyczne planowanie
- Zapewnienie intuicyjnego, responsywnego interfejsu użytkownika (mobile i desktop)

### 1.5 Grupa docelowa

Główni użytkownicy:

- Osoby planujące posiłki dla rodziny
- Osoby żyjące samodzielnie i organizujące zakupy
- Użytkownicy dbający o redukcję marnotrawstwa żywności
- Osoby poszukujące oszczędności czasu i pieniędzy

Charakterystyka:

- Wiek: 25-55 lat
- Posiadają smartfon lub komputer
- Robią zakupy spożywcze minimum raz w tygodniu
- Mają podstawową wiedzę o korzystaniu z aplikacji webowych

### 1.6 Kluczowe cechy produktu (MVP)

- Zarządzanie przepisami kulinarnymi (CRUD)
- Kalendarz tygodniowy z przypisywaniem przepisów (7 dni × 4 posiłki)
- System autoryzacji użytkowników (Supabase Auth)
- Inteligentne generowanie list zakupów z agregacją składników
- AI kategoryzacja składników (OpenAI GPT-4o mini)
- Eksport list zakupów do PDF i TXT
- Responsywny interfejs (mobile-first, WCAG AA)
- Row Level Security dla pełnej izolacji danych użytkowników

### 1.7 Stack technologiczny

- Frontend: Astro 5, React 19, TypeScript 5, Tailwind CSS 4, Shadcn/ui
- Backend: Supabase (PostgreSQL, Auth, RLS)
- AI: OpenAI API (GPT-4o mini)
- Biblioteki: @react-pdf/renderer, Zod, TanStack Query
- Hosting: Vercel/Netlify
- Monitoring: Sentry, Plausible/Google Analytics 4

## 2. Problem użytkownika

### 2.1 Identyfikacja problemu

Użytkownicy napotykają następujące trudności:

Planowanie posiłków na cały tydzień:

- Brak systematycznego podejścia do organizacji menu
- Trudność w zapamiętaniu co i kiedy ugotować
- Chaos w codziennym podejmowaniu decyzji "co na obiad"

Tworzenie kompletnych list zakupów:

- Zapominanie o składnikach przy tworzeniu ręcznych list
- Wielokrotne wizyty w sklepie z powodu brakujących produktów
- Kupowanie niepotrzebnych produktów (duplikaty)

Koordynacja składników z wielu przepisów:

- Czasochłonne ręczne zbieranie informacji z różnych źródeł
- Trudność w śledzeniu jakie składniki są potrzebne w danym tygodniu
- Brak centralnego miejsca przechowywania przepisów

Optymalizacja zakupów:

- Trudność w agregacji składników z wielu przepisów
- Brak automatycznego sumowania powtarzających się składników
- Nieczytelne, chaotyczne listy zakupów

### 2.2 Wpływ problemu

Konsekwencje dla użytkowników:

- Strata czasu: średnio 2-3 godziny tygodniowo na planowanie i zakupy
- Marnotrawstwo żywności: kupowanie składników które już posiadają
- Stres: codzienne podejmowanie decyzji "co ugotować"
- Koszty finansowe: wielokrotne wizyty w sklepie, impulse buying
- Frustracja: niekompletne zakupy, brakujące składniki

### 2.3 Rozwiązanie oferowane przez ShopMate

ShopMate rozwiązuje te problemy poprzez:

- Centralizację przepisów w jednym miejscu
- Wizualne planowanie posiłków w kalendarzu tygodniowym
- Automatyczne generowanie zagregowanych list zakupów
- AI kategoryzację składników ułatwiającą zakupy w sklepie
- Eksport list do formatu PDF/TXT gotowego do użycia

Korzyści dla użytkowników:

- Oszczędność czasu: planowanie tygodnia w mniej niż 10 minut
- Redukcja marnotrawstwa: tylko potrzebne składniki na liście
- Organizacja: wszystkie przepisy i plany w jednym miejscu
- Wygoda: gotowa lista zakupów dostępna na telefonie

## 3. Wymagania funkcjonalne

### 3.1 Zarządzanie przepisami kulinarnymi

FR-001: Dodawanie przepisu

- Użytkownik może utworzyć nowy przepis poprzez strukturalny formularz
- Pola formularza: nazwa (3-100 znaków), składniki (dynamiczna lista), instrukcje (10-5000 znaków)
- Każdy składnik zawiera: nazwę (wymagane), ilość (opcjonalne), jednostkę (opcjonalne)
- Możliwość dodawania wielu składników za pomocą przycisku "Dodaj składnik"
- Walidacja danych w czasie rzeczywistym z komunikatami błędów
- Zapisanie przepisu tworzy nowy rekord w bazie danych z powiązanymi składnikami

FR-002: Przeglądanie przepisów

- Wyświetlanie listy wszystkich przepisów użytkownika
- Wyszukiwanie po nazwie przepisu (case-insensitive substring matching)
- Sortowanie: alfabetyczne (A-Z, Z-A), według daty dodania
- Kliknięcie przepisu otwiera widok szczegółów
- Responsywny layout: karty na desktop, lista na mobile

FR-003: Wyświetlanie szczegółów przepisu

- Widok pojedynczego przepisu z pełnymi informacjami
- Wyświetlanie: nazwa, lista składników (ilość, jednostka, nazwa), instrukcje
- Informacja o liczbie przypisań w kalendarzu (jeśli istnieją)
- Przyciski akcji: Edytuj, Usuń, Powrót do listy

FR-004: Edycja przepisu

- Użytkownik może modyfikować wszystkie pola istniejącego przepisu
- Ten sam formularz co przy dodawaniu, wypełniony aktualnymi danymi
- Możliwość dodawania, usuwania i modyfikacji składników
- Live update: zmiany propagują się do wszystkich przypisań w kalendarzu
- Snapshot pattern: wcześniej wygenerowane listy zakupów pozostają niezmienione

FR-005: Usuwanie przepisu

- Przycisk "Usuń" w widoku szczegółów przepisu
- Dialog potwierdzenia jeśli przepis jest przypisany w kalendarzu
- Komunikat: liczba przypisań które zostaną usunięte
- Przyciski: "Anuluj" (domyślny focus), "Usuń przepis i przypisania" (czerwony)
- Cascade delete: usunięcie przepisu usuwa składniki i przypisania w kalendarzu

FR-006: Walidacja przepisów

- Nazwa: 3-100 znaków, wymagane
- Instrukcje: 10-5000 znaków, wymagane
- Składniki: minimum 1, maksimum 50 na przepis
- Nazwa składnika: 1-100 znaków, wymagane
- Ilość składnika: liczba dodatnia, opcjonalne
- Jednostka składnika: max 50 znaków, opcjonalne
- Komunikaty błędów inline pod polami formularza (polski)

### 3.2 Kalendarz tygodniowy posiłków

FR-007: Wyświetlanie kalendarza tygodniowego

- Wizualizacja 7 dni (Poniedziałek-Niedziela) × 4 posiłki dziennie
- Typy posiłków: Śniadanie, Drugie śniadanie, Obiad, Kolacja
- Struktura: 28 komórek (7 dni × 4 posiłki)
- Responsywny layout: desktop - tabela 7×4, tablet - scrollowalny poziomo, mobile - accordion vertically stacked
- Wyświetlanie bieżącego tygodnia przy pierwszym wejściu

FR-008: Nawigacja między tygodniami

- Przyciski: "Poprzedni tydzień", "Bieżący tydzień", "Następny tydzień"
- Przechowywanie danych wszystkich tygodni w bazie danych
- URL zawiera parametr week_start_date dla deep linking
- Automatyczne obliczanie początku tygodnia (poniedziałek)

FR-009: Przypisywanie przepisu do komórki kalendarza

- Przycisk "Przypisz przepis" w każdej pustej komórce
- Kliknięcie otwiera modal z listą przepisów użytkownika
- Modal zawiera: search bar, lista przepisów (infinite scroll)
- Kliknięcie przepisu przypisuje go do wybranej komórki
- Jeden przepis na komórkę w MVP (ograniczenie architektury)
- Zapisanie przypisania: user_id, recipe_id, date, meal_type

FR-010: Wyświetlanie przypisanego przepisu

- Komórka z przypisanym przepisem wyświetla nazwę przepisu
- Truncate nazwy po 30 znakach z "..."
- Hover: tooltip z pełną nazwą przepisu
- Przycisk "×" do usunięcia przypisania (bez dialog potwierdzenia)
- Kliknięcie na nazwę: podgląd szczegółów przepisu (modal lub side panel)

FR-011: Usuwanie przypisania

- Przycisk "×" widoczny przy każdym przypisanym przepisie
- Natychmiastowe usunięcie bez dialog potwierdzenia (szybka akcja)
- Komórka wraca do stanu pustego z przyciskiem "Przypisz przepis"
- Toast notification: "Przepis usunięty z kalendarza"

### 3.3 System autoryzacji użytkowników

FR-012: Rejestracja użytkownika

- Formularz rejestracji: email, hasło, potwierdzenie hasła
- Walidacja email: format email, lowercase, trim
- Walidacja hasła: 8-100 znaków, minimum 1 wielka litera, 1 cyfra
- Potwierdzenie hasła: musi być identyczne z hasłem
- Wykorzystanie Supabase Auth do zarządzania kontami
- Weryfikacja email opcjonalna w MVP (można pominąć)
- Przekierowanie do dashboard po udanej rejestracji

FR-013: Logowanie użytkownika

- Formularz logowania: email, hasło
- Przycisk "Zaloguj się"
- Link "Nie pamiętam hasła" → reset hasła
- Link "Nie masz konta? Zarejestruj się"
- Sesja przechowywana w cookies (Supabase default)
- Przekierowanie do dashboard po udanym logowaniu

FR-014: Reset hasła

- Formularz reset hasła: email
- Wysłanie email z linkiem resetującym (Supabase magic link)
- Strona resetowania: nowe hasło, potwierdzenie hasła
- Walidacja identyczna jak przy rejestracji
- Toast notification: "Hasło zostało zmienione"

FR-015: Wylogowanie

- Przycisk "Wyloguj" w nawigacji
- Usunięcie sesji z cookies
- Przekierowanie do strony logowania
- Toast notification: "Zostałeś wylogowany"

FR-016: Ochrona tras (route guards)

- Middleware sprawdza sesję użytkownika dla chronionych tras
- Chronione trasy: /dashboard, /recipes, /calendar, /shopping-lists
- Publiczne trasy: /login, /register, /reset-password, landing page
- Przekierowanie do /login jeśli użytkownik niezalogowany próbuje dostać się do chronionej trasy

### 3.4 Generowanie list zakupów

FR-017: Interfejs wyboru źródła listy zakupów

- Dwa tryby generowania: "Z kalendarza" lub "Z przepisów"
- Tryb "Z kalendarza": checkboxy dla dni (Pon-Niedz) i posiłków (4 typy)
- Shortcut "Cały tydzień": zaznacza wszystkie checkboxy
- Tryb "Z przepisów": lista przepisów z checkboxami
- Search bar w trybie "Z przepisów" dla szybkiego znajdowania
- Przycisk "Generuj listę zakupów" (disabled jeśli nic nie zaznaczone)

FR-018: Agregacja składników

- Fetch składników z zaznaczonych przepisów/dni-posiłków
- Normalizacja przed agregacją: trim wielokrotnych spacji, lowercase
- Grupowanie: case-insensitive matching (nazwa + jednostka)
- Sumowanie ilości dla identycznych składników (jeśli numeryczne)
- Składniki bez ilości jako osobne pozycje (nie agregowane)
- Przykład: "200g mąki" + "300G Mąki" = "500g mąki"

FR-019: AI kategoryzacja składników

- Batch request do OpenAI GPT-4o mini ze wszystkimi składnikami
- 7 kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne
- Prompt: lista składników numerowana → JSON mapping index→kategoria
- Timeout: 10 sekund
- Retry logic: maksymalnie 2 próby z exponential backoff (1s, 2s)
- Fallback: przy błędzie wszystkie składniki → kategoria "Inne"
- UX: spinner + komunikat "Kategoryzuję składniki..." podczas oczekiwania
- Optimistic UI: użytkownik może edytować listę podczas pracy AI

FR-020: Edycja wygenerowanej listy zakupów

- Preview listy: składniki pogrupowane po kategoriach
- Każdy składnik: checkbox (niezaznaczony), ilość, jednostka, nazwa
- Dropdown przy każdym składniku: zmiana kategorii ręcznie
- Przycisk "+ Dodaj składnik": dodanie nowej pozycji manualnie
- Przycisk "🗑️": usunięcie składnika z listy
- Drag-and-drop składników między kategoriami (opcjonalne w MVP)

FR-021: Zapis listy zakupów

- Przycisk "Zapisz listę"
- Prompt: pole "Nazwa listy" (opcjonalnie, default: "Lista zakupów - [data]")
- Zapis do tabeli shopping_lists + shopping_list_items
- Lista jako niemutowalny snapshot (tylko odczyt po zapisie)
- Przekierowanie do widoku zapisanej listy
- Toast notification: "Lista zakupów zapisana"

FR-022: Historia list zakupów

- Wyświetlanie wszystkich zapisanych list użytkownika
- Sortowanie: według daty utworzenia (najnowsze pierwsze)
- Każda pozycja: nazwa listy, data utworzenia, zakres dat (jeśli z kalendarza)
- Kliknięcie: otwarcie szczegółów listy (readonly)
- Przycisk "Usuń" przy każdej liście (z dialog potwierdzenia)

FR-023: Obsługa pustych wyborów

- Jeśli wszystkie wybrane komórki kalendarza puste: komunikat błędu "Wybrane posiłki nie mają przypisanych przepisów"
- Jeśli żaden przepis nie zaznaczony: przycisk "Generuj" disabled
- Pomijanie pustych komórek bez ostrzeżenia jeśli przynajmniej jedna niepusta

### 3.5 Eksport list zakupów

FR-024: Eksport do PDF

- Przycisk "Eksportuj PDF" w widoku listy zakupów
- Biblioteka: @react-pdf/renderer (client-side generation)
- Layout: A4 pionowy, standardowy font Helvetica
- Nagłówek: "Lista zakupów - [nazwa listy]", data generowania
- Treść: kategorie jako sekcje (bold, uppercase), składniki z checkboxami ☐
- Stopka: "Wygenerowano przez ShopMate"
- Preview modal przed pobraniem: podgląd PDF + przyciski "Pobierz"/"Anuluj"
- Filename: [nazwa-listy]-[data].pdf (lowercase, spacje → myślniki)

FR-025: Eksport do TXT

- Przycisk "Eksportuj TXT" w widoku listy zakupów
- Format: plaintext linijka po linijce bez checkboxów
- Struktura: nagłówek (50x =), kategorie (uppercase), składniki, stopka
- Encoding: UTF-8
- Direct download bez preview
- Filename: [nazwa-listy]-[data].txt (lowercase, spacje → myślniki)

FR-026: Kolejność kategorii w eksporcie

- Zawsze stała kolejność: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne
- Pominięcie pustych kategorii (bez składników)
- Składniki w kategorii: sortowanie alfabetyczne

### 3.6 Responsywny interfejs użytkownika

FR-027: Breakpointy i layout

- Desktop: ≥1024px - pełny layout z sidebarami
- Tablet: 768-1023px - zredukowany layout, scrollowalny poziomo kalendarz
- Mobile: <768px (minimum 320px) - accordion, vertically stacked, hamburger menu
- Mobile-first approach: optymalizacja dla smartfonów jako główny use case

FR-028: Accessibility (a11y)

- WCAG AA compliance przez Shadcn/ui + Tailwind
- Keyboard navigation: tab, enter, escape, strzałki
- ARIA labels dla wszystkich interactive elements
- Semantic HTML: button, nav, main, form, article, section
- Focus indicators: Tailwind ring-2 ring-offset-2
- Alt text dla wszystkich ikon i obrazów
- Cel: Lighthouse Accessibility score ≥90/100

FR-029: Touch-friendly UI na mobile

- Minimum 44px tap targets dla wszystkich przycisków
- Spacing między elementami: minimum 8px
- Większe pola formularzy na mobile
- Sticky header z nawigacją na mobile
- Bottom navigation bar z kluczowymi akcjami

FR-030: Loading states i feedback

- Spinners dla długotrwałych operacji (>500ms)
- Skeleton screens dla ładowania list przepisów/kalendarza
- Toast notifications dla komunikatów sukcesu/błędu
- Progress bar dla multi-step operations (generowanie listy)
- Optimistic UI: natychmiastowa reakcja, rollback przy błędzie

## 4. Granice produktu

### 4.1 Funkcjonalności wykluczone z MVP

Funkcje odłożone do wersji 1.1:

- Import przepisów z pliku (JPG, PDF, DOCX) - wymaga OCR i zaawansowanego parsowania
- Aplikacje mobilne natywne (iOS, Android) - na początek tylko aplikacja webowa
- Drag-and-drop w kalendarzu - na MVP przycisk "Przypisz przepis"
- PWA i offline support - wymaga Service Worker, cache strategies
- Wyszukiwanie po składnikach - "Pokaż przepisy z kurczakiem"

Funkcje społecznościowe:

- Udostępnianie przepisów dla innych użytkowników
- Profile publiczne i followowanie użytkowników
- Komentarze i oceny przepisów
- Społeczność i feed aktywności

Integracje zewnętrzne:

- Integracja z zewnętrznymi serwisami zakupowymi (Frisco, Carrefour API)
- Import przepisów z zewnętrznych stron (web scraping)
- Integracja z asystentami głosowymi (Alexa, Google Assistant)
- Integracja z kalendarzem zewnętrznym (Google Calendar, Outlook)

Zaawansowane planowanie posiłków:

- Powtarzające się posiłki (templates)
- Szablony tygodniowe
- Kalendarz miesięczny i wielotygodniowy
- Planowanie na wiele tygodni naprzód
- Kopiowanie tygodnia

Wielojęzyczność:

- Obsługa wielu języków - na początek tylko język polski
- Tłumaczenia automatyczne przepisów

Zaawansowane wyszukiwanie i filtrowanie:

- Filtrowanie po składnikach
- Filtrowanie po czasie przygotowania
- Wyszukiwanie pełnotekstowe (full-text search)
- Tagi i kategorie przepisów
- Zaawansowane sortowanie

Powiadomienia:

- Email notifications
- SMS notifications
- Push notifications
- Przypomnienia o zakupach

Obsługa diet i alergii:

- Profile dietetyczne (wegetariańska, wegańska, bezglutenowa)
- Oznaczanie alergenów w przepisach
- Automatyczne filtrowanie przepisów według diety

Zaawansowane zarządzanie użytkownikami:

- Role i uprawnienia (admin, użytkownik)
- Konta rodzinne (family sharing)
- Udostępnianie list między użytkownikami
- Uwierzytelnianie dwuskładnikowe (2FA)
- OAuth (logowanie przez Google/Facebook) - odłożone do v1.1
- Szyfrowanie danych end-to-end

Analityka i raporty:

- Statystyki najczęściej używanych przepisów
- Historia zakupów z analizą trendów
- Szacowanie kosztów zakupów
- Raporty dietetyczne (kalorie, makroskładniki)

Zarządzanie zapasami:

- Spiżarnia (pantry management)
- Tracking dat ważności produktów
- Automatyczne odejmowanie składników ze spiżarni

### 4.2 Ograniczenia techniczne MVP

Limity funkcjonalne:

- Jeden przepis na komórkę kalendarza (brak wielu przepisów na posiłek)
- Maksymalnie 50 składników na przepis
- Maksymalnie 20 przepisów na jedną listę zakupów
- Brak automatycznej konwersji jednostek miar (kg ↔ g, litry ↔ ml)
- Brak offline support - wymaga aktywnego połączenia internetowego

Rate limiting:

- Supabase default: 100 requests/min na użytkownika
- OpenAI API: zgodnie z limitem konta
- Brak globalnych limitów liczby przepisów/list (unlimited w MVP)

Performance:

- Lista przepisów: pagination po 20 (jeśli >100 przepisów)
- Kalendarz: ładowanie pojedynczego tygodnia (lazy loading)
- AI kategoryzacja: max 100 składników na request

Bezpieczeństwo:

- Podstawowa autentykacja email + hasło (bez 2FA)
- Brak szyfrowania end-to-end (dane przechowywane plaintext w Supabase)
- Row Level Security jako główny mechanizm izolacji danych

### 4.3 Założenia i zależności

Założenia biznesowe:

- Użytkownicy mają dostęp do internetu podczas korzystania z aplikacji
- Użytkownicy posiadają urządzenia z nowoczesnymi przeglądarkami (Chrome 90+, Safari 14+, Firefox 88+)
- Grupa docelowa ma podstawową znajomość aplikacji webowych

Zależności zewnętrzne:

- Dostępność Supabase (Auth, Database)
- Dostępność OpenAI API (GPT-4o mini)
- Stabilność Vercel/Netlify hosting
- Poprawne działanie @react-pdf/renderer w przeglądarkach

Zależności wewnętrzne:

- Przepis musi istnieć aby móc go przypisać do kalendarza
- Przepis musi być przypisany w kalendarzu lub zaznaczony ręcznie aby wygenerować listę
- Lista zakupów musi być zapisana aby móc ją eksportować

### 4.4 Ryzyka i mitigacje

Ryzyko: Automatyczna kategoryzacja AI może być niedokładna (target 80% accuracy)
Mitigacja: Użytkownik może ręcznie zmienić kategorię każdego składnika przed zapisem

Ryzyko: OpenAI API może być niedostępne lub przekroczyć timeout
Mitigacja: Fallback do kategorii "Inne" + możliwość ręcznej kategoryzacji

Ryzyko: Brak konwersji jednostek może być frustrujące dla użytkowników
Mitigacja: Dokumentacja best practices (używanie spójnych jednostek), roadmap v1.1

Ryzyko: Użytkownicy mogą oczekiwać wielu przepisów na jeden posiłek
Mitigacja: Komunikat w UI: "W MVP jeden przepis na posiłek. Funkcja wielu przepisów w v1.1"

Ryzyko: Bardzo długie listy zakupów (>100 składników) mogą przekroczyć token limit AI
Mitigacja: Limit 20 przepisów na listę, chunking AI requests jeśli potrzebne

Ryzyko: Użytkownicy mogą próbować używać aplikacji offline
Mitigacja: Graceful error handling z komunikatem "Sprawdź połączenie internetowe"

## 5. Historyjki użytkowników

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

### 5.2 Zarządzanie przepisami

US-006: Dodawanie nowego przepisu
Jako użytkownik, chcę dodać nowy przepis do mojej kolekcji, aby móc go później przypisać do kalendarza posiłków.

Kryteria akceptacji:

- Przycisk "Dodaj przepis" widoczny na stronie /recipes i w nawigacji
- Formularz zawiera: pole nazwa, textarea instrukcje, dynamiczna lista składników
- Każdy składnik ma pola: ilość (numeryczna, opcjonalna), jednostka (tekstowa, opcjonalna), nazwa (tekstowa, wymagana)
- Przycisk "+ Dodaj składnik" dodaje nowy wiersz składnika
- Ikonka "🗑️" przy składniku usuwa ten składnik
- Walidacja: nazwa 3-100 znaków, instrukcje 10-5000 znaków, minimum 1 składnik, maksimum 50
- Komunikaty błędów inline pod polami w języku polskim
- Przycisk "Zapisz" zapisuje przepis do bazy danych z powiązanymi składnikami
- Po zapisie przekierowanie do widoku szczegółów przepisu
- Toast notification: "Przepis dodany pomyślnie"

US-007: Przeglądanie listy przepisów
Jako użytkownik, chcę przeglądać wszystkie moje przepisy, aby łatwo znaleźć ten którego potrzebuję.

Kryteria akceptacji:

- Strona /recipes wyświetla wszystkie przepisy użytkownika
- Search bar u góry strony z placeholderem "Szukaj przepisu..."
- Wyszukiwanie w czasie rzeczywistym (debounce 300ms) po nazwie przepisu
- Case-insensitive substring matching
- Dropdown sortowania: "Alfabetycznie A-Z", "Alfabetycznie Z-A", "Najnowsze", "Najstarsze"
- Responsywny layout: karty 3 kolumny na desktop, 2 na tablet, 1 na mobile
- Każda karta pokazuje: nazwę przepisu, liczbę składników, datę dodania
- Kliknięcie karty otwiera szczegóły przepisu
- Przycisk "Dodaj przepis" sticky w prawym dolnym rogu
- Lazy loading: ładowanie po 20 przepisów (infinite scroll)
- Empty state: "Brak przepisów. Dodaj pierwszy przepis!" jeśli lista pusta

US-008: Wyświetlanie szczegółów przepisu
Jako użytkownik, chcę zobaczyć pełne szczegóły przepisu, aby zapoznać się z instrukcjami i składnikami.

Kryteria akceptacji:

- Strona /recipes/[id] wyświetla pojedynczy przepis
- Sekcja nagłówka: nazwa przepisu, data dodania, data ostatniej edycji
- Sekcja składniki: lista wszystkich składników (ilość, jednostka, nazwa)
- Sekcja instrukcje: pełny tekst instrukcji z zachowaniem formatowania (newlines)
- Informacja: "Ten przepis jest przypisany do X posiłków w kalendarzu" jeśli istnieją przypisania
- Przyciski akcji: "Edytuj", "Usuń", "Powrót do listy"
- Przycisk "Edytuj" otwiera formularz edycji
- Przycisk "Usuń" otwiera dialog potwierdzenia
- Przycisk "Powrót do listy" kieruje do /recipes

US-009: Edycja istniejącego przepisu
Jako użytkownik, chcę edytować przepis, aby poprawić błędy lub zaktualizować informacje.

Kryteria akceptacji:

- Przycisk "Edytuj" w widoku szczegółów przepisu
- Formularz identyczny jak przy dodawaniu, wypełniony aktualnymi danymi
- Możliwość modyfikacji wszystkich pól: nazwa, instrukcje, składniki
- Możliwość dodawania nowych składników
- Możliwość usuwania istniejących składników
- Możliwość modyfikacji kolejności składników (sort_order)
- Walidacja identyczna jak przy dodawaniu
- Przycisk "Zapisz zmiany" aktualizuje przepis w bazie danych
- Live update: zmiany propagują się do wszystkich przypisań w kalendarzu
- Snapshot pattern: wcześniej wygenerowane listy zakupów pozostają niezmienione
- Po zapisie przekierowanie do widoku szczegółów
- Toast notification: "Przepis zaktualizowany pomyślnie"
- Informacja w formularzu: "Zmiany zaktualizują wszystkie przypisania w kalendarzu"

US-010: Usuwanie przepisu
Jako użytkownik, chcę usunąć przepis którego już nie potrzebuję, aby utrzymać porządek w kolekcji.

Kryteria akceptacji:

- Przycisk "Usuń" w widoku szczegółów przepisu
- Sprawdzenie czy przepis jest przypisany w kalendarzu
- Jeśli przypisany: dialog "Ten przepis jest przypisany do X posiłków. Usunięcie spowoduje usunięcie przypisań. Kontynuować?"
- Jeśli nie przypisany: dialog "Czy na pewno chcesz usunąć ten przepis?"
- Przyciski w dialogu: "Anuluj" (domyślny focus), "Usuń" (czerwony, destructive)
- Po potwierdzeniu cascade delete: przepis + składniki + przypisania w kalendarzu
- Przekierowanie do /recipes
- Toast notification: "Przepis usunięty" lub "Przepis usunięty wraz z X przypisaniami"

### 5.3 Kalendarz tygodniowy

US-011: Wyświetlanie kalendarza tygodniowego
Jako użytkownik, chcę zobaczyć kalendarz tygodniowy z posiłkami, aby planować menu na nadchodzące dni.

Kryteria akceptacji:

- Strona /calendar wyświetla kalendarz 7 dni × 4 posiłki = 28 komórek
- Dni tygodnia: Poniedziałek, Wtorek, Środa, Czwartek, Piątek, Sobota, Niedziela
- Typy posiłków: Śniadanie, Drugie śniadanie, Obiad, Kolacja
- Responsywny layout: desktop - tabela 7×4, tablet - scrollowalny poziomo, mobile - accordion
- Domyślnie wyświetlany bieżący tydzień (obliczany od bieżącej daty)
- Nagłówek pokazuje zakres dat: "Tydzień 20-26 stycznia 2025"
- Każda komórka zawiera datę i typ posiłku
- Pusta komórka: przycisk "Przypisz przepis"
- Komórka z przepisem: nazwa przepisu (truncate 30 znaków) + przycisk "×"

US-012: Nawigacja między tygodniami
Jako użytkownik, chcę nawigować między różnymi tygodniami, aby planować posiłki z wyprzedzeniem lub sprawdzić historyczne plany.

Kryteria akceptacji:

- Przyciski nawigacji: "← Poprzedni tydzień", "Bieżący tydzień", "Następny tydzień →"
- Kliknięcie "Poprzedni tydzień" ładuje tydzień o 7 dni wcześniej
- Kliknięcie "Następny tydzień" ładuje tydzień o 7 dni później
- Kliknięcie "Bieżący tydzień" wraca do tygodnia zawierającego dzisiejszą datę
- URL zawiera parametr week_start_date: /calendar?week=2025-01-20
- Deep linking: otwarcie URL z parametrem week ładuje odpowiedni tydzień
- Dane wszystkich tygodni przechowywane w bazie danych (brak limitu historii)

US-013: Przypisywanie przepisu do komórki kalendarza
Jako użytkownik, chcę przypisać przepis do konkretnego dnia i posiłku, aby zaplanować co będę jeść.

Kryteria akceptacji:

- Kliknięcie "Przypisz przepis" w pustej komórce otwiera modal
- Modal zawiera: search bar, listę przepisów użytkownika
- Search bar: wyszukiwanie w czasie rzeczywistym po nazwie przepisu
- Lista przepisów: infinite scroll, ładowanie po 20
- Każdy przepis wyświetla: nazwę, liczbę składników
- Kliknięcie przepisu zamyka modal i przypisuje przepis do komórki
- Komórka pokazuje nazwę przepisu (truncate 30 znaków)
- Hover na nazwie: tooltip z pełną nazwą
- Przycisk "×" pojawia się przy nazwie
- Jeden przepis na komórkę (ograniczenie MVP)
- Zapisanie przypisania: user_id, recipe_id, date, meal_type
- Toast notification: "Przepis przypisany do [dzień] - [posiłek]"

US-014: Podgląd przepisu z kalendarza
Jako użytkownik, chcę szybko podejrzeć szczegóły przypisanego przepisu, aby przypomnieć sobie składniki i instrukcje.

Kryteria akceptacji:

- Kliknięcie na nazwę przypisanego przepisu otwiera podgląd
- Podgląd jako modal lub side panel
- Wyświetlanie: nazwa przepisu, składniki, instrukcje
- Przycisk "Edytuj przepis" kieruje do /recipes/[id]/edit
- Przycisk "Usuń z kalendarza" usuwa przypisanie (bez usuwania przepisu)
- Przycisk "Zamknij" zamyka podgląd
- Escape key zamyka podgląd

US-015: Usuwanie przypisania z kalendarza
Jako użytkownik, chcę usunąć przepis z kalendarza, aby zmienić plan posiłków bez usuwania samego przepisu.

Kryteria akceptacji:

- Przycisk "×" widoczny przy każdym przypisanym przepisie
- Kliknięcie "×" usuwa przypisanie bez dialog potwierdzenia (szybka akcja)
- Komórka wraca do stanu pustego z przyciskiem "Przypisz przepis"
- Przepis pozostaje w kolekcji użytkownika (nie jest usuwany)
- Toast notification: "Przepis usunięty z kalendarza"
- Optimistic UI: natychmiastowe usunięcie, rollback przy błędzie API

### 5.4 Generowanie list zakupów

US-016: Wybór trybu generowania listy
Jako użytkownik, chcę wybrać czy generować listę z kalendarza czy z ręcznie wybranych przepisów, aby mieć elastyczność w planowaniu zakupów.

Kryteria akceptacji:

- Strona /shopping-lists/generate z dwoma trybami
- Radio buttons: "Z kalendarza" (default) lub "Z przepisów"
- Tryb "Z kalendarza": checkboxy dla dni (Pon-Niedz) i posiłków (4 typy)
- Shortcut: przycisk "Zaznacz cały tydzień" zaznacza wszystkie checkboxy
- Tryb "Z przepisów": lista przepisów z checkboxami
- Search bar w trybie "Z przepisów" dla szybkiego znajdowania
- Licznik: "Zaznaczono X przepisów" lub "Zaznaczono X posiłków"
- Przycisk "Generuj listę zakupów" disabled jeśli nic nie zaznaczone
- Przycisk aktywny gdy minimum 1 przepis/posiłek zaznaczony

US-017: Generowanie listy z agregacją składników
Jako użytkownik, chcę automatycznie wygenerować listę zakupów z zaznaczonych przepisów, aby nie musieć ręcznie zbierać składników.

Kryteria akceptacji:

- Kliknięcie "Generuj listę zakupów" rozpoczyna proces
- Loading state: spinner + progress bar + komunikat "Pobieram składniki..."
- Fetch składników z zaznaczonych przepisów/posiłków
- Normalizacja: trim wielokrotnych spacji, lowercase dla porównania
- Agregacja: grupowanie identycznych składników (case-insensitive matching nazwy + jednostki)
- Sumowanie ilości dla numerycznych wartości: "200g mąki" + "300g mąki" = "500g mąki"
- Składniki bez ilości jako osobne pozycje (nie agregowane)
- Komunikat "Kategoryzuję składniki..." po agregacji
- AI request do OpenAI GPT-4o mini z wszystkimi składnikami
- Timeout 10s, retry 2x z backoff (1s, 2s)
- Fallback: przy błędzie wszystkie → "Inne"
- Przekierowanie do preview listy po zakończeniu

US-018: AI kategoryzacja składników
Jako użytkownik, chcę aby składniki były automatycznie kategoryzowane, aby łatwiej było robić zakupy w sklepie.

Kryteria akceptacji:

- AI kategoryzacja podczas generowania listy
- 7 kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne
- Batch request: wszystkie składniki w jednym API call do OpenAI
- Model: GPT-4o mini, temperatura=0
- Prompt: lista numerowana składników → JSON mapping {index: kategoria}
- Walidacja kategorii: tylko dozwolone kategorie, fallback "Inne"
- UX: spinner + komunikat "Kategoryzuję składniki..." (estimated time: 1-3s)
- Optimistic UI: użytkownik może edytować podczas kategoryzacji
- Error handling: jeśli AI fail → wszystkie składniki kategoria "Inne"
- Toast notification przy błędzie: "Automatyczna kategoryzacja niedostępna. Możesz ręcznie przypisać kategorie."

US-019: Edycja wygenerowanej listy zakupów
Jako użytkownik, chcę edytować wygenerowaną listę przed zapisem, aby dostosować ją do moich potrzeb.

Kryteria akceptacji:

- Preview listy zakupów pogrupowanej po kategoriach
- Kolejność kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne
- Każdy składnik: checkbox (niezaznaczony), ilość, jednostka, nazwa
- Dropdown przy składniku: zmiana kategorii (7 opcji)
- Przycisk "+ Dodaj składnik": modal z formularzem (nazwa, ilość, jednostka, kategoria)
- Przycisk "🗑️" przy składniku: usunięcie z listy (bez potwierdzenia)
- Możliwość zmiany ilości inline (kliknięcie → editable input)
- Przycisk "Zapisz listę" u góry (sticky)
- Przycisk "Anuluj" wraca do /shopping-lists bez zapisywania
- Zmiany są lokalne (nie zapisane) do momentu kliknięcia "Zapisz"

US-020: Zapisywanie listy zakupów
Jako użytkownik, chcę zapisać listę zakupów, aby móc do niej wrócić i wyeksportować później.

Kryteria akceptacji:

- Kliknięcie "Zapisz listę" otwiera dialog z polem nazwa
- Domyślna nazwa: "Lista zakupów - [data]"
- Użytkownik może zmienić nazwę (max 200 znaków)
- Jeśli z kalendarza: zapisanie week_start_date i week_end_date
- Zapis do tabeli shopping_lists + shopping_list_items
- Lista jako niemutowalny snapshot (readonly po zapisie)
- Przekierowanie do /shopping-lists/[id] (widok szczegółów)
- Toast notification: "Lista zakupów zapisana"
- Breadcrumbs: Listy zakupów > [nazwa listy]

US-021: Przeglądanie historii list zakupów
Jako użytkownik, chcę zobaczyć wszystkie moje zapisane listy zakupów, aby móc do nich wrócić i porównać zakupy.

Kryteria akceptacji:

- Strona /shopping-lists wyświetla wszystkie listy użytkownika
- Sortowanie: według daty utworzenia (najnowsze pierwsze)
- Każda pozycja: nazwa listy, data utworzenia, zakres dat (jeśli z kalendarza), liczba składników
- Kliknięcie listy otwiera szczegóły /shopping-lists/[id]
- Przycisk "Usuń" przy każdej liście
- Kliknięcie "Usuń": dialog potwierdzenia "Czy na pewno usunąć listę [nazwa]?"
- Po potwierdzeniu: cascade delete lista + items
- Toast notification: "Lista usunięta"
- Empty state: "Brak list zakupów. Wygeneruj pierwszą listę!"
- Przycisk "Generuj nową listę" kieruje do /shopping-lists/generate

US-022: Obsługa pustych wyborów przy generowaniu
Jako użytkownik, chcę otrzymać jasny komunikat gdy próbuję wygenerować listę z pustych komórek kalendarza.

Kryteria akceptacji:

- Jeśli wszystkie zaznaczone komórki kalendarza puste: komunikat błędu
- Alert: "Wybrane posiłki nie mają przypisanych przepisów. Przypisz przepisy w kalendarzu lub wybierz inne posiłki."
- Przycisk "Przejdź do kalendarza" kieruje do /calendar
- Jeśli przynajmniej jedna komórka niepusta: pomijanie pustych bez ostrzeżenia
- Komunikat informacyjny: "Pominięto X pustych posiłków"
- Jeśli żaden przepis nie zaznaczony w trybie "Z przepisów": przycisk "Generuj" disabled
- Tooltip na disabled przycisku: "Zaznacz minimum 1 przepis"

### 5.5 Eksport list zakupów

US-023: Eksport listy do PDF
Jako użytkownik, chcę wyeksportować listę zakupów do PDF, aby móc ją wydrukować lub mieć na telefonie podczas zakupów.

Kryteria akceptacji:

- Przycisk "Eksportuj PDF" w widoku szczegółów listy /shopping-lists/[id]
- Kliknięcie otwiera preview modal z renderowanym PDF
- PDF layout: A4 pionowy, font Helvetica
- Nagłówek: "Lista zakupów - [nazwa listy]", data generowania
- Jeśli z kalendarza: zakres dat "Tydzień [data start] - [data end]"
- Treść: kategorie jako sekcje (bold, uppercase, podkreślone)
- Składniki: checkbox ☐, ilość, jednostka, nazwa (jedna linia per składnik)
- Kolejność kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne
- Pominięcie pustych kategorii
- Stopka: "Wygenerowano przez ShopMate - [URL]"
- Modal przyciski: "Pobierz PDF", "Anuluj"
- Kliknięcie "Pobierz PDF": download pliku [nazwa-listy]-[data].pdf
- Filename: lowercase, spacje → myślniki, znaki specjalne usunięte

US-024: Eksport listy do TXT
Jako użytkownik, chcę wyeksportować listę do TXT, aby móc ją łatwo udostępnić przez wiadomość lub email.

Kryteria akceptacji:

- Przycisk "Eksportuj TXT" w widoku szczegółów listy
- Kliknięcie natychmiast pobiera plik (bez preview)
- Format plaintext: nagłówek (50x =), kategorie (uppercase), składniki, stopka
- Nagłówek: "LISTA ZAKUPÓW SHOPMATE", nazwa listy, zakres dat, separator
- Kategorie: nazwa kategorii (uppercase), separator (20x -), składniki
- Składniki: ilość jednostka nazwa (jedna linia per składnik)
- Kolejność kategorii identyczna jak PDF
- Stopka: separator (50x =), timestamp
- Encoding: UTF-8
- Filename: [nazwa-listy]-[data].txt
- Download pliku do lokalnego systemu

US-025: Kolejność kategorii w eksporcie
Jako użytkownik, chcę aby kategorie były zawsze w tej samej kolejności, aby łatwo było znaleźć składniki w sklepie.

Kryteria akceptacji:

- Stała kolejność kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne
- Zawsze ta sama kolejność w PDF, TXT i UI
- Pominięcie kategorii bez składników (nie wyświetlane puste sekcje)
- Składniki w kategorii: sortowanie alfabetyczne po nazwie
- Case-insensitive sorting składników

### 5.6 Responsywność i UI/UX

US-026: Responsywny layout na mobile
Jako użytkownik mobile, chcę aby aplikacja działała płynnie na smartfonie, aby móc planować posiłki w dowolnym miejscu.

Kryteria akceptacji:

- Aplikacja działa poprawnie na urządzeniach od 320px szerokości
- Breakpoint mobile: <768px
- Kalendarz na mobile: accordion (każdy dzień osobna sekcja expandable)
- Formularze: pełna szerokość, większe pola input (min 44px wysokość)
- Przyciski: minimum 44px tap target
- Nawigacja: hamburger menu z drawer
- Bottom navigation bar z kluczowymi akcjami: Przepisy, Kalendarz, Listy
- Sticky header z tytułem strony i hamburger icon
- Toast notifications na dole ekranu (nie zakrywają contentu)
- Modals: pełny ekran na mobile (100% width/height)

US-027: Accessibility (a11y)
Jako użytkownik korzystający z keyboard navigation lub screen readera, chcę aby aplikacja była dostępna, aby móc z niej korzystać.

Kryteria akceptacji:

- Keyboard navigation: tab, shift+tab, enter, escape, strzałki
- Focus indicators: visible outline (Tailwind ring-2 ring-offset-2)
- Skip to main content link na początku strony
- ARIA labels dla wszystkich interactive elements
- ARIA landmarks: navigation, main, complementary, contentinfo
- ARIA live regions dla dynamic content (toast notifications)
- Semantic HTML: button (nie div onclick), nav, main, form, article
- Alt text dla wszystkich obrazów i ikon decorative
- Formularze: label powiązane z input (htmlFor), error messages aria-describedby
- Modals: focus trap, escape key zamyka, focus wraca do triggera po zamknięciu
- Lighthouse Accessibility score: target ≥90/100

US-028: Loading states i feedback
Jako użytkownik, chcę wiedzieć co się dzieje podczas długotrwałych operacji, aby mieć pewność że aplikacja działa.

Kryteria akceptacji:

- Spinner dla operacji >500ms
- Skeleton screens dla ładowania list przepisów, kalendarza
- Progress bar dla multi-step operations (generowanie listy: fetch → aggregate → AI → preview)
- Toast notifications: sukces (zielone), błąd (czerwone), info (niebieskie), warning (żółte)
- Toast auto-dismiss po 5s (błędy) lub 3s (sukces/info)
- Przycisk close "×" w każdym toaście
- Optimistic UI: natychmiastowa reakcja, rollback przy błędzie
- Disabled state przycisków podczas submitu formularza
- Loading text: "Zapisuję przepis...", "Generuję listę...", "Kategoryzuję składniki..."

US-029: Empty states
Jako nowy użytkownik, chcę zobaczyć pomocne komunikaty gdy nie mam jeszcze danych, aby wiedzieć co dalej robić.

Kryteria akceptacji:

- Lista przepisów pusta: ilustracja + tekst "Brak przepisów. Dodaj pierwszy przepis!" + przycisk "Dodaj przepis"
- Kalendarz bez przypisań: tooltip przy pustych komórkach "Kliknij aby przypisać przepis"
- Historia list zakupów pusta: "Nie masz jeszcze list zakupów. Wygeneruj pierwszą!" + przycisk "Generuj listę"
- Search bez wyników: "Nie znaleziono przepisów dla '[query]'. Spróbuj innej frazy."
- Brak przepisów do przypisania: "Brak przepisów. Dodaj przepisy aby móc je przypisać do kalendarza."

US-030: Error handling
Jako użytkownik, chcę otrzymać jasne komunikaty błędów gdy coś pójdzie nie tak, aby wiedzieć jak rozwiązać problem.

Kryteria akceptacji:

- Błędy walidacji formularzy: inline messages pod polami, czerwony tekst
- Błędy API: toast notification z retry button jeśli możliwe
- Network errors: toast "Brak połączenia. Sprawdź internet i spróbuj ponownie."
- 500 Internal Server Error: automatyczny Sentry report + user-friendly message "Coś poszło nie tak. Nasz zespół został powiadomiony."
- 429 Rate Limit: toast "Zbyt wiele requestów. Spróbuj za chwilę."
- AI timeout: fallback + toast "Automatyczna kategoryzacja niedostępna. Możesz ręcznie przypisać kategorie."
- Supabase errors: mapowanie kodów błędów na polskie komunikaty
- Retry button: max 3 próby, exponential backoff

## 6. Metryki sukcesu

### 6.1 Kryteria funkcjonalne

Metryka: Utworzenie konta i logowanie
Sposób mierzenia: Manual testing podczas UAT z 5-10 użytkownikami nietechnicznymi
Docelowa wartość: 100% success rate (wszyscy użytkownicy UAT potrafią się zarejestrować i zalogować)
Priorytet: Krytyczny

Metryka: Dodanie minimum 5 przepisów
Sposób mierzenia: Tracking podczas UAT, analiza bazy danych po sesjach
Docelowa wartość: 100% użytkowników UAT dodaje minimum 5 przepisów w sesji
Priorytet: Krytyczny

Metryka: Dokładność AI kategoryzacji składników
Sposób mierzenia: Manual review 50 składników z różnych kategorii, porównanie z ground truth
Docelowa wartość: Większe niż 80% trafność kategoryzacji
Priorytet: Wysoki

Metryka: Czas generowania listy zakupów
Sposób mierzenia: Performance monitoring (Web Vitals), tracking czasu od kliknięcia "Generuj" do preview
Docelowa wartość: Mniej niż 3 sekundy (percentyl 95)
Priorytet: Wysoki

Metryka: Poprawność formatowania PDF
Sposób mierzenia: Manual review PDF na 5 urządzeniach (iOS Safari, Android Chrome, Windows Edge, Mac Safari, Linux Firefox)
Docelowa wartość: 100% czytelność na wszystkich urządzeniach
Priorytet: Wysoki

### 6.2 Kryteria UX

Metryka: Czas planowania tygodnia przez nowego użytkownika
Sposób mierzenia: Nagranie sesji UAT + timer od rejestracji do wygenerowania pierwszej listy
Docelowa wartość: Mniej niż 10 minut
Priorytet: Krytyczny

Metryka: Płynność na mobile i desktop
Sposób mierzenia: Manual testing + Lighthouse Performance score
Docelowa wartość: Większe niż 90/100 Lighthouse Performance, brak lagów podczas scroll/navigation
Priorytet: Wysoki

Metryka: Liczba kliknięć do kluczowych akcji
Sposób mierzenia: Analiza ścieżek użytkownika (user flow mapping)
Docelowa wartość: Maksymalnie 3 kliknięcia dla akcji: dodanie przepisu, przypisanie do kalendarza, generowanie listy, eksport PDF
Priorytet: Średni

Metryka: Satysfakcja użytkownika (System Usability Scale)
Sposób mierzenia: Ankieta SUS (10 pytań, 5-point Likert scale) po sesji UAT
Docelowa wartość: SUS score większe lub równe 68 (above average)
Priorytet: Wysoki

### 6.3 Kryteria techniczne

Metryka: Stabilność aplikacji (brak krytycznych błędów)
Sposób mierzenia: Sentry error tracking podczas UAT i pierwszego tygodnia po launch
Docelowa wartość: 0 critical errors w UAT, mniej niż 1% użytkowników dotkniętych błędami po launch
Priorytet: Krytyczny

Metryka: Czas ładowania strony (Web Vitals)
Sposób mierzenia: Lighthouse Performance + Real User Monitoring (RUM) z Plausible/GA4
Docelowa wartość: LCP mniej niż 2.5s, FID mniej niż 100ms, CLS mniej niż 0.1
Priorytet: Wysoki

Metryka: Responsywność UI
Sposób mierzenia: Manual testing + BrowserStack na urządzeniach od 320px szerokości
Docelowa wartość: Aplikacja działa poprawnie na wszystkich urządzeniach od 320px, brak horizontal scroll
Priorytet: Krytyczny

Metryka: Bezpieczeństwo danych (izolacja użytkowników)
Sposób mierzenia: Code review RLS policies + manual penetration testing
Docelowa wartość: 100% izolacja danych użytkowników (użytkownik A nie może zobaczyć danych użytkownika B)
Priorytet: Krytyczny

Metryka: API rate limiting
Sposób mierzenia: Load testing (k6 lub Artillery) z symulacją 100 req/min
Docelowa wartość: Max 100 requests/min/user bez 429 errors
Priorytet: Średni

### 6.4 Kryteria biznesowe

Metryka: Potwierdzenie wartości produktu
Sposób mierzenia: Ankieta UAT z pytaniem "Czy użyłbyś tej aplikacji regularnie?" (Tak/Nie/Może)
Docelowa wartość: Większe lub równe 80% odpowiedzi "Tak" (8-10 z 10 użytkowników UAT)
Priorytet: Krytyczny

Metryka: Rozwiązanie głównego problemu
Sposób mierzenia: Ankieta UAT z pytaniem otwartym "Czy ShopMate oszczędza Twój czas przy zakupach?" + analiza tematyczna
Docelowa wartość: Większe lub równe 70% użytkowników potwierdza oszczędność czasu
Priorytet: Wysoki

Metryka: Gotowość do skalowania
Sposób mierzenia: Code review architektury + load testing z symulacją 100 concurrent users
Docelowa wartość: Aplikacja obsługuje 100 concurrent users bez degradacji performance
Priorytet: Średni

Metryka: Net Promoter Score (NPS)
Sposób mierzenia: Ankieta UAT z pytaniem "Czy polecisz ShopMate znajomemu?" (skala 0-10)
Docelowa wartość: NPS większe lub równe 0 (więcej promoters niż detractors)
Priorytet: Średni

### 6.5 Tracking i monitoring produkcji

Sentry error tracking:

- Critical errors: 0 tolerance (hotfix within 24h)
- Non-critical errors: mniej niż 1% użytkowników dotkniętych
- Alert na email/Slack przy critical error
- Weekly review wszystkich errors

Google Analytics 4 / Plausible analytics:

- Page views, session duration, bounce rate
- User flows: przepisy → kalendarz → lista zakupów → eksport
- Conversion funnel: rejestracja → pierwszy przepis → pierwsze przypisanie → pierwszy eksport
- Retention: użytkownicy aktywni po 7 dniach, 30 dniach

Web Vitals performance monitoring:

- LCP (Largest Contentful Paint): target mniej niż 2.5s
- FID (First Input Delay): target mniej niż 100ms
- CLS (Cumulative Layout Shift): target mniej niż 0.1
- TTI (Time to Interactive): target mniej niż 3.5s

Custom events:

- Liczba dodanych przepisów na użytkownika (średnia)
- Liczba wygenerowanych list zakupów na użytkownika (średnia)
- Średni czas między rejestracją a pierwszym eksportem
- Najpopularniejsze kategorie składników (AI categorization insights)
- Retention rate: D1, D7, D30 (użytkownicy wracający po 1, 7, 30 dniach)

### 6.6 Definicja sukcesu MVP

MVP uznane za sukces jeśli:

- Wszystkie kryteria funkcjonalne spełnione (rejestracja, dodawanie przepisów, kalendarz, generowanie list, eksport działa)
- Większe lub równe 80% użytkowników UAT potwierdza wartość produktu (użyłbym regularnie)
- SUS score większe lub równe 68 (above average usability)
- Czas planowania tygodnia mniej niż 10 minut
- 0 critical errors podczas UAT
- Aplikacja gotowa do dalszego rozwoju (solidne fundamenty architektoniczne)

Następne kroki po MVP:

1. Zebranie feedbacku od użytkowników UAT (ankiety + pytania otwarte)
2. Analiza metryk i identyfikacja bottlenecków
3. Priorytetyzacja funkcji do wersji 1.1 (drag-and-drop, PWA, import przepisów, szablony tygodniowe)
4. Rozważenie modelu monetyzacji (freemium: free tier z limitami, premium za $2.99/miesiąc)
5. Marketing i zdobywanie pierwszych 100 użytkowników
