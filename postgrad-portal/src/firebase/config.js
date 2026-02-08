// ============================================
// Firebase Configuration & Initialization
// ============================================

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyBu7YrBJg_eNGqUlXIGCzNltScSQKYLp28",
  authDomain: "pg-portal1.firebaseapp.com",
  projectId: "pg-portal1",
  storageBucket: "pg-portal1.firebasestorage.app",
  messagingSenderId: "757138632732",
  appId: "1:757138632732:web:b564e133fba3a6f8862fd9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
