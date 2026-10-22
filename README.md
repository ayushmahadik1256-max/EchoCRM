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
- **Server-Side Gemini 2.5 Flash**: All Gemini SDK calls happen on a dedicated Node/Express backend via `@google/genai`. API keys never touch the client bundle.
- **Structured JSON Schema**: Strict `responseSchema` guarantees 100% parseable JSON with zero hallucinated bracket placeholders or invented commitments.
- **User-Configurable Email Signature**: Set your custom closing sign-off, name, title, company, and contact info in Profile Settings. EchoCRM automatically appends your signature to all newly generated follow-ups and tone rewrites.
- **Tone Rewriting**: Switch email tone between Warm, Professional, and Direct in real time via `/api/generate` (`mode: "email_tone"`).
- **Guest / Demo Mode & Firebase Cloud Sync**:
  - Without signing in, debriefs and profile settings persist locally in browser `localStorage`.
  - When signing in with Google, debriefs and profile settings persist securely in Firebase Firestore (`/users/{userId}`).
  - An import prompt automatically offers to migrate any guest debriefs into the user's Firestore database upon sign-in.
- **Action Items & Ledger**: KPI summary strip (Total, Open, Overdue, Due Today, Done), inline status toggling, search, filtering by deal stage and relative due dates.
- **Calendar Download (.ics)**: Exports standard RFC 5545 `.ics` calendar events with escaped text, UID, and DTSTAMP.


---

## Architecture

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Lucide React icons.
- **Backend**: Node.js + Express with `@google/genai` TypeScript SDK.
- **AI Model**: `gemini-2.5-flash` (configurable via `GEMINI_MODEL`).
- **Database & Auth**: Firebase Authentication (Google Sign-In) + Cloud Firestore with role-based security rules (`firestore.rules`).

---

## Environment Variables

Configure these in `.env` (or via the AI Studio Secrets panel):

| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` | **Required.** Google Gemini API key used by the backend. | — |
| `GEMINI_MODEL` | Gemini model name. | `gemini-2.5-flash` |
| `PORT` | Express server port. | `3000` |
| `APP_URL` | Hosted application URL. | Automatically injected |

---

## Firebase Configuration

Firebase connection settings are stored in `firebase-applet-config.json` and provisioned automatically:
- `projectId`
- `authDomain`
- `apiKey`
- `firestoreDatabaseId`

Security rules in `firestore.rules` ensure users can only read, write, update, and delete documents where `userId == request.auth.uid`.

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

## Microphone Permissions Note

For the preview iframe to capture microphone audio, `metadata.json` declares:
```json
{
  "requestFramePermissions": ["microphone"]
}
```
If using Safari or Firefox where Web Speech recognition is restricted, you can use the typed/pasted notes box or the **"Load sample call note"** button to test the end-to-end follow-up generation pipeline.
