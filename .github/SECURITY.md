# Security

## Report a vulnerability

Use GitHub's private vulnerability-reporting option on the repository's **Security** page when it is enabled. If a private channel is not available, open a minimal issue asking the maintainers for a private reporting route without publishing exploit details or credentials.

Include the affected version or commit, impact, a reproducible description and a minimal demonstration when appropriate. Remove access tokens, personal data and unrelated service information from your report.

Ordinary interface bugs and feature requests can use public issues.

## Private provider configuration

- The private edition reads its author-controlled Cesium ion browser token from `src/core/api-config.js`. It has no API-key form and does not persist provider tokens in browser local storage.
- A browser-facing token is visible in the served JavaScript. Limit it to the required provider assets and permitted deployment origins; do not use account-administration or server-only credentials.
- Keep the configured private module out of public exports. The public RELIC repository retains a separate interface for each user's own key.
- Rotate or revoke the provider token at its provider when access changes or a token is disclosed. A source edit does not revoke the previous token or erase existing Git history.
- Keep environment files, service-account credentials, certificates, caches and logs out of Git. The blank `config/.env.example` documents only the server's separate JPL contact setting.
- Do not add public endpoints that return server-only credentials, and do not cache credential-bearing API responses in the application service worker.

## Hosted installations

Use HTTPS and an appropriate reverse proxy for a public server. Keep dependencies updated, limit upstream request concurrency and quotas, and retain the backend's validation and private-file access restrictions. A static deployment does not provide the Python endpoints; do not replace missing data with invented telemetry.
