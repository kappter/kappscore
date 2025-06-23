// Rummy Scorekeeper JavaScript with Firebase Integration
// Handles navigation, form interactions, and real-time functionality

class RummyScorekeeper {
    constructor() {
        this.currentPage = 'landingPage';
        this.gameState = {
            sessionCode: '',
            sessionName: '',
            players: [],
            numPlayers: 2,
            startingScore: 0,
            allowDecimals: false,
            targetScore: null,
            playAfterTarget: false,
            isScorekeeper: false,
            currentPlayerName: '',
            isOnline: false
        };
        
        this.firebaseService = null;
        this.sessionListener = null;
        this.init();
    }

    async init() {
        this.bindEvents();
        this.showPage('landingPage');
        
        // Initialize Firebase
        await this.initializeFirebase();
    }

    // Initialize Firebase Service
    async initializeFirebase() {
        try {
            this.firebaseService = new FirebaseService();
            const initialized = await this.firebaseService.initialize();
            
            if (initialized) {
                console.log('Firebase integration enabled');
                this.updateConnectionStatus(true);
            } else {
                console.log('Running in offline mode');
                this.updateConnectionStatus(false);
            }
        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.updateConnectionStatus(false);
        }
    }

    // Update connection status in UI
    updateConnectionStatus(isOnline) {
        this.gameState.isOnline = isOnline;
        
        // Add connection indicator to header
        const headers = document.querySelectorAll('header');
        headers.forEach(header => {
            let indicator = header.querySelector('.connection-status');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.className = 'connection-status';
                header.appendChild(indicator);
            }
            
            indicator.textContent = isOnline ? '🟢 Online' : '🔴 Offline';
            indicator.style.cssText = `
                position: absolute;
                top: 1rem;
                right: 1rem;
                font-size: 0.8rem;
                color: ${isOnline ? '#10b981' : '#ef4444'};
                font-weight: 600;
            `;
        });
    }

    // Firebase connection status change handler
    onConnectionStatusChange(isOnline) {
        this.updateConnectionStatus(isOnline);
        
        if (isOnline && this.gameState.sessionCode) {
            // Reconnect to session if we have one
            this.reconnectToSession();
        }
    }

    // Reconnect to existing session
    async reconnectToSession() {
        if (!this.firebaseService || !this.gameState.sessionCode) return;
        
        try {
            const sessionData = await this.firebaseService.joinSession(this.gameState.sessionCode);
            this.handleSessionData(sessionData);
        } catch (error) {
            console.error('Failed to reconnect to session:', error);
        }
    }

    // Event Binding
    bindEvents() {
        // Landing page navigation
        document.getElementById('createSessionBtn').addEventListener('click', () => {
            this.showPage('createSessionPage');
        });

        document.getElementById('joinSessionBtn').addEventListener('click', () => {
            this.showPage('joinSessionPage');
        });

        // Back buttons
        document.getElementById('backToLanding').addEventListener('click', () => {
            this.showPage('landingPage');
        });

        document.getElementById('backToLandingFromJoin').addEventListener('click', () => {
            this.showPage('landingPage');
        });

        // Player number controls
        document.getElementById('decreasePlayer').addEventListener('click', () => {
            this.changePlayerCount(-1);
        });

        document.getElementById('increasePlayer').addEventListener('click', () => {
            this.changePlayerCount(1);
        });

        // Form submissions
        document.getElementById('createSessionForm').addEventListener('submit', (e) => {
            this.handleCreateSession(e);
        });

        document.getElementById('joinSessionForm').addEventListener('submit', (e) => {
            this.handleJoinSession(e);
        });

        // Decimal checkbox
        document.getElementById('allowDecimals').addEventListener('change', (e) => {
            this.updateScoreStep(e.target.checked);
        });

        // Modal controls
        document.getElementById('showQRBtn').addEventListener('click', () => {
            this.showQRModal();
        });

        document.getElementById('closeQRModal').addEventListener('click', () => {
            this.hideQRModal();
        });

        // Game controls
        document.getElementById('resetScoresBtn').addEventListener('click', () => {
            this.resetAllScores();
        });

        document.getElementById('newRoundBtn').addEventListener('click', () => {
            this.newRound();
        });

        document.getElementById('endSessionBtn').addEventListener('click', () => {
            this.endSession();
        });

        // Player controls
        document.getElementById('editNameBtn').addEventListener('click', () => {
            this.editPlayerName();
        });

        document.getElementById('leaveSessionBtn').addEventListener('click', () => {
            this.leaveSession();
        });

        // QR Scanner (placeholder)
        document.getElementById('scanQRBtn').addEventListener('click', () => {
            this.scanQRCode();
        });

        // Modal background click to close
        document.getElementById('qrModal').addEventListener('click', (e) => {
            if (e.target.id === 'qrModal') {
                this.hideQRModal();
            }
        });
    }

    // Page Navigation
    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        document.getElementById(pageId).classList.add('active');
        this.currentPage = pageId;

        // Add fade-in animation
        document.getElementById(pageId).classList.add('fade-in');
        setTimeout(() => {
            document.getElementById(pageId).classList.remove('fade-in');
        }, 300);
    }

    // Player Count Management
    changePlayerCount(delta) {
        const input = document.getElementById('numPlayers');
        let newValue = parseInt(input.value) + delta;
        
        // Clamp between 1 and 12
        newValue = Math.max(1, Math.min(12, newValue));
        
        input.value = newValue;
        this.gameState.numPlayers = newValue;
    }

    // Score Step Management
    updateScoreStep(allowDecimals) {
        const startingScoreInput = document.getElementById('startingScore');
        const targetScoreInput = document.getElementById('targetScore');
        
        if (allowDecimals) {
            startingScoreInput.step = '0.1';
            targetScoreInput.step = '0.1';
        } else {
            startingScoreInput.step = '1';
            targetScoreInput.step = '1';
        }
        
        this.gameState.allowDecimals = allowDecimals;
    }

    // Session Creation
    async handleCreateSession(e) {
        e.preventDefault();
        
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating Session...';
        submitBtn.disabled = true;
        
        try {
            // Collect form data
            this.gameState.numPlayers = parseInt(document.getElementById('numPlayers').value);
            this.gameState.sessionName = document.getElementById('sessionName').value || 'Rummy Game';
            this.gameState.startingScore = parseFloat(document.getElementById('startingScore').value);
            this.gameState.allowDecimals = document.getElementById('allowDecimals').checked;
            this.gameState.targetScore = document.getElementById('targetScore').value ? 
                parseFloat(document.getElementById('targetScore').value) : null;
            this.gameState.playAfterTarget = document.getElementById('playAfterTarget').checked;
            this.gameState.isScorekeeper = true;

            // Initialize players
            this.initializePlayers();

            // Create session in Firebase or locally
            if (this.firebaseService && this.firebaseService.isAvailable()) {
                await this.createFirebaseSession();
            } else {
                this.createLocalSession();
            }

            // Show scorekeeper interface
            this.setupScorekeeperInterface();
            this.showPage('scorekeeperPage');
            
        } catch (error) {
            console.error('Error creating session:', error);
            alert('Failed to create session. Please try again.');
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    // Create Firebase session
    async createFirebaseSession() {
        const sessionData = {
            sessionName: this.gameState.sessionName,
            numPlayers: this.gameState.numPlayers,
            startingScore: this.gameState.startingScore,
            allowDecimals: this.gameState.allowDecimals,
            targetScore: this.gameState.targetScore,
            playAfterTarget: this.gameState.playAfterTarget,
            players: this.gameState.players
        };

        this.gameState.sessionCode = await this.firebaseService.createSession(sessionData);
        
        // Start listening to session updates
        this.sessionListener = this.firebaseService.listenToSession(
            this.gameState.sessionCode, 
            (sessionData) => this.handleSessionData(sessionData)
        );
    }

    // Create local session (offline mode)
    createLocalSession() {
        this.gameState.sessionCode = this.generateSessionCode();
        console.log('Created local session:', this.gameState.sessionCode);
    }

    // Handle session data updates from Firebase
    handleSessionData(sessionData) {
        if (!sessionData) {
            console.warn('Session data is null');
            return;
        }

        // Update local game state
        this.gameState.players = sessionData.players || this.gameState.players;
        this.gameState.sessionName = sessionData.sessionName || this.gameState.sessionName;
        
        // Update UI if we're on the scorekeeper or player view page
        if (this.currentPage === 'scorekeeperPage') {
            this.updateScorekeeperInterface();
        } else if (this.currentPage === 'playerViewPage') {
            this.updatePlayerViewInterface();
        }
    }

    // Session Joining
    async handleJoinSession(e) {
        e.preventDefault();
        
        const joinCode = document.getElementById('joinCode').value.trim().toUpperCase();
        const playerName = document.getElementById('playerName').value.trim();

        if (!joinCode || !playerName) {
            alert('Please enter both session code and your name.');
            return;
        }

        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Joining Session...';
        submitBtn.disabled = true;

        try {
            // Try to join Firebase session or validate locally
            if (this.firebaseService && this.firebaseService.isAvailable()) {
                await this.joinFirebaseSession(joinCode, playerName);
            } else {
                this.joinLocalSession(joinCode, playerName);
            }

            // Setup player view
            this.setupPlayerView();
            this.showPage('playerViewPage');
            
        } catch (error) {
            console.error('Error joining session:', error);
            alert('Failed to join session. Please check the code and try again.');
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    // Join Firebase session
    async joinFirebaseSession(joinCode, playerName) {
        const sessionData = await this.firebaseService.joinSession(joinCode);
        
        this.gameState.sessionCode = joinCode;
        this.gameState.currentPlayerName = playerName;
        this.gameState.isScorekeeper = false;
        this.gameState.sessionName = sessionData.sessionName;
        this.gameState.players = sessionData.players;
        this.gameState.allowDecimals = sessionData.allowDecimals;

        // Start listening to session updates
        this.sessionListener = this.firebaseService.listenToSession(
            joinCode, 
            (sessionData) => this.handleSessionData(sessionData)
        );
    }

    // Join local session (offline mode)
    joinLocalSession(joinCode, playerName) {
        if (this.validateSessionCode(joinCode)) {
            this.gameState.sessionCode = joinCode;
            this.gameState.currentPlayerName = playerName;
            this.gameState.isScorekeeper = false;
            
            // Create dummy session data for offline mode
            this.gameState.sessionName = 'Offline Game';
            this.initializePlayers();
        } else {
            throw new Error('Invalid session code');
        }
    }

    // Player Initialization
    initializePlayers() {
        this.gameState.players = [];
        for (let i = 1; i <= this.gameState.numPlayers; i++) {
            this.gameState.players.push({
                id: i,
                name: `Player ${i}`,
                score: this.gameState.startingScore,
                isEditing: false
            });
        }
    }

    // Scorekeeper Interface Setup
    setupScorekeeperInterface() {
        // Update session title and code
        document.getElementById('sessionTitle').textContent = this.gameState.sessionName;
        document.getElementById('displaySessionCode').textContent = this.gameState.sessionCode;

        // Generate player tiles
        this.generatePlayerTiles('playersGrid', true);
    }

    // Update scorekeeper interface (for real-time updates)
    updateScorekeeperInterface() {
        this.generatePlayerTiles('playersGrid', true);
    }

    // Player View Setup
    setupPlayerView() {
        // Update session title and player name
        document.getElementById('playerSessionTitle').textContent = this.gameState.sessionName || 'Game Session';
        document.getElementById('currentPlayerName').textContent = this.gameState.currentPlayerName;

        // Generate readonly player tiles
        this.generatePlayerTiles('playerViewGrid', false);
    }

    // Update player view interface (for real-time updates)
    updatePlayerViewInterface() {
        this.generatePlayerTiles('playerViewGrid', false);
    }

    // Player Tiles Generation
    generatePlayerTiles(containerId, isEditable) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        this.gameState.players.forEach(player => {
            const tile = this.createPlayerTile(player, isEditable);
            container.appendChild(tile);
        });
    }

    // Individual Player Tile Creation
    createPlayerTile(player, isEditable) {
        const tile = document.createElement('div');
        tile.className = 'player-tile';
        tile.dataset.playerId = player.id;

        const nameElement = document.createElement('div');
        nameElement.className = 'player-name';
        
        if (isEditable) {
            nameElement.innerHTML = `
                <input type="text" value="${player.name}" 
                       onblur="app.updatePlayerName(${player.id}, this.value)"
                       onkeypress="if(event.key==='Enter') this.blur()">
            `;
        } else {
            nameElement.textContent = player.name;
        }

        const scoreElement = document.createElement('div');
        scoreElement.className = 'score-display';
        scoreElement.textContent = this.formatScore(player.score);

        tile.appendChild(nameElement);
        tile.appendChild(scoreElement);

        if (isEditable) {
            const controlsElement = document.createElement('div');
            controlsElement.className = 'score-controls';
            
            const decreaseBtn = document.createElement('button');
            decreaseBtn.className = 'score-btn';
            decreaseBtn.textContent = '-';
            decreaseBtn.onclick = () => this.updateScore(player.id, -1);

            const increaseBtn = document.createElement('button');
            increaseBtn.className = 'score-btn';
            increaseBtn.textContent = '+';
            increaseBtn.onclick = () => this.updateScore(player.id, 1);

            controlsElement.appendChild(decreaseBtn);
            controlsElement.appendChild(increaseBtn);
            tile.appendChild(controlsElement);
        }

        return tile;
    }

    // Score Management
    async updateScore(playerId, delta) {
        const player = this.gameState.players.find(p => p.id === playerId);
        if (!player) return;

        const increment = this.gameState.allowDecimals ? 0.1 : 1;
        const newScore = player.score + (delta * increment);
        
        // Update local state immediately for responsiveness
        player.score = newScore;
        this.updateScoreDisplay(playerId, newScore);

        // Update Firebase if available
        if (this.firebaseService && this.firebaseService.isAvailable() && this.gameState.sessionCode) {
            try {
                await this.firebaseService.updatePlayerScore(this.gameState.sessionCode, playerId, newScore);
            } catch (error) {
                console.error('Failed to update score in Firebase:', error);
                // Revert local change if Firebase update fails
                player.score = player.score - (delta * increment);
                this.updateScoreDisplay(playerId, player.score);
            }
        }

        // Check for target score
        if (this.gameState.targetScore && newScore >= this.gameState.targetScore) {
            this.handleTargetReached(player);
        }
    }

    updateScoreDisplay(playerId, score) {
        const tile = document.querySelector(`[data-player-id="${playerId}"]`);
        if (tile) {
            const scoreDisplay = tile.querySelector('.score-display');
            scoreDisplay.textContent = this.formatScore(score);
        }
    }

    formatScore(score) {
        return this.gameState.allowDecimals ? score.toFixed(1) : Math.round(score).toString();
    }

    async updatePlayerName(playerId, newName) {
        const player = this.gameState.players.find(p => p.id === playerId);
        if (!player || !newName.trim()) return;

        const trimmedName = newName.trim();
        
        // Update local state immediately
        player.name = trimmedName;

        // Update Firebase if available
        if (this.firebaseService && this.firebaseService.isAvailable() && this.gameState.sessionCode) {
            try {
                await this.firebaseService.updatePlayerName(this.gameState.sessionCode, playerId, trimmedName);
            } catch (error) {
                console.error('Failed to update player name in Firebase:', error);
            }
        }
    }

    // Game Controls
    async resetAllScores() {
        if (!confirm('Are you sure you want to reset all scores to the starting value?')) {
            return;
        }

        // Update local state
        this.gameState.players.forEach(player => {
            player.score = this.gameState.startingScore;
            this.updateScoreDisplay(player.id, player.score);
        });

        // Update Firebase if available
        if (this.firebaseService && this.firebaseService.isAvailable() && this.gameState.sessionCode) {
            try {
                const updates = {
                    players: this.gameState.players
                };
                await this.firebaseService.updateSession(this.gameState.sessionCode, updates);
            } catch (error) {
                console.error('Failed to reset scores in Firebase:', error);
            }
        }
    }

    newRound() {
        if (confirm('Start a new round? This will keep current scores.')) {
            console.log('New round started');
            // Could add round-specific logic here
        }
    }

    async endSession() {
        if (!confirm('Are you sure you want to end this session?')) {
            return;
        }

        // End Firebase session if available
        if (this.firebaseService && this.firebaseService.isAvailable() && this.gameState.sessionCode) {
            try {
                await this.firebaseService.endSession(this.gameState.sessionCode);
            } catch (error) {
                console.error('Failed to end session in Firebase:', error);
            }
        }

        // Clean up listeners
        this.cleanup();

        // Reset game state
        this.resetGameState();
        this.showPage('landingPage');
    }

    leaveSession() {
        if (confirm('Are you sure you want to leave this session?')) {
            this.cleanup();
            this.resetGameState();
            this.showPage('landingPage');
        }
    }

    // Reset game state
    resetGameState() {
        this.gameState = {
            sessionCode: '',
            sessionName: '',
            players: [],
            numPlayers: 2,
            startingScore: 0,
            allowDecimals: false,
            targetScore: null,
            playAfterTarget: false,
            isScorekeeper: false,
            currentPlayerName: '',
            isOnline: this.gameState.isOnline
        };
    }

    // Cleanup Firebase listeners
    cleanup() {
        if (this.firebaseService) {
            this.firebaseService.cleanup();
        }
        this.sessionListener = null;
    }

    // Target Score Handling
    handleTargetReached(player) {
        if (!this.gameState.playAfterTarget) {
            alert(`🎉 ${player.name} has reached the target score of ${this.gameState.targetScore}!`);
        }
    }

    // Player Name Editing
    async editPlayerName() {
        const newName = prompt('Enter your new name:', this.gameState.currentPlayerName);
        if (!newName || !newName.trim()) return;

        this.gameState.currentPlayerName = newName.trim();
        document.getElementById('currentPlayerName').textContent = this.gameState.currentPlayerName;
    }

    // QR Code Modal
    showQRModal() {
        const modal = document.getElementById('qrModal');
        const container = document.getElementById('qrCodeContainer');
        
        // Generate QR code placeholder (will be enhanced with actual QR generation)
        container.innerHTML = `
            <div style="width: 200px; height: 200px; background: #f0f0f0; border: 2px dashed #ccc; 
                        display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                <div style="text-align: center; color: #666;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📱</div>
                    <div>QR Code</div>
                    <div style="font-family: monospace; font-weight: bold; margin-top: 0.5rem;">
                        ${this.gameState.sessionCode}
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    }

    hideQRModal() {
        document.getElementById('qrModal').classList.remove('active');
    }

    // QR Code Scanning (placeholder)
    scanQRCode() {
        alert('QR code scanning will be implemented in the next phase with camera access.');
    }

    // Utility Functions
    generateSessionCode() {
        // Generate a 6-character alphanumeric code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    validateSessionCode(code) {
        // Basic validation - 6 characters, alphanumeric
        return code.length === 6 && /^[A-Z0-9]+$/.test(code);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RummyScorekeeper();
});

// Utility function for global access
function updatePlayerName(playerId, newName) {
    if (window.app) {
        window.app.updatePlayerName(playerId, newName);
    }
}

