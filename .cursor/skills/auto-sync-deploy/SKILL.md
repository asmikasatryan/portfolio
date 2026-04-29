---
name: auto-sync-deploy
description: Run git add/commit/push and trigger Vercel deployment automatically on Save All.
---

# Auto Sync Deploy

## Trigger

- Via project hooks on `afterFileEdit` and `afterTabFileEdit`.
- This tracks Cursor-driven edits/saves (not a generic VS Code manual Save All event).

## Preconditions

- Git repository is initialized.
- Remote `origin` (GitHub) is configured.
- Vercel project is linked (`.vercel/project.json` exists).

## Workflow

1. Check for changes
   - If no changes, exit.
2. Stage all files
   - `git add .`
3. Commit changes
   - `git commit -m "chore(auto): update <timestamp>"`
4. Push to GitHub
   - `git push origin HEAD`
5. Deployment
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
