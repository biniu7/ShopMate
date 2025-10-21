# Podsumowanie Sesji Planowania PRD - ShopMate MVP

## Informacje o projekcie

**Nazwa projektu:** ShopMate
**Typ:** Aplikacja webowa MVP
**Cel główny:** Automatyzacja planowania posiłków i generowania list zakupów na podstawie przepisów kulinarnych przyporządkowanych do kalendarza tygodniowego

---

## <conversation_summary>

### <decisions>

Podczas sesji planowania PRD podjęto **30 kluczowych decyzji** podzielonych na 3 rundy:

#### Runda 1 - Podstawowe decyzje projektowe (pytania 1-10):

1. **Formularz przepisów:** Strukturalny formularz z oddzielnymi polami (Nazwa, Składniki lista, Instrukcje) zamiast automatycznego parsowania swobodnego tekstu - zapewnia 100% dokładność ekstrakcji

2. **Model składników:** Prosty model tekstowy (nazwa + ilość bez automatycznej konwersji jednostek), agregacja tylko identycznych składników

3. **Interfejs kalendarza:** Przycisk "Przypisz przepis" przy każdej komórce zamiast drag-and-drop (odłożone na v1.1)

4. **Autoryzacja:** Podstawowa rejestracja email + hasło + reset hasła przez Supabase Auth, bez weryfikacji email i social login w MVP

5. **Edycja przepisów:** Dodano pełny CRUD z edycją przepisów jako kluczową funkcjonalność MVP (pierwotnie pominięta)

6. **Nawigacja kalendarza:** Przyciski "Poprzedni/Następny/Bieżący tydzień" z przechowywaniem wszystkich tygodni w bazie danych

7. **Listy zakupów:** Niemutowalne listy jako snapshot w momencie utworzenia, edycja tylko przed zapisem, historia list przechowywana w bazie

8. **Wyszukiwanie:** Proste wyszukiwanie po nazwie przepisu (case-insensitive substring matching) + sortowanie alfabetyczne/data

9. **Testowanie:** User Acceptance Testing (UAT) z 5-10 użytkownikami nietechnicznymi, ankieta SUS, formularz feedbacku, tracking metryk (GA/Plausible)

10. **Architektura bazy danych:** Znormalizowany model z 6 tabelami, składniki jako osobna tabela, jeden przepis na komórkę kalendarza

#### Runda 2 - Szczegóły implementacji (pytania 11-20):

11. **UI formularza składników:** Dynamiczna lista z trzema polami (ilość numeryczna opcjonalna, jednostka tekstowa, nazwa tekstowa wymagana), przycisk "+ Dodaj składnik", ikonka usuwania

12. **Agregacja składników:** Normalizacja przed agregacją (trim, lowercase, case-insensitive matching), składniki bez ilości jako osobne pozycje

13. **Tryby generowania list:** Dwa tryby - z kalendarza (zaznacz dni/posiłki) OR z przepisów (zaznacz checkboxy na liście przepisów)

14. **Obsługa pustych komórek:** Pomijanie bez ostrzeżenia, komunikat błędu tylko gdy wszystkie wybrane komórki puste

15. **Format eksportu:** **AI kategoryzacja składników** (Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne) z możliwością ręcznej edycji, PDF z checkboxami i kategoriami, TXT prosty format

16. **Responsywność:** Desktop (≥1024px) tabela 7×4, Tablet (768-1023px) scrollowalny poziomo, Mobile (<768px) accordion vertically stacked, optymalizacja mobile-first

17. **Propagacja zmian:** Edycja przepisu aktualizuje wszystkie przypisania w kalendarzu (live update), wygenerowane listy zakupów pozostają niezmienione (snapshot)

18. **Ochrona przed usunięciem:** Dialog potwierdzenia z komunikatem o liczbie przypisań w kalendarzu, przyciski "Anuluj" (domyślny) i "Usuń przepis i przypisania" (czerwony)

19. **Stack technologiczny:** Astro 5 + React 19 + TypeScript 5 + Tailwind CSS 4 + Shadcn/ui + Supabase + Node.js, dodatkowe: @react-pdf/renderer, Zod, TanStack Query (opcjonalne)

20. **Harmonogram:** 6-tygodniowy sprint (Setup+Auth → CRUD Przepisów → Kalendarz → Listy+AI → Polish+Feedback → UAT+Launch)

#### Runda 3 - Technikalia (pytania 21-30):

21. **Model AI:** OpenAI GPT-4o mini ($0.15/1M input tokens, ~100-200ms latencja, ~$0.0001 za 10 składników), fallback do kategorii "Inne" przy błędzie API

22. **AI prompt:** Batch processing wszystkich składników w jednym request, JSON response format z mapowaniem index→kategoria

23. **AI error handling:** Timeout 10s, max 2 retry z exponential backoff (1s, 2s), spinner + komunikat podczas ładowania, optimistic UI (użytkownik może edytować podczas pracy AI)

24. **Supabase RLS:** Polityki Row Level Security dla wszystkich tabel (recipes, ingredients, meal_plan, shopping_lists, shopping_list_items), użytkownik widzi tylko swoje dane

25. **Walidacja:** Zod schemas z polskimi komunikatami błędów (nazwa 3-100 znaków, instrukcje 10-5000 znaków, min. 1 składnik), komunikaty inline pod polami

26. **Limity:** Bez limitów przepisów i list zakupów, max 50 składników/przepis, rate limiting 100 req/min (Supabase default)

27. **Offline:** Brak PWA i offline support w MVP, graceful error handling z toast notification, odłożone na v1.1

28. **PDF export:** @react-pdf/renderer client-side, preview modal przed pobraniem, A4 pionowy, standardowy font Helvetica

29. **Accessibility:** WCAG AA przez Shadcn/ui + Tailwind, keyboard navigation, focus indicators, semantic HTML, cel Lighthouse 90/100

30. **Monitoring:** Sentry (error tracking, 5K errors/month darmowy tier), Plausible lub GA4 (analytics), Web Vitals (LCP <2.5s, FID <100ms, CLS <0.1)

</decisions>

---

### <matched_recommendations>

Najistotniejsze rekomendacje dopasowane do rozmowy:

1. **Uproszczenie MVP przez eliminację drag-and-drop** - zaoszczędzi 2-3 dni development time, prostszy UX dla użytkowników nietechnicznych

2. **AI kategoryzacja składników jako kluczowa innowacja** - wyróżnik konkurencyjny, znacząco poprawia UX list zakupów, predefiniowane kategorie ułatwiają zakupy w sklepie

3. **Niemutowalne listy zakupów (snapshot pattern)** - zachowuje historię, umożliwia porównanie zakupów, upraszcza architekturę (brak cascade updates)

4. **Strukturalny formularz zamiast AI parsing** - 100% dokładność vs 80%, brak kosztów API przy dodawaniu przepisów, przewidywalna UX

5. **Mobile-first responsywność** - grupa docelowa (25-55 lat) często planuje na smartfonach, accordion na mobile lepszy niż horizontal scroll

6. **Supabase RLS jako fundament bezpieczeństwa** - automatyczna izolacja danych użytkowników, brak ryzyka wycieku danych, zgodność z GDPR

7. **Client-side PDF generation** - zero kosztów serwera, natychmiastowy podgląd, działa offline po wygenerowaniu

8. **OpenAI GPT-4o mini dla AI kategoryzacji** - praktycznie darmowe ($0.0001 za listę), szybkie (100-200ms), stabilne API

9. **6-tygodniowy harmonogram iteracyjny** - realistyczny timeline dla solo developera lub small team, weekly milestones umożliwiają tracking

10. **UAT z 5-10 użytkownikami nietechnicznymi** - optymalna liczba dla MVP (więcej = diminishing returns), ankieta SUS zapewnia kwantyfikowalne metryki

11. **Zod walidacja z polskimi komunikatami** - type-safe, reusable schemas, spójne error messages, lepsze DX i UX

12. **Batch processing AI requests** - 10x oszczędność na API calls vs individual requests, szybsze (1 request vs N requests)

13. **Optimistic UI podczas AI categorization** - użytkownik może edytować listę podczas oczekiwania na AI, perceived performance improvement

14. **Sentry dla error tracking** - darmowy tier wystarczający dla MVP, automatic error capture, user context, source maps

15. **Normalizacja składników przed agregacją** - "200g mąki" + "200 G Mąki" = "400g mąki" (jeden wpis), intuitive behavior dla użytkowników

</matched_recommendations>

---

### <prd_planning_summary>

## Szczegółowe podsumowanie sesji planowania

### A. Główne wymagania funkcjonalne produktu

**1. Zarządzanie przepisami kulinarnymi (CRUD+)**
- Dodawanie przepisu przez strukturalny formularz z trzema sekcjami: nazwa, składniki (dynamiczna lista), instrukcje
- Wyświetlanie szczegółów przepisu z możliwością edycji wszystkich pól
- Lista wszystkich przepisów użytkownika z wyszukiwaniem po nazwie (substring matching)
- Usuwanie przepisu z dialogiem potwierdzenia jeśli przypisany w kalendarzu
- **Edycja przepisu aktualizuje wszystkie wystąpienia w kalendarzu (live update)**
- Każdy składnik to rekord z polami: nazwa (wymagane), ilość (opcjonalne), jednostka (opcjonalne)

**2. Kalendarz tygodniowy posiłków**
- Wizualizacja 7 dni (Poniedziałek-Niedziela) × 4 posiłki (Śniadanie, Drugie śniadanie, Obiad, Kolacja) = 28 komórek
- Przypisywanie przepisów przez przycisk "Przypisz przepis" otwierający listę przepisów
- Jeden przepis na komórkę w MVP (ograniczenie architektury)
- Nawigacja: przyciski "Poprzedni tydzień", "Następny tydzień", "Bieżący tydzień"
- Przechowywanie planowania wszystkich tygodni w bazie danych
- Responsywny layout: desktop - tabela 7×4, tablet - scrollowalny poziomo, mobile - accordion vertically stacked

**3. System autoryzacji i kont użytkowników**
- Rejestracja: email + hasło (Supabase Auth)
- Logowanie: email + hasło
- Reset hasła: email z linkiem resetującym
- Weryfikacja email: opcjonalna w MVP (można pominąć)
- Brak social login (Google/Facebook) - odłożone na v1.1
- Row Level Security (RLS) na wszystkich tabelach - użytkownik widzi tylko swoje dane

**4. Generowanie i zarządzanie listami zakupów**
- **Dwa tryby generowania:**
  - Z kalendarza: zaznacz dni/posiłki (checkboxy lub date range picker) → generuj
  - Z przepisów: lista przepisów z checkboxami → generuj
- Agregacja składników z normalizacją:
  - Trim wielokrotnych spacji
  - Case-insensitive matching (lowercase)
  - Sumowanie identycznych składników (nazwa + jednostka)
  - Składniki bez ilości jako osobne pozycje
- **AI kategoryzacja składników:**
  - OpenAI GPT-4o mini w batch request (wszystkie składniki naraz)
  - 7 kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne
  - Timeout 10s, max 2 retry z exponential backoff
  - Fallback: wszystko → "Inne" + toast notification
  - Ręczna edycja kategorii przez użytkownika
- Edycja listy przed zapisem: dodawanie/usuwanie pozycji, zmiana kategorii
- Zapis w bazie danych: lista jako niemutowalny snapshot (tylko odczyt po zapisie)
- Historia list zakupów: wszystkie wygenerowane listy z datą utworzenia

**5. Eksport list zakupów**
- **Format PDF:**
  - Biblioteka: @react-pdf/renderer (client-side)
  - Layout: A4 pionowy, standardowy font Helvetica
  - Nagłówek: "Lista zakupów - [data generowania]" + opcjonalnie zakres dat
  - Treść: kategorie jako sekcje, składniki z checkboxami (☐)
  - Stopka: "Wygenerowano przez ShopMate"
  - Podgląd przed pobraniem: modal z preview + przyciski "Pobierz"/"Anuluj"
- **Format TXT:**
  - Prosty format linijka po linijce bez checkboxów
  - Identyczna struktura jak PDF (kategorie → składniki)
  - Bezpośredni download bez preview

**6. Responsywny interfejs użytkownika**
- **Breakpointy:**
  - Desktop: ≥1024px
  - Tablet: 768-1023px
  - Mobile: <768px (minimum 320px)
- **Mobile-first approach:** optymalizacja dla smartfonów (główny use case)
- **Accessibility (a11y):**
  - WCAG AA compliance przez Shadcn/ui + Tailwind
  - Keyboard navigation (tab, enter, escape)
  - ARIA labels automatyczne przez Shadcn/ui
  - Semantic HTML (`<button>`, `<nav>`, `<main>`, `<form>`)
  - Focus indicators (Tailwind ring-2 ring-offset-2)
  - Alt text dla wszystkich ikon/obrazów
  - Cel: Lighthouse accessibility score ≥90/100

---

### B. Kluczowe historie użytkownika i ścieżki korzystania

**User Story 1: Nowy użytkownik planuje pierwszy tydzień**

*Jako nowy użytkownik chcę zaplanować posiłki na nadchodzący tydzień i wygenerować listę zakupów, aby zaoszczędzić czas na zakupach.*

**Ścieżka:**
1. Rejestracja: email + hasło → konto utworzone
2. Logowanie: email + hasło → dashboard
3. Dodanie przepisu #1:
   - Klik "Dodaj przepis"
   - Wypełnienie formularza: nazwa "Owsianka z bananami"
   - Dodanie składników: "200g" + "płatki owsiane", "1 sztuka" + "banan", "200ml" + "mleko"
   - Instrukcje: "Zagotuj mleko, dodaj płatki, gotuj 5 min, podawaj z bananem"
   - Klik "Zapisz" → przepis dodany
4. Dodanie przepisów #2-5: powtórz krok 3 dla innych przepisów
5. Nawigacja do kalendarza: klik "Kalendarz" w menu
6. Przypisanie przepisu do komórki:
   - Klik "Przypisz przepis" w komórce "Poniedziałek / Śniadanie"
   - Wybór "Owsianka z bananami" z listy
   - Potwierdzenie → przepis przypisany
7. Powtórz krok 6 dla wszystkich posiłków tygodnia
8. Generowanie listy zakupów:
   - Klik "Generuj listę zakupów"
   - Wybór źródła: "Cały tydzień"
   - Klik "Generuj" → oczekiwanie 1-3s (spinner + "Kategoryzuję składniki...")
   - AI kategoryzuje składniki, agreguje duplikaty
   - Preview listy: kategorie → składniki z checkboxami
9. Edycja listy (opcjonalnie):
   - Zmiana kategorii składnika drag-and-drop lub dropdown
   - Usunięcie zbędnego składnika (klik 🗑️)
   - Dodanie dodatkowego składnika (klik "+ Dodaj")
10. Eksport:
    - Klik "Eksportuj PDF"
    - Preview PDF w modalu
    - Klik "Pobierz" → plik PDF zapisany lokalnie
11. Zakupy: użytkownik idzie do sklepu z PDF na telefonie, odznacza zakupione pozycje

**Kryterium sukcesu:** Nowy użytkownik zaplanował tydzień i wygenerował listę zakupów w <10 minut

---

**User Story 2: Powracający użytkownik edytuje przepis**

*Jako powracający użytkownik chcę poprawić przepis, który był niedokładny, aby moje przyszłe listy zakupów były prawidłowe.*

**Ścieżka:**
1. Logowanie: email + hasło → dashboard
2. Nawigacja do przepisów: klik "Przepisy" w menu
3. Wyszukanie przepisu: wpisanie "Owsianka" w search bar
4. Otwarcie przepisu: klik na "Owsianka z bananami"
5. Klik "Edytuj"
6. Widoczna informacja: "ℹ️ Ten przepis jest przypisany do 3 posiłków w kalendarzu"
7. Zmiana składnika: edycja ilości mleka z "200ml" na "250ml"
8. Klik "Zapisz" → przepis zaktualizowany
9. **Live update:** wszystkie 3 przypisania w kalendarzu pokazują nową ilość mleka
10. **Snapshot:** wcześniej wygenerowane listy zakupów pozostają niezmienione (200ml mleka)
11. Opcjonalnie: użytkownik generuje nową listę zakupów z zaktualizowanym przepisem

**Kryterium sukcesu:** Edycja przepisu aktualizuje kalendarz w czasie rzeczywistym, historia list nie jest modyfikowana

---

**User Story 3: Użytkownik generuje listę z wybranych przepisów (bez kalendarza)**

*Jako użytkownik chcę wygenerować listę zakupów tylko dla 2-3 przepisów na weekend, bez planowania całego tygodnia.*

**Ścieżka:**
1. Logowanie → dashboard
2. Klik "Generuj listę zakupów"
3. Wybór trybu: "Z wybranych przepisów"
4. Lista przepisów z checkboxami
5. Zaznaczenie 3 przepisów: "Pizza Margherita", "Sałatka grecka", "Tiramisu"
6. Klik "Generuj listę"
7. AI kategoryzuje składniki z 3 przepisów
8. Preview listy zakupów z kategoriami
9. Eksport PDF → zakupy

**Kryterium sukcesu:** Użytkownik wygenerował listę bez konieczności planowania w kalendarzu

---

**User Story 4: Użytkownik usuwa przepis przypisany w kalendarzu**

*Jako użytkownik chcę usunąć przepis, którego już nie gotuję, ale system powinien mnie ostrzec jeśli jest używany.*

**Ścieżka:**
1. Logowanie → przepisy
2. Klik "Usuń" przy przepisie "Owsianka z bananami"
3. System wykrywa 3 przypisania w kalendarzu
4. Dialog potwierdzenia: "⚠️ Ten przepis jest przypisany do 3 posiłków. Usunięcie przepisu spowoduje usunięcie tych przypisań. Czy na pewno chcesz kontynuować?"
5. Przyciski: [Anuluj] [Usuń przepis i przypisania]
6. Użytkownik klika "Usuń przepis i przypisania"
7. Przepis usunięty z listy, 3 komórki kalendarza stają się puste
8. Toast notification: "✅ Przepis usunięty wraz z 3 przypisaniami"

**Kryterium sukcesu:** Użytkownik został ostrzeżony przed utratą danych, akcja wymaga świadomego potwierdzenia

---

**User Story 5: AI kategoryzacja nie działa - fallback flow**

*Jako użytkownik chcę wygenerować listę zakupów nawet gdy serwis AI jest niedostępny.*

**Ścieżka:**
1. Użytkownik generuje listę zakupów
2. System wysyła request do OpenAI API
3. Timeout po 10s (brak odpowiedzi)
4. Retry #1 po 1s → timeout
5. Retry #2 po 2s → timeout
6. Fallback: wszystkie składniki przypisane do kategorii "Inne"
7. Toast notification: "⚠️ Automatyczna kategoryzacja niedostępna. Możesz ręcznie przypisać kategorie."
8. Preview listy: wszystkie składniki w kategorii "Inne"
9. Użytkownik ręcznie zmienia kategorie przez dropdown przy każdym składniku
10. Eksport PDF z ręcznie przypisanymi kategoriami

**Kryterium sukcesu:** Aplikacja działa nawet przy awarii zewnętrznego serwisu AI, użytkownik ma opcję manualnej kategoryzacji

---

### C. Ważne kryteria sukcesu i sposoby ich mierzenia

**1. Kryteria funkcjonalne:**

| Kryterium | Sposób mierzenia | Docelowa wartość |
|-----------|------------------|------------------|
| Utworzenie konta i logowanie | Test manualny podczas UAT | 100% success rate (5-10 użytkowników) |
| Dodanie 5+ przepisów | Test manualny podczas UAT | 100% użytkowników UAT (5-10 osób) |
| Dokładność AI kategoryzacji | Manual review 50 składników z różnych kategorii | >80% trafność |
| Czas generowania listy zakupów | Performance monitoring (Web Vitals) | <3 sekundy (p95) |
| Poprawność formatowania PDF | Manual review PDF na 5 urządzeniach (iOS, Android, Windows, Mac, Linux) | 100% czytelność |

**2. Kryteria UX:**

| Kryterium | Sposób mierzenia | Docelowa wartość |
|-----------|------------------|------------------|
| Czas planowania tygodnia | Nagranie sesji UAT + timer | <10 minut (dla nowego użytkownika) |
| Płynność na mobile i desktop | Manual testing + Lighthouse Performance score | >90/100 Lighthouse, brak lagów |
| Liczba kliknięć do akcji | Analiza ścieżek użytkownika (user flow mapping) | ≤3 kliknięcia dla kluczowych akcji |
| Satysfakcja użytkownika | Ankieta SUS (System Usability Scale) | SUS score ≥68 (above average) |

**3. Kryteria techniczne:**

| Kryterium | Sposób mierzenia | Docelowa wartość |
|-----------|------------------|------------------|
| Stabilność (brak krytycznych błędów) | Sentry error tracking | 0 critical errors w UAT |
| Czas ładowania strony | Lighthouse Performance + Web Vitals | LCP <2.5s, FID <100ms, CLS <0.1 |
| Responsywność | Manual testing + BrowserStack | Działa na urządzeniach od 320px |
| Bezpieczeństwo danych | Code review RLS policies + penetration testing | 100% izolacja danych użytkowników |
| API rate limiting | Load testing (k6 lub Artillery) | Max 100 req/min/user bez 429 errors |

**4. Kryteria biznesowe:**

| Kryterium | Sposób mierzenia | Docelowa wartość |
|-----------|------------------|------------------|
| Potwierdzenie wartości | Ankieta UAT: "Czy użyłbyś tej aplikacji regularnie?" | ≥80% odpowiedzi "Tak" (8-10/10 użytkowników) |
| Rozwiązanie głównego problemu | Ankieta UAT: pytanie otwarte + analiza tematyczna | ≥70% użytkowników potwierdza oszczędność czasu |
| Gotowość do skalowania | Code review architektury + load testing | Obsługa 100 concurrent users bez degradacji |
| Net Promoter Score (NPS) | Ankieta UAT: "Czy polecisz tę aplikację?" (0-10) | NPS ≥0 (more promoters than detractors) |

**5. Tracking i monitoring w produkcji:**

- **Sentry:** error tracking (5K errors/month darmowy tier)
  - Critical errors: 0 tolerance (hotfix within 24h)
  - Non-critical errors: <1% użytkowników dotkniętych
- **Google Analytics / Plausible:** user behavior analytics
  - Page views, session duration, bounce rate
  - User flows: przepisy → kalendarz → lista zakupów → eksport
  - Conversion funnel: rejestracja → pierwszy przepis → pierwszy eksport
- **Web Vitals:** performance monitoring
  - LCP (Largest Contentful Paint): <2.5s
  - FID (First Input Delay): <100ms
  - CLS (Cumulative Layout Shift): <0.1
  - TTI (Time to Interactive): <3.5s
- **Custom events:** business-specific metrics
  - Liczba dodanych przepisów na użytkownika
  - Liczba wygenerowanych list zakupów na użytkownika
  - Średni czas między rejestracją a pierwszym eksportem
  - Retention: użytkownicy aktywni po 7 dniach, 30 dniach

---

### D. Architektura techniczna i decyzje projektowe

**1. Stack technologiczny:**

**Frontend:**
- Astro 5: meta-framework z partial hydration (interactive islands)
- React 19: komponenty interaktywne (formularze, kalendarz, modały)
- TypeScript 5: type safety, better DX, auto-completion
- Tailwind CSS 4: utility-first styling, mobile-first responsive
- Shadcn/ui: accessible component library (WCAG AA compliant)

**Backend:**
- Supabase: PostgreSQL database + Auth + Row Level Security
- OpenAI API: GPT-4o mini dla AI kategoryzacji składników

**Libraries:**
- @react-pdf/renderer: client-side PDF generation
- Zod: schema validation dla formularzy
- TanStack Query: data fetching, caching, synchronization (opcjonalne)

**Infrastruktura:**
- Vercel/Netlify: hosting aplikacji webowej (darmowy tier wystarczy)
- Sentry: error tracking i monitoring (5K errors/month darmowy)
- Plausible / Google Analytics 4: user analytics

**2. Model bazy danych:**

```sql
-- Tabele
users (Supabase Auth) - zarządzane przez Supabase

recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  instructions TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  quantity DECIMAL(10,2),
  unit VARCHAR(50),
  sort_order INTEGER NOT NULL
)

meal_plan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type VARCHAR(50) NOT NULL CHECK (meal_type IN ('breakfast', 'snack', 'lunch', 'dinner')),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  UNIQUE(user_id, date, meal_type)
)

shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
)

shopping_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  ingredient_name VARCHAR(200) NOT NULL,
  quantity VARCHAR(100),
  category VARCHAR(50) NOT NULL CHECK (category IN ('Nabiał', 'Warzywa', 'Owoce', 'Mięso', 'Pieczywo', 'Przyprawy', 'Inne')),
  sort_order INTEGER NOT NULL
)
```

**Row Level Security (RLS) Policies:**

```sql
-- recipes
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own recipes" ON recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recipes" ON recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recipes" ON recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recipes" ON recipes FOR DELETE USING (auth.uid() = user_id);

-- ingredients (cascade przez recipe_id)
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ingredients" ON ingredients FOR SELECT USING (
  EXISTS (SELECT 1 FROM recipes WHERE recipes.id = ingredients.recipe_id AND recipes.user_id = auth.uid())
);
CREATE POLICY "Users can insert own ingredients" ON ingredients FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM recipes WHERE recipes.id = ingredients.recipe_id AND recipes.user_id = auth.uid())
);
CREATE POLICY "Users can update own ingredients" ON ingredients FOR UPDATE USING (
  EXISTS (SELECT 1 FROM recipes WHERE recipes.id = ingredients.recipe_id AND recipes.user_id = auth.uid())
);
CREATE POLICY "Users can delete own ingredients" ON ingredients FOR DELETE USING (
  EXISTS (SELECT 1 FROM recipes WHERE recipes.id = ingredients.recipe_id AND recipes.user_id = auth.uid())
);

-- meal_plan
ALTER TABLE meal_plan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own meal plan" ON meal_plan FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meal plan" ON meal_plan FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meal plan" ON meal_plan FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meal plan" ON meal_plan FOR DELETE USING (auth.uid() = user_id);

-- shopping_lists
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own shopping lists" ON shopping_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shopping lists" ON shopping_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shopping lists" ON shopping_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shopping lists" ON shopping_lists FOR DELETE USING (auth.uid() = user_id);

-- shopping_list_items (cascade przez shopping_list_id)
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own shopping list items" ON shopping_list_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM shopping_lists WHERE shopping_lists.id = shopping_list_items.shopping_list_id AND shopping_lists.user_id = auth.uid())
);
CREATE POLICY "Users can insert own shopping list items" ON shopping_list_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM shopping_lists WHERE shopping_lists.id = shopping_list_items.shopping_list_id AND shopping_lists.user_id = auth.uid())
);
CREATE POLICY "Users can update own shopping list items" ON shopping_list_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM shopping_lists WHERE shopping_lists.id = shopping_list_items.shopping_list_id AND shopping_lists.user_id = auth.uid())
);
CREATE POLICY "Users can delete own shopping list items" ON shopping_list_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM shopping_lists WHERE shopping_lists.id = shopping_list_items.shopping_list_id AND shopping_lists.user_id = auth.uid())
);
```

**3. AI Integration - OpenAI GPT-4o mini:**

**Prompt template:**
```
Kategoryzuj poniższe składniki do jednej z kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne.

Składniki:
1. mleko
2. pomidor
3. kurczak
4. chleb
5. bazylia

Zwróć odpowiedź w formacie JSON:
{
  "1": "Nabiał",
  "2": "Warzywa",
  "3": "Mięso",
  "4": "Pieczywo",
  "5": "Przyprawy"
}
```

**Implementation details:**
- Batch processing: jeden request dla wszystkich składników (oszczędność API calls)
- Timeout: 10 sekund
- Retry logic: max 2 próby z exponential backoff (1s, 2s)
- Fallback: przy błędzie wszystkie składniki → kategoria "Inne"
- UX: spinner + komunikat "Kategoryzuję składniki..." podczas oczekiwania
- Optimistic UI: użytkownik może edytować listę podczas pracy AI
- Cost estimate: ~$0.0001 za listę 10 składników (praktycznie darmowe)

**4. Walidacja i error handling:**

**Zod schemas:**
```typescript
const RecipeSchema = z.object({
  name: z.string()
    .min(3, "Nazwa przepisu musi mieć min. 3 znaki")
    .max(100, "Nazwa przepisu może mieć max. 100 znaków"),
  instructions: z.string()
    .min(10, "Instrukcje muszą mieć min. 10 znaków")
    .max(5000, "Instrukcje mogą mieć max. 5000 znaków"),
  ingredients: z.array(z.object({
    name: z.string().min(1, "Nazwa składnika jest wymagana"),
    quantity: z.number().optional(),
    unit: z.string().optional()
  })).min(1, "Przepis musi mieć przynajmniej 1 składnik")
});
```

**Error handling:**
- Form validation errors: inline messages pod polami (czerwony tekst)
- API errors: toast notifications z retry button
- Network errors: toast "⚠️ Brak połączenia. Sprawdź internet i spróbuj ponownie."
- 500 Internal Server Error: automatyczny Sentry report + user-friendly message
- 429 Rate Limit: toast "Zbyt wiele requestów. Spróbuj za chwilę."

**5. Performance optimization:**

- **Code splitting:** Astro automatic route-based splitting
- **Image optimization:** Astro Image component z lazy loading
- **Font optimization:** system fonts (no custom fonts w MVP)
- **Bundle size:** target <100KB initial JS bundle
- **Caching strategy:**
  - Recipes list: stale-while-revalidate (5 minut)
  - Single recipe: stale-while-revalidate (1 minuta)
  - Meal plan: stale-while-revalidate (30 sekund)
  - Shopping lists: no cache (always fresh)

---

### E. Harmonogram realizacji (6 tygodni)

**Tydzień 1: Setup + Auth**
- Setup Astro 5 + React 19 + TypeScript + Tailwind CSS 4
- Konfiguracja Supabase (projekt, baza danych, RLS policies)
- Instalacja Shadcn/ui components
- Implementacja rejestracji (email + hasło)
- Implementacja logowania (email + hasło)
- Implementacja reset hasła (email z linkiem)
- Podstawowy layout aplikacji (header, navigation, footer)
- Routing: /login, /register, /reset-password, /dashboard

**Tydzień 2: CRUD Przepisów**
- Formularz dodawania przepisu:
  - Input: nazwa przepisu (validation: 3-100 znaków)
  - Textarea: instrukcje (validation: 10-5000 znaków)
  - Dynamiczna lista składników (ilość + jednostka + nazwa)
  - Przycisk "+ Dodaj składnik"
  - Ikonka 🗑️ usuwania składnika
- Lista przepisów:
  - Wyświetlanie wszystkich przepisów użytkownika
  - Search bar: wyszukiwanie po nazwie (substring matching)
  - Sortowanie: alfabetyczne A-Z / Z-A, data dodania
- Widok szczegółów przepisu:
  - Wyświetlanie nazwy, składników, instrukcji
  - Przycisk "Edytuj" → formularz edycji
  - Informacja "ℹ️ Ten przepis jest przypisany do X posiłków" jeśli w kalendarzu
- Edycja przepisu:
  - Ten sam formularz co dodawanie, wypełniony danymi
  - Live update wszystkich przypisań w kalendarzu
- Usuwanie przepisu:
  - Przycisk "Usuń" w widoku szczegółów
  - Dialog potwierdzenia jeśli przepis w kalendarzu
  - Cascade delete: recipes → ingredients + meal_plan assignments

**Tydzień 3: Kalendarz tygodniowy**
- Widok kalendarza 7 dni × 4 posiłki:
  - Desktop (≥1024px): tabela 7 kolumn × 4 wiersze
  - Tablet (768-1023px): scrollowalny poziomo
  - Mobile (<768px): accordion vertically stacked (każdy dzień osobna sekcja)
- Przypisywanie przepisów:
  - Przycisk "Przypisz przepis" w każdej komórce
  - Modal z listą przepisów (search + infinite scroll)
  - Klik na przepis → przypisanie do komórki
- Nawigacja między tygodniami:
  - Przyciski: [← Poprzedni tydzień] [Bieżący tydzień] [Następny tydzień →]
  - Date picker: wybór konkretnego tygodnia
- Usuwanie przypisania:
  - Przycisk "✕" w komórce z przypisanym przepisem
  - Brak dialog potwierdzenia (szybka akcja)
- Wyświetlanie przepisu w komórce:
  - Nazwa przepisu (truncate po 30 znakach)
  - Hover: tooltip z pełną nazwą
  - Klik na nazwę → widok szczegółów przepisu (side panel lub modal)

**Tydzień 4: Generowanie list zakupów + AI kategoryzacja**
- Interfejs generowania listy:
  - Tryb "Z kalendarza":
    - Checkboxy: zaznacz dni (Pon-Niedz) + posiłki (Śniadanie-Kolacja)
    - Shortcut: "Cały tydzień" (zaznacza wszystkie checkboxy)
  - Tryb "Z przepisów":
    - Lista przepisów z checkboxami
    - Search bar: szybkie znajdowanie przepisów
- Agregacja składników:
  - Fetch składników z zaznaczonych przepisów
  - Normalizacja: trim, lowercase
  - Grupowanie: identyczna nazwa + jednostka
  - Sumowanie ilości (jeśli numeryczne)
- AI kategoryzacja:
  - Batch request do OpenAI GPT-4o mini
  - Prompt: lista składników → JSON mapping index→kategoria
  - Timeout 10s, retry 2x z exponential backoff (1s, 2s)
  - Spinner + "Kategoryzuję składniki..."
  - Fallback: wszystko → "Inne" + toast notification
- Preview listy zakupów:
  - Wyświetlanie kategorii jako sekcje
  - Każdy składnik: checkbox (☐) + ilość + jednostka + nazwa
  - Drag-and-drop lub dropdown: zmiana kategorii składnika
  - Przycisk "+ Dodaj składnik" (manual addition)
  - Przycisk "🗑️" przy każdym składniku (usuwanie)
- Zapis listy:
  - Przycisk "Zapisz listę"
  - Prompt: "Nazwa listy" (opcjonalnie, default: "Lista zakupów - [data]")
  - Insert do shopping_lists + shopping_list_items
  - Redirect do widoku zapisanej listy
- Eksport PDF:
  - Przycisk "Eksportuj PDF" w widoku listy
  - Preview PDF w modalu (@react-pdf/renderer)
  - Layout: A4 pionowy, Helvetica, kategorie → składniki z checkboxami
  - Przyciski: [Pobierz] [Anuluj]
  - Download PDF do lokalnego systemu plików
- Eksport TXT:
  - Przycisk "Eksportuj TXT"
  - Generowanie prostego pliku tekstowego
  - Format: kategoria\nskładnik1\nskładnik2\n...
  - Direct download bez preview

**Tydzień 5: Responsywność + UI polish + Feedback**
- Responsywność mobile:
  - Test na BrowserStack (iOS Safari, Android Chrome, różne rozdzielczości)
  - Poprawki layoutu kalendarza (accordion na mobile)
  - Optymalizacja formularzy (touch-friendly buttons, min 44px tap targets)
  - Test keyboard navigation (tab, enter, escape)
- UI polish:
  - Spójne spacing (Tailwind scale: 4, 8, 16, 24, 32)
  - Transitions i animations (subtle, <300ms)
  - Loading states (spinners, skeleton screens)
  - Empty states (np. "Brak przepisów. Dodaj pierwszy przepis!")
  - Error states (inline validation messages, toast notifications)
- Accessibility:
  - ARIA labels dla interactive elements
  - Semantic HTML (button, nav, main, form)
  - Focus indicators (Tailwind ring)
  - Alt text dla ikon/obrazów
  - Lighthouse Accessibility audit → target 90/100
- Formularz feedbacku:
  - Sticky button "📝 Feedback" (bottom-right corner)
  - Modal z formularzem:
    - Textarea: "Twoja opinia" (required, 10-500 znaków)
    - Radio buttons: "Ocena" 1-5 gwiazdek
    - Input: "Email" (opcjonalnie)
  - Zapis do Supabase tabeli "feedback"
  - Toast confirmation: "✅ Dziękujemy za feedback!"
- Setup analytics:
  - Google Analytics 4 lub Plausible
  - Custom events: dodanie przepisu, generowanie listy, eksport PDF
  - Page views tracking
  - User flows: rejestracja → pierwszy przepis → eksport
- Ankieta SUS dla UAT:
  - 10 pytań System Usability Scale
  - 5-point Likert scale (1 = strongly disagree, 5 = strongly agree)
  - Przygotowanie Google Forms lub Typeform
  - Link do ankiety w email do użytkowników UAT

**Tydzień 6: Testy + UAT + Bug fixes → Launch**
- Testy wewnętrzne (wszystkie user flows):
  - Happy path: rejestracja → dodanie przepisów → kalendarz → lista zakupów → eksport PDF
  - Edge cases: puste listy, brak internetu, timeout AI, błędy walidacji
  - Error handling: 500 errors, 429 rate limit, network disconnects
  - Cross-browser: Chrome, Firefox, Safari, Edge
  - Cross-device: Desktop, Tablet, Mobile (iOS + Android)
- Rekrutacja użytkowników UAT:
  - 5-10 osób nietechnicznych (target demographic: 25-55 lat)
  - Różnorodność: osoby samotne, rodziny, różne doświadczenia z aplikacjami
- Przeprowadzenie UAT:
  - Sesje 30-45 minut (indywidualne lub grupowe)
  - Zadania do wykonania: zaplanowanie tygodnia, wygenerowanie listy, eksport PDF
  - Nagrywanie sesji (z zgodą użytkownika) - screen recording + audio
  - Notowanie problemów, confusions, suggestions
- Zbieranie feedbacku:
  - Ankieta SUS (System Usability Scale) po sesji
  - Pytanie otwarte: "Co najbardziej Ci się podobało?"
  - Pytanie otwarte: "Co sprawiło Ci największe trudności?"
  - NPS question: "Czy poleciłbyś ShopMate znajomemu?" (0-10)
- Analiza feedbacku:
  - Calculation SUS score (target: ≥68 above average)
  - Themantic analysis otwartych odpowiedzi
  - Priorytetyzacja bug fixes: critical → high → medium → low
- Bug fixes:
  - Critical bugs (blocker): naprawić przed launch
  - High priority bugs: naprawić przed launch jeśli możliwe
  - Medium/Low priority bugs: dokumentować w backlog (post-launch)
- Final QA:
  - Smoke tests wszystkich kluczowych features
  - Performance check: Lighthouse scores (Performance, Accessibility, Best Practices, SEO)
  - Security check: test RLS policies, injection attacks, XSS
- Deployment:
  - Setup Vercel/Netlify project
  - Configure environment variables (Supabase, OpenAI API keys)
  - Domain setup (np. shopmate.app lub subdomain)
  - SSL certificate (automatic przez Vercel/Netlify)
  - Deploy produkcji z main branch
- Launch MVP 🚀:
  - Announcement na social media (jeśli planowane)
  - Email do użytkowników UAT z podziękowaniem + link do produkcji
  - Monitoring Sentry errors + analytics traffic
  - On-call pierwszy tydzień (quick response na critical issues)

---

### F. Post-launch i iteracja

**Monitorowanie (pierwsze 2 tygodnie):**
- Daily check Sentry errors (zero tolerance dla critical errors)
- Weekly review Google Analytics / Plausible:
  - Liczba nowych rejestracji
  - Retention rate (użytkownicy wracający po 7 dniach)
  - Conversion funnel: rejestracja → pierwszy przepis → pierwszy eksport
  - Top pages, session duration, bounce rate
- User feedback z formularza w aplikacji:
  - Weekly review wszystkich feedbacków
  - Kategoryzacja: bug report, feature request, general feedback
  - Response na critical issues w 24-48h

**Roadmap v1.1 (kolejne 4-6 tygodni po launch):**

Wysokopriorytowe features (based on original document + session decisions):
1. **Import przepisów z pliku** (JPG, PDF, DOCX) - wymaga OCR API (np. Google Cloud Vision)
2. **Szablony tygodniowe** - zapisz tydzień jako szablon, ponowne użycie jednym klikiem
3. **Drag-and-drop w kalendarzu** - enhancement UX dla power users
4. **PWA + offline support** - Service Worker, cache recipes + meal plan, sync on reconnect
5. **Wyszukiwanie po składnikach** - "Pokaż przepisy z kurczakiem" → lista filtered recipes

Średniopriorytowe features:
6. **OAuth social login** - Google / Facebook authentication
7. **Weryfikacja email** - confirm email po rejestracji
8. **Obsługa wielu przepisów na komórkę** - np. zupa + drugie danie na obiad
9. **Tagi i kategorie przepisów** - "Śniadania", "Desery", "Wegetariańskie"
10. **Planowanie na wiele tygodni** - scrollowalny kalendarz 4-8 tygodni

Długoterminowe (v2.0+):
11. **Udostępnianie przepisów** - funkcje społecznościowe, profile publiczne
12. **Integracje zakupowe** - Frisco, Carrefour API (automatic order from list)
13. **Obsługa diet i alergii** - profile dietetyczne, filtrowanie przepisów
14. **Aplikacje mobilne natywne** - iOS + Android (React Native lub Flutter)
15. **Analityka i raporty** - statystyki użycia, szacowanie kosztów zakupów

---

</prd_planning_summary>

---

### <unresolved_issues>

**1. AI Prompt szczegóły (pytanie 22) - brakujący przykład w dokumencie**

W ostatecznym dokumencie (`.ai/doc/2_asystent-planowania-prd.md` linie 308-313) brakuje pełnego przykładu AI prompt template. Było zaplanowane, ale nie zostało wypełnione w finalnej wersji.

**Rekomendacja:** Użyj promptu zdefiniowanego w pytaniu 22 (linie 107-125 dokumentu oryginalnego przed edycją użytkownika):

```
Kategoryzuj poniższe składniki do jednej z kategorii: Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne.

Składniki:
1. mleko
2. pomidor
3. kurczak
4. chleb
5. bazylia

Zwróć odpowiedź w formacie JSON:
{
  "1": "Nabiał",
  "2": "Warzywa",
  "3": "Mięso",
  "4": "Pieczywo",
  "5": "Przyprawy"
}
```

Batch processing: wszystkie składniki w jednym request.

---

**2. Konwersja jednostek miar - nierozwiązane w MVP**

Pierwotny dokument wspomina "brak jednostek miar" jako ograniczenie MVP. Decyzja z sesji: prosty model tekstowy bez automatycznej konwersji. Pozostaje pytanie:

**Co z różnymi jednostkami tego samego składnika?**
- Przykład: "2 łyżki mąki" + "500g mąki" = dwie osobne pozycje na liście zakupów
- Użytkownik może to uznać za suboptimal experience

**Rekomendacja dla post-MVP (v1.1):**
- Dodaj opcjonalną konwersję jednostek dla podstawowych składników
- Tabela konwersji: 1 łyżka mąki = 10g, 1 szklanka mleka = 250ml, etc.
- Użytkownik może włączyć/wyłączyć auto-konwersję w ustawieniach

---

**3. Handling bardzo długich list zakupów (>100 składników)**

Nie dyskutowano edge case: co się dzieje gdy użytkownik generuje listę z 20+ przepisów?
- AI request może przekroczyć token limit OpenAI (~4096 tokens dla GPT-4o mini input)
- PDF może być wielostronicowy i nieczytelny

**Rekomendacja:**
- Limit w UI: max 20 przepisów na jedną listę zakupów
- Jeśli użytkownik próbuje więcej: toast "Zbyt wiele przepisów. Wybierz maksymalnie 20."
- Alternatywnie: chunk AI requests (po 50 składników) i merge wyniki
- PDF: automatyczna paginacja przez @react-pdf/renderer (multi-page support)

---

**4. Współdzielenie konta (rodziny, współlokatorzy) - poza MVP**

Pierwotny dokument wspomina "konta rodzinne" jako zaawansowaną funkcję poza MVP. Nie omówiono:
- Czy użytkownicy będą prosić o tę funkcję od razu?
- Czy to kluczowy pain point dla grupy docelowej (osoby planujące dla rodziny)?

**Rekomendacja:**
- Monitoruj feedback podczas UAT i po launch
- Jeśli ≥30% użytkowników pyta o sharing: priorytetyzuj w v1.1
- Implementacja: invite system (email invite → shared access do przepisów + kalendarza)
- Rozważmy to jako potential premium feature (freemium model)

---

**5. Performance przy dużej liczbie przepisów (scalability)**

Nie dyskutowano: co się dzieje gdy użytkownik ma 500+ przepisów?
- Lista przepisów może być wolna (large table rendering)
- Wyszukiwanie może być wolne (full scan w bazie danych)

**Rekomendacja:**
- Pagination lub infinite scroll dla listy przepisów (ładuj 20 naraz)
- Full-text search w PostgreSQL (GIN index na recipes.name)
- Lazy loading ingredientów (nie fetch all na liście, tylko on-demand w details view)
- Monitoring performance z Web Vitals: jeśli LCP >2.5s z dużą liczbą przepisów → optimize

---

**6. Backup i export danych użytkownika (GDPR compliance)**

Nie dyskutowano compliance z GDPR/RODO:
- Użytkownik ma prawo do exportu wszystkich swoich danych
- Użytkownik ma prawo do usunięcia konta (right to be forgotten)

**Rekomendacja dla MVP:**
- Funkcja "Usuń konto" w ustawieniach → cascade delete wszystkich danych użytkownika
- Post-MVP (przed publicznym launch w EU): funkcja "Eksportuj dane" → JSON/CSV ze wszystkimi przepisami, listami, planem posiłków

---

**7. Koszt AI kategoryzacji przy skali - ekonomia jednostkowa**

Założenie: $0.0001 za listę 10 składników. Ale:
- Przy 1000 użytkownikach generujących 5 list/miesiąc = 5000 list/miesiąc = $0.50/miesiąc (ok)
- Przy 10,000 użytkownikach = $5/miesiąc (ok)
- Przy 100,000 użytkowników = $50/miesiąc (ok)
- **Przy 1,000,000 użytkowników = $500/miesiąc (czy to sustainable w freemium model?)**

**Rekomendacja:**
- Monitor koszty OpenAI API miesięcznie
- Jeśli koszt >$100/miesiąc: rozważ optymalizacje
  - Cache AI results dla popularnych składników (np. "mleko" zawsze → "Nabiał")
  - Implementuj lokalny ML model dla najpopularniejszych 100 składników
  - Wprowadź limity: max 10 list/miesiąc dla darmowych użytkowników
- Jeśli koszt >$500/miesiąc: rozważ freemium model
  - Free tier: 5 list/miesiąc
  - Premium tier: unlimited lists za $2.99/miesiąc

---

</unresolved_issues>

</conversation_summary>

---

## Następne kroki

Dokument podsumowujący sesję planowania PRD został stworzony. Zawiera:
1. ✅ 30 podjętych decyzji projektowych (3 rundy)
2. ✅ 15 najistotniejszych dopasowanych rekomendacji
3. ✅ Szczegółowe podsumowanie z user stories, kryteriami sukcesu, architekturą techniczną
4. ✅ 7 nierozwiązanych kwestii wymagających dalszego wyjaśnienia lub monitorowania

**Projekt ShopMate MVP jest gotowy do przejścia do następnego etapu: szczegółowe tworzenie PRD z wireframes, API specifications, i rozpoczęcie implementacji według 6-tygodniowego harmonogramu.**
