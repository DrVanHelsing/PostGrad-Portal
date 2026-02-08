import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyBu7YrBJg_eNGqUlXIGCzNltScSQKYLp28',
  authDomain: 'pg-portal1.firebaseapp.com',
  projectId: 'pg-portal1',
  storageBucket: 'pg-portal1.firebasestorage.app',
  messagingSenderId: '757138632732',
  appId: '1:757138632732:web:b564e133fba3a6f8862fd9',
});

const db = getFirestore(app);

async function test() {
  try {
    console.log('Testing Firestore write...');
    await setDoc(doc(db, '_test', 'ping'), { ts: Date.now() });
    console.log('WRITE OK');
  } catch (e) {
    console.error('WRITE FAIL:', e.code, e.message);
  }

  try {
    console.log('Testing Firestore read...');
    const snap = await getDocs(collection(db, '_test'));
    console.log('READ OK, docs:', snap.size);
  } catch (e) {
    console.error('READ FAIL:', e.code, e.message);
  }

  process.exit(0);
}

test();
