# Plan implementacji widoku Landing Page

## 1. Przegląd

Landing Page jest główną stroną marketingową aplikacji ShopMate, dostępną dla niezalogowanych użytkowników. Jej głównym celem jest przekonanie potencjalnych użytkowników do rejestracji poprzez jasną komunikację wartości produktu (value proposition) oraz prezentację kluczowych funkcji.

**Główne cele widoku:**

- Komunikacja value proposition: "Zaplanuj posiłki, wygeneruj listę zakupów w 10 minut"
- Prezentacja 3 głównych funkcji: kalendarz tygodniowy, AI kategoryzacja składników, eksport PDF
- Wyjaśnienie procesu korzystania z aplikacji w 3 krokach
- Prowadzenie użytkownika do rejestracji poprzez Call-to-Action (CTA)

**Charakterystyka techniczna:**

- Widok publiczny (brak wymaganej autoryzacji)
- Strona statyczna zbudowana w Astro (bez potrzeby React dla interaktywności)
- Brak integracji z API
- Brak zarządzania stanem
- Responsywny design (mobile-first)
- Zgodność z WCAG AA

## 2. Routing widoku

**Ścieżka:** `/` (root path)

**Typ strony:** Publiczna (dostępna dla wszystkich użytkowników)

**Konfiguracja routingu:**

- Plik: `src/pages/index.astro`
- Brak ochrony middleware (publiczny dostęp)
- Możliwe przekierowanie zalogowanych użytkowników do `/dashboard` (opcjonalne)

**SEO considerations:**

- Meta title: "ShopMate - Planuj posiłki i generuj listy zakupów w 10 minut"
- Meta description: "Aplikacja do planowania posiłków i automatycznego generowania list zakupów. Kalendarz tygodniowy, AI kategoryzacja składników, eksport do PDF."
- Open Graph tags dla social sharing
- Canonical URL: `https://shopmate.app/`

## 3. Struktura komponentów

Landing Page składa się z następującej hierarchii komponentów:

```
src/pages/index.astro
├── Layout: PublicLayout.astro (opcjonalnie)
│   ├── <head> - meta tags, title, SEO
│   └── <header> - nawigacja (logo, link "Zaloguj się")
└── <main>
    ├── HeroSection.astro
    │   ├── Headline (h1)
    │   ├── Subheadline (p)
    │   └── CTA Button
    ├── FeaturesSection.astro
    │   └── FeatureCard.astro (× 3)
    │       ├── Icon (SVG/Lucide)
    │       ├── Title (h3)
    │       └── Description (p)
    ├── HowItWorksSection.astro
    │   └── StepCard.astro (× 3)
    │       ├── Step Number
    │       ├── Title (h3)
    │       └── Description (p)
    ├── CTASection.astro
    │   ├── Heading (h2)
    │   └── CTA Button
    └── Footer.astro
        ├── Navigation Links
        └── Copyright Notice
```

**Podział odpowiedzialności:**

- `index.astro` - główna strona, kompozycja wszystkich sekcji
- `PublicLayout.astro` - layout dla stron publicznych (header, footer, meta tags)
- Komponenty sekcji (.astro) - poszczególne sekcje landing page
- Komponenty pomocnicze (FeatureCard, StepCard) - reużywalne karty

## 4. Szczegóły komponentów

### 4.1 PublicLayout.astro

**Opis komponentu:**
Layout dla stron publicznych (landing page, login, register). Zawiera wspólne elementy: `<head>` z meta tags, header z nawigacją, oraz slot dla contentu strony.

**Główne elementy:**

- `<head>` - meta tags, title, favicon, Open Graph tags
- `<header>` - logo ShopMate, link "Zaloguj się" (prowadzi do `/login`)
- `<slot>` - miejsce na content strony
- Opcjonalnie: `<Footer>` jeśli ma być wspólny dla wszystkich stron publicznych

**Obsługiwane zdarzenia:**

- Kliknięcie linku "Zaloguj się" → nawigacja do `/login`

**Warunki walidacji:**

- Brak (statyczny layout)

**Typy:**

```typescript
interface Props {
  title: string;
  description: string;
  ogImage?: string;
}
```

**Propsy:**

- `title` (string, wymagany) - tytuł strony dla `<title>` i meta tags
- `description` (string, wymagany) - opis dla meta description i OG tags
- `ogImage` (string, opcjonalny) - URL obrazu dla Open Graph

**Lokalizacja:** `src/layouts/PublicLayout.astro`

---

### 4.2 HeroSection.astro

**Opis komponentu:**
Główna sekcja landing page (hero) zawierająca headline, subheadline i główny Call-to-Action button. Sekcja musi być widoczna "above the fold" (bez scrollowania).

**Główne elementy:**

- `<section>` z semantic HTML
- `<h1>` - headline: "Zaplanuj posiłki, wygeneruj listę zakupów w 10 minut"
- `<p>` - subheadline: krótki opis wartości aplikacji
- `<a>` lub `<Button>` - CTA "Rozpocznij za darmo" prowadzący do `/register`
- Opcjonalnie: ilustracja/obrazek (hero image)

**Obsługiwane zdarzenia:**

- Kliknięcie CTA button → nawigacja do `/register`

**Warunki walidacji:**

- Brak (statyczny content)

**Typy:**

- Brak (wszystkie dane hardcoded w komponencie)

**Propsy:**

- Brak (self-contained komponent)

**Wymagania stylowania:**

- Hero section: `min-h-screen` lub `min-h-[600px]` aby CTA był above the fold
- Responsywność: single column na mobile, może 2-column (text + image) na desktop
- CTA button: minimum 44px wysokości (touch-friendly)
- Tailwind classes: gradient background, centrowanie, spacing

**Lokalizacja:** `src/components/landing/HeroSection.astro`

---

### 4.3 FeaturesSection.astro

**Opis komponentu:**
Sekcja prezentująca 3 główne funkcje aplikacji ShopMate: kalendarz tygodniowy, AI kategoryzacja składników, eksport do PDF. Każda funkcja prezentowana jako karta z ikoną, tytułem i opisem.

**Główne elementy:**

- `<section>` z semantic HTML
- `<h2>` - nagłówek sekcji: "Kluczowe funkcje"
- Grid container z 3 kartami `<FeatureCard>`
- Każda karta:
  - Ikona (SVG/Lucide icon)
  - Tytuł funkcji (h3)
  - Opis funkcji (p)

**Obsługiwane zdarzenia:**

- Brak (statyczna prezentacja)

**Warunki walidacji:**

- Brak

**Typy:**

```typescript
// Opcjonalnie w src/lib/landing-page-content.ts
interface Feature {
  icon: string; // nazwa ikony z Lucide: 'Calendar', 'Sparkles', 'FileText'
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: "Calendar",
    title: "Kalendarz tygodniowy",
    description: "Planuj posiłki na cały tydzień w przejrzystym kalendarzu...",
  },
  // ...
];
```

**Propsy:**

- Opcjonalnie: `features: Feature[]` jeśli dane przekazywane z zewnątrz
- Domyślnie: dane hardcoded w komponencie

**Wymagania stylowania:**

- Grid layout: `grid-cols-1 md:grid-cols-3 gap-8`
- Karty: padding, border, rounded corners, shadow (Tailwind)
- Ikony: size około 48px, kolor accent (primary color)
- Responsywność: 1 kolumna na mobile, 3 kolumny na desktop

**Lokalizacja:** `src/components/landing/FeaturesSection.astro`

---

### 4.4 FeatureCard.astro

**Opis komponentu:**
Reużywalna karta prezentująca pojedynczą funkcję aplikacji. Zawiera ikonę, tytuł i opis.

**Główne elementy:**

- `<div>` - container karty
- `<Icon>` - ikona z Lucide (import z 'lucide-astro')
- `<h3>` - tytuł funkcji
- `<p>` - opis funkcji

**Obsługiwane zdarzenia:**

- Brak

**Warunki walidacji:**

- Brak

**Typy:**

```typescript
interface Props {
  icon: string;
  title: string;
  description: string;
}
```

**Propsy:**

- `icon` (string, wymagany) - nazwa ikony z Lucide
- `title` (string, wymagany) - tytuł funkcji
- `description` (string, wymagany) - opis funkcji

**Wymagania stylowania:**

- Padding: `p-6`
- Border: `border border-gray-200`
- Rounded: `rounded-lg`
- Shadow: `shadow-md hover:shadow-lg` (subtle hover effect)
- Text alignment: centrowany lub left-aligned
- Ikona: `size-12 text-primary`

**Lokalizacja:** `src/components/landing/FeatureCard.astro`

---

### 4.5 HowItWorksSection.astro

**Opis komponentu:**
Sekcja wyjaśniająca proces korzystania z aplikacji w 3 prostych krokach: Dodaj przepisy → Planuj w kalendarzu → Generuj listę zakupów.

**Główne elementy:**

- `<section>` z semantic HTML
- `<h2>` - nagłówek sekcji: "Jak to działa?"
- Container z 3 kartami kroków `<StepCard>`
- Każda karta:
  - Numer kroku (1, 2, 3)
  - Tytuł kroku
  - Opis kroku

**Obsługiwane zdarzenia:**

- Brak (statyczna prezentacja)

**Warunki walidacji:**

- Brak

**Typy:**

```typescript
interface Step {
  stepNumber: number;
  title: string;
  description: string;
}

const steps: Step[] = [
  { stepNumber: 1, title: "Dodaj przepisy", description: "..." },
  { stepNumber: 2, title: "Planuj w kalendarzu", description: "..." },
  { stepNumber: 3, title: "Generuj listę zakupów", description: "..." },
];
```

**Propsy:**

- Opcjonalnie: `steps: Step[]`
- Domyślnie: dane hardcoded

**Wymagania stylowania:**

- Grid/Flex layout: `grid-cols-1 md:grid-cols-3 gap-8`
- Wizualne połączenie między krokami (strzałki/linie) na desktop - opcjonalnie
- Responsywność: vertical stacking na mobile, horizontal na desktop

**Lokalizacja:** `src/components/landing/HowItWorksSection.astro`

---

### 4.6 StepCard.astro

**Opis komponentu:**
Karta prezentująca pojedynczy krok w procesie korzystania z aplikacji.

**Główne elementy:**

- `<div>` - container karty
- `<span>` lub `<div>` - numer kroku (1, 2, 3) w stylizowanym badge/circle
- `<h3>` - tytuł kroku
- `<p>` - opis kroku

**Obsługiwane zdarzenia:**

- Brak

**Warunki walidacji:**

- Brak

**Typy:**

```typescript
interface Props {
  stepNumber: number;
  title: string;
  description: string;
}
```

**Propsy:**

- `stepNumber` (number, wymagany) - numer kroku (1-3)
- `title` (string, wymagany) - tytuł kroku
- `description` (string, wymagany) - opis kroku

**Wymagania stylowania:**

- Step number: duży, bold, w kółku/badge (np. `w-12 h-12 rounded-full bg-primary text-white`)
- Padding, spacing
- Text alignment: centrowany lub left-aligned

**Lokalizacja:** `src/components/landing/StepCard.astro`

---

### 4.7 CTASection.astro

**Opis komponentu:**
Finalna sekcja Call-to-Action przed footer, zachęcająca użytkownika do rejestracji.

**Główne elementy:**

- `<section>` z semantic HTML
- `<h2>` - nagłówek: "Gotowy na rozpoczęcie?" lub podobny
- `<p>` - opcjonalny dodatkowy tekst zachęcający
- `<a>` lub `<Button>` - CTA "Rozpocznij za darmo" prowadzący do `/register`

**Obsługiwane zdarzenia:**

- Kliknięcie CTA button → nawigacja do `/register`

**Warunki walidacji:**

- Brak

**Typy:**

- Brak

**Propsy:**

- Brak

**Wymagania stylowania:**

- Wyróżniające się tło (np. gradient, kolor primary)
- Centrowany tekst i button
- Padding: `py-16` lub `py-20`
- CTA button: duży, wyraźny (primary color, min 44px wysokość)

**Lokalizacja:** `src/components/landing/CTASection.astro`

---

### 4.8 Footer.astro

**Opis komponentu:**
Footer landing page z linkami nawigacyjnymi i informacją copyright.

**Główne elementy:**

- `<footer>` z semantic HTML
- `<nav>` - nawigacja z linkami (np. O nas, Kontakt, Privacy Policy, Terms)
- `<p>` - copyright notice: "© 2025 ShopMate. Wszelkie prawa zastrzeżone."

**Obsługiwane zdarzenia:**

- Kliknięcie linków → nawigacja do odpowiednich stron (jeśli istnieją)

**Warunki walidacji:**

- Brak

**Typy:**

```typescript
interface FooterLink {
  href: string;
  label: string;
}

const footerLinks: FooterLink[] = [
  { href: "/about", label: "O nas" },
  { href: "/contact", label: "Kontakt" },
  { href: "/privacy", label: "Polityka prywatności" },
  { href: "/terms", label: "Regulamin" },
];
```

**Propsy:**

- Opcjonalnie: `links: FooterLink[]`
- Domyślnie: dane hardcoded

**Wymagania stylowania:**

- Background: dark color (gray-900 lub primary dark)
- Text color: light (gray-300, white)
- Padding: `py-8` lub `py-12`
- Links: horizontal na desktop, vertical/stacked na mobile
- Spacing między linkami
- Hover states dla linków

**Lokalizacja:** `src/components/landing/Footer.astro` lub `src/components/Footer.astro` (jeśli współdzielony)

---

## 5. Typy

Landing Page nie wymaga złożonych typów DTO ponieważ jest stroną statyczną bez integracji z API. Wszystkie typy są proste interfejsy dla props komponentów.

**Lokalizacja:** Typy mogą być definiowane inline w każdym komponencie lub w osobnym pliku `src/lib/landing-page-content.ts`

```typescript
// src/lib/landing-page-content.ts

/**
 * Typ dla pojedynczej funkcji aplikacji (Features section)
 */
export interface Feature {
  icon: string; // Nazwa ikony z Lucide (np. 'Calendar', 'Sparkles', 'FileText')
  title: string;
  description: string;
}

/**
 * Typ dla pojedynczego kroku (How It Works section)
 */
export interface Step {
  stepNumber: number; // 1, 2, 3
  title: string;
  description: string;
}

/**
 * Typ dla linku w footer
 */
export interface FooterLink {
  href: string;
  label: string;
}

/**
 * Content dla Features section
 */
export const features: Feature[] = [
  {
    icon: "Calendar",
    title: "Kalendarz tygodniowy",
    description:
      "Planuj posiłki na cały tydzień w przejrzystym kalendarzu. Przypisuj przepisy do poszczególnych dni i posiłków.",
  },
  {
    icon: "Sparkles",
    title: "AI kategoryzacja",
    description:
      "Automatyczna kategoryzacja składników dzięki sztucznej inteligencji. Lista zakupów uporządkowana według działów sklepowych.",
  },
  {
    icon: "FileText",
    title: "Eksport do PDF",
    description: "Eksportuj listy zakupów do PDF lub TXT. Gotowa lista na telefonie podczas zakupów.",
  },
];

/**
 * Content dla How It Works section
 */
export const steps: Step[] = [
  {
    stepNumber: 1,
    title: "Dodaj przepisy",
    description: "Wprowadź swoje ulubione przepisy ze składnikami do aplikacji.",
  },
  {
    stepNumber: 2,
    title: "Planuj w kalendarzu",
    description: "Przypisz przepisy do dni tygodnia i posiłków w kalendarzu.",
  },
  {
    stepNumber: 3,
    title: "Generuj listę zakupów",
    description: "Wygeneruj automatycznie zagregowaną listę zakupów i eksportuj do PDF.",
  },
];

/**
 * Linki w footer
 */
export const footerLinks: FooterLink[] = [
  { href: "/about", label: "O nas" },
  { href: "/contact", label: "Kontakt" },
  { href: "/privacy", label: "Polityka prywatności" },
  { href: "/terms", label: "Regulamin" },
];
```

**Uwagi:**

- Typy są opcjonalne - można hardcodować content bezpośrednio w komponentach
- Wydzielenie contentu do osobnego pliku ułatwia późniejsze tłumaczenia (i18n)
- Wszystkie stringi są w języku polskim zgodnie z wymaganiami MVP

## 6. Zarządzanie stanem

Landing Page jest stroną statyczną bez potrzeby zarządzania stanem.

**Brak zarządzania stanem:**

- Wszystkie dane są hardcoded lub zdefiniowane jako stałe
- Brak formularzy wymagających state
- Brak wywołań API
- Brak interakcji wymagających React state

**Możliwe rozszerzenia (post-MVP):**

- Animacje przy scrollowaniu (Intersection Observer) - może wymagać minimalnego state
- Newsletter signup form - wymagałby prostego state dla email input i loading state
- A/B testing różnych wersji hero headline - wymagałby state dla wybranej wersji

**Custom hooki:**

- Brak potrzeby custom hooków dla MVP
- Ewentualnie post-MVP: `useScrollAnimation` dla animacji przy scrollowaniu

## 7. Integracja API

Landing Page nie wymaga integracji z API.

**Brak wywołań API:**

- Strona jest całkowicie statyczna
- Wszystkie dane są hardcoded w komponentach lub importowane z plików content
- Brak autoryzacji (publiczny widok)
- Brak ładowania danych z backendu

**Możliwe rozszerzenia (post-MVP):**

- Newsletter signup endpoint: `POST /api/newsletter` - wymaga dodania formularza i integracji
- Analytics tracking: Google Analytics / Plausible - może być dodane przez tag w `<head>`

## 8. Interakcje użytkownika

Landing Page wspiera następujące interakcje:

### 8.1 Kliknięcie CTA "Rozpocznij za darmo" w HeroSection

**Trigger:** Kliknięcie przycisku CTA w hero section

**Akcja:**

- Nawigacja do `/register`
- Użycie `<a>` tag z `href="/register"` (standard Astro navigation)
- Opcjonalnie: tracking wydarzenia w analytics (np. GA event: "cta_hero_click")

**Oczekiwany rezultat:**

- Przekierowanie do strony rejestracji
- Płynna transycja (jeśli używamy Astro View Transitions)

**Implementacja:**

```astro
<a
  href="/register"
  class="inline-flex items-center justify-center px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors min-h-[44px]"
>
  Rozpocznij za darmo
</a>
```

---

### 8.2 Kliknięcie CTA w CTASection

**Trigger:** Kliknięcie przycisku CTA w final CTA section

**Akcja:**

- Nawigacja do `/register`
- Identyczna implementacja jak CTA w hero
- Możliwe inne tracking event (np. "cta_final_click")

**Oczekiwany rezultat:**

- Przekierowanie do strony rejestracji

---

### 8.3 Kliknięcie "Zaloguj się" w header

**Trigger:** Kliknięcie linku "Zaloguj się" w nawigacji

**Akcja:**

- Nawigacja do `/login`

**Oczekiwany rezultat:**

- Przekierowanie do strony logowania

**Implementacja:**

```astro
<a href="/login" class="text-gray-700 hover:text-primary transition-colors"> Zaloguj się </a>
```

---

### 8.4 Kliknięcie linków w Footer

**Trigger:** Kliknięcie na link w footer (np. "Polityka prywatności")

**Akcja:**

- Nawigacja do odpowiedniej strony (jeśli istnieje)
- Jeśli strona nie istnieje (MVP): może prowadzić do 404 lub być disabled

**Oczekiwany rezultat:**

- Przekierowanie do odpowiedniej strony

**Uwaga dla MVP:**

- Strony jak "O nas", "Polityka prywatności", "Regulamin" mogą nie istnieć w MVP
- Opcje:
  1. Usunąć linki w MVP
  2. Dodać placeholder pages
  3. Linki prowadzą do sekcji contact (email: contact@shopmate.app)

---

### 8.5 Scrollowanie strony

**Trigger:** Użytkownik scrolluje stronę w dół/górę

**Akcja:**

- Płynne przewijanie (smooth scroll)
- Możliwe animacje fade-in dla sekcji przy pojawianiu się w viewport (opcjonalne)

**Oczekiwany rezultat:**

- Płynne UX bez skoków
- Sekcje mogą płynnie pojawiać się (fade-in) przy scrollowaniu

**Implementacja:**

- CSS: `scroll-behavior: smooth;` w `<html>`
- Animacje: Tailwind + Intersection Observer (opcjonalne dla MVP)

---

## 9. Warunki i walidacja

Landing Page jest stroną statyczną bez formularzy, więc nie wymaga walidacji danych wejściowych.

**Brak warunków walidacji:**

- Brak formularzy (wszystkie CTA to linki nawigacyjne)
- Brak input fields
- Brak user-generated content

**Warunki wpływające na UI:**

- Brak warunków - wszystkie sekcje są zawsze widoczne
- Ewentualnie (post-MVP): warunkowe wyświetlanie sekcji testimonials jeśli dostępne

**Accessibility walidacja:**
Chociaż brak walidacji danych, należy zapewnić:

- Alt text dla wszystkich obrazów i ikon (WCAG AA)
- Semantic HTML (proper heading hierarchy: h1 → h2 → h3)
- Keyboard navigation działa poprawnie
- Focus indicators są widoczne
- Color contrast spełnia WCAG AA (minimum 4.5:1 dla tekstu)
- CTA buttons mają minimum 44px wysokości (touch-friendly)

## 10. Obsługa błędów

Landing Page jako strona statyczna ma minimalne ryzyko błędów. Poniżej scenariusze błędów i ich obsługa:

### 10.1 Błąd ładowania strony (500 Error)

**Scenariusz:** Server nie może zrenderować strony Astro (rzadkie, ale możliwe)

**Obsługa:**

- Astro defaultowy error page
- Ewentualnie custom 500 error page: `src/pages/500.astro`
- Monitoring: Sentry error tracking dla server-side errors

**Wyświetlany komunikat:**

- "Coś poszło nie tak. Spróbuj odświeżyć stronę."
- Link do strony głównej

---

### 10.2 Brak połączenia z internetem (Network Error)

**Scenariusz:** Użytkownik offline próbuje załadować stronę

**Obsługa:**

- Browser default error page: "Brak połączenia z internetem"
- MVP: brak custom obsługi (no offline support)
- Post-MVP: PWA z offline fallback page

---

### 10.3 Złamany link (404 Error)

**Scenariusz:** Użytkownik klika link w footer prowadzący do nieistniejącej strony (np. `/privacy`)

**Obsługa:**

- Custom 404 page: `src/pages/404.astro`
- Komunikat: "Strona nie została znaleziona"
- Link powrotu do landing page: "Wróć do strony głównej"

**Implementacja 404 page:**

```astro
---
// src/pages/404.astro
import PublicLayout from "@/layouts/PublicLayout.astro";
---

<PublicLayout title="Strona nie znaleziona - ShopMate" description="Strona nie istnieje">
  <main class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gray-900">404</h1>
      <p class="text-xl text-gray-600 mt-4">Strona nie została znaleziona</p>
      <a href="/" class="mt-8 inline-block px-6 py-3 bg-primary text-white rounded-lg"> Wróć do strony głównej </a>
    </div>
  </main>
</PublicLayout>
```

---

### 10.4 Błędy JavaScript (Client-side)

**Scenariusz:** JavaScript error w browser (np. starszy browser bez wsparcia dla modern JS)

**Obsługa:**

- Graceful degradation: strona powinna działać bez JS (pure HTML/CSS)
- Astro generuje static HTML więc core functionality (nawigacja) działa bez JS
- Error boundary (opcjonalnie): Sentry client-side error tracking

**Uwaga:**

- Landing Page nie wymaga JS do funkcjonowania (tylko HTML/CSS)
- Ewentualne animacje/transitions są enhancement, nie requirement

---

### 10.5 Slow loading / Performance issues

**Scenariusz:** Strona ładuje się wolno (słabe połączenie, slow server)

**Obsługa:**

- Optymalizacja: Lighthouse performance score ≥90
- Image optimization: Astro Image component dla obrazów
- Lazy loading: obrazy poniżej fold
- Loading skeletons: nie dotyczy static page (instant render)

**Monitoring:**

- Web Vitals tracking (LCP, FID, CLS)
- Target: LCP <2.5s, FID <100ms, CLS <0.1

---

## 11. Kroki implementacji

Poniżej szczegółowy przewodnik krok po kroku implementacji Landing Page:

### Krok 1: Utworzenie struktury plików

**Akcje:**

1. Utworzyć folder `src/components/landing/` dla komponentów Landing Page
2. Utworzyć plik `src/pages/index.astro` (główna strona)
3. Utworzyć plik `src/layouts/PublicLayout.astro` (layout)
4. Utworzyć plik `src/lib/landing-page-content.ts` (content data - opcjonalnie)

**Struktura plików:**

```
src/
├── pages/
│   ├── index.astro
│   └── 404.astro
├── layouts/
│   └── PublicLayout.astro
├── components/
│   ├── landing/
│   │   ├── HeroSection.astro
│   │   ├── FeaturesSection.astro
│   │   ├── FeatureCard.astro
│   │   ├── HowItWorksSection.astro
│   │   ├── StepCard.astro
│   │   └── CTASection.astro
│   └── Footer.astro
└── lib/
    └── landing-page-content.ts
```

---

### Krok 2: Implementacja PublicLayout.astro

**Akcje:**

1. Utworzyć plik `src/layouts/PublicLayout.astro`
2. Dodać `<head>` z meta tags (title, description, OG tags)
3. Dodać `<header>` z logo i linkiem "Zaloguj się"
4. Dodać `<slot>` dla contentu strony
5. Dodać Tailwind base styles

**Przykładowa implementacja:**

```astro
---
// src/layouts/PublicLayout.astro
import "@/styles/globals.css";

interface Props {
  title: string;
  description: string;
  ogImage?: string;
}

const { title, description, ogImage = "/og-image.png" } = Astro.props;
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
---

<!doctype html>
<html lang="pl" class="scroll-smooth">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="generator" content={Astro.generator} />

    <!-- Primary Meta Tags -->
    <title>{title}</title>
    <meta name="title" content={title} />
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalURL} />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonicalURL} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={new URL(ogImage, Astro.site)} />

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content={canonicalURL} />
    <meta property="twitter:title" content={title} />
    <meta property="twitter:description" content={description} />
    <meta property="twitter:image" content={new URL(ogImage, Astro.site)} />
  </head>
  <body class="min-h-screen bg-white">
    <header class="border-b border-gray-200">
      <nav class="container mx-auto px-4 py-4 flex justify-between items-center">
        <a href="/" class="text-2xl font-bold text-primary">ShopMate</a>
        <a href="/login" class="text-gray-700 hover:text-primary transition-colors"> Zaloguj się </a>
      </nav>
    </header>

    <slot />
  </body>
</html>
```

---

### Krok 3: Implementacja content data (opcjonalnie)

**Akcje:**

1. Utworzyć plik `src/lib/landing-page-content.ts`
2. Zdefiniować interfejsy: `Feature`, `Step`, `FooterLink`
3. Zdefiniować dane dla features, steps, footer links

**Implementacja:** (patrz sekcja 5. Typy)

---

### Krok 4: Implementacja HeroSection.astro

**Akcje:**

1. Utworzyć plik `src/components/landing/HeroSection.astro`
2. Dodać `<section>` z semantic HTML
3. Dodać headline (h1), subheadline (p), CTA button
4. Stylować z Tailwind (gradient background, centrowanie, spacing)
5. Zapewnić min-h-screen lub min-h-[600px] dla above the fold

**Przykładowa implementacja:**

```astro
---
// src/components/landing/HeroSection.astro
---

<section class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
  <div class="max-w-4xl mx-auto text-center">
    <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
      Zaplanuj posiłki, wygeneruj listę zakupów w 10 minut
    </h1>
    <p class="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
      Aplikacja do planowania posiłków i automatycznego generowania list zakupów. Oszczędzaj czas i redukuj
      marnotrawstwo żywności.
    </p>
    <a
      href="/register"
      class="inline-flex items-center justify-center px-8 py-4 bg-primary text-white text-lg font-semibold rounded-lg hover:bg-primary-dark transition-colors shadow-lg hover:shadow-xl min-h-[44px]"
    >
      Rozpocznij za darmo
    </a>
  </div>
</section>
```

---

### Krok 5: Implementacja FeatureCard.astro

**Akcje:**

1. Utworzyć plik `src/components/landing/FeatureCard.astro`
2. Zdefiniować Props interface (icon, title, description)
3. Dodać strukturę HTML (container, icon, title, description)
4. Stylować z Tailwind (padding, border, shadow)

**Przykładowa implementacja:**

```astro
---
// src/components/landing/FeatureCard.astro
import { Icon } from "lucide-astro";

interface Props {
  icon: string;
  title: string;
  description: string;
}

const { icon, title, description } = Astro.props;
---

<div class="p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow">
  <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
    <Icon name={icon} class="w-6 h-6 text-primary" />
  </div>
  <h3 class="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
  <p class="text-gray-600">{description}</p>
</div>
```

**Uwaga:** Zastąpić `lucide-astro` właściwą biblioteką ikon (może być `lucide-react` z client:load lub SVG inline)

---

### Krok 6: Implementacja FeaturesSection.astro

**Akcje:**

1. Utworzyć plik `src/components/landing/FeaturesSection.astro`
2. Zaimportować `FeatureCard` i dane features (z content file lub inline)
3. Dodać grid layout z 3 kartami
4. Stylować responsywnie (1 kolumna mobile, 3 kolumny desktop)

**Przykładowa implementacja:**

```astro
---
// src/components/landing/FeaturesSection.astro
import FeatureCard from "./FeatureCard.astro";
import { features } from "@/lib/landing-page-content";
// LUB hardcode:
const features = [
  {
    icon: "Calendar",
    title: "Kalendarz tygodniowy",
    description:
      "Planuj posiłki na cały tydzień w przejrzystym kalendarzu. Przypisuj przepisy do poszczególnych dni i posiłków.",
  },
  {
    icon: "Sparkles",
    title: "AI kategoryzacja",
    description:
      "Automatyczna kategoryzacja składników dzięki sztucznej inteligencji. Lista zakupów uporządkowana według działów sklepowych.",
  },
  {
    icon: "FileText",
    title: "Eksport do PDF",
    description: "Eksportuj listy zakupów do PDF lub TXT. Gotowa lista na telefonie podczas zakupów.",
  },
];
---

<section class="py-16 px-4 bg-white">
  <div class="container mx-auto max-w-6xl">
    <h2 class="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">Kluczowe funkcje</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {features.map((feature) => <FeatureCard {...feature} />)}
    </div>
  </div>
</section>
```

---

### Krok 7: Implementacja StepCard.astro

**Akcje:**

1. Utworzyć plik `src/components/landing/StepCard.astro`
2. Zdefiniować Props (stepNumber, title, description)
3. Stylować step number jako badge/circle
4. Dodać title i description

**Przykładowa implementacja:**

```astro
---
// src/components/landing/StepCard.astro
interface Props {
  stepNumber: number;
  title: string;
  description: string;
}

const { stepNumber, title, description } = Astro.props;
---

<div class="text-center">
  <div
    class="w-16 h-16 bg-primary text-white text-2xl font-bold rounded-full flex items-center justify-center mx-auto mb-4"
  >
    {stepNumber}
  </div>
  <h3 class="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
  <p class="text-gray-600">{description}</p>
</div>
```

---

### Krok 8: Implementacja HowItWorksSection.astro

**Akcje:**

1. Utworzyć plik `src/components/landing/HowItWorksSection.astro`
2. Zaimportować `StepCard` i dane steps
3. Dodać grid/flex layout z 3 kartami
4. Opcjonalnie: dodać wizualne połączenia między krokami (strzałki)

**Przykładowa implementacja:**

```astro
---
// src/components/landing/HowItWorksSection.astro
import StepCard from "./StepCard.astro";

const steps = [
  {
    stepNumber: 1,
    title: "Dodaj przepisy",
    description: "Wprowadź swoje ulubione przepisy ze składnikami do aplikacji.",
  },
  {
    stepNumber: 2,
    title: "Planuj w kalendarzu",
    description: "Przypisz przepisy do dni tygodnia i posiłków w kalendarzu.",
  },
  {
    stepNumber: 3,
    title: "Generuj listę zakupów",
    description: "Wygeneruj automatycznie zagregowaną listę zakupów i eksportuj do PDF.",
  },
];
---

<section class="py-16 px-4 bg-gray-50">
  <div class="container mx-auto max-w-6xl">
    <h2 class="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">Jak to działa?</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
      {steps.map((step) => <StepCard {...step} />)}
    </div>
  </div>
</section>
```

---

### Krok 9: Implementacja CTASection.astro

**Akcje:**

1. Utworzyć plik `src/components/landing/CTASection.astro`
2. Dodać heading, opcjonalny tekst, CTA button
3. Stylować z gradient background lub primary color
4. Centrować content

**Przykładowa implementacja:**

```astro
---
// src/components/landing/CTASection.astro
---

<section class="py-20 px-4 bg-gradient-to-r from-primary to-primary-dark">
  <div class="container mx-auto max-w-4xl text-center">
    <h2 class="text-3xl md:text-4xl font-bold text-white mb-6">Gotowy na rozpoczęcie?</h2>
    <p class="text-xl text-white/90 mb-8">Dołącz do tysięcy użytkowników, którzy oszczędzają czas dzięki ShopMate.</p>
    <a
      href="/register"
      class="inline-flex items-center justify-center px-8 py-4 bg-white text-primary text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl min-h-[44px]"
    >
      Rozpocznij za darmo
    </a>
  </div>
</section>
```

---

### Krok 10: Implementacja Footer.astro

**Akcje:**

1. Utworzyć plik `src/components/Footer.astro`
2. Dodać nawigację z linkami (conditional - jeśli strony istnieją)
3. Dodać copyright notice
4. Stylować z dark background

**Przykładowa implementacja:**

```astro
---
// src/components/Footer.astro
const footerLinks = [
  // { href: '/about', label: 'O nas' },
  // { href: '/contact', label: 'Kontakt' },
  // { href: '/privacy', label: 'Polityka prywatności' },
  // { href: '/terms', label: 'Regulamin' }
];

const currentYear = new Date().getFullYear();
---

<footer class="bg-gray-900 text-gray-300 py-12 px-4">
  <div class="container mx-auto max-w-6xl">
    {
      footerLinks.length > 0 && (
        <nav class="flex flex-wrap justify-center gap-6 mb-8">
          {footerLinks.map((link) => (
            <a href={link.href} class="hover:text-white transition-colors">
              {link.label}
            </a>
          ))}
        </nav>
      )
    }
    <p class="text-center text-sm">
      © {currentYear} ShopMate. Wszelkie prawa zastrzeżone.
    </p>
  </div>
</footer>
```

**Uwaga dla MVP:** Linki mogą być zakomentowane jeśli odpowiednie strony nie istnieją.

---

### Krok 11: Implementacja głównej strony index.astro

**Akcje:**

1. Utworzyć plik `src/pages/index.astro`
2. Zaimportować `PublicLayout` i wszystkie komponenty sekcji
3. Złożyć komponenty w odpowiedniej kolejności
4. Dodać meta tags poprzez props dla PublicLayout

**Przykładowa implementacja:**

```astro
---
// src/pages/index.astro
import PublicLayout from "@/layouts/PublicLayout.astro";
import HeroSection from "@/components/landing/HeroSection.astro";
import FeaturesSection from "@/components/landing/FeaturesSection.astro";
import HowItWorksSection from "@/components/landing/HowItWorksSection.astro";
import CTASection from "@/components/landing/CTASection.astro";
import Footer from "@/components/Footer.astro";
---

<PublicLayout
  title="ShopMate - Planuj posiłki i generuj listy zakupów w 10 minut"
  description="Aplikacja do planowania posiłków i automatycznego generowania list zakupów. Kalendarz tygodniowy, AI kategoryzacja składników, eksport do PDF."
>
  <main>
    <HeroSection />
    <FeaturesSection />
    <HowItWorksSection />
    <CTASection />
  </main>
  <Footer />
</PublicLayout>
```

---

### Krok 12: Implementacja 404 page

**Akcje:**

1. Utworzyć plik `src/pages/404.astro`
2. Użyć `PublicLayout`
3. Wyświetlić komunikat "Strona nie znaleziona"
4. Dodać link powrotu do landing page

**Implementacja:** (patrz sekcja 10.3 Obsługa błędów)

---

### Krok 13: Konfiguracja Tailwind custom colors

**Akcje:**

1. Otworzyć plik `tailwind.config.ts` (lub `tailwind.config.js`)
2. Dodać custom colors dla `primary`, `primary-dark` jeśli nie istnieją
3. Upewnić się że Shadcn/ui colors są skonfigurowane

**Przykładowa konfiguracja:**

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3B82F6", // blue-500
          dark: "#2563EB", // blue-600
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

---

### Krok 14: Testing i accessibility audit

**Akcje:**

1. Uruchomić dev server: `npm run dev`
2. Otworzyć http://localhost:3000 w przeglądarce
3. Sprawdzić responsywność (mobile, tablet, desktop)
4. Sprawdzić keyboard navigation (Tab, Enter)
5. Uruchomić Lighthouse audit:
   - Performance: target ≥90
   - Accessibility: target ≥90
   - SEO: target ≥90
6. Sprawdzić czy CTA jest above the fold (bez scrollowania)
7. Sprawdzić color contrast (WCAG AA)

**Narzędzia:**

- Chrome DevTools (Responsive mode)
- Lighthouse (Chrome DevTools → Lighthouse tab)
- axe DevTools (Chrome extension) - accessibility testing
- WAVE (WebAIM) - accessibility testing

---

### Krok 15: Optymalizacja i finalizacja

**Akcje:**

1. Zoptymalizować obrazy (jeśli używane):
   - Użyć Astro Image component
   - Dodać lazy loading dla images poniżej fold
2. Dodać favicon: `public/favicon.svg`
3. Dodać OG image: `public/og-image.png` (1200x630px)
4. Sprawdzić build: `npm run build`
5. Sprawdzić preview: `npm run preview`
6. Fix wszelkich warnings/errors w konsoli
7. Commit kodu:
   ```bash
   git add .
   git commit -m "feat: implement landing page with hero, features, how-it-works, and CTA sections"
   ```

---

### Krok 16: Deployment preparation

**Akcje:**

1. Upewnić się że `astro.config.mjs` ma poprawną konfigurację
2. Ustawić `site` URL w `astro.config.mjs`:
   ```javascript
   export default defineConfig({
     site: "https://shopmate.app",
     // ...
   });
   ```
3. Deploy na Vercel/Netlify:
   - Push do GitHub
   - Połączyć repo z Vercel/Netlify
   - Auto-deploy on push to main

---

### Krok 17: Post-deployment verification

**Akcje:**

1. Otworzyć production URL
2. Sprawdzić wszystkie linki działają
3. Sprawdzić meta tags (View Page Source)
4. Test social sharing (Facebook Debugger, Twitter Card Validator)
5. Sprawdzić analytics tracking (jeśli skonfigurowane)
6. Final Lighthouse audit na production URL

---

## Podsumowanie

Landing Page dla ShopMate to statyczna strona marketingowa zbudowana w Astro, składająca się z 5 głównych sekcji:

1. **HeroSection** - headline, value proposition, CTA
2. **FeaturesSection** - 3 główne funkcje aplikacji
3. **HowItWorksSection** - 3-krokowy proces
4. **CTASection** - final call-to-action
5. **Footer** - linki, copyright

**Kluczowe założenia techniczne:**

- Framework: Astro 5 (static site generation)
- Styling: Tailwind CSS 4
- Brak React (strona statyczna)
- Brak API calls
- Brak state management
- Responsywność: mobile-first
- Accessibility: WCAG AA compliance
- Performance: Lighthouse score ≥90

**Szacowany czas implementacji:**

- Doświadczony developer: 4-6 godzin
- Junior developer: 8-12 godzin

**Następne kroki po implementacji Landing Page:**

- Implementacja strony rejestracji (`/register`)
- Implementacja strony logowania (`/login`)
- Implementacja dashboard dla zalogowanych użytkowników
