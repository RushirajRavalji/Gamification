import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBawYdA6PhTyCpWnKcBsDfkku9hSaK7MWU",
  authDomain: "gamify-d57c0.firebaseapp.com",
  projectId: "gamify-d57c0",
  storageBucket: "gamify-d57c0.firebasestorage.app",
  messagingSenderId: "971763501690",
  appId: "1:971763501690:web:292f838d2b6a803f42c9c3",
  measurementId: "G-Q44XXVDP90"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Set persistence to LOCAL - this keeps the user logged in even after browser is closed
// Only run in browser environment
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('Firebase persistence set to LOCAL');
    })
    .catch((error) => {
      console.error('Error setting persistence:', error);
    });
}

const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Analytics only in browser environments
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, auth, db, storage, analytics }; 