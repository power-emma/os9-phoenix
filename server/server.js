const express = require('express');
const cors = require('cors');
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
// mount simple chat API at /api/chat
const chatRouter = require('./routes/chat');
app.use('/api/chat', chatRouter);
console.log('Mounted routes: /api/desktop, /api/chat');

// Start the server. Default bind address is loopback (127.0.0.1) so the API
// is not exposed directly to the internet; nginx will proxy /api/ to this port.
const bindAddr = process.env.BIND_ADDR || '127.0.0.1';
app.listen(port, bindAddr, () => {
  console.log(`Express server running at http://${bindAddr}:${port}/`);
});