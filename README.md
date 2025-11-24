# 🍿 My Media Server (Lightning Mode)

A lightweight (<10mb), self-hosted streaming server built with **Node.js** and **React**.  
Designed for speed, instant playback, and mobile responsiveness over your local network (LAN).

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)

- [ Features](#-features)
- [ Installation](#️-installation)
- [ How to Run](#-how-to-run)
- [ Configuration](#️-configuration)
- [ Deployment (Old PC / Production)](#️-deployment-old-pc--production)

---

## ✨ Features

- **⚡ Ultra Fast:** Direct file streaming for instant playback.
- **📱 Mobile Ready:** Responsive UI with a "Bottom Sheet" menu for mobile.
- **🔗 QR Code Connect:** Generates a QR code in the terminal to instantly open the app on your phone.
- **📂 File Explorer:** Navigate folders, switch views (Grid vs. List), and download files.

---

## 🛠️ Installation

### 1. Prerequisites

You need **Node.js** installed on your machine.

### 2. Clone & Setup

Clone the repository and install dependencies for both the Backend and Frontend.

```bash
# Clone the repo
git clone https://github.com/Kaveesha125/my-media-server.git
cd my-media-server

# 1. Install Backend Dependencies
npm install

# 2. Install Frontend Dependencies
cd client
npm install
```

### 3. Build the Frontend

Since the server serves the static React app, you need to build it first.

> [!NOTE]
> If you make any changes to the React code later, you must run this build command again to see the changes.

```bash
cd client
npm run build
cd ..
```

---

## 🚀 How to Run

Start the server from the root directory:

```bash
npm start
```

_(Or `node server.js`)_

> [!TIP]
> **Mobile Connection:** The terminal will generate a QR Code. Simply scan it with your phone's camera to connect via Wi-Fi instantly.

---

## ⚙️ Configuration

To change the folder you want to stream (e.g., your Downloads or Movies drive), edit `server.js`:

```javascript
const SERVE_DIR = "D:\\Films";
```

## 🏗️ Deployment (Old PC / Production)

To run this on a separate media server PC without the heavy source code:

1.  Copy these files to the new PC:
    - `server.js`
    - `package.json`
    - `client/dist/` (The entire folder)
2.  Run `npm install` on the new PC.
3.  Run `node server.js` (or `npm start`).

---
