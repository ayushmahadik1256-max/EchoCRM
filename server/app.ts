import express from 'express';
import { registerRoutes } from './routes';

/**
 * Builds the Express application used by the standalone server and by the
 * Vercel serverless functions.
 */
export function createApp() {
  const app = express();
  registerRoutes(app);
  return app;
}
