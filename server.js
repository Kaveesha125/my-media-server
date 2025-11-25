const express = require("express");
const fs = require("fs");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const cors = require("cors");
const os = require("os");
const qrcode = require("qrcode-terminal");
const crypto = require("crypto");
const readline = require("readline");

// --- ENCRYPTION AND HASHING HELPERS ---
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update("myflix_super_secret_key_2025_ultimate")
  .digest("base64")
  .substring(0, 32);
const IV = Buffer.from("myflix_init_vect");
const algorithm = "aes-256-cbc";

const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

const encryptConfig = (text) => {
  const cipher = crypto.createCipheriv(algorithm, ENCRYPTION_KEY, IV);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};

const decryptConfig = (text) => {
  try {
    const decipher = crypto.createDecipheriv(algorithm, ENCRYPTION_KEY, IV);
    let decrypted = decipher.update(text, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    // If decryption fails, we assume the file is corrupt/unreadable
    return null;
  }
};

const writeEncryptedConfig = (cfg) => {
  const encryptedData = encryptConfig(JSON.stringify(cfg, null, 2));
  fs.writeFileSync(CONFIG_FILE, encryptedData, "utf8");
};

// --- CONFIG PATHS ---
const APP_DATA_DIR = path.join(os.homedir(), ".myflix");
const CONFIG_FILE = path.join(APP_DATA_DIR, "config.json");
const SESSION_DIR = path.join(APP_DATA_DIR, "sessions");

if (!fs.existsSync(APP_DATA_DIR))
  fs.mkdirSync(APP_DATA_DIR, { recursive: true });
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

// --- STARTUP FLOW FUNCTIONS ---

// Interactive CLI for configuration editing/reset
// Interactive CLI for configuration editing/reset
const runSetup = (existingConfig = {}) => {
  // FIX: Safely ensure existingConfig is an object, not null/undefined
  const configToUse = existingConfig || {};

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const currentUsername = configToUse.username || "admin"; // Use safe configToUse
    const currentPort = configToUse.port || 8080;

    console.log("---------------------------------------------------");
    console.log("⚙️ CONFIGURATION / PASSWORD RESET");
    console.log("---------------------------------------------------");
    console.log(`Current Media Path: ${process.cwd()}`);
    console.log(`Current Port: ${currentPort}`);
    console.log("---------------------------------------------------");

    rl.question(
      `Enter NEW Username (Default: ${currentUsername}): `,
      (username) => {
        rl.question("Enter NEW Password: ", (password) => {
          rl.question(
            `Enter Server Port (Default: ${currentPort}): `,
            (port) => {
              rl.close();

              const newConfig = {
                // Merge existing settings with new inputs
                ...configToUse,
                port: parseInt(port) || currentPort,
                username: username.trim() || currentUsername,
                passwordHash: hashPassword(password),
                mediaFolder: process.cwd(),
                sessionDays: 7,
              };

              writeEncryptedConfig(newConfig);
              console.log("\n✅ Configuration saved and encrypted.");
              resolve(newConfig);
            }
          );
        });
      }
    );
  });
};

const loadConfig = () => {
  try {
    const encryptedData = fs.readFileSync(CONFIG_FILE, "utf8");
    const decryptedData = decryptConfig(encryptedData);
    const cfg = JSON.parse(decryptedData);

    if (!/^[0-9a-fA-F]{64}$/.test(cfg.passwordHash)) {
      console.error(
        "\n❌ ERROR: Password hash in config is corrupted. Restart with --setup."
      );
      process.exit(1);
    }
    return cfg;
  } catch (e) {
    if (e.code === "ENOENT") return null;
    console.error(
      "\n❌ ERROR: Failed to decrypt or parse config file. Restart with --setup."
    );
    process.exit(1);
  }
};

// --- SERVER SETUP ---
const app = express();
let config;
let MEDIA_ROOT;
let PORT;

// Helper to prevent accessing files outside MEDIA_ROOT
const getSafePath = (reqPath) => {
  const targetPath = reqPath ? path.join(MEDIA_ROOT, reqPath) : MEDIA_ROOT;
  if (!targetPath.startsWith(MEDIA_ROOT)) return null;
  return targetPath;
};

// Middleware to protect routes
const checkAuth = (req, res, next) => {
  if (req.session.loggedIn) return next();

  if (req.path.startsWith("/api/") || req.path.startsWith("/stream/")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const LOGIN_HTML = `
  <!DOCTYPE html>
  <html style="background:#141414;color:#fff;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;">
  <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
  <body>
    <form action="/login" method="POST" style="background:#222;padding:2rem;border-radius:8px;text-align:center;width:300px;box-shadow:0 4px 20px rgba(0,0,0,0.5);">
      <h2 style="color:#e50914;margin-top:0;">MY FLIX</h2>
      <input type="text" name="username" placeholder="Username" required style="width:100%;padding:10px;margin:10px 0;background:#333;border:none;color:white;border-radius:4px;box-sizing:border-box;">
      <input type="password" name="password" placeholder="Password" required style="width:100%;padding:10px;margin:10px 0;background:#333;border:none;color:white;border-radius:4px;box-sizing:border-box;">
      <button type="submit" style="width:100%;padding:10px;background:#e50914;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;margin-top:10px;">Sign In</button>
    </form>
  </body>
  </html>
  `;
  res.send(LOGIN_HTML);
};

// Helper for finding best IP (Kept for QR code)
function getBestIp() {
  const interfaces = os.networkInterfaces();
  let bestIp = "";
  let bestPriority = 0;

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        if (iface.address.startsWith("169.254")) continue;

        let priority = 1;
        const lowerName = name.toLowerCase();
        if (
          lowerName.includes("virtual") ||
          lowerName.includes("wsl") ||
          lowerName.includes("vethernet")
        )
          priority = 1;
        else if (lowerName.includes("ethernet")) priority = 2;
        else if (
          lowerName.includes("wi-fi") ||
          lowerName.includes("wlan") ||
          lowerName.includes("wireless")
        )
          priority = 3;
        else priority = 2;

        if (priority > bestPriority) {
          bestPriority = priority;
          bestIp = iface.address;
        }
      }
    }
  }
  return bestIp;
}

// --- MAIN STARTUP FUNCTION ---
async function startServer() {
  // Check for --setup flag
  const isSetupRequested = process.argv.includes("--setup");

  // 1. Load/Setup Config
  config = loadConfig();
  if (!config || isSetupRequested) {
    config = await runSetup(config);
  }

  // 🚨 FINAL PORTABILITY FIX: Overwrite MEDIA_ROOT with CWD
  MEDIA_ROOT = process.cwd();
  PORT = config.port || 8080;

  // 2. Apply Middleware and Global Settings
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cors());
  app.use(
    helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false })
  );
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));
  app.use(
    session({
      store: new FileStore({
        path: SESSION_DIR,
        ttl: 86400 * config.sessionDays,
      }),
      secret: "myflix_super_secret_key_2025",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * (config.sessionDays || 7),
        httpOnly: true,
      },
    })
  );

  // 3. Define Routes (Protected)
  app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const hash = hashPassword(password);
    if (username === config.username && hash === config.passwordHash) {
      req.session.loggedIn = true;
      res.redirect("/");
    } else {
      res.send(
        `<script>alert("Wrong credentials!"); window.location.href="/";</script>`
      );
    }
  });

  app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
  });

  // API: List Files (Async)
  app.get("/api/files", checkAuth, (req, res) => {
    const currentPath = req.query.path || "";
    const fullPath = getSafePath(currentPath);

    if (!fullPath || !fs.existsSync(fullPath)) return res.status(404).json([]);

    fs.readdir(fullPath, { withFileTypes: true }, (err, files) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error reading directory" });
      }

      const fileList = files
        .filter((f) => !f.name.startsWith("."))
        .map((f) => ({
          name: f.name,
          isDirectory: f.isDirectory(),
          isVideo: /\.(mp4|mkv|webm|avi|mov)$/i.test(f.name),
          path: path.join(currentPath, f.name).replace(/\\/g, "/"),
        }));

      fileList.sort((a, b) =>
        a.isDirectory === b.isDirectory ? 0 : a.isDirectory ? -1 : 1
      );
      res.json(fileList);
    });
  });

  // API: Video Streaming (Protected)
  app.get(/^\/stream\/(.+)$/, checkAuth, (req, res) => {
    const relativePath = decodeURIComponent(req.params[0]);
    const filePath = getSafePath(relativePath);

    if (!filePath || !fs.existsSync(filePath))
      return res.status(404).send("File not found");

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4",
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = { "Content-Length": fileSize, "Content-Type": "video/mp4" };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  });

  app.get("/api/download", checkAuth, (req, res) => {
    const filePath = getSafePath(req.query.path);
    if (!filePath) return res.status(403).send("Access Denied");
    res.download(filePath);
  });

  // 4. Serve Frontend & Start Listening
  app.use(
    express.static(path.join(__dirname, "client/dist"), { index: false })
  );
  app.get(/.*/, checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, "client/dist/index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.clear();
    console.log("---------------------------------------------------");
    console.log("🔒 MY FLIX: SECURE & CLEAN MODE");
    console.log(`📂 Serving: ${MEDIA_ROOT}`);

    const bestIp = getBestIp();
    console.log("---------------------------------------------------");

    if (bestIp) {
      const url = `http://${bestIp}:${PORT}`;
      console.log(`👉 Local:   http://localhost:${PORT}`);
      console.log(`👉 Network: ${url}`);
      console.log("\n📱 Scan this to login on Phone:");
      qrcode.generate(url, { small: true });
    } else {
      console.log(`Local URL:  http://localhost:${PORT}`);
    }
    console.log(`\n🔐 Config and sessions are safe in:\n   ${APP_DATA_DIR}`);
    console.log("---------------------------------------------------");
  });
}

// Execute the main function
startServer();
