// Firebase Configuration for GameScore Pro
// Replace these values with your actual Firebase project configuration

const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id-default-rtdb.firebaseio.com/",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
    
    // Monitor connection status
    const connectedRef = firebase.database().ref('.info/connected');
    connectedRef.on('value', function(snap) {
        if (snap.val() === true) {
            console.log('Firebase connection status: Online');
        } else {
            console.log('Firebase connection status: Offline');
        }
    });
    
} catch (error) {
    console.error('Error initializing Firebase:', error);
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { firebaseConfig };
}

