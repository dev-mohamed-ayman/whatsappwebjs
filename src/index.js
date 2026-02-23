const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

let clientReady = false;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  clientReady = true;
});

client.on("disconnected", () => {
  clientReady = false;
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/session-status", (req, res) => {
  res.json({ ready: clientReady });
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

    const normalized = phoneNumber.replace(/\D/g, "");
    const chatId = `${normalized}@c.us`;

    const result = await client.sendMessage(chatId, message);

    res.json({
      success: true,
      id: result.id?._serialized,
      timestamp: result.timestamp,
      to: chatId,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.listen(port, () => {
  client.initialize();
});

