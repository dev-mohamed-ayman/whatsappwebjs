const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcodeTerminal = require("qrcode-terminal");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

let clientReady = false;
let latestQR = null;
let client = null;

function setupClient() {
  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", async (qr) => {
    latestQR = qr;
    qrcodeTerminal.generate(qr, { small: true });
  });

  client.on("ready", () => {
    clientReady = true;
    latestQR = null;
  });

  client.on("disconnected", () => {
    clientReady = false;
    latestQR = null;
  });
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/session-status", (req, res) => {
  res.json({ ready: clientReady });
});

app.get("/qr", async (req, res) => {
  if (clientReady) {
    return res.json({ ready: true, message: "Client is already ready" });
  }
  if (!latestQR) {
    return res.json({ ready: false, message: "QR not generated yet" });
  }

  try {
    const qrImage = await QRCode.toDataURL(latestQR);
    res.json({ ready: false, qr: latestQR, qrImage });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate QR image" });
  }
});

app.post("/send-message", async (req, res) => {
  try {
    if (!clientReady) {
      return res.status(503).json({ error: "WhatsApp client not ready" });
    }

    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ error: "phoneNumber and message required" });
    }

    const normalized = String(phoneNumber).replace(/\D/g, "");
    const chatId = `${normalized}@c.us`;

    const result = await client.sendMessage(chatId, message);

    res.json({
      success: true,
      id: result.id?._serialized,
      timestamp: result.timestamp,
      to: chatId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
    // res.status(500).json({ error: "Failed to send message" });
  }
});

app.post("/reset-session", async (req, res) => {
  try {
    clientReady = false;
    latestQR = null;

    if (client) {
      try {
        await client.logout();
      } catch {}
      try {
        await client.destroy();
      } catch {}
      client = null;
    }

    const authDir = path.resolve(process.cwd(), ".wwebjs_auth");
    const cacheDir = path.resolve(process.cwd(), ".wwebjs_cache");
    try {
      await fs.promises.rm(authDir, { recursive: true, force: true });
    } catch {}
    try {
      await fs.promises.rm(cacheDir, { recursive: true, force: true });
    } catch {}

    setupClient();
    client.initialize();

    const waitForQR = async (timeoutMs = 10000) => {
      const start = Date.now();
      while (!clientReady && !latestQR && Date.now() - start < timeoutMs) {
        await new Promise((r) => setTimeout(r, 200));
      }
    };

    await waitForQR();

    if (clientReady) {
      return res.json({ ready: true, message: "Client is already ready" });
    }

    if (latestQR) {
      try {
        const qrImage = await QRCode.toDataURL(latestQR);
        return res.json({ ready: false, qr: latestQR, qrImage });
      } catch {}
    }

    return res.json({ ready: false, message: "Reset initiated. Fetch /qr for the code." });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset session" });
  }
});

app.listen(port, () => {
  setupClient();
  client.initialize();
});
