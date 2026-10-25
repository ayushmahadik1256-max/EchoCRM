# EchoCRM — Voice-First Client Follow-Up Assistant

EchoCRM turns messy post-call voice notes into clean client follow-ups for freelance consultants, agency account managers, and B2B salespeople. 

Dictate unstructured stream-of-consciousness impressions right after hanging up with a client (or type/paste notes in the fallback editor). EchoCRM uses Google Gemini with structured outputs to convert raw dictation into 4 client-ready artifacts:
1. **Personalized Follow-Up Email**: Ready to send, with 1-click tone switching (Warm, Professional, Direct).
2. **Structured CRM Record**: Key pain points, objections, budget clues, timeline signals, decision makers, and agreed deliverables (with editable chip lists).
3. **Internal Team Handoff Notes**: 5–8 crisp bullet items for delivery leads and leadership.
4. **Calendar Next Steps**: Actionable task with an ISO due date resolved relative to today's date, and 1-click RFC 5545 `.ics` export.

---

## Key Features

- **Microphone Dictation with Web Speech API**: Live interim speech results, live-region accessibility announcements, and graceful fallback when microphone access is denied or unsupported.
  - *Browser support note*: Speech recognition works natively in Google Chrome and Microsoft Edge. Typed fallback is available on all platforms.
- **Audio File Upload & Transcription**: Drop an existing call recording (MP3, M4A, WAV, WebM, OGG, FLAC, MP4 — up to 14 MB) and Gemini transcribes it into the notes box, preserving speaker turns, numbers, and self-corrections. Toggle it from **Upload Audio Recording** on the New Debrief screen.
- **Custom Call Templates**: The **Manage** button on the Call Template card opens a template manager. Create, edit, and delete reusable templates with a name, description, default deal stage, preferred email tone, placeholder hint, and up to six guiding questions. Built-in templates remain available read-only; custom templates are stored per user in Firestore (`/templates`).
- **Server-Side Gemini 2.5 Flash**: All Gemini SDK calls happen on a dedicated Node/Express backend via `@google/genai`. API keys never touch the client bundle.
- **Structured JSON Schema**: Strict `responseSchema` guarantees 100% parseable JSON with zero hallucinated bracket placeholders or invented commitments.
- **User-Configurable Email Signature**: Set your custom closing sign-off, name, title, company, and contact info in Profile Settings. EchoCRM automatically appends your signature to all newly generated follow-ups and tone rewrites.
- **Tone Rewriting**: Switch email tone between Warm, Professional, and Direct in real time via `/api/generate` (`mode: "email_tone"`).
- **Google Sign-In & Firebase Cloud Storage**: visitors can use the entire workflow anonymously — landing page, dictation, audio upload, sample/instant demo, generated email/CRM/handoff/next-step artifacts, and `.ics`/prefilled calendar links. Sign-in is requested only for account-backed actions: **saving a debrief**, **opening history**, and **managing custom templates**. Debriefs, profiles, and custom templates are stored in Cloud Firestore and scoped to the signed-in user.
- **Action Items & Ledger**: KPI summary strip (Total, Open, Overdue, Due Today, Done), inline status toggling, search, filtering by deal stage and relative due dates.
- **Calendar Sync**: Three ways to schedule the generated next step —
  1. **Sync to Google** writes the event straight into the user's primary Google Calendar through the Calendar REST API (OAuth `calendar.events` scope, one consent prompt, no second save click).
  2. **Google Cal / Outlook** open a pre-filled event in the web UI (no OAuth).
  3. **Download .ics** exports a standard RFC 5545 file for Apple Calendar, Outlook Desktop, or any calendar app.


---

## Architecture

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Lucide React icons.
- **Backend**: Node.js + Express with `@google/genai` TypeScript SDK.
- **AI Model**: `gemini-2.5-flash` (configurable via `GEMINI_MODEL`).
- **Database & Auth**: Firebase Authentication (Google Sign-In) + Cloud Firestore with role-based security rules (`firestore.rules`).

---

## Environment Variables

Copy `.env.example` to `.env` for local development. For Vercel, add the same values under **Project Settings → Environment Variables** for Development, Preview, and Production.

| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` | **Required.** Google Gemini API key used by the backend. | — |
| `GEMINI_MODEL` | Gemini model name. | `gemini-2.5-flash` |
| `PORT` | Express server port (local / non-Vercel hosts). | `3000` |
| `APP_URL` | Hosted application URL. | Automatically injected |
| `VITE_FIREBASE_API_KEY` | Optional override of the Web App API key. | `firebase-applet-config.json` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Optional override of the Auth domain. | `firebase-applet-config.json` |
| `VITE_FIREBASE_PROJECT_ID` | Optional override of the project ID. | `firebase-applet-config.json` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Optional override of the Storage bucket. | `firebase-applet-config.json` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional override of the messaging sender ID. | `firebase-applet-config.json` |
| `VITE_FIREBASE_APP_ID` | Optional override of the Web App ID. | `firebase-applet-config.json` |
| `VITE_FIREBASE_DATABASE_ID` | Optional override of the Firestore database ID. | `ai-studio-8fba4b67-2817-4e9e-af30-7d50a209315d` |

---

## Firebase Configuration

The app already points at the Firebase project in `firebase-applet-config.json` (project `gen-lang-client-0810571149`, Firestore database `ai-studio-8fba4b67-2817-4e9e-af30-7d50a209315d`). The JSON is bundled into the frontend at build time, so **no Firebase environment variables are required to deploy**. Set `VITE_FIREBASE_*` only when you want to point the build at a different Firebase project; each value falls back to `firebase-applet-config.json` individually.

These settings are public Firebase Web App settings and are safe in the client bundle — access is controlled by Firestore rules and Auth authorized domains. Keep `GEMINI_API_KEY` server-side and never prefix it with `VITE_`.

### Firebase checklist

1. **Authentication → Sign-in method**: enable **Google**.
2. **Authentication → Settings → Authorized domains**: add `localhost`, your `*.vercel.app` domain, and any custom domain. Google Sign-In popups fail until this is done.
3. **Firestore → Rules**: deploy `firestore.rules` **to the named database** `ai-studio-8fba4b67-2817-4e9e-af30-7d50a209315d`. The Firebase Console only publishes rules to the `(default)` database, so use the CLI: `npx firebase-tools deploy --only firestore:rules` (already configured in `firebase.json`). The rules restrict each user's debriefs, profile, and templates to `request.auth.uid`.
4. Firestore's `(default)` database is **not** used by this app.

### What is stored where

| Data | Storage |
|---|---|
| Debriefs (transcript, email, CRM record, status) | Firestore `debriefs`, per `userId` |
| Profile + email signature | Firestore `users/{uid}` |
| Custom call templates | Firestore `templates`, per `userId` |
| Google Calendar OAuth token | `sessionStorage` only (browser session) |
| Audio recordings | Never stored — sent to Gemini for transcription only |

Firebase Storage, Cloud Messaging, and Analytics are not used. Firebase Auth persists the sign-in session in the browser (standard Firebase behavior); no application records live in `localStorage`. A debrief generated anonymously lives only in the current tab's memory until the visitor signs in and saves it.

### Google Calendar sync

Direct calendar sync uses OAuth with the `https://www.googleapis.com/auth/calendar.events` scope. To enable it:

1. In the [Google Cloud Console](https://console.cloud.google.com/) for the same project as the Firebase app, enable the **Google Calendar API**.
2. Open **APIs & Services → OAuth consent screen** and add `.../auth/calendar.events` to the scopes list. While the app is in *Testing*, add every Google account that will use it as a test user.
3. Confirm the Firebase authorized domains include the domain you are serving from (the OAuth popup uses that origin).

If any of those are missing, the **Sync to Google** button shows an inline error and the Google Cal / Outlook / .ics options still work. Access tokens are cached in `sessionStorage` for the browser session only; they are never persisted to Firestore.

---

## Run & Development Instructions

### Development
```bash
npm run dev
```
Starts the full-stack server on `http://localhost:3000`. Express handles `/api/*` endpoints and mounts Vite middleware for hot development.

### Production Build
```bash
npm run build
npm start
```

---

## Deploy to Vercel

The project is pre-configured for Vercel:

- `vercel.json` builds the Vite frontend into `dist` and adds an SPA fallback.
- `api/generate.ts`, `api/transcribe.ts`, and `api/health.ts` expose the Express handlers from `server/routes.ts` as serverless functions.
- `server.ts` is only used for local development and non-Vercel Node hosts (e.g. Render, Railway, a VPS).

### 1. Commit and push the repository

Deployments only include committed code — commit and push the working tree first:

```bash
git add -A
git commit -m "Firebase-backed EchoCRM with audio transcription, templates, and calendar sync"
git push
```

### 2. Import the project in Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
2. Keep the detected **Framework Preset: Vite**.
3. Build Command: `npm run build` (already set in `vercel.json`).
4. Output Directory: `dist` (already set in `vercel.json`).
5. Add the **one required** environment variable: `GEMINI_API_KEY` (set it for Production, Preview, and Development).
   - Optional: `GEMINI_MODEL`, and any `VITE_FIREBASE_*` override if you are pointing at a different Firebase project.
6. Click **Deploy**.

### 3. Finish the Firebase setup on the deployed URL

1. **Authorized domains** — Google Sign-In fails on the Vercel domain until it is added: Firebase Console → **Authentication → Settings → Authorized domains** → add `your-project.vercel.app` (and any custom domain).
   - Preview deployments get a unique URL per commit, and Firebase does not support wildcard entries. Either add the specific preview domain or demo from the production URL.
2. **Firestore rules** — this app uses a **named** database (`ai-studio-8fba4b67-2817-4e9e-af30-7d50a209315d`), and the Firebase Console can only publish rules to the `(default)` database. Deploy them with the Firebase CLI from the repo root:

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules
   ```

   `firebase.json` and `.firebaserc` are already configured for the named database. Use `npx firebase-tools deploy --only firestore:ai-studio-8fba4b67-2817-4e9e-af30-7d50a209315d` to target only that database. Without published rules, every read/write is denied; re-run the deploy whenever `firestore.rules` changes (the repo version is the source of truth).
3. **Calendar sync (optional)** — enable the Google Calendar API and add the `calendar.events` scope to the OAuth consent screen (see [Google Calendar sync](#google-calendar-sync)).

### 4. Verify the deployment

Open these after deploying:

- `https://your-project.vercel.app/api/health` → should return `{"status":"ok", ...}` with `"hasApiKey":true`.
- Open the root URL in a private window — the landing page should render and a debrief can be generated without signing in. Clicking **Save Debrief** or **Debrief History** should open the Google sign-in dialog.
- Sign in with Google, generate a debrief, save it, then reload — it should come back from Firestore.

### Deploy from the CLI (alternative)

```bash
npm i -g vercel
vercel login
vercel link
vercel env add GEMINI_API_KEY production
# Optional, only if you are NOT using firebase-applet-config.json:
# vercel env add VITE_FIREBASE_API_KEY production
# vercel env add VITE_FIREBASE_PROJECT_ID production
# ...etc
vercel --prod
```

### Important Vercel limits

- **Request body size: 4.5 MB.** Vercel rejects larger request bodies before they reach a function. The audio-upload UI accepts files up to 14 MB, so on Vercel only recordings under ~4.5 MB (roughly a few minutes of compressed audio) can be transcribed. For longer calls, upload the audio to Vercel Blob / S3 and send a URL, or call Gemini directly from the client with a short-lived token.
- **Function duration** is capped at 60 seconds in `vercel.json`. If generation times out on a large transcript, enable Fluid Compute or raise `maxDuration` (Pro plan allows more).
- **Streaming responses** are not supported by these functions; requests are standard JSON/raw responses.

---

## Microphone Permissions Note

For the preview iframe to capture microphone audio, `metadata.json` declares:
```json
{
  "requestFramePermissions": ["microphone"]
}
```
If using Safari or Firefox where Web Speech recognition is restricted, you can use the typed/pasted notes box or the **"Load sample call note"** button to test the end-to-end follow-up generation pipeline.
