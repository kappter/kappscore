// GameScore Pro - Complete with Enhanced Export and Summary Features
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
            isActive: false // Start as inactive until someone joins
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
            
            // Find or assign player - FIXED VERSION
            currentPlayer = findOrAssignPlayer(playerName);
            console.log('Assigned player:', currentPlayer);
            
            if (!currentPlayer) {
                showMessage('Session is full. Please try again later.', 'error');
                return;
            }
            
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

// Player Management - FIXED VERSION
function findOrAssignPlayer(playerName) {
    console.log('Finding or assigning player:', playerName);
    console.log('Available players:', players);
    
    if (!players || players.length === 0) {
        console.error('No players available in session');
        return null;
    }
    
    // Try to find existing player with same name
    let player = players.find(p => p.name === playerName && p.isActive);
    
    if (player) {
        console.log('Found existing active player:', player);
        return player;
    }
    
    // Try to find player with same name but inactive
    player = players.find(p => p.name === playerName);
    if (player) {
        player.isActive = true;
        player.joinedAt = new Date().toISOString();
        console.log('Reactivated existing player:', player);
        return player;
    }
    
    // Find first available slot (inactive player)
    player = players.find(p => !p.isActive);
    if (player) {
        player.name = playerName;
        player.isActive = true;
        player.joinedAt = new Date().toISOString();
        console.log('Assigned to available slot:', player);
        
        // Update in Firebase
        if (firebaseReady && currentSession) {
            const database = getFirebaseDatabase();
            if (database) {
                const playerRef = database.ref(`sessions/${currentSession.code}/players/${player.id}`);
                playerRef.update({
                    name: playerName,
                    isActive: true,
                    joinedAt: player.joinedAt
                });
            }
        }
        
        return player;
    }
    
    console.log('No available player slots found');
    return null;
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
    console.log('Creating tile for player:', player.name, 'Score:', player.score);
    
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
            <div class="score-value">${player.score || 0}</div>
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
        ` : `
            <div class="player-view-controls">
                <button class="refresh-btn" onclick="refreshScores()">🔄 Refresh</button>
            </div>
        `}
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

// Missing Functions - ADDED
function refreshScores() {
    console.log('Refreshing scores...');
    if (currentSession && !isScorekeeper) {
        loadSessionFromFirebase(currentSession.code)
            .then((sessionData) => {
                currentSession = sessionData;
                players = sessionData.players;
                updatePlayerView();
                showMessage('Scores refreshed!', 'success');
            })
            .catch(error => {
                console.error('Error refreshing scores:', error);
                showMessage('Could not refresh scores', 'error');
            });
    }
}

function leaveSession() {
    console.log('Leaving session...');
    
    // Mark current player as inactive
    if (currentPlayer && firebaseReady && currentSession) {
        const database = getFirebaseDatabase();
        if (database) {
            const playerRef = database.ref(`sessions/${currentSession.code}/players/${currentPlayer.id}/isActive`);
            playerRef.set(false);
        }
    }
    
    // Clean up
    currentSession = null;
    currentPlayer = null;
    isScorekeeper = false;
    players = [];
    scoreHistory = [];
    
    // Return to landing page
    showPage('landing');
    showMessage('Left session', 'info');
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
    
    const oldScore = player.score || 0;
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

// Enhanced Export and Summary Functions
function exportGameData() {
    if (!currentSession) {
        showMessage('No active session to export', 'error');
        return;
    }
    
    // Create both JSON and HTML exports
    exportJSONData();
    exportHTMLSummary();
}

function exportJSONData() {
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
}

function exportHTMLSummary() {
    const htmlContent = generateHTMLSummary();
    const htmlBlob = new Blob([htmlContent], {type: 'text/html'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(htmlBlob);
    link.download = `GameScore_Summary_${currentSession.code}_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    
    showMessage('Game data and HTML summary exported successfully!', 'success');
}

function generateHTMLSummary() {
    const sessionStart = new Date(currentSession.createdAt);
    const sessionEnd = new Date();
    const duration = Math.round((sessionEnd - sessionStart) / 1000 / 60); // minutes
    
    // Calculate statistics
    const stats = calculateGameStatistics();
    
    // Generate score progression data
    const progressionData = generateScoreProgressionData();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GameScore Pro - ${currentSession.name} Summary</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 700;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 1.2em;
        }
        .content {
            padding: 40px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #1e3a8a;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            border: 2px solid #e2e8f0;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #1e3a8a;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #64748b;
            font-size: 0.9em;
        }
        .players-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .player-card {
            background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
            border: 2px solid #e2e8f0;
            border-radius: 15px;
            padding: 20px;
            position: relative;
        }
        .player-card.winner {
            border-color: #fbbf24;
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        }
        .player-card.winner::before {
            content: "🏆";
            position: absolute;
            top: -10px;
            right: -10px;
            font-size: 2em;
            background: #fbbf24;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .player-name {
            font-size: 1.3em;
            font-weight: bold;
            color: #1e3a8a;
            margin-bottom: 10px;
        }
        .player-score {
            font-size: 2em;
            font-weight: bold;
            color: #059669;
            margin-bottom: 15px;
        }
        .player-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            font-size: 0.9em;
            color: #64748b;
        }
        .chart-container {
            background: white;
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .timeline {
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 20px;
        }
        .timeline-item {
            display: flex;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #f1f5f9;
        }
        .timeline-item:last-child {
            border-bottom: none;
        }
        .timeline-time {
            font-size: 0.8em;
            color: #64748b;
            width: 80px;
            flex-shrink: 0;
        }
        .timeline-content {
            flex: 1;
            margin-left: 15px;
        }
        .footer {
            background: #f8fafc;
            padding: 20px;
            text-align: center;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${currentSession.name}</h1>
            <p>Session ${currentSession.code} • ${sessionStart.toLocaleDateString()} • ${duration} minutes</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📊 Game Statistics</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${players.length}</div>
                        <div class="stat-label">Players</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${duration}</div>
                        <div class="stat-label">Minutes Played</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${scoreHistory.length}</div>
                        <div class="stat-label">Score Changes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.winner ? stats.winner.score : 'N/A'}</div>
                        <div class="stat-label">Highest Score</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>🏆 Final Standings</h2>
                <div class="players-grid">
                    ${players.sort((a, b) => (b.score || 0) - (a.score || 0)).map((player, index) => `
                        <div class="player-card ${index === 0 ? 'winner' : ''}">
                            <div class="player-name">${player.name}</div>
                            <div class="player-score">${player.score || 0}</div>
                            <div class="player-stats">
                                <div>Rank: #${index + 1}</div>
                                <div>Changes: ${scoreHistory.filter(h => h.playerId === player.id).length}</div>
                                <div>Joined: ${new Date(player.joinedAt).toLocaleTimeString()}</div>
                                <div>Status: ${player.isActive ? 'Active' : 'Inactive'}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="section">
                <h2>📈 Score Progression</h2>
                <div class="chart-container">
                    <canvas id="scoreChart" width="400" height="200"></canvas>
                </div>
            </div>
            
            <div class="section">
                <h2>⏰ Game Timeline</h2>
                <div class="timeline">
                    ${scoreHistory.slice(-20).reverse().map(entry => `
                        <div class="timeline-item">
                            <div class="timeline-time">${new Date(entry.timestamp).toLocaleTimeString()}</div>
                            <div class="timeline-content">
                                <strong>${entry.playerName}</strong> ${entry.delta > 0 ? 'gained' : 'lost'} 
                                ${Math.abs(entry.delta)} points (${entry.oldScore} → ${entry.newScore})
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated by GameScore Pro • ${new Date().toLocaleString()}</p>
        </div>
    </div>
    
    <script>
        // Create score progression chart
        const ctx = document.getElementById('scoreChart').getContext('2d');
        const chartData = ${JSON.stringify(progressionData)};
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: chartData.datasets
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Score Progression Over Time'
                    },
                    legend: {
                        display: true,
                        position: 'top'
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
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    </script>
</body>
</html>`;
}

function calculateGameStatistics() {
    const winner = players.reduce((prev, current) => 
        (prev.score || 0) > (current.score || 0) ? prev : current
    );
    
    return {
        winner,
        totalChanges: scoreHistory.length,
        averageScore: players.reduce((sum, p) => sum + (p.score || 0), 0) / players.length,
        gameLength: Math.round((new Date() - new Date(currentSession.createdAt)) / 1000 / 60)
    };
}

function generateScoreProgressionData() {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
    
    // Create timeline of all score changes
    const timeline = [...scoreHistory].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Initialize player scores
    const playerScores = {};
    players.forEach(player => {
        playerScores[player.id] = currentSession.startingScore || 0;
    });
    
    const labels = ['Start'];
    const datasets = players.map((player, index) => ({
        label: player.name,
        data: [currentSession.startingScore || 0],
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        tension: 0.1
    }));
    
    // Process each score change
    timeline.forEach((change, index) => {
        labels.push(new Date(change.timestamp).toLocaleTimeString());
        
        // Update the score for the player who changed
        playerScores[change.playerId] = change.newScore;
        
        // Add current scores for all players
        datasets.forEach(dataset => {
            const player = players.find(p => p.name === dataset.label);
            dataset.data.push(playerScores[player.id]);
        });
    });
    
    return { labels, datasets };
}

function showGameSummary() {
    if (!currentSession) {
        showMessage('No active session to summarize', 'error');
        return;
    }
    
    // Create and show summary modal
    const modal = createSummaryModal();
    document.body.appendChild(modal);
    
    // Initialize chart after modal is shown
    setTimeout(() => {
        initializeSummaryChart();
    }, 100);
}

function createSummaryModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content summary-modal">
            <div class="modal-header">
                <h2>📊 Game Summary</h2>
                <button class="modal-close" onclick="closeSummaryModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="summary-tabs">
                    <button class="tab-btn active" onclick="showSummaryTab('overview')">Overview</button>
                    <button class="tab-btn" onclick="showSummaryTab('chart')">Chart</button>
                    <button class="tab-btn" onclick="showSummaryTab('timeline')">Timeline</button>
                </div>
                
                <div id="overview-tab" class="tab-content active">
                    <div class="summary-stats">
                        ${generateSummaryStats()}
                    </div>
                    <div class="summary-players">
                        ${generateSummaryPlayers()}
                    </div>
                </div>
                
                <div id="chart-tab" class="tab-content">
                    <canvas id="summaryChart" width="400" height="200"></canvas>
                </div>
                
                <div id="timeline-tab" class="tab-content">
                    <div class="summary-timeline">
                        ${generateSummaryTimeline()}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="exportHTMLSummary()" class="btn btn-primary">📄 Export HTML</button>
                <button onclick="exportJSONData()" class="btn btn-secondary">📊 Export JSON</button>
                <button onclick="closeSummaryModal()" class="btn btn-secondary">Close</button>
            </div>
        </div>
    `;
    
    return modal;
}

function generateSummaryStats() {
    const stats = calculateGameStatistics();
    const duration = Math.round((new Date() - new Date(currentSession.createdAt)) / 1000 / 60);
    
    return `
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">${players.length}</div>
                <div class="stat-label">Players</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${duration}m</div>
                <div class="stat-label">Duration</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${scoreHistory.length}</div>
                <div class="stat-label">Score Changes</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.winner.score || 0}</div>
                <div class="stat-label">Highest Score</div>
            </div>
        </div>
    `;
}

function generateSummaryPlayers() {
    const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
    
    return `
        <h3>🏆 Current Standings</h3>
        <div class="players-list">
            ${sortedPlayers.map((player, index) => `
                <div class="player-summary ${index === 0 ? 'winner' : ''}">
                    <div class="player-rank">#${index + 1}</div>
                    <div class="player-info">
                        <div class="player-name">${player.name} ${index === 0 ? '🏆' : ''}</div>
                        <div class="player-details">
                            Score: ${player.score || 0} • 
                            Changes: ${scoreHistory.filter(h => h.playerId === player.id).length} • 
                            ${player.isActive ? 'Active' : 'Inactive'}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function generateSummaryTimeline() {
    const recentHistory = scoreHistory.slice(-10).reverse();
    
    return `
        <h3>⏰ Recent Activity</h3>
        <div class="timeline-list">
            ${recentHistory.map(entry => `
                <div class="timeline-entry">
                    <div class="timeline-time">${new Date(entry.timestamp).toLocaleTimeString()}</div>
                    <div class="timeline-event">
                        <strong>${entry.playerName}</strong> ${entry.delta > 0 ? 'gained' : 'lost'} 
                        ${Math.abs(entry.delta)} points (${entry.oldScore} → ${entry.newScore})
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function initializeSummaryChart() {
    const canvas = document.getElementById('summaryChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const progressionData = generateScoreProgressionData();
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: progressionData.labels,
            datasets: progressionData.datasets
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Score Progression'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function showSummaryTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
    
    // Initialize chart if chart tab is selected
    if (tabName === 'chart') {
        setTimeout(() => initializeSummaryChart(), 100);
    }
}

function closeSummaryModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
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

function showQRCode() {
    if (!currentSession) {
        showMessage('No active session', 'error');
        return;
    }
    
    showMessage(`Session Code: ${currentSession.code}`, 'info');
}

