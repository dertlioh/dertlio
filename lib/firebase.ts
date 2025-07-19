
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAXZAwILOciHuT_8vZzjNHjB2eQxPFGZL0",
  authDomain: "dertlio-acfe4.firebaseapp.com",
  projectId: "dertlio-acfe4",
  storageBucket: "dertlio-acfe4.firebasestorage.app",
  messagingSenderId: "719318828226",
  appId: "1:719318828226:web:85fe628252f110ecc7275b",
  measurementId: "G-YEKKG1M2JW"
};

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
