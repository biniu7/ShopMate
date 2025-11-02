# Aplikacja - ShopMate (MVP)

## Streszczenie projektu

ShopMate to aplikacja webowa umożliwiająca tworzenie list zakupów na podstawie przepisów kulinarnych przyporządkowanych do poszczególnych dni i posiłków (śniadanie, drugie śniadanie, obiad, kolacja).
Aplikacja automatyzuje proces planowania posiłków i generowania list zakupów, oszczędzając czas użytkowników i redukując marnotrawstwo żywności.

## Główny problem

Użytkownicy napotykają trudności w:

- **Planowaniu posiłków na cały tydzień** - brak systematycznego podejścia do organizacji menu
- **Tworzeniu kompletnych list zakupów** - zapominanie o składnikach, wielokrotne wizyty w sklepie
- **Koordynacji składników z wielu przepisów** - czasochłonne ręczne zbieranie informacji z różnych źródeł
- **Optymalizacji zakupów** - trudność w agregacji składników i unikaniu duplikatów

ShopMate rozwiązuje te problemy poprzez centralizację przepisów, wizualne planowanie posiłków w kalendarzu tygodniowym oraz automatyczne generowanie zagregowanych list zakupów.

## Najmniejszy zestaw funkcjonalności (MVP)

### 1. Zarządzanie przepisami kulinarnymi

- **Zapisywanie przepisów** - tworzenie nowych przepisów w formie tekstowej
- **Odczytywanie przepisów** - wyświetlanie szczegółów zapisanych przepisów
- **Przeglądanie przepisów** - lista wszystkich przepisów użytkownika z podstawowym wyszukiwaniem
- **Usuwanie przepisów** - możliwość usunięcia nieaktualnych lub niepotrzebnych przepisów
- **Automatyczne tworzenie listy składników** - podczas zapisu przepisu system automatycznie ekstrahuje składniki z treści przepisu (z możliwością ręcznej edycji)

### 2. Kalendarz tygodniowy posiłków

- **Cykliczny kalendarz tygodniowy** - wizualizacja 7 dni tygodnia (Poniedziałek - Niedziela)
- **Typy posiłków** - cztery kategorie posiłków dziennie:
  - Śniadanie
  - Drugie śniadanie
  - Obiad
  - Kolacja
- **Przypisywanie przepisów** - możliwość przypisania konkretnego przepisu do każdej kombinacji dzień/posiłek
- **Funkcjonalność drag-and-drop** - intuicyjne przenoszenie przepisów do komórek kalendarza (opcjonalne w MVP)

### 3. System kont użytkowników

- wykorzystanie sytemu supabase

### 4. Generowanie list zakupów

- **Wybór źródła** - tworzenie listy na podstawie:
  - Zaznaczonych pojedynczych przepisów
  - Wybranych dni i posiłków z kalendarza
  - Całego tygodnia
- **Agregacja składników** - automatyczne sumowanie powtarzających się składników
- **Edycja listy** - możliwość ręcznej modyfikacji listy przed zapisem/eksportem
- **Zapis w bazie danych** - przechowywanie historii list zakupów

### 5. Eksport list zakupów

- **Format PDF** - czytelny, gotowy do druku dokument
- **Format TXT** - prosty plik tekstowy do łatwego udostępniania
- **Pobieranie pliku** - bezpośredni download wygenerowanego pliku

### 6. Responsywny interfejs użytkownika

- **Obsługa urządzeń mobilnych** - optymalizacja dla smartfonów (iOS, Android)
- **Obsługa desktop** - pełna funkcjonalność na komputerach
- **Intuicyjna nawigacja** - prosta struktura menu i przejść między sekcjami
- **Nowoczesny design** - estetyczny i czytelny interfejs

## Co NIE wchodzi w zakres MVP

### Funkcje postponowane do kolejnych wersji:

- **Import przepisów z pliku** (JPG, PDF, DOCX) - wymaga OCR i zaawansowanego parsowania
- **Aplikacje mobilne natywne** (iOS, Android) - na początek tylko aplikacja webowa
- **Udostępnianie przepisów dla innych użytkowników** - funkcje społecznościowe
- **Integracja z zewnętrznymi serwisami zakupowymi** (np. Frisco, Carrefour API)
- **Obsługa wielu języków** - na początek tylko język polski
- **Zaawansowane funkcje planowania posiłków**:
  - Powtarzające się posiłki
  - Szablony tygodniowe
  - Kalendarz miesięczny
  - Planowanie na wiele tygodni naprzód
- **Powiadomienia** (e-mail, SMS, push notifications)
- **Zaawansowane wyszukiwanie i filtrowanie**:
  - Filtrowanie po składnikach
  - Filtrowanie po czasie przygotowania
  - Wyszukiwanie pełnotekstowe
  - Tagi i kategorie przepisów
- **Integracja z asystentami głosowymi** (Alexa, Google Assistant)
- **Obsługa diet i alergii**:
  - Profile dietetyczne (wegetariańska, wegańska, bezglutenowa)
  - Oznaczanie alergenów
  - Automatyczne filtrowanie przepisów
- **Integracja z kalendarzem zewnętrznym** (Google Calendar, Outlook)
- **Zaawansowane zarządzanie użytkownikami**:
  - Role i uprawnienia (admin, użytkownik)
  - Konta rodzinne
  - Udostępnianie list między użytkownikami
- **Zaawansowane funkcje bezpieczeństwa**:
  - Uwierzytelnianie dwuskładnikowe (2FA)
  - Szyfrowanie danych end-to-end
  - OAuth (logowanie przez Google/Facebook)
- **Analityka i raporty**:
  - Statystyki najczęściej używanych przepisów
  - Historia zakupów
  - Szacowanie kosztów
- **Zarządzanie zapasami w spiżarni**

## Kryteria sukcesu MVP

### Główny cel:

Użytkownik jest w stanie wygenerować kompletną listę zakupów w formacie PDF na podstawie zaznaczonych przepisów kulinarnych i przypisanych do nich dni/posiłków w kalendarzu tygodniowym.

### Mierzalne kryteria:

1. **Funkcjonalność**:
   - Użytkownik może utworzyć konto, zalogować się i wylogować
   - Użytkownik może dodać minimum 5 przepisów i przypisać je do kalendarza
   - System automatycznie ekstrahuje składniki z przepisów z dokładnością > 80%
   - Lista zakupów jest generowana w < 3 sekundy
   - PDF jest poprawnie sformatowany i czytelny na wszystkich urządzeniach

2. **UX (User Experience)**:
   - Nowy użytkownik jest w stanie zaplanować tydzień i wygenerować listę zakupów w < 10 minut
   - Aplikacja działa płynnie na urządzeniach mobilnych i desktop
   - Wszystkie kluczowe akcje wymagają maksymalnie 3 kliknięć

3. **Techniczne**:
   - Aplikacja działa stabilnie bez krytycznych błędów
   - Czas ładowania strony < 2 sekundy
   - Responsywność na urządzeniach od 320px szerokości
   - Dane użytkowników są bezpiecznie przechowywane

4. **Biznesowe**:
   - Minimum 10 użytkowników testowych potwierdza wartość aplikacji
   - Aplikacja rozwiązuje zdefiniowany główny problem (weryfikacja przez ankiety)
   - MVP jest gotowe do dalszego rozwoju i skalowania

## Grupa docelowa

**Główni użytkownicy:**

- Osoby planujące posiłki dla rodziny
- Osoby żyjące samodzielnie i chcące lepiej organizować zakupy
- Osoby dbające o redukcję marnotrawstwa żywności
- Osoby poszukujące oszczędności czasu i pieniędzy

**Charakterystyka:**

- Wiek: 25-55 lat
- Posiadają smartfon lub komputer
- Robią zakupy spożywcze minimum raz w tygodniu
- Mają podstawową wiedzę o korzystaniu z aplikacji webowych

## Potencjalne ryzyka i ograniczenia MVP

1. **Automatyczne ekstrahowanie składników** - może wymagać ręcznych poprawek przez użytkownika
2. **Brak jednostek miar** - w MVP nie ma automatycznej konwersji jednostek (np. kg na g)
3. **Brak kategoryzacji składników** - lista nie jest grupowana po działach sklepowych
4. **Ograniczony kalendarz** - tylko widok tygodniowy, brak planowania długoterminowego
5. **Podstawowe bezpieczeństwo** - standardowe hasła bez 2FA

## Kolejne kroki po MVP

1. Zebranie feedbacku od użytkowników testowych
2. Analiza najczęściej używanych funkcji
3. Priorytetyzacja funkcji do wersji 1.0:
   - Import przepisów
   - Kategoryzacja składników w liście
   - Szablony tygodniowe
   - Obsługa jednostek miar
4. Rozważenie modelu monetyzacji (freemium, premium features)
