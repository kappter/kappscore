// Firebase Configuration
// This file contains the Firebase setup and configuration

// Firebase configuration object
// Note: These are public configuration values that are safe to expose in client-side code
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

// Firebase Database Service Class
class FirebaseService {
    constructor() {
        this.app = null;
        this.database = null;
        this.isInitialized = false;
        this.isOnline = false;
        this.sessionRef = null;
        this.listeners = new Map();
    }

    // Initialize Firebase
    async initialize() {
        try {
            // Check if Firebase is available
            if (typeof firebase === 'undefined') {
                console.warn('Firebase SDK not loaded. Running in offline mode.');
                return false;
            }

            // Initialize Firebase app
            this.app = firebase.initializeApp(firebaseConfig);
            this.database = firebase.database();
            
            // Set up connection monitoring
            this.setupConnectionMonitoring();
            
            this.isInitialized = true;
            console.log('Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            console.warn('Running in offline mode');
            return false;
        }
    }

    // Monitor connection status
    setupConnectionMonitoring() {
        const connectedRef = this.database.ref('.info/connected');
        connectedRef.on('value', (snapshot) => {
            this.isOnline = snapshot.val() === true;
            console.log('Firebase connection status:', this.isOnline ? 'Online' : 'Offline');
            
            // Notify app of connection status change
            if (window.app) {
                window.app.onConnectionStatusChange(this.isOnline);
            }
        });
    }

    // Create a new game session
    async createSession(sessionData) {
        if (!this.isInitialized || !this.isOnline) {
            throw new Error('Firebase not available. Cannot create session.');
        }

        try {
            // Generate unique session ID
            const sessionId = this.generateSessionId();
            
            // Prepare session data
            const gameSession = {
                ...sessionData,
                sessionId: sessionId,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                lastUpdated: firebase.database.ServerValue.TIMESTAMP,
                isActive: true,
                createdBy: 'scorekeeper'
            };

            // Save to Firebase
            await this.database.ref(`sessions/${sessionId}`).set(gameSession);
            
            console.log('Session created successfully:', sessionId);
            return sessionId;
        } catch (error) {
            console.error('Error creating session:', error);
            throw error;
        }
    }

    // Join an existing session
    async joinSession(sessionId) {
        if (!this.isInitialized || !this.isOnline) {
            throw new Error('Firebase not available. Cannot join session.');
        }

        try {
            // Check if session exists
            const snapshot = await this.database.ref(`sessions/${sessionId}`).once('value');
            
            if (!snapshot.exists()) {
                throw new Error('Session not found');
            }

            const sessionData = snapshot.val();
            
            if (!sessionData.isActive) {
                throw new Error('Session is no longer active');
            }

            console.log('Successfully joined session:', sessionId);
            return sessionData;
        } catch (error) {
            console.error('Error joining session:', error);
            throw error;
        }
    }

    // Listen to session updates
    listenToSession(sessionId, callback) {
        if (!this.isInitialized || !this.isOnline) {
            console.warn('Firebase not available. Cannot listen to session updates.');
            return null;
        }

        try {
            this.sessionRef = this.database.ref(`sessions/${sessionId}`);
            
            const listener = this.sessionRef.on('value', (snapshot) => {
                if (snapshot.exists()) {
                    const sessionData = snapshot.val();
                    callback(sessionData);
                } else {
                    callback(null);
                }
            });

            // Store listener for cleanup
            this.listeners.set(sessionId, listener);
            
            console.log('Listening to session updates:', sessionId);
            return listener;
        } catch (error) {
            console.error('Error setting up session listener:', error);
            return null;
        }
    }

    // Update session data
    async updateSession(sessionId, updates) {
        if (!this.isInitialized || !this.isOnline) {
            throw new Error('Firebase not available. Cannot update session.');
        }

        try {
            const updateData = {
                ...updates,
                lastUpdated: firebase.database.ServerValue.TIMESTAMP
            };

            await this.database.ref(`sessions/${sessionId}`).update(updateData);
            console.log('Session updated successfully');
        } catch (error) {
            console.error('Error updating session:', error);
            throw error;
        }
    }

    // Update player score
    async updatePlayerScore(sessionId, playerId, newScore) {
        if (!this.isInitialized || !this.isOnline) {
            throw new Error('Firebase not available. Cannot update score.');
        }

        try {
            const updates = {};
            updates[`players/${playerId}/score`] = newScore;
            updates['lastUpdated'] = firebase.database.ServerValue.TIMESTAMP;

            await this.database.ref(`sessions/${sessionId}`).update(updates);
            console.log('Player score updated successfully');
        } catch (error) {
            console.error('Error updating player score:', error);
            throw error;
        }
    }

    // Update player name
    async updatePlayerName(sessionId, playerId, newName) {
        if (!this.isInitialized || !this.isOnline) {
            throw new Error('Firebase not available. Cannot update player name.');
        }

        try {
            const updates = {};
            updates[`players/${playerId}/name`] = newName;
            updates['lastUpdated'] = firebase.database.ServerValue.TIMESTAMP;

            await this.database.ref(`sessions/${sessionId}`).update(updates);
            console.log('Player name updated successfully');
        } catch (error) {
            console.error('Error updating player name:', error);
            throw error;
        }
    }

    // End session
    async endSession(sessionId) {
        if (!this.isInitialized || !this.isOnline) {
            throw new Error('Firebase not available. Cannot end session.');
        }

        try {
            await this.database.ref(`sessions/${sessionId}`).update({
                isActive: false,
                endedAt: firebase.database.ServerValue.TIMESTAMP,
                lastUpdated: firebase.database.ServerValue.TIMESTAMP
            });
            
            console.log('Session ended successfully');
        } catch (error) {
            console.error('Error ending session:', error);
            throw error;
        }
    }

    // Clean up listeners
    cleanup() {
        if (this.sessionRef) {
            this.sessionRef.off();
            this.sessionRef = null;
        }

        this.listeners.forEach((listener, sessionId) => {
            this.database.ref(`sessions/${sessionId}`).off('value', listener);
        });
        
        this.listeners.clear();
        console.log('Firebase listeners cleaned up');
    }

    // Generate unique session ID
    generateSessionId() {
        // Generate a 6-character alphanumeric code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Check if Firebase is available and online
    isAvailable() {
        return this.isInitialized && this.isOnline;
    }

    // Get connection status
    getConnectionStatus() {
        return {
            initialized: this.isInitialized,
            online: this.isOnline,
            available: this.isAvailable()
        };
    }
}

// Export for use in main application
window.FirebaseService = FirebaseService;

