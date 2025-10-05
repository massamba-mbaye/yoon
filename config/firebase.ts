import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBDmhI__AuZo2G6v2_0c6KMVXeUMLMWeoE",
  authDomain: "covoiturageapp-c3383.firebaseapp.com",
  projectId: "covoiturageapp-c3383",
  storageBucket: "covoiturageapp-c3383.firebasestorage.app",
  messagingSenderId: "867439135045",
  appId: "1:867439135045:web:d94271d0cdb3f72a92962c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configure persistence with AsyncStorage
setPersistence(auth, browserLocalPersistence);

export default app;