const http = require('http');
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// enable CORS for all routes
app.use(cors());

// parse JSON bodies
app.use(express.json());

// Define a route for the home page
app.get('/', (req, res) => {
  res.send('Hello from Express!');
});

// mount desktop route from routes/desktop.js at /api/desktop
const desktopRouter = require('./routes/desktop');
app.use('/api/desktop', desktopRouter);

// mount chat REST API (history endpoint) at /api/chat
const chatRouter = require('./routes/chat');
app.use('/api/chat', chatRouter);

// mount auth API at /api/auth
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

console.log('Mounted routes: /api/desktop, /api/chat, /api/auth');

// ── WebSocket chat server ──────────────────────────────────────────────────

// Shared state lives here so routes/chat.js can import it too
const chatState = require('./routes/chat').state;
const VALID_CHANNELS = new Set(chatState.channels);

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/chat' });

// How many messages to send on connect / channel switch
const HISTORY_PAGE = 20;
// Maximum messages a client can request in one fetch_history call
const HISTORY_MAX  = 50;

wss.on('connection', (ws, req) => {
  // Which channel is this socket subscribed to? Default: first channel
  ws.channel = chatState.channels[0] || 'general';
  console.log('[ws] client connected');

  // Send channel list + last HISTORY_PAGE messages for the default channel
  ws.send(JSON.stringify({
    type: 'hello',
    channels: chatState.channelDefs,
    defaultChannel: ws.channel,
    history: chatState.getRecent(ws.channel, HISTORY_PAGE),
    pin: chatState.getPin(ws.channel),
  }));

  ws.on('message', (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { return; }

    if (data.type === 'join') {
      // Switch channel subscription
      const ch = data.channel;
      if (!VALID_CHANNELS.has(ch)) {
        ws.send(JSON.stringify({ type: 'error', message: `Unknown channel: ${ch}` }));
        return;
      }
      ws.channel = ch;
      const history = chatState.getRecent(ch, HISTORY_PAGE);
      ws.send(JSON.stringify({ type: 'history', channel: ch, messages: history, pin: chatState.getPin(ch) }));
      console.log(`[ws] client joined #${ch}`);

    } else if (data.type === 'fetch_history') {
      // Client is scrolling back — send up to HISTORY_MAX messages before beforeId
      const ch = data.channel;
      if (!VALID_CHANNELS.has(ch)) return;
      const beforeId = parseInt(data.beforeId, 10) || Infinity;
      const limit    = Math.min(parseInt(data.limit, 10) || HISTORY_MAX, HISTORY_MAX);
      const messages = chatState.getBefore(ch, beforeId, limit);
      ws.send(JSON.stringify({ type: 'history', channel: ch, messages, prepend: true }));
      console.log(`[ws] #${ch} fetch_history beforeId=${beforeId} limit=${limit} → ${messages.length} msgs`);

    } else if (data.type === 'delete_message') {
      // Emma only
      if (data.username !== 'Emma') return;
      const ch = VALID_CHANNELS.has(data.channel) ? data.channel : null;
      const id = parseInt(data.id, 10);
      if (!ch || !id) return;
      const removed = chatState.deleteMessage(ch, id);
      if (!removed) return;
      console.log(`[ws] #${ch} message ${id} deleted by Emma`);
      const payload = JSON.stringify({ type: 'message_deleted', channel: ch, id });
      wss.clients.forEach(client => {
        if (client.readyState === client.OPEN && client.channel === ch) {
          client.send(payload);
        }
      });

    } else if (data.type === 'message') {
      const { username, message, channel } = data;
      const ch = VALID_CHANNELS.has(channel) ? channel : ws.channel;
      if (!username || !message) return;

      // /pin command — Emma only
      if (message.startsWith('/pin ') && username === 'Emma') {
        const pinText = message.slice(5).trim();
        chatState.setPin(ch, pinText);
        console.log(`[ws] #${ch} pin set by ${username}: "${pinText}"`);
        // Broadcast pin update to everyone on this channel
        const pinPayload = JSON.stringify({ type: 'pin', channel: ch, pin: pinText || null });
        wss.clients.forEach(client => {
          if (client.readyState === client.OPEN && client.channel === ch) {
            client.send(pinPayload);
          }
        });
        return; // don't store /pin as a regular message
      }

      const msg = chatState.addMessage(ch, username, message);
      console.log(`[ws] #${ch} <${username}> ${message}`);

      // Broadcast to all clients subscribed to this channel
      const payload = JSON.stringify({ type: 'message', channel: ch, msg });
      wss.clients.forEach(client => {
        if (client.readyState === client.OPEN && client.channel === ch) {
          client.send(payload);
        }
      });
    }
  });

  ws.on('close', () => console.log('[ws] client disconnected'));
  ws.on('error', (err) => console.warn('[ws] error', err.message));
});

// Start the server. Default bind address is loopback (127.0.0.1) so the API
// is not exposed directly to the internet; nginx will proxy /api/ to this port.
const bindAddr = process.env.BIND_ADDR || '127.0.0.1';
server.listen(port, bindAddr, () => {
  console.log(`Server running at http://${bindAddr}:${port}/ (HTTP + WebSocket)`);
});