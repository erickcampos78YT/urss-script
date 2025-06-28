import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCSwefVjheMEKIMjDGj-r4co-60qQONVV4",
  authDomain: "urss-script.firebaseapp.com",
  projectId: "urss-script",
  storageBucket: "urss-script.firebasestorage.app",
  messagingSenderId: "537743153063",
  appId: "1:537743153063:web:6caf59f9ff53f44f0d8882"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.setPersistence(browserLocalPersistence); 
export const db = getFirestore(app);
export const storage = getStorage(app); 