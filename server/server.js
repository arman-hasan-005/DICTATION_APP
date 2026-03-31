/**
 * server.js — Production-hardened Express entry point
 *
 * Security layers added vs original:
 *   1. helmet()             — sets 11 security HTTP headers (XSS, MIME, clickjacking)
 *   2. mongoSanitize()      — strips $ and . from req.body/params (NoSQL injection)
 *   3. apiLimiter           — 200 req/15min per IP on all /api routes
 *   4. authLimiter          — 10 req/15min per IP on /api/auth routes
 *   5. morgan HTTP logging  — all requests logged via Winston
 *   6. Graceful shutdown    — SIGTERM/SIGINT close DB + server cleanly
 */

require("./src/config/env");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const morgan = require("morgan");
const connectDB = require("./src/config/db");
const routes = require("./src/routes/index");
const errorHandler = require("./src/middlewares/errorMiddleware");
const logger = require("./src/config/logger");
const { apiLimiter, authLimiter } = require("./src/config/rateLimiter");
const { port, isDev, clientUrl } = require("./src/config/env");

// ── Connect to MongoDB ─────────────────────────────────────────────────────────
connectDB();

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    // Allow inline styles (used by CSS Modules in production build)
    contentSecurityPolicy: false,
  }),
);

// ── CORS ───────────────────────────────────────────────────────────────────────
const allowedOrigins = isDev
  ? ["http://localhost:5173", "http://localhost:3000"]
  : [
      clientUrl, // your permanent Vercel URL
      /\.vercel\.app$/, // all Vercel preview deployments
    ].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const allowed = allowedOrigins.some((o) =>
        o instanceof RegExp ? o.test(origin) : o === origin,
      );
      if (allowed) return cb(null, true);
      cb(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  }),
);

// ── Request parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ── NoSQL injection protection ────────────────────────────────────────────────
app.use(mongoSanitize());

// ── HTTP request logging ──────────────────────────────────────────────────────
app.use(
  morgan(isDev ? "dev" : "combined", {
    stream: { write: (msg) => logger.http(msg.trim()) },
    // Skip health check pings from cluttering logs
    skip: (req) => req.url === "/" && req.method === "GET",
  }),
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use("/api", apiLimiter); // all API routes
app.use("/api/auth", authLimiter); // auth routes get stricter limit

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) =>
  res.json({
    status: "ok",
    message: "DictaClass API v2",
    env: isDev ? "development" : "production",
  }),
);

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api", routes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) =>
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` }),
);

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const server = app.listen(port, () => {
  logger.info(
    `Server running on http://localhost:${port} [${isDev ? "development" : "production"}]`,
  );
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", { reason });
});
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", { error: err.message, stack: err.stack });
  process.exit(1);
});
