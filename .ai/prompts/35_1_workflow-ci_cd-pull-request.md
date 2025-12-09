Jesteś specjalistą GitHub Actions w stacku @.ai/doc/tech-stack.md   @package.json

Utwórz scenariusz "pull-request.yml" na podstawie @.ai/doc/github-action.mdc

Workflow:
Scenariusz "pull-request.yml" powinien działać następująco:

- Lintowanie kodu
- Następnie dwa równoległe - unit-test i e2e-test
- Finalnie - status-comment (komentarz do PRa o statusie całości)

Dodatkowe uwagi:
- status-comment uruchamia się tylko kiedy poprzedni zestaw 3 przejdzie poprawnie
- w jobie e2e pobieraj przeglądarki wg @playwright.config.ts
- w jobie e2e ustaw środowisko "integration" i zmienne z sekretów wg @.env.test
- zbieraj coverage unit testów i testów e2e