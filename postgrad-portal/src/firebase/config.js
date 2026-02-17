// ============================================
// Firebase Configuration & Initialization
// ============================================

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyBCy59swYINVaEgfPy2XqP6U5nLs8qbadY",
  authDomain: "postgrad-portal.firebaseapp.com",
  projectId: "postgrad-portal",
  storageBucket: "postgrad-portal.firebasestorage.app",
  messagingSenderId: "1074199423382",
  appId: "1:1074199423382:web:1a93b580f2c268dfd955b7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
