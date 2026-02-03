import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBk1HWgtiGD8BRubQa2bm-aOWg5PNl0lfY",
  authDomain: "skillcompanionapp.firebaseapp.com",
  projectId: "skillcompanionapp",
  storageBucket: "skillcompanionapp.firebasestorage.app",
  messagingSenderId: "618566580140",
  appId: "1:618566580140:web:df32c3c20c030140eeac09",
  measurementId: "G-TEZRMQQ5W8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
