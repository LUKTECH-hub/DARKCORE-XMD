const express = require('express')
const QRCode = require('qrcode')
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require('@whiskeysockets/baileys')
const Pino = require('pino')

const app = express()
const PORT = process.env.PORT || 3000

let qrCodeData = null

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: Pino({ level: 'silent' }),
    browser: ['DARKCORE-XMD', 'Chrome', '120.0']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      qrCodeData = await QRCode.toDataURL(qr)
      console.log('📲 QR generated — open /qr')
    }

    if (connection === 'open') {
      qrCodeData = null
      console.log('✅ WhatsApp connected')
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      if (reason !== DisconnectReason.loggedOut) {
        startBot()
      } else {
        console.log('❌ Logged out — delete session folder')
      }
    }
  })
}

app.get('/', (req, res) => {
  res.send('✅ DARKCORE-XMD is running')
})

app.get('/qr', (req, res) => {
  if (!qrCodeData) {
    return res.send('✅ QR already scanned or not generated yet')
  }
  res.send(`
    <html>
      <body style="display:flex;justify-content:center;align-items:center;height:100vh;">
        <img src="${qrCodeData}" />
      </body>
    </html>
  `)
})

app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`)
})

startBot()



