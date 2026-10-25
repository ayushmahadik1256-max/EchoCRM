import express from 'express';
import { generateHandler, jsonBodyParser } from '../server/routes';

const app = express();

app.use(jsonBodyParser);
// Vercel routes /api/generate here; the bare path keeps rewrites working too.
app.post(['/api/generate', '/generate'], generateHandler);

export default app;
