// Isi dengan konfigurasi Firebase Web App milikmu.
// Firebase Console > Project settings > General > Your apps > SDK setup and configuration.
// Konfigurasi ini bukan private key dan memang digunakan pada website.
export const firebaseConfig = {
  apiKey: "AIzaSyAMbYN_Lq-nwX1_Sc75YyzAUZWV2ojRY1Q",
  authDomain: "kalap-63628.firebaseapp.com",
  projectId: "kalap-63628",
  storageBucket: "kalap-63628.firebasestorage.app",
  messagingSenderId: "912640400162",
  appId: "1:912640400162:web:92ce27d35e0ece5531237b",
  measurementId: "G-Y4DQ04YTCH"
};

export const isFirebaseConfigured =
  firebaseConfig.apiKey !== "AIzaSyAMbYN_Lq-nwX1_Sc75YyzAUZWV2ojRY1Q" &&
  firebaseConfig.projectId !== "kalap-63628" &&
  Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
