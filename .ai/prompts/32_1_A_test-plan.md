Twoim zadaniem jest wygenerowanie kompleksowego planu testów (test plan) dla projektu programistycznego. Plan powinien być napisany w języku polskim i dostosowany do specyfiki projektu, jego technologii oraz struktury kodu.

Oto baza kodu projektu, który będziesz analizować:

<codebase>
@CODEBASE
</codebase>

Oto stos technologiczny (tech stack) używany w tym projekcie:

<tech_stack>
@.ai/doc/tech-stack.md
</tech_stack>

Przed napisaniem planu testów, przeanalizuj dokładnie dostarczone informacje. Użyj tagów <scratchpad> do przeprowadzenia analizy:

W swoim scratchpadzie:
1. Zidentyfikuj kluczowe komponenty i moduły w bazie kodu
2. Określ główne funkcjonalności aplikacji
3. Rozpoznaj wzorce architektoniczne i strukturę projektu
4. Zidentyfikuj technologie testowe odpowiednie dla danego stosu technologicznego
5. Określ priorytety testowania na podstawie krytyczności komponentów
6. Zanotuj potencjalne obszary ryzyka i złożoności

Twój plan testów powinien zawierać następujące sekcje:

1. **Wprowadzenie i cel testów** - krótki opis projektu i celów testowania
2. **Zakres testów** - co będzie testowane, a co jest poza zakresem
3. **Strategia testowania** - jakie rodzaje testów będą przeprowadzone (jednostkowe, integracyjne, E2E, wydajnościowe, bezpieczeństwa, itp.)
4. **Środowisko testowe** - wymagane narzędzia, frameworki i infrastruktura (dostosowane do {{TECH_STACK}})
5. **Priorytetyzacja testów** - które obszary wymagają najintensywniejszego testowania
6. **Komponenty do przetestowania** - lista kluczowych modułów/komponentów z bazy kodu
7. **Typy testów dla każdego komponentu** - szczegółowe rozpisanie jakie testy są potrzebne
8. **Narzędzia i frameworki testowe** - konkretne rekomendacje narzędzi pasujących do stosu technologicznego
9. **Kryteria akceptacji** - kiedy testy można uznać za zakończone
10. **Harmonogram i zasoby** - szacunkowy czas i wymagane zasoby
11. **Zarządzanie ryzykiem** - zidentyfikowane ryzyka i strategie mitygacji

Upewnij się, że:
- Plan jest szczegółowy i praktyczny, nie ogólnikowy
- Rekomendacje narzędzi są konkretne i odpowiednie dla podanego stosu technologicznego
- Priorytetyzacja odzwierciedla rzeczywistą strukturę i złożoność kodu
- Wszystkie sekcje są napisane w języku polskim
- Plan jest dostosowany do specyfiki projektu, a nie jest szablonem ogólnym

Twoja finalna odpowiedź powinna zawierać tylko kompletny plan testów w języku polskim, bez powtarzania scratchpada. Użyj tagów <test_plan> dla swojej odpowiedzi.

Przedstaw ten plan w formacie Markdown i zpisz do pliku .ai/doc/32_1_A_test-plan.md