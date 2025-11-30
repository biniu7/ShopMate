# E2E Tests - ShopMate

Testy end-to-end dla aplikacji ShopMate używające Playwright.

## Setup

### 1. Przygotuj użytkownika testowego

Musisz mieć konto testowe w bazie danych Supabase. Możesz je utworzyć:

1. **Przez aplikację** - zarejestruj się w aplikacji ShopMate
2. **Przez Supabase Dashboard** - dodaj użytkownika w Authentication

**Zalecenia:**
- Email: `test@shopmate.local` (lub inny, który łatwo zapamiętasz)
- Hasło: Silne hasło min. 8 znaków
- **WAŻNE**: Ten użytkownik będzie używany TYLKO do testów!

### 2. Skonfiguruj zmienne środowiskowe

Skopiuj plik `.env.test.example` do `.env.test`:

```bash
cp .env.test.example .env.test
```

Wypełnij plik `.env.test` danymi testowego użytkownika:

```env
# Test user credentials
E2E_USERNAME=test@shopmate.local
E2E_PASSWORD=your-test-password-here

# Base URL for tests
SUPABASE_URL=https://ukzxkcosshbkeksvcgsv.supabase.co
```

**UWAGA**: Plik `.env.test` jest dodany do `.gitignore` - NIE commituj go do repo!

### 3. Uruchom dev server

Testy wymagają działającego dev servera:

```bash
npm run dev
```

Playwright automatycznie uruchomi server, ale możesz też uruchomić go ręcznie.

## Uruchamianie testów

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Tryb interaktywny (UI mode)
npm run test:e2e:ui

# Z widoczną przeglądarką
npm run test:e2e:headed

# Tryb debugowania
npm run test:e2e:debug

# Codegen - nagrywanie testów
npm run test:e2e:codegen
```

## Jak działają testy

### 1. Setup project (`e2e/auth.setup.ts`)

Przed uruchomieniem testów, Playwright:
1. Uruchamia `auth.setup.ts`
2. Loguje się jako użytkownik testowy
3. Zapisuje sesję do `playwright/.auth/user.json`

### 2. Main tests (`e2e/**/*.spec.ts`)

Testy używają zapisanej sesji:
- Każdy test rozpoczyna się jako zalogowany użytkownik
- Nie ma potrzeby logowania w każdym teście
- Testy są izolowane dzięki browser contexts

## Struktura

```
e2e/
├── examples/
│   └── example.spec.ts          # Przykłady (wyłączone)
├── helpers/
│   ├── index.ts
│   └── test-data.ts             # Generowanie dynamicznych danych
├── page-objects/
│   ├── components/
│   │   └── IngredientRow.ts
│   ├── RecipesListPage.ts       # POM dla listy przepisów
│   ├── RecipeCreatePage.ts      # POM dla formularza
│   ├── index.ts
│   └── README.md                # Dokumentacja POM
├── auth.setup.ts                # Setup autoryzacji
├── recipe-create.spec.ts        # Testy tworzenia przepisów
└── README.md                    # Ten plik
```

## Raporty i artifacts

Po uruchomieniu testów:

```
playwright-report/        # Raport HTML
test-results/            # Screenshots, videos, traces
playwright/.auth/        # Saved auth state (gitignored)
```

Otwórz raport HTML:

```bash
npx playwright show-report
```

## Debugowanie

### Trace Viewer

Jeśli test się nie powiedzie, Playwright zapisze trace:

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

### Screenshot i Video

Screenshots i video są automatycznie zapisywane przy niepowodzeniu testu w `test-results/`.

### Codegen

Nagraj nowe testy używając codegen:

```bash
npm run test:e2e:codegen
```

## Troubleshooting

### "Cannot find test user" lub timeout przy logowaniu

- Sprawdź czy `.env.test` istnieje i zawiera poprawne dane
- Sprawdź czy użytkownik istnieje w bazie Supabase
- Sprawdź czy hasło jest poprawne

### "add-recipe-button not found"

- Sprawdź czy auth setup przeszedł pomyślnie
- Sprawdź czy `playwright/.auth/user.json` został utworzony
- Usuń `playwright/.auth/user.json` i uruchom testy ponownie

### Testy przechodzą lokalnie ale fail w CI

- Upewnij się że CI ma dostęp do `.env.test` (np. przez GitHub Secrets)
- Sprawdź czy test user istnieje w środowisku CI
- Sprawdź logi w CI dla szczegółów

## Best Practices

1. **Dynamiczne nazwy** - Zawsze używaj `generateRecipeName()` dla nazw przepisów
2. **Czekaj na elementy** - Używaj `waitFor` zamiast `sleep`
3. **Page Object Model** - Enkapsuluj logikę UI w POM
4. **data-test-id** - Używaj `getByTestId()` do lokalizacji elementów
5. **Izolacja testów** - Każdy test powinien być niezależny

## Więcej informacji

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model README](./page-objects/README.md)
- [CLAUDE.md](../CLAUDE.md) - Project guidelines
