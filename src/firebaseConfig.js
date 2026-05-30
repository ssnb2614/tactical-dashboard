import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAZeoX0HH70snxAUzNXm5bnOhtAILEK-Z4",
  authDomain: "cqb-simulator.firebaseapp.com",
  projectId: "cqb-simulator",
  storageBucket: "cqb-simulator.firebasestorage.app",
  messagingSenderId: "526742977412",
  appId: "1:526742977412:web:f35845d4ee1f5f8001fbd1",
  measurementId: "G-3ENKC17HR4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);