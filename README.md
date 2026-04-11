# 🚀 DevImpact
![License](https://img.shields.io/github/license/o2sa/devimpact)
![Stars](https://img.shields.io/github/stars/o2sa/devimpact)
![Forks](https://img.shields.io/github/forks/o2sa/devimpact)
![Issues](https://img.shields.io/github/issues/o2sa/devimpact)
![Pull Requests](https://img.shields.io/github/issues-pr/o2sa/devimpact)
![Last Commit](https://img.shields.io/github/last-commit/o2sa/devimpact)

![Next.js](https://img.shields.io/badge/Next.js-16+-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-green?logo=node.js)
![GraphQL](https://img.shields.io/badge/GraphQL-pink?logo=graphql)


**DevImpact** is an open-source platform that compares software developers based on their real impact in the open-source ecosystem — not just raw numbers.

It evaluates developers using a smart scoring system that considers:

* Repository quality 📦
* Pull request impact 🔀
* Community contributions 💬

---

## 🌟 Why DevImpact?

Traditional metrics (followers, stars, commit counts) are often misleading.

DevImpact focuses on:

* ✅ Quality over quantity
* ✅ Real contributions to valuable projects
* ✅ Fair comparison between developers

---

## 🧠 Scoring System Overview

Each developer is evaluated using three main scores:

### 📦 Repo Score (Builder Impact)

Measures the quality and impact of repositories owned by the user.

Factors include:

* Stars ⭐
* Forks 🍴
* Watchers

---

### 🔀 PR Score (Contribution Impact)

Measures contributions to **other developers' repositories**.

✔ Only merged PRs are counted
✔ PRs to the user's own repositories are excluded

Factors include:

* Target repository quality
* PR size (additions/deletions)
* Repository popularity
* Contribution diversity

---

### 💬 Contribution Score (Community Impact)

Measures community engagement.

Includes:

* Issues opened in external repositories
* Discussions participation

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

* ❌ No self-inflation (own PRs excluded)
* 📉 Diminishing returns to prevent spam
* 🎯 External impact is prioritized
* ⚖️ Balanced scoring between builders and contributors

---

## 🖥️ Features

* 🔍 Compare two GitHub users side-by-side
* 📊 Visual score breakdown (charts & insights)
* 🧠 Smart ranking system
* 🌍 Localization support (EN / AR)
* ⚡ Fast API powered by GitHub GraphQL
* 🧩 Extensible scoring system

---

## 🛠️ Tech Stack

### Frontend

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* Recharts

### API

* Node.js + Express
* GitHub GraphQL API
* Octokit

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

## 🌍 Localization

* Supported languages: English 🇺🇸, Arabic 🇸🇦
* Automatically detects user language
* Allows manual switching
* Easy to add new languages via `/locales`

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

* Improve scoring algorithm
* Add new metrics
* Enhance UI/UX
* Add new languages 🌍

---

## ⚠️ Limitations

* GitHub API rate limits
* Some private contributions are not accessible
* Scoring system is heuristic (not perfect)

---


## 💡 Inspiration

DevImpact was created to answer a simple question:

> “Who really has more impact in open-source?”

---

## ⭐ Support

If you like this project:

* ⭐ Star the repo
* 🐛 Report issues
* 💡 Suggest features

