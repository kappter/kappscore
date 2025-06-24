// Firebase Configuration for GameScore Pro
// Your personal Firebase project configuration

// Firebase configuration object
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
let app;
let database;
let isFirebaseEnabled = false;

try {
  // Initialize Firebase app
  app = firebase.initializeApp(firebaseConfig);
  database = firebase.database();
  
  // Test connection and monitor status
  const connectedRef = database.ref('.info/connected');
  connectedRef.on('value', (snapshot) => {
    if (snapshot.val() === true) {
      console.log('Firebase connection status: Online');
      isFirebaseEnabled = true;
    } else {
      console.log('Firebase connection status: Offline');
      isFirebaseEnabled = false;
    }
  });
  
  console.log('Firebase initialized successfully');
  isFirebaseEnabled = true;
  
} catch (error) {
  console.error('Firebase initialization failed:', error);
  console.log('Running in offline mode');
  isFirebaseEnabled = false;
}

// Export for use in other files
window.firebaseConfig = firebaseConfig;
window.firebaseApp = app;
window.firebaseDatabase = database;
window.isFirebaseEnabled = isFirebaseEnabled;

// Real-time Features Explanation:
// 1. WebSocket Connection: Firebase maintains persistent connection for instant updates
// 2. Data Synchronization: Changes are pushed to all connected clients immediately  
// 3. Presence System: Track online/offline status of users
// 4. Offline Support: Queue changes when offline, sync when reconnected
// 5. Conflict Resolution: Handle simultaneous updates gracefully

