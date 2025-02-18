import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import log from "loglevel";
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

function getFirebaseConfig() {
  return {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  };
}

const app = initializeApp(getFirebaseConfig());
export const db = getFirestore(app);
export const auth = getAuth(app);
export const AIModel = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY,
).getGenerativeModel({ model: "gemini-1.5-flash" });
export const log_instance = log; // Export the log instance for use in other files
