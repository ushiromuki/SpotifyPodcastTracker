import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { registerRoutes } from "./routes";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", cors());

// Register routes
registerRoutes(app);

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