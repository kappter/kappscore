// GameScore Pro JavaScript with Game Summary and Analytics

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
            scoreHistory: [],
            sessionStartTime: null
        };
        
        this.firebaseService = null;
        this.sessionListener = null;
        this.eventListenersAttached = false;
        this.chart = null;
        this.init();
    }

    async init() {
        this.initializeTheme();
        this.bindEvents();
        this.showPage('landingPage');
        
        // Load Chart.js
        await this.loadChartJS();
        
        // Initialize Firebase
        await this.initializeFirebase();
    }

    // Load Chart.js library
    async loadChartJS() {
        return new Promise((resolve) => {
            if (window.Chart) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = resolve;
            document.head.appendChild(script);
        });
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
        this.gameState.sessionStartTime = Date.now();

        try {
            if (this.firebaseService && this.firebaseService.isAvailable()) {
                const sessionCode = await this.firebaseService.createSession({
                    ...sessionData,
                    players: this.initializePlayers(sessionData.numPlayers, sessionData.startingScore),
                    sessionStartTime: this.gameState.sessionStartTime
                });
                
                this.gameState.sessionCode = sessionCode;
                
                this.firebaseService.listenToSession(sessionCode, (sessionData) => {
                    if (sessionData) {
                        this.updateGameStateFromFirebase(sessionData);
                    }
                });
            } else {
                this.gameState.sessionCode = this.generateSessionCode();
                this.gameState.players = this.initializePlayers(sessionData.numPlayers, sessionData.startingScore);
                console.log('Created local session:', this.gameState.sessionCode);
            }

            // Initialize score history with starting scores
            this.initializeScoreHistory();
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

    // Initialize Score History
    initializeScoreHistory() {
        this.gameState.scoreHistory = [];
        
        // Add initial scores to history
        this.gameState.players.forEach(player => {
            this.gameState.scoreHistory.push({
                playerId: player.id,
                playerName: player.name,
                oldScore: null,
                newScore: player.score,
                change: 0,
                timestamp: this.gameState.sessionStartTime,
                isInitial: true
            });
        });
    }

    // Show Scorekeeper Interface
    showScorekeeperInterface() {
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
                            <button id="gameSummaryBtn" class="summary-btn">📈 Summary</button>
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
            document.getElementById('gameSummaryBtn')?.addEventListener('click', () => this.showGameSummary());
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

        playersGrid.setAttribute('data-player-count', this.gameState.players.length);
        playersGrid.innerHTML = '';

        this.gameState.players.forEach((player) => {
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
            setTimeout(() => {
                this.bindPlayerTileEvents(tile, player.id);
            }, 50);
        }

        return tile;
    }

    // Bind Player Tile Events
    bindPlayerTileEvents(tile, playerId) {
        const increaseBtn = tile.querySelector('.increase-btn');
        const decreaseBtn = tile.querySelector('.decrease-btn');
        const customAmountInput = tile.querySelector('.custom-amount');
        const presetButtons = tile.querySelectorAll('.preset-btn');
        const playerNameElement = tile.querySelector('.player-name');

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

        if (this.firebaseService && this.firebaseService.isAvailable()) {
            try {
                await this.firebaseService.updatePlayerScore(this.gameState.sessionCode, playerId, newScore);
            } catch (error) {
                console.error('Failed to update score in Firebase:', error);
                player.score = oldScore;
                this.updatePlayerTileScore(playerId, oldScore);
            }
        }

        this.checkTargetScore(player);
    }

    // Update Player Name
    async updatePlayerName(playerId, newName) {
        const player = this.getPlayer(playerId);
        if (!player) return;

        const oldName = player.name;
        player.name = newName;

        // Update name in score history
        this.gameState.scoreHistory.forEach(entry => {
            if (entry.playerId === playerId) {
                entry.playerName = newName;
            }
        });

        if (this.firebaseService && this.firebaseService.isAvailable()) {
            try {
                await this.firebaseService.updatePlayerName(this.gameState.sessionCode, playerId, newName);
            } catch (error) {
                console.error('Failed to update name in Firebase:', error);
                player.name = oldName;
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

    // Show Game Summary with Charts
    showGameSummary() {
        if (this.gameState.scoreHistory.length === 0) {
            this.showMessage('No score data available yet.', 'warning');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay summary-modal';
        modal.innerHTML = `
            <div class="modal-content summary-content">
                <div class="modal-header">
                    <h3>📈 Game Summary</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="summary-tabs">
                        <button class="tab-btn active" data-tab="chart">Score Progress</button>
                        <button class="tab-btn" data-tab="stats">Statistics</button>
                        <button class="tab-btn" data-tab="timeline">Timeline</button>
                    </div>
                    
                    <div class="tab-content">
                        <div id="chartTab" class="tab-panel active">
                            <div class="chart-container">
                                <canvas id="scoreChart"></canvas>
                            </div>
                        </div>
                        
                        <div id="statsTab" class="tab-panel">
                            <div class="stats-grid">
                                ${this.generateStatsHTML()}
                            </div>
                        </div>
                        
                        <div id="timelineTab" class="tab-panel">
                            <div class="timeline-container">
                                ${this.generateTimelineHTML()}
                            </div>
                        </div>
                    </div>
                    
                    <div class="summary-actions">
                        <button id="exportSummaryBtn" class="primary-btn">📊 Export Summary</button>
                        <button id="exportChartBtn" class="secondary-btn">📈 Export Chart</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Initialize tabs
        this.initializeSummaryTabs(modal);

        // Create chart
        setTimeout(() => {
            this.createScoreChart();
        }, 100);

        // Bind events
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.destroyChart();
            document.body.removeChild(modal);
        });

        modal.querySelector('#exportSummaryBtn').addEventListener('click', () => {
            this.exportSummaryReport();
        });

        modal.querySelector('#exportChartBtn').addEventListener('click', () => {
            this.exportChart();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.destroyChart();
                document.body.removeChild(modal);
            }
        });
    }

    // Initialize Summary Tabs
    initializeSummaryTabs(modal) {
        const tabBtns = modal.querySelectorAll('.tab-btn');
        const tabPanels = modal.querySelectorAll('.tab-panel');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanels.forEach(p => p.classList.remove('active'));
                
                btn.classList.add('active');
                modal.querySelector(`#${targetTab}Tab`).classList.add('active');
            });
        });
    }

    // Create Score Chart
    createScoreChart() {
        const ctx = document.getElementById('scoreChart');
        if (!ctx || !window.Chart) return;

        const chartData = this.prepareChartData();
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Score Progress Over Time'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        },
                        type: 'time',
                        time: {
                            displayFormats: {
                                minute: 'HH:mm',
                                hour: 'HH:mm'
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Score'
                        },
                        beginAtZero: true
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // Prepare Chart Data
    prepareChartData() {
        const playerColors = [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
            '#8b5cf6', '#f97316', '#06b6d4', '#84cc16',
            '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'
        ];

        const datasets = this.gameState.players.map((player, index) => {
            const playerHistory = this.gameState.scoreHistory
                .filter(entry => entry.playerId === player.id)
                .map(entry => ({
                    x: new Date(entry.timestamp),
                    y: entry.newScore
                }));

            return {
                label: player.name,
                data: playerHistory,
                borderColor: playerColors[index % playerColors.length],
                backgroundColor: playerColors[index % playerColors.length] + '20',
                tension: 0.1,
                fill: false
            };
        });

        return { datasets };
    }

    // Generate Statistics HTML
    generateStatsHTML() {
        const stats = this.calculateGameStats();
        
        return `
            <div class="stat-card">
                <h4>Game Duration</h4>
                <p class="stat-value">${stats.duration}</p>
            </div>
            <div class="stat-card">
                <h4>Total Score Changes</h4>
                <p class="stat-value">${stats.totalChanges}</p>
            </div>
            <div class="stat-card">
                <h4>Highest Score</h4>
                <p class="stat-value">${stats.highestScore.score} (${stats.highestScore.player})</p>
            </div>
            <div class="stat-card">
                <h4>Most Active Player</h4>
                <p class="stat-value">${stats.mostActive.player} (${stats.mostActive.changes} changes)</p>
            </div>
            ${this.gameState.players.map(player => {
                const playerStats = stats.playerStats[player.id];
                return `
                    <div class="player-stat-card">
                        <h4>${player.name}</h4>
                        <div class="player-stats">
                            <span>Current: ${player.score}</span>
                            <span>Changes: ${playerStats.totalChanges}</span>
                            <span>Net: ${playerStats.netChange > 0 ? '+' : ''}${playerStats.netChange}</span>
                            <span>Avg per change: ${playerStats.avgChange.toFixed(1)}</span>
                        </div>
                    </div>
                `;
            }).join('')}
        `;
    }

    // Calculate Game Statistics
    calculateGameStats() {
        const now = Date.now();
        const duration = this.formatDuration(now - this.gameState.sessionStartTime);
        
        const nonInitialHistory = this.gameState.scoreHistory.filter(entry => !entry.isInitial);
        const totalChanges = nonInitialHistory.length;
        
        let highestScore = { score: 0, player: '' };
        let mostActive = { player: '', changes: 0 };
        
        const playerStats = {};
        
        this.gameState.players.forEach(player => {
            const playerHistory = nonInitialHistory.filter(entry => entry.playerId === player.id);
            const totalChanges = playerHistory.length;
            const netChange = player.score - this.gameState.startingScore;
            const avgChange = totalChanges > 0 ? netChange / totalChanges : 0;
            
            playerStats[player.id] = {
                totalChanges,
                netChange,
                avgChange
            };
            
            if (player.score > highestScore.score) {
                highestScore = { score: player.score, player: player.name };
            }
            
            if (totalChanges > mostActive.changes) {
                mostActive = { player: player.name, changes: totalChanges };
            }
        });
        
        return {
            duration,
            totalChanges,
            highestScore,
            mostActive,
            playerStats
        };
    }

    // Generate Timeline HTML
    generateTimelineHTML() {
        const timeline = this.gameState.scoreHistory
            .filter(entry => !entry.isInitial)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 20) // Show last 20 events
            .map(entry => {
                const time = new Date(entry.timestamp).toLocaleTimeString();
                const changeText = entry.change > 0 ? `+${entry.change}` : `${entry.change}`;
                const changeClass = entry.change > 0 ? 'positive' : 'negative';
                
                return `
                    <div class="timeline-item">
                        <div class="timeline-time">${time}</div>
                        <div class="timeline-content">
                            <strong>${entry.playerName}</strong> 
                            <span class="score-change ${changeClass}">${changeText}</span>
                            <span class="score-result">→ ${entry.newScore}</span>
                        </div>
                    </div>
                `;
            }).join('');
            
        return timeline || '<p>No score changes yet.</p>';
    }

    // Format Duration
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    // Export Summary Report
    exportSummaryReport() {
        const stats = this.calculateGameStats();
        const reportData = {
            sessionInfo: {
                code: this.gameState.sessionCode,
                name: this.gameState.sessionName,
                startTime: new Date(this.gameState.sessionStartTime).toISOString(),
                duration: stats.duration,
                playerCount: this.gameState.numPlayers
            },
            currentScores: this.gameState.players.map(p => ({
                name: p.name,
                score: p.score
            })),
            statistics: stats,
            scoreHistory: this.gameState.scoreHistory,
            settings: {
                startingScore: this.gameState.startingScore,
                targetScore: this.gameState.targetScore,
                allowDecimals: this.gameState.allowDecimals
            }
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gamescore-summary-${this.gameState.sessionCode}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showMessage('Summary report exported successfully!', 'success');
    }

    // Export Chart as Image
    exportChart() {
        if (!this.chart) return;
        
        const url = this.chart.toBase64Image();
        const a = document.createElement('a');
        a.href = url;
        a.download = `gamescore-chart-${this.gameState.sessionCode}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        this.showMessage('Chart exported successfully!', 'success');
    }

    // Destroy Chart
    destroyChart() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    // Update Game State from Firebase
    updateGameStateFromFirebase(sessionData) {
        if (sessionData.players) {
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
            const oldScore = player.score;
            player.score = startingScore;
            this.updatePlayerTileScore(player.id, startingScore);
            
            // Add to history
            this.gameState.scoreHistory.push({
                playerId: player.id,
                playerName: player.name,
                oldScore,
                newScore: startingScore,
                change: startingScore - oldScore,
                timestamp: Date.now(),
                isReset: true
            });
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
                startTime: new Date(this.gameState.sessionStartTime).toISOString(),
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

        setTimeout(() => {
            if (document.body.contains(message)) {
                document.body.removeChild(message);
            }
        }, 5000);

        message.querySelector('.message-close').addEventListener('click', () => {
            if (document.body.contains(message)) {
                document.body.removeChild(message);
            }
        });
    }

    // Cleanup
    cleanup() {
        this.destroyChart();
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

