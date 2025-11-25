# 🍿 my-flix (Secure Edition)

A lightweight, self-hosted streaming server built with **Node.js** and **React**.  
Designed for speed, security, and instant playback over your local network (LAN).

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Security](https://img.shields.io/badge/Security-AES256-blue?style=for-the-badge&logo=lock)

## Table of Contents

- [✨ Features](#-features)
- [🚀 Quick Start (Download & Run)](#-quick-start-download--run)
- [🛠️ Developer Guide (Source Code)](#️-developer-guide-source-code)
- [⚙️ Configuration & Security](#️-configuration--security)

---

## ✨ Features

- **🔒 Enterprise Security:** Full session-based authentication with **AES-256 encryption** for configs and **SHA-256 hashing** for passwords.
- **⚡ Ultra Fast:** Direct file streaming with zero transcoding lag (Lightning Mode).
- **📱 Mobile Ready:** Responsive React UI with a custom "Bottom Sheet" menu for mobile control.
- **🔗 Instant Connect:** Generates a QR code in the terminal for instant Wi-Fi access.
- **🎒 True Portability:** The app auto-detects its environment. Drop the `.exe` in any folder, and it serves that specific folder immediately.

---

## 🚀 Quick Start (Download & Run)

For users who just want to stream movies without installing any code:

1.  **Download:** Get the latest `my-flix.exe` from the **[Releases Page](../../releases)**.
2.  **Deploy:** Move the `.exe` file into the folder you want to stream (e.g., `D:\Movies`).
3.  **Run:** Double-click `my-flix.exe`.
4.  **Connect:** Follow the setup prompts and scan the QR code with your phone.

### 🔧 How to Reset Password / Settings

If you need to change your password or port later:

1.  Open a terminal (Command Prompt or PowerShell) inside the folder where you have `my-flix.exe`.
2.  Type this command and hit Enter:

```powershell
./my-flix.exe --setup
```

_(If you renamed the file to "My Flix.exe", type `./"My Flix.exe" --setup`)_

> [!TIP]
> The executable is fully portable. You can carry it on a USB stick, plug it into any PC, and instantly stream that PC's files securely.

---

## 🛠️ Developer Guide (Source Code)

For developers who want to modify the code or build the executable themselves.

### 1. Clone & Setup

Clone the repository and install dependencies.

```bash
git clone https://github.com/Kaveesha125/my-media-server.git
cd my-media-server

# 1. Install Backend Dependencies
npm install

# 2. Install Frontend Dependencies
cd client
npm install
```

### 2. Build the Frontend

If you modify the React code, you must rebuild the UI.

```bash
cd client
npm run build
cd ..
```

### 3. Run in Development

Start the server from the source code.

```bash
npm start
```

### 4. Build the Executable (pkg)

To compile your own modified version into a standalone `.exe` file:

```bash
# Bundles Node.js + Backend + Frontend into one file
pkg .
```

---

## ⚙️ Configuration & Security

- **Config Storage:** All sensitive data is stored in `~/.myflix/config.json` (Hidden User Directory), keeping your media folders clean.
- **Encryption:** The config file is encrypted using **AES-256-CBC**. It cannot be read manually.
- **Hardening:** Secured with `helmet` (HTTP headers) and `express-rate-limit` (Brute-force protection).

---
