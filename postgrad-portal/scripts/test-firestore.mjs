import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyBCy59swYINVaEgfPy2XqP6U5nLs8qbadY',
  authDomain: 'postgrad-portal.firebaseapp.com',
  projectId: 'postgrad-portal',
  storageBucket: 'postgrad-portal.firebasestorage.app',
  messagingSenderId: '1074199423382',
  appId: '1:1074199423382:web:1a93b580f2c268dfd955b7',
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
