import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCDiUXcwiZbSvlWxy0eOZ5vjjXSmNu39zg",
  authDomain: "motukapp.firebaseapp.com",
  projectId: "motukapp",
  storageBucket: "motukapp.appspot.com",
  messagingSenderId: "921326757564",
  appId: "1:921326757564:web:585aa4c6131f303e8792b9",
  measurementId: "G-BF3DTW6YMB",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
//export const db = getFirestore(app);

// Initialize Firestore with persistent local cache
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});
