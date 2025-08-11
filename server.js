import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ES module path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load Firebase service account key
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8')
);

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Base URL for your short links
const BASE_URL = "https://urlcytra2.onrender.com"; // ✅ your Render domain

// API route to shorten URL
app.post('/api/shorten', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Create short code
    const code = Math.random().toString(36).substring(2, 8);

    // Save to Firestore
    await db.collection('urls').doc(code).set({
      url,
      hits: 0
    });

    res.json({
      short: `${BASE_URL}/${code}`,
      code
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Redirect short link
app.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const docSnap = await db.collection('urls').doc(code).get();

    if (!docSnap.exists) {
      return res.status(404).send('Link not found');
    }

    const data = docSnap.data();
    await db.collection('urls').doc(code).update({
      hits: (data.hits || 0) + 1
    });

    res.redirect(data.url);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at ${BASE_URL}`);
});
