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
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
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

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create a `.env` file in the project root (see `.env.example`):
   ```
   GITHUB_TOKEN=your_github_token_here
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
DevImpact/
├── app/              # Next.js App Router pages and API routes
├── components/       # Reusable React components
├── lib/              # Utility functions, GitHub API client, scoring logic
├── types/            # TypeScript type definitions
├── .github/          # Issue templates, PR template, workflows
├── tailwind.config.ts
├── next.config.js
└── tsconfig.json
```

### Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Lucide React icons
- **Charts**: Recharts
- **API**: GitHub GraphQL API via Octokit

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

4. **Run the linter** before committing:
   ```bash
   pnpm lint
   ```

5. **Commit your changes** with a clear message:
   ```bash
   git commit -m "feat: add your feature description"
   ```

6. **Push** to your fork and open a Pull Request.

### Commit Message Format

Use descriptive commit messages with a prefix:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `refactor:` for code refactoring
- `style:` for formatting changes (no logic change)
- `test:` for adding or updating tests

## Pull Request Guidelines

- Reference the related issue using `Fixes #<issue_number>` in the PR description
- Keep PRs focused on a single change
- Make sure the linter passes (`pnpm lint`)
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

- **TypeScript**: Use proper types. Avoid `any` where possible.
- **Components**: Keep components small and focused. Use the `components/` directory for reusable UI elements.
- **Styling**: Use Tailwind CSS utility classes. Follow the existing patterns in the codebase.
- **API calls**: Use the existing GitHub API client in `lib/` rather than creating new API integrations.
- **File naming**: Use kebab-case for files (e.g., `compare-form.tsx`).

## Need Help?

- Check the [open issues](https://github.com/O2sa/DevImpact/issues) for tasks you can work on
- Look for issues labeled `good first issue` for beginner-friendly tasks
- Open a new issue if you have questions or suggestions

## License

By contributing to DevImpact, you agree that your contributions will be licensed under the [MIT License](LICENSE).
