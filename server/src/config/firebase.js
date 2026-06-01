const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// In production, use service account JSON or environment variables
const initFirebase = () => {
  if (admin.apps.length > 0) return admin;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    // Fallback: use application default credentials (for local dev with gcloud auth)
    console.warn('[Firebase] No service account env vars found. Using default credentials.');
    admin.initializeApp();
  }

  return admin;
};

module.exports = { initFirebase, admin };
