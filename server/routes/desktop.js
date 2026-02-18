const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// GET / (mounted at /api/desktop) - return desktop.ini from repo root or public/
router.get('/', (req, res) => {
  const rootPath = path.join(__dirname, '..', 'desktop.ini');
  const serverLocal = path.join(__dirname, 'desktop.ini');
  const publicPath = path.join(__dirname, '..', 'public', 'desktop.ini');
  let desktopPath = null;
  if (fs.existsSync(rootPath)) desktopPath = rootPath;
  else if (fs.existsSync(serverLocal)) desktopPath = serverLocal;
  else if (fs.existsSync(publicPath)) desktopPath = publicPath;

  if (!desktopPath) {
    res.status(404).json({ error: 'desktop.ini not found at repo root or public/' });
    return;
  }

  fs.readFile(desktopPath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).json({ error: 'failed to read desktop.ini' });
      return;
    }
    try {
      const parsed = JSON.parse(data);
      res.json(parsed);
    } catch (e) {
      res.type('text/plain').send(data);
    }
  });
});

module.exports = router;
