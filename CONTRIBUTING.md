# Contributing to Research Nexus Score

Thank you for your interest in contributing to Research Nexus Score! This project aims to improve metadata coverage across the scholarly communication ecosystem, and we welcome contributions of all kinds.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project follows a simple code of conduct: be respectful, inclusive, and constructive. We're all here to improve scholarly communication infrastructure together.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- pnpm 10 or higher
- Git

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/nexus-score.git
   cd nexus-score
   ```

3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/aadivar/nexus-score.git
   ```

4. **Install dependencies**:
   ```bash
   pnpm install
   ```

5. **Build all packages**:
   ```bash
   pnpm build
   ```

6. **Create environment file**:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   # Edit .env.local with your email for Crossref API
   ```

7. **Start development server**:
   ```bash
   pnpm dev
   ```

## How to Contribute

### Types of Contributions

We welcome many types of contributions:

- **Bug fixes**: Found something broken? Fix it!
- **Features**: Have an idea for improvement? Implement it!
- **Documentation**: Help others understand the project
- **Tests**: Improve code coverage and reliability
- **Scoring methodology**: Propose new metrics or dimensions
- **UI/UX improvements**: Make the web app more user-friendly
- **MCP tools**: Add new tools for AI assistant integration

### Good First Issues

Look for issues labeled `good first issue` - these are specifically chosen to be approachable for new contributors.

## Development Workflow

### Project Structure

```
nexus-score/
├── apps/
│   └── web/              # Next.js web application
├── packages/
│   ├── core/             # Scoring library
│   └── mcp-server/       # MCP server for AI assistants
```

### Working on Different Parts

#### Web Application (`apps/web`)

```bash
cd apps/web
pnpm dev
```

The web app runs on `http://localhost:3000`.

#### Core Library (`packages/core`)

```bash
cd packages/core
pnpm build
pnpm test
```

Changes to the core library require rebuilding before they're reflected in the web app.

#### MCP Server (`packages/mcp-server`)

```bash
pnpm mcp
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @nexus-score/core test
```

### Linting

```bash
# Lint all packages
pnpm lint

# Fix auto-fixable issues
pnpm lint --fix
```

## Pull Request Process

### Before You Start

1. **Check existing issues and PRs** to avoid duplicate work
2. **Create an issue** for significant changes to discuss the approach
3. **Keep PRs focused** - one feature or fix per PR

### Creating a Pull Request

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Test your changes**:
   ```bash
   pnpm build
   pnpm test
   pnpm lint
   ```

4. **Commit with a clear message**:
   ```bash
   git commit -m "Add: brief description of your change"
   ```

   Use prefixes like:
   - `Add:` for new features
   - `Fix:` for bug fixes
   - `Update:` for improvements
   - `Docs:` for documentation
   - `Refactor:` for code refactoring

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** on GitHub

### PR Checklist

- [ ] Code builds without errors (`pnpm build`)
- [ ] Tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] PR has a clear description of changes
- [ ] Documentation updated if needed

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Prefer `interface` over `type` for object shapes
- Use explicit return types for functions

### React/Next.js

- Use functional components with hooks
- Prefer Server Components where possible
- Use Tailwind CSS for styling
- Follow Next.js App Router conventions

### General

- Write self-documenting code with clear names
- Add comments for complex logic
- Keep functions small and focused
- Avoid premature optimization

### File Naming

- React components: `PascalCase.tsx`
- Utilities: `kebab-case.ts`
- Types: `types.ts` or inline

## Reporting Bugs

### Before Reporting

1. Check if the bug is already reported in [Issues](https://github.com/aadivar/nexus-score/issues)
2. Try to reproduce with the latest version

### Bug Report Template

```markdown
**Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen.

**Actual Behavior**
What actually happens.

**Environment**
- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 120]
- Node.js: [e.g., 20.10.0]

**Screenshots**
If applicable, add screenshots.
```

## Suggesting Features

We love feature suggestions! Please create an issue with:

- **Problem statement**: What problem does this solve?
- **Proposed solution**: How would you like it to work?
- **Alternatives considered**: Other approaches you thought of
- **Additional context**: Mockups, examples, etc.

## Scoring Methodology Contributions

If you want to propose changes to the scoring methodology:

1. **Research**: Understand the current methodology in `packages/core/src/scoring/`
2. **Justify**: Explain why the change improves metadata coverage measurement
3. **Document**: Update the methodology documentation
4. **Implement**: Make the code changes
5. **Analyze**: Show impact on existing scores (sample publishers)

## Questions?

- Open a [Discussion](https://github.com/aadivar/nexus-score/discussions) for questions
- Email: varma2friend@gmail.com
- LinkedIn: [@aadi-narayana-varma-dantuluri](https://www.linkedin.com/in/aadi-narayana-varma-dantuluri-62332b105/)

---

Thank you for contributing to Research Nexus Score and helping improve scholarly metadata coverage!
