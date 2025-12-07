import express, { type Request, Response, NextFunction } from "express";
import { runMigrations } from 'stripe-replit-sync';
import { registerRoutes } from "./routes";
import { registerReferralRoutes } from "./referralRoutes";
import { setupVite, serveStatic, log } from "./vite";
import { getStripeSync } from "./stripeClient";
import { WebhookHandlers } from "./webhookHandlers";
import { referralWebhookHandler } from "./referralWebhookHandler";
import { isReferralEnabled } from "./featureFlags";

const app = express();

const isDeployed = process.env.REPLIT_DEPLOYMENT_ID || process.env.NODE_ENV === 'production';
console.log(`🌍 Environment: ${isDeployed ? 'DEPLOYED' : 'DEVELOPMENT'}`);
console.log(`📊 File size limits: 300MB total (direct S3 upload via presigned URLs)`);
console.log(`🎁 Referral system: ${isReferralEnabled() ? 'ENABLED' : 'DISABLED'}`);

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log('⚠️ DATABASE_URL not set, skipping Stripe initialization');
    return;
  }

  try {
    console.log('💳 Initializing Stripe schema...');
    await runMigrations({ databaseUrl });
    console.log('✅ Stripe schema ready');

    const stripeSync = await getStripeSync();

    console.log('🔗 Setting up managed webhook...');
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    const { webhook, uuid } = await stripeSync.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`,
      {
        enabled_events: ['*'],
        description: 'Managed webhook for Stripe sync and referrals',
      }
    );
    console.log(`✅ Webhook configured: ${webhook.url}`);

    console.log('📥 Syncing Stripe data in background...');
    stripeSync.syncBackfill()
      .then(() => console.log('✅ Stripe data synced'))
      .catch((err: Error) => console.error('❌ Error syncing Stripe data:', err));
  } catch (error) {
    console.error('❌ Failed to initialize Stripe:', error);
  }
}

app.post(
  '/api/stripe/webhook/:uuid',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        console.error('STRIPE WEBHOOK ERROR: req.body is not a Buffer');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      const { uuid } = req.params;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig, uuid);

      const event = JSON.parse(req.body.toString());
      
      if (event.type === 'checkout.session.completed' && isReferralEnabled()) {
        try {
          await referralWebhookHandler.handleCheckoutSessionCompleted(event.data.object);
        } catch (referralError) {
          console.error('Error processing referral webhook:', referralError);
        }
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

app.use((req, res, next) => {
  const contentLength = req.get('content-length');
  if (contentLength) {
    const sizeInMB = parseInt(contentLength) / (1024 * 1024);
    console.log(`📊 Incoming request: ${req.method} ${req.path} - Content-Length: ${contentLength} bytes (${sizeInMB.toFixed(2)}MB)`);
    
    const maxSizeForPath = req.path === '/api/upload-server-side' ? 300 : 50;
    
    if (sizeInMB > maxSizeForPath) {
      console.error(`❌ Request too large: ${sizeInMB.toFixed(2)}MB exceeds ${maxSizeForPath}MB limit for ${req.path}`);
      return res.status(413).json({ 
        message: `Request too large: ${sizeInMB.toFixed(2)}MB exceeds ${maxSizeForPath}MB limit.`,
        error: 'REQUEST_TOO_LARGE'
      });
    }
  }
  next();
});

app.use(express.json({ limit: '350mb' }));
app.use(express.urlencoded({ extended: false, limit: '350mb' }));
app.use(express.raw({ limit: '350mb', type: 'application/octet-stream' }));

app.use((req, res, next) => {
  if (req.path.includes('/upload')) {
    req.setTimeout(600000);
    res.setTimeout(600000);
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
  await initStripe();
  
  registerReferralRoutes(app);
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  server.maxHeadersCount = 0;
  server.timeout = 600000;
  server.keepAliveTimeout = 600000;
  server.headersTimeout = 610000;

  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
