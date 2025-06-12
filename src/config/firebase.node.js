import dotenv from "dotenv";
dotenv.config();

console.log("[ENV] VITE_FIREBASE_API_KEY:", process.env.VITE_FIREBASE_API_KEY);
console.log(
  "[ENV] VITE_FIREBASE_AUTH_DOMAIN:",
  process.env.VITE_FIREBASE_AUTH_DOMAIN,
);
console.log(
  "[ENV] VITE_FIREBASE_PROJECT_ID:",
  process.env.VITE_FIREBASE_PROJECT_ID,
);
console.log(
  "[ENV] VITE_FIREBASE_STORAGE_BUCKET:",
  process.env.VITE_FIREBASE_STORAGE_BUCKET,
);
console.log(
  "[ENV] VITE_FIREBASE_MESSAGING_SENDER_ID:",
  process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
);
console.log("[ENV] VITE_FIREBASE_APP_ID:", process.env.VITE_FIREBASE_APP_ID);

export const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_IREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};
