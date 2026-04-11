# 🤝 Contributing to DevImpact

Thank you for your interest in contributing to DevImpact! We welcome contributions from the community and are excited to work with you.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Coding Standards](#coding-standards)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## 📜 Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please be kind and constructive in all interactions.

---

## 🚀 Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/your-username/DevImpact.git
   cd DevImpact
   ```
3. **Add** the upstream remote:
   ```bash
   git remote add upstream https://github.com/O2sa/DevImpact.git
   ```

---

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- pnpm

### Install dependencies

```bash
pnpm install
```

### Set up environment variables

Create a `.env` file in the project root:

```
GITHUB_TOKEN=your_github_personal_access_token
```

> **Note:** Your GitHub token needs `read:user` and `public_repo` scopes.

### Run the development server

```bash
pnpm run dev
```

The app will be available at `http://localhost:3000`.

---

## 🔧 How to Contribute

### 1. Find an issue

- Browse [open issues](https://github.com/O2sa/DevImpact/issues)
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to let others know you're working on it

### 2. Create a branch

Always branch from `main`:

```bash
git checkout main
git pull upstream main
git checkout -b feat/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Make your changes

- Write clean, readable code
- Follow the existing code style
- Add comments where the logic is non-obvious

### 4. Test your changes

Make sure the app runs correctly with your changes:

```bash
pnpm run dev
```

### 5. Commit your changes

Use clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: add dark mode toggle"
# or
git commit -m "fix: correct score calculation for forked repos"
```

### 6. Push and open a PR

```bash
git push origin feat/your-feature-name
```

Then open a Pull Request on GitHub.

---

## ✅ Pull Request Guidelines

- **One PR per issue** — keep changes focused
- **Reference the issue** in your PR description: `Closes #123`
- **Write a clear description** of what changed and why
- **Keep diffs small** — large PRs are harder to review
- Be responsive to reviewer feedback

---

## 🎨 Coding Standards

- **TypeScript** — use proper types, avoid `any`
- **Tailwind CSS** — use utility classes; avoid inline styles
- **Components** — keep them small and focused (single responsibility)
- **File naming** — use kebab-case for files, PascalCase for components

---

## 🐛 Reporting Bugs

Found a bug? Please open an issue with:

1. A clear title and description
2. Steps to reproduce the bug
3. Expected vs actual behavior
4. Screenshots or error messages if available
5. Your environment (OS, Node.js version, browser)

---

## 💡 Suggesting Features

Have an idea? Open a feature request issue with:

1. A clear description of the feature
2. Why it would be useful
3. Any implementation ideas you have

---

## 🙌 Thank You

Every contribution — no matter how small — makes DevImpact better for everyone. We appreciate your time and effort!
