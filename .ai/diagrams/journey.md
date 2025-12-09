# Diagram User Journey - Moduł Autentykacji ShopMate

## Opis

Diagram przedstawia podróż użytkownika przez system autentykacji aplikacji ShopMate, obejmując:
- Rejestrację nowych użytkowników
- Logowanie istniejących użytkowników
- Reset i odzyskiwanie hasła
- Wylogowanie
- Ochronę tras przed nieautoryzowanym dostępem

Diagram został utworzony w oparciu o:
- Dokument PRD (4_prd.md) - Historie użytkownika US-001 do US-005
- Specyfikację architektury autentykacji (31_1_auth-spec.md)
- Wytyczne dotyczące User Journey

## Mermaid Diagram

```mermaid
stateDiagram-v2
    [*] --> StronaGlowna

    state "Strona Główna" as StronaGlowna {
        [*] --> WyborUzytkownika
        WyborUzytkownika: Użytkownik wybiera akcję
    }

    state wybor_akcji <<choice>>
    StronaGlowna --> wybor_akcji: Kliknięcie CTA
    wybor_akcji --> Rejestracja: Rozpocznij za darmo
    wybor_akcji --> Logowanie: Zaloguj się
    wybor_akcji --> ProbaDostepuChronionego: Próba dostępu do przepisów/kalendarza

    state "Proces Rejestracji" as Rejestracja {
        [*] --> FormularzRejestracji
        FormularzRejestracji: Wypełnianie pól email, hasło, potwierdzenie

        FormularzRejestracji --> WalidacjaRejestracji

        state walidacja_rejestracji <<choice>>
        WalidacjaRejestracji --> walidacja_rejestracji
        walidacja_rejestracji --> BledyWalidacjiRej: Dane niepoprawne
        walidacja_rejestracji --> WywolanieSupabaseSignUp: Dane poprawne

        BledyWalidacjiRej: Komunikaty błędów inline
        BledyWalidacjiRej --> FormularzRejestracji: Poprawienie danych

        WywolanieSupabaseSignUp --> SprawdzenieEmaila

        state sprawdzenie_email <<choice>>
        SprawdzenieEmaila --> sprawdzenie_email
        sprawdzenie_email --> EmailIstnieje: Email zajęty
        sprawdzenie_email --> TworzenieKonta: Email wolny

        EmailIstnieje--> Toast: Email już istnieje
        EmailIstnieje --> FormularzRejestracji

        TworzenieKonta: Hashowanie hasła, zapis do auth.users
        TworzenieKonta --> AutomatyczneLogowanie
        AutomatyczneLogowanie: Generowanie JWT tokens, zapis sesji
        AutomatyczneLogowanie --> [*]
    }

    note right of Rejestracja
        Wymagania: email (format), hasło (8-100 znaków,
        1 wielka litera, 1 cyfra), potwierdzenie hasła
    end note

    Rejestracja --> Dashboard: Sukces rejestracji

    state "Proces Logowania" as Logowanie {
        [*] --> FormularzLogowania
        FormularzLogowania: Pola email i hasło, link do resetu

        FormularzLogowania --> WywolanieSupabaseSignIn

        state weryfikacja_credentials <<choice>>
        WywolanieSupabaseSignIn --> weryfikacja_credentials
        weryfikacja_credentials --> NiepoprawneDane: Nieprawidłowy email lub hasło
        weryfikacja_credentials --> GenerowanieTokenow: Credentials poprawne

        NiepoprawneDane--> Toast: Nieprawidłowy email lub hasło
        NiepoprawneDane --> FormularzLogowania

        FormularzLogowania --> ResetHasla: Nie pamiętam hasła

        GenerowanieTokenow: Tworzenie JWT access/refresh tokens
        GenerowanieTokenow --> ZapisSesjiwCookies
        ZapisSesjiwCookies --> [*]
    }

    Logowanie --> Dashboard: Sukces logowania
    Logowanie --> OryginalnaTrasa: Redirect po logowaniu

    state "Proces Resetu Hasła" as ResetHasla {
        [*] --> ZadanieResetu

        state "Część 1: Żądanie" as ZadanieResetu {
            [*] --> FormularzEmail
            FormularzEmail: Wprowadzenie adresu email
            FormularzEmail --> WyslanieLinku
            WyslanieLinku: Supabase wysyła email z tokenem
            WyslanieLinku --> KomunikatWyslano
            KomunikatWyslano: Sprawdź swoją skrzynkę email
            KomunikatWyslano --> [*]
        }

        ZadanieResetu --> CzescDruga: Kliknięcie linku w email

        state "Część 2: Zmiana Hasła" as CzescDruga {
            [*] --> WeryfikacjaTokenu

            state weryfikacja_token <<choice>>
            WeryfikacjaTokenu --> weryfikacja_token
            weryfikacja_token --> TokenWygasly: Token starszy niż 24h
            weryfikacja_token --> FormularzNowegoHasla: Token ważny

            TokenWygasly--> Toast: Link wygasł
            TokenWygasly --> [*]

            FormularzNowegoHasla: Nowe hasło + potwierdzenie
            FormularzNowegoHasla --> WalidacjaHasla

            state walidacja_hasla <<choice>>
            WalidacjaHasla --> walidacja_hasla
            walidacja_hasla --> BledyWalidacjiHasla: Hasła nie pasują
            walidacja_hasla --> AktualizacjaHasla: Hasło poprawne

            BledyWalidacjiHasla --> FormularzNowegoHasla

            AktualizacjaHasla: Update auth.users, invalidacja tokenu
            AktualizacjaHasla --> [*]
        }

        CzescDruga --> [*]
    }

    note right of ResetHasla
        Token resetujący ważny przez 24 godziny.
        Link kieruje do /reset-password?access_token=XXX
    end note

    ResetHasla --> Logowanie: Hasło zmienione, przejdź do logowania

    state "Ochrona Tras" as OchronaTras {
        [*] --> ProbaDostepuChronionego
        ProbaDostepuChronionego: Użytkownik próbuje /dashboard, /recipes, /calendar

        ProbaDostepuChronionego --> MiddlewareCheck
        MiddlewareCheck: Sprawdzenie sesji w cookies

        state sprawdzenie_sesji <<choice>>
        MiddlewareCheck --> sprawdzenie_sesji
        sprawdzenie_sesji --> BrakSesji: Sesja nie istnieje
        sprawdzenie_sesji --> SesjaiAktywna: Sesja istnieje

        BrakSesji: Zapisanie oryginalnego URL
        BrakSesji --> [*]

        SesjaiAktywna: Renderowanie chronionej strony
        SesjaiAktywna --> [*]
    }

    note right of OchronaTras
        Middleware sprawdza sesję przed każdym requestem.
        Format przekierowania: /login?redirect=/calendar
    end note

    OchronaTras --> Logowanie: Przekierowanie do /login?redirect=...
    OchronaTras --> OryginalnaTrasa: Dostęp dozwolony

    state "Panel Użytkownika" as Dashboard {
        [*] --> MainDashboard
        MainDashboard: Przepisy, Kalendarz, Listy zakupów

        state nawigacja <<fork>>
        MainDashboard --> nawigacja
        nawigacja --> Przepisy
        nawigacja --> Kalendarz
        nawigacja --> ListyZakupow
        nawigacja --> ProfilUzytkownika

        Przepisy: Zarządzanie przepisami
        Kalendarz: Planowanie posiłków
        ListyZakupow: Generowanie list
        ProfilUzytkownika: Ustawienia konta

        ProfilUzytkownika --> Wylogowanie: Kliknięcie Wyloguj
    }

    Dashboard --> OryginalnaTrasa: Kontynuacja pracy

    state "Proces Wylogowania" as Wylogowanie {
        [*] --> WywolanieSignOut
        WywolanieSignOut: Supabase Auth signOut
        WywolanieSignOut --> UsuniecieSesji
        UsuniecieSesji: Usunięcie cookies, invalidacja tokenów
        UsuniecieSesji --> KomunikatWylogowano
        KomunikatWylogowano--> Toast: Zostałeś wylogowany
        KomunikatWylogowano --> [*]
    }

    Wylogowanie --> StronaLogowania: Przekierowanie do /login

    state "Oryginalna Trasa" as OryginalnaTrasa {
        [*] --> StroneZalogowana
        StroneZalogowana: Użytkownik kontynuuje pracę
    }

    state "Strona Logowania" as StronaLogowania {
        [*] --> FormLogowania
        FormLogowania: Formularz logowania
    }

    StronaLogowania --> [*]
    OryginalnaTrasa --> [*]
```

## Legenda

### Elementy diagramu

- **StronaGlowna**: Landing page z CTA do rejestracji/logowania
- **Rejestracja**: Proces tworzenia nowego konta
- **Logowanie**: Proces uwierzytelniania istniejącego użytkownika
- **ResetHasla**: Dwuetapowy proces odzyskiwania hasła
- **OchronaTras**: Middleware sprawdzający sesję przed dostępem do chronionych tras
- **Dashboard**: Główny panel zalogowanego użytkownika
- **Wylogowanie**: Zakończenie sesji użytkownika

### Punkty decyzyjne (choice)

- **wybor_akcji**: Użytkownik wybiera rejestrację lub logowanie
- **walidacja_rejestracji**: Sprawdzenie poprawności danych rejestracyjnych
- **sprawdzenie_email**: Weryfikacja czy email już istnieje w systemie
- **weryfikacja_credentials**: Sprawdzenie poprawności email + hasło
- **weryfikacja_token**: Sprawdzenie ważności tokenu resetującego
- **walidacja_hasla**: Weryfikacja nowego hasła
- **sprawdzenie_sesji**: Middleware sprawdza czy użytkownik jest zalogowany

### Stany równoległe (fork)

- **nawigacja**: Użytkownik może nawigować między różnymi sekcjami dashboard

## Mapowanie na User Stories

- **US-001**: Ścieżka przez stan "Proces Rejestracji"
- **US-002**: Ścieżka przez stan "Proces Logowania"
- **US-003**: Ścieżka przez stan "Proces Resetu Hasła"
- **US-004**: Ścieżka przez stan "Proces Wylogowania"
- **US-005**: Ścieżka przez stan "Ochrona Tras"

## Kluczowe obserwacje

1. **Automatyczne logowanie po rejestracji**: Użytkownik nie musi się logować po utworzeniu konta - Supabase automatycznie tworzy sesję.

2. **Security przez design**:
   - Komunikaty błędów nie ujawniają czy email istnieje ("Nieprawidłowy email lub hasło")
   - Token resetujący ważny tylko 24 godziny
   - httpOnly cookies chroniące przed XSS

3. **Redirect pattern**: Middleware zapisuje oryginalną trasę i przekierowuje użytkownika po zalogowaniu do miejsca, gdzie próbował się dostać.

4. **Walidacja dwuetapowa**:
   - Client-side: Zod schemas z komunikatami inline
   - Server-side: Supabase Auth z fallback na polskie komunikaty

5. **Optimistic UI**: Użytkownik widzi natychmiastowy feedback, rollback przy błędach API.
