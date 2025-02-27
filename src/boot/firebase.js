import { boot } from "quasar/wrappers";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYehG60irSpb3ezbd4Ma-yeFjjK050R-c",
  authDomain: "scoring-579b9.firebaseapp.com",
  projectId: "scoring-579b9",
  storageBucket: "scoring-579b9.firebasestorage.app",
  messagingSenderId: "566457247555",
  appId: "1:566457247555:web:b9206b3c233f7c34deb1f6",
  measurementId: "G-LRT9JTCHPE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default boot(({ app }) => {
  // Make auth and db available globally in Vue app
  app.config.globalProperties.$auth = auth;
  app.config.globalProperties.$db = db;
});

export { auth, db };
