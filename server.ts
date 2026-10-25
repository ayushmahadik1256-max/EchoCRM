import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createApp } from './server/app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = createApp();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';
  const httpServer = createServer(app);

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback handler for any client-side navigation requests
    app.use('*', async (req, res, next) => {
      // Ignore API routes so they don't return HTML
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const fs = await import('fs/promises');
        let template = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`EchoCRM server running on http://0.0.0.0:${PORT} [${isDev ? 'development' : 'production'}]`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server error:', err);
  process.exit(1);
});
