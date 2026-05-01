# 🚀 DevImpact


<p align="center">
  <a href="https://github.com/O2sa/DevImpact/blob/main/LICENSE">
    <img src="https://www.shieldcn.dev/github/license/O2sa/DevImpact.svg?variant=branded&size=sm" alt="License">
  </a>
  <a href="https://github.com/O2sa/DevImpact/stargazers">
    <img src="https://www.shieldcn.dev/github/stars/O2sa/DevImpact.svg?variant=branded&size=sm" alt="GitHub Stars">
  </a>
  <a href="https://github.com/O2sa/DevImpact/network/members">
    <img src="https://www.shieldcn.dev/github/forks/O2sa/DevImpact.svg?variant=branded&size=sm" alt="GitHub Forks">
  </a>
  <a href="https://github.com/O2sa/DevImpact/graphs/contributors">
    <img src="https://www.shieldcn.dev/github/contributors/O2sa/DevImpact.svg?variant=branded&size=sm&mode=dark" alt="Contributors">
  </a>
  <a href="https://github.com/O2sa/DevImpact/commits/main">
    <img src="https://www.shieldcn.dev/github/last-commit/O2sa/DevImpact.svg?variant=branded&size=sm" alt="Last commit">
  </a>
  <a href="https://github.com/O2sa/DevImpact/commits/main">
    <img src="https://www.shieldcn.dev/github/commits/O2sa/DevImpact.svg?variant=branded&size=sm" alt="Commits">
  </a>
  <a href="https://github.com/O2sa/DevImpact/issues">
    <img src="https://www.shieldcn.dev/github/open-issues/O2sa/DevImpact.svg?variant=branded&size=sm" alt="Open issues">
  </a>
  <a href="https://github.com/O2sa/DevImpact/pulls?q=is%3Apr+is%3Amerged">
    <img src="https://www.shieldcn.dev/github/merged-prs/O2sa/DevImpact.svg?variant=branded&size=sm" alt="Merged PRs">
  </a>
  <br />
  <br />

  <img src="https://www.shieldcn.dev/badge/Language-TypeScript-3178C6.svg?logo=typescript&variant=branded&size=sm&mode=dark" alt="Language · TypeScript">
  <img src="https://www.shieldcn.dev/badge/Framework-Next.js-000000.svg?logo=nextdotjs&variant=branded&size=sm&mode=dark" alt="Framework · Next.js">
  <img src="https://www.shieldcn.dev/badge/CSS-Tailwind-06B6D4.svg?logo=tailwindcss&variant=branded&size=sm&theme=blue" alt="CSS · Tailwind">
</p>


## Preview

<p align="center">
  <img src="./public/screenshots/screenshot.png" alt="DevImpact comparison tables and analytics chart" width="900">
</p>

**DevImpact** is an open-source platform that compares software developers based on their real impact in the open-source ecosystem — not just raw numbers.

It evaluates developers using a smart scoring system that considers:

- Repository quality 📦
- Pull request impact 🔀
- Community contributions 💬

---

## 🌟 Why DevImpact?

Traditional metrics (followers, stars, commit counts) are often misleading.

DevImpact focuses on:

- ✅ Quality over quantity
- ✅ Real contributions to valuable projects
- ✅ Fair comparison between developers

---

## 🧠 Scoring System Overview

Each developer is evaluated using three main scores:

### 📦 Repo Score (Builder Impact)

Measures the quality and impact of repositories owned by the user.

Factors include:

- Stars ⭐
- Forks 🍴
- Watchers

---

### 🔀 PR Score (Contribution Impact)

Measures contributions to **other developers' repositories**.

✔ Only merged PRs are counted
✔ PRs to the user's own repositories are excluded

Factors include:

- Target repository quality
- PR size (additions/deletions)
- Repository popularity
- Contribution diversity

---

### 💬 Contribution Score (Community Impact)

Measures community engagement.

Includes:

- Issues opened in external repositories
- Discussions participation

⚠️ Does NOT include commits or PRs (to avoid duplication)

---

### 🏆 Final Score

The final score is a weighted combination:

```
Final Score =
0.45 × Repo Score +
0.45 × PR Score +
0.10 × Contribution Score
```

👉 The ContributionScore is capped to prevent abuse.

---

## ⚖️ Key Design Principles

- ❌ No self-inflation (own PRs excluded)
- 📉 Diminishing returns to prevent spam
- 🎯 External impact is prioritized
- ⚖️ Balanced scoring between builders and contributors

---

## 🖥️ Features

- 🔍 Compare two GitHub users side-by-side
- 📊 Visual score breakdown (charts & insights)
- 🧠 Smart ranking system
- 🌍 Localization support (EN / AR)
- ⚡ Fast API powered by GitHub GraphQL
- 🧩 Extensible scoring system

---


## 🛠️ Tech Stack

### Frontend

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Recharts

### API

- Node.js + Express
- GitHub GraphQL API
- Octokit

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/O2sa/DevImpact.git
cd DevImpact
```

---

### 2. Install dependencies

```bash
pnpm install
```

---

### 3. Set up environment variables

Create a `.env` file:

```
GITHUB_TOKEN=your_github_token
```

---

### 4. Run the app

```bash
pnpm run dev
```

---

---

## 📡 API Example

The compare endpoint accepts one or more `username` query parameters.

### Example request

```bash
curl "api/compare?username=devimpact&username=octocat"
```

### Example response

```json
{
  "success": true,
  "users": [
    {
      "username": "octocat",
      "name": "The Octocat",
      "avatarUrl": "https://avatars.githubusercontent.com/u/583231?v=4",
      "repoScore": 87,
      "prScore": 64,
      "contributionScore": 42,
      "finalScore": 73,
      "topRepos": [],
      "topPullRequests": []
    }
  ]
}
```

## 🌍 Localization

- Supported languages: English 🇺🇸, Arabic 🇸🇦
- Automatically detects user language
- Allows manual switching
- Easy to add new languages via `/locales`

---

## 🤝 Contributing

Contributions are welcome!

### How to contribute:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

---

### Contribution ideas:

- Improve scoring algorithm
- Add new metrics
- Enhance UI/UX
- Add new languages 🌍

---

## ⚠️ Limitations

- GitHub API rate limits
- Some private contributions are not accessible
- Scoring system is heuristic (not perfect)

---

## 💡 Inspiration

DevImpact was created to answer a simple question:

> “Who really has more impact in open-source?”

---

## ⭐ Support

If you like this project:

- ⭐ Star the repo
- 🐛 Report issues
- 💡 Suggest features
