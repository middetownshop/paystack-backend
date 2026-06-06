import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA-0l64W0lwT5ApnLMLC9XOrEuJFo7IcAY",
  authDomain: "richdata-ee29f.firebaseapp.com",
  databaseURL: "https://richdata-ee29f-default-rtdb.firebaseio.com",
  projectId: "richdata-ee29f",
  storageBucket: "richdata-ee29f.firebasestorage.app",
  messagingSenderId: "487993520516",
  appId: "1:487993520516:web:cd778b6adba9ce0d3fadd1",
  measurementId: "G-BZ46K7ZDQT",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
