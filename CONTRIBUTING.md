> [!WARNING]
> **Important Note on AI-Generated Contributions**
>
> While we appreciate the use of AI as a productivity tool, pull requests consisting of code or documentation generated entirely by AI **without significant human review and testing** are not welcome.
>
> Every contributor is responsible for the code they submit. If we suspect a contribution is a "blind" AI generation that has not been verified for logic, security, or style, it will be closed without review.

---

# Contributing to DevImpact

Thank you for your interest in contributing to DevImpact! This guide will help you get started.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure & Architecture](#project-structure--architecture)
- [Making Changes](#making-changes)
- [Quality Assurance & Testing](#quality-assurance--testing)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Issue Guidelines](#issue-guidelines)
- [Coding Standards](#coding-standards)
- [Need Help?](#need-help)

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/your-username/DevImpact.git
   cd DevImpact
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/O2sa/DevImpact.git
   ```

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) package manager
- A [GitHub Personal Access Token](https://github.com/settings/tokens) with `read:user` and `repo` scopes
- Docker (optional, for local PostgreSQL and Redis)

### Installation

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create a `.env` file in the project root (see `.env.example`):

   ```
   GITHUB_TOKEN=your_github_token_here
   ```

3. (Optional) Start local database & Redis:

   ```bash
   pnpm db:up && pnpm redis:up
   ```

4. Start the development server:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure & Architecture

DevImpact uses a **Feature-Driven Architecture** inside `src/`. For in-depth design patterns, dependency diagrams, and feature anatomy, read our **[Architecture Guide (ARCHITECTURE.md)](ARCHITECTURE.md)**.

```
DevImpact/
├── ops/                     # Infrastructure, Dockerfiles, Cron & Deployment scripts
├── public/                  # Static assets, flags, screenshots
├── scripts/                 # CLI tools (DB migration, leaderboard worker, locale check)
├── src/
│   ├── app/                 # Next.js App Router (Pages, Layouts, API Route Handlers)
│   ├── components/          # Shared domain-agnostic UI (ui/, layout/, providers/, seo/)
│   ├── data/                # Static lookup datasets (countries, ISO codes)
│   ├── features/            # Feature-Driven Domain Modules
│   │   ├── comparison/      # Developer comparison logic & components
│   │   ├── developer/       # Developer profile view & metrics
│   │   ├── leaderboard/     # Country rankings, grids, and filters
│   │   └── scoring/         # Core scoring algorithms & formulas
│   ├── lib/                 # Shared infrastructure adapters (cache, db, geo, github, i18n, logger, seo)
│   ├── locales/             # i18n translation dictionaries (en.json, ar.json)
│   ├── middleware.ts        # Next.js middleware (locale detection)
│   ├── types/               # Global TypeScript definitions
│   └── utils/               # Low-level helpers (cn, formatting)
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

### Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Primitives**: Radix UI, Lucide React icons
- **Visualizations**: Recharts
- **Testing**: Vitest
- **Data & API**: Octokit GitHub GraphQL API, PostgreSQL, Redis

## Making Changes

1. **Sync your fork** with the latest upstream changes:

   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feat/your-feature-name
   ```

3. **Make your changes** and test them locally.

4. **Run the quality suite** before committing:

   ```bash
   # Run tests
   pnpm test

   # Run type check
   npx tsc --noEmit

   # Validate translation keys
   pnpm validate-locales

   # Run linter
   pnpm lint
   ```

5. **Commit your changes** with a clear message:

   ```bash
   git commit -m "feat: add your feature description"
   ```

6. **Push** to your fork and open a Pull Request.

### Commit Message Format

Use descriptive commit messages adhering to Conventional Commits:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `refactor:` for code refactoring
- `style:` for formatting changes (no logic change)
- `test:` for adding or updating tests

## Quality Assurance & Testing

- **Unit & Integration Tests**: Place feature tests inside `src/features/<feature-name>/tests/`. Run them using `pnpm test` or `pnpm test:watch`.
- **Type Checking**: Run `npx tsc --noEmit` to verify type safety and path alias imports.
- **Localization**: If you add UI text, add keys to both `src/locales/en.json` and `src/locales/ar.json`, then verify with `pnpm validate-locales`.

## Pull Request Guidelines

- Reference the related issue using `Fixes #<issue_number>` in the PR description
- Keep PRs focused on a single change or feature
- Ensure all quality checks pass (`pnpm test`, `npx tsc --noEmit`, `pnpm lint`)
- Test your changes locally before submitting
- Fill out the PR template provided
- Be responsive to review feedback

## Issue Guidelines

We use several issue templates:

- **Bug Report** - for reporting bugs
- **Feature Request** - for suggesting new features
- **Feature Change Request** - for modifying existing features
- **Documentation** - for documentation improvements
- **Refactoring** - for code quality improvements

When opening an issue, please use the appropriate template and provide as much detail as possible.

## Coding Standards

- **Feature-Driven Structure**: Keep feature-specific components, services, and tests inside `src/features/<feature-name>/`.
- **Path Aliases**: Always use configured aliases (e.g., `@/features/scoring`, `@/lib/github`, `@/components/ui`) instead of relative paths (`../../`).
- **Encapsulation**: Import other features only via their public index barrel export (`@/features/<feature-name>`).
- **TypeScript**: Use strict types. Avoid `any` where possible.
- **Components**: Keep components small and focused. Use `src/components/ui/` only for domain-agnostic reusable UI elements.
- **Styling**: Use Tailwind CSS utility classes with theme tokens (`bg-card`, `text-foreground`, `border-border`) to guarantee dark/light mode compatibility.
- **API calls**: Use the shared GitHub API client in `src/lib/github` and caching in `src/lib/cache`.
- **File naming**: Use kebab-case for files (e.g., `compare-form.tsx`, `score-engine.ts`).

## Need Help?

- Read the **[Architecture Guide (ARCHITECTURE.md)](ARCHITECTURE.md)**
- Check the [open issues](https://github.com/O2sa/DevImpact/issues) for tasks you can work on
- Look for issues labeled `good first issue` for beginner-friendly tasks
- Open a new issue if you have questions or suggestions

## License

By contributing to DevImpact, you agree that your contributions will be licensed under the [MIT License](LICENSE).
