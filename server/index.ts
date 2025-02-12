import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { serveStatic } from '@hono/node-server/serve-static';
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import fs from "fs/promises";
import { Bindings } from "./bindings";

const app = new Hono<{ Bindings: Bindings}>();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", cors());


// API Routes
registerRoutes(app);

// Serve static files and handle client-side routing
if (process.env.NODE_ENV !== 'production') {
  const publicPath = path.resolve(__dirname, '../dist/public');

  // Configure MIME types for static files
  const mimeTypes = {
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
  };

  // Serve static files with proper MIME types
  app.use('/assets/*', async (c, next) => {
    const filePath = c.req.path.replace('/assets/', '');
    const fullPath = path.join(publicPath, 'assets', filePath);
    const ext = path.extname(fullPath);

    try {
      const content = await fs.readFile(fullPath);
      return c.newResponse(content, 200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream'
      });
    } catch (error) {
      await next();
    }
  });

  // Serve other static files
  app.use('/*.ico', serveStatic({ root: publicPath }));
  app.use('/*.js', serveStatic({ root: publicPath }));
  app.use('/*.css', serveStatic({ root: publicPath }));

  // Serve index.html for all other routes (client-side routing)
  app.get('*', async (c) => {
    // Skip API routes
    if (c.req.url.startsWith('/api/')) {
      return c.next();
    }

    try {
      const indexPath = path.join(publicPath, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');
      return c.html(content);
    } catch (error) {
      console.error('Error serving index.html:', error);
      return c.text('Internal Server Error', 500);
    }
  });
}

// Error handling
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ message: err.message }, 500);
});

// Start server
const port = process.env.PORT || 5000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port: Number(port)
});