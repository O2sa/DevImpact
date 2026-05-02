# Security Policy

## Supported Versions

We actively provide security updates for the following versions of DevImpact:

| Version | Supported          |
| ------- | ------------------ |
| Main    | ✅ Yes             |
| < 1.0.0 | ❌ No              |

## Reporting a Vulnerability

We take the security of DevImpact seriously. If you discover a security vulnerability, please do not open a public issue. Instead, follow the steps below:

### How to report
1. **Email:** Please send a detailed report to osama.f.mabkhot@gmail.com or use GitHub's Private Vulnerability Reporting.
2. **Details:** Include a description of the vulnerability, steps to reproduce, and the potential impact.
3. **Response:** You can expect an acknowledgment within 48 hours.

### Scope
This policy covers the core DevImpact application, its scoring logic, and how it handles the `GITHUB_TOKEN`. It does not cover the GitHub API itself or third-party dependencies (though we appreciate reports regarding how we use them).

## Best Practices for Contributors
To keep this project secure, please keep the following in mind:
*   **Environment Variables:** Never commit your `.env` file. It contains your `GITHUB_TOKEN`.
*   **Data Sanitization:** Ensure all data fetched from the GitHub GraphQL API is sanitized before being rendered in the UI to prevent XSS.
*   **Dependency Updates:** We use automated tools to keep our dependencies up to date. Please ensure your PRs do not introduce insecure or outdated packages.

## Security Controls
*   **Code Scanning:** We use GitHub Actions to run automated security scans on every Pull Request.
*   **Secret Scanning:** GitHub's secret scanning is enabled to prevent the accidental leak of tokens.

---
*Thank you for helping keep DevImpact safe for the open-source community!*
