# Contributing to Management UI

First off, thank you for considering contributing to the Management UI! It's people like you that make this a great platform for the video management community.

This project is a modular, plugin-based platform designed for extensibility. Before you start, please take a moment to read through this guide.

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20 or higher
- **pnpm**: v10.4.1 or higher
- **Java**: Required for backend development (Maven)

### Initial Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-org/management-ui.git
    cd management-ui
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

3.  **Run the development server**:
    ```bash
    # Starts all applications and packages in dev mode
    pnpm dev
    ```

## 🏗️ Architecture Overview

The project is a monorepo managed with **Turborepo** and **pnpm workspaces**.

- **`/apps`**: Main entry point applications (e.g., `management-ui-core`).
- **`/packages`**: Shared infrastructure, UI components, and logic.
- **`/plugins`**: Domain-specific extensions (e.g., `series`, `episodes`).
- **`/backend`**: Java/Maven based backend services.

### Plugin-First Philosophy

Everything in this UI is built to be extensible. We use a **Plugin System** that allows you to override UI components, add new routes, and inject custom logic without touching the core packages.

For more details, see:
- [Plugin System Documentation](packages/plugin-system/README.md)
- [Architecture Decision Records](docs/architecture/)

## 🛠️ Development Workflows

We have detailed step-by-step guides for common tasks in the `docs/workflows/` directory:

- [Adding a New App](docs/workflows/ADDING_APPS.md)
- [Adding a New Package](docs/workflows/ADDING_PACKAGES.md)
- [Adding a New Plugin](docs/workflows/ADDING_PLUGINS.md)
- [Updating Dependencies](docs/workflows/UPDATING_DEPENDENCIES.md)
- [Swapping Technologies](docs/workflows/SWAPPING_TECHNOLOGIES.md)

## 🎨 Coding Standards

### TypeScript

- We use **Strict Mode** TypeScript. Avoid `any` whenever possible.
- If you must use a workaround, document it with a comment explaining why.

### Linting & Formatting

- **ESLint**: Run `pnpm lint` to check for code quality issues.
- **Prettier**: Run `pnpm format` to ensure consistent code style.
- **CI Enforcement**: Our GitHub Actions will fail if there are any linter errors or formatting issues.

### Testing

- We use **Vitest** for unit and integration tests.
- Add tests for any new logic or components.
- Run tests with `pnpm test`.

## 📥 Submitting a Pull Request

1.  **Create a branch**: Use a descriptive name like `feat/new-upload-filter` or `fix/sidebar-overlap`.
2.  **Commit your changes**: Follow the existing commit message style (e.g., `feat: add new metadata field`).
3.  **Validate your code**: Run `pnpm check-types && pnpm lint && pnpm test` before pushing.
4.  **Open a PR**: Use the provided template to describe your changes.

## 📄 Code of Conduct

Please be respectful and professional in all interactions. We follow the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

## 🛡️ Security

If you find a security vulnerability, please do NOT open a public issue. See our [Security Policy](SECURITY.md) for reporting instructions.

---

Thank you for your contribution!
