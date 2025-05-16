// ✅ FILE: src/firebase.jsx
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD_gdjzO6KN9Z_PbMN7LKuKn6JoQnkGQtk",
  authDomain: "fitness-app-2e195.firebaseapp.com",
  projectId: "fitness-app-2e195",
  storageBucket: "fitness-app-2e195.firebasestorage.app",
  messagingSenderId: "1030868975857",
  appId: "1:1030868975857:web:67232d7e8c9843b4bf6950",
  measurementId: "G-GQ4SZ38MWM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const signInWithGoogle = () => signInWithPopup(auth, provider);

export {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithGoogle,
  signOut,
};
