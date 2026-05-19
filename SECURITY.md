# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest on `main` | Yes |

## Reporting a Vulnerability

If you discover a security vulnerability in Research Nexus Score, please report it responsibly.

**Email:** [aadi@nexus-score.org](mailto:aadi@nexus-score.org)

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

I will respond within 72 hours and work with you to resolve the issue before any public disclosure.

## Scope

Research Nexus Score is a client-side application that queries public APIs (Crossref, OpenAlex, ORCID, ROR). It does not store user credentials or personal data. Security concerns are most likely to involve:

- API key exposure in client-side code
- Dependencies with known vulnerabilities
- XSS or injection in user-facing inputs (search, file upload)
