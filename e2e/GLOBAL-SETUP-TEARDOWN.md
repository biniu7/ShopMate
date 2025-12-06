# Playwright Global Setup and Teardown

Dokumentacja dotycząca konfiguracji globalnego setup i teardown w Playwright dla projektu ShopMate.

## Wprowadzenie

Playwright oferuje dwa główne podejścia do konfiguracji globalnego setup i teardown:

1. **Project Dependencies** (Zalecane) - używane obecnie w ShopMate
2. **globalSetup/globalTeardown** w konfiguracji (Alternatywne)

## Podejście 1: Project Dependencies (Zalecane)

### Dlaczego to podejście jest zalecane?

- ✅ Pełna integracja z HTML reportem
- ✅ Automatyczne nagrywanie trace'ów
- ✅ Dostęp do Playwright fixtures
- ✅ Obsługa przeglądarki przez `browser` fixture
- ✅ Lepsze raportowanie błędów
- ✅ Możliwość debugowania w Playwright Inspector

### Jak działa w ShopMate

Projekt już używa tego podejścia! Zobacz `playwright.config.ts`:

```typescript
export default defineConfig({
  projects: [
    // Setup project - uruchamia się przed wszystkimi testami
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Główne testy - zależą od setup
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE, // używa sesji z setup
      },
      dependencies: ['setup'], // czeka na zakończenie setup
    },
  ],
});
```

### Struktura Setup w ShopMate

#### 1. Setup Project (`e2e/auth.setup.ts`)

```typescript
import { test as setup } from '@playwright/test';

const STORAGE_STATE = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // 1. Nawigacja do strony logowania
  await page.goto('/login');

  // 2. Logowanie użytkownika testowego
  await page.getByLabel('Email').fill(process.env.E2E_USERNAME!);
  await page.getByLabel('Hasło').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Zaloguj' }).click();

  // 3. Czekaj na przekierowanie
  await page.waitForURL('/recipes');

  // 4. Zapisz stan sesji
  await page.context().storageState({ path: STORAGE_STATE });
});
```

**Co się dzieje:**
1. Playwright uruchamia projekt `setup` jako pierwszy
2. Test `authenticate` loguje użytkownika
3. Stan sesji (cookies, local storage) zapisuje się do `playwright/.auth/user.json`
4. Wszystkie inne testy używają tego stanu - są już zalogowane!

#### 2. Main Tests (`e2e/*.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

// Test automatycznie używa storageState z setup
test('create recipe', async ({ page }) => {
  // Użytkownik jest już zalogowany!
  await page.goto('/recipes');
  // ... reszta testu
});
```

### Dodawanie Teardown

Jeśli potrzebujesz cleanup po wszystkich testach:

#### 1. Utwórz plik teardown

```typescript
// e2e/auth.teardown.ts
import { test as teardown } from '@playwright/test';

teardown('cleanup', async ({ page }) => {
  // Wyloguj użytkownika
  await page.goto('/');
  await page.getByRole('button', { name: 'Wyloguj' }).click();

  // Opcjonalnie: wyczyść dane testowe z bazy
  // await cleanupTestData();
});
```

#### 2. Zaktualizuj konfigurację

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'cleanup', // dodaj teardown
    },
    {
      name: 'cleanup',
      testMatch: /.*\.teardown\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
```

### Setup dla innych zasobów

#### Przykład: Database Setup

```typescript
// e2e/db.setup.ts
import { test as setup } from '@playwright/test';

setup('prepare database', async ({ }) => {
  console.log('Preparing test database...');

  // 1. Połącz się z bazą danych
  // 2. Usuń stare dane testowe
  // 3. Wstaw początkowe dane (seed)

  console.log('Database ready!');
});
```

#### Przykład: API Setup

```typescript
// e2e/api.setup.ts
import { test as setup } from '@playwright/test';

setup('prepare API', async ({ request }) => {
  // Użyj Playwright API testing
  const response = await request.post('/api/test-setup', {
    data: { action: 'prepare' }
  });

  expect(response.ok()).toBeTruthy();
});
```

## Podejście 2: globalSetup/globalTeardown Config

### Kiedy używać tego podejścia?

Użyj gdy:
- Nie potrzebujesz Playwright fixtures
- Wykonujesz proste operacje (np. uruchamianie serwera)
- Nie potrzebujesz trace'ów ani reportów z setup

⚠️ **Ograniczenia:**
- Brak dostępu do fixtures (`page`, `browser`, itp.)
- Brak trace'ów i screenshotów w setup
- Setup nie pojawia się w HTML report
- Trudniejsze debugowanie

### Konfiguracja

#### 1. Utwórz pliki setup/teardown

```typescript
// global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Global setup starting...');

  // Uruchom przeglądarkę ręcznie
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Wykonaj setup
  await page.goto('http://localhost:3000/login');
  await page.fill('[name="email"]', process.env.E2E_USERNAME!);
  await page.fill('[name="password"]', process.env.E2E_PASSWORD!);
  await page.click('button[type="submit"]');

  // Zapisz stan
  await page.context().storageState({
    path: 'playwright/.auth/user.json'
  });

  await browser.close();

  console.log('Global setup complete!');
}

export default globalSetup;
```

```typescript
// global-teardown.ts
import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('Global teardown starting...');

  // Cleanup
  // fs.unlinkSync('playwright/.auth/user.json');

  console.log('Global teardown complete!');
}

export default globalTeardown;
```

#### 2. Zaktualizuj konfigurację

```typescript
// playwright.config.ts
export default defineConfig({
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),

  // ... reszta konfiguracji
});
```

### Alternatywnie: Return function z globalSetup

```typescript
// global-setup.ts
async function globalSetup(config: FullConfig) {
  console.log('Setup...');

  // Setup code here

  // Return teardown function
  return async () => {
    console.log('Teardown...');
    // Teardown code here
  };
}

export default globalSetup;
```

## Porównanie Podejść

| Funkcja | Project Dependencies | globalSetup/Teardown |
|---------|---------------------|---------------------|
| HTML Report | ✅ Tak | ❌ Nie |
| Trace Recording | ✅ Tak | ❌ Nie |
| Playwright Fixtures | ✅ Tak | ❌ Nie |
| Screenshots | ✅ Tak | ❌ Nie |
| Debugowanie | ✅ Łatwe | ⚠️ Trudniejsze |
| Parallelizacja | ✅ Tak | ⚠️ Ograniczona |
| Prostota | ⚠️ Średnia | ✅ Prosta |

## Best Practices

### 1. Używaj Project Dependencies domyślnie

```typescript
// ✅ Zalecane
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  { name: 'chromium', dependencies: ['setup'] },
]
```

### 2. Oddziel różne typy setup

```typescript
// e2e/auth.setup.ts - autoryzacja
// e2e/db.setup.ts - baza danych
// e2e/api.setup.ts - API

projects: [
  { name: 'auth-setup', testMatch: /auth\.setup\.ts/ },
  { name: 'db-setup', testMatch: /db\.setup\.ts/ },
  {
    name: 'chromium',
    dependencies: ['auth-setup', 'db-setup']
  },
]
```

### 3. Używaj zmiennych środowiskowych

```typescript
// ✅ Dobrze
const username = process.env.E2E_USERNAME;

// ❌ Źle - hardcoded credentials
const username = 'test@example.com';
```

### 4. Zapisuj storage state

```typescript
// ✅ Dobrze - zapisz sesję
await page.context().storageState({
  path: 'playwright/.auth/user.json'
});

// ❌ Źle - logowanie w każdym teście
test('my test', async ({ page }) => {
  await page.goto('/login');
  await login();
  // ...
});
```

### 5. Obsługuj błędy w setup

```typescript
setup('authenticate', async ({ page }) => {
  try {
    await page.goto('/login');
    await page.fill('[name="email"]', process.env.E2E_USERNAME!);
    await page.fill('[name="password"]', process.env.E2E_PASSWORD!);
    await page.click('button[type="submit"]');

    // Sprawdź czy logowanie się powiodło
    await expect(page).toHaveURL('/recipes', { timeout: 10000 });
  } catch (error) {
    console.error('Setup failed:', error);
    throw error; // Setup musi się powieść, inaczej testy nie mają sensu
  }
});
```

### 6. Cleanup w teardown

```typescript
teardown('cleanup', async ({ page }) => {
  // Usuń storage state
  const fs = await import('fs');
  const path = 'playwright/.auth/user.json';
  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }

  // Wyczyść dane testowe
  await cleanupTestData();
});
```

## Troubleshooting

### Problem: Setup się nie wykonuje

**Rozwiązanie:**
1. Sprawdź `testMatch` w konfiguracji projektu setup
2. Sprawdź czy plik setup ma właściwą nazwę (np. `*.setup.ts`)
3. Sprawdź czy projekt jest w tablicy `dependencies`

```typescript
// Sprawdź to:
projects: [
  {
    name: 'setup',
    testMatch: /.*\.setup\.ts/ // czy to pasuje do nazwy pliku?
  },
  {
    name: 'chromium',
    dependencies: ['setup'] // czy nazwa się zgadza?
  },
]
```

### Problem: Storage state nie działa

**Rozwiązanie:**
1. Sprawdź czy plik `playwright/.auth/user.json` został utworzony
2. Sprawdź czy ścieżka w `storageState` się zgadza

```typescript
// W setup:
await page.context().storageState({
  path: 'playwright/.auth/user.json'
});

// W config:
use: {
  storageState: 'playwright/.auth/user.json', // ta sama ścieżka!
}
```

### Problem: Testy przechodzą lokalnie ale fail w CI

**Rozwiązanie:**
1. Sprawdź zmienne środowiskowe w CI
2. Upewnij się że użytkownik testowy istnieje w środowisku CI
3. Sprawdź logi setup w CI

```yaml
# GitHub Actions example
- name: Run Playwright tests
  env:
    E2E_USERNAME: ${{ secrets.E2E_USERNAME }}
    E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}
  run: npm run test:e2e
```

## Dodatkowe Zasoby

- [Oficjalna dokumentacja Playwright - Global Setup](https://playwright.dev/docs/test-global-setup-teardown)
- [Playwright Authentication Guide](https://playwright.dev/docs/auth)
- [Project README](./README.md)
- [Page Object Model](./page-objects/README.md)

## Przykłady z ShopMate

### Aktualny setup (auth.setup.ts)

Projekt już używa project dependencies dla autoryzacji. Zobacz plik `e2e/auth.setup.ts`.

### Potencjalne rozszerzenia

Jeśli w przyszłości będziesz potrzebować dodatkowego setup:

```typescript
// e2e/seed.setup.ts - dodaj dane testowe
import { test as setup } from '@playwright/test';

setup('seed recipes', async ({ request }) => {
  // Dodaj podstawowe przepisy do bazy
  await request.post('/api/recipes', {
    data: {
      name: 'Test Recipe',
      instructions: 'Test instructions',
      ingredients: [
        { name: 'Milk', quantity: 1, unit: 'L' }
      ]
    }
  });
});
```

Następnie zaktualizuj config:

```typescript
projects: [
  { name: 'auth-setup', testMatch: /auth\.setup\.ts/ },
  { name: 'seed-setup', testMatch: /seed\.setup\.ts/, dependencies: ['auth-setup'] },
  { name: 'chromium', dependencies: ['seed-setup'] },
]
```
