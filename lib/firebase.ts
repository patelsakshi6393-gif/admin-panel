import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mini-messanger-bcf35",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:532892733796:web:347f704604a021db7caa71",
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAumTTehJ9srQLNmelnOX15evSzrri4OBc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mini-messanger-bcf35.firebaseapp.com",
  firestoreDatabaseId:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID ||
    "ai-studio-remixrummyaddain-c46991fc-f7be-4715-a22d-e80dede93872",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mini-messanger-bcf35.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "532892733796",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
  oAuthClientId: process.env.NEXT_PUBLIC_FIREBASE_OAUTH_CLIENT_ID || "532892733796-n57g9a2654g9i1ufrj9b1hthdtl8nuce.apps.googleusercontent.com",
  recaptchaSiteKey: process.env.NEXT_PUBLIC_FIREBASE_RECAPTCHA_SITE_KEY || "",
};

// Initialize or reuse Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore targeting the specific database requested
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

export default app;
