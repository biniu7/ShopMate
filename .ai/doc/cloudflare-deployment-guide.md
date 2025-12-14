# Przewodnik wdrożenia na Cloudflare Pages

**Data:** 2025-12-11
**Wersja:** 1.0

## Podsumowanie

Projekt ShopMate został skonfigurowany do automatycznego wdrożenia na Cloudflare Pages poprzez GitHub Actions. Workflow `master.yml` automatycznie wdraża aplikację po każdym pushu do gałęzi `master`.

## Architektura CI/CD

### Workflow: `master.yml` (Produkcja)

**Trigger:** Push do gałęzi `master`

**Jobs:**

1. **Lint** - Sprawdzenie jakości kodu (ESLint)
2. **Unit Tests** - Testy jednostkowe z pokryciem kodu
3. **Build** - Budowanie aplikacji Astro
4. **Deploy** - Wdrożenie na Cloudflare Pages
5. **Deployment Status** - Raport statusu wdrożenia

**Różnice względem `pull-request.yml`:**

- ❌ Brak testów E2E (aby przyspieszyć deployment)
- ✅ Dodany job Build (przygotowanie artefaktów)
- ✅ Dodany job Deploy (wdrożenie na Cloudflare)
- ✅ Deployment Status zamiast PR Comment

## Wymagana konfiguracja

### 1. GitHub Secrets

W ustawieniach repozytorium GitHub (`Settings > Secrets and variables > Actions`) dodaj następujące sekrety:

| Nazwa sekretu          | Opis                                                     | Gdzie znaleźć                                                                                                                |
| ---------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN` | Token API Cloudflare z uprawnieniami do Cloudflare Pages | [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) → "Create Token" → "Edit Cloudflare Workers" template |
| `SUPABASE_URL`         | URL projektu Supabase                                    | [Supabase Dashboard](https://supabase.com/dashboard) → Twój projekt → Settings → API → Project URL                           |
| `SUPABASE_KEY`         | Klucz publiczny (anon key) Supabase                      | Supabase Dashboard → Settings → API → Project API keys → `anon` `public`                                                     |
| `OPENAI_API_KEY`       | Klucz API OpenAI                                         | [OpenAI Platform](https://platform.openai.com/api-keys)                                                                      |
| `E2E_USERNAME`         | Email użytkownika testowego (dla E2E w PR)               | Konto testowe w Supabase                                                                                                     |
| `E2E_PASSWORD`         | Hasło użytkownika testowego (dla E2E w PR)               | Konto testowe w Supabase                                                                                                     |

### 2. GitHub Environments

Utwórz environment `production` w GitHub:

1. Przejdź do `Settings > Environments`
2. Kliknij `New environment`
3. Nazwa: `production`
4. (Opcjonalnie) Dodaj protection rules:
   - ✅ Required reviewers - wymaga zatwierdzenia przed deploymentem
   - ✅ Wait timer - opóźnienie przed deploymentem

### 3. Cloudflare Pages - Konfiguracja projektu

#### 3.1. Utworzenie projektu Cloudflare Pages

1. Przejdź do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Wybierz `Workers & Pages` → `Create application` → `Pages`
3. Nazwa projektu: `shopmate`
4. **Ważne:** NIE łącz z repozytorium GitHub - deployment będzie przez wrangler-action

#### 3.2. Konfiguracja zmiennych środowiskowych w Cloudflare

W ustawieniach projektu Cloudflare Pages (`Settings > Environment variables`) dodaj:

**Production:**
| Nazwa zmiennej | Wartość | Typ |
|----------------|---------|-----|
| `SUPABASE_URL` | Twój URL Supabase | Plaintext |
| `SUPABASE_KEY` | Twój anon key Supabase | Plaintext |
| `OPENAI_API_KEY` | Twój klucz OpenAI | Encrypted |

**Preview (opcjonalnie):**

- Możesz dodać te same zmienne dla środowiska preview (używane dla PR)

#### 3.3. Utworzenie KV Namespace (opcjonalne - dla sesji)

Jeśli planujesz używać KV dla sesji:

1. Przejdź do `Workers & Pages` → `KV`
2. Kliknij `Create namespace`
3. Nazwa: `shopmate-sessions` (production) i `shopmate-sessions-preview` (preview)
4. Skopiuj ID i zaktualizuj w `wrangler.toml`:
   ```toml
   [[kv_namespaces]]
   binding = "SESSION"
   id = "twoje-kv-namespace-id"
   preview_id = "twoje-preview-kv-namespace-id"
   ```

## Proces wdrożenia

### Automatyczny deployment (rekomendowany)

1. Upewnij się, że wszystkie sekrety są skonfigurowane
2. Merguj Pull Request do gałęzi `master`
3. GitHub Actions automatycznie:
   - ✅ Sprawdzi jakość kodu (lint)
   - ✅ Uruchomi testy jednostkowe
   - ✅ Zbuduje aplikację
   - ✅ Wdroży na Cloudflare Pages
   - ✅ Wygeneruje raport statusu

### Ręczny deployment (opcjonalny)

Jeśli potrzebujesz wdrożyć ręcznie:

```bash
# Zainstaluj wrangler globalnie
npm install -g wrangler

# Zaloguj się do Cloudflare
wrangler login

# Zbuduj aplikację
npm run build

# Wdróż na Cloudflare Pages
wrangler pages deploy dist --project-name=shopmate
```

## Monitorowanie i weryfikacja

### 1. Status deploymentu w GitHub

Po każdym pushu do `master`:

- Przejdź do zakładki `Actions` w repozytorium
- Znajdź najnowszy workflow `Production Deployment`
- Sprawdź status każdego job'a
- Kliknij `deployment-status` aby zobaczyć podsumowanie

### 2. Logi deploymentu w Cloudflare

1. Przejdź do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Wybierz `Workers & Pages` → `shopmate`
3. Zakładka `Deployments` - zobacz historię wdrożeń
4. Kliknij na konkretne wdrożenie aby zobaczyć logi

### 3. Weryfikacja aplikacji

Po pomyślnym wdrożeniu:

- URL produkcyjny: `https://shopmate.pages.dev` (lub Twoja custom domena)
- Sprawdź czy aplikacja działa poprawnie
- Zweryfikuj integrację z Supabase (login, rejestracja)
- Przetestuj główne funkcjonalności

## Rozwiązywanie problemów

### Problem: Błąd "incorrect header check" podczas npm ci w GitHub Actions

**Symptomy:**

```
npm error Error: incorrect header check
npm error code Z_DATA_ERROR
npm error path /home/runner/work/ShopMate/ShopMate/node_modules/supabase
```

**Przyczyna:**

- Pakiet `supabase` (w devDependencies) próbuje pobrać Supabase CLI binary podczas postinstall
- Pobieranie kończy się błędem dekompresji w środowisku CI
- Supabase CLI nie jest potrzebny do buildu - służy tylko do lokalnego developmentu

**Rozwiązanie (już zastosowane):**
W workflows używamy `npm ci --ignore-scripts` aby pominąć postinstall scripts:

```yaml
- name: Install dependencies
  run: npm ci --ignore-scripts
  env:
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: 1
```

To ignoruje:

- ✅ Supabase CLI download (nie jest potrzebny w CI)
- ✅ Playwright browsers download (instalowane osobno dla E2E testów)

**Uwaga:** Jeśli dodajesz nowe pakiety które wymagają postinstall scripts dla działania aplikacji, może być konieczna modyfikacja tego podejścia.

### Problem: Deployment kończy się błędem "Authentication error"

**Rozwiązanie:**

- Sprawdź czy `CLOUDFLARE_API_TOKEN` jest poprawnie skonfigurowany w GitHub Secrets
- Upewnij się, że token ma uprawnienia do Cloudflare Pages
- Wygeneruj nowy token jeśli obecny wygasł

### Problem: Aplikacja nie łączy się z Supabase

**Rozwiązanie:**

- Sprawdź czy zmienne `SUPABASE_URL` i `SUPABASE_KEY` są ustawione w Cloudflare Pages (Settings → Environment variables)
- NIE ustawiaj tych zmiennych w GitHub Secrets jako `env:` w workflow - one muszą być w Cloudflare

### Problem: Build kończy się błędem

**Rozwiązanie:**

- Sprawdź logi w GitHub Actions
- Uruchom `npm run build` lokalnie aby zreplikować błąd
- Upewnij się, że wszystkie zależności są zainstalowane (`npm ci`)

### Problem: Testy jednostkowe nie przechodzą

**Rozwiązanie:**

- Workflow zatrzyma deployment jeśli testy failują
- Sprawdź logi testów w GitHub Actions job `unit-test`
- Napraw testy lokalnie (`npm run test`) przed ponownym pushem

## Koszty

### GitHub Actions

- **Free tier:** 2000 minut/miesiąc dla prywatnych repozytoriów
- **Szacowane zużycie:** ~5 minut/deployment
- **Koszt:** $0 dla publicznych repozytoriów

### Cloudflare Pages

- **Free tier:**
  - 500 builds/miesiąc
  - Unlimited requests
  - Unlimited bandwidth
- **Szacowane użycie:** ~30-60 deployments/miesiąc dla aktywnego projektu
- **Koszt:** $0 dla MVP

## Best Practices

### 1. Testuj przed mergem do master

- Zawsze twórz Pull Request
- Workflow `pull-request.yml` uruchomi testy (w tym E2E)
- Merguj tylko po przejściu wszystkich testów

### 2. Monitoruj deployment

- Sprawdzaj logi w GitHub Actions po każdym deployment
- Ustaw notifications w GitHub dla failed workflows

### 3. Rollback w razie problemu

Jeśli deployment wprowadza błędy:

```bash
# Opcja 1: Revert commit i push do master
git revert HEAD
git push origin master

# Opcja 2: Wdróż poprzednią wersję ręcznie w Cloudflare Dashboard
# Przejdź do Deployments → Wybierz poprzednie wdrożenie → "Rollback to this deployment"
```

### 4. Custom domena (produkcja)

Po testach możesz dodać custom domenę:

1. Cloudflare Pages → `shopmate` → `Custom domains`
2. Kliknij `Set up a custom domain`
3. Wprowadź swoją domenę (np. `shopmate.pl`)
4. Cloudflare automatycznie skonfiguruje DNS i SSL

## Wersje GitHub Actions

Wszystkie akcje używają najnowszych wersji (stan na 2025-12-11):

| Akcja                        | Wersja | Uwagi                     |
| ---------------------------- | ------ | ------------------------- |
| `actions/checkout`           | v6     |                           |
| `actions/setup-node`         | v6     |                           |
| `actions/upload-artifact`    | v5     |                           |
| `actions/download-artifact`  | v6     |                           |
| `codecov/codecov-action`     | v5     |                           |
| `actions/github-script`      | v8     |                           |
| `cloudflare/wrangler-action` | v3     | wranglerVersion: "3.90.0" |

## Następne kroki

1. ✅ Skonfiguruj wszystkie GitHub Secrets
2. ✅ Utwórz projekt w Cloudflare Pages
3. ✅ Dodaj zmienne środowiskowe w Cloudflare
4. ✅ Wykonaj pierwszy deployment (push do master)
5. ✅ Przetestuj aplikację na produkcji
6. ⏳ (Opcjonalnie) Skonfiguruj custom domenę
7. ⏳ (Opcjonalnie) Dodaj monitoring (Sentry)

---

**Autor:** Claude Code
**Ostatnia aktualizacja:** 2025-12-11
