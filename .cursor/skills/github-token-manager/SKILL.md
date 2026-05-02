---
name: github-token-manager
description: >-
  Tracks GitHub token expiry, revokes expired tokens, and notifies the user with a link to generate a new token. Use when token_expiry occurs, when GitHub API, MCP, or git operations indicate an expired or invalid token, when comparing token expiry metadata to the current date, or when the user reports GitHub token expiry.
disable-model-invocation: false
---

# GitHub Token Manager

## Triggers

- `token_expiry`
- User reports an expired or invalid GitHub token
- GitHub API / MCP / git auth failures consistent with expiry
- `token.expiryDate` (or equivalent) is before today

## Actions

### 1. `revoke expired_token`

When a token is expired or confirmed invalid due to expiry:

- Stop using the credential immediately; do not paste or reuse the old token.
- Treat the token as revoked: revoke it in GitHub if the user still controls it (**Settings → Developer settings → Personal access tokens**, or the relevant OAuth/app settings) so leaked copies cannot be abused.
- Remove or update stored references (environment variables, MCP config, credential helpers) once the user provides a new token.

### 2. Notify (verbatim)

After handling expiry/revocation, notify the user with this message exactly (same words, same order, including the URL):

> Your GitHub token expired and was revoked. Generate a new one here: https://github.com/settings/tokens

## Principles

- Validate expiry against current date when metadata exists; if expiry is unknown, treat repeated auth failures as suspect.
- Never assume a new token was rotated without the user supplying or confirming the secret.
- After expiry, point the user to the same places the old token was configured (only document paths that exist in the repo or context).
