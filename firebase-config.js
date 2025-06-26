// Firebase Configuration for GameScore Pro
// This file contains Firebase setup and connection management

// Firebase configuration object
// Replace these values with your actual Firebase project credentials
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Global variables for Firebase state
let firebaseApp = null;
let firebaseInitialized = false;
let firebaseConnectionStatus = false;

// Initialize Firebase with better error handling
function initializeFirebase() {
    try {
        // Check if Firebase is available
        if (typeof firebase === 'undefined') {
            console.log('Firebase SDK not loaded, running in offline-only mode');
            firebaseInitialized = false;
            updateConnectionStatus(false);
            return false;
        }

        // Check if config has real values (not placeholders)
        if (firebaseConfig.apiKey === "your-api-key-here" || 
            firebaseConfig.databaseURL.includes("your-project-id")) {
            console.log('Firebase not configured with real credentials, running in offline-only mode');
            firebaseInitialized = false;
            updateConnectionStatus(false);
            return false;
        }

        // Initialize Firebase
        firebaseApp = firebase.initializeApp(firebaseConfig);
        firebaseInitialized = true;
        
        console.log('Firebase initialized successfully');
        
        // Set up connection monitoring
        setupConnectionMonitoring();
        
        return true;
    } catch (error) {
        console.log('Firebase initialization failed, running in offline-only mode:', error.message);
        firebaseInitialized = false;
        updateConnectionStatus(false);
        return false;
    }
}

function setupConnectionMonitoring() {
    if (!firebaseInitialized) return;
    
    try {
        const database = firebase.database();
        const connectedRef = database.ref('.info/connected');
        
        connectedRef.on('value', (snapshot) => {
            const connected = snapshot.val();
            console.log('Firebase connection status:', connected ? 'Online' : 'Offline');
            firebaseConnectionStatus = connected;
            updateConnectionStatus(connected);
        });
    } catch (error) {
        console.log('Connection monitoring setup failed:', error.message);
        firebaseConnectionStatus = false;
        updateConnectionStatus(false);
    }
}

function updateConnectionStatus(isConnected) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        if (firebaseInitialized) {
            statusElement.textContent = isConnected ? 'Online' : 'Offline';
            statusElement.className = isConnected ? 'connection-status status-online' : 'connection-status status-offline';
        } else {
            statusElement.textContent = 'Local Mode';
            statusElement.className = 'connection-status status-local';
        }
    }
}

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure Firebase SDK is loaded
    setTimeout(() => {
        initializeFirebase();
    }, 100);
});