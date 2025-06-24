// GameScore Pro - Updated with Fixed Session Code Display
console.log('GameScore Pro initialized');

// Global app state
let currentSession = null;
let currentPlayer = null;
let isScorekeeper = false;
let players = [];
let scoreHistory = [];
let firebaseReady = false;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('Initializing app...');
    
    // Bind all event listeners
    bindEventListeners();
    
    // Initialize theme
    initializeTheme();
    
    // Show landing page
    showPage('landing');
    
    // Wait for Firebase to be ready
    waitForFirebase();
}

function waitForFirebase() {
    console.log('Waiting for Firebase...');
    
    // Check if Firebase is available
    if (window.firebaseService) {
        console.log('Firebase service found, setting up connection monitoring...');
        
        window.firebaseService.onConnectionChange((isOnline) => {
            console.log('Firebase connection changed:', isOnline);
            firebaseReady = isOnline;
            updateConnectionStatus(isOnline);
            
            if (isOnline) {
                console.log('Firebase is ready!');
            }
        });
    } else {
        console.log('Firebase service not found, running in offline mode');
        firebaseReady = false;
        updateConnectionStatus(false);
    }
}

// Page Navigation
function showPage(pageId) {
    console.log('Showing page:', pageId);
    
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show the requested page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        console.log('Page shown successfully:', pageId);
    } else {
        console.error('Page not found:', pageId);
    }
}

// Event Listeners
function bindEventListeners() {
    console.log('Binding event listeners...');
    
    // Landing page buttons
    const createBtn = document.getElementById('createSessionBtn');
    const joinBtn = document.getElementById('joinSessionBtn');
    
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            console.log('Create session button clicked');
            showPage('createSession');
        });
    }
    
    if (joinBtn) {
        joinBtn.addEventListener('click', () => {
            console.log('Join session button clicked');
            showPage('joinSession');
        });
    }
    
    // Back buttons
    const backButtons = document.querySelectorAll('.back-btn');
    backButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('Back button clicked');
            showPage('landing');
        });
    });
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Player count controls
    const decreaseBtn = document.getElementById('decreasePlayerCount');
    const increaseBtn = document.getElementById('increasePlayerCount');
    
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', () => adjustPlayerCount(-1));
    }
    
    if (increaseBtn) {
        increaseBtn.addEventListener('click', () => adjustPlayerCount(1));
    }
    
    // Form submissions
    const createForm = document.getElementById('createSessionForm');
    const joinForm = document.getElementById('joinSessionForm');
    
    if (createForm) {
        createForm.addEventListener('submit', handleCreateSession);
    }
    
    if (joinForm) {
        joinForm.addEventListener('submit', handleJoinSession);
    }
    
    // Export and summary buttons
    const exportBtn = document.getElementById('exportBtn');
    const summaryBtn = document.getElementById('summaryBtn');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportGameData);
    }
    
    if (summaryBtn) {
        summaryBtn.addEventListener('click', showGameSummary);
    }
    
    // QR code button
    const qrBtn = document.getElementById('showQRBtn');
    if (qrBtn) {
        qrBtn.addEventListener('click', showQRCode);
    }
    
    // Game control buttons
    const resetBtn = document.getElementById('resetScoresBtn');
    const newRoundBtn = document.getElementById('newRoundBtn');
    const endSessionBtn = document.getElementById('endSessionBtn');
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetAllScores);
    }
    
    if (newRoundBtn) {
        newRoundBtn.addEventListener('click', startNewRound);
    }
    
    if (endSessionBtn) {
        endSessionBtn.addEventListener('click', endSession);
    }
    
    console.log('Event listeners bound successfully');
}

// Player Count Management
function adjustPlayerCount(delta) {
    const input = document.getElementById('playerCount');
    if (input) {
        let currentValue = parseInt(input.value) || 2;
        let newValue = currentValue + delta;
        
        // Clamp between 1 and 12
        newValue = Math.max(1, Math.min(12, newValue));
        
        input.value = newValue;
        console.log('Player count adjusted to:', newValue);
    }
}

// Session Creation
function handleCreateSession(event) {
    event.preventDefault();
    console.log('Create session form submitted');
    
    const formData = new FormData(event.target);
    const sessionData = {
        name: formData.get('sessionName') || 'Game Session',
        playerCount: parseInt(formData.get('playerCount')) || 2,
        startingScore: parseFloat(formData.get('startingScore')) || 0,
        allowDecimals: formData.get('allowDecimals') === 'on',
        targetScore: parseFloat(formData.get('targetScore')) || null,
        continueAfterTarget: formData.get('continueAfterTarget') === 'on'
    };
    
    console.log('Session data:', sessionData);
    createSession(sessionData);
}

function createSession(sessionData) {
    console.log('Creating session...');
    
    // Generate session code
    const sessionCode = generateSessionCode();
    console.log('Generated session code:', sessionCode);
    
    // Initialize players
    players = [];
    for (let i = 1; i <= sessionData.playerCount; i++) {
        players.push({
            id: `player${i}`,
            name: `Player ${i}`,
            score: sessionData.startingScore,
            joinedAt: new Date().toISOString(),
            isActive: true
        });
    }
    
    console.log('Initialized players:', players);
    
    // Set up session
    currentSession = {
        code: sessionCode,
        ...sessionData,
        createdAt: new Date().toISOString(),
        players: players
    };
    
    console.log('Current session created:', currentSession);
    
    isScorekeeper = true;
    scoreHistory = [];
    
    // Update UI FIRST
    updateSessionInfo();
    generatePlayerTiles();
    showPage('scorekeeper');
    
    // Then try to save to Firebase
    if (firebaseReady && window.firebaseService) {
        console.log('Saving session to Firebase...');
        window.firebaseService.createSession(currentSession)
            .then(() => {
                console.log('Session saved to Firebase successfully');
                showMessage('Session created and saved online!', 'success');
            })
            .catch(error => {
                console.error('Error saving to Firebase:', error);
                showMessage('Session created locally (offline mode)', 'warning');
            });
    } else {
        console.log('Firebase not ready, session created locally');
        showMessage('Session created locally (offline mode)', 'warning');
    }
}

// Session Joining
function handleJoinSession(event) {
    event.preventDefault();
    console.log('Join session form submitted');
    
    const formData = new FormData(event.target);
    const sessionCode = formData.get('sessionCode')?.toUpperCase();
    const playerName = formData.get('playerName') || 'Player';
    
    console.log('Joining session:', sessionCode, 'as:', playerName);
    
    if (!sessionCode) {
        showMessage('Please enter a session code', 'error');
        return;
    }
    
    joinSession(sessionCode, playerName);
}

function joinSession(sessionCode, playerName) {
    console.log('Attempting to join session:', sessionCode);
    
    if (firebaseReady && window.firebaseService) {
        console.log('Joining via Firebase...');
        window.firebaseService.joinSession(sessionCode, playerName)
            .then((sessionData) => {
                console.log('Joined session successfully:', sessionData);
                currentSession = sessionData;
                isScorekeeper = false;
                
                // Find or assign player
                currentPlayer = findOrAssignPlayer(playerName);
                console.log('Assigned player:', currentPlayer);
                
                showMessage('Joined session successfully!', 'success');
                
                // Update UI and show player view
                updatePlayerView();
                showPage('playerView');
            })
            .catch(error => {
                console.error('Error joining session:', error);
                showMessage('Could not join session. Please check the code.', 'error');
            });
    } else {
        console.log('Firebase not ready, cannot join session');
        showMessage('Cannot join session - offline mode', 'error');
    }
}

// Player Management
function findOrAssignPlayer(playerName) {
    console.log('Finding or assigning player:', playerName);
    
    // Try to find existing player with same name
    let player = players.find(p => p.name === playerName);
    
    if (!player) {
        // Find first available slot
        player = players.find(p => p.name.startsWith('Player ') && !p.isActive);
        if (player) {
            player.name = playerName;
            player.isActive = true;
            player.joinedAt = new Date().toISOString();
        }
    }
    
    console.log('Player found/assigned:', player);
    return player;
}

function generatePlayerTiles() {
    console.log('Generating player tiles...');
    
    const container = document.getElementById('playersGrid');
    if (!container) {
        console.error('Players grid container not found');
        return;
    }
    
    container.innerHTML = '';
    container.setAttribute('data-player-count', players.length);
    
    players.forEach((player, index) => {
        const tile = createPlayerTile(player, index, isScorekeeper);
        container.appendChild(tile);
    });
    
    console.log('Player tiles generated successfully');
}

function createPlayerTile(player, index, isEditable) {
    console.log('Creating tile for player:', player.name);
    
    const tile = document.createElement('div');
    tile.className = 'player-tile';
    tile.setAttribute('data-player-id', player.id);
    
    if (!isEditable && currentPlayer && player.id === currentPlayer.id) {
        tile.classList.add('current-player');
    }
    
    tile.innerHTML = `
        <div class="player-header">
            <h3 class="player-name" ${isEditable || (currentPlayer && player.id === currentPlayer.id) ? 'contenteditable="true"' : ''}>${player.name}</h3>
            ${!isEditable && currentPlayer && player.id === currentPlayer.id ? '<span class="current-player-badge">You</span>' : ''}
        </div>
        
        <div class="player-score">
            <div class="score-value">${player.score}</div>
        </div>
        
        ${isEditable ? `
            <div class="custom-amount-section">
                <label>Custom Amount:</label>
                <input type="number" class="custom-amount" value="1" step="${currentSession?.allowDecimals ? '0.1' : '1'}">
                <div class="preset-buttons">
                    <button class="preset-btn" data-amount="+1">+1</button>
                    <button class="preset-btn" data-amount="+5">+5</button>
                    <button class="preset-btn" data-amount="+10">+10</button>
                    <button class="preset-btn" data-amount="-1">-1</button>
                </div>
            </div>
            
            <div class="score-controls">
                <button class="score-btn decrease-btn" onclick="updateScore('${player.id}', 'decrease')">−</button>
                <button class="score-btn increase-btn" onclick="updateScore('${player.id}', 'increase')">+</button>
            </div>
        ` : ''}
    `;
    
    // Add event listeners for editable elements
    if (isEditable || (currentPlayer && player.id === currentPlayer.id)) {
        const nameElement = tile.querySelector('.player-name');
        if (nameElement) {
            nameElement.addEventListener('blur', (e) => {
                updatePlayerName(player.id, e.target.textContent);
            });
        }
    }
    
    // Add preset button listeners
    if (isEditable) {
        const presetBtns = tile.querySelectorAll('.preset-btn');
        presetBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = parseFloat(e.target.getAttribute('data-amount'));
                updateScoreByAmount(player.id, amount);
            });
        });
    }
    
    return tile;
}

// Score Management
function updateScore(playerId, action) {
    console.log('Updating score for player:', playerId, 'action:', action);
    
    const tile = document.querySelector(`[data-player-id="${playerId}"]`);
    if (!tile) {
        console.error('Player tile not found for:', playerId);
        return;
    }
    
    const customAmountInput = tile.querySelector('.custom-amount');
    const amount = customAmountInput ? parseFloat(customAmountInput.value) || 1 : 1;
    
    const delta = action === 'increase' ? amount : -amount;
    updateScoreByAmount(playerId, delta);
}

function updateScoreByAmount(playerId, delta) {
    console.log('Updating score by amount:', playerId, delta);
    
    const player = players.find(p => p.id === playerId);
    if (!player) {
        console.error('Player not found:', playerId);
        return;
    }
    
    const oldScore = player.score;
    const newScore = oldScore + delta;
    
    console.log('Score change:', oldScore, '->', newScore);
    
    // Update player score
    player.score = newScore;
    
    // Add to history
    scoreHistory.push({
        playerId: playerId,
        playerName: player.name,
        oldScore: oldScore,
        newScore: newScore,
        delta: delta,
        timestamp: new Date().toISOString(),
        action: delta > 0 ? 'increase' : 'decrease'
    });
    
    // Update UI
    updatePlayerScoreDisplay(playerId, newScore);
    
    // Save to Firebase
    if (firebaseReady && window.firebaseService && currentSession) {
        window.firebaseService.updatePlayerScore(currentSession.code, playerId, newScore)
            .then(() => {
                console.log('Player score updated in Firebase');
            })
            .catch(error => {
                console.error('Error updating score in Firebase:', error);
            });
    }
    
    // Check for target score
    if (currentSession?.targetScore && newScore >= currentSession.targetScore) {
        showMessage(`${player.name} reached the target score!`, 'success');
    }
}

function updatePlayerScoreDisplay(playerId, newScore) {
    const tile = document.querySelector(`[data-player-id="${playerId}"]`);
    if (!tile) return;
    
    const scoreElement = tile.querySelector('.score-value');
    if (scoreElement) {
        scoreElement.textContent = newScore;
        scoreElement.classList.add('score-updated');
        setTimeout(() => {
            scoreElement.classList.remove('score-updated');
        }, 300);
    }
}

function updatePlayerName(playerId, newName) {
    console.log('Updating player name:', playerId, newName);
    
    const player = players.find(p => p.id === playerId);
    if (!player || !newName.trim()) return;
    
    player.name = newName.trim();
    
    // Save to Firebase
    if (firebaseReady && window.firebaseService && currentSession) {
        window.firebaseService.updatePlayerName(currentSession.code, playerId, newName)
            .then(() => {
                console.log('Player name updated in Firebase');
            })
            .catch(error => {
                console.error('Error updating name in Firebase:', error);
            });
    }
}

// UI Updates
function updateSessionInfo() {
    console.log('Updating session info...');
    
    if (!currentSession) {
        console.error('No current session to update');
        return;
    }
    
    console.log('Session code to display:', currentSession.code);
    
    // Update all session code elements
    const codeElements = document.querySelectorAll('#sessionCode, #playerViewSessionCode');
    codeElements.forEach(element => {
        if (element) {
            element.textContent = currentSession.code;
            console.log('Updated session code element:', element.id, 'with:', currentSession.code);
        }
    });
    
    // Update session name in player view
    const sessionNameElement = document.getElementById('playerViewSessionName');
    if (sessionNameElement) {
        sessionNameElement.textContent = currentSession.name || 'Game Session';
        console.log('Updated session name:', currentSession.name);
    }
    
    console.log('Session info updated successfully');
}

function updatePlayerView() {
    console.log('Updating player view...');
    
    if (!currentSession) {
        console.error('No current session for player view');
        return;
    }
    
    players = Object.values(currentSession.players || {});
    console.log('Players for view:', players);
    
    // Update session info
    updateSessionInfo();
    
    // Generate player tiles for viewing
    generatePlayerTiles();
    
    // Update last updated time
    const lastUpdatedElement = document.getElementById('lastUpdated');
    if (lastUpdatedElement) {
        lastUpdatedElement.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }
    
    console.log('Player view updated successfully');
}

// Game Controls
function resetAllScores() {
    if (!confirm('Are you sure you want to reset all scores?')) return;
    
    const startingScore = currentSession?.startingScore || 0;
    
    players.forEach(player => {
        player.score = startingScore;
        updatePlayerScoreDisplay(player.id, startingScore);
    });
    
    // Add to history
    scoreHistory.push({
        action: 'reset_all',
        timestamp: new Date().toISOString(),
        note: 'All scores reset'
    });
    
    showMessage('All scores have been reset', 'info');
}

function startNewRound() {
    if (!confirm('Start a new round? This will keep current scores.')) return;
    
    scoreHistory.push({
        action: 'new_round',
        timestamp: new Date().toISOString(),
        note: 'New round started'
    });
    
    showMessage('New round started!', 'info');
}

function endSession() {
    if (!confirm('Are you sure you want to end this session?')) return;
    
    // Clean up
    currentSession = null;
    currentPlayer = null;
    isScorekeeper = false;
    players = [];
    scoreHistory = [];
    
    showMessage('Session ended', 'info');
    showPage('landing');
}

// Export and Summary
function exportGameData() {
    if (!currentSession) {
        showMessage('No active session to export', 'error');
        return;
    }
    
    const exportData = {
        session: currentSession,
        players: players,
        scoreHistory: scoreHistory,
        exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `gamescore-${currentSession.code}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showMessage('Game data exported successfully!', 'success');
}

function showGameSummary() {
    if (!currentSession) {
        showMessage('No active session to summarize', 'error');
        return;
    }
    
    // Create and show summary modal
    const modal = createSummaryModal();
    document.body.appendChild(modal);
}

function createSummaryModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content summary-content">
            <div class="modal-header">
                <h3>Game Summary - ${currentSession.code}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="summary-tabs">
                    <button class="tab-btn active" data-tab="overview">Overview</button>
                    <button class="tab-btn" data-tab="statistics">Statistics</button>
                    <button class="tab-btn" data-tab="timeline">Timeline</button>
                </div>
                
                <div class="tab-panel active" id="overview-panel">
                    <div class="chart-container">
                        <canvas id="scoreChart"></canvas>
                    </div>
                </div>
                
                <div class="tab-panel" id="statistics-panel">
                    <div class="stats-grid">
                        ${generateStatistics()}
                    </div>
                </div>
                
                <div class="tab-panel" id="timeline-panel">
                    <div class="timeline-container">
                        ${generateTimeline()}
                    </div>
                </div>
                
                <div class="summary-actions">
                    <button class="secondary-btn" onclick="exportSummaryData()">Export Data</button>
                    <button class="secondary-btn" onclick="exportSummaryImage()">Export Chart</button>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Tab switching
    modal.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = e.target.getAttribute('data-tab');
            switchTab(modal, tabId);
        });
    });
    
    // Initialize chart after modal is added to DOM
    setTimeout(() => {
        initializeScoreChart();
    }, 100);
    
    return modal;
}

function generateStatistics() {
    const duration = currentSession ? 
        Math.round((new Date() - new Date(currentSession.createdAt)) / 1000 / 60) : 0;
    
    const totalChanges = scoreHistory.length;
    const highestScore = Math.max(...players.map(p => p.score));
    const lowestScore = Math.min(...players.map(p => p.score));
    
    return `
        <div class="stat-card">
            <h4>Session Code</h4>
            <p class="stat-value">${currentSession.code}</p>
        </div>
        <div class="stat-card">
            <h4>Game Duration</h4>
            <p class="stat-value">${duration} min</p>
        </div>
        <div class="stat-card">
            <h4>Total Changes</h4>
            <p class="stat-value">${totalChanges}</p>
        </div>
        <div class="stat-card">
            <h4>Highest Score</h4>
            <p class="stat-value">${highestScore}</p>
        </div>
        <div class="stat-card">
            <h4>Lowest Score</h4>
            <p class="stat-value">${lowestScore}</p>
        </div>
        ${players.map(player => `
            <div class="player-stat-card">
                <h4>${player.name}</h4>
                <div class="player-stats">
                    <span>Current: ${player.score}</span>
                    <span>Changes: ${scoreHistory.filter(h => h.playerId === player.id).length}</span>
                </div>
            </div>
        `).join('')}
    `;
}

function generateTimeline() {
    if (scoreHistory.length === 0) {
        return '<p>No score changes yet.</p>';
    }
    
    return scoreHistory.slice().reverse().map(entry => {
        const time = new Date(entry.timestamp).toLocaleTimeString();
        
        if (entry.action === 'reset_all' || entry.action === 'new_round') {
            return `
                <div class="timeline-item">
                    <div class="timeline-time">${time}</div>
                    <div class="timeline-content">
                        <strong>${entry.note}</strong>
                    </div>
                </div>
            `;
        }
        
        const changeClass = entry.delta > 0 ? 'positive' : 'negative';
        const changeSymbol = entry.delta > 0 ? '+' : '';
        
        return `
            <div class="timeline-item">
                <div class="timeline-time">${time}</div>
                <div class="timeline-content">
                    <strong>${entry.playerName}</strong>
                    <span class="score-change ${changeClass}">${changeSymbol}${entry.delta}</span>
                    <span class="score-result">(${entry.oldScore} → ${entry.newScore})</span>
                </div>
            </div>
        `;
    }).join('');
}

function switchTab(modal, tabId) {
    // Update tab buttons
    modal.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    modal.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    
    // Update tab panels
    modal.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    modal.querySelector(`#${tabId}-panel`).classList.add('active');
}

function initializeScoreChart() {
    // This would initialize Chart.js if available
    // For now, show a placeholder
    const canvas = document.getElementById('scoreChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Score progression for session ${currentSession.code}`, canvas.width/2, canvas.height/2 - 10);
        ctx.fillText('(Chart.js integration needed)', canvas.width/2, canvas.height/2 + 15);
    }
}

// QR Code
function showQRCode() {
    if (!currentSession) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Share Session: ${currentSession.code}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p><strong>Session Code:</strong> ${currentSession.code}</p>
                <input type="text" class="share-url" value="${window.location.href}" readonly>
                <div class="qr-placeholder">
                    <h2>${currentSession.code}</h2>
                    <p>Share this code with other players</p>
                    <p>Session: ${currentSession.name}</p>
                </div>
            </div>
        </div>
    `;
    
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    document.body.appendChild(modal);
}

// Utility Functions
function generateSessionCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    console.log('Generated session code:', result);
    return result;
}

function showMessage(text, type = 'info') {
    console.log('Showing message:', text, type);
    
    const message = document.createElement('div');
    message.className = `message message-${type}`;
    message.innerHTML = `
        <span>${text}</span>
        <button class="message-close">&times;</button>
    `;
    
    message.querySelector('.message-close').addEventListener('click', () => {
        message.remove();
    });
    
    document.body.appendChild(message);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
    }, 5000);
}

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icons = document.querySelectorAll('.theme-icon');
    icons.forEach(icon => {
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    });
}

// Connection Status
function updateConnectionStatus(isOnline) {
    console.log('Updating connection status:', isOnline);
    
    const statusDots = document.querySelectorAll('.status-dot');
    const statusTexts = document.querySelectorAll('.connection-status span');
    
    statusDots.forEach(dot => {
        dot.className = `status-dot ${isOnline ? 'online' : 'offline'}`;
    });
    
    statusTexts.forEach(text => {
        text.textContent = isOnline ? 'Online' : 'Offline';
    });
}

// Player View Functions
function refreshScores() {
    if (firebaseReady && window.firebaseService && currentSession) {
        window.firebaseService.getSession(currentSession.code)
            .then((sessionData) => {
                currentSession = sessionData;
                updatePlayerView();
                showMessage('Scores refreshed', 'success');
            })
            .catch(error => {
                console.error('Error refreshing scores:', error);
                showMessage('Could not refresh scores', 'error');
            });
    } else {
        showMessage('Cannot refresh - offline mode', 'warning');
    }
}

function leaveSession() {
    if (confirm('Are you sure you want to leave this session?')) {
        currentSession = null;
        currentPlayer = null;
        isScorekeeper = false;
        players = [];
        scoreHistory = [];
        
        showMessage('Left session', 'info');
        showPage('landing');
    }
}

// Export functions for summary
function exportSummaryData() {
    exportGameData();
}

function exportSummaryImage() {
    const canvas = document.getElementById('scoreChart');
    if (canvas) {
        const link = document.createElement('a');
        link.download = `gamescore-chart-${currentSession.code}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        showMessage('Chart exported successfully!', 'success');
    }
}

