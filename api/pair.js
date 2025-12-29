import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";

export default async function handler(req, res) {
  try {
    const number = req.query.number;
    if (!number) return res.status(400).json({ error: "Number required" });

    const { state, saveCreds } = await useMultiFileAuthState("/tmp/auth");

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ["DARKCORE-XMD", "Chrome", "1.0"]
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
      if (connection === "close") {
        const reason = lastDisconnect?.error?.output?.statusCode;
        if (reason === DisconnectReason.loggedOut) {
          console.log("Logged out");
        }
      }
    });

    const cleanNumber = number.replace(/\D/g, "");
    const code = await sock.requestPairingCode(cleanNumber);

    res.status(200).json({ code });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Pairing failed" });
  }
  }
