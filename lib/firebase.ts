
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAXZAwILOciHuT_8vZzjNHjB2eQxPFGZL0",
  authDomain: "dertlio-acfe4.firebaseapp.com",
  projectId: "dertlio-acfe4",
  storageBucket: "dertlio-acfe4.firebasestorage.app",
  messagingSenderId: "719318828226",
  appId: "1:719318828226:web:85fe628252f110ecc7275b",
  measurementId: "G-YEKKG1M2JW"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
