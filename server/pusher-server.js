const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Pusher = require('pusher');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PUSHER_APP_ID = process.env.PUSHER_APP_ID || '2108585';
const PUSHER_KEY = process.env.PUSHER_KEY || '64bc31ef26b86bcd3928';
const PUSHER_SECRET = process.env.PUSHER_SECRET || 'ce876943d4fe15521406';
const PUSHER_CLUSTER = process.env.PUSHER_CLUSTER || 'eu';

const pusher = new Pusher({
  appId: PUSHER_APP_ID,
  key: PUSHER_KEY,
  secret: PUSHER_SECRET,
  cluster: PUSHER_CLUSTER,
  useTLS: true,
});

app.post('/send-message', async (req, res) => {
  try {
    const { conversationId, message } = req.body || {};
    if (!conversationId || !message) return res.status(400).json({ error: 'Missing conversationId or message' });

    // If the message contains a quote field that is a JSON string, parse it
    if (message.quote && typeof message.quote === 'string') {
      try {
        message.quote = JSON.parse(message.quote);
      } catch (e) {
        // leave as-is; client should send valid JSON for complex objects
      }
    }

    const channel = `chat-${conversationId}`;

    // Trigger the event 'new-message' with the message object
    await pusher.trigger(channel, 'new-message', message);

    return res.json({ ok: true });
  } catch (err) {
    console.error('Failed to trigger pusher:', err);
    return res.status(500).json({ error: 'trigger failed' });
  }
});

// Respond to Chrome DevTools well-known probe to avoid noisy 404s in dev
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.json({});
});

// Simple root endpoint to avoid 404 noise when the browser probes the origin
app.get('/', (req, res) => {
  res.send('Pusher trigger server running');
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Pusher server listening on http://localhost:${port}`);
});
