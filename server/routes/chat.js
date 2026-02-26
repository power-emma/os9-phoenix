const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// ── CSV persistence ─────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

// RFC 4180-compliant CSV helpers
// Fields are: id,ts,username,message  (channel is implicit from the filename)
function csvEscape(str) {
  const s = String(str);
  // Quote if contains comma, double-quote, newline or carriage-return
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function csvRow(msg) {
  return [msg.id, msg.ts, msg.username, msg.message].map(csvEscape).join(',') + '\n';
}

function csvPath(channel) {
  return path.join(DATA_DIR, `${channel}.csv`);
}

// Parse one CSV line respecting RFC 4180 quoting. Returns array of field strings.
function parseCsvLine(line) {
  const fields = [];
  let i = 0;
  while (i <= line.length) {
    if (line[i] === '"') {
      // Quoted field
      let field = '';
      i++; // skip opening quote
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') { field += '"'; i += 2; }
        else if (line[i] === '"') { i++; break; }
        else { field += line[i++]; }
      }
      fields.push(field);
      if (line[i] === ',') i++; // skip separator
    } else {
      // Unquoted field
      const end = line.indexOf(',', i);
      if (end === -1) { fields.push(line.slice(i)); break; }
      fields.push(line.slice(i, end));
      i = end + 1;
    }
  }
  return fields;
}

// Load one channel CSV into an array of message objects. Returns [] if missing.
function loadCsv(channel) {
  const file = csvPath(channel);
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const msgs = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const [idStr, tsStr, username, message] = parseCsvLine(line);
    const id = parseInt(idStr, 10);
    const ts = parseInt(tsStr, 10);
    if (!id || !ts || !username) continue; // skip malformed + tombstones (ts=0)
    if (message && message.startsWith('\x00')) continue; // deleted tombstone
    msgs.push({ id, ts, channel, username, message: message ?? '' });
  }
  // Sort by id ascending (file should already be in order, but be safe)
  msgs.sort((a, b) => a.id - b.id);
  return msgs;
}

// Append a single message to its channel CSV (one syscall, no rewrite)
function appendCsv(msg) {
  fs.appendFileSync(csvPath(msg.channel), csvRow(msg), 'utf8');
}

// ── Pin persistence ─────────────────────────────────────────────────────────
function pinPath(channel) {
  return path.join(DATA_DIR, `${channel}.pin`);
}

function loadPin(channel) {
  try {
    const raw = fs.readFileSync(pinPath(channel), 'utf8').trim();
    return raw || null;
  } catch { return null; }
}

function savePin(channel, text) {
  if (text) {
    fs.writeFileSync(pinPath(channel), text, 'utf8');
  } else {
    try { fs.unlinkSync(pinPath(channel)); } catch {}
  }
}

// ── Channel definitions ─────────────────────────────────────────────────────
// Each entry: { id: string, label: string }
// Add or reorder here — clients fetch this list at runtime.
const CHANNEL_DEFS = [
  { id: 'general',    label: '# general'    },
  { id: 'test',       label: '# test'       },
  { id: 'bug-report', label: '# bug-report' },
];
const CHANNELS = CHANNEL_DEFS.map(c => c.id);

// ── Shared in-memory state (also consumed by the WebSocket server) ──────────
// Per-channel message stores. Each message: { id, username, message, ts, channel }
const stores = {};
let nextId = 1;

// Load persisted history for every channel on startup
console.log('[chat] loading persisted messages from', DATA_DIR);
const pins = {};
CHANNELS.forEach(ch => {
  const msgs = loadCsv(ch);
  stores[ch] = msgs;
  pins[ch] = loadPin(ch);
  if (msgs.length) {
    const maxId = msgs[msgs.length - 1].id;
    if (maxId >= nextId) nextId = maxId + 1;
    console.log(`[chat] #${ch}: loaded ${msgs.length} messages (max id ${maxId})`);
  } else {
    stores[ch] = [];
    console.log(`[chat] #${ch}: no history`);
  }
  if (pins[ch]) console.log(`[chat] #${ch}: pin loaded`);
});

const state = {
  channelDefs: CHANNEL_DEFS,
  channels: CHANNELS,

  addMessage(channel, username, message) {
    const msg = {
      id: nextId++,
      channel,
      username: String(username).slice(0, 64),
      message: String(message).slice(0, 2000),
      ts: Date.now(),
    };
    stores[channel].push(msg);
    // Persist to CSV immediately (append-only — no rewrite)
    appendCsv(msg);
    // Keep in-memory store bounded to 2000 messages (CSV keeps the full log)
    if (stores[channel].length > 2000) stores[channel].splice(0, stores[channel].length - 2000);
    return msg;
  },

  // Return the `n` most-recent messages for a channel (newest-last in array).
  getRecent(channel, n = 20) {
    const store = stores[channel] || [];
    return store.slice(-n);
  },

  // Return up to `n` messages with id strictly less than `beforeId`, newest-last.
  // Pass beforeId = Infinity (or omit) to get the latest messages.
  getBefore(channel, beforeId = Infinity, n = 50) {
    const store = stores[channel] || [];
    // Walk backward from the end to find messages older than beforeId
    const result = [];
    for (let i = store.length - 1; i >= 0 && result.length < n; i--) {
      if (store[i].id < beforeId) result.push(store[i]);
    }
    result.reverse(); // return in chronological order (oldest-first)
    return result;
  },

  getSince(channel, since = 0) {
    const store = stores[channel] || [];
    return store.filter(m => m.ts > since);
  },

  getPin(channel) {
    return pins[channel] ?? null;
  },

  setPin(channel, text) {
    pins[channel] = text || null;
    savePin(channel, text || null);
  },

  // Remove a message by id. Returns true if found and removed.
  // The CSV is append-only so we write a tombstone row with a blank message
  // field prefixed by \x00 — the CSV loader skips rows whose message starts
  // with \x00. On next server start the gap simply won't be loaded.
  deleteMessage(channel, id) {
    const store = stores[channel];
    if (!store) return false;
    const idx = store.findIndex(m => m.id === id);
    if (idx === -1) return false;
    store.splice(idx, 1);
    // Append tombstone so persistence reflects the deletion after restart
    const tombstone = { id, ts: 0, channel, username: '', message: '\x00deleted' };
    appendCsv(tombstone);
    return true;
  },
};

// ── REST endpoints ──────────────────────────────────────────────────────────

// GET /api/chat/channels — returns the list of channels
router.get('/channels', (req, res) => {
  res.json(CHANNEL_DEFS);
});

// GET /api/chat/:channel/history?beforeId=<id>&limit=<n>
// Returns up to `limit` messages with id < beforeId, oldest-first.
router.get('/:channel/history', (req, res) => {
  const { channel } = req.params;
  if (!CHANNELS.includes(channel)) {
    return res.status(404).json({ error: 'Unknown channel' });
  }
  const beforeId = parseInt(req.query.beforeId || '0', 10) || Infinity;
  const limit    = Math.min(parseInt(req.query.limit  || '50', 10) || 50, 100);
  const msgs = state.getBefore(channel, beforeId, limit);
  res.json(msgs);
});

// GET /api/chat/ping
router.get('/ping', (req, res) => {
  const counts = {};
  CHANNELS.forEach(ch => { counts[ch] = stores[ch].length; });
  res.json({ ok: true, channels: counts });
});

module.exports = router;
module.exports.state = state;
