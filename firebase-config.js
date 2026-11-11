// Isi dengan konfigurasi Firebase Web App milikmu.
// Firebase Console > Project settings > General > Your apps > SDK setup and configuration.
// Konfigurasi ini bukan private key dan memang digunakan pada website.
export const firebaseConfig = {
  apiKey: "PASTE_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export const isFirebaseConfigured =
  firebaseConfig.apiKey !== "PASTE_API_KEY_HERE" &&
  firebaseConfig.projectId !== "YOUR_PROJECT_ID" &&
  Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
