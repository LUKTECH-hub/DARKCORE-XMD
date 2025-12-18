let isPairing = false;

app.get("/pair", async (req, res) => {
  if (isPairing) {
    return res.json({ error: "Pairing already in progress. Wait 1 minute." });
  }

  try {
    isPairing = true;

    const number = req.query.number;
    if (!number) {
      isPairing = false;
      return res.json({ error: "Number required" });
    }

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: "silent" }),
      browser: ["DARKCORE-XMD", "Chrome", "1.0"]
    });

    sock.ev.on("creds.update", saveCreds);

    if (!sock.authState.creds.registered) {
      const code = await sock.requestPairingCode(number);

      // Auto-unlock after 60 seconds
      setTimeout(() => {
        isPairing = false;
      }, 60000);

      return res.json({ code });
    }

    isPairing = false;
    res.json({ status: "Already paired" });

  } catch (err) {
    isPairing = false;
    res.json({ error: "Pairing failed" });
  }
});
const express = require("express");
const path = require("path");
const fs = require("fs");
const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_DIR = path.join(__dirname, "session");

// Ensure session folder exists
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

// Serve static files (pair.html)
app.use(express.static(__dirname));

let isPairing = false;

app.get("/pair", async (req, res) => {
  if (isPairing) return res.json({ error: "Pairing already in progress. Wait 60 seconds." });

  const number = req.query.number;
  if (!number) return res.json({ error: "Phone number required" });
  if (!/^[0-9]{8,15}$/.test(number)) return res.json({ error: "Invalid number format" });

  try {
    isPairing = true;

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: "silent" }),
      browser: ["DARKCORE-XMD", "Chrome", "1.0"]
    });

    sock.ev.on("creds.update", saveCreds);

    if (!sock.authState.creds.registered) {
      const code = await sock.requestPairingCode(number);
      setTimeout(() => { isPairing = false; }, 60000); // unlock after 60s
      return res.json({ code });
    }

    isPairing = false;
    res.json({ status: "Already paired" });

  } catch (err) {
    isPairing = false;
    res.json({ error: "Pairing failed. Retry later." });
  }
});

// Home page
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "pair.html")));

app.listen(PORT, () => console.log(`DARKCORE-XMD Pair Site running on port ${PORT}`));

        
