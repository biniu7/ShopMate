# Dokument wymagań produktu (PRD) - ShopMate

## 1. Przegląd produktu

Nazwa projektu: ShopMate
Typ: Aplikacja webowa MVP
Data: 2025-10-22

ShopMate to aplikacja webowa, która automatyzuje proces planowania posiłków i generowania list zakupów. Umożliwia użytkownikom tworzenie przepisów kulinarnych, przypisywanie ich do kalendarza tygodniowego z podziałem na posiłki (śniadanie, drugie śniadanie, obiad, kolacja), a następnie automatyczne generowanie zagregowanych list zakupów. Kluczową innowacją jest wykorzystanie sztucznej inteligencji do automatycznej kategoryzacji składników według działów sklepowych, co znacząco ułatwia proces zakupów.

Grupa docelowa:

- Osoby planujące posiłki dla rodziny (25-55 lat)
- Osoby żyjące samodzielnie i chcące lepiej organizować zakupy
- Osoby dbające o redukcję marnotrawstwa żywności
- Osoby poszukujące oszczędności czasu i pieniędzy przy zakupach spożywczych

Wartość dla użytkownika:

- Oszczędność czasu: automatyzacja procesu planowania i tworzenia list zakupów (zamiast ręcznego przepisywania składników z wielu przepisów)
- Redukcja marnotrawstwa: systematyczne planowanie eliminuje impulse buying i zapominanie o produktach
- Wygoda: dostęp do list zakupów na telefonie podczas zakupów, możliwość eksportu do PDF/TXT
- Organizacja: centralne repozytorium przepisów dostępne z każdego urządzenia

Stack technologiczny MVP:

- Frontend: Astro 5 + React 19 + TypeScript 5 + Tailwind CSS 4 + Shadcn/ui
- Backend: Supabase (PostgreSQL + Auth + Row Level Security)
- AI: OpenAI GPT-4o mini dla kategoryzacji składników
- Export: @react-pdf/renderer dla generowania PDF
- Walidacja: Zod schemas
- Monitoring: Sentry (error tracking) + Google Analytics/Plausible

Cel MVP:
Użytkownik jest w stanie zaplanować posiłki na cały tydzień i wygenerować kompletną, skategoryzowaną listę zakupów w formacie PDF w czasie krótszym niż 10 minut od rejestracji.

## 2. Problem użytkownika

Problem główny:
Użytkownicy napotykają znaczące trudności w systematycznym planowaniu posiłków i efektywnym tworzeniu list zakupów, co prowadzi do marnowania czasu, pieniędzy i żywności.

Szczegółowe pain points:

Planowanie posiłków na cały tydzień:

- Brak systematycznego podejścia do organizacji menu sprawia, że użytkownicy powtarzają te same posiłki lub podejmują chaotyczne decyzje w ostatniej chwili
- Trudność w znalezieniu równowagi między różnorodnością posiłków a czasem potrzebnym na planowanie
- Brak wizualizacji całego tygodnia utrudnia dostrzeżenie luk w planie żywieniowym

Tworzenie kompletnych list zakupów:

- Zapominanie o kluczowych składnikach prowadzi do wielokrotnych wizyt w sklepie
- Ręczne przepisywanie składników z wielu przepisów jest czasochłonne i podatne na błędy
- Brak agregacji powoduje kupowanie duplikatów lub nieprawidłowych ilości
- Lista tworzona "w głowie" lub na kartce często jest niekompletna lub zagubiona

Koordynacja składników z wielu przepisów:

- Ręczne zbieranie informacji z różnych źródeł (książki kucharskie, strony internetowe, notatki) zajmuje 30-60 minut tygodniowo
- Trudność w zsumowaniu powtarzających się składników (np. ile łącznie potrzeba mleka na wszystkie posiłki tygodnia)
- Przeskakiwanie między różnymi aplikacjami lub dokumentami zwiększa ryzyko pomyłek

Optymalizacja zakupów:

- Brak kategoryzacji składników według działów sklepowych wydłuża czas zakupów (chodzenie tam i z powrotem po sklepie)
- Trudność w unikaniu duplikatów prowadzi do nadmiaru produktów i marnotrawstwa
- Niemożność szybkiego odznaczania zakupionych pozycji na nieustrukturyzowanej liście

Obecne rozwiązania alternatywne i ich ograniczenia:

Kartka i długopis:

- Brak możliwości agregacji składników
- Łatwo zgubić lub zapomnieć
- Nieczytelne, szczególnie podczas zakupów
- Brak historii i możliwości ponownego użycia

Notatki w telefonie:

- Brak struktury i kategoryzacji
- Ręczne przepisywanie każdego składnika
- Brak integracji z przepisami i planowaniem
- Trudność w edycji i agregacji

Istniejące aplikacje przepisów:

- Skupiają się na przepisach, nie na planowaniu tygodniowym
- Brak kalendarza z podziałem na posiłki
- Brak automatycznej agregacji i kategoryzacji
- Często wymagają premium subscription dla podstawowych funkcji

Arkusze kalkulacyjne:

- Wymaga ręcznej konfiguracji i technicznej wiedzy
- Niewygodne na urządzeniach mobilnych
- Brak automatyzacji agregacji
- Czasochłonne w utrzymaniu

Wpływ problemu na codzienne życie:

- Stres związany z codziennym podejmowaniem decyzji "co na obiad?"
- Marnotrawstwo żywności (przeciętnie 30% zakupionych produktów ląduje w śmietniku)
- Wyższe koszty zakupów przez impulse buying i nieplanowane wizyty w sklepie
- Dłuższy czas spędzony w sklepie przez brak organizacji listy
- Niezrównoważona dieta przez powtarzanie tych samych posiłków lub jedzenie fast foodów "bo nie ma co ugotować"

ShopMate rozwiązuje te problemy przez:

1. Wizualny kalendarz tygodniowy z przypisanymi przepisami - eliminuje chaos w planowaniu
2. Automatyczną agregację składników z wielu przepisów - oszczędność czasu i eliminacja błędów
3. AI kategoryzację według działów sklepowych - szybsze i bardziej efektywne zakupy
4. Mobilną dostępność - lista zakupów zawsze pod ręką podczas zakupów
5. Historię list i przepisów - możliwość ponownego użycia sprawdzonych planów

## 3. Wymagania funkcjonalne

### 3.1 Zarządzanie przepisami kulinarnymi (CRUD)

FR-001: Dodawanie przepisu

- Strukturalny formularz z trzema sekcjami: nazwa przepisu, składniki (dynamiczna lista), instrukcje przygotowania
- Każdy składnik składa się z trzech pól: ilość (numeryczna, opcjonalna), jednostka (tekstowa, opcjonalna), nazwa (tekstowa, wymagana)
- Dynamiczne dodawanie/usuwanie składników za pomocą przycisków "+ Dodaj składnik" i ikonki usuwania
- Walidacja: nazwa przepisu 3-100 znaków, instrukcje 10-5000 znaków, minimum 1 składnik wymagany
- Komunikaty błędów walidacji wyświetlane inline pod polami w języku polskim
- Automatyczny zapis składników jako osobne rekordy w bazie danych z relacją do przepisu
- Przycisk "Zapisz" tworzy przepis i przekierowuje do widoku szczegółów

FR-002: Wyświetlanie listy przepisów

- Lista wszystkich przepisów użytkownika z podstawowymi informacjami (nazwa, data dodania, liczba składników)
- Wyszukiwanie po nazwie przepisu (case-insensitive substring matching)
- Sortowanie alfabetyczne (A-Z / Z-A) i według daty dodania (najnowsze / najstarsze)
- Paginacja lub infinite scroll dla optymalnej wydajności przy dużej liczbie przepisów
- Empty state: komunikat "Brak przepisów. Dodaj pierwszy przepis!" gdy użytkownik nie ma żadnych przepisów
- Kliknięcie w przepis otwiera widok szczegółów

FR-003: Wyświetlanie szczegółów przepisu

- Pełny widok przepisu: nazwa, wszystkie składniki (ilość + jednostka + nazwa), instrukcje przygotowania
- Informacja o przypisaniach w kalendarzu: "Ten przepis jest przypisany do X posiłków w kalendarzu" (jeśli dotyczy)
- Przyciski akcji: "Edytuj", "Usuń", "Wróć do listy"
- Możliwość przejścia do kalendarza aby zobaczyć gdzie przepis jest użyty

FR-004: Edycja przepisu

- Formularz identyczny jak w dodawaniu, wypełniony aktualnymi danymi
- Informacyjny komunikat: "Edycja przepisu zaktualizuje wszystkie przypisania w kalendarzu"
- Live update: zmiany w przepisie natychmiast odzwierciedlone we wszystkich miejscach kalendarza gdzie jest przypisany
- Snapshot pattern: wcześniej wygenerowane listy zakupów pozostają niezmienione (zachowanie historii)
- Walidacja identyczna jak przy dodawaniu
- Przycisk "Zapisz" aktualizuje przepis i wszystkie powiązane przypisania

FR-005: Usuwanie przepisu

- Przycisk "Usuń" w widoku szczegółów przepisu
- System sprawdza czy przepis jest przypisany w kalendarzu
- Dialog potwierdzenia jeśli przepis ma przypisania: "Ten przepis jest przypisany do X posiłków. Usunięcie przepisu spowoduje usunięcie tych przypisań. Czy na pewno chcesz kontynuować?"
- Dwa przyciski: "Anuluj" (domyślny, bezpieczny) i "Usuń przepis i przypisania" (czerwony, destrukcyjny)
- Po potwierdzeniu: cascade delete przepisu, składników i wszystkich przypisań w kalendarzu
- Toast notification: "Przepis usunięty wraz z X przypisaniami" lub "Przepis usunięty"
- Przekierowanie do listy przepisów

### 3.2 Kalendarz tygodniowy posiłków

FR-006: Wizualizacja kalendarza tygodniowego

- Struktura: 7 dni (Poniedziałek - Niedziela) × 4 posiłki (Śniadanie, Drugie śniadanie, Obiad, Kolacja) = 28 komórek
- Responsywny layout:
  - Desktop (≥1024px): tabela 7 kolumn × 4 wiersze, wszystkie dni widoczne jednocześnie
  - Tablet (768-1023px): scrollowalny poziomo, zachowanie struktury tabelarycznej
  - Mobile (<768px): accordion vertically stacked, każdy dzień jako osobna rozwijalna sekcja
- Każda komórka wyświetla nazwę przypisanego przepisu lub przycisk "Przypisz przepis" jeśli pusta
- Hover na nazwie przepisu pokazuje tooltip z pełną nazwą (jeśli truncated)
- Wizualne oznaczenie bieżącego dnia (np. podświetlenie kolumny)

FR-007: Przypisywanie przepisów do kalendarza

- Przycisk "Przypisz przepis" w każdej pustej komórce kalendarza
- Kliknięcie otwiera modal z listą wszystkich przepisów użytkownika
- Modal zawiera search bar do szybkiego znajdowania przepisów (filtrowanie w czasie rzeczywistym)
- Kliknięcie na przepis w modalu przypisuje go do wybranej komórki (dzień + posiłek)
- Ograniczenie MVP: jeden przepis na komórkę
- Po przypisaniu: komórka wyświetla nazwę przepisu + przycisk "✕" do usunięcia przypisania
- Brak drag-and-drop w MVP (odłożone na v1.1)

FR-008: Usuwanie przypisania z kalendarza

- Przycisk "✕" widoczny w każdej komórce z przypisanym przepisem
- Kliknięcie natychmiast usuwa przypisanie bez dialog potwierdzenia (szybka akcja, nie-destrukcyjna - sam przepis pozostaje)
- Komórka wraca do stanu pustego z przyciskiem "Przypisz przepis"
- Opcjonalny toast notification: "Przypisanie usunięte"

FR-009: Nawigacja między tygodniami

- Przyciski nawigacyjne: [← Poprzedni tydzień] [Bieżący tydzień] [Następny tydzień →]
- Wyświetlanie zakresu dat aktualnie wyświetlanego tygodnia (np. "13-19 stycznia 2025")
- Przycisk "Bieżący tydzień" jako quick action do powrotu do aktualnego tygodnia
- Opcjonalny date picker do wyboru konkretnego tygodnia
- Przechowywanie planowania wszystkich tygodni w bazie danych (nie tylko bieżącego)
- Możliwość planowania z wyprzedzeniem na przyszłe tygodnie

FR-010: Przeglądanie szczegółów przepisu z kalendarza

- Kliknięcie na nazwę przepisu w komórce kalendarza otwiera widok szczegółów
- Opcje implementacji: side panel (desktop) lub modal (mobile) z pełnymi informacjami o przepisie
- Możliwość edycji przepisu bezpośrednio z tego widoku
- Po edycji: automatyczny powrót do kalendarza z zaktualizowanymi danymi

### 3.3 System autoryzacji i kont użytkowników

FR-011: Rejestracja użytkownika

- Formularz rejestracyjny z polami: email (walidacja formatu email), hasło (minimum 8 znaków), potwierdzenie hasła (musi być identyczne)
- Wykorzystanie Supabase Auth dla bezpiecznego przechowywania haseł (automatyczne hashowanie)
- Walidacja dostępności email (czy nie jest już zarejestrowany)
- Komunikaty błędów w języku polskim: "Email jest już zarejestrowany", "Hasła nie są identyczne", "Hasło musi mieć minimum 8 znaków"
- Po udanej rejestracji: automatyczne zalogowanie i przekierowanie do dashboard
- Brak weryfikacji email w MVP (opcjonalna funkcja, można włączyć w Supabase)

FR-012: Logowanie użytkownika

- Formularz logowania z polami: email, hasło
- Walidacja credentials przez Supabase Auth
- Komunikaty błędów: "Nieprawidłowy email lub hasło", "Pole jest wymagane"
- Checkbox "Zapamiętaj mnie" dla persistent session (30 dni)
- Link "Zapomniałeś hasła?" prowadzący do formularza resetowania
- Po udanym logowaniu: przekierowanie do dashboard lub ostatnio odwiedzanej strony

FR-013: Reset hasła

- Formularz z polem email
- Wysyłanie email z linkiem resetującym przez Supabase Auth
- Link resetujący ważny przez 1 godzinę
- Kliknięcie linku prowadzi do formularza ustawiania nowego hasła
- Walidacja nowego hasła (minimum 8 znaków)
- Po udanej zmianie: przekierowanie do strony logowania z komunikatem sukcesu
- Toast notification: "Email z linkiem resetującym został wysłany" (nawet jeśli email nie istnieje w systemie - security best practice)

FR-014: Wylogowanie użytkownika

- Przycisk "Wyloguj" w nawigacji aplikacji
- Kliknięcie kończy sesję w Supabase
- Przekierowanie do strony logowania
- Wyczyszczenie local storage / session storage

FR-015: Bezpieczeństwo i izolacja danych (Row Level Security)

- Automatyczna izolacja danych użytkowników przez Supabase RLS policies
- Każdy użytkownik widzi tylko własne: przepisy, składniki, plan posiłków, listy zakupów
- Niemożność dostępu do danych innych użytkowników nawet przez manipulację API
- Polityki RLS implementowane dla wszystkich tabel: recipes, ingredients, meal_plan, shopping_lists, shopping_list_items
- Zgodność z GDPR: dane użytkownika automatycznie usuwane przy usunięciu konta (CASCADE DELETE)

### 3.4 Generowanie i zarządzanie listami zakupów

FR-016: Interfejs generowania listy zakupów

- Dwa tryby generowania do wyboru:
  Tryb 1 - Z kalendarza:
  - Checkboxy dla każdego dnia tygodnia (Poniedziałek - Niedziela)
  - Checkboxy dla każdego typu posiłku (Śniadanie, Drugie śniadanie, Obiad, Kolacja)
  - Przycisk shortcut "Cały tydzień" zaznaczający wszystkie checkboxy jednocześnie
  - Wyświetlanie informacji ile przepisów zostanie uwzględnionych (dynamicznie aktualizowane)
    Tryb 2 - Z przepisów:
  - Lista wszystkich przepisów użytkownika z checkboxami
  - Search bar do szybkiego znajdowania przepisów
  - Licznik zaznaczonych przepisów: "Wybrano X przepisów"
- Przycisk "Generuj listę zakupów" aktywny tylko gdy wybrano co najmniej 1 przepis
- Obsługa pustych komórek: pomijanie bez ostrzeżenia, komunikat błędu tylko gdy wszystkie wybrane komórki puste

FR-017: Agregacja składników

- Automatyczne zbieranie wszystkich składników z wybranych przepisów
- Normalizacja przed agregacją:
  - Trim wielokrotnych spacji
  - Konwersja do lowercase dla porównania
  - Case-insensitive matching nazw składników
- Logika agregacji:
  - Składniki o identycznej nazwie (po normalizacji) i jednostce: sumowanie ilości
  - Przykład: "200g mąki" + "300g mąki" = "500g mąki" (jeden wpis)
  - Składniki o identycznej nazwie ale różnych jednostkach: osobne pozycje
  - Przykład: "2 łyżki mąki" + "500g mąki" = dwa osobne wpisy
  - Składniki bez podanej ilości: zawsze osobne pozycje
  - Przykład: "sól do smaku" + "sól do smaku" = dwa wpisy "sól do smaku"

FR-018: AI kategoryzacja składników

- Automatyczna kategoryzacja wszystkich składników przy użyciu OpenAI GPT-4o mini
- 7 kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne
- Batch processing: wszystkie składniki wysyłane w jednym request do API (optymalizacja kosztów i czasu)
- Prompt template: "Kategoryzuj poniższe składniki do jednej z kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne. Składniki: 1. [nazwa], 2. [nazwa]... Zwróć odpowiedź w formacie JSON: {"1": "Nabiał", "2": "Warzywa"...}"
- Timeout: 10 sekund
- Retry logic: maksymalnie 2 próby z exponential backoff (1s, 2s)
- UX podczas oczekiwania: spinner + komunikat "Kategoryzuję składniki..."
- Optimistic UI: użytkownik może rozpocząć edycję listy podczas pracy AI (loading state)

FR-019: Fallback przy awarii AI

- Obsługa błędów API (timeout, 500 error, rate limit)
- Fallback behavior: wszystkie składniki przypisane do kategorii "Inne"
- Toast notification: "Automatyczna kategoryzacja niedostępna. Możesz ręcznie przypisać kategorie."
- Lista zakupów nadal funkcjonalna - użytkownik może ręcznie zmienić kategorie
- Logging błędu do Sentry dla monitorowania

FR-020: Preview i edycja listy zakupów

- Wyświetlanie wygenerowanej listy pogrupowanej po kategoriach
- Każdy składnik z checkboxem (☐) do odznaczania podczas zakupów
- Format wyświetlania: [ilość] [jednostka] [nazwa składnika]
- Możliwość ręcznej edycji przed zapisem:
  - Zmiana kategorii składnika: dropdown menu przy każdym składniku z 7 kategoriami
  - Usuwanie składnika: przycisk 🗑️ obok każdej pozycji
  - Dodawanie nowego składnika: przycisk "+ Dodaj składnik" (pole nazwa + ilość + jednostka + kategoria)
  - Edycja ilości/jednostki/nazwy: inline editing
- Zmiany zapisywane tylko po kliknięciu "Zapisz listę" (drafts nie są persystowane)

FR-021: Zapis listy zakupów

- Przycisk "Zapisz listę" w widoku preview
- Prompt z polem tekstowym: "Nazwa listy" (opcjonalne, default: "Lista zakupów - [data utworzenia]")
- Zapis do bazy danych:
  - Tabela shopping_lists: id, user_id, name, created_at
  - Tabela shopping_list_items: id, shopping_list_id, ingredient_name, quantity, category, sort_order
- Snapshot pattern: zapisana lista jest niemutowalna (tylko odczyt)
- Późniejsze edycje przepisów NIE aktualizują zapisanych list (zachowanie historii)
- Po zapisie: przekierowanie do widoku zapisanej listy z opcjami eksportu

FR-022: Historia list zakupów

- Widok wszystkich zapisanych list użytkownika
- Sortowanie: od najnowszych do najstarszych
- Dla każdej listy: nazwa, data utworzenia, liczba składników
- Kliknięcie w listę: widok szczegółów z możliwością eksportu
- Opcja usuwania starych list (przycisk 🗑️ z dialog potwierdzenia)
- Empty state: "Brak zapisanych list. Wygeneruj pierwszą listę zakupów!"

### 3.5 Eksport list zakupów

FR-023: Eksport do formatu PDF

- Biblioteka: @react-pdf/renderer (client-side generation)
- Layout: format A4 pionowy, standardowy font Helvetica
- Struktura dokumentu:
  - Nagłówek: "Lista zakupów ShopMate"
  - Podnagłówek: nazwa listy (jeśli użytkownik nadał) + data utworzenia
  - Opcjonalnie: zakres dat (np. "13-19 stycznia 2025" jeśli z kalendarza)
  - Treść: kategorie jako sekcje (nagłówek bold), składniki jako lista z checkboxami (☐)
  - Format składnika: ☐ [ilość] [jednostka] [nazwa]
  - Stopka: "Wygenerowano przez ShopMate - [data i czas]"
- Preview przed pobraniem: modal z renderowanym PDF
- Przyciski w modalu: [Pobierz PDF] [Anuluj]
- Kliknięcie "Pobierz PDF": download pliku na urządzenie użytkownika
- Nazwa pliku: "[nazwa-listy]-[data].pdf" (np. "lista-zakupow-2025-01-15.pdf")

FR-024: Eksport do formatu TXT

- Prosty format tekstowy, linijka po linijce
- Struktura identyczna jak PDF ale bez checkboxów:
  - Nagłówek: "Lista zakupów ShopMate"
  - Nazwa listy + data
  - Pusta linia
  - Kategoria (UPPERCASE)
  - Składniki (po jednym w linii): [ilość] [jednostka] [nazwa]
  - Pusta linia między kategoriami
- Brak preview: bezpośredni download po kliknięciu "Eksportuj TXT"
- Nazwa pliku: "[nazwa-listy]-[data].txt"
- Kodowanie: UTF-8 dla polskich znaków

FR-025: Dostępność eksportów na urządzeniach mobilnych

- PDF renderowany i pobierany poprawnie na iOS Safari i Android Chrome
- Opcja "Udostępnij" na mobile: native share API do wysłania PDF/TXT przez email, WhatsApp, itp.
- Możliwość otwarcia PDF w zewnętrznej aplikacji do przeglądania/edycji
- Responsywny modal preview na małych ekranach

### 3.6 Responsywny interfejs użytkownika

FR-026: Responsywność i breakpointy

- Breakpointy Tailwind CSS:
  - Mobile: <768px (minimum wspierana szerokość: 320px)
  - Tablet: 768-1023px
  - Desktop: ≥1024px
- Mobile-first approach: optymalizacja dla smartfonów jako główny use case
- Fluid typography: rozmiary czcionek skalujące się z ekranem
- Touch-friendly interactive elements: minimum 44px×44px tap targets na mobile

FR-027: Accessibility (a11y) WCAG AA

- Keyboard navigation:
  - Tab: poruszanie między interactive elements
  - Enter/Space: aktywacja przycisków i linków
  - Escape: zamykanie modali i dialogów
  - Arrow keys: nawigacja w listach i dropdown menu
- Focus indicators: wyraźne Tailwind ring (ring-2 ring-offset-2) na wszystkich interactive elements
- Semantic HTML: właściwe użycie tagów <button>, <nav>, <main>, <form>, <header>, <footer>, <section>
- ARIA labels: automatyczne przez Shadcn/ui, dodatkowe dla custom components
- Color contrast: minimum 4.5:1 dla tekstu (WCAG AA)
- Alt text: wszystkie ikony i obrazy z opisami alternatywnymi
- Screen reader support: testowanie z NVDA (Windows) i VoiceOver (iOS)
- Cel: Lighthouse Accessibility score ≥90/100

FR-028: Performance i czas ładowania

- Metryki Web Vitals:
  - LCP (Largest Contentful Paint): <2.5s
  - FID (First Input Delay): <100ms
  - CLS (Cumulative Layout Shift): <0.1
  - TTI (Time to Interactive): <3.5s
- Code splitting: automatyczny przez Astro (route-based)
- Image optimization: lazy loading dla wszystkich obrazów
- Font optimization: system fonts (bez custom webfonts w MVP)
- Bundle size target: <100KB initial JavaScript bundle
- Caching strategy przez Supabase i TanStack Query (jeśli użyte)

FR-029: Cross-browser compatibility

- Wspierane przeglądarki:
  - Chrome/Edge (Chromium): ostatnie 2 wersje
  - Firefox: ostatnie 2 wersje
  - Safari (iOS + macOS): ostatnie 2 wersje
- Automatyczne fallbacks dla nowoczesnych CSS features (via autoprefixer)
- Graceful degradation dla starszych przeglądarek
- Testowanie: BrowserStack lub manual testing na realnych urządzeniach

## 4. Granice produktu

### 4.1 Funkcje wykluczony z MVP (odłożone do przyszłych wersji)

Zaawansowane zarządzanie przepisami:

- Import przepisów z pliku (JPG, PDF, DOCX) - wymaga OCR i zaawansowanego parsowania tekstu
- Import przepisów przez URL (automatyczne scraping stron z przepisami)
- Zdjęcia przepisów - przechowywanie i wyświetlanie obrazów dań
- Tagi i kategorie przepisów (Śniadania, Desery, Wegetariańskie, Wegańskie, itp.)
- Oceny i recenzje przepisów
- Ulubione przepisy (favorites/bookmarks)
- Udostępnianie przepisów dla innych użytkowników
- Publiczne profile użytkowników i przepisy
- Komentarze i dyskusje pod przepisami

Zaawansowane funkcje planowania:

- Drag-and-drop do przypisywania przepisów w kalendarzu (odłożone na v1.1)
- Powtarzające się posiłki (np. "Ta sama owsianka każdy poniedziałek")
- Szablony tygodniowe (zapisz tydzień jako szablon, użyj ponownie jednym klikiem)
- Kalendarz miesięczny (widok 4+ tygodni jednocześnie)
- Planowanie na wiele tygodni naprzód (>4 tygodnie)
- Wiele przepisów na jedną komórkę kalendarza (np. zupa + drugie danie na obiad)
- Kopiowanie całego tygodnia do innego tygodnia
- Integracja z kalendarzem zewnętrznym (Google Calendar, Outlook)

Zaawansowane funkcje list zakupów:

- Konwersja jednostek miar (np. łyżki → gramy, szklanki → mililitry)
- Kategoryzacja składników według własnych preferencji użytkownika (custom kategorie)
- Lokalne cache AI kategoryzacji dla popularnych składników (offline support)
- Zaznaczanie składników jako "mam w domu" (zarządzanie spiżarnią)
- Szacowanie kosztów zakupów (wymaga bazy danych cen produktów)
- Optymalizacja trasy zakupów (routing po sklepie)
- Eksport do innych formatów (Excel, CSV, JSON)
- Udostępnianie listy zakupów innym użytkownikom (np. członkom rodziny)
- Synchronizacja zaznaczonych składników między urządzeniami w czasie rzeczywistym

Integracje zewnętrzne:

- Integracja z serwisami zakupowymi online (Frisco, Carrefour, Żabka Jush)
- Automatyczne zamawianie z listy zakupów przez API
- Integracja z asystentami głosowymi (Alexa, Google Assistant)
- Powiadomienia push, SMS, email o zbliżających się posiłkach
- Webhooks dla custom integracji

Funkcje społecznościowe i współdzielenie:

- Konta rodzinne / współdzielone konta
- Role i uprawnienia (admin, użytkownik, viewer)
- Udostępnianie przepisów i list między użytkownikami
- Publiczny marketplace przepisów
- Komentarze i oceny społeczności

Zaawansowane bezpieczeństwo:

- Uwierzytelnianie dwuskładnikowe (2FA)
- Szyfrowanie end-to-end dla danych użytkownika
- OAuth social login (Google, Facebook, Apple) - odłożone na v1.1
- Biometria (Face ID, Touch ID)

Analityka i raporty:

- Dashboard z statystykami (najczęściej używane przepisy, średnia liczba posiłków/tydzień)
- Historia zakupów i analiza trendów
- Szacowanie kosztów na podstawie historii
- Kalorie i wartości odżywcze przepisów (wymaga zewnętrznej bazy danych)
- Śledzenie marnotrawstwa żywności

Funkcje dietetyczne:

- Profile dietetyczne (wegetariańska, wegańska, bezglutenowa, keto, paleo)
- Oznaczanie alergenów w przepisach
- Automatyczne filtrowanie przepisów według diet i alergii
- Makroskładniki i mikroskładniki (wymaga rozbudowanej bazy danych)
- Zalecenia kaloryczne i dostosowanie porcji

Aplikacje mobilne natywne:

- Dedykowana aplikacja iOS (Swift/SwiftUI)
- Dedykowana aplikacja Android (Kotlin/Jetpack Compose)
- Offline-first architecture z synchronizacją
- Native performance optimization

Internacjonalizacja:

- Obsługa wielu języków (tylko polski w MVP)
- Lokalizacja jednostek miar (metric vs imperial)
- Lokalizacja formatu dat i walut
- Tłumaczenie interfejsu i komunikatów

### 4.2 Techniczne ograniczenia MVP

Limity funkcjonalne:

- Jeden przepis na komórkę kalendarza (brak obsługi wielu przepisów na jeden posiłek)
- Maksymalnie 50 składników na przepis (zabezpieczenie przed bardzo długimi listami)
- Maksymalnie 20 przepisów na jedną listę zakupów (ograniczenie token limit OpenAI API)
- Rate limiting: 100 requestów/minutę na użytkownika (Supabase default)
- Brak PWA i offline support (aplikacja wymaga połączenia internetowego)

Limity AI kategoryzacji:

- Timeout 10 sekund, maksymalnie 2 retry
- Fallback do kategorii "Inne" przy awarii API
- Brak local cache AI results (każda lista wymaga nowego API call)
- Koszty API: praktycznie darmowe dla MVP (~$0.0001 za listę 10 składników)

Obsługiwane przeglądarki i urządzenia:

- Brak wsparcia dla Internet Explorer 11 i starszych przeglądarek
- Minimalna rozdzielczość: 320px szerokości
- Optymalizacja tylko dla współczesnych smartfonów (iOS 13+, Android 10+)

Bezpieczeństwo:

- Podstawowa autoryzacja email + hasło (brak 2FA w MVP)
- Brak end-to-end encryption
- Brak audytu bezpieczeństwa przed launch (zaplanowany w przyszłości)

Skalowalność:

- MVP zaprojektowany dla 1000-10000 użytkowników
- Brak optymalizacji dla bardzo dużej liczby przepisów (>1000 na użytkownika)
- Brak load balancing i CDN (zarządzane przez hosting platform)

Backup i disaster recovery:

- Backup danych przez Supabase (automatyczny)
- Brak własnego mechanizmu backup/restore w aplikacji
- Brak exportu wszystkich danych użytkownika (funkcja dla GDPR compliance zaplanowana post-MVP)

### 4.3 Niewspierane przypadki użycia

Użytkownicy bez dostępu do internetu:

- Aplikacja wymaga stałego połączenia internetowego
- Brak offline mode w MVP

Użytkownicy z bardzo starymi urządzeniami:

- Brak wsparcia dla smartfonów starszych niż iOS 13 / Android 10
- Brak wsparcia dla przeglądarek bez JavaScript

Użytkownicy wymagający zaawansowanych funkcji dietetycznych:

- Brak kalkulacji kalorii i makroskładników
- Brak filtrowania według diet specjalnych (keto, paleo, itp.)
- Brak obsługi alergii i intolerancji

Użytkownicy potrzebujący współpracy zespołowej:

- Brak współdzielonych kont
- Brak jednoczesnej edycji przez wielu użytkowników
- Brak systemu uprawnień (admin/użytkownik)

Użytkownicy komercyjni (restauracje, catering):

- Brak skalowania porcji dla dużej liczby osób (>10 porcji)
- Brak profesjonalnych funkcji (inventory management, cost analysis, menu engineering)
- Brak integracji z systemami POS

Użytkownicy w innych krajach:

- Tylko język polski w MVP
- Kategorie składników dostosowane do polskich sklepów
- Brak wsparcia dla innych jednostek miar (imperial system)

## 5. Historyjki użytkowników

### 5.1 Rejestracja i autoryzacja

US-001: Rejestracja nowego użytkownika
Jako nowy użytkownik chcę utworzyć konto w aplikacji ShopMate, aby móc korzystać z funkcji planowania posiłków i tworzenia list zakupów.

Kryteria akceptacji:

- Formularz rejestracyjny zawiera pola: email, hasło, potwierdzenie hasła
- Walidacja email: poprawny format adresu (regex pattern)
- Walidacja hasła: minimum 8 znaków, komunikat błędu jeśli krótsza
- Walidacja potwierdzenia hasła: musi być identyczne z hasłem, komunikat błędu jeśli różne
- Sprawdzenie czy email nie jest już zarejestrowany: komunikat "Email jest już zarejestrowany" jeśli tak
- Po udanej rejestracji: automatyczne zalogowanie i przekierowanie do dashboard
- Komunikaty błędów wyświetlane inline pod odpowiednimi polami w języku polskim
- Przycisk "Zarejestruj się" nieaktywny (disabled) dopóki formularz nie jest poprawnie wypełniony

US-002: Logowanie istniejącego użytkownika
Jako zarejestrowany użytkownik chcę zalogować się do aplikacji, aby uzyskać dostęp do moich przepisów i planów posiłków.

Kryteria akceptacji:

- Formularz logowania zawiera pola: email, hasło
- Checkbox "Zapamiętaj mnie" dla persistent session (30 dni)
- Link "Zapomniałeś hasła?" prowadzący do formularza resetowania
- Walidacja credentials: komunikat "Nieprawidłowy email lub hasło" jeśli błędne dane
- Po udanym logowaniu: przekierowanie do dashboard lub ostatnio odwiedzanej strony
- Session token przechowywany bezpiecznie (httpOnly cookie przez Supabase)
- Zabezpieczenie przed brute force: rate limiting na próby logowania

US-003: Resetowanie zapomnianego hasła
Jako użytkownik który zapomniał hasła chcę móc je zresetować przez email, aby odzyskać dostęp do konta.

Kryteria akceptacji:

- Formularz resetowania zawiera pole: email
- Po wysłaniu formularza: komunikat "Email z linkiem resetującym został wysłany" (nawet jeśli email nie istnieje - security best practice)
- Email z linkiem resetującym wysłany przez Supabase Auth w ciągu 1 minuty
- Link resetujący ważny przez 1 godzinę
- Kliknięcie linku prowadzi do formularza ustawiania nowego hasła
- Formularz nowego hasła: pole "Nowe hasło" + "Potwierdź nowe hasło"
- Walidacja: minimum 8 znaków, oba pola identyczne
- Po udanej zmianie: przekierowanie do strony logowania z komunikatem "Hasło zostało zmienione. Możesz się teraz zalogować."
- Użyty link resetujący staje się nieważny po jednokrotnym użyciu

US-004: Wylogowanie użytkownika
Jako zalogowany użytkownik chcę móc się wylogować z aplikacji, aby zabezpieczyć swoje konto na współdzielonym urządzeniu.

Kryteria akceptacji:

- Przycisk "Wyloguj" widoczny w nawigacji aplikacji (header lub menu)
- Kliknięcie kończy sesję w Supabase
- Wyczyszczenie local storage i session storage
- Przekierowanie do strony logowania
- Opcjonalny toast notification: "Zostałeś wylogowany"
- Brak możliwości wróćenia do chronionych stron przez przycisk "Wstecz" w przeglądarce

### 5.2 Zarządzanie przepisami

US-005: Dodawanie nowego przepisu
Jako użytkownik chcę dodać nowy przepis do aplikacji, aby móc go później przypisać do kalendarza posiłków.

Kryteria akceptacji:

- Przycisk "Dodaj przepis" widoczny w nawigacji lub na stronie listy przepisów
- Formularz zawiera trzy sekcje: 1) Nazwa przepisu, 2) Składniki, 3) Instrukcje
- Pole "Nazwa przepisu": input tekstowy, walidacja 3-100 znaków
- Sekcja składników:
  - Dynamiczna lista: początkowo 1 pusty wiersz składnika
  - Każdy wiersz zawiera 3 pola: ilość (number input, opcjonalne), jednostka (text input, opcjonalne), nazwa (text input, wymagane)
  - Przycisk "+ Dodaj składnik" dodaje nowy pusty wiersz
  - Ikonka 🗑️ przy każdym wierszu usuwa składnik (minimum 1 składnik musi pozostać)
- Pole "Instrukcje": textarea, walidacja 10-5000 znaków
- Walidacja przed zapisem:
  - Nazwa przepisu: minimum 3 znaki, komunikat "Nazwa przepisu musi mieć min. 3 znaki"
  - Składniki: minimum 1 składnik z wypełnionym polem nazwa, komunikat "Przepis musi mieć przynajmniej 1 składnik"
  - Instrukcje: minimum 10 znaków, komunikat "Instrukcje muszą mieć min. 10 znaków"
- Komunikaty błędów wyświetlane inline pod polami w kolorze czerwonym
- Przycisk "Zapisz" tworzy przepis w bazie danych z wszystkimi składnikami
- Po zapisie: przekierowanie do widoku szczegółów nowego przepisu
- Toast notification: "Przepis dodany pomyślnie"

US-006: Przeglądanie listy przepisów
Jako użytkownik chcę zobaczyć listę wszystkich moich przepisów, aby szybko znaleźć konkretny przepis.

Kryteria akceptacji:

- Strona "Przepisy" w nawigacji aplikacji
- Lista wyświetla wszystkie przepisy użytkownika w formie kartek (cards) lub tabeli
- Każdy przepis pokazuje: nazwę, datę dodania, liczbę składników
- Search bar na górze strony: wyszukiwanie po nazwie (case-insensitive substring matching)
- Filtrowanie w czasie rzeczywistym podczas wpisywania w search bar
- Opcje sortowania: dropdown menu z wyborem:
  - Alfabetycznie A-Z
  - Alfabetycznie Z-A
  - Najnowsze
  - Najstarsze
- Sortowanie aplikuje się natychmiast po wyborze
- Kliknięcie w przepis: przekierowanie do widoku szczegółów
- Empty state gdy brak przepisów: ilustracja + tekst "Brak przepisów. Dodaj pierwszy przepis!" + przycisk CTA "Dodaj przepis"
- Paginacja lub infinite scroll jeśli więcej niż 20 przepisów

US-007: Wyświetlanie szczegółów przepisu
Jako użytkownik chcę zobaczyć pełne szczegóły przepisu, aby przeczytać składniki i instrukcje przygotowania.

Kryteria akceptacji:

- Widok szczegółów zawiera:
  - Nazwę przepisu jako nagłówek (h1)
  - Sekcję "Składniki" z listą wszystkich składników
  - Format składnika: [ilość] [jednostka] [nazwa] (np. "200 g mąka") lub tylko [nazwa] jeśli brak ilości
  - Sekcję "Instrukcje" z pełnym tekstem instrukcji
  - Metadane: data dodania, data ostatniej edycji (jeśli edytowany)
- Informacyjny badge jeśli przepis przypisany w kalendarzu: "Ten przepis jest przypisany do X posiłków w kalendarzu"
- Przyciski akcji:
  - "Edytuj" - otwiera formularz edycji
  - "Usuń" - otwiera dialog potwierdzenia usunięcia
  - "Wróć do listy" - powrót do listy przepisów
- Opcjonalnie: przycisk "Zobacz w kalendarzu" jeśli przepis ma przypisania (przekierowanie do kalendarza z highlightowanymi komórkami)
- Responsywny layout: na mobile składniki i instrukcje stackowane vertically

US-008: Edycja istniejącego przepisu
Jako użytkownik chcę edytować przepis, aby poprawić błędy lub zaktualizować składniki/instrukcje.

Kryteria akceptacji:

- Przycisk "Edytuj" w widoku szczegółów przepisu
- Formularz edycji identyczny jak formularz dodawania, wypełniony aktualnymi danymi przepisu
- Informacyjny komunikat na górze formularza: "Edycja przepisu zaktualizuje wszystkie przypisania w kalendarzu"
- Możliwość modyfikacji nazwy, składników (dodawanie/usuwanie/edycja) i instrukcji
- Walidacja identyczna jak przy dodawaniu (nazwa 3-100 znaków, min. 1 składnik, instrukcje 10-5000 znaków)
- Przycisk "Zapisz zmiany" aktualizuje przepis w bazie danych
- Live update: wszystkie przypisania w kalendarzu natychmiast pokazują zaktualizowane dane
- Wcześniej wygenerowane listy zakupów pozostają niezmienione (snapshot pattern)
- Po zapisie: przekierowanie do widoku szczegółów z zaktualizowanymi danymi
- Toast notification: "Przepis zaktualizowany pomyślnie"
- Przycisk "Anuluj" wraca do widoku szczegółów bez zapisywania zmian

US-009: Usuwanie przepisu bez przypisań w kalendarzu
Jako użytkownik chcę usunąć przepis którego już nie potrzebuję, aby oczyścić swoją listę przepisów.

Kryteria akceptacji:

- Przycisk "Usuń" w widoku szczegółów przepisu
- System sprawdza czy przepis ma przypisania w kalendarzu
- Jeśli NIE ma przypisań:
  - Prosty dialog potwierdzenia: "Czy na pewno chcesz usunąć przepis '[nazwa]'? Ta akcja jest nieodwracalna."
  - Przyciski: "Anuluj" (domyślny) i "Usuń" (czerwony, destrukcyjny)
  - Po potwierdzeniu: przepis i wszystkie jego składniki usunięte z bazy danych (CASCADE DELETE)
  - Toast notification: "Przepis usunięty"
  - Przekierowanie do listy przepisów

US-010: Usuwanie przepisu z przypisaniami w kalendarzu
Jako użytkownik chcę usunąć przepis który jest przypisany w kalendarzu, ale system powinien mnie ostrzec o konsekwencjach.

Kryteria akceptacji:

- Przycisk "Usuń" w widoku szczegółów przepisu
- System wykrywa X przypisań w kalendarzu (query do tabeli meal_plan)
- Dialog potwierdzenia z ostrzeżeniem: "Ten przepis jest przypisany do X posiłków w kalendarzu. Usunięcie przepisu spowoduje usunięcie tych przypisań. Czy na pewno chcesz kontynuować?"
- Lista przypisań (opcjonalnie): "Poniedziałek - Śniadanie, Środa - Obiad, ..."
- Przyciski: "Anuluj" (domyślny, bezpieczny) i "Usuń przepis i przypisania" (czerwony, destrukcyjny)
- Po kliknięciu "Anuluj": zamknięcie dialogu, brak akcji
- Po kliknięciu "Usuń przepis i przypisania":
  - CASCADE DELETE przepisu, składników i wszystkich przypisań w kalendarzu
  - Toast notification: "Przepis usunięty wraz z X przypisaniami"
  - Przekierowanie do listy przepisów
- Komórki kalendarza które miały ten przepis stają się puste (przycisk "Przypisz przepis")

US-011: Wyszukiwanie przepisu po nazwie
Jako użytkownik chcę szybko znaleźć przepis wpisując jego nazwę, aby nie przewijać długiej listy.

Kryteria akceptacji:

- Search bar widoczny na górze listy przepisów
- Placeholder tekst: "Szukaj przepisu..."
- Filtrowanie w czasie rzeczywistym podczas wpisywania (debounce 300ms dla optymalizacji)
- Case-insensitive substring matching (np. wpisanie "pizza" znajduje "Pizza Margherita")
- Lista przepisów aktualizuje się automatycznie pokazując tylko pasujące wyniki
- Licznik wyników: "Znaleziono X przepisów" (ukryty jeśli nie ma aktywnego wyszukiwania)
- Przycisk "✕" w search bar do szybkiego wyczyszczenia wyszukiwania
- Empty state jeśli brak wyników: "Nie znaleziono przepisów pasujących do '[zapytanie]'. Spróbuj innej frazy."
- Wyszukiwanie działa tylko na nazwie przepisu (nie na składnikach/instrukcjach w MVP)

### 5.3 Kalendarz tygodniowy

US-012: Wyświetlanie kalendarza tygodniowego
Jako użytkownik chcę zobaczyć kalendarz tygodniowy z podziałem na dni i posiłki, aby wizualnie zaplanować moje posiłki.

Kryteria akceptacji:

- Strona "Kalendarz" w nawigacji aplikacji
- Wyświetlanie bieżącego tygodnia domyślnie przy pierwszym wejściu
- Struktura: 7 kolumn (Poniedziałek - Niedziela) × 4 wiersze (Śniadanie, Drugie śniadanie, Obiad, Kolacja) = 28 komórek
- Nagłówki kolumn: nazwy dni + daty (np. "Poniedziałek 15.01")
- Nagłówki wierszy: nazwy posiłków
- Bieżący dzień wizualnie wyróżniony (np. podświetlona kolumna lub border)
- Zakres dat wyświetlanego tygodnia widoczny na górze: "13 - 19 stycznia 2025"
- Responsywność:
  - Desktop (≥1024px): pełna tabela 7×4
  - Tablet (768-1023px): scrollowalny poziomo z sticky headers
  - Mobile (<768px): accordion, każdy dzień jako rozwijalna sekcja, domyślnie bieżący dzień rozwinięty
- Każda komórka: wyświetla nazwę przypisanego przepisu LUB przycisk "Przypisz przepis" jeśli pusta

US-013: Przypisywanie przepisu do komórki kalendarza
Jako użytkownik chcę przypisać przepis do konkretnego dnia i posiłku, aby zaplanować swoje menu.

Kryteria akceptacji:

- Przycisk "Przypisz przepis" widoczny w każdej pustej komórce kalendarza
- Kliknięcie otwiera modal z listą wszystkich przepisów użytkownika
- Modal zawiera:
  - Nagłówek: "Przypisz przepis do [Dzień - Posiłek]" (np. "Poniedziałek - Śniadanie")
  - Search bar do filtrowania przepisów (identyczna logika jak na liście przepisów)
  - Lista przepisów: każdy jako klikalny card/wiersz z nazwą i liczbą składników
  - Przycisk "Anuluj" lub ikonka ✕ do zamknięcia modalu bez akcji
- Kliknięcie na przepis w modalu:
  - Przypisanie przepisu do wybranej komórki (insert/update do tabeli meal_plan)
  - Zamknięcie modalu
  - Komórka natychmiast wyświetla nazwę przypisanego przepisu
  - Toast notification: "[Nazwa przepisu] przypisano do [Dzień - Posiłek]"
- Empty state w modalu jeśli użytkownik nie ma żadnych przepisów: "Brak przepisów. Najpierw dodaj przepisy." + przycisk "Dodaj przepis"
- Ograniczenie MVP: jeden przepis na komórkę (nadpisanie jeśli komórka już miała przepis - dialog potwierdzenia)

US-014: Usuwanie przypisania przepisu z kalendarza
Jako użytkownik chcę usunąć przepis z konkretnej komórki kalendarza, aby zmienić plan posiłków.

Kryteria akceptacji:

- Komórka z przypisanym przepisem wyświetla: nazwę przepisu + małą ikonkę "✕" w rogu
- Hover na komórce: ikonka ✕ staje się bardziej widoczna
- Kliknięcie na ikonkę ✕:
  - Natychmiastowe usunięcie przypisania z bazy danych (DELETE z meal_plan)
  - Brak dialog potwierdzenia (szybka akcja, nie-destrukcyjna - sam przepis pozostaje)
  - Komórka wraca do stanu pustego z przyciskiem "Przypisz przepis"
  - Opcjonalny toast notification: "Przypisanie usunięte"
- Na mobile: swipe gesture jako alternatywa dla ikonki ✕ (opcjonalne w MVP)

US-015: Przeglądanie szczegółów przepisu z kalendarza
Jako użytkownik chcę zobaczyć szczegóły przepisu bez opuszczania widoku kalendarza, aby szybko sprawdzić składniki lub instrukcje.

Kryteria akceptacji:

- Kliknięcie na nazwę przepisu w komórce kalendarza otwiera szczegóły
- Opcje implementacji:
  - Desktop: side panel z prawej strony ekranu (bez przekierowania)
  - Mobile: modal pełnoekranowy
- Szczegóły zawierają: nazwę, składniki, instrukcje, przyciski "Edytuj" i "Zamknij"
- Przycisk "Edytuj" w side panel/modal otwiera formularz edycji
- Po edycji i zapisaniu: side panel/modal pokazuje zaktualizowane dane, kalendarz również (live update)
- Przycisk "Zamknij" lub kliknięcie poza side panel: zamknięcie bez akcji, powrót do widoku kalendarza
- Opcjonalnie: przyciski nawigacji "◀ Poprzedni przepis" / "Następny przepis ▶" do przeglądania przepisów w tym samym dniu

US-016: Nawigacja między tygodniami
Jako użytkownik chcę przełączać się między tygodniami, aby planować przyszłe posiłki lub przeglądać historyczne plany.

Kryteria akceptacji:

- Przyciski nawigacyjne nad kalendarzem: [← Poprzedni tydzień] [Bieżący tydzień] [Następny tydzień →]
- Wyświetlanie zakresu dat aktualnie wyświetlanego tygodnia: "13 - 19 stycznia 2025"
- Kliknięcie "Następny tydzień":
  - Przesunięcie widoku do następnego tygodnia (data + 7 dni)
  - Załadowanie przypisań dla tego tygodnia z bazy danych
  - Animacja smooth transition (opcjonalne)
- Kliknięcie "Poprzedni tydzień":
  - Przesunięcie widoku do poprzedniego tygodnia (data - 7 dni)
  - Załadowanie przypisań dla tego tygodnia
- Kliknięcie "Bieżący tydzień":
  - Szybki powrót do tygodnia zawierającego dzisiejszą datę
  - Przycisk disabled/ukryty jeśli już wyświetlamy bieżący tydzień
- Wszystkie tygodnie są persystowane w bazie danych (nie tylko bieżący)
- Możliwość planowania bez ograniczeń czasowych (przeszłość i przyszłość)
- Opcjonalnie: date picker do skoku do konkretnego tygodnia
- Keyboard shortcuts: arrow left (poprzedni), arrow right (następny), Home (bieżący) - opcjonalne w MVP

US-017: Zastąpienie istniejącego przypisania nowym przepisem
Jako użytkownik chcę zmienić przepis w komórce która już ma przypisanie, bez konieczności najpierw usuwania starego.

Kryteria akceptacji:

- Komórka z przypisanym przepisem ma również małą ikonkę "↻" (zamień) lub przycisk "Zmień przepis"
- Kliknięcie "Zmień przepis" otwiera modal z listą przepisów (identyczny jak w US-013)
- Dialog potwierdzenia przed nadpisaniem: "Komórka ma już przypisany przepis '[stara nazwa]'. Czy chcesz zastąpić go przepisem '[nowa nazwa]'?"
- Przyciski: "Anuluj" i "Zastąp" (primary action)
- Po potwierdzeniu:
  - UPDATE w tabeli meal_plan (zmiana recipe_id)
  - Komórka wyświetla nowy przepis
  - Toast notification: "Przepis zastąpiony"
- Alternatywne UX (prostsze): kliknięcie "Przypisz przepis" w zajętej komórce automatycznie otwiera modal, wybór nowego przepisu nadpisuje stary bez dodatkowego dialogu (można dodać undo action w toast)

### 5.4 Listy zakupów

US-018: Generowanie listy zakupów z całego tygodnia
Jako użytkownik chcę wygenerować listę zakupów na podstawie wszystkich posiłków zaplanowanych w tygodniu, aby kupić wszystko potrzebne na raz.

Kryteria akceptacji:

- Przycisk "Generuj listę zakupów" widoczny w widoku kalendarza
- Kliknięcie otwiera interfejs wyboru źródła z dwoma trybami (zakładki/radio buttons):
  - Tryb 1: "Z kalendarza"
  - Tryb 2: "Z przepisów"
- Domyślnie wybrany: "Z kalendarza"
- W trybie "Z kalendarza":
  - Checkboxy dla każdego dnia tygodnia (7 checkboxów)
  - Checkboxy dla każdego typu posiłku (4 checkboxy)
  - Przycisk shortcut "Zaznacz cały tydzień" (zaznacza wszystkie 11 checkboxów)
  - Dynamiczny licznik: "Wybrano X posiłków z X przepisami"
- Przycisk "Generuj listę" aktywny tylko gdy wybrano co najmniej 1 komórkę z przypisanym przepisem
- Kliknięcie "Generuj listę":
  - Spinner + komunikat "Generuję listę zakupów..."
  - Fetch wszystkich składników z wybranych przepisów
  - Agregacja składników (normalizacja + sumowanie identycznych)
  - Wywołanie OpenAI API dla AI kategoryzacji
  - Timeout 10s, retry 2x z exponential backoff
  - Po zakończeniu: przekierowanie do widoku preview listy
- Obsługa pustych komórek: pomijanie bez ostrzeżenia
- Jeśli wszystkie wybrane komórki puste: komunikat błędu "Wybrane komórki nie mają przypisanych przepisów. Dodaj przepisy do kalendarza."

US-019: Generowanie listy zakupów z wybranych przepisów
Jako użytkownik chcę wygenerować listę zakupów tylko z kilku konkretnych przepisów, bez planowania całego tygodnia w kalendarzu.

Kryteria akceptacji:

- W interfejsie "Generuj listę zakupów" wybór trybu: "Z przepisów"
- W trybie "Z przepisów":
  - Lista wszystkich przepisów użytkownika
  - Checkbox przy każdym przepisie
  - Search bar do szybkiego znajdowania przepisów (identyczna logika jak na liście przepisów)
  - Licznik: "Wybrano X przepisów"
- Możliwość przewijania listy (scrollable container z max-height)
- Przycisk "Generuj listę" aktywny tylko gdy zaznaczono co najmniej 1 przepis
- Kliknięcie "Generuj listę":
  - Identyczny flow jak w US-018: fetch składników → agregacja → AI kategoryzacja → preview
- Empty state jeśli użytkownik nie ma przepisów: "Brak przepisów. Najpierw dodaj przepisy." + przycisk "Dodaj przepis"

US-020: Agregacja składników z wielu przepisów
Jako użytkownik chcę aby aplikacja automatycznie zsumowała powtarzające się składniki z różnych przepisów, aby moja lista zakupów była zwięzła.

Kryteria akceptacji:

- System zbiera wszystkie składniki z wybranych przepisów
- Normalizacja przed porównaniem:
  - Trim wielokrotnych spacji (np. "mąka " → "mąka")
  - Konwersja do lowercase dla porównania (np. "Mąka" vs "mąka" → match)
  - Zachowanie oryginalnej formy w wynikowej liście (pierwsza napotkana wersja)
- Logika agregacji:
  - Składniki o identycznej nazwie (po normalizacji) i jednostce → sumowanie ilości
    - Przykład: "200 g mąka" + "300 g mąka" = "500 g mąka" (JEDEN wpis)
  - Składniki o identycznej nazwie ale różnych jednostkach → osobne pozycje
    - Przykład: "2 łyżki mąka" + "500 g mąka" = DWA wpisy (brak konwersji w MVP)
  - Składniki bez ilości → zawsze osobne pozycje
    - Przykład: "sól do smaku" + "sól do smaku" = DWA wpisy "sól do smaku"
- Wynik agregacji przekazywany do AI kategoryzacji
- Użytkownik NIE widzi szczegółów agregacji (transparentny proces), tylko końcową listę

US-021: AI kategoryzacja składników według działów sklepowych
Jako użytkownik chcę aby składniki na mojej liście zakupów były automatycznie podzielone według działów sklepowych, aby szybciej robić zakupy.

Kryteria akceptacji:

- Po agregacji składników system wysyła batch request do OpenAI API (GPT-4o mini)
- Prompt zawiera wszystkie składniki i instrukcję kategoryzacji do jednej z 7 kategorii:
  - Nabiał
  - Warzywa
  - Owoce
  - Mięso
  - Pieczywo
  - Przyprawy
  - Inne
- Format response: JSON mapping (index składnika → kategoria)
- Timeout: 10 sekund
- Retry logic: maksymalnie 2 próby z exponential backoff (1s, 2s)
- UX podczas oczekiwania:
  - Spinner animation
  - Komunikat: "Kategoryzuję składniki... To zajmie kilka sekund."
  - Progress bar (opcjonalne w MVP)
- Po otrzymaniu response: przypisanie kategorii do każdego składnika
- Dokładność kategoryzacji: cel >80% (weryfikacja podczas UAT)

US-022: Fallback przy awarii AI kategoryzacji
Jako użytkownik chcę móc wygenerować listę zakupów nawet gdy serwis AI jest niedostępny, ręcznie kategoryzując składniki.

Kryteria akceptacji:

- Obsługa błędów OpenAI API: timeout, 500 error, 429 rate limit, network error
- Po wyczerpaniu retry attempts (2 próby):
  - Fallback behavior: wszystkie składniki przypisane do kategorii "Inne"
  - Toast notification: "Automatyczna kategoryzacja niedostępna. Możesz ręcznie przypisać kategorie."
  - Przekierowanie do widoku preview listy (identyczny flow jak przy sukcesie AI)
- Logging błędu do Sentry z kontekstem (user_id, liczba składników, error message)
- Lista zakupów nadal w pełni funkcjonalna - użytkownik może ręcznie zmienić kategorie w preview
- Brak blokowania użytkownika przez awarię zewnętrznego serwisu

US-023: Preview i edycja listy zakupów przed zapisem
Jako użytkownik chcę zobaczyć wygenerowaną listę zakupów i móc ją edytować przed zapisem, aby dodać/usunąć składniki lub poprawić kategorie.

Kryteria akceptacji:

- Widok preview wyświetla listę pogrupowaną po kategoriach
- Każda kategoria jako osobna sekcja z nagłówkiem (nazwa kategorii + liczba składników)
- Składniki w kategorii wyświetlane jako lista:
  - Checkbox ☐ na początku (do odznaczania podczas zakupów - funkcjonalność w przyszłości)
  - Format: [ilość] [jednostka] [nazwa] (np. "☐ 500 g mąka")
  - Jeśli brak ilości: tylko nazwa (np. "☐ sól do smaku")
- Możliwości edycji:
  - Zmiana kategorii: dropdown menu przy każdym składniku (7 opcji kategorii)
  - Usunięcie składnika: ikonka 🗑️ obok każdej pozycji, kliknięcie usuwa natychmiast bez potwierdzenia
  - Edycja ilości/jednostki/nazwy: kliknięcie na tekst aktywuje inline editing
  - Dodanie nowego składnika: przycisk "+ Dodaj składnik" na dole listy, otwiera mini-formularz (nazwa + ilość + jednostka + kategoria)
- Licznik składników na górze: "Lista zawiera X składników w Y kategoriach"
- Przyciski akcji:
  - "Zapisz listę" (primary action, zielony)
  - "Anuluj" (secondary action, powrót do kalendarza/przepisów)
- Zmiany NIE są automatycznie zapisywane (drafts nie są persystowane w MVP)

US-024: Zapisywanie listy zakupów do historii
Jako użytkownik chcę zapisać wygenerowaną listę zakupów, aby mieć do niej dostęp później i móc ją wyeksportować.

Kryteria akceptacji:

- Przycisk "Zapisz listę" w widoku preview
- Kliknięcie otwiera dialog/prompt z polem tekstowym: "Nazwa listy"
- Placeholder: "Lista zakupów - [data utworzenia]" (np. "Lista zakupów - 15.01.2025")
- Użytkownik może nadać własną nazwę lub użyć default
- Opcjonalnie: checkbox "Zapisz jako szablon" (dla przyszłej funkcjonalności quick reuse - odłożone na v1.1)
- Przyciski: "Anuluj" i "Zapisz"
- Po kliknięciu "Zapisz":
  - INSERT do tabeli shopping_lists (id, user_id, name, created_at)
  - INSERT do tabeli shopping_list_items dla każdego składnika (shopping_list_id, ingredient_name, quantity, category, sort_order)
  - Snapshot pattern: lista niemutowalna po zapisie (tylko odczyt)
  - Przekierowanie do widoku szczegółów zapisanej listy
  - Toast notification: "Lista zakupów zapisana"
- Widok szczegółów zapisanej listy:
  - Identyczny layout jak preview (kategorie → składniki)
  - Brak możliwości edycji (tylko odczyt)
  - Przyciski: "Eksportuj PDF", "Eksportuj TXT", "Usuń listę", "Wróć do historii"

US-025: Przeglądanie historii list zakupów
Jako użytkownik chcę zobaczyć wszystkie moje zapisane listy zakupów, aby móc wyeksportować lub ponownie wykorzystać poprzednie listy.

Kryteria akceptacji:

- Strona "Listy zakupów" w nawigacji aplikacji
- Lista wszystkich zapisanych list użytkownika
- Sortowanie: od najnowszych do najstarszych (created_at DESC)
- Każda lista wyświetlana jako card/wiersz z informacjami:
  - Nazwa listy
  - Data utworzenia (np. "15 stycznia 2025")
  - Liczba składników (np. "25 składników")
  - Preview pierwszych 3 kategorii (np. "Warzywa, Nabiał, Mięso...")
- Kliknięcie w listę: przekierowanie do widoku szczegółów (US-024)
- Opcjonalne quick actions na każdej karcie:
  - Ikonka PDF (quick export bez otwierania szczegółów)
  - Ikonka 🗑️ (quick delete z dialog potwierdzenia)
- Empty state jeśli brak list: "Brak zapisanych list zakupów. Wygeneruj pierwszą listę!" + przycisk "Generuj listę"
- Paginacja jeśli więcej niż 20 list

US-026: Usuwanie zapisanej listy zakupów
Jako użytkownik chcę usunąć starą listę zakupów której już nie potrzebuję, aby oczyścić swoją historię.

Kryteria akceptacji:

- Przycisk "Usuń listę" w widoku szczegółów listy lub ikonka 🗑️ na liście historii
- Dialog potwierdzenia: "Czy na pewno chcesz usunąć listę '[nazwa]'? Ta akcja jest nieodwracalna."
- Przyciski: "Anuluj" (domyślny) i "Usuń" (czerwony, destrukcyjny)
- Po potwierdzeniu:
  - CASCADE DELETE listy i wszystkich jej pozycji (shopping_lists + shopping_list_items)
  - Toast notification: "Lista usunięta"
  - Przekierowanie do historii list (jeśli usuwano ze szczegółów) lub odświeżenie listy (jeśli usuwano z historii)

### 5.5 Eksport list zakupów

US-027: Eksport listy zakupów do PDF
Jako użytkownik chcę wyeksportować listę zakupów do pliku PDF, aby móc ją wydrukować lub mieć na telefonie podczas zakupów.

Kryteria akceptacji:

- Przycisk "Eksportuj PDF" w widoku szczegółów zapisanej listy
- Kliknięcie otwiera modal z preview wygenerowanego PDF
- PDF generowany client-side za pomocą @react-pdf/renderer
- Layout PDF:
  - Format: A4 pionowy
  - Font: Helvetica (standardowy, bez potrzeby embedowania)
  - Nagłówek: "Lista zakupów ShopMate" (większa czcionka, bold)
  - Podnagłówek: nazwa listy + data utworzenia (np. "Lista na tydzień | 15 stycznia 2025")
  - Opcjonalnie: zakres dat jeśli lista z kalendarza (np. "13-19 stycznia 2025")
  - Treść: kategorie jako sekcje
    - Nazwa kategorii: UPPERCASE, bold, większa czcionka, underline lub background color
    - Składniki: lista z checkboxami (☐) w formacie: ☐ [ilość] [jednostka] [nazwa]
    - Spacing między kategoriami dla czytelności
  - Stopka: "Wygenerowano przez ShopMate - [data i czas]" (mała czcionka, szary kolor)
- Preview w modalu: renderowany PDF lub miniatura pierwszej strony
- Przyciski w modalu:
  - "Pobierz PDF" (primary action, zielony)
  - "Anuluj" (secondary action, zamyka modal)
- Kliknięcie "Pobierz PDF":
  - Download pliku na urządzenie użytkownika
  - Nazwa pliku: "[nazwa-listy-slug]-[data].pdf" (np. "lista-zakupow-2025-01-15.pdf")
  - Sanitizacja nazwy pliku (usunięcie znaków specjalnych, spacje → myślniki)
- Toast notification: "PDF pobierany" lub "PDF pobrany"

US-028: Eksport listy zakupów do TXT
Jako użytkownik chcę wyeksportować listę zakupów do prostego pliku tekstowego, aby łatwo udostępnić ją przez email lub messenger.

Kryteria akceptacji:

- Przycisk "Eksportuj TXT" w widoku szczegółów zapisanej listy
- Kliknięcie bezpośrednio pobiera plik TXT (bez preview)
- Format pliku TXT:

  ```
  Lista zakupów ShopMate
  [Nazwa listy]
  [Data utworzenia]

  WARZYWA
  500 g pomidor
  1 szt. cebula
  sól do smaku

  NABIAŁ
  1 l mleko
  200 g masło

  ...

  Wygenerowano przez ShopMate - [data i czas]
  ```

- Struktura:
  - Nagłówek: "Lista zakupów ShopMate"
  - Nazwa listy + data (każda w osobnej linii)
  - Pusta linia
  - Kategorie: UPPERCASE, bez dodatkowego formatowania
  - Składniki: po jednym w linii, format [ilość] [jednostka] [nazwa], bez checkboxów
  - Pusta linia między kategoriami
  - Stopka na końcu pliku
- Kodowanie: UTF-8 dla polskich znaków
- Nazwa pliku: "[nazwa-listy-slug]-[data].txt" (identyczna logika jak PDF)
- Toast notification: "TXT pobierany" lub "TXT pobrany"
- Plik możliwy do otwarcia w Notatniku, TextEdit, lub dowolnym edytorze tekstu

US-029: Udostępnianie eksportu na urządzeniach mobilnych
Jako użytkownik mobilny chcę móc szybko udostępnić wygenerowany PDF/TXT przez WhatsApp, email lub inne aplikacje, aby wysłać listę zakupów współmałżonkowi lub domownikowi.

Kryteria akceptacji:

- Na urządzeniach mobilnych (iOS, Android) przycisk "Udostępnij" obok/zamiast "Pobierz"
- Kliknięcie "Udostępnij" dla PDF:
  - Generowanie PDF w pamięci
  - Wywołanie native Share API (navigator.share)
  - System pokazuje native share sheet z dostępnymi aplikacjami (WhatsApp, Email, Messenger, itp.)
  - Użytkownik wybiera aplikację i wysyła plik
- Identyczna funkcjonalność dla TXT
- Fallback dla przeglądarek bez wsparcia Share API: klasyczny download
- Toast notification po udostępnieniu: "Plik udostępniony" lub komunikat błędu jeśli anulowano

US-030: Preview PDF przed eksportem na desktop
Jako użytkownik desktop chcę zobaczyć podgląd PDF przed pobraniem, aby upewnić się że wygląda poprawnie.

Kryteria akceptacji:

- Przycisk "Eksportuj PDF" otwiera modal z preview (nie bezpośredni download)
- Modal zawiera:
  - Renderowany PDF w iframe lub jako canvas (zależnie od implementacji @react-pdf/renderer)
  - Możliwość scrollowania jeśli PDF wielostronicowy
  - Przyciski: "Pobierz PDF" (primary, zielony) i "Anuluj" (secondary, szary)
- PDF renderowany w czasie rzeczywistym (client-side, bez wysyłania do serwera)
- Zamknięcie modalu: kliknięcie "Anuluj", Escape, lub kliknięcie poza modal (background overlay)
- Po kliknięciu "Pobierz PDF": download pliku + zamknięcie modalu
- Responsywność: na mobile full-screen modal z przyciskiem "Udostępnij" (US-029)

### 5.6 Responsywność i accessibility

US-031: Korzystanie z aplikacji na smartfonie
Jako użytkownik mobilny chcę móc wygodnie korzystać z aplikacji na telefonie, aby planować posiłki i generować listy zakupów w dowolnym miejscu.

Kryteria akceptacji:

- Mobile-first responsive design: aplikacja optymalizowana dla smartfonów (główny use case)
- Minimalna wspierana szerokość: 320px (stare iPhone SE)
- Touch-friendly interactive elements:
  - Minimum 44px × 44px tap targets (przyciski, linki, checkboxy)
  - Spacing między elementami minimum 8px dla uniknięcia przypadkowych kliknięć
- Kalendarz na mobile: accordion layout
  - Każdy dzień jako rozwijalna sekcja (collapse/expand)
  - Domyślnie bieżący dzień rozwinięty, pozostałe zwinięte
  - Smooth animations przy rozwijaniu/zwijaniu
- Formularze na mobile:
  - Duże inputy (min. 44px wysokości)
  - Odpowiednie keyboard types (email → email keyboard, number → numeric keyboard)
  - Sticky "Zapisz" button na dole ekranu (zawsze widoczny)
- Modały na mobile: full-screen overlay (nie małe okienka)
- Testowanie na realnych urządzeniach: iPhone (iOS Safari) i Android (Chrome)
- Brak horizontal scroll (wszystko fits w viewport width)

US-032: Korzystanie z aplikacji na tablecie
Jako użytkownik z tabletem chcę móc wygodnie przeglądać kalendarz i listy na większym ekranie, z układem pośrednim między mobile a desktop.

Kryteria akceptacji:

- Breakpoint tablet: 768-1023px
- Kalendarz na tablet: tabela 7×4 scrollowalna poziomo z sticky headers (dni tygodnia)
- Alternatywnie: layout 2 kolumny (2 dni obok siebie) + scroll vertically
- Formularze: 2-column layout gdzie sensowny (np. składniki: ilość+jednostka w jednej linii, nazwa w drugiej)
- Modały: centered overlay (nie full-screen), max-width 600px
- Touch-friendly interactive elements (identyczne wymagania jak mobile: 44px targets)
- Testowanie: iPad (Safari), Android tablet (Chrome)

US-033: Keyboard navigation w aplikacji
Jako użytkownik preferujący klawiaturę (lub używający screen readera) chcę móc nawigować po aplikacji bez myszy, aby efektywnie korzystać z wszystkich funkcji.

Kryteria akceptacji:

- Tab: poruszanie między wszystkimi interactive elements (przyciski, linki, inputy, checkboxy)
- Shift+Tab: poruszanie w odwrotnym kierunku
- Enter/Space: aktywacja przycisków, checkboxów, linków
- Escape: zamykanie modali, dialogów, dropdown menu
- Arrow keys: nawigacja w listach, dropdown menu, radio buttons
- Logiczny tab order: od góry do dołu, od lewej do prawej
- Skip to main content link: na początku strony, widoczny tylko przy focus (dla screen reader users)
- Focus indicators:
  - Wyraźny outline/ring na każdym focused element
  - Tailwind classes: ring-2 ring-offset-2 ring-primary
  - Nigdy nie usuwać outline bez zapewnienia alternatywnego wskaźnika
- Focus trap w modalach: Tab nie wychodzi poza modal dopóki jest otwarty
- Focus management: po otwarciu modalu focus na pierwszy interactive element, po zamknięciu focus wraca do elementu który otworzył modal

US-034: Wsparcie dla screen readerów
Jako użytkownik z niepełnosprawnością wzroku używający screen readera chcę móc korzystać z aplikacji, słuchając opisów wszystkich elementów i akcji.

Kryteria akceptacji:

- Semantic HTML: właściwe użycie tagów <button>, <nav>, <main>, <header>, <footer>, <form>, <label>
- ARIA labels dla wszystkich interactive elements:
  - Przyciski z ikonami: aria-label="Usuń przepis" (nie tylko ikonka 🗑️)
  - Linki: aria-label jeśli tekst linku niejednoznaczny
  - Form inputs: związane z <label> przez htmlFor/id lub aria-labelledby
- ARIA live regions dla dynamicznych komunikatów:
  - Toast notifications: role="alert" aria-live="assertive"
  - Loading states: aria-live="polite" aria-busy="true"
- Alt text dla wszystkich obrazów i ikon (lub aria-hidden="true" jeśli dekoracyjne)
- Landmarks: <main>, <nav>, <aside>, <footer> dla struktury strony
- Heading hierarchy: h1 → h2 → h3 (bez przeskakiwania poziomów)
- Form validation: błędy powiązane z inputami przez aria-describedby
- Disabled elements: aria-disabled="true" + komunikat dlaczego disabled
- Testowanie z NVDA (Windows) lub VoiceOver (macOS/iOS)

US-035: Zgodność z WCAG AA
Jako użytkownik z różnymi potrzebami accessibility chcę aby aplikacja spełniała standardy WCAG 2.1 poziom AA, aby była dostępna dla jak największej liczby osób.

Kryteria akceptacji:

- Color contrast:
  - Normalny tekst (< 18pt): minimum 4.5:1
  - Duży tekst (≥ 18pt lub ≥ 14pt bold): minimum 3:1
  - Interactive elements: minimum 3:1 dla borders/icons
  - Testowanie: Lighthouse Accessibility audit, WebAIM Contrast Checker
- Resize text: aplikacja funkcjonalna przy 200% zoom w przeglądarce (WCAG 1.4.4)
- Reflow: brak horizontal scroll przy 320px szerokości i 400% zoom (WCAG 1.4.10)
- Focus visible: wyraźne focus indicators (US-033)
- Keyboard accessible: pełna funkcjonalność bez myszy (US-033)
- Screen reader support: semantic HTML + ARIA (US-034)
- Consistent navigation: menu i nawigacja w tym samym miejscu na każdej stronie
- Error identification: błędy walidacji opisane tekstem (nie tylko czerwony border)
- Labels or instructions: każdy input ma label lub placeholder z instrukcją
- Cel: Lighthouse Accessibility score ≥ 90/100
- Audyt z axe DevTools przed launch

## 6. Metryki sukcesu

### 6.1 Kryteria funkcjonalne

Metryka: Utworzenie konta i podstawowe operacje autoryzacji
Sposób mierzenia:

- Manual testing podczas User Acceptance Testing (UAT) z 5-10 użytkownikami nietechnicznymi
- Test scenariusz: rejestracja → logowanie → wylogowanie → reset hasła → logowanie z nowym hasłem
- Tracking błędów w Sentry podczas UAT i pierwszych 2 tygodni produkcji
  Docelowa wartość:
- 100% success rate dla wszystkich uczestników UAT (5-10 osób)
- 0 critical errors związanych z autoryzacją w Sentry podczas UAT
- <1% error rate dla rejestracji/logowania w produkcji (pierwsze 2 tygodnie)

Metryka: Dodanie i zarządzanie przepisami
Sposób mierzenia:

- Manual testing UAT: każdy użytkownik dodaje minimum 5 przepisów
- Tracking w Google Analytics/Plausible: custom event "recipe_created", "recipe_edited", "recipe_deleted"
- Ankieta UAT: pytanie "Czy formularz dodawania przepisu był intuicyjny?" (skala 1-5)
  Docelowa wartość:
- 100% uczestników UAT pomyślnie dodaje 5+ przepisów
- Średnia ocena intuicyjności formularza ≥ 4.0/5.0
- Średnio 8-10 przepisów dodanych na użytkownika w pierwszym tygodniu (analytics)

Metryka: Planowanie posiłków w kalendarzu
Sposób mierzenia:

- Manual testing UAT: użytkownik przypisuje przepisy do całego tygodnia (28 komórek)
- Pomiar czasu: ile zajmuje zaplanowanie tygodnia (timer podczas sesji UAT)
- Ankieta: "Czy kalendarz był łatwy w użyciu?" (skala 1-5)
  Docelowa wartość:
- 100% uczestników UAT pomyślnie planuje cały tydzień
- Średni czas planowania tygodnia < 10 minut (dla użytkownika z 5+ przepisami)
- Średnia ocena łatwości użycia kalendarza ≥ 4.0/5.0

Metryka: Dokładność AI kategoryzacji składników
Sposób mierzenia:

- Manual review 50-100 składników z różnych kategorii
- Porównanie AI kategoryzacji z human judgment (ekspert kulinarny/grocery shopper)
- Kategoryzacja uznana za "poprawną" jeśli pasuje do kategorii używanej w typowym polskim supermarkecie
  Docelowa wartość:
- > 80% trafność AI kategoryzacji (minimum akceptowalny)
- > 90% trafność (cel idealny)
- <5% składników w kategorii "Inne" (wskazuje na dobre działanie AI)

Metryka: Czas generowania listy zakupów
Sposób mierzenia:

- Performance monitoring: pomiar czasu od kliknięcia "Generuj listę" do wyświetlenia preview
- Tracking w aplikacji: timestamp start → timestamp end
- Web Vitals: custom metric "shopping_list_generation_time"
- Test dla różnych scenariuszy: 5 przepisów (mała lista), 20 przepisów (duża lista)
  Docelowa wartość:
- <3 sekundy dla typowej listy (10-15 przepisów, ~50 składników) w 95 percentyl (p95)
- <5 sekund dla dużej listy (20 przepisów, ~100 składników) w p95
- <10 sekund absolute maximum (timeout warning jeśli dłużej)

Metryka: Poprawność formatowania i czytelność eksportów PDF/TXT
Sposób mierzenia:

- Manual review PDF i TXT na 5 różnych urządzeniach:
  - iOS (iPhone Safari, iPad Safari)
  - Android (Chrome)
  - Windows (Chrome, Edge)
  - macOS (Safari, Chrome)
- Kryteria oceny:
  - Wszystkie kategorie i składniki widoczne
  - Checkboxy renderowane poprawnie (☐)
  - Polskie znaki (ą, ć, ę, ł, ń, ó, ś, ź, ż) wyświetlane poprawnie
  - Brak overflowing tekstu lub obciętych linii
  - Czytelny font size (minimum 10pt dla składników)
  - Możliwość wydruku bez utraty informacji
    Docelowa wartość:
- 100% czytelność na wszystkich testowanych urządzeniach i przeglądarkach
- 0 reported issues z eksportem podczas UAT
- Pozytywne opinie w ankiecie UAT na pytanie "Czy eksport PDF był użyteczny?" (≥80% odpowiedzi "Tak")

### 6.2 Kryteria UX (User Experience)

Metryka: Czas do pierwszego sukcesu (Time to First Success)
Definicja: Czas od rejestracji do pomyślnego wygenerowania i wyeksportowania pierwszej listy zakupów.
Sposób mierzenia:

- Nagranie sesji UAT z timerem (screen recording + audio)
- Tracking w analytics: custom events chain
  - "user_registered" (timestamp)
  - "first_recipe_created" (timestamp)
  - "first_meal_planned" (timestamp)
  - "first_shopping_list_generated" (timestamp)
  - "first_pdf_exported" (timestamp)
- Obliczenie delta: timestamp export - timestamp registration
  Docelowa wartość:
- <10 minut dla nowego użytkownika z minimal guidance (tylko onboarding tooltips/hints w UI)
- <5 minut dla użytkownika z quick tutorial video (opcjonalne, post-MVP)

Metryka: Płynność na urządzeniach mobilnych i desktop
Sposób mierzenia:

- Lighthouse Performance score (separate runs dla mobile i desktop)
- Web Vitals metrics:
  - LCP (Largest Contentful Paint): <2.5s
  - FID (First Input Delay): <100ms
  - CLS (Cumulative Layout Shift): <0.1
  - TTI (Time to Interactive): <3.5s
- Manual testing: scroll smoothness, button responsiveness, animations (subjective evaluation by testers)
- Ankieta UAT: "Czy aplikacja działała płynnie na Twoim urządzeniu?" (skala 1-5)
  Docelowa wartość:
- Lighthouse Performance score ≥ 90/100 (desktop) i ≥ 80/100 (mobile)
- Web Vitals: wszystkie w zielonym zakresie (good) dla ≥75% użytkowników (real user monitoring)
- 0 lagów lub freezes podczas UAT
- Średnia ocena płynności ≥ 4.5/5.0

Metryka: Liczba kliknięć do kluczowych akcji
Sposób mierzenia:

- Manual mapping user flows: liczenie clicks od dashboard do completion
- Kluczowe akcje:
  1. Dodanie przepisu: Dashboard → Przepisy → Dodaj przepis → [wypełnienie formularza] → Zapisz = 3 kliki (+ form interactions)
  2. Przypisanie przepisu do kalendarza: Dashboard → Kalendarz → Przypisz przepis → [wybór przepisu] = 3 kliki
  3. Generowanie listy z całego tygodnia: Dashboard → Kalendarz → Generuj listę → Zaznacz cały tydzień → Generuj = 4 kliki
  4. Eksport PDF: [z widoku listy] → Eksportuj PDF → Pobierz = 2 kliki
     Docelowa wartość:
- Wszystkie kluczowe akcje ≤ 5 kliknięć (excludując wypełnianie formularzy)
- Najczęstsza akcja (generowanie listy + eksport) ≤ 6 kliknięć total
- 0 complaint podczas UAT o "zbyt wiele kroków"

Metryka: Satysfakcja użytkownika (System Usability Scale - SUS)
Sposób mierzenia:

- Ankieta SUS po zakończeniu sesji UAT
- 10 pytań na skali 1-5 (strongly disagree - strongly agree):
  1. Myślę, że chciałbym często korzystać z tego systemu
  2. Uznałem system za niepotrzebnie skomplikowany (reversed)
  3. Myślę, że system był łatwy w użyciu
  4. Myślę, że potrzebowałbym pomocy osoby technicznej aby korzystać z systemu (reversed)
  5. Stwierdziłem, że różne funkcje w systemie były dobrze zintegrowane
  6. Myślę, że w systemie było zbyt wiele niespójności (reversed)
  7. Wyobrażam sobie, że większość ludzi nauczyłaby się obsługi systemu bardzo szybko
  8. Uznałem system za bardzo niewygodny w użyciu (reversed)
  9. Czułem się bardzo pewnie korzystając z systemu
  10. Musiałem nauczyć się wielu rzeczy zanim mogłem sprawnie korzystać z systemu (reversed)
- Obliczenie SUS score (0-100 scale)
  Docelowa wartość:
- SUS score ≥ 68 (above average, acceptable)
- SUS score ≥ 80 (excellent, cel idealny)
- Individual question scores: żadne pytanie nie powinno mieć średniej <3.0 lub >3.0 (dla reversed questions)

### 6.3 Kryteria techniczne

Metryka: Stabilność - brak krytycznych błędów
Sposób mierzenia:

- Sentry error tracking: automatyczne raportowanie wszystkich JS errors, API errors, crashes
- Klasyfikacja błędów:
  - Critical: aplikacja unusable (nie można się zalogować, nie można zapisać przepisu, crash)
  - High: major feature broken (AI categorization zawsze failuje, PDF nie generuje się)
  - Medium: minor issue (toast notification nie pokazuje się, styling bug)
  - Low: cosmetic (typo, alignment issue)
- Counting unique errors (nie total occurrences - jeden bug może dotknąć wielu użytkowników)
  Docelowa wartość:
- 0 critical errors podczas UAT (immediate hotfix jeśli wystąpią)
- 0 critical errors w pierwszych 2 tygodniach produkcji
- <5 high priority errors podczas UAT (wszystkie fixed przed launch)
- Error rate: <1% requestów kończy się błędem (tracking przez Sentry + server logs)

Metryka: Czas ładowania strony (Page Load Time)
Sposób mierzenia:

- Lighthouse Performance audit (separate dla każdej kluczowej strony: login, dashboard, recipes, calendar, shopping lists)
- Web Vitals real user monitoring (RUM):
  - LCP (Largest Contentful Paint): <2.5s good, 2.5-4s needs improvement, >4s poor
  - FID (First Input Delay): <100ms good, 100-300ms needs improvement, >300ms poor
  - CLS (Cumulative Layout Shift): <0.1 good, 0.1-0.25 needs improvement, >0.25 poor
  - TTI (Time to Interactive): <3.5s good, 3.5-7.3s moderate, >7.3s slow
- Testing conditions:
  - Fast 3G (throttled network dla mobile simulation)
  - 4G LTE (typical mobile)
  - Broadband (desktop)
    Docelowa wartość:
- Lighthouse Performance: ≥90/100 (desktop), ≥80/100 (mobile)
- LCP <2.5s dla ≥75% real users (p75)
- FID <100ms dla ≥75% real users
- CLS <0.1 dla ≥75% real users
- TTI <3.5s dla ≥75% real users

Metryka: Responsywność na różnych rozdzielczościach
Sposób mierzenia:

- Manual testing na realnych urządzeniach i rozdzielczościach:
  - Mobile: 320px (iPhone SE), 375px (iPhone 12/13), 414px (iPhone Plus/Pro Max), 360px (Android standard)
  - Tablet: 768px (iPad portrait), 1024px (iPad landscape)
  - Desktop: 1280px, 1440px, 1920px, 2560px (4K)
- BrowserStack automated screenshots dla wszystkich breakpointów
- Checklist dla każdej rozdzielczości:
  - Brak horizontal scroll
  - Wszystkie interactive elements dostępne (nie obcięte lub poza viewport)
  - Czytelny tekst (min. 14px font-size na mobile)
  - Touch-friendly buttons (min. 44px tap targets)
  - Images/content properly scaled
    Docelowa wartość:
- 100% funkcjonalność na wszystkich testowanych rozdzielczościach (320px - 2560px)
- 0 horizontal scroll na żadnej rozdzielczości
- 0 layout breaking issues podczas UAT

Metryka: Bezpieczeństwo danych (Row Level Security)
Sposób mierzenia:

- Code review wszystkich Supabase RLS policies
- Penetration testing: próby dostępu do danych innych użytkowników przez manipulację API calls
- Test scenariusze:
  1. User A próbuje odczytać przepisy User B (GET request z podmienionymi IDs)
  2. User A próbuje edytować przepis User B (UPDATE request)
  3. User A próbuje usunąć listę zakupów User B (DELETE request)
  4. Niezalogowany użytkownik próbuje dostać się do chronionych danych (brak auth token)
- Sprawdzenie CASCADE DELETE: usunięcie user account usuwa wszystkie dane użytkownika (GDPR compliance)
  Docelowa wartość:
- 100% izolacja danych: żaden test penetracyjny nie powinien pozwolić na dostęp do cudzych danych
- Wszystkie RLS policies prawidłowo skonfigurowane dla wszystkich tabel (recipes, ingredients, meal_plan, shopping_lists, shopping_list_items)
- 100% success rate dla CASCADE DELETE testów
- 0 security issues w Sentry related to unauthorized access

Metryka: API rate limiting i obsługa przeciążeń
Sposób mierzenia:

- Load testing z narzędziem k6 lub Artillery
- Test scenariusze:
  1. Single user: 100 requests/minute (normalny użytkownik)
  2. Spike: 10 concurrent users, każdy 50 requests/minute
  3. Sustained load: 100 concurrent users, każdy 20 requests/minute przez 5 minut
- Monitoring:
  - Response times (p50, p95, p99)
  - Error rates (429 Too Many Requests, 500 Internal Server Error, timeouts)
  - Throughput (requests/second handled successfully)
    Docelowa wartość:
- Rate limiting: 100 requests/minute/user bez 429 errors (Supabase default)
- Response times p95 <500ms dla read operations (GET recipes, GET meal plan)
- Response times p95 <1000ms dla write operations (POST recipe, POST shopping list)
- 0 crashes lub 500 errors podczas load testing
- Obsługa 100 concurrent users bez degradacji performance

### 6.4 Kryteria biznesowe i adopcji

Metryka: Potwierdzenie wartości produktu przez użytkowników
Sposób mierzenia:

- Ankieta UAT: kluczowe pytanie "Czy użyłbyś tej aplikacji regularnie (co tydzień) do planowania posiłków i zakupów?"
- Opcje odpowiedzi: Tak (1) / Raczej tak (0.75) / Nie jestem pewien (0.5) / Raczej nie (0.25) / Nie (0)
- Obliczenie adoption score: średnia z odpowiedzi (0-1 scale)
- Follow-up: "Dlaczego tak/nie?" (pytanie otwarte dla jakościowego feedbacku)
  Docelowa wartość:
- ≥80% odpowiedzi "Tak" lub "Raczej tak" (8-10 z 10 użytkowników UAT)
- Adoption score ≥0.8
- Minimum 0 odpowiedzi "Nie" (jeśli ktoś kategorycznie nie widziałby użyteczności, MVP nie spełnia celu)

Metryka: Rozwiązanie głównego problemu (oszczędność czasu)
Sposób mierzenia:

- Ankieta UAT przed użyciem aplikacji: "Ile czasu zajmuje Ci tygodniowo planowanie posiłków i tworzenie listy zakupów tradycyjnymi metodami?" (wartość w minutach)
- Pomiar podczas UAT: ile czasu zajmuje zaplanowanie tygodnia i wygenerowanie listy w aplikacji (timer)
- Ankieta UAT po użyciu: "Czy aplikacja zaoszczędziłaby Ci czas w porównaniu z Twoją obecną metodą?" (skala 1-5: definitely not - definitely yes)
- Pytanie otwarte: "Jakie inne problemy aplikacja rozwiązała lub stworzyła?"
  Docelowa wartość:
- ≥70% użytkowników UAT potwierdza oszczędność czasu (odpowiedź 4 lub 5 na skali)
- Średnia oszczędność czasu: ≥50% (np. z 60 minut/tydzień tradycyjnie → 30 minut/tydzień z aplikacją)
- Pozytywne komentarze jakościowe: co najmniej 5 konkretnych pain points rozwiązanych (np. "nie muszę już przepisywać składników", "lista jest bardziej zorganizowana", "nie zapominam o składnikach")

Metryka: Gotowość do skalowania architektury
Sposób mierzenia:

- Code review architektury z focus na skalowalność:
  - Database indexes: czy istnieją na często query'owanych kolumnach (user_id, recipe_id, date)
  - N+1 query problems: identyfikacja i fix
  - Caching strategy: czy Supabase cache i TanStack Query używane efektywnie
- Load testing (jak w metryce technicznej): obsługa 100+ concurrent users
- Cost projection: oszacowanie kosztów infrastruktury dla 1000, 10000, 100000 użytkowników
  - Supabase database storage
  - OpenAI API calls (AI categorization)
  - Hosting (Vercel/Netlify bandwidth)
    Docelowa wartość:
- Database properly indexed: wszystkie foreign keys + user_id + date columns
- 0 N+1 query problems w kluczowych operacjach
- Load testing: handling 100 concurrent users z <10% degradacją response times
- Cost projection: <$100/miesiąc dla 10000 aktywnych użytkowników (sustainable dla MVP/bootstrapped startup)

Metryka: Net Promoter Score (NPS)
Sposób mierzenia:

- Ankieta UAT: pytanie "Jak prawdopodobne jest, że polecisz ShopMate znajomemu lub rodzinie?" (skala 0-10)
  - 0-6: Detractors (krytycy)
  - 7-8: Passives (neutralni)
  - 9-10: Promoters (promotorzy)
- Obliczenie NPS: % Promoters - % Detractors (zakres: -100 do +100)
- Follow-up: "Co jest głównym powodem Twojej oceny?" (pytanie otwarte)
  Docelowa wartość:
- NPS ≥ 0 (więcej promoters niż detractors - minimum akceptowalny)
- NPS ≥ 30 (dobry wynik dla nowego produktu)
- NPS ≥ 50 (excellent, cel idealny)
- Rozkład: ≥50% Promoters, <20% Detractors

### 6.5 Tracking i monitoring w produkcji

Narzędzia monitoringu:

Sentry - Error Tracking

- Automatyczne wychwytywanie wszystkich JavaScript errors, API errors, crashes
- User context: email/user_id (pseudonymized dla GDPR) + browser/OS info
- Breadcrumbs: ścieżka użytkownika przed errorem (clicked X → navigated to Y → error occurred)
- Source maps: dla de-obfuscation production bundle
- Alerts: email/Slack notification dla critical errors
- Darmowy tier: 5000 errors/miesiąc (wystarczające dla MVP)

Google Analytics 4 lub Plausible - User Behavior Analytics
Tracked events:

- Page views: każda strona aplikacji (login, dashboard, recipes, calendar, shopping lists)
- Custom events:
  - "user_registered"
  - "user_logged_in"
  - "recipe_created"
  - "recipe_edited"
  - "recipe_deleted"
  - "meal_planned" (przepis przypisany do kalendarza)
  - "meal_unplanned"
  - "shopping_list_generated" (+ parametr: source=calendar/recipes, num_recipes, num_ingredients)
  - "shopping_list_saved"
  - "pdf_exported"
  - "txt_exported"
- User properties:
  - Registration date
  - Total recipes count
  - Total shopping lists count
  - Last active date
- Conversion funnel: rejestracja → pierwszy przepis → pierwszy meal plan → pierwszy shopping list → pierwszy eksport

Web Vitals - Performance Monitoring
Real User Monitoring (RUM) metrics:

- LCP (Largest Contentful Paint): tracking dla każdej strony
- FID (First Input Delay): tracking pierwszej interakcji użytkownika
- CLS (Cumulative Layout Shift): tracking layout stability
- TTFB (Time to First Byte): server response time
- Segmentacja: device type (mobile/tablet/desktop), connection (3G/4G/broadband), browser
- Alerty: jeśli p75 przekracza thresholdy (LCP >2.5s, FID >100ms, CLS >0.1)

Retention Metrics

- Daily Active Users (DAU): liczba unikalnych użytkowników aktywnych dzisiaj
- Weekly Active Users (WAU): liczba unikalnych użytkowników aktywnych w ostatnich 7 dniach
- Monthly Active Users (MAU): liczba unikalnych użytkowników aktywnych w ostatnich 30 dniach
- Retention rate:
  - Day 1: ile użytkowników wraca 1 dzień po rejestracji
  - Day 7: ile użytkowników wraca 7 dni po rejestracji
  - Day 30: ile użytkowników wraca 30 dni po rejestracji
- Churn rate: ile użytkowników przestaje korzystać (definicja: 0 aktywności przez 30 dni)
  Docelowa wartość dla MVP:
- Day 7 retention ≥ 40% (typowy benchmark dla productivity apps)
- Day 30 retention ≥ 20%
- Churn rate ≤ 50% w pierwszym miesiącu

Engagement Metrics

- Średnia liczba przepisów na użytkownika (docelowo: ≥10 po tygodniu)
- Średnia liczba list zakupów generowanych/tydzień (docelowo: ≥1 dla aktywnych użytkowników)
- Średnia liczba meal plannings/tydzień (docelowo: ≥0.8 = większość użytkowników planuje każdy tydzień)
- Feature adoption:
  - % użytkowników którzy użyli kalendarza (docelowo: ≥80%)
  - % użytkowników którzy wyeksportowali PDF (docelowo: ≥60%)
  - % użytkowników którzy edytowali przepis (docelowo: ≥30%)

Harmonogram monitorowania post-launch:

Pierwsze 48 godzin (intensywny monitoring):

- Checking Sentry errors co 4 godziny
- Immediate hotfix dla critical errors
- Monitoring server/database performance (Supabase dashboard)

Pierwszy tydzień:

- Daily review Sentry errors (categorize, prioritize)
- Daily check Web Vitals (czy w zielonych zakresach)
- Daily check analytics: liczba nowych rejestracji, active users, generated lists
- Friday: weekly report ze wszystkich metryk

Pierwsze 2 tygodnie:

- Email do użytkowników UAT: "Jak Ci się sprawdza ShopMate w prawdziwym użyciu?"
- Zbieranie feedback z formularza w aplikacji
- Monitoring NPS i user sentiment

Pierwszy miesiąc:

- Weekly analytics review: retention, churn, engagement
- Bi-weekly review feedbacku użytkowników
- Priorytetyzacja bugfixes i feature requests dla v1.1
- Monthly report: wszystkie metryki sukcesu vs targets

Długoterminowo (po miesiącu):

- Monthly deep-dive analytics review
- Quarterly user survey (NPS, feature requests, satisfaction)
- Continuous monitoring Sentry (alert-driven response)
- Continuous tracking Web Vitals (performance regression detection)
