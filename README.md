# Cytra URL Shortener (Firebase Firestore)

**What this is**
- A ready-to-run URL shortener where every short code starts with `cytra`.
- Backend: Express + Firebase Admin (Firestore).
- Frontend: static HTML/CSS/JS that uses Firebase Web SDK for real-time stats.

**Before you run**
1. Add your Firebase **service account** JSON file to the project root as `serviceAccountKey.json`.
   - Go to Firebase Console → Project Settings → Service accounts → Generate new private key.
2. (Optional) Set environment variable `BASE_URL` to your production domain (e.g. https://short.cytra.com).

**Install & run**
```bash
npm install
npm start
```

**Files**
- `server.js` - Express server (FireStore backend).
- `public/` - frontend files (served statically).
- `views/info.ejs` - friendly 404/info page.
- `serviceAccountKey.json` - **NOT INCLUDED**. Add your own.

**Security note**
- This project does not include authentication for admin endpoints. Protect `/api/recent` or add admin auth before deploying publicly.
- Don't commit your service account key to public repos.
