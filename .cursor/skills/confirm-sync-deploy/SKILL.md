---
name: confirm-sync-deploy
description: After Cursor-driven file edits, ask before staging, commit, push to GitHub, and Vercel deploy. Nothing runs without an explicit yes at the prompt.
---

# Confirm Sync Deploy

## Trigger

- Via project hooks on `afterFileEdit` and `afterTabFileEdit`.
- Optional **manual save**: workspace `.vscode/settings.json` uses **Run on Save** (`emeraldwalk.runonsave`, listed in `.vscode/extensions.json`). Install the recommended extension so the same script runs on save with `-TriggerPath` set to the saved file.

## Skipped paths (no prompt, no sync)

The hook/script exits early when the edited/saved file is treated as env or secret-related:

- `.env`, `.env.*`, or basename ending in `.env`
- Path contains a `secrets` or `secret` directory segment
- Basename contains `secret`, except typical source extensions (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`) to avoid false positives on component names

## Preconditions

- Git repository is initialized.
- Remote `origin` (GitHub) is configured.
- Vercel project is linked (`.vercel/project.json` exists).

## Workflow

1. Check for changes
   - If no changes, exit.
2. Confirm sync/deploy
   - Prompt: `Proceed with GitHub sync and Vercel deploy? (yes/no)`
   - If `no`, abort (no staging, commit, push, or Vercel).
   - If `yes`, continue.
3. Stage all files
   - `git add .`
4. Commit changes
   - `git commit -m "chore(confirm): update <timestamp>"`
5. Push to GitHub
   - `git push origin HEAD`
6. Deployment
   - Primary: rely on Vercel auto-deploy from GitHub.
   - Fallback: if deployment is not detected, run `vercel --prod`.

## Output

- Show current branch name.
- Show GitHub repository URL.
- Show Vercel deployment URL (or pending state).
- Confirm deployment started.

## Error Handling

- Skip empty commits.
- Retry push once if failed.
- Abort if HEAD is detached.

## Assistant

- After substantive work, **before** any GitHub or Vercel-related commands: ask the user about **both** pushing/syncing to GitHub **and** Vercel deployment (use the same prompt as the hook, or separate yes/no if they prefer).
- Terminal `git push` / `vercel` bypass file-edit hooks—asking in chat is mandatory.
