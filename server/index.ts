import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Log environment info
const isDeployed = process.env.REPLIT_DEPLOYMENT_ID || process.env.NODE_ENV === 'production';
console.log(`🌍 Environment: ${isDeployed ? 'DEPLOYED' : 'DEVELOPMENT'}`);
console.log(`📊 File size limits: 45MB (Replit infrastructure limit)`);

// Add raw body parser for debugging large requests
app.use((req, res, next) => {
  const contentLength = req.get('content-length');
  if (contentLength) {
    const sizeInMB = parseInt(contentLength) / (1024 * 1024);
    console.log(`📊 Incoming request: ${req.method} ${req.path} - Content-Length: ${contentLength} bytes (${sizeInMB.toFixed(2)}MB)`);
    
    if (sizeInMB > 45) {
      console.error(`❌ Request too large: ${sizeInMB.toFixed(2)}MB exceeds 45MB limit`);
      return res.status(413).json({ 
        message: `Request too large: ${sizeInMB.toFixed(2)}MB exceeds 45MB limit. Replit infrastructure limits uploads to 45MB.`,
        error: 'REQUEST_TOO_LARGE'
      });
    }
  }
  next();
});

app.use(express.json({ limit: '350mb' }));
app.use(express.urlencoded({ extended: false, limit: '350mb' }));
app.use(express.raw({ limit: '350mb', type: 'application/octet-stream' }));

// Increase timeout for large file uploads
app.use((req, res, next) => {
  // Set timeout to 10 minutes for upload endpoints
  if (req.path.includes('/upload')) {
    req.setTimeout(600000); // 10 minutes
    res.setTimeout(600000); // 10 minutes
  }
  next();
});

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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Configure server for large file uploads
  server.maxHeadersCount = 0;
  server.timeout = 600000; // 10 minutes
  server.keepAliveTimeout = 600000; // 10 minutes
  server.headersTimeout = 610000; // Slightly longer than keepAliveTimeout

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
