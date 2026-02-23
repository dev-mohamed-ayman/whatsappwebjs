<div align="center">

# 🚀 WhatsApp REST API using whatsapp-web.js

Simple and powerful REST API built with **Node.js** and **Express** on top of **whatsapp-web.js** to send WhatsApp messages programmatically.

</div>

---

## 📦 Prerequisites

- Node.js (version 18 or newer is recommended)
- npm (comes with Node.js)
- Chrome/Chromium browser (used internally via puppeteer)
- An active WhatsApp account on any phone

---

## 📁 Project Setup

### 1️⃣ Get the code

Either clone the repository or download it as a ZIP and extract it.

### 2️⃣ Install dependencies

From inside the project folder:

```bash
cd whatsappwebjs
npm install
```

This will install:

- express
- whatsapp-web.js
- qrcode-terminal

---

## ⚙️ Configuration & Server Start

### 1️⃣ Start the server

From inside the project folder:

```bash
npm start
```

or:

```bash
node src/index.js
```

The server listens on:

- `PORT` environment variable if provided
- otherwise `3000` by default

### 2️⃣ First-time WhatsApp linking (QR Code)

On the first run:

- **whatsapp-web.js** will launch in headless mode
- A QR code will be printed in the terminal
- On your **WhatsApp** mobile app:
  - Open the menu (⋮ on Android, Settings on iOS)
  - Choose **Linked devices**
  - Tap **Link a device**
  - Scan the QR code shown in your terminal

After scanning successfully, the session is stored in:

- `.wwebjs_auth/`

On subsequent runs you will not need to scan the QR again unless you delete the session data or log out from linked devices.

---

## 🌐 API Endpoints

The server is built with Express and exposes three main endpoints:

### 1️⃣ Health check – `/health`

- **Method:** `GET`
- **Description:** Simple check to verify the server is running.

#### Request example:

```bash
curl http://localhost:3000/health
```

#### Response example:

```json
{
  "status": "ok"
}
```

---

### 2️⃣ WhatsApp session status – `/session-status`

- **Method:** `GET`
- **Description:** Check whether the WhatsApp client is ready to send messages.

#### Request example:

```bash
curl http://localhost:3000/session-status
```

#### Response example:

```json
{
  "ready": true
}
```

- `ready: true` → client is initialized and can send messages
- `ready: false` → client is still initializing or is disconnected

---

### 3️⃣ Send WhatsApp message – `/send-message`

- **Method:** `POST`
- **Content-Type:** `application/json`
- **Description:** Send a text message to a WhatsApp number.

#### Request body schema:

```json
{
  "phoneNumber": "201234567890",
  "message": "Hello from API"
}
```

- `phoneNumber`:
  - Phone number including country code
  - Can contain spaces or symbols (they are stripped automatically)
- `message`:
  - Text content you want to send

#### Example using `curl` (PowerShell on Windows):

```bash
curl -X POST http://localhost:3000/send-message ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\": \"201234567890\", \"message\": \"Hello from API\"}"
```

> Note: `^` is used in PowerShell to split the command into multiple lines.

#### Successful response example:

```json
{
  "success": true,
  "id": "true_201234567890@c.us_XXXXXXXXXX",
  "timestamp": 1710000000,
  "to": "201234567890@c.us"
}
```

#### Possible error responses:

- Client not ready:

```json
{
  "error": "WhatsApp client not ready"
}
```

- Missing required fields:

```json
{
  "error": "phoneNumber and message required"
}
```

- Unexpected error while sending:

```json
{
  "error": "Failed to send message"
}
```

---

## 🧠 How the script works (high-level)

Main entry point: `src/index.js`

- Creates an Express app:
  - Parses JSON bodies via `app.use(express.json())`
- Creates a WhatsApp client:
  - Uses `LocalAuth` to persist session automatically
  - Configures puppeteer in headless mode with secure flags (`--no-sandbox`, `--disable-setuid-sandbox`)
- Listens to WhatsApp client events:
  - `qr` → prints QR code in terminal using `qrcode-terminal`
  - `ready` → sets `clientReady = true`
  - `disconnected` → sets `clientReady = false`
- When the Express server starts listening:
  - Calls `client.initialize()` to bootstrap the WhatsApp session

---

## ⚠️ Notes & Best Practices

- Do not share the `.wwebjs_auth` folder with anyone; it contains your WhatsApp session data.
- Make sure the machine running this script has a stable internet connection.
- If your WhatsApp session changes or you log out of all devices:
  - You may need to delete `.wwebjs_auth` and restart the server to scan a new QR code.
- Avoid using this script for spam or bulk unsolicited messages; your number may be banned by WhatsApp.

---

## 🛠️ Extending and customizing

Since the codebase is small and straightforward, you can easily:

- Add new endpoints (send images, files, templated messages, etc.).
- Integrate the API with other systems (admin panels, CRM, billing systems, and more).
- Add authentication (API keys, JWT, etc.) to protect your endpoints.

---

## 🧾 Useful commands

- Start the server:

```bash
npm start
```

- Run the main file directly (without npm scripts):

```bash
node src/index.js
```

---

## 📚 Quick usage recap

1. Install prerequisites (Node.js).
2. Navigate to the project folder and run:
   - `npm install`
3. Start the server:
   - `npm start`
4. Scan the QR code from the WhatsApp mobile app.
5. Confirm `/session-status` returns `ready: true`.
6. Use `/send-message` endpoint to send messages via the REST API.

