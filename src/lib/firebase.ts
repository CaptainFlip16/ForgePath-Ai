import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";

// Verify all required env variables are present before initializing
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const isConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

let app;
let auth: any;
let db: any;
let googleProvider: any;

if (isConfigured) {
  try {
    const alreadyInitialized = getApps().length > 0;
    app = alreadyInitialized ? getApp() : initializeApp(firebaseConfig);

    if (alreadyInitialized) {
      // An auth instance may already exist for this app (e.g. HMR in dev) - reuse it
      auth = getAuth(app);
    } else {
      // Explicit persistence + resolver survives Chrome's third-party storage
      // partitioning, which is what breaks the redirect flow on Android Chrome
      auth = initializeAuth(app, {
        persistence: indexedDBLocalPersistence,
        popupRedirectResolver: browserPopupRedirectResolver
      });
    }

    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: "select_account"
    });
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { 
  app, 
  auth, 
  db, 
  googleProvider, 
  isConfigured as isFirebaseConfigured,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
};
export type { FirebaseUser };
