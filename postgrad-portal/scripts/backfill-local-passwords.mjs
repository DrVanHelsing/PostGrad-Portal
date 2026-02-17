import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const DEFAULT_PASSWORD = 'Portal@2026';

const firebaseConfig = {
  apiKey: 'AIzaSyBCy59swYINVaEgfPy2XqP6U5nLs8qbadY',
  authDomain: 'postgrad-portal.firebaseapp.com',
  projectId: 'postgrad-portal',
  storageBucket: 'postgrad-portal.firebasestorage.app',
  messagingSenderId: '1074199423382',
  appId: '1:1074199423382:web:1a93b580f2c268dfd955b7',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const usersSnap = await getDocs(collection(db, 'users'));
  let updated = 0;
  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    if (!data.localPassword) {
      await updateDoc(doc(db, 'users', userDoc.id), { localPassword: DEFAULT_PASSWORD });
      updated++;
    }
  }
  console.log(`Updated ${updated} user docs with localPassword.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
