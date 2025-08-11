import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json' assert { type: "json" };

const app = express();

// Enable CORS for all origins (you can restrict this later)
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
  const code = "cytra" + (custom && custom.trim() !== "" ? custom : randomCode);

  try {
    await db.collection('urls').doc(code).set({
      url,
      code,
      hits: 0,
      createdAt: new Date()
    });

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    res.json({ short: `${baseUrl}/${code}`, code });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating short link' });
  }
});

app.get('/:code', async (req, res) => {
  const { code } = req.params;
  const docSnap = await db.collection('urls').doc(code).get();
  if (!docSnap.exists) {
    return res.status(404).sendFile(process.cwd() + '/views/info.ejs');
  }
  const data = docSnap.data();
  await db.collection('urls').doc(code).update({ hits: data.hits + 1 });
  res.redirect(data.url);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
