// src/config/firebase.admin.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../../../service-account.json' assert { type: 'json' }; // Adjust path

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);
export { db };
