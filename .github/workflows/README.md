# GitHub Actions Workflows

## Pull Request CI/CD (`pull-request.yml`)

Automatyczny workflow uruchamiany dla każdego Pull Requesta do gałęzi `master`.

### Struktura Workflow

```
pull-request.yml
├── lint (Job 1)
│   └── Lintowanie kodu (ESLint)
│
├── unit-test (Job 2) - równolegle po lint
│   ├── Testy jednostkowe
│   ├── Zbieranie coverage
│   └── Upload do Codecov
│
├── e2e-test (Job 3) - równolegle po lint
│   ├── Instalacja przeglądarek Playwright (tylko Chromium)
│   ├── Testy E2E
│   └── Upload raportów
│
└── status-comment (Job 4) - po wszystkich
    └── Komentarz w PR z wynikami
```

### Triggery

Workflow uruchamia się automatycznie gdy:

- Utworzysz nowy Pull Request do `master`
- Dodasz nowe commity do istniejącego PR (synchronize)
- Otworzysz ponownie zamknięty PR (reopened)

### Wymagane Sekrety GitHub

Skonfiguruj następujące sekrety w Settings → Secrets and variables → Actions:

| Sekret               | Opis                             | Źródło                              |
| -------------------- | -------------------------------- | ----------------------------------- |
| `SUPABASE_URL`       | URL projektu Supabase            | Dashboard Supabase → Settings → API |
| `SUPABASE_KEY`       | Klucz API Supabase (anon public) | Dashboard Supabase → Settings → API |
| `OPENROUTER_API_KEY` | Klucz API OpenRouter/OpenAI      | OpenRouter.ai lub OpenAI Platform   |
| `E2E_USERNAME`       | Email użytkownika testowego E2E  | Testowe konto w Supabase            |
| `E2E_PASSWORD`       | Hasło użytkownika testowego E2E  | Testowe konto w Supabase            |

### Environment: integration

Job `e2e-test` wykorzystuje environment `integration`. Skonfiguruj go w:
**Settings → Environments → New environment → `integration`**

Możesz dodać:

- Protection rules (np. wymagana zgoda przed uruchomieniem)
- Environment secrets (specyficzne dla tego środowiska)
- Deployment branches (ograniczenie do konkretnych gałęzi)

### Features

#### 1. Concurrency Control

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number }}
  cancel-in-progress: true
```

Automatycznie anuluje poprzednie uruchomienia workflow dla tego samego PR przy nowych commitach.

#### 2. Parallel Execution

Jobs `unit-test` i `e2e-test` uruchamiają się równolegle po zakończeniu `lint`, oszczędzając czas.

#### 3. Coverage Reporting

- Unit tests: coverage uploadowany do Codecov
- Artifacts: raporty coverage dostępne przez 30 dni

#### 4. Smart PR Comments

Status comment:

- Aktualizuje istniejący komentarz (nie tworzy nowych)
- Pokazuje status każdego joba
- Link do workflow run
- Timestamp ostatniej aktualizacji

#### 5. Always Run Status Comment

```yaml
if: always()
```

Komentarz pojawi się zawsze, nawet jeśli któryś test nie przejdzie.

### Actions Versions

Workflow używa najnowszych wersji (MAJOR versions):

- `actions/checkout@v6`
- `actions/setup-node@v6`
- `actions/upload-artifact@v5`
- `actions/github-script@v8`
- `codecov/codecov-action@v5`

### Node.js Version

Workflow automatycznie używa wersji Node.js z pliku `.nvmrc`:

```yaml
node-version-file: ".nvmrc"
```

### Playwright Configuration

E2E testy instalują tylko przeglądarkę Chromium (zgodnie z `playwright.config.ts`):

```bash
npx playwright install chromium --with-deps
```

### Artifacts

Workflow generuje następujące artifacts (dostępne przez 30 dni):

1. **unit-test-coverage** - Raport coverage testów jednostkowych
2. **playwright-report** - HTML raport z testów E2E
3. **test-results** - Surowe wyniki testów Playwright (screenshots, videos, traces)

### Lokalne Testowanie

Przed pushowaniem PR możesz przetestować workflow lokalnie:

```bash
# Lint
npm run lint

# Unit tests z coverage
npm run test:coverage

# E2E tests (wymaga pliku .env.test)
npx playwright test
```

### Troubleshooting

#### Problem: E2E testy nie przechodzą w CI

- Sprawdź czy wszystkie sekrety są skonfigurowane
- Sprawdź czy environment `integration` istnieje
- Sprawdź logi Playwright w artifacts

#### Problem: Brak komentarza w PR

- Sprawdź permissions w repozytorium (Settings → Actions → General)
- Upewnij się że workflow ma `pull-requests: write` permission

#### Problem: Coverage nie uploaduje się do Codecov

- Sprawdź czy masz skonfigurowany Codecov w repozytorium
- Opcjonalnie dodaj `CODECOV_TOKEN` jako GitHub Secret

### Maintenance

#### Aktualizacja wersji akcji

Sprawdź najnowsze wersje:

```bash
# Przykład dla actions/checkout
curl -s https://api.github.com/repos/actions/checkout/releases/latest | grep '"tag_name":'
```

Aktualizuj tylko MAJOR version (np. v5 → v6), nie MINOR/PATCH.

#### Dodawanie nowych jobów

Pamiętaj o dodaniu nowego joba do:

1. `needs` array w `status-comment`
2. Logice statusu w `Determine overall status`
3. Tabeli w komentarzu PR

---

**Utworzony:** 2025-12-08  
**Stack:** Astro 5, React 18, Vitest, Playwright  
**Środowisko:** GitHub Actions (Ubuntu Latest)
