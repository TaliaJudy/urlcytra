const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

// Load Firebase service account
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Generate random code starting with "cytra"
function generateCode() {
  const randomPart = Math.random().toString(36).substring(2, 7);
  return 'cytra' + randomPart;
}

// API route to shorten URL
app.post('/api/shorten', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const code = generateCode();

  try {
    await db.collection('urls').doc(code).set({
      url,
      code,
      hits: 0,
      createdAt: new Date()
    });

    res.json({
      short: `${req.protocol}://${req.get('host')}/${code}`,
      code
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating short link' });
  }
});

// Redirect short code to original URL
app.get('/:code', async (req, res) => {
  const code = req.params.code;

  try {
    const docSnap = await db.collection('urls').doc(code).get();

    if (!docSnap.exists) {
      return res.status(404).send('Short link not found');
    }

    const data = docSnap.data();
    await db.collection('urls').doc(code).update({
      hits: (data.hits || 0) + 1
    });

    res.redirect(data.url);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error redirecting');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Cytra Shortener running on port ${PORT}`);
});
