const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');
const { app: nodeApp } = require('bridge');

const PORT = 8080;
const publicDir = path.resolve(__dirname, '..');
const uploadsDir = path.join(nodeApp.datadir(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const messages = [];

app.use(express.static(publicDir));
app.use('/uploads', express.static(uploadsDir));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname))
  }),
  limits: { fileSize: 1024 * 1024 * 1024 }
});

function getLocalIP() {
  for (const list of Object.values(os.networkInterfaces())) {
    for (const net of list || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return '127.0.0.1';
}

app.get('/api/health', (_req, res) => res.json({ ok: true, port: PORT }));
app.get('/api/server-info', (_req, res) => {
  const ip = getLocalIP();
  res.json({ ip, port: PORT, address: `http://${ip}:${PORT}` });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file received' });
  let replyTo = null;
  try { if (req.body.replyTo) replyTo = JSON.parse(req.body.replyTo); } catch (_) {}
  const message = {
    id: crypto.randomUUID(), type: 'file',
    url: '/uploads/' + req.file.filename,
    filename: req.file.originalname, mime: req.file.mimetype,
    username: req.body.username || 'Guest', caption: req.body.caption || '',
    replyTo, timestamp: Date.now()
  };
  messages.push(message);
  io.emit('message', message);
  res.json({ success: true, message });
});

io.on('connection', socket => {
  socket.emit('history', messages);
  socket.on('chat', data => {
    if (!data || typeof data.text !== 'string' || !data.text.trim()) return;
    const message = {
      id: crypto.randomUUID(), type: 'text',
      text: data.text.slice(0, 10000),
      username: String(data.username || 'Guest').slice(0, 40),
      replyTo: data.replyTo || null, timestamp: Date.now()
    };
    messages.push(message);
    io.emit('message', message);
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`eShareX listening on ${PORT}`));
