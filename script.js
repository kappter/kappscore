// GameScore Pro - Final Firebase Connection Fix
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
    
    // Wait for Firebase to be ready with multiple attempts
    waitForFirebaseWithRetry();
}

function waitForFirebaseWithRetry() {
    console.log('Waiting for Firebase with retry logic...');
    
    let attempts = 0;
    const maxAttempts = 10;
    
    function checkFirebase() {
        attempts++;
        console.log(`Firebase check attempt ${attempts}/${maxAttempts}`);
        
        // Check multiple ways Firebase might be available
        const hasFirebaseApp = window.firebaseApp;
        const hasFirebaseDatabase = window.firebaseDatabase;
        const hasFirebaseGlobal = typeof firebase !== 'undefined';
        const isEnabled = window.isFirebaseEnabled;
        
        console.log('Firebase availability check:', {
            hasFirebaseApp,
            hasFirebaseDatabase,
            hasFirebaseGlobal,
            isEnabled
        });
        
        if (hasFirebaseDatabase || (hasFirebaseGlobal && firebase.database)) {
            console.log('Firebase found! Setting up connection monitoring...');
            setupFirebaseConnection();
            return;
        }
        
        if (attempts < maxAttempts) {
            console.log('Firebase not ready yet, retrying in 1 second...');
            setTimeout(checkFirebase, 1000);
        } else {
            console.log('Firebase not available after all attempts, running in offline mode');
            firebaseReady = false;
            updateConnectionStatus(false);
        }
    }
    
    // Start checking immediately and also after a short delay
    checkFirebase();
}

function setupFirebaseConnection() {
    try {
        // Get database reference
        let database = window.firebaseDatabase;
        if (!database && typeof firebase !== 'undefined') {
            database = firebase.database();
        }
        
        if (!database) {
            console.error('Could not get Firebase database reference');
            firebaseReady = false;
            updateConnectionStatus(false);
            return;
        }
        
        console.log('Setting up Firebase connection monitoring...');
        
        // Monitor connection status
        const connectedRef = database.ref('.info/connected');
        connectedRef.on('value', (snapshot) => {
            const isOnline = snapshot.val() === true;
            console.log('Firebase connection status changed:', isOnline);
            firebaseReady = isOnline;
            updateConnectionStatus(isOnline);
            
            if (isOnline) {
                console.log('Firebase is ready for operations!');
            }
        });
        
        // Also check if already connected
        connectedRef.once('value', (snapshot) => {
            const isOnline = snapshot.val() === true;
            console.log('Initial Firebase connection status:', isOnline);
            firebaseReady = isOnline;
            updateConnectionStatus(isOnline);
        });
        
    } catch (error) {
        console.error('Error setting up Firebase connection:', error);
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
    console.log('Firebase ready status for saving:', firebaseReady);
    if (firebaseReady) {
        console.log('Saving session to Firebase...');
        saveSessionToFirebase(currentSession)
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
        showMessage('Session created locally. Will sync when online.', 'warning');
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
    console.log('Firebase ready status:', firebaseReady);
    
    if (!firebaseReady) {
        showMessage('Firebase is connecting... Please wait a moment and try again.', 'warning');
        
        // Try to reconnect Firebase
        waitForFirebaseWithRetry();
        return;
    }
    
    console.log('Firebase is ready, attempting to join session...');
    loadSessionFromFirebase(sessionCode)
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
            
            // Set up real-time listeners
            setupRealtimeListeners(sessionCode);
        })
        .catch(error => {
            console.error('Error joining session:', error);
            showMessage('Could not find session. Please check the code and try again.', 'error');
        });
}

// Firebase Operations
function getFirebaseDatabase() {
    if (window.firebaseDatabase) {
        return window.firebaseDatabase;
    }
    if (typeof firebase !== 'undefined' && firebase.database) {
        return firebase.database();
    }
    return null;
}

function saveSessionToFirebase(session) {
    return new Promise((resolve, reject) => {
        const database = getFirebaseDatabase();
        if (!database) {
            reject(new Error('Firebase database not available'));
            return;
        }
        
        const sessionRef = database.ref(`sessions/${session.code}`);
        sessionRef.set({
            metadata: {
                name: session.name,
                createdAt: session.createdAt,
                playerCount: session.playerCount,
                startingScore: session.startingScore,
                allowDecimals: session.allowDecimals,
                targetScore: session.targetScore,
                continueAfterTarget: session.continueAfterTarget
            },
            players: session.players.reduce((acc, player) => {
                acc[player.id] = player;
                return acc;
            }, {}),
            scoreHistory: []
        })
        .then(() => resolve())
        .catch(error => reject(error));
    });
}

function loadSessionFromFirebase(sessionCode) {
    return new Promise((resolve, reject) => {
        const database = getFirebaseDatabase();
        if (!database) {
            reject(new Error('Firebase database not available'));
            return;
        }
        
        const sessionRef = database.ref(`sessions/${sessionCode}`);
        sessionRef.once('value')
            .then((snapshot) => {
                const data = snapshot.val();
                if (!data) {
                    reject(new Error('Session not found'));
                    return;
                }
                
                // Convert Firebase data back to session format
                const session = {
                    code: sessionCode,
                    ...data.metadata,
                    players: Object.values(data.players || {})
                };
                
                players = session.players;
                scoreHistory = data.scoreHistory || [];
                
                resolve(session);
            })
            .catch(error => reject(error));
    });
}

function setupRealtimeListeners(sessionCode) {
    const database = getFirebaseDatabase();
    if (!database) return;
    
    console.log('Setting up real-time listeners for session:', sessionCode);
    
    // Listen for player updates
    const playersRef = database.ref(`sessions/${sessionCode}/players`);
    playersRef.on('value', (snapshot) => {
        const playersData = snapshot.val();
        if (playersData) {
            players = Object.values(playersData);
            console.log('Players updated from Firebase:', players);
            
            // Update UI if we're in player view
            if (!isScorekeeper) {
                updatePlayerView();
            }
        }
    });
    
    // Listen for score history updates
    const historyRef = database.ref(`sessions/${sessionCode}/scoreHistory`);
    historyRef.on('value', (snapshot) => {
        const historyData = snapshot.val();
        if (historyData) {
            scoreHistory = Object.values(historyData);
            console.log('Score history updated from Firebase');
        }
    });
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
    if (firebaseReady && currentSession) {
        updatePlayerScoreInFirebase(currentSession.code, playerId, newScore);
    }
    
    // Check for target score
    if (currentSession?.targetScore && newScore >= currentSession.targetScore) {
        showMessage(`${player.name} reached the target score!`, 'success');
    }
}

function updatePlayerScoreInFirebase(sessionCode, playerId, newScore) {
    const database = getFirebaseDatabase();
    if (!database) return;
    
    const playerRef = database.ref(`sessions/${sessionCode}/players/${playerId}/score`);
    playerRef.set(newScore)
        .then(() => {
            console.log('Player score updated in Firebase');
        })
        .catch(error => {
            console.error('Error updating score in Firebase:', error);
        });
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
    if (!player) return;
    
    player.name = newName;
    
    // Update in Firebase if connected
    if (firebaseReady && currentSession) {
        const database = getFirebaseDatabase();
        if (database) {
            const playerRef = database.ref(`sessions/${currentSession.code}/players/${playerId}/name`);
            playerRef.set(newName);
        }
    }
}

// Session Info Management
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

// Utility Functions
function generateSessionCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function updateConnectionStatus(isOnline) {
    console.log('Updating connection status:', isOnline);
    
    const statusElements = document.querySelectorAll('.connection-status');
    statusElements.forEach(element => {
        const dot = element.querySelector('.status-dot');
        const text = element.querySelector('span');
        
        if (dot && text) {
            if (isOnline) {
                dot.className = 'status-dot online';
                text.textContent = 'Online';
            } else {
                dot.className = 'status-dot offline';
                text.textContent = 'Offline';
            }
        }
    });
}

function showMessage(message, type = 'info') {
    console.log('Showing message:', message, type);
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.innerHTML = `
        <span>${message}</span>
        <button class="message-close">×</button>
    `;
    
    // Add to page
    document.body.appendChild(messageEl);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
        }
    }, 5000);
    
    // Manual close
    messageEl.querySelector('.message-close').addEventListener('click', () => {
        if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
        }
    });
}

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icons = document.querySelectorAll('.theme-icon');
    icons.forEach(icon => {
        icon.textContent = theme === 'light' ? '🌙' : '☀️';
    });
}

// Game Controls
function resetAllScores() {
    if (!confirm('Are you sure you want to reset all scores?')) return;
    
    const startingScore = currentSession?.startingScore || 0;
    
    players.forEach(player => {
        player.score = startingScore;
        updatePlayerScoreDisplay(player.id, startingScore);
    });
    
    // Clear score history
    scoreHistory = [];
    
    // Update Firebase
    if (firebaseReady && currentSession) {
        const database = getFirebaseDatabase();
        if (database) {
            const sessionRef = database.ref(`sessions/${currentSession.code}`);
            sessionRef.child('players').set(players.reduce((acc, player) => {
                acc[player.id] = player;
                return acc;
            }, {}));
            sessionRef.child('scoreHistory').set([]);
        }
    }
    
    showMessage('All scores have been reset', 'success');
}

function startNewRound() {
    if (!confirm('Start a new round? (Scores will be kept)')) return;
    
    // Add round marker to history
    scoreHistory.push({
        type: 'round_start',
        timestamp: new Date().toISOString(),
        round: (scoreHistory.filter(h => h.type === 'round_start').length + 1)
    });
    
    showMessage('New round started!', 'success');
}

function endSession() {
    if (!confirm('Are you sure you want to end this session?')) return;
    
    // Clean up Firebase listeners
    const database = getFirebaseDatabase();
    if (database && currentSession) {
        database.ref(`sessions/${currentSession.code}`).off();
    }
    
    // Reset state
    currentSession = null;
    currentPlayer = null;
    isScorekeeper = false;
    players = [];
    scoreHistory = [];
    
    // Return to landing page
    showPage('landing');
    showMessage('Session ended', 'info');
}

// Export and Summary Functions
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
    link.download = `GameScore_${currentSession.code}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showMessage('Game data exported successfully!', 'success');
}

function showGameSummary() {
    showMessage('Game summary feature coming soon!', 'info');
}

function showQRCode() {
    if (!currentSession) {
        showMessage('No active session', 'error');
        return;
    }
    
    showMessage(`Session Code: ${currentSession.code}`, 'info');
}

