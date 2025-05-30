// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
export const firebaseConfig = {
    apiKey: "AIzaSyCAHNsdxpBC2TSNXvJI2Vt6uiD8eJkN3_4",
    authDomain: "tres-amigos-sportsbook.firebaseapp.com",
    projectId: "tres-amigos-sportsbook",
    storageBucket: "tres-amigos-sportsbook.firebasestorage.app",
    messagingSenderId: "186812042455",
    appId: "1:186812042455:web:4d9638a02cb59345a57492"
};

// ✅ Initialize Firebase app and services
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, provider);
export const logout = () => signOut(auth);
