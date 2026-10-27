# EchoCRM — Voice First Client Follow Up Assistant

EchoCRM turns call notes into a follow up email, CRM summary, internal handoff, and calendar task. It includes speech input, audio transcription, editable templates, debrief history, and export tools.

## Features

- Dictate, type, or upload an audio recording.
- Generate client ready follow ups and structured call notes with Gemini.
- Edit and export emails, CRM records, handoffs, and calendar tasks.
- Save debriefs, custom templates, profile details, and preferences in this browser.
- Use the app without an account. Browser data does not sync to other devices and can be exported from Settings.

## Run locally

Use Node.js 22, then install dependencies and create a local environment file:

```bash
npm ci
Copy-Item .env.example .env
```

Set `GEMINI_API_KEY` in `.env`, then start the full stack development server:

```bash
npm run dev
```

Open `http://localhost:3000`. Keep `.env` private. It is ignored by Git. The Gemini key is read only by the server and must never use a `VITE_` prefix or be placed in frontend code.

## Deploy from GitHub

GitHub stores the source code. Deploy the full app through Vercel connected to the GitHub repository. GitHub Pages only hosts static files and cannot run the private Gemini API backend used for generation and transcription.

1. Push this repository to GitHub. Confirm `.env` is not staged or tracked.
2. In Vercel, import the GitHub repository and use the detected Vite preset. The build command is `npm run build`; the output directory is `dist`.
3. In Vercel Project Settings, add `GEMINI_API_KEY` as an environment variable for Production, Preview, and Development. Optionally add `GEMINI_MODEL`.
4. Deploy. Vercel will build and deploy each push to the connected branch.
5. Check `/api/health` on the deployed domain. It should report `status: ok` and `hasApiKey: true` without returning the key itself.

The API key stays in Vercel's server environment. Do not add it to GitHub source files, GitHub Pages configuration, frontend `VITE_*` variables, screenshots, or commit history. If a key was previously committed or shared, revoke it and create a replacement before deployment. Visitors' generation requests use your configured Gemini account and may incur charges, so set provider usage limits before sharing the public app.

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `GEMINI_API_KEY` | Yes | Server-only key for Gemini generation and audio transcription. |
| `GEMINI_MODEL` | No | Gemini model name; defaults to `gemini-2.5-flash`. |
| `PORT` | No | Local standalone server port; defaults to `3000`. |

## Architecture

- Frontend: React, TypeScript, Vite, Tailwind CSS.
- Backend: Express API handlers under `api/` and `server/`.
- AI: Gemini SDK calls run on the server. The browser calls `/api/generate` and `/api/transcribe` and never receives the Gemini key.
- Persistence: `localStorage` for debriefs, custom templates, and profile preferences.

## Scripts

- `npm run dev` — run Express and Vite for local development.
- `npm run build` — build the frontend for deployment.
- `npm run lint` — run TypeScript checking.
- `npm start` — start the production Express server on a Node host.

## Notes

Audio uploads to Vercel are limited by the platform's request size limit. For larger recordings, use a smaller compressed file. Browser speech recognition support varies; typed notes are available as a fallback.
