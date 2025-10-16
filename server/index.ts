import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";
import { sql } from "drizzle-orm";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`❌ Error: ${status} - ${message}`);
      res.status(status).json({ message });
    });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Initialize database tables
  try {
    log("🔄 Initializing database...");
    
    // Wait a moment for database connection to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "username" text NOT NULL,
        "password" text NOT NULL,
        "email" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "journal_entries" (
        "id" serial PRIMARY KEY NOT NULL,
        "content" text NOT NULL,
        "emotions" jsonb NOT NULL,
        "reflection" text,
        "timestamp" timestamp DEFAULT now() NOT NULL,
        "user_id" integer REFERENCES users(id)
      );
    `);
    
    // Add emotions column if it doesn't exist (migration)
    try {
      await db.execute(sql`
        ALTER TABLE "journal_entries" 
        ADD COLUMN IF NOT EXISTS "emotions" jsonb NOT NULL DEFAULT '[]'::jsonb;
      `);
    } catch (err) {
      log(`Migration note: ${err}`);
    }
    
    log("✅ Database initialized successfully!");
  } catch (error) {
    log(`⚠️ Database initialization warning: ${error}`);
    log("App will continue running - database may already be initialized");
  }

  //Always serve the app on the PORT provided by Railway or fallback to 8080
  // this serves both the API and the client.
  const port = Number(process.env.PORT) || 8080;
  
  server.listen(port, "0.0.0.0", () => {
    log(`✅ Server running on port ${port}`);
    log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    log(`🔗 Listening on: 0.0.0.0:${port}`);
  }).on('error', (err) => {
    log(`❌ Server startup error: ${err}`);
    log(`🔗 Listening on: http://localhost:${port}`);
  }).on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      log(`❌ Error: Port ${port} is already in use.`);
      log(`  Please stop the other process or use a different port.`);
    } else {
      log(`❌ Server startup error: ${err}`);
    }
    process.exit(1);
  });
} catch (error) {
  log(`❌ Application startup error: ${error}`);
  process.exit(1);
}
})();
