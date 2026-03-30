require("./src/config/env");
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const routes = require("./src/routes/index");
const errorHandler = require("./src/middlewares/errorMiddleware");
const { port, isDev } = require("./src/config/env");

connectDB();
const app = express();

app.use(
  cors({
    origin: isDev
      ? ["http://localhost:5173", "https://dictation-app-swart.vercel.app/"]
      : process.env.CLIENT_URL,
    credentials: true,
  }),
);

// Note: express.json must come BEFORE multer routes, but multer handles its own body parsing
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) =>
  res.json({ status: "ok", message: "DictaClass API 🎙️ v2" }),
);
app.use("/api", routes);

// 404
app.use((req, res) =>
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` }),
);

// Global error handler (handles multer errors too)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`\n🚀  Server: http://localhost:${port}`);
  console.log(`   Mode: ${isDev ? "development" : "production"}\n`);
});
