// firebase-init.js — single Firebase bootstrap. Import { app, auth, db } anywhere it's needed.
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const cfg = {
  apiKey:"AIzaSyA8sUFIq81cs6uQvqduardpGJ4R2DxO8NQ",
  authDomain:"micourt-dada6.firebaseapp.com",
  projectId:"micourt-dada6",
  storageBucket:"micourt-dada6.firebasestorage.app",
  messagingSenderId:"1013564619997",
  appId:"1:1013564619997:web:8f259dab457915758f6f34"
};

export const app  = getApps().length ? getApp() : initializeApp(cfg);
export const auth = getAuth(app);
export const db   = getFirestore(app);