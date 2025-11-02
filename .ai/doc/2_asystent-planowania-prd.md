# Asystent Planowania PRD - ShopMate MVP

## Wprowadzenie

Dokument zawiera 30 kluczowych pytań i rekomendacji, które zostały przeanalizowane w celu stworzenia kompleksowego Product Requirements Document (PRD) dla aplikacji ShopMate MVP. Proces został podzielony na 3 rundy: podstawy projektowe, szczegóły implementacji oraz technikalia.

---

## Runda 1 - Podstawowe decyzje projektowe

### 1. Automatyczne ekstrahowanie składników - szczegóły techniczne

**Pytanie:** Jakie dokładnie metody przewidujesz do automatycznego ekstrahowania składników z treści przepisu?

**Decyzja:** Strukturalny formularz dodawania przepisu z oddzielnymi polami: "Nazwa przepisu", "Składniki" (lista), "Instrukcje przygotowania". To zapewni 100% dokładność ekstrakcji składników i uprości implementację, zamiast celować w 80% dokładność automatycznego parsowania swobodnego tekstu.

---

### 2. Format składników - jednostki, ilości i standaryzacja

**Pytanie:** Jak system będzie przechowywał i agregował składniki?

**Decyzja:** Prosty model: składnik = nazwa + ilość jako tekst (bez automatycznej konwersji jednostek). System będzie agregował tylko składniki o identycznej nazwie i jednostce. Np. "500g mąki" + "500g mąki" = "1000g mąki", ale "2 łyżki masła" i "200g masła" będą osobnymi pozycjami. To zmniejsza złożoność MVP przy zachowaniu użyteczności.

---

### 3. Funkcjonalność drag-and-drop - priorytet dla MVP

**Pytanie:** Czy drag-and-drop jest kluczowy dla MVP?

**Decyzja:** Zrezygnuj z drag-and-drop i zaimplementuj prosty interfejs z przyciskiem "Przypisz przepis" przy każdej komórce kalendarza, który otwiera listę przepisów do wyboru. Drag-and-drop można dodać w wersji 1.1 jako enhancement UX, gdy podstawowa funkcjonalność będzie już działać i przetestowana.

---

### 4. System kont użytkowników - zakres funkcjonalności

**Pytanie:** Jakie funkcjonalności autoryzacji są wymagane w MVP?

**Decyzja:** Zaimplementuj tylko podstawową rejestrację (email + hasło) oraz logowanie z wykorzystaniem Supabase Auth. Dodaj funkcję resetowania hasła (to standard minimum). Weryfikację email można pominąć w MVP lub zrobić jako opcjonalną. Social login odłóż na późniejsze wersje zgodnie z dokumentem.

---

### 5. Edycja przepisów - brakująca funkcjonalność

**Pytanie:** Czy edycja przepisów wchodzi w zakres MVP?

**Decyzja:** Dodaj funkcjonalność edycji przepisów do MVP. Użytkownicy będą potrzebować możliwości poprawienia błędów lub zaktualizowania przepisów. To podstawowa operacja CRUD, której brak może znacząco pogorszyć UX i spowodować frustrację użytkowników.

---

### 6. Kalendarz tygodniowy - nawigacja między tygodniami

**Pytanie:** Jak użytkownik będzie planował przyszłe i przeglądał poprzednie tygodnie?

**Decyzja:** Zaimplementuj prosty widok kalendarza z przyciskami "Poprzedni tydzień" / "Następny tydzień" oraz "Bieżący tydzień". Przechowuj planowanie dla wszystkich tygodni w bazie danych. To zapewni podstawową funkcjonalność bez konieczności implementacji zaawansowanego widoku miesięcznego.

---

### 7. Lista zakupów - wielokrotne generowanie i wersjonowanie

**Pytanie:** Jak system będzie obsługiwał wielokrotne generowanie list zakupów?

**Decyzja:** Każde wygenerowanie listy zakupów tworzy nowy rekord w bazie danych z datą utworzenia. Użytkownik może edytować listę przed zapisem/eksportem (dodawać/usuwać pozycje), ale po zapisie lista jest niemutowalna (tylko do odczytu). Funkcję "checklist" podczas zakupów odłóż na wersję 1.0 - w MVP wystarczy PDF/TXT do pobrania.

---

### 8. Wyszukiwanie przepisów - zakres funkcjonalności "podstawowego wyszukiwania"

**Pytanie:** Co dokładnie obejmuje podstawowe wyszukiwanie w MVP?

**Decyzja:** Zaimplementuj tylko proste wyszukiwanie po nazwie przepisu (case-insensitive substring matching). Dodaj filtr alfabetyczny (A-Z) lub sortowanie (alfabetyczne, data dodania). Wyszukiwanie po składnikach odłóż na późniejsze wersje jako bardziej złożoną funkcjonalność.

---

### 9. Kryteria sukcesu - metodologia walidacji

**Pytanie:** Jak planujesz testować metryki sukcesu przed publicznym uruchomieniem?

**Decyzja:** Zaplanuj fazę User Acceptance Testing (UAT) z minimum 5-10 użytkownikami nietechnicznymi przed oficjalnym uruchomieniem MVP. Przygotuj krótką ankietę podsumowującą (SUS - System Usability Scale) oraz tracking kluczowych metryk w aplikacji (Google Analytics lub podobne). Dodaj prosty formularz feedbacku dostępny w aplikacji.

---

### 10. Model danych i relacje - szczegóły architektury

**Pytanie:** Jak będą wyglądać relacje w bazie danych?

**Decyzja:** Jeden przepis na komórkę kalendarza w MVP.

**Model bazy danych:**

```sql
users - tabela użytkowników (Supabase Auth)
recipes (id, user_id, name, instructions, created_at, updated_at)
ingredients (id, recipe_id, name, quantity, unit, sort_order)
meal_plan (id, user_id, date, meal_type, recipe_id) - jedna komórka = jeden przepis
shopping_lists (id, user_id, name, created_at)
shopping_list_items (id, shopping_list_id, ingredient_name, quantity, category, sort_order)
```

Składniki jako osobna tabela zapewnia łatwiejszą agregację przy generowaniu list zakupów, możliwość przyszłego wyszukiwania po składnikach i czystszą strukturę danych.

---

## Runda 2 - Szczegóły implementacji

### 11. Formularz składników - interfejs użytkownika

**Pytanie:** Jak dokładnie będzie wyglądał interfejs dodawania składników?

**Decyzja:** Zaimplementuj dynamiczną listę składników, gdzie każdy składnik to wiersz z trzema polami:

1. Ilość (pole numeryczne, opcjonalne)
2. Jednostka (pole tekstowe wolne, np. "g", "łyżka", "szczypta")
3. Nazwa (pole tekstowe, wymagane)

Przycisk "+ Dodaj składnik" dodaje nowy pusty wiersz. Ikonka "🗑️" przy każdym wierszu pozwala usunąć składnik. To daje elastyczność przy prostocie implementacji.

---

### 12. Agregacja składników - zasady łączenia

**Pytanie:** Jak dokładnie system będzie agregował składniki przy tworzeniu listy zakupów?

**Decyzja:** Normalizacja przed agregacją:

- Usuń wielokrotne spacje i trim
- Porównanie case-insensitive (ignore wielkość liter)
- Składniki bez ilości agreguj jako osobne pozycje z notką "do smaku" zamiast sumowania
- "mąka pszenna" ≠ "mąka" (porównanie całego ciągu)

Przykład: "200g mąki" + "200 G Mąki" = "400g mąki" (jeden wpis na liście zakupów)

---

### 13. Przepisy bez przypisania do kalendarza - dostępność w liście zakupów

**Pytanie:** Czy użytkownik może wygenerować listę zakupów na podstawie przepisów NIE przypisanych do kalendarza?

**Decyzja:** Zaimplementuj oba tryby w interfejsie generowania listy zakupów:

1. **Z kalendarza**: zaznacz dni/posiłki → generuj listę
2. **Z przepisów**: przejdź do listy przepisów, zaznacz checkboxy → generuj listę

To daje użytkownikom elastyczność bez komplikowania MVP.

---

### 14. Pusty kalendarz - obsługa komórek bez przepisu

**Pytanie:** Jak system ma się zachować przy pustych komórkach kalendarza?

**Decyzja:**

- Puste komórki są pomijane bez ostrzeżenia
- Jeśli użytkownik wybiera zakres (np. cały tydzień) i wszystkie komórki są puste, pokaż komunikat: "Brak przepisów w wybranym zakresie. Przypisz przepisy do kalendarza lub wygeneruj listę z wybranych przepisów."
- Jeśli przynajmniej jeden przepis jest wybrany, generuj listę normalnie

---

### 15. Eksport PDF/TXT - formatowanie i zawartość

**Pytanie:** Jak dokładnie będą sformatowane eksportowane listy zakupów?

**Decyzja:** Grupowanie w kategorie:

- Lista zakupów jest podzielona na kategorie produktów:
  - Nabiał
  - Warzywa
  - Owoce
  - Mięso
  - Pieczywo
  - Przyprawy
  - Inne
- Predefiniowana lista kategorii
- Jeśli AI przypisało błędną kategorię, użytkownik może ją ręcznie zmienić
- Podział robi AI

**PDF:**

- Nagłówek: "Lista zakupów - [data generowania]", opcjonalnie zakres dat jeśli z kalendarza
- Lista zagregowanych składników pogrupowana po kategoriach
- Każdy składnik z checkboxem (☐) do odznaczania podczas zakupów
- Stopka: "Wygenerowano przez ShopMate"

**TXT:**

- Prosty format linijka po linijce bez checkboxów
- To samo co PDF, ale bez formatowania

Podgląd przepisów źródłowych odłóż na wersję 1.0.

---

### 16. Responsywność - breakpointy i dostosowania mobilne

**Pytanie:** Jakie konkretne breakpointy dla urządzeń mobilnych?

**Decyzja:**

- **Desktop (≥1024px)**: klasyczny widok tabelaryczny 7 kolumn × 4 wiersze
- **Tablet (768-1023px)**: scrollowalny poziomo lub 3-4 dni naraz
- **Mobile (<768px)**: widok verticalny - dni jako sekcje accordion/expandable, każdy dzień pokazuje 4 posiłki jako listę

Priorytet: optymalizacja dla mobile-first, ponieważ użytkownicy często planują posiłki na smartfonach.

---

### 17. Edycja przepisu przypisanego do kalendarza - propagacja zmian

**Pytanie:** Co się dzieje, gdy użytkownik edytuje przepis przypisany do kalendarza?

**Decyzja:**

- Przepis to "master record" - edycja aktualizuje wszystkie przypisania w kalendarzu (live update)
- Pokaż informację w formularzu edycji: "ℹ️ Ten przepis jest przypisany do X posiłków w kalendarzu"
- **Wygenerowane listy zakupów pozostają niezmienione** (snapshot w momencie utworzenia) - użytkownik może wygenerować nową listę jeśli chce uwzględnić zmiany

---

### 18. Usuwanie przepisu - ochrona przed przypadkowym usunięciem

**Pytanie:** Jak chronić użytkownika przed przypadkowym usunięciem przepisu w kalendarzu?

**Decyzja:**

- **Soft delete z potwierdzeniem**: Pokaż dialog: "⚠️ Ten przepis jest przypisany do X posiłków. Usunięcie przepisu spowoduje usunięcie tych przypisań. Czy na pewno chcesz kontynuować?"
- Przyciski: "Anuluj" (domyślny) | "Usuń przepis i przypisania" (czerwony)
- Po usunięciu przepis znika z listy, a komórki kalendarza stają się puste

Opcjonalnie w przyszłości: możliwość przywrócenia (trash/recycle bin).

---

### 19. Stack technologiczny - frontend i tooling

**Pytanie:** Jakie dokładnie technologie będą użyte do budowy aplikacji?

**Decyzja - Zatwierdzony stack:**

- **Astro 5** - meta-framework z островами React
- **React 19** - komponenty interaktywne
- **TypeScript 5** - type safety
- **Tailwind CSS 4** - stylowanie
- **Shadcn/ui** - biblioteka komponentów UI
- **Supabase** - backend (auth + PostgreSQL)
- **Node.js** - runtime

**Dodatkowe narzędzia:**

- **jsPDF** lub **@react-pdf/renderer** - generowanie PDF
- **Zod** - walidacja formularzy
- **TanStack Query** - data fetching i cache (opcjonalne)

---

### 20. Harmonogram MVP - timeline i kamienie milowe

**Pytanie:** Jaki jest przewidywany harmonogram realizacji MVP?

**Decyzja - Zatwierdzony harmonogram (6-tygodniowy sprint):**

**Tydzień 1: Setup i Auth**

- Setup Astro 5 + React 19 + TypeScript + Tailwind CSS 4 + Shadcn/ui
- Konfiguracja Supabase (baza danych + auth)
- Implementacja rejestracji/logowania/reset hasła
- Podstawowy layout aplikacji z nawigacją

**Tydzień 2: CRUD Przepisów**

- Formularz dodawania przepisu (nazwa, składniki dynamiczna lista, instrukcje)
- Lista przepisów z wyszukiwaniem
- Edycja przepisów (z informacją o przypisaniach do kalendarza)
- Usuwanie przepisów (z potwierdzeniem jeśli w kalendarzu)

**Tydzień 3: Kalendarz tygodniowy**

- Widok kalendarza 7 dni × 4 posiłki (desktop)
- Przypisywanie przepisów do komórek (przycisk "Przypisz przepis")
- Nawigacja między tygodniami (Poprzedni/Następny/Bieżący)
- Responsywność - accordion na mobile

**Tydzień 4: Generowanie list zakupów + AI kategoryzacja**

- Wybór przepisów/dni do wygenerowania listy (oba tryby)
- Agregacja składników (normalizacja: trim, lowercase)
- **Integracja AI dla automatycznej kategoryzacji składników**
- Edycja listy przed zapisem (w tym ręczna zmiana kategorii)
- Eksport PDF (z kategoriami, checkboxami) i TXT

**Tydzień 5: Responsywność, UI polish i Feedback**

- Optymalizacja mobile (calendar accordion, formularze)
- Poprawki UX na podstawie wewnętrznych testów
- Formularz feedbacku w aplikacji
- Setup analytics (Google Analytics lub Plausible)
- Ankieta SUS dla UAT

**Tydzień 6: Testy i UAT → Launch**

- Testy wewnętrzne (wszystkie user flows)
- UAT z 5-10 użytkownikami nietechnicznymi
- Zbieranie feedbacku z ankiet
- Bug fixes i optymalizacje
- **Launch MVP** 🚀

**Uwagi:** AI kategoryzacja składników może wymagać dodatkowego czasu w Tygodniu 4 (integracja z API OpenAI/Claude). Jeśli okaże się zbyt czasochłonna, można ją odłożyć na wersję 1.1 i zacząć od ręcznej kategoryzacji.

---

## Runda 3 - Szczegóły techniczne, AI i edge cases

### 21. AI kategoryzacja - wybór modelu i API

**Pytanie:** Który model AI będzie używany do kategoryzacji składników?

**Decyzja:** **OpenAI GPT-4o mini** - najlepszy stosunek cena/jakość dla MVP:

- Koszt: ~$0.15 / 1M input tokens, ~$0.60 / 1M output tokens
- Szybkość: ~100-200ms latencja
- Dla 10 składników = ~500 tokenów input + 100 output = ~$0.0001 (praktycznie darmowe)
- API stabilne, dobrze udokumentowane

Fallback: jeśli API nie odpowiada → przypisz wszystko do kategorii "Inne" + pozwól użytkownikowi ręcznie poprawić.

---

### 22. AI prompt - struktura żądania kategoryzacji

**Pytanie:** Jak dokładnie będzie wyglądał prompt do AI dla kategoryzacji składników?

**Decyzja - Prompt template:**

### 23. AI timeout i retry logic - obsługa błędów

**Pytanie:** Co się dzieje gdy API AI nie odpowiada lub zwraca błąd?

**Decyzja:**

- **Timeout**: 10 sekund
- **Retry**: max 2 próby z exponential backoff (1s, 2s)
- **UX podczas ładowania**: Spinner + komunikat "Kategoryzuję składniki..."
- **Fallback przy błędzie**: Wszystkie składniki → kategoria "Inne" + toast notification: "⚠️ Automatyczna kategoryzacja niedostępna. Możesz ręcznie przypisać kategorie."
- **Użytkownik może edytować listę** podczas gdy AI pracuje w tle (optimistic UI)

---

### 24. Supabase Row Level Security (RLS) - polityki bezpieczeństwa

**Pytanie:** Jak zabezpieczyć dane użytkowników w Supabase?

**Decyzja - Polityki RLS dla każdej tabeli:**

```sql
-- recipes: użytkownik widzi tylko swoje przepisy
CREATE POLICY "Users can view own recipes"
  ON recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE
  USING (auth.uid() = user_id);
```

Analogiczne polityki dla: `ingredients`, `meal_plan`, `shopping_lists`, `shopping_list_items`.

**Error handling**: Jeśli użytkownik próbuje dostępu do cudzych danych → Supabase zwraca pustą tablicę (nie 403), więc nie trzeba specjalnego handlera.

---

### 25. Walidacja formularzy - reguły i komunikaty błędów

**Pytanie:** Jakie dokładnie reguły walidacji dla formularzy?

**Decyzja - Reguły walidacji (Zod schema):**

```typescript
const RecipeSchema = z.object({
  name: z.string().min(3, "Nazwa przepisu musi mieć min. 3 znaki").max(100, "Nazwa przepisu może mieć max. 100 znaków"),
  instructions: z
    .string()
    .min(10, "Instrukcje muszą mieć min. 10 znaków")
    .max(5000, "Instrukcje mogą mieć max. 5000 znaków"),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1, "Nazwa składnika jest wymagana"),
        quantity: z.number().optional(),
        unit: z.string().optional(),
      })
    )
    .min(1, "Przepis musi mieć przynajmniej 1 składnik"),
});
```

Komunikaty wyświetlane inline pod polami formularza (czerwony tekst).

---

### 26. Limity użytkowania - ochrona przed spamem

**Pytanie:** Czy są jakieś limity dla użytkowników w MVP?

**Decyzja dla MVP (bez płatnych planów):**

- **Bez limitów przepisów** - użytkownik może dodać ile chce
- **Max 50 składników na przepis** - sensowny limit praktyczny
- **Bez limitu list zakupów** - historia jest wartościowa
- **Rate limiting**: max 100 requestów/minutę na użytkownika (Supabase default wystarczy)

Monitoruj metryki podczas UAT - jeśli ktoś abuse'uje, można dodać limity w v1.1.

---

### 27. Obsługa offline - co działa bez internetu?

**Pytanie:** Czy aplikacja webowa ma jakąkolwiek funkcjonalność offline?

**Decyzja dla MVP:**

- **Bez offline support** - aplikacja wymaga połączenia
- **Graceful error handling**: Jeśli brak internetu → toast: "⚠️ Brak połączenia. Sprawdź internet i spróbuj ponownie."
- **PWA odłóż na v1.1** - dodatkowa złożoność niepotrzebna w MVP

Użytkownicy testowi mogą zgłosić potrzebę offline mode - wtedy priorytetyzuj w roadmapie.

---

### 28. Export PDF - biblioteka i szczegóły techniczne

**Pytanie:** Jak dokładnie generować PDF?

**Decyzja:**

- **Biblioteka: @react-pdf/renderer** - dedykowana dla React, deklaratywne komponenty
- **Generowanie: client-side** - brak kosztów serwera, szybsze dla użytkownika
- **Podgląd przed pobraniem**: Modal z preview PDF + przyciski "Pobierz" / "Anuluj"
- **Font**: standardowy (Helvetica) - bez custom fontów w MVP
- **Rozmiar**: A4, orientacja pionowa

Przykładowa struktura:

```tsx
<Document>
  <Page size="A4">
    <Text>Lista zakupów - {date}</Text>
    {categories.map((cat) => (
      <View>
        <Text>{cat.name}</Text>
        {cat.items.map((item) => (
          <Text>
            ☐ {item.quantity} {item.unit} {item.name}
          </Text>
        ))}
      </View>
    ))}
  </Page>
</Document>
```

---

### 29. Dostępność (a11y) - standardy WCAG

**Pytanie:** Jakie wymagania dostępności dla MVP?

**Decyzja - Podstawowa dostępność w MVP:**

- ✅ **Shadcn/ui** już ma wbudowane ARIA labels i keyboard navigation
- ✅ **Focus indicators** - domyślne Tailwind (ring-2 ring-offset-2)
- ✅ **Kontrast kolorów** - używaj palette Tailwind (spełnia WCAG AA)
- ✅ **Semantic HTML** - `<button>`, `<nav>`, `<main>`, `<form>` zamiast `<div>`
- ✅ **Alt text** dla wszystkich ikon/obrazów

**Testy**: Użyj Chrome Lighthouse (Accessibility audit) przed UAT → cel: min. 90/100 score.

---

### 30. Monitoring i error tracking - obserwabilność

**Pytanie:** Jak monitorować błędy i performance w produkcji?

**Decyzja dla MVP:**

- **Error tracking: Sentry** (darmowy tier: 5K errors/month - wystarczy dla MVP)
  - Auto-capture errors w React i API
  - Source maps dla stack traces
  - User context (email)

- **Analytics: Plausible** lub **Google Analytics 4**
  - Plausible: prosty, privacy-friendly, €9/mies (opcjonalne)
  - GA4: darmowy, bardziej złożony

- **Performance: Web Vitals** (built-in Astro)
  - Trackuj LCP, FID, CLS
  - Cel: LCP <2.5s, FID <100ms, CLS <0.1

**Session replay** (LogRocket/FullStory) - odłóż na v1.1, zbyt kosztowne dla MVP.

---

## 🎯 Finalne podsumowanie projektu ShopMate MVP

### Zakres projektu (30 decyzji z 3 rund)

**Runda 1 - Podstawy (pytania 1-10):**

- Strukturalny formularz przepisów z oddzielnymi polami
- Prosty model składników (nazwa + ilość jako tekst)
- Kalendarz tygodniowy bez drag-and-drop
- Supabase Auth (email + hasło + reset)
- Pełny CRUD przepisów (w tym edycja)
- Nawigacja między tygodniami
- Niemutowalne listy zakupów (snapshot)
- Wyszukiwanie po nazwie + sortowanie
- UAT z 5-10 użytkownikami
- Znormalizowana baza danych (1 przepis = 1 komórka)

**Runda 2 - Implementacja (pytania 11-20):**

- Dynamiczna lista składników (ilość, jednostka, nazwa)
- Normalizacja przy agregacji (trim, lowercase)
- Dwa tryby generowania list (kalendarz OR przepisy)
- Pomijanie pustych komórek
- **AI kategoryzacja składników** (kluczowa innowacja MVP)
- Responsywność (desktop tabela, mobile accordion)
- Live update przy edycji przepisu w kalendarzu
- Dialog potwierdzenia przed usunięciem przepisu w kalendarzu
- Stack: Astro 5 + React 19 + TS5 + Tailwind 4 + Shadcn/ui + Supabase
- Harmonogram: 6 tygodni do launch

**Runda 3 - Technikalia (pytania 21-30):**

- OpenAI GPT-4o mini dla AI kategoryzacji
- Batch processing + JSON response
- Timeout 10s, retry 2x, optimistic UI
- Supabase RLS na wszystkich tabelach
- Zod walidacja z polskimi błędami
- Bez limitów (poza 50 składników/przepis)
- Brak offline/PWA w MVP
- Client-side PDF z @react-pdf/renderer
- WCAG AA accessibility
- Sentry + analytics + Web Vitals

---

## Technologie

**Frontend:**

- Astro 5 (meta-framework)
- React 19 (interactive islands)
- TypeScript 5
- Tailwind CSS 4
- Shadcn/ui (komponenty)
- @react-pdf/renderer (PDF)
- Zod (walidacja)

**Backend:**

- Supabase (PostgreSQL + Auth + RLS)
- OpenAI API (GPT-4o mini)

**Infrastruktura:**

- Vercel/Netlify (hosting)
- Sentry (error tracking)
- Plausible/GA4 (analytics)

---

## Model bazy danych

```sql
-- Tabele
users (Supabase Auth)
recipes (id, user_id, name, instructions, created_at, updated_at)
ingredients (id, recipe_id, name, quantity, unit, sort_order)
meal_plan (id, user_id, date, meal_type, recipe_id)
shopping_lists (id, user_id, name, created_at)
shopping_list_items (id, shopping_list_id, ingredient_name, quantity, category, sort_order)

-- Kategorie składników (AI)
Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne
```

---

## Harmonogram (6 tygodni)

| Tydzień | Zadania                                                |
| ------- | ------------------------------------------------------ |
| **1**   | Setup + Auth (Astro/Supabase/rejestracja/logowanie)    |
| **2**   | CRUD Przepisów (formularz/lista/edycja/usuwanie)       |
| **3**   | Kalendarz tygodniowy (widok/przypisywanie/nawigacja)   |
| **4**   | Listy zakupów + AI kategoryzacja (generowanie/PDF/TXT) |
| **5**   | Responsywność + UI polish + feedback + analytics       |
| **6**   | Testy + UAT + bug fixes → **LAUNCH MVP** 🚀            |

---

## Kryteria sukcesu

**Funkcjonalność:**

- ✅ Użytkownik może utworzyć konto i dodać 5+ przepisów
- ✅ AI kategoryzuje składniki z >80% dokładnością
- ✅ Lista zakupów generowana w <3s
- ✅ PDF czytelny na wszystkich urządzeniach

**UX:**

- ✅ Nowy użytkownik planuje tydzień w <10 minut
- ✅ Wszystkie akcje w ≤3 kliknięcia
- ✅ Płynność na mobile i desktop

**Techniczne:**

- ✅ Brak krytycznych błędów
- ✅ Czas ładowania <2s
- ✅ Responsywność od 320px
- ✅ Bezpieczne dane (RLS)

**Biznesowe:**

- ✅ 10 użytkowników testowych potwierdza wartość
- ✅ Ankiety pokazują rozwiązanie głównego problemu
- ✅ MVP gotowe do skalowania

---

## Kluczowe innowacje MVP

### 1. AI Kategoryzacja Składników

Automatyczne grupowanie składników w kategorie (Nabiał, Warzywa, Owoce, Mięso, Pieczywo, Przyprawy, Inne) przy generowaniu listy zakupów, z możliwością ręcznej edycji przez użytkownika.

### 2. Dwa Tryby Generowania List

Elastyczność w tworzeniu list zakupów - zarówno z kalendarza tygodniowego jak i bezpośredniego wyboru przepisów.

### 3. Niemutowalne Listy Zakupów

Historia list jako snapshot w momencie utworzenia - użytkownik może zawsze wrócić do poprzednich list i zobaczyć co kupował.

---

## Następne kroki po MVP

Po udanym launch MVP i zebraniu feedbacku od użytkowników, rozważ implementację następujących funkcji w wersji 1.1:

**Wysokopriorytowe:**

- Import przepisów z pliku (JPG, PDF, DOCX) z OCR
- Szablony tygodniowe (zapisz i ponownie użyj planów posiłków)
- Kategoryzacja składników w liście według działów sklepowych
- PWA i podstawowe wsparcie offline
- Drag-and-drop w kalendarzu

**Średniopriorytowe:**

- Obsługa wielu przepisów na jedną komórkę kalendarza
- Filtrowanie przepisów po składnikach
- Tagi i kategorie przepisów
- Planowanie na wiele tygodni naprzód
- OAuth (Google/Facebook login)

**Długoterminowe:**

- Udostępnianie przepisów między użytkownikami
- Integracje z zewnętrznymi serwisami zakupowymi
- Obsługa diet i alergii
- Aplikacje mobilne natywne (iOS, Android)
- Analityka i raporty użytkowania

---

**Wszystkie decyzje projektowe zostały sfinalizowane. Projekt gotowy do realizacji! 🎉**
