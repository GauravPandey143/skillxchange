// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 🔐 Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB8U1_VyzwVgm1Y1EQMIPOuA5Uz5wXmNeY",
  authDomain: "skillxchange-d07cd.firebaseapp.com",
  projectId: "skillxchange-d07cd",
  storageBucket: "skillxchange-d07cd.firebasestorage.app",
  messagingSenderId: "410122787263",
  appId: "1:410122787263:web:d8ea60b58a2fb34818a90a"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
