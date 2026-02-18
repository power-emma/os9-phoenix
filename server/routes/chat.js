const express = require('express');
const router = express.Router();

// Simple in-memory chat message store.
// Each message: { id: number, username: string, message: string, ts: number }
const messages = [];
let nextId = 1;

// GET / - return messages; optional ?since=<ts> returns messages with ts > since
router.get('/', (req, res) => {
  const since = parseInt(req.query.since || '0', 10) || 0;
  const filtered = messages.filter(m => m.ts > since);
  console.log(`[chat] GET / - since=${since} returned ${filtered.length} messages`);
  res.json(filtered);
});

// simple health check for the chat API
router.get('/ping', (req, res) => {
  res.json({ ok: true, count: messages.length });
});

// POST / - accept { username, message }
router.post('/', (req, res) => {
  const { username, message } = req.body || {};
  if (!username || !message) {
    res.status(400).json({ error: 'username and message required' });
    return;
  }
  const msg = { id: nextId++, username: String(username), message: String(message), ts: Date.now() };
  messages.push(msg);
  // Keep store reasonably bounded (e.g., last 1000 messages)
  if (messages.length > 2000) messages.splice(0, messages.length - 2000);
  console.log(`[chat] POST / - received message from ${msg.username}: ${msg.message}`);
  res.status(201).json(msg);
});

module.exports = router;
