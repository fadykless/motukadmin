import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, memoryLocalCache, connectFirestoreEmulator } from "firebase/firestore";

const productionConfig = {
  apiKey: "AIzaSyCDiUXcwiZbSvlWxy0eOZ5vjjXSmNu39zg",
  authDomain: "motukapp.firebaseapp.com",
  projectId: "motukapp",
  storageBucket: "motukapp.appspot.com",
  messagingSenderId: "921326757564",
  appId: "1:921326757564:web:585aa4c6131f303e8792b9",
  measurementId: "G-BF3DTW6YMB",
};

// This flag must only be set for the isolated local C2 recipe.
// Production configuration is unchanged when the flag is absent.
const c2EmulatorMode = process.env.NEXT_PUBLIC_C2_EMULATOR_MODE === "true";
const firebaseConfig = c2EmulatorMode
  ? { apiKey: "demo-api-key", authDomain: "localhost", projectId: "demo-motuka-c2", appId: "demo-motuka-c2" }
  : productionConfig;
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: c2EmulatorMode ? memoryLocalCache() : persistentLocalCache(),
});

if (c2EmulatorMode) {
  // Fail closed: never fall back to live Firebase when local emulator mode is selected.
  if (typeof window !== "undefined" && !["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    throw new Error("C2 emulator mode is restricted to localhost");
  }
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
