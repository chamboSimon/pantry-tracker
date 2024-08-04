// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD9BVF8D1AbTLa4qsr05ujPUbOx3483Cyc",
  authDomain: "inventory-95bde.firebaseapp.com",
  projectId: "inventory-95bde",
  storageBucket: "inventory-95bde.appspot.com",
  messagingSenderId: "370255899354",
  appId: "1:370255899354:web:5389dde0bbf249892993e3",
  measurementId: "G-GFCYX6D4K8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Check if we are running in the browser environment
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  });
}

// Initialize Firestore
const firestore = getFirestore(app);

export { firestore };

