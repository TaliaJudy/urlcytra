import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCyQTC9BMD90v8EOS5ZJOOzLArqifp85Qk",
  authDomain: "cytra-a9b1d.firebaseapp.com",
  projectId: "cytra-a9b1d",
  storageBucket: "cytra-a9b1d.firebasestorage.app",
  messagingSenderId: "60383087529",
  appId: "1:60383087529:web:4c4c792eba06a10f4412b8",
  measurementId: "G-LGJ250744Y"
};

// Init Firebase
const appFB = initializeApp(firebaseConfig);
const db = getFirestore(appFB);

// Select elements
const form = document.getElementById('shortenForm');
const urlInput = document.getElementById('url');
const customInput = document.getElementById('custom');
const resultBox = document.getElementById('result');
const shortLink = document.getElementById('shortLink');
const stats = document.getElementById('stats');
const copyBtn = document.getElementById('copyBtn');

// Backend base URL — change this to your Termux IP:PORT
const BASE_API = "http://192.168.1.100:3000"; // example, replace with your device IP

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = urlInput.value.trim();
  const custom = customInput ? customInput.value.trim() : "";

  try {
    const res = await fetch(`${BASE_API}/api/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, custom })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Error creating short link');
      return;
    }

    shortLink.href = data.short;
    shortLink.textContent = data.short;
    resultBox.classList.remove('hidden');

    // Copy button
    copyBtn.style.display = 'inline-block';
    copyBtn.textContent = 'Copy to Clipboard';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(data.short).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => (copyBtn.textContent = 'Copy to Clipboard'), 1500);
      });
    };

    // Live stats from Firestore
    const statsRef = doc(db, "urls", data.code);
    onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        stats.textContent = `Original: ${d.url} · Hits: ${d.hits}`;
      }
    });

  } catch (err) {
    console.error(err);
    alert('Network error — check backend is running and BASE_API is correct');
  }
});
