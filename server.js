import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';
import fs from 'fs';

// Load Firebase service account JSON
let serviceAccount;
if (process.env.SERVICE_ACCOUNT_KEY) {
  // Online deployment (Render/Railway) - from env var
  serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);
} else {
  // Local Termux use - from file
  serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Firebase setup
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Shorten URL endpoint
app.post('/api/shorten', async (req, res) => {
  const { url, custom } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const randomCode = Math.random().toString(36).substring(2, 7); // 5 chars
  const code = custom && custom.trim() !== "" ? custom : randomCode;

  try {
    await db.collection('urls').doc(code).set({
      url,
      code,
      hits: 0,
      createdAt: new Date()
    });

    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    res.json({ short: `${baseUrl}/${code}`, code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating short link' });
  }
});

// Redirect endpoint
app.get('/:code', async (req, res) => {
  const { code } = req.params;
  const docSnap = await db.collection('urls').doc(code).get();
  if (!docSnap.exists) {
    return res.status(404).send('Not found');
  }
  const data = docSnap.data();
  await db.collection('urls').doc(code).update({ hits: data.hits + 1 });
  res.redirect(data.url);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
});
