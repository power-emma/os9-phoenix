const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

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

// Start the server
app.listen(port, () => {
  console.log(`Express server running at http://localhost:${port}/`);
});