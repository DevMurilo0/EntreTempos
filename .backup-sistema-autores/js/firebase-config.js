import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCC_MH5a5WvD602F9Y7JnAzYpJow3i1axA",
  authDomain: "entretempos-27471.firebaseapp.com",
  projectId: "entretempos-27471",
  storageBucket: "entretempos-27471.firebasestorage.app",
  messagingSenderId: "448383791330",
  appId: "1:448383791330:web:b19cafc6ce5311292c6ebb",
  measurementId: "G-KY4BW1WF0B"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
