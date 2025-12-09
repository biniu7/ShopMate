# ShopMate zp

> AI-powered meal planning and smart shopping list generator

ShopMate is an MVP web application that automates the process of meal planning and generates intelligent shopping lists. Using AI-powered ingredient categorization, it helps users plan weekly meals and create organized shopping lists in under 10 minutes.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

ShopMate streamlines meal planning and grocery shopping by providing:

- **📅 Weekly Calendar**: Plan meals across 7 days with 4 meal types (breakfast, second breakfast, lunch, dinner)
- **📝 Recipe Management**: Create, edit, and organize your recipes with ingredients and instructions
- **🤖 AI Categorization**: Automatically categorize ingredients into store departments using OpenAI GPT-4o mini
- **🛒 Smart Shopping Lists**: Generate aggregated shopping lists from selected meals with quantity consolidation
- **📄 Export Options**: Download shopping lists as PDF or TXT for offline use
- **📱 Responsive Design**: Optimized for mobile and desktop with WCAG AA accessibility compliance
- **🔒 Secure Authentication**: User accounts with Row Level Security (RLS) for data isolation

### Target Audience

- Families planning meals (ages 25-55)
- Individuals seeking better shopping organization
- People focused on reducing food waste
- Budget-conscious shoppers

### Value Proposition

- **Time Savings**: Automated meal planning and shopping list generation
- **Waste Reduction**: Systematic planning eliminates impulse buying and forgotten products
- **Convenience**: Mobile-accessible lists with AI categorization by store departments
- **Organization**: Centralized recipe repository accessible from any device

## Tech Stack

### Frontend

- **[Astro 5](https://astro.build/)** - Server-side rendered framework with islands architecture
- **[React 19](https://react.dev/)** - UI library for interactive components
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Shadcn/ui](https://ui.shadcn.com/)** - Accessible component library (Radix UI primitives)

### Backend & Database

- **[Supabase](https://supabase.com/)** - PostgreSQL database, authentication, and Row Level Security
- **[Zod](https://zod.dev/)** - Schema validation for API inputs and forms
- **Node.js Adapter** - Standalone server mode

### AI & Services

- **[OpenAI API](https://openai.com/)** - GPT-4o mini for ingredient categorization
- **[@react-pdf/renderer](https://react-pdf.org/)** - Client-side PDF generation

### Development Tools

- **[ESLint](https://eslint.org/)** - Code linting with TypeScript, React, and a11y rules
- **[Prettier](https://prettier.io/)** - Code formatting with Astro plugin
- **[Husky](https://typicode.github.io/husky/)** - Git hooks for code quality
- **[lint-staged](https://github.com/okonet/lint-staged)** - Run linters on staged files

### Hosting & CI/CD

- **Vercel** - Primary hosting platform (recommended)
- **GitHub Actions** - Continuous integration and deployment
- **Sentry** - Error tracking and monitoring

## Getting Started Locally

### Prerequisites

- **Node.js**: v22.14.0 (specified in `.nvmrc`)
- **npm**: v9+ or yarn
- **Supabase Account**: For database and authentication
- **OpenAI API Key**: For ingredient categorization

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/shopmate.git
   cd shopmate
   ```

2. **Install Node.js version**

   ```bash
   # If using nvm
   nvm use
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Supabase
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   ```

5. **Set up Supabase database**
   - Create a new Supabase project
   - Run database migrations (SQL schema available in `CLAUDE.md`)
   - Enable Row Level Security policies

6. **Run the development server**

   ```bash
   npm run dev
   ```

7. **Open your browser**

   Navigate to `http://localhost:4321`

### Environment Variables

| Variable         | Description                              | Required |
| ---------------- | ---------------------------------------- | -------- |
| `SUPABASE_URL`   | Your Supabase project URL                | ✅ Yes   |
| `SUPABASE_KEY`   | Supabase anonymous key (safe for client) | ✅ Yes   |
| `OPENAI_API_KEY` | OpenAI API key (keep server-side only)   | ✅ Yes   |

## Available Scripts

| Command            | Description                           |
| ------------------ | ------------------------------------- |
| `npm run dev`      | Start development server on port 4321 |
| `npm run build`    | Build production-ready application    |
| `npm run preview`  | Preview production build locally      |
| `npm run lint`     | Run ESLint to check code quality      |
| `npm run lint:fix` | Automatically fix ESLint issues       |
| `npm run format`   | Format code with Prettier             |

### Git Hooks

The project uses Husky and lint-staged to ensure code quality:

- **Pre-commit**: Automatically runs ESLint on TypeScript/Astro files and Prettier on JSON/CSS/Markdown files

## Testing

ShopMate employs a comprehensive testing strategy to ensure code quality and reliability across all layers of the application.

### Testing Framework

- **[Vitest](https://vitest.dev/)** - Fast unit testing framework compatible with Vite/Astro
- **[React Testing Library](https://testing-library.com/react)** - Component testing with user-centric approach
- **[Playwright](https://playwright.dev/)** - End-to-end testing for critical user flows

### Running Tests

#### Unit and Integration Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode (during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

#### End-to-End Tests

```bash
# Run all E2E tests
npx playwright test

# Run E2E tests in UI mode (interactive debugging)
npx playwright test --ui

# Run E2E tests in headed mode (see browser)
npx playwright test --headed
```

### Test Structure

```
src/
├── lib/
│   ├── validation/
│   │   └── *.schema.test.ts       # Zod schema validation tests
│   ├── utils/
│   │   └── *.test.ts               # Utility function tests
│   └── services/
│       └── *.test.ts               # Service layer tests (with API mocking)
├── components/
│   └── **/*.test.tsx               # React component tests
tests/
└── e2e/
    ├── auth.spec.ts                # Authentication flow tests
    ├── recipes.spec.ts             # Recipe management tests
    ├── calendar.spec.ts            # Meal planning tests
    └── shopping-lists.spec.ts      # Shopping list generation tests
```

### Test Coverage Goals

- **Business Logic** (`src/lib`): Minimum 80% coverage
- **UI Components**: Minimum 60% coverage
- **Critical Paths**: 100% E2E test coverage (registration → recipe → calendar → shopping list)

### Testing Best Practices

- **Unit Tests**: Focus on validation schemas (Zod), utility functions, and service logic
- **Integration Tests**: Verify API endpoints, React hooks with TanStack Query, and form submissions
- **E2E Tests**: Cover critical user journeys and cross-module interactions
- **Test Data**: Use Supabase test database with seeded data for consistent test environments

## Project Scope

### ✅ Included in MVP

- **Recipe Management**
  - Create, read, update, delete recipes (CRUD operations)
  - Text-based recipe entry with ingredients and instructions
  - Dynamic ingredient list (quantity, unit, name)

- **Weekly Meal Calendar**
  - 7 days (Monday-Sunday) × 4 meals (breakfast, second breakfast, lunch, dinner)
  - Assign recipes to specific days and meal types
  - Navigate between weeks
  - One recipe per calendar slot

- **AI-Powered Features**
  - Automatic ingredient categorization into 7 store departments
  - Categories: Nabiał (Dairy), Warzywa (Vegetables), Owoce (Fruits), Mięso (Meat), Pieczywo (Bread), Przyprawy (Spices), Inne (Other)
  - Fallback to manual categorization if AI fails

- **Shopping List Generation**
  - Generate lists from calendar (select specific days/meals)
  - Generate lists from individual recipes
  - Automatic ingredient aggregation (sum quantities with matching units)
  - Edit list before saving (add/remove items, change categories)

- **Export Functionality**
  - PDF export (A4 format with categorized layout)
  - TXT export (UTF-8 encoded plain text)
  - Mobile-compatible downloads

- **Authentication & Security**
  - Email/password authentication via Supabase Auth
  - Row Level Security (RLS) for user data isolation
  - Password reset functionality
  - Secure session management

- **Responsive UI**
  - Mobile-first design (minimum 320px width)
  - Desktop, tablet, and mobile layouts
  - WCAG AA accessibility compliance
  - Touch-friendly interactions

### ❌ Excluded from MVP (Future Versions)

- Recipe imports from files (JPG, PDF, DOCX) - requires OCR
- Native mobile apps (iOS/Android)
- Recipe sharing between users
- Social features (comments, ratings, public profiles)
- External shopping service integrations (Frisco, Carrefour, etc.)
- Multi-language support (Polish only in MVP)
- Advanced meal planning (templates, recurring meals, drag-and-drop)
- Push notifications and reminders
- Diet/allergy management and filtering
- Two-factor authentication (2FA)
- Unit conversion (cups to grams, etc.)
- Ingredient price tracking and cost estimation
- Collaborative/family accounts

### Technical Limitations

- Maximum 50 ingredients per recipe
- Maximum 20 recipes per shopping list (AI token limit)
- Maximum 100 items per shopping list
- One recipe per calendar slot
- No offline support (requires internet connection)
- Rate limiting: 100 requests/minute per user (Supabase default)

## Project Status

**Version**: 0.0.1 (MVP Development Phase)

### Current Status

- ✅ Project setup and architecture planning complete
- ✅ Tech stack finalized (Astro 5 + React 19 + Supabase)
- ✅ Database schema designed with RLS policies
- ✅ AI integration strategy defined
- 🚧 In Development: Core features implementation
- 📋 Planned: Testing, deployment, and user feedback

### Performance Targets (MVP)

- **LCP** (Largest Contentful Paint): <2.5s
- **FID** (First Input Delay): <100ms
- **CLS** (Cumulative Layout Shift): <0.1
- **TTI** (Time to Interactive): <3.5s
- **Bundle Size**: <100KB initial JavaScript

### Scalability Targets

- **MVP**: 1,000-10,000 users
- **Infrastructure**: Supabase Pro tier + Vercel
- **Cost**: <$100/month for 10,000 users

### Roadmap

**v0.1 (MVP)** - Current Focus

- Recipe CRUD operations
- Weekly calendar
- AI categorization
- Shopping list generation
- PDF/TXT export
- Basic authentication

**v0.2** - Post-MVP Enhancements

- Drag-and-drop calendar interactions
- Recipe templates
- OAuth social login (Google, Facebook)
- Enhanced mobile UX

**v1.0** - Production Release

- Performance optimizations
- Security audit
- Comprehensive testing
- User onboarding flow
- Analytics integration

## License

TBD - License to be determined

---

**Built with ❤️ using Astro, React, and AI**

For detailed technical documentation, see [CLAUDE.md](./CLAUDE.md).
