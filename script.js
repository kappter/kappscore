// GameScore Pro - Complete Working Application
class GameScoreApp {
    constructor() {
        this.currentSession = null;
        this.currentPlayer = null;
        this.isScorekeeper = false;
        this.sessionListener = null;
        this.players = [];
        this.scoreHistory = [];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTheme();
        console.log('GameScore Pro initialized');
    }

    // Event Binding
    bindEvents() {
        // Navigation
        document.getElementById('createSessionBtn').addEventListener('click', () => this.showPage('createSessionPage'));
        document.getElementById('joinSessionBtn').addEventListener('click', () => this.showPage('joinSessionPage'));
        document.getElementById('backToLanding').addEventListener('click', () => this.showPage('landingPage'));
        document.getElementById('backToLandingFromJoin').addEventListener('click', () => this.showPage('landingPage'));
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Player count controls
        document.getElementById('increasePlayer').addEventListener('click', () => this.changePlayerCount(1));
        document.getElementById('decreasePlayer').addEventListener('click', () => this.changePlayerCount(-1));
        
        // Form submissions
        document.getElementById('createSessionForm').addEventListener('submit', (e) => this.handleCreateSession(e));
        document.getElementById('joinSessionForm').addEventListener('submit', (e) => this.handleJoinSession(e));
        
        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => this.exportGameData());
    }

    // Page Navigation
    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
    }

    // Theme Management
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update theme icons
        document.querySelectorAll('.theme-icon').forEach(icon => {
            icon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        });
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        document.querySelectorAll('.theme-icon').forEach(icon => {
            icon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        });
    }

    // Player Count Management
    changePlayerCount(delta) {
        const input = document.getElementById('numPlayers');
        const current = parseInt(input.value);
        const newValue = Math.max(1, Math.min(12, current + delta));
        input.value = newValue;
    }

    // Session Creation
    async handleCreateSession(e) {
        e.preventDefault();
        
        if (!isConnected) {
            this.showMessage('Please wait for Firebase connection', 'warning');
            return;
        }

        const formData = new FormData(e.target);
        const sessionData = {
            name: formData.get('sessionName') || 'Untitled Session',
            playerCount: parseInt(document.getElementById('numPlayers').value),
            startingScore: parseFloat(document.getElementById('startingScore').value),
            allowDecimals: document.getElementById('allowDecimals').checked,
            targetScore: document.getElementById('targetScore').value ? parseFloat(document.getElementById('targetScore').value) : null,
            playAfterTarget: document.getElementById('playAfterTarget').checked,
            createdAt: Date.now(),
            createdBy: 'scorekeeper'
        };

        try {
            const sessionCode = this.generateSessionCode();
            const sessionRef = database.ref(`sessions/${sessionCode}`);
            
            // Initialize players
            const players = {};
            for (let i = 1; i <= sessionData.playerCount; i++) {
                players[`player${i}`] = {
                    name: `Player ${i}`,
                    score: sessionData.startingScore,
                    joinedAt: Date.now(),
                    isActive: true
                };
            }

            await sessionRef.set({
                metadata: sessionData,
                players: players,
                scoreHistory: []
            });

            this.currentSession = sessionCode;
            this.isScorekeeper = true;
            this.players = Object.entries(players).map(([id, data]) => ({ id, ...data }));
            
            this.showScorekeeperInterface();
            this.listenToSession(sessionCode);
            
            this.showMessage(`Session created: ${sessionCode}`, 'success');
            
        } catch (error) {
            console.error('Error creating session:', error);
            this.showMessage('Failed to create session', 'error');
        }
    }

    // Session Joining
    async handleJoinSession(e) {
        e.preventDefault();
        
        if (!isConnected) {
            this.showMessage('Please wait for Firebase connection', 'warning');
            return;
        }

        const joinCode = document.getElementById('joinCode').value.toUpperCase();
        const playerName = document.getElementById('playerName').value.trim();

        if (!joinCode || !playerName) {
            this.showMessage('Please enter both session code and your name', 'warning');
            return;
        }

        try {
            const sessionRef = database.ref(`sessions/${joinCode}`);
            const snapshot = await sessionRef.once('value');
            
            if (!snapshot.exists()) {
                this.showMessage('Session not found', 'error');
                return;
            }

            const sessionData = snapshot.val();
            const players = sessionData.players || {};
            
            // Find or assign player
            let assignedPlayerId = null;
            
            // First, try to find existing player with same name
            for (const [playerId, playerData] of Object.entries(players)) {
                if (playerData.name === playerName) {
                    assignedPlayerId = playerId;
                    break;
                }
            }
            
            // If not found, assign to first available slot
            if (!assignedPlayerId) {
                for (const [playerId, playerData] of Object.entries(players)) {
                    if (playerData.name.startsWith('Player ')) {
                        assignedPlayerId = playerId;
                        // Update player name
                        await database.ref(`sessions/${joinCode}/players/${playerId}/name`).set(playerName);
                        break;
                    }
                }
            }

            if (!assignedPlayerId) {
                this.showMessage('Session is full', 'error');
                return;
            }

            this.currentSession = joinCode;
            this.currentPlayer = assignedPlayerId;
            this.isScorekeeper = false;
            
            this.showPlayerInterface();
            this.listenToSession(joinCode);
            
            this.showMessage(`Joined session as ${playerName}`, 'success');
            
        } catch (error) {
            console.error('Error joining session:', error);
            this.showMessage('Failed to join session', 'error');
        }
    }

    // Generate Session Code
    generateSessionCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Show Scorekeeper Interface
    showScorekeeperInterface() {
        const container = document.querySelector('.container');
        container.innerHTML = `
            <header>
                <div class="header-content">
                    <div class="header-left">
                        <h1>GameScore Pro</h1>
                        <p>Session: ${this.currentSession}</p>
                    </div>
                    <div class="header-right">
                        <div class="connection-status">
                            <span class="status-dot ${isConnected ? 'online' : 'offline'}"></span>
                            <span class="status-text">${isConnected ? 'Online' : 'Offline'}</span>
                        </div>
                        <button id="showQRBtn" class="secondary-btn">📱 QR Code</button>
                        <button id="summaryBtn" class="summary-btn">📊 Summary</button>
                        <button class="theme-toggle" onclick="app.toggleTheme()">
                            <span class="theme-icon">${document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'}</span>
                        </button>
                    </div>
                </div>
            </header>
            
            <div class="players-grid" data-player-count="${this.players.length}" id="playersGrid">
                ${this.generatePlayerTiles()}
            </div>
            
            <div class="game-controls">
                <button id="resetScoresBtn" class="secondary-btn">🔄 Reset All Scores</button>
                <button id="newRoundBtn" class="secondary-btn">🎯 New Round</button>
                <button id="endSessionBtn" class="danger-btn">🏁 End Session</button>
            </div>
        `;

        this.bindScorekeeperEvents();
    }

    // Show Player Interface
    showPlayerInterface() {
        const container = document.querySelector('.container');
        container.innerHTML = `
            <header>
                <div class="header-content">
                    <div class="header-left">
                        <h1>GameScore Pro</h1>
                        <p>Session: ${this.currentSession}</p>
                    </div>
                    <div class="header-right">
                        <div class="connection-status">
                            <span class="status-dot ${isConnected ? 'online' : 'offline'}"></span>
                            <span class="status-text">${isConnected ? 'Online' : 'Offline'}</span>
                        </div>
                        <button id="summaryBtn" class="summary-btn">📊 Summary</button>
                        <button class="theme-toggle" onclick="app.toggleTheme()">
                            <span class="theme-icon">${document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'}</span>
                        </button>
                    </div>
                </div>
            </header>
            
            <div class="player-view-info">
                <div class="view-mode-indicator">
                    <span class="indicator-icon">👁️</span>
                    <span>Player View - Scores update in real-time</span>
                </div>
            </div>
            
            <div class="players-grid" data-player-count="${this.players.length}" id="playersGrid">
                ${this.generatePlayerViewTiles()}
            </div>
            
            <div class="player-actions">
                <button id="refreshBtn" class="secondary-btn">🔄 Refresh</button>
                <button id="leaveSessionBtn" class="danger-btn">🚪 Leave Session</button>
            </div>
            
            <div class="last-updated">
                <small>Last updated: <span id="lastUpdated">${new Date().toLocaleTimeString()}</span></small>
            </div>
        `;

        this.bindPlayerEvents();
    }

    // Generate Player Tiles for Scorekeeper
    generatePlayerTiles() {
        return this.players.map(player => `
            <div class="player-tile" data-player-id="${player.id}">
                <div class="player-header">
                    <h3 class="player-name" contenteditable="true" data-player-id="${player.id}">${player.name}</h3>
                </div>
                
                <div class="player-score">
                    <span class="score-value" id="score-${player.id}">${player.score}</span>
                </div>
                
                <div class="custom-amount-section">
                    <label>Amount:</label>
                    <input type="number" class="custom-amount" data-player-id="${player.id}" value="1" step="0.1">
                    <div class="preset-buttons">
                        <button class="preset-btn" data-player-id="${player.id}" data-amount="+1">+1</button>
                        <button class="preset-btn" data-player-id="${player.id}" data-amount="+5">+5</button>
                        <button class="preset-btn" data-player-id="${player.id}" data-amount="+10">+10</button>
                        <button class="preset-btn" data-player-id="${player.id}" data-amount="-1">-1</button>
                    </div>
                </div>
                
                <div class="score-controls">
                    <button class="score-btn decrease-btn" data-player-id="${player.id}" data-action="decrease">-</button>
                    <button class="score-btn increase-btn" data-player-id="${player.id}" data-action="increase">+</button>
                </div>
            </div>
        `).join('');
    }

    // Generate Player Tiles for Player View
    generatePlayerViewTiles() {
        return this.players.map(player => {
            const isCurrentPlayer = player.id === this.currentPlayer;
            return `
                <div class="player-tile ${isCurrentPlayer ? 'current-player' : ''}" data-player-id="${player.id}">
                    <div class="player-header">
                        <h3 class="player-name" ${isCurrentPlayer ? 'contenteditable="true"' : ''} data-player-id="${player.id}">${player.name}</h3>
                        ${isCurrentPlayer ? '<span class="current-player-badge">You</span>' : ''}
                    </div>
                    
                    <div class="player-score">
                        <span class="score-value" id="score-${player.id}">${player.score}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Bind Scorekeeper Events
    bindScorekeeperEvents() {
        // Score buttons
        document.querySelectorAll('.score-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleScoreChange(e));
        });

        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handlePresetScore(e));
        });

        // Player name editing
        document.querySelectorAll('.player-name[contenteditable="true"]').forEach(nameEl => {
            nameEl.addEventListener('blur', (e) => this.updatePlayerName(e));
        });

        // Game controls
        document.getElementById('resetScoresBtn')?.addEventListener('click', () => this.resetAllScores());
        document.getElementById('newRoundBtn')?.addEventListener('click', () => this.newRound());
        document.getElementById('endSessionBtn')?.addEventListener('click', () => this.endSession());
        document.getElementById('showQRBtn')?.addEventListener('click', () => this.showQRCode());
        document.getElementById('summaryBtn')?.addEventListener('click', () => this.showGameSummary());
    }

    // Bind Player Events
    bindPlayerEvents() {
        // Player name editing (only for current player)
        const currentPlayerName = document.querySelector(`.player-name[data-player-id="${this.currentPlayer}"]`);
        if (currentPlayerName) {
            currentPlayerName.addEventListener('blur', (e) => this.updatePlayerName(e));
        }

        // Player actions
        document.getElementById('refreshBtn')?.addEventListener('click', () => this.refreshScores());
        document.getElementById('leaveSessionBtn')?.addEventListener('click', () => this.leaveSession());
        document.getElementById('summaryBtn')?.addEventListener('click', () => this.showGameSummary());
    }

    // Handle Score Changes
    async handleScoreChange(e) {
        const playerId = e.target.dataset.playerId;
        const action = e.target.dataset.action;
        const amountInput = document.querySelector(`.custom-amount[data-player-id="${playerId}"]`);
        const amount = parseFloat(amountInput.value) || 1;
        
        const change = action === 'increase' ? amount : -amount;
        await this.updateScore(playerId, change);
    }

    // Handle Preset Score Changes
    async handlePresetScore(e) {
        const playerId = e.target.dataset.playerId;
        const amount = parseFloat(e.target.dataset.amount);
        await this.updateScore(playerId, amount);
    }

    // Update Score
    async updateScore(playerId, change) {
        if (!this.currentSession || !isConnected) return;

        try {
            const player = this.players.find(p => p.id === playerId);
            if (!player) return;

            const newScore = player.score + change;
            
            // Update in Firebase
            await database.ref(`sessions/${this.currentSession}/players/${playerId}/score`).set(newScore);
            
            // Add to score history
            const historyEntry = {
                playerId,
                playerName: player.name,
                oldScore: player.score,
                newScore: newScore,
                change: change,
                timestamp: Date.now(),
                action: change > 0 ? 'increase' : 'decrease'
            };
            
            await database.ref(`sessions/${this.currentSession}/scoreHistory`).push(historyEntry);
            
        } catch (error) {
            console.error('Error updating score:', error);
            this.showMessage('Failed to update score', 'error');
        }
    }

    // Update Player Name
    async updatePlayerName(e) {
        const playerId = e.target.dataset.playerId;
        const newName = e.target.textContent.trim();
        
        if (!newName || !this.currentSession || !isConnected) return;

        try {
            await database.ref(`sessions/${this.currentSession}/players/${playerId}/name`).set(newName);
        } catch (error) {
            console.error('Error updating player name:', error);
            this.showMessage('Failed to update name', 'error');
        }
    }

    // Listen to Session Updates
    listenToSession(sessionCode) {
        if (this.sessionListener) {
            this.sessionListener.off();
        }

        this.sessionListener = database.ref(`sessions/${sessionCode}`);
        this.sessionListener.on('value', (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                this.updateLocalData(data);
            }
        });
    }

    // Update Local Data
    updateLocalData(sessionData) {
        if (sessionData.players) {
            this.players = Object.entries(sessionData.players).map(([id, data]) => ({ id, ...data }));
            
            // Update scores in UI
            this.players.forEach(player => {
                const scoreEl = document.getElementById(`score-${player.id}`);
                if (scoreEl) {
                    scoreEl.textContent = player.score;
                    scoreEl.classList.add('score-updated');
                    setTimeout(() => scoreEl.classList.remove('score-updated'), 300);
                }
                
                // Update player names
                const nameEl = document.querySelector(`.player-name[data-player-id="${player.id}"]`);
                if (nameEl && nameEl.textContent !== player.name) {
                    nameEl.textContent = player.name;
                }
            });
            
            // Update last updated time for player view
            const lastUpdatedEl = document.getElementById('lastUpdated');
            if (lastUpdatedEl) {
                lastUpdatedEl.textContent = new Date().toLocaleTimeString();
            }
        }

        if (sessionData.scoreHistory) {
            this.scoreHistory = Object.values(sessionData.scoreHistory);
        }
    }

    // Game Controls
    async resetAllScores() {
        if (!confirm('Reset all scores to starting value?')) return;
        
        try {
            const updates = {};
            this.players.forEach(player => {
                updates[`players/${player.id}/score`] = 0;
            });
            
            await database.ref(`sessions/${this.currentSession}`).update(updates);
            this.showMessage('All scores reset', 'success');
        } catch (error) {
            console.error('Error resetting scores:', error);
            this.showMessage('Failed to reset scores', 'error');
        }
    }

    async newRound() {
        if (!confirm('Start a new round? This will reset all scores.')) return;
        await this.resetAllScores();
    }

    async endSession() {
        if (!confirm('End this session? This cannot be undone.')) return;
        
        try {
            await database.ref(`sessions/${this.currentSession}`).remove();
            this.showMessage('Session ended', 'success');
            this.showPage('landingPage');
        } catch (error) {
            console.error('Error ending session:', error);
            this.showMessage('Failed to end session', 'error');
        }
    }

    // Player Actions
    refreshScores() {
        this.showMessage('Scores refreshed', 'success');
    }

    leaveSession() {
        if (this.sessionListener) {
            this.sessionListener.off();
        }
        this.currentSession = null;
        this.currentPlayer = null;
        this.isScorekeeper = false;
        this.showPage('landingPage');
        this.showMessage('Left session', 'success');
    }

    // QR Code
    showQRCode() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Share Session</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="qr-placeholder">
                        <h2>${this.currentSession}</h2>
                        <p>Share this code with other players</p>
                        <input type="text" class="share-url" value="${window.location.origin}${window.location.pathname}?join=${this.currentSession}" readonly>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // Game Summary
    showGameSummary() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content summary-content">
                <div class="modal-header">
                    <h3>Game Summary</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="summary-tabs">
                        <button class="tab-btn active" data-tab="chart">📈 Chart</button>
                        <button class="tab-btn" data-tab="stats">📊 Stats</button>
                        <button class="tab-btn" data-tab="timeline">⏰ Timeline</button>
                    </div>
                    
                    <div class="tab-panel active" id="chart-panel">
                        <div class="chart-container">
                            <canvas id="scoreChart"></canvas>
                        </div>
                    </div>
                    
                    <div class="tab-panel" id="stats-panel">
                        <div class="stats-grid">
                            ${this.generateStatsHTML()}
                        </div>
                    </div>
                    
                    <div class="tab-panel" id="timeline-panel">
                        <div class="timeline-container">
                            ${this.generateTimelineHTML()}
                        </div>
                    </div>
                    
                    <div class="summary-actions">
                        <button class="secondary-btn" onclick="app.exportGameData()">📄 Export Data</button>
                        <button class="secondary-btn" onclick="app.exportChart()">📊 Export Chart</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Bind tab events
        modal.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                
                modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                modal.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                
                e.target.classList.add('active');
                modal.querySelector(`#${tabId}-panel`).classList.add('active');
            });
        });
        
        // Close modal events
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Generate chart
        setTimeout(() => this.generateScoreChart(), 100);
    }

    // Generate Score Chart
    generateScoreChart() {
        const canvas = document.getElementById('scoreChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Prepare data
        const datasets = this.players.map((player, index) => {
            const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
            return {
                label: player.name,
                data: this.getPlayerScoreHistory(player.id),
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length] + '20',
                tension: 0.1
            };
        });
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.getTimeLabels(),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Score Progression Over Time'
                    },
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Score'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                }
            }
        });
    }

    // Get Player Score History
    getPlayerScoreHistory(playerId) {
        const history = [0]; // Starting score
        this.scoreHistory
            .filter(entry => entry.playerId === playerId)
            .sort((a, b) => a.timestamp - b.timestamp)
            .forEach(entry => {
                history.push(entry.newScore);
            });
        return history;
    }

    // Get Time Labels
    getTimeLabels() {
        const labels = ['Start'];
        this.scoreHistory
            .sort((a, b) => a.timestamp - b.timestamp)
            .forEach(entry => {
                labels.push(new Date(entry.timestamp).toLocaleTimeString());
            });
        return labels;
    }

    // Generate Stats HTML
    generateStatsHTML() {
        const totalChanges = this.scoreHistory.length;
        const gameStart = Math.min(...this.scoreHistory.map(h => h.timestamp));
        const gameEnd = Math.max(...this.scoreHistory.map(h => h.timestamp));
        const duration = gameEnd - gameStart;
        
        return `
            <div class="stat-card">
                <h4>Total Score Changes</h4>
                <p class="stat-value">${totalChanges}</p>
            </div>
            <div class="stat-card">
                <h4>Game Duration</h4>
                <p class="stat-value">${Math.round(duration / 60000)}m</p>
            </div>
            <div class="stat-card">
                <h4>Highest Score</h4>
                <p class="stat-value">${Math.max(...this.players.map(p => p.score))}</p>
            </div>
            <div class="stat-card">
                <h4>Lowest Score</h4>
                <p class="stat-value">${Math.min(...this.players.map(p => p.score))}</p>
            </div>
        `;
    }

    // Generate Timeline HTML
    generateTimelineHTML() {
        if (this.scoreHistory.length === 0) {
            return '<p>No score changes yet.</p>';
        }
        
        return this.scoreHistory
            .sort((a, b) => b.timestamp - a.timestamp)
            .map(entry => `
                <div class="timeline-item">
                    <div class="timeline-time">${new Date(entry.timestamp).toLocaleTimeString()}</div>
                    <div class="timeline-content">
                        <strong>${entry.playerName}</strong>
                        <span class="score-change ${entry.change > 0 ? 'positive' : 'negative'}">
                            ${entry.change > 0 ? '+' : ''}${entry.change}
                        </span>
                        <div class="score-result">Score: ${entry.newScore}</div>
                    </div>
                </div>
            `).join('');
    }

    // Export Game Data
    exportGameData() {
        const data = {
            session: this.currentSession,
            players: this.players,
            scoreHistory: this.scoreHistory,
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gamescore-${this.currentSession}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showMessage('Game data exported', 'success');
    }

    // Show Message
    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.className = `message message-${type}`;
        message.innerHTML = `
            <span>${text}</span>
            <button class="message-close">×</button>
        `;
        
        document.body.appendChild(message);
        
        message.querySelector('.message-close').addEventListener('click', () => {
            document.body.removeChild(message);
        });
        
        setTimeout(() => {
            if (document.body.contains(message)) {
                document.body.removeChild(message);
            }
        }, 5000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GameScoreApp();
});

