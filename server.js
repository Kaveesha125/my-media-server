const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const os = require("os");
const qrcode = require("qrcode-terminal");

const app = express();
const PORT = 8080;
app.use(cors());

const SERVE_DIR = path.join(os.homedir(), "Downloads");

const getSafePath = (reqPath) => {
  const targetPath = reqPath ? path.join(SERVE_DIR, reqPath) : SERVE_DIR;
  if (!targetPath.startsWith(SERVE_DIR)) return null;
  return targetPath;
};

// --- 2. API ROUTES ---
app.get("/api/files", (req, res) => {
  const currentPath = req.query.path || "";
  const fullPath = getSafePath(currentPath);
  if (!fullPath || !fs.existsSync(fullPath))
    return res.status(403).json({ error: "Access Denied" });

  fs.readdir(fullPath, { withFileTypes: true }, (err, files) => {
    if (err) return res.status(500).json({ error: "Read Error" });
    const fileList = files
      .filter((file) => !file.name.startsWith("."))
      .map((file) => ({
        name: file.name,
        isDirectory: file.isDirectory(),
        isVideo: /\.(mp4|mkv|webm|avi|mov)$/i.test(file.name),
        path: path.join(currentPath, file.name).replace(/\\/g, "/"),
      }));
    fileList.sort((a, b) =>
      a.isDirectory === b.isDirectory ? 0 : a.isDirectory ? -1 : 1
    );
    res.json(fileList);
  });
});

app.get("/api/download", (req, res) => {
  const filePath = getSafePath(req.query.path);
  if (!filePath) return res.status(403).send("Access Denied");
  res.download(filePath);
});

app.use("/stream", express.static(SERVE_DIR));
app.use(express.static(path.join(__dirname, "client/dist")));
app.get(/^(.*)$/, (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist/index.html"));
});

// 3. SMART IP DETECTION LOGIC
function getBestIp() {
  const interfaces = os.networkInterfaces();
  let bestIp = "";
  let bestPriority = 0;

  console.log("---------------------------------------------------");
  console.log("Local (PC):    http://localhost:" + PORT);

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        if (iface.address.startsWith("169.254")) continue;

        let priority = 1;
        const lowerName = name.toLowerCase();

        if (
          lowerName.includes("virtual") ||
          lowerName.includes("wsl") ||
          lowerName.includes("vethernet") ||
          lowerName.includes("pseudo")
        ) {
          priority = 1;
        } else if (lowerName.includes("ethernet")) {
          priority = 2;
        } else if (
          lowerName.includes("wi-fi") ||
          lowerName.includes("wlan") ||
          lowerName.includes("wireless")
        ) {
          priority = 3;
        } else {
          priority = 2;
        }

        console.log(`[${name}]:   http://${iface.address}:${PORT}`);

        if (priority > bestPriority) {
          bestPriority = priority;
          bestIp = iface.address;
        }
      }
    }
  }
  return bestIp;
}

// --- 4. START SERVER ---
app.listen(PORT, "0.0.0.0", () => {
  console.clear();
  console.log("---------------------------------------------------");
  console.log("🍿 MY FLIX SERVER RUNNING");
  console.log(`📂 Serving: ${SERVE_DIR}`);

  // Find the best IP
  const bestIp = getBestIp();

  console.log("---------------------------------------------------");

  if (bestIp) {
    const url = `http://${bestIp}:${PORT}`;
    console.log(`\n🚀 MAIN CONNECTION (Recommended):`);
    console.log(`👉 ${url} 👈`);
    console.log("\n📱 Scan this for your Phone:");
    qrcode.generate(url, { small: true });
  } else {
    console.log("\n⚠️ No Network IP found. Connect to Wi-Fi to use mobile.");
  }
  console.log("---------------------------------------------------");
});
