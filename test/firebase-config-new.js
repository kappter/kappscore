// Firebase Configuration for GameScore Pro
// Complete configuration with Realtime Database URL

const firebaseConfig = {
  apiKey: "AIzaSyD6-GCVT9CfSCcZzmN1hro1d0FVGpImTkk",
  authDomain: "kappscore.firebaseapp.com",
  databaseURL: "https://kappscore-default-rtdb.firebaseio.com/",
  projectId: "kappscore",
  storageBucket: "kappscore.firebasestorage.app",
  messagingSenderId: "673189308032",
  appId: "1:673189308032:web:B55b94d7d75dc2f0e96865",
  measurementId: "G-7MREYWZRCX"
};

// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };

