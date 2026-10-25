import express from 'express';
import { healthHandler } from '../server/routes';

const app = express();

app.get(['/api/health', '/health'], healthHandler);

export default app;
