# Portfolio

Frontend portfolio built with **React**, **TypeScript**, **Vite**, **pnpm**, and **Ant Design**.

## Scripts

- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm preview` — preview production build locally
- `pnpm lint` — run ESLint

## Deploying to Vercel

1. **Link the GitHub repo** in the Vercel dashboard (Import → `asmikasatryan/portfolio`), and set the **Production Branch** to `main`.
2. After each `git push` to `main`, open **Deployments** and confirm a new build for the latest commit SHA (not an old one).
3. **Environment variables** (Settings → Environment Variables): add `VITE_GEMINI_API_KEY` and `VITE_DID_API_KEY`, then **Redeploy** so Vite embeds them at build time. The `.env` file is not committed.
4. If the UI still looks old, hard-refresh the site (Ctrl+Shift+R) or open it in a private window.

---

This project was bootstrapped with Vite. See the [Vite React + TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for ESLint and tooling notes.
