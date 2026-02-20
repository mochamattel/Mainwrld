import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyATdmkd_HpJcFUS2Z-r91Xb1OLwSX3ufXo",
  authDomain: "mainwrld-f7acf.firebaseapp.com",
  projectId: "mainwrld-f7acf",
  storageBucket: "mainwrld-f7acf.firebasestorage.app",
  messagingSenderId: "1059260491265",
  appId: "1:1059260491265:web:ffdf872acaca0532dcc200",
  measurementId: "G-JWHH5DXQ6V"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
