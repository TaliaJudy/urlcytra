app.post('/api/shorten', async (req, res) => {
  const { url, custom } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Generate random code if none provided
  const randomCode = Math.random().toString(36).substring(2, 7); // 5 random chars
  const code = "cytra" + (custom && custom.trim() !== "" ? custom : randomCode);

  try {
    await db.collection('urls').doc(code).set({
      url,
      code,
      hits: 0,
      createdAt: new Date()
    });
    res.json({ short: `${req.protocol}://${req.get('host')}/${code}`, code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating short link' });
  }
});
