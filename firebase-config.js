// Firebase Configuration for GameScore Pro
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
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Connection status monitoring
let isConnected = false;

// Monitor connection status
const connectedRef = database.ref('.info/connected');
connectedRef.on('value', (snapshot) => {
    isConnected = snapshot.val() === true;
    updateConnectionStatus(isConnected);
    console.log('Firebase connection status:', isConnected ? 'Online' : 'Offline');
});

// Update connection status in UI
function updateConnectionStatus(connected) {
    const dots = document.querySelectorAll('.status-dot');
    const texts = document.querySelectorAll('.status-text');
    
    dots.forEach(dot => {
        dot.className = `status-dot ${connected ? 'online' : 'offline'}`;
    });
    
    texts.forEach(text => {
        text.textContent = connected ? 'Online' : 'Offline';
    });
}

console.log('Firebase initialized successfully');

