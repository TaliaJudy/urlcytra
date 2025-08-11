import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCyQTC9BMD90v8EOS5ZJOOzLArqifp85Qk",
  authDomain: "cytra-a9b1d.firebaseapp.com",
  projectId: "cytra-a9b1d",
  storageBucket: "cytra-a9b1d.firebasestorage.app",
  messagingSenderId: "60383087529",
  appId: "1:60383087529:web:4c4c792eba06a10f4412b8",
  measurementId: "G-LGJ250744Y"
};

const appFB = initializeApp(firebaseConfig);
const db = getFirestore(appFB);

// Change this to your backend's deployed URL
const API_BASE = window.location.hostname.includes("localhost")
  ? "http://localhost:3000"
  : "https://urlcytra.onrender.com";

const form = document.getElementById('shortenForm');
const urlInput = document.getElementById('url');
const resultBox = document.getElementById('result');
const shortLink = document.getElementById('shortLink');
const stats = document.getElementById('stats');
const copyBtn = document.getElementById('copyBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = urlInput.value.trim();

  try {
    const res = await fetch(`${API_BASE}/api/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Error creating short link');
      return;
    }

    shortLink.href = data.short;
    shortLink.textContent = data.short;
    resultBox.classList.remove('hidden');

    copyBtn.style.display = 'inline-block';
    copyBtn.textContent = 'Copy to Clipboard';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(data.short).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => (copyBtn.textContent = 'Copy to Clipboard'), 1500);
      });
    };

    const statsRef = doc(db, "urls", data.code);
    onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        stats.textContent = `Original: ${d.url} · Hits: ${d.hits}`;
      }
    });

  } catch (err) {
    console.error(err);
    alert('Network error — could not connect to backend.');
  }
});
