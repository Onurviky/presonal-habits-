import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBxE0mL9K2q4fRm2kpztSy1h8OhsUl24_Q",
  authDomain: "personal-habits-a270f.firebaseapp.com",
  projectId: "personal-habits-a270f",
  storageBucket: "personal-habits-a270f.firebasestorage.app",
  messagingSenderId: "617029929455",
  appId: "1:617029929455:web:cd40d6d2f8a19b8ef3ce1a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
