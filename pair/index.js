const express = require("express");
const fs = require("fs");
const path = require("path");
const {
  default: makeWASocket,
  useMultiFileAuthState
} = require("@whiskeysockets/baileys");
const pino = require("pino");

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_DIR = path.join(__dirname, "session");

app.use(express.static(__dirname));

app.get("/pair", async (req, res) => {
  const number = process.env.NUMBER;
  if (!number) return res.send("NUMBER env not set");

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["DARKCORE-XMD", "Chrome", "1.0"]
  });

  if (!sock.authState.creds.registered) {
    const code = await sock.requestPairingCode(number);
    return res.json({ code });
  }

  sock.ev.on("creds.update", saveCreds);
  res.json({ status: "already paired" });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pair.html"));
});

app.listen(PORT, () => {
  console.log("DARKCORE-XMD Pair Site running on port", PORT);
});
