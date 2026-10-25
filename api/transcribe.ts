import express from 'express';
import { rawAudioBodyParser, transcribeHandler } from '../server/routes';

const app = express();

// Audio is uploaded as a raw body, so no JSON parser on this function.
app.use(rawAudioBodyParser);
app.post(['/api/transcribe', '/transcribe'], transcribeHandler);

export default app;
