// server.js - Cytra URL Shortener (Firestore backend)
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { nanoid } = require('nanoid');
const validUrl = require('valid-url');
const path = require('path');
const admin = require('firebase-admin');
// IMPORTANT: add your Firebase service account JSON to project root as `serviceAccountKey.json`
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 3000;
const BASE = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Rate limiter for shorten endpoint
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/shorten', limiter);

// Shorten endpoint
app.post('/api/shorten', async (req, res) => {
  const { url, custom } = req.body;
  if (!url || !validUrl.isUri(url)) {
    return res.status(400).json({ error: 'Invalid or missing URL.' });
  }

  const prefix = "cytra";
  let code;
  if (custom && /^[0-9A-Za-z-_]{3,20}$/.test(custom)) {
    code = prefix + custom;
  } else {
    code = prefix + nanoid(7);
  }

  try {
    const docRef = db.collection('urls').doc(code);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return res.status(409).json({ error: 'Code already exists. Try another code.' });
    }

    await docRef.set({
      code,
      url,
      hits: 0,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    const short = `${BASE}/${code}`;
    return res.json({ short, code, url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Database error.' });
  }
});

// Redirect handler
app.get('/:code', async (req, res) => {
  const code = req.params.code;
  try {
    const docRef = db.collection('urls').doc(code);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).render('info', { code, base: BASE });
    }

    const data = docSnap.data();
    // atomically increment hits
    await docRef.update({ hits: admin.firestore.FieldValue.increment(1) });
    return res.redirect(data.url);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error redirecting');
  }
});

// Stats
app.get('/api/stats/:code', async (req, res) => {
  try {
    const docSnap = await db.collection('urls').doc(req.params.code).get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.json(docSnap.data());
  } catch (err) {
    return res.status(500).json({ error: 'DB error' });
  }
});

// Simple recent list (admin helper, no auth - remove or protect in production)
app.get('/api/recent', async (req, res) => {
  try {
    const q = await db.collection('urls').orderBy('created_at', 'desc').limit(50).get();
    const rows = [];
    q.forEach(doc => rows.push(doc.data()));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Cytra URL Shortener running at ${BASE}`);
});
