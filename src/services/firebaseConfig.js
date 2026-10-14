import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyABfrO2DNt3yvYdxlbiken3GOdDvObYDXc",
    authDomain: "mitica-cerimonia-1f1d4.firebaseapp.com",
    projectId: "mitica-cerimonia-1f1d4",
    storageBucket: "mitica-cerimonia-1f1d4.firebasestorage.app",
    messagingSenderId: "850221213281",
    appId: "1:850221213281:web:349e0fcfde6fed0622ac20",
    measurementId: "G-HPSLH3M500"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);

// Enable Offline Persistence (IndexedDB)
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});

export const storage = getStorage(app);

// Auth Providers
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

export default app;
