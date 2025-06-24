// GameScore Pro JavaScript with Fixed Player Management and Real-time Features

class GameScorePro {
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
            isOnline: false,
            scoreHistory: []
        };
        
        this.firebaseService = null;
        this.sessionListener = null;
        this.eventListenersAttached = false;
        this.init();
    }

    async init() {
        this.initializeTheme();
        this.bindEvents();
        this.showPage('landingPage');
        
        // Initialize Firebase
        await this.initializeFirebase();
    }

    // Theme Management
    initializeTheme() {
        const savedTheme = localStorage.getItem('gameScoreProTheme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('gameScoreProTheme', theme);
        
        const themeIcons = document.querySelectorAll('.theme-icon');
        themeIcons.forEach(icon => {
            icon.textContent = theme === 'light' ? '🌙' : '☀️';
        });
    }

    // Initialize Firebase Service
    async initializeFirebase() {
        try {
            this.firebaseService = new FirebaseService();
            const initialized = await this.firebaseService.initialize();
            
            if (initialized) {
                console.log('Firebase integration enabled');
                this.gameState.isOnline = true;
                
                // Register for connection status updates
                this.firebaseService.onConnectionChange((isOnline) => {
                    this.gameState.isOnline = isOnline;
                });
            } else {
                console.log('Running in offline mode');
                this.gameState.isOnline = false;
            }
        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.gameState.isOnline = false;
        }
    }

    // Event Binding
    bindEvents() {
        if (this.eventListenersAttached) return;
        
        // Landing page events
        document.getElementById('createSessionBtn')?.addEventListener('click', () => this.showPage('createSessionPage'));
        document.getElementById('joinSessionBtn')?.addEventListener('click', () => this.showPage('joinSessionPage'));
        document.getElementById('themeToggle')?.addEventListener('click', () => this.toggleTheme());
        document.getElementById('exportBtn')?.addEventListener('click', () => this.exportGameData());

        // Create session events
        document.getElementById('backToLanding')?.addEventListener('click', () => this.showPage('landingPage'));
        document.getElementById('increasePlayer')?.addEventListener('click', () => this.changePlayerCount(1));
        document.getElementById('decreasePlayer')?.addEventListener('click', () => this.changePlayerCount(-1));
        document.getElementById('createSessionForm')?.addEventListener('submit', (e) => this.handleCreateSession(e));

        // Join session events
        document.getElementById('backToLandingFromJoin')?.addEventListener('click', () => this.showPage('landingPage'));
        document.getElementById('joinSessionForm')?.addEventListener('submit', (e) => this.handleJoinSession(e));

        this.eventListenersAttached = true;
    }

    // Page Navigation
    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageId;
        }
    }

    // Player Count Management
    changePlayerCount(delta) {
        const input = document.getElementById('numPlayers');
        const currentValue = parseInt(input.value);
        const newValue = Math.max(1, Math.min(12, currentValue + delta));
        input.value = newValue;
        this.gameState.numPlayers = newValue;
    }

    // Session Creation
    async handleCreateSession(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const sessionData = {
            sessionName: document.getElementById('sessionName').value || 'Game Session',
            numPlayers: parseInt(document.getElementById('numPlayers').value),
            startingScore: parseFloat(document.getElementById('startingScore').value) || 0,
            allowDecimals: document.getElementById('allowDecimals').checked,
            targetScore: parseFloat(document.getElementById('targetScore').value) || null,
            playAfterTarget: document.getElementById('playAfterTarget').checked
        };

        // Update game state
        Object.assign(this.gameState, sessionData);
        this.gameState.isScorekeeper = true;

        try {
            if (this.firebaseService && this.firebaseService.isAvailable()) {
                // Create session in Firebase
                const sessionCode = await this.firebaseService.createSession({
                    ...sessionData,
                    players: this.initializePlayers(sessionData.numPlayers, sessionData.startingScore)
                });
                
                this.gameState.sessionCode = sessionCode;
                
                // Listen for session updates
                this.firebaseService.listenToSession(sessionCode, (sessionData) => {
                    if (sessionData) {
                        this.updateGameStateFromFirebase(sessionData);
                    }
                });
            } else {
                // Offline mode
                this.gameState.sessionCode = this.generateSessionCode();
                this.gameState.players = this.initializePlayers(sessionData.numPlayers, sessionData.startingScore);
                console.log('Created local session:', this.gameState.sessionCode);
            }

            this.showScorekeeperInterface();
        } catch (error) {
            console.error('Error creating session:', error);
            this.showMessage('Failed to create session. Please try again.', 'error');
        }
    }

    // Initialize Players
    initializePlayers(numPlayers, startingScore) {
        const players = [];
        for (let i = 0; i < numPlayers; i++) {
            players.push({
                id: `player${i + 1}`,
                name: `Player ${i + 1}`,
                score: startingScore,
                joinedAt: Date.now()
            });
        }
        return players;
    }

    // Show Scorekeeper Interface
    showScorekeeperInterface() {
        // Create scorekeeper page if it doesn't exist
        let scorekeeperPage = document.getElementById('scorekeeperPage');
        if (!scorekeeperPage) {
            scorekeeperPage = this.createScorekeeperPage();
            document.body.appendChild(scorekeeperPage);
        }

        this.generatePlayerTiles();
        this.showPage('scorekeeperPage');
    }

    // Create Scorekeeper Page
    createScorekeeperPage() {
        const page = document.createElement('div');
        page.id = 'scorekeeperPage';
        page.className = 'page';
        
        page.innerHTML = `
            <div class="container">
                <header>
                    <div class="header-content">
                        <div class="header-left">
                            <h1>${this.gameState.sessionName}</h1>
                            <p>Session: <strong>${this.gameState.sessionCode}</strong></p>
                        </div>
                        <div class="header-right">
                            <div id="connectionStatus4" class="connection-status">
                                <span class="status-dot"></span>
                                <span class="status-text">Connecting...</span>
                            </div>
                            <button id="showQRBtn" class="secondary-btn">📱 QR Code</button>
                            <button class="theme-toggle" onclick="app.toggleTheme()" aria-label="Toggle dark mode">
                                <span class="theme-icon">🌙</span>
                            </button>
                        </div>
                    </div>
                </header>
                
                <div id="playersGrid" class="players-grid" data-player-count="${this.gameState.numPlayers}">
                    <!-- Player tiles will be generated here -->
                </div>
                
                <div class="game-controls">
                    <button id="resetScoresBtn" class="secondary-btn">🔄 Reset All Scores</button>
                    <button id="newRoundBtn" class="secondary-btn">🎯 New Round</button>
                    <button id="endSessionBtn" class="danger-btn">🏁 End Session</button>
                </div>
            </div>
        `;

        // Bind scorekeeper events
        setTimeout(() => {
            document.getElementById('showQRBtn')?.addEventListener('click', () => this.showQRCode());
            document.getElementById('resetScoresBtn')?.addEventListener('click', () => this.resetAllScores());
            document.getElementById('newRoundBtn')?.addEventListener('click', () => this.startNewRound());
            document.getElementById('endSessionBtn')?.addEventListener('click', () => this.endSession());
        }, 100);

        return page;
    }

    // Generate Player Tiles
    generatePlayerTiles() {
        const playersGrid = document.getElementById('playersGrid');
        if (!playersGrid) return;

        // Set grid data attribute for responsive layout
        playersGrid.setAttribute('data-player-count', this.gameState.players.length);
        
        playersGrid.innerHTML = '';

        this.gameState.players.forEach((player, index) => {
            const tile = this.createPlayerTile(player, true);
            playersGrid.appendChild(tile);
        });
    }

    // Create Player Tile
    createPlayerTile(player, isEditable = false) {
        const tile = document.createElement('div');
        tile.className = 'player-tile';
        tile.setAttribute('data-player-id', player.id);

        const step = this.gameState.allowDecimals ? '0.1' : '1';

        tile.innerHTML = `
            <div class="player-header">
                <h3 class="player-name" ${isEditable ? 'contenteditable="true"' : ''}>${player.name}</h3>
            </div>
            <div class="player-score">
                <span class="score-value">${player.score}</span>
            </div>
            ${isEditable ? `
                <div class="custom-amount-section">
                    <label>Amount:</label>
                    <input type="number" class="custom-amount" value="1" step="${step}" min="0">
                    <div class="preset-buttons">
                        <button class="preset-btn" data-amount="1">+1</button>
                        <button class="preset-btn" data-amount="5">+5</button>
                        <button class="preset-btn" data-amount="10">+10</button>
                        <button class="preset-btn" data-amount="-1">-1</button>
                    </div>
                </div>
                <div class="score-controls">
                    <button class="score-btn decrease-btn" data-player-id="${player.id}">-</button>
                    <button class="score-btn increase-btn" data-player-id="${player.id}">+</button>
                </div>
            ` : ''}
        `;

        if (isEditable) {
            // Bind events for this specific tile
            setTimeout(() => {
                this.bindPlayerTileEvents(tile, player.id);
            }, 50);
        }

        return tile;
    }

    // Bind Player Tile Events
    bindPlayerTileEvents(tile, playerId) {
        // Score control buttons
        const increaseBtn = tile.querySelector('.increase-btn');
        const decreaseBtn = tile.querySelector('.decrease-btn');
        const customAmountInput = tile.querySelector('.custom-amount');
        const presetButtons = tile.querySelectorAll('.preset-btn');
        const playerNameElement = tile.querySelector('.player-name');

        // Remove existing listeners to prevent duplicates
        increaseBtn?.removeEventListener('click', this.handleScoreIncrease);
        decreaseBtn?.removeEventListener('click', this.handleScoreDecrease);

        // Add score control listeners
        increaseBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const amount = parseFloat(customAmountInput?.value || 1);
            this.updatePlayerScore(playerId, amount);
        });

        decreaseBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const amount = parseFloat(customAmountInput?.value || 1);
            this.updatePlayerScore(playerId, -amount);
        });

        // Preset buttons
        presetButtons?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const amount = parseFloat(btn.getAttribute('data-amount'));
                if (amount > 0) {
                    customAmountInput.value = amount;
                }
                this.updatePlayerScore(playerId, amount);
            });
        });

        // Player name editing
        playerNameElement?.addEventListener('blur', (e) => {
            const newName = e.target.textContent.trim();
            if (newName && newName !== this.getPlayer(playerId)?.name) {
                this.updatePlayerName(playerId, newName);
            }
        });

        playerNameElement?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.target.blur();
            }
        });
    }

    // Update Player Score
    async updatePlayerScore(playerId, amount) {
        const player = this.getPlayer(playerId);
        if (!player) {
            console.error('Player not found:', playerId);
            return;
        }

        const oldScore = player.score;
        const newScore = Math.max(0, oldScore + amount);
        
        // Update local state immediately (optimistic update)
        player.score = newScore;
        this.updatePlayerTileScore(playerId, newScore);
        
        // Add to score history
        this.gameState.scoreHistory.push({
            playerId,
            playerName: player.name,
            oldScore,
            newScore,
            change: amount,
            timestamp: Date.now()
        });

        // Update Firebase if available
        if (this.firebaseService && this.firebaseService.isAvailable()) {
            try {
                await this.firebaseService.updatePlayerScore(this.gameState.sessionCode, playerId, newScore);
            } catch (error) {
                console.error('Failed to update score in Firebase:', error);
                // Revert optimistic update on failure
                player.score = oldScore;
                this.updatePlayerTileScore(playerId, oldScore);
            }
        }

        // Check for target score achievement
        this.checkTargetScore(player);
    }

    // Update Player Name
    async updatePlayerName(playerId, newName) {
        const player = this.getPlayer(playerId);
        if (!player) return;

        const oldName = player.name;
        player.name = newName;

        if (this.firebaseService && this.firebaseService.isAvailable()) {
            try {
                await this.firebaseService.updatePlayerName(this.gameState.sessionCode, playerId, newName);
            } catch (error) {
                console.error('Failed to update name in Firebase:', error);
                player.name = oldName; // Revert on failure
            }
        }
    }

    // Get Player by ID
    getPlayer(playerId) {
        return this.gameState.players.find(p => p.id === playerId);
    }

    // Update Player Tile Score Display
    updatePlayerTileScore(playerId, newScore) {
        const tile = document.querySelector(`[data-player-id="${playerId}"]`);
        const scoreElement = tile?.querySelector('.score-value');
        if (scoreElement) {
            scoreElement.textContent = newScore;
            
            // Add animation
            scoreElement.classList.add('score-updated');
            setTimeout(() => {
                scoreElement.classList.remove('score-updated');
            }, 300);
        }
    }

    // Check Target Score Achievement
    checkTargetScore(player) {
        if (this.gameState.targetScore && player.score >= this.gameState.targetScore) {
            this.showMessage(`🎉 ${player.name} reached the target score of ${this.gameState.targetScore}!`, 'success');
            
            if (!this.gameState.playAfterTarget) {
                setTimeout(() => {
                    this.showMessage(`Game Over! ${player.name} wins!`, 'success');
                }, 2000);
            }
        }
    }

    // Update Game State from Firebase
    updateGameStateFromFirebase(sessionData) {
        if (sessionData.players) {
            // Update player scores and names
            Object.keys(sessionData.players).forEach(playerId => {
                const firebasePlayer = sessionData.players[playerId];
                const localPlayer = this.getPlayer(playerId);
                
                if (localPlayer) {
                    if (localPlayer.score !== firebasePlayer.score) {
                        localPlayer.score = firebasePlayer.score;
                        this.updatePlayerTileScore(playerId, firebasePlayer.score);
                    }
                    
                    if (localPlayer.name !== firebasePlayer.name) {
                        localPlayer.name = firebasePlayer.name;
                        const nameElement = document.querySelector(`[data-player-id="${playerId}"] .player-name`);
                        if (nameElement) {
                            nameElement.textContent = firebasePlayer.name;
                        }
                    }
                }
            });
        }
    }

    // Session Management
    async handleJoinSession(event) {
        event.preventDefault();
        
        const sessionCode = document.getElementById('joinCode').value.toUpperCase();
        const playerName = document.getElementById('playerName').value;

        if (!sessionCode || !playerName) {
            this.showMessage('Please enter both session code and your name.', 'error');
            return;
        }

        try {
            if (this.firebaseService && this.firebaseService.isAvailable()) {
                const sessionData = await this.firebaseService.joinSession(sessionCode);
                
                this.gameState = {
                    ...this.gameState,
                    sessionCode,
                    currentPlayerName: playerName,
                    isScorekeeper: false,
                    ...sessionData
                };

                this.showPlayerView();
            } else {
                this.showMessage('Cannot join session. Firebase is not available.', 'error');
            }
        } catch (error) {
            console.error('Error joining session:', error);
            this.showMessage('Failed to join session. Please check the code and try again.', 'error');
        }
    }

    // Show Player View (Read-only)
    showPlayerView() {
        // Implementation for player view would go here
        this.showMessage('Player view not yet implemented in this version.', 'info');
    }

    // Utility Functions
    generateSessionCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // QR Code Display
    showQRCode() {
        const qrUrl = `${window.location.origin}${window.location.pathname}?join=${this.gameState.sessionCode}`;
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Share Session</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Session Code: <strong>${this.gameState.sessionCode}</strong></p>
                    <p>Share this URL:</p>
                    <input type="text" value="${qrUrl}" readonly class="share-url">
                    <div class="qr-placeholder">
                        <p>📱 QR Code would appear here</p>
                        <p><small>Players can manually enter the session code: <strong>${this.gameState.sessionCode}</strong></small></p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal events
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // Game Controls
    async resetAllScores() {
        if (!confirm('Are you sure you want to reset all scores to the starting score?')) return;

        const startingScore = this.gameState.startingScore;
        
        this.gameState.players.forEach(player => {
            player.score = startingScore;
            this.updatePlayerTileScore(player.id, startingScore);
        });

        if (this.firebaseService && this.firebaseService.isAvailable()) {
            try {
                const updates = {};
                this.gameState.players.forEach(player => {
                    updates[`players/${player.id}/score`] = startingScore;
                });
                await this.firebaseService.updateSession(this.gameState.sessionCode, updates);
            } catch (error) {
                console.error('Failed to reset scores in Firebase:', error);
            }
        }

        this.showMessage('All scores have been reset!', 'success');
    }

    startNewRound() {
        this.showMessage('New round started!', 'info');
    }

    async endSession() {
        if (!confirm('Are you sure you want to end this session?')) return;

        if (this.firebaseService && this.firebaseService.isAvailable()) {
            try {
                await this.firebaseService.endSession(this.gameState.sessionCode);
            } catch (error) {
                console.error('Failed to end session in Firebase:', error);
            }
        }

        this.showPage('landingPage');
        this.showMessage('Session ended successfully!', 'success');
    }

    // Export Game Data
    exportGameData() {
        if (!this.gameState.sessionCode) {
            this.showMessage('No active session to export.', 'warning');
            return;
        }

        const exportData = {
            sessionInfo: {
                code: this.gameState.sessionCode,
                name: this.gameState.sessionName,
                startTime: new Date().toISOString(),
                playerCount: this.gameState.numPlayers
            },
            players: this.gameState.players,
            scoreHistory: this.gameState.scoreHistory,
            settings: {
                startingScore: this.gameState.startingScore,
                targetScore: this.gameState.targetScore,
                allowDecimals: this.gameState.allowDecimals
            }
        };

        // Create and download JSON file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gamescore-${this.gameState.sessionCode}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showMessage('Game data exported successfully!', 'success');
    }

    // Message System
    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.className = `message message-${type}`;
        message.innerHTML = `
            <span>${text}</span>
            <button class="message-close">&times;</button>
        `;

        document.body.appendChild(message);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(message)) {
                document.body.removeChild(message);
            }
        }, 5000);

        // Manual close
        message.querySelector('.message-close').addEventListener('click', () => {
            if (document.body.contains(message)) {
                document.body.removeChild(message);
            }
        });
    }

    // Cleanup
    cleanup() {
        if (this.firebaseService) {
            this.firebaseService.cleanup();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GameScorePro();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.cleanup();
    }
});

