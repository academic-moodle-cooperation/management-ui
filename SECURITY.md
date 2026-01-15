# Security Policy

## Supported Versions

We currently support the following versions of Management UI with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ Yes             |
| < 1.0   | ❌ No              |

## Reporting a Vulnerability

We take the security of this project seriously. If you find a security vulnerability, please do NOT open a public issue. Instead, please report it following these steps:

1.  **Email**: Send a detailed report to [INSERT SECURITY EMAIL ADDRESS].
2.  **Details**: Include a description of the vulnerability, steps to reproduce, and any potential impact.
3.  **Response**: We will acknowledge your report within 48 hours and provide a timeline for a fix.

## Our Security Process

- **Audit**: We perform regular dependency audits using `pnpm audit`.
- **Disclosure**: We follow a coordinated disclosure process. We will fix the issue and then publish a security advisory.
- **Updates**: Critical security fixes will be released as patch versions (e.g., 1.0.1).

## Secret Management

- **NEVER** commit secrets, API keys, or credentials to the repository.
- Use environment variables (`.env` files) for local development.
- For production, use a secure secret management system.

Thank you for helping keep Management UI secure!
