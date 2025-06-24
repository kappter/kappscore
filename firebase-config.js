// Firebase Configuration for GameScore Pro
// Replace with your actual Firebase project credentials

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

// Firebase Service Class
class FirebaseService {
    constructor() {
        this.app = null;
        this.database = null;
        this.isConnected = false;
        this.connectionCallbacks = [];
    }

    async initialize() {
        try {
            // Initialize Firebase
            this.app = firebase.initializeApp(firebaseConfig);
            this.database = firebase.database();
            
            console.log('Firebase initialized successfully');
            
            // Set up connection monitoring
            this.setupConnectionMonitoring();
            
            return true;
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            return false;
        }
    }

    setupConnectionMonitoring() {
        const connectedRef = this.database.ref('.info/connected');
        connectedRef.on('value', (snapshot) => {
            const isConnected = snapshot.val();
            this.isConnected = isConnected;
            
            // Update connection status in UI
            this.updateConnectionStatus(isConnected);
            
            // Notify callbacks
            this.connectionCallbacks.forEach(callback => {
                try {
                    callback(isConnected);
                } catch (error) {
                    console.error('Connection callback error:', error);
                }
            });
            
            console.log('Firebase connection status:', isConnected ? 'Online' : 'Offline');
        });
    }

    updateConnectionStatus(isConnected) {
        const statusElements = document.querySelectorAll('.connection-status');
        statusElements.forEach(element => {
            const dot = element.querySelector('.status-dot');
            const text = element.querySelector('.status-text');
            
            if (dot && text) {
                if (isConnected) {
                    dot.className = 'status-dot online';
                    text.textContent = 'Online';
                } else {
                    dot.className = 'status-dot offline';
                    text.textContent = 'Offline';
                }
            }
        });
    }

    onConnectionChange(callback) {
        this.connectionCallbacks.push(callback);
    }

    isAvailable() {
        return this.database !== null;
    }

    async createSession(sessionData) {
        if (!this.isAvailable()) throw new Error('Firebase not available');
        
        const sessionCode = this.generateSessionCode();
        const sessionRef = this.database.ref(`sessions/${sessionCode}`);
        
        const fullSessionData = {
            metadata: {
                name: sessionData.sessionName || 'Game Session',
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                createdBy: 'scorekeeper',
                playerCount: sessionData.numPlayers,
                settings: {
                    startingScore: sessionData.startingScore,
                    allowDecimals: sessionData.allowDecimals,
                    targetScore: sessionData.targetScore,
                    playAfterTarget: sessionData.playAfterTarget
                }
            },
            players: this.convertPlayersToObject(sessionData.players),
            scoreHistory: [],
            status: 'active'
        };
        
        await sessionRef.set(fullSessionData);
        console.log('Session created successfully:', sessionCode);
        return sessionCode;
    }

    convertPlayersToObject(playersArray) {
        const playersObject = {};
        playersArray.forEach(player => {
            playersObject[player.id] = {
                name: player.name,
                score: player.score,
                joinedAt: firebase.database.ServerValue.TIMESTAMP,
                isActive: true
            };
        });
        return playersObject;
    }

    async joinSession(sessionCode) {
        if (!this.isAvailable()) throw new Error('Firebase not available');
        
        const sessionRef = this.database.ref(`sessions/${sessionCode}`);
        const snapshot = await sessionRef.once('value');
        
        if (!snapshot.exists()) {
            throw new Error('Session not found');
        }
        
        const sessionData = snapshot.val();
        return {
            sessionName: sessionData.metadata.name,
            players: Object.keys(sessionData.players || {}).map(playerId => ({
                id: playerId,
                name: sessionData.players[playerId].name,
                score: sessionData.players[playerId].score
            })),
            settings: sessionData.metadata.settings
        };
    }

    listenToSession(sessionCode, callback) {
        if (!this.isAvailable()) return;
        
        const sessionRef = this.database.ref(`sessions/${sessionCode}`);
        sessionRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val());
            }
        });
        
        console.log('Listening to session updates:', sessionCode);
    }

    async updatePlayerScore(sessionCode, playerId, newScore) {
        if (!this.isAvailable()) throw new Error('Firebase not available');
        
        const playerRef = this.database.ref(`sessions/${sessionCode}/players/${playerId}/score`);
        await playerRef.set(newScore);
        console.log('Player score updated successfully');
    }

    async updatePlayerName(sessionCode, playerId, newName) {
        if (!this.isAvailable()) throw new Error('Firebase not available');
        
        const playerRef = this.database.ref(`sessions/${sessionCode}/players/${playerId}/name`);
        await playerRef.set(newName);
        console.log('Player name updated successfully');
    }

    async updateSession(sessionCode, updates) {
        if (!this.isAvailable()) throw new Error('Firebase not available');
        
        const sessionRef = this.database.ref(`sessions/${sessionCode}`);
        await sessionRef.update(updates);
    }

    async endSession(sessionCode) {
        if (!this.isAvailable()) throw new Error('Firebase not available');
        
        const sessionRef = this.database.ref(`sessions/${sessionCode}/status`);
        await sessionRef.set('ended');
    }

    generateSessionCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    cleanup() {
        if (this.database) {
            this.database.ref('.info/connected').off();
        }
        console.log('Firebase listeners cleaned up');
    }
}

// Initialize Firebase Service globally
window.firebaseService = new FirebaseService();

