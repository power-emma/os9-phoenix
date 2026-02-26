const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Map of lowercase username -> expected sha256 hex hash of their password.
// Hash is the utf-8 hex-encoded sha256 of the plaintext password.
const PROTECTED = {
  emma: '21316f8dffa87b8e714bf33544e719e1c9ac3c21891a39f5e74f98cdbcf9e4ef',
};

/**
 * POST /api/auth/verify
 * Body: { username: string, hash: string }  — hash is sha256(password) in hex
 * Returns: { ok: true } or 401 { ok: false, error: string }
 */
router.post('/verify', (req, res) => {
  const { username, hash } = req.body || {};
  if (!username || !hash) {
    return res.status(400).json({ ok: false, error: 'username and hash required' });
  }

  const key = String(username).trim().toLowerCase();
  const expected = PROTECTED[key];

  // Username is not protected — no password needed
  if (!expected) {
    return res.json({ ok: true });
  }

  // Constant-time comparison to avoid timing attacks
  const provided = String(hash).toLowerCase();
  const match =
    provided.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(provided, 'utf8'), Buffer.from(expected, 'utf8'));

  if (match) {
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, error: 'Incorrect password' });
});

module.exports = router;
