app.get("/pair", async (req, res) => {
  const number = req.query.number;
  if (!number) return res.json({ error: "Number required" });

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["DARKCORE-XMD", "Chrome", "1.0"]
  });

  if (!sock.authState.creds.registered) {
    const code = await sock.requestPairingCode(number);
    sock.ev.on("creds.update", saveCreds);
    return res.json({ code });
  }

  res.json({ status: "Already paired" });
});

