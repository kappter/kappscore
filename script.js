// GameScore Pro - Minimal Fix for Page Navigation

// Global variables
let currentSession = null;
let players = [];
let currentPlayer = null;
let isScorekeeper = false;
let firebaseReady = false;
let scoreHistory = [];

console.log('GameScore Pro initialized');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing app...');
    
    // Wait for Firebase to be ready
    waitForFirebase().then(() => {
        console.log('Firebase is ready for operations!');
        firebaseReady = true;
        
        // Initialize the app
        initializeApp();
    }).catch((error) => {
        console.error('Firebase initialization failed:', error);
        firebaseReady = false;
        initializeApp(); // Continue without Firebase
    });
});

async function waitForFirebase() {
    console.log('Waiting for Firebase with retry logic...');
    
    for (let attempt = 1; attempt <= 10; attempt++) {
        console.log(`Firebase check attempt ${attempt}/10`);
        
        // Check if Firebase is available
        const firebaseCheck = {
            hasFirebaseApp: typeof firebase !== 'undefined' && firebase.app,
            hasFirebaseDatabase: typeof firebase !== 'undefined' && firebase.database,
            hasFirebaseGlobal: typeof firebase !== 'undefined',
            isEnabled: typeof firebase !== 'undefined' && firebase.app && firebase.database
        };
        
        console.log('Firebase availability check:', firebaseCheck);
        
        if (firebaseCheck.hasFirebaseGlobal && typeof firebase.app === 'function') {
            console.log('Firebase found! Setting up connection monitoring...');
            
            try {
                // Set up Firebase connection monitoring
                setupFirebaseConnectionMonitoring();
                
                // Wait a bit for connection to establish
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                return true;
            } catch (error) {
                console.warn('Firebase setup failed, attempt', attempt, ':', error);
            }
        }
        
        if (attempt < 10) {
            console.log('Firebase not ready, waiting 1 second...');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log('Firebase not available, running in offline mode');
    throw new Error('Firebase not available');
}

function setupFirebaseConnectionMonitoring() {
    console.log('Setting up Firebase connection monitoring...');
    
    const connectedRef = firebase.database().ref('.info/connected');
    connectedRef.on('value', (snapshot) => {
        const connected = snapshot.val();
        console.log('Firebase connection status changed:', connected);
        updateConnectionStatus(connected);
    });
    
    // Get initial connection status
    connectedRef.once('value', (snapshot) => {
        const connected = snapshot.val();
        console.log('Initial Firebase connection status:', connected);
        updateConnectionStatus(connected);
    });
}

function initializeApp() {
    console.log('Binding event listeners...');
    bindEventListeners();
    console.log('Event listeners bound successfully');
    
    // Landing page is already active by default, no need to show it
    console.log('Landing page should be visible');
}

function showPage(pageId) {
    console.log('Showing page:', pageId);
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page - use the exact IDs that actually exist
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        console.log('Page shown successfully:', pageId);
    } else {
        console.error('Page not found:', pageId);
        // List all available pages for debugging
        const allPages = document.querySelectorAll('.page');
        console.log('Available pages:', Array.from(allPages).map(p => p.id));
    }
}

function bindEventListeners() {
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
    document.querySelectorAll('.back-btn, #backToLanding').forEach(btn => {
        btn.addEventListener('click', () => {
            showPage('landing');
        });
    });
    
    // Player count controls
    const decreaseBtn = document.getElementById('decreasePlayer');
    const increaseBtn = document.getElementById('increasePlayer');
    
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', () => {
            const input = document.getElementById('numPlayers');
            const current = parseInt(input.value);
            if (current > 1) {
                input.value = current - 1;
            }
        });
    }
    
    if (increaseBtn) {
        increaseBtn.addEventListener('click', () => {
            const input = document.getElementById('numPlayers');
            const current = parseInt(input.value);
            if (current < 12) {
                input.value = current + 1;
            }
        });
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
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    console.log('Event listeners bound successfully');
}

function handleCreateSession(e) {
    e.preventDefault();
    console.log('Create session form submitted');
    
    // Use the actual IDs and names from the live form
    const sessionNameEl = document.getElementById('sessionName');
    const playerCountEl = document.getElementById('playerCount'); // This is the correct ID
    const startingScoreEl = document.getElementById('startingScore');
    const allowDecimalsEl = document.querySelector('input[name="allowDecimals"]'); // Use name since no ID
    const targetScoreEl = document.getElementById('targetScore');
    const continueAfterTargetEl = document.querySelector('input[name="continueAfterTarget"]'); // Use name since no ID
    
    console.log('Form elements found:', {
        sessionName: !!sessionNameEl,
        playerCount: !!playerCountEl,
        startingScore: !!startingScoreEl,
        allowDecimals: !!allowDecimalsEl,
        targetScore: !!targetScoreEl,
        continueAfterTarget: !!continueAfterTargetEl
    });
    
    if (!playerCountEl) {
        console.error('playerCount element not found!');
        return;
    }
    
    const sessionName = sessionNameEl ? sessionNameEl.value || 'Game Session' : 'Game Session';
    const playerCount = playerCountEl ? parseInt(playerCountEl.value) : 2;
    const startingScore = startingScoreEl ? parseFloat(startingScoreEl.value) || 0 : 0;
    const allowDecimals = allowDecimalsEl ? allowDecimalsEl.checked : false;
    const targetScore = targetScoreEl ? parseFloat(targetScoreEl.value) || null : null;
    const continueAfterTarget = continueAfterTargetEl ? continueAfterTargetEl.checked : false;
    
    const sessionData = {
        name: sessionName,
        playerCount: playerCount,
        startingScore: startingScore,
        allowDecimals: allowDecimals,
        targetScore: targetScore,
        continueAfterTarget: continueAfterTarget
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
    const initializedPlayers = [];
    for (let i = 1; i <= sessionData.playerCount; i++) {
        initializedPlayers.push({
            id: `player${i}`,
            name: `Player ${i}`,
            score: sessionData.startingScore,
            isAssigned: false
        });
    }
    
    console.log('Initialized players:', initializedPlayers);
    
    // Create session object
    currentSession = {
        code: sessionCode,
        ...sessionData,
        players: initializedPlayers,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    };
    
    players = initializedPlayers;
    isScorekeeper = true;
    
    console.log('Current session created:', currentSession);
    
    // Show success message with session code on the create session page
    showMessage(`Session created! Code: ${sessionCode}`, 'success');
    
    // Update the form to show session created state
    const form = document.getElementById('createSessionForm');
    if (form) {
        form.innerHTML = `
            <div class="session-created">
                <h2>🎉 Session Created Successfully!</h2>
                <div class="session-code-display">
                    <label>Session Code:</label>
                    <div class="code-value">${sessionCode}</div>
                    <p>Share this code with other players so they can join</p>
                </div>
                <div class="session-details">
                    <p><strong>Session Name:</strong> ${sessionData.name}</p>
                    <p><strong>Players:</strong> ${sessionData.playerCount}</p>
                    <p><strong>Starting Score:</strong> ${sessionData.startingScore}</p>
                </div>
                <div class="session-actions">
                    <button id="startScoring" class="primary-btn">🎮 Start Scoring</button>
                    <button id="backToLandingFromSession" class="secondary-btn">← Back to Home</button>
                </div>
            </div>
        `;
        
        // Add event listeners for the new buttons
        const startScoringBtn = document.getElementById('startScoring');
        const backBtn = document.getElementById('backToLandingFromSession');
        
        if (startScoringBtn) {
            startScoringBtn.addEventListener('click', () => {
                // Generate player tiles and show scorekeeper interface
                generatePlayerTiles();
                showPage('scorekeeper');
            });
        }
        
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                showPage('landing');
            });
        }
    }
    
    // Save to Firebase if available
    if (firebaseReady) {
        console.log('Saving session to Firebase...');
        saveSessionToFirebase(currentSession)
            .then(() => {
                console.log('Session saved to Firebase successfully');
                showMessage('Session saved online!', 'success');
            })
            .catch((error) => {
                console.error('Failed to save session to Firebase:', error);
                showMessage('Session created locally (offline mode)', 'warning');
            });
    } else {
        console.log('Firebase not ready, session created locally');
        showMessage('Session created locally (offline mode)', 'warning');
    }
}

function handleJoinSession(e) {
    e.preventDefault();
    console.log('Join session form submitted');
    
    const sessionCode = document.getElementById('joinCode').value.toUpperCase();
    const playerName = document.getElementById('playerName').value || 'Player';
    
    console.log('Joining session:', sessionCode, 'as:', playerName);
    
    joinSession(sessionCode, playerName);
}

async function joinSession(sessionCode, playerName) {
    console.log('Attempting to join session:', sessionCode);
    console.log('Firebase ready status:', firebaseReady);
    
    if (!firebaseReady) {
        showMessage('Cannot join session - Firebase not connected. Please wait and try again.', 'error');
        return;
    }
    
    console.log('Firebase is ready, attempting to join session...');
    
    try {
        const sessionData = await loadSessionFromFirebase(sessionCode);
        console.log('Joined session successfully:', sessionData);
        
        currentSession = sessionData;
        players = sessionData.players;
        isScorekeeper = false;
        
        // Find or assign player
        currentPlayer = findOrAssignPlayer(playerName);
        console.log('Assigned player:', currentPlayer);
        
        showMessage('Joined session successfully!', 'success');
        
        // Update player view
        updatePlayerView();
        
        // Show player view page
        showPage('playerView');
        
        // Set up real-time listeners
        setupRealtimeListeners(sessionCode);
        
    } catch (error) {
        console.error('Failed to join session:', error);
        showMessage('Failed to join session. Please check the code and try again.', 'error');
    }
}

function findOrAssignPlayer(playerName) {
    console.log('Finding or assigning player:', playerName);
    console.log('Available players:', players);
    
    // First, check if player name already exists
    let existingPlayer = players.find(p => p.name === playerName);
    if (existingPlayer) {
        console.log('Player found with existing name:', existingPlayer);
        existingPlayer.isAssigned = true;
        return existingPlayer;
    }
    
    // Find first unassigned player slot
    let availablePlayer = players.find(p => !p.isAssigned);
    if (availablePlayer) {
        console.log('Assigned to available slot:', availablePlayer);
        availablePlayer.name = playerName;
        availablePlayer.isAssigned = true;
        
        // Update in Firebase if scorekeeper
        if (firebaseReady && currentSession) {
            updatePlayerInFirebase(availablePlayer);
        }
        
        return availablePlayer;
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
    
    // For player view, use compact tiles that show all players
    if (!isScorekeeper) {
        container.className = 'players-grid player-view-grid';
        players.forEach((player, index) => {
            const tile = createCompactPlayerTile(player, index);
            container.appendChild(tile);
        });
    } else {
        // For scorekeeper, use full-size tiles
        container.className = 'players-grid scorekeeper-grid';
        players.forEach((player, index) => {
            const tile = createPlayerTile(player, index, true);
            container.appendChild(tile);
        });
    }
    
    console.log('Player tiles generated successfully');
}

function createCompactPlayerTile(player, index) {
    console.log('Creating compact tile for player:', player.name, 'Score:', player.score);
    
    const tile = document.createElement('div');
    tile.className = 'player-tile compact-tile';
    tile.setAttribute('data-player-id', player.id);
    
    if (currentPlayer && player.id === currentPlayer.id) {
        tile.classList.add('current-player');
    }
    
    tile.innerHTML = `
        <div class="compact-player-header">
            <h4 class="compact-player-name" ${currentPlayer && player.id === currentPlayer.id ? 'contenteditable="true"' : ''}>${player.name}</h4>
            ${currentPlayer && player.id === currentPlayer.id ? '<span class="you-badge">You</span>' : ''}
        </div>
        
        <div class="compact-player-score">
            <div class="compact-score-value">${player.score || 0}</div>
        </div>
    `;
    
    // Add event listener for name editing (only for current player)
    if (currentPlayer && player.id === currentPlayer.id) {
        const nameElement = tile.querySelector('.compact-player-name');
        if (nameElement) {
            nameElement.addEventListener('blur', (e) => {
                updatePlayerName(player.id, e.target.textContent);
            });
        }
    }
    
    return tile;
}

function createPlayerTile(player, index, isEditable) {
    console.log('Creating tile for player:', player.name, 'Score:', player.score);
    
    const tile = document.createElement('div');
    tile.className = 'player-tile';
    tile.setAttribute('data-player-id', player.id);
    
    tile.innerHTML = `
        <div class="player-header">
            <h3 class="player-name" ${isEditable ? 'contenteditable="true"' : ''}>${player.name}</h3>
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
        ` : ''}
    `;
    
    // Add event listeners for editable elements
    if (isEditable) {
        const nameElement = tile.querySelector('.player-name');
        if (nameElement) {
            nameElement.addEventListener('blur', (e) => {
                updatePlayerName(player.id, e.target.textContent);
            });
        }
        
        // Add preset button listeners
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

function setupRealtimeListeners(sessionCode) {
    console.log('Setting up real-time listeners for session:', sessionCode);
    
    if (!firebaseReady) {
        console.log('Firebase not ready, skipping real-time listeners');
        return;
    }
    
    const sessionRef = firebase.database().ref(`sessions/${sessionCode}/players`);
    sessionRef.on('value', (snapshot) => {
        const updatedPlayers = snapshot.val();
        if (updatedPlayers) {
            console.log('Players updated from Firebase:', Object.values(updatedPlayers));
            players = Object.values(updatedPlayers);
            updatePlayerView();
        }
    });
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
    
    console.log('Player view updated successfully');
}

function updateSessionInfo() {
    console.log('Updating session info...');
    
    if (!currentSession) {
        console.error('No current session to update info for');
        return;
    }
    
    console.log('Session code to display:', currentSession.code);
    
    // Update session code elements
    const sessionCodeElement = document.getElementById('sessionCode');
    if (sessionCodeElement) {
        sessionCodeElement.textContent = currentSession.code;
        console.log('Updated session code:', currentSession.code);
    }
    
    // Update session name
    const sessionNameElement = document.getElementById('sessionName');
    if (sessionNameElement) {
        sessionNameElement.textContent = currentSession.name || 'Game Session';
        console.log('Updated session name:', currentSession.name);
    }
    
    console.log('Session info updated successfully');
}

// Score update functions
function updateScore(playerId, direction) {
    const customAmountInput = document.querySelector(`[data-player-id="${playerId}"] .custom-amount`);
    const amount = customAmountInput ? parseFloat(customAmountInput.value) || 1 : 1;
    
    const finalAmount = direction === 'increase' ? amount : -amount;
    updateScoreByAmount(playerId, finalAmount);
}

function updateScoreByAmount(playerId, amount) {
    console.log('Updating score by amount:', playerId, amount);
    
    const player = players.find(p => p.id === playerId);
    if (!player) {
        console.error('Player not found:', playerId);
        return;
    }
    
    const oldScore = player.score;
    const newScore = Math.max(0, (player.score || 0) + amount);
    player.score = newScore;
    
    console.log('Score change:', oldScore, '->', newScore);
    
    // Update UI
    const scoreElement = document.querySelector(`[data-player-id="${playerId}"] .score-value, [data-player-id="${playerId}"] .compact-score-value`);
    if (scoreElement) {
        scoreElement.textContent = newScore;
        scoreElement.classList.add('score-updated');
        setTimeout(() => scoreElement.classList.remove('score-updated'), 300);
    }
    
    // Update in Firebase
    if (firebaseReady && currentSession) {
        updatePlayerInFirebase(player)
            .then(() => {
                console.log('Player score updated in Firebase');
            })
            .catch((error) => {
                console.error('Failed to update player score in Firebase:', error);
            });
    }
}

function updatePlayerName(playerId, newName) {
    const player = players.find(p => p.id === playerId);
    if (player && newName.trim()) {
        player.name = newName.trim();
        
        // Update in Firebase
        if (firebaseReady && currentSession) {
            updatePlayerInFirebase(player);
        }
    }
}

// Firebase functions
async function saveSessionToFirebase(session) {
    if (!firebaseReady) {
        throw new Error('Firebase not ready');
    }
    
    const sessionRef = firebase.database().ref(`sessions/${session.code}`);
    await sessionRef.set(session);
}

async function loadSessionFromFirebase(sessionCode) {
    if (!firebaseReady) {
        throw new Error('Firebase not ready');
    }
    
    const sessionRef = firebase.database().ref(`sessions/${sessionCode}`);
    const snapshot = await sessionRef.once('value');
    const sessionData = snapshot.val();
    
    if (!sessionData) {
        throw new Error('Session not found');
    }
    
    return sessionData;
}

async function updatePlayerInFirebase(player) {
    if (!firebaseReady || !currentSession) {
        return;
    }
    
    const playerRef = firebase.database().ref(`sessions/${currentSession.code}/players/${player.id}`);
    await playerRef.set(player);
}

// Utility functions
function generateSessionCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update theme icon
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }
}

function updateConnectionStatus(isOnline) {
    console.log('Updating connection status:', isOnline);
    
    const statusDots = document.querySelectorAll('#connectionDot, #connectionDot2');
    const statusTexts = document.querySelectorAll('#connectionText, #connectionText2');
    
    statusDots.forEach(dot => {
        if (dot) {
            dot.className = `status-dot ${isOnline ? 'online' : 'offline'}`;
        }
    });
    
    statusTexts.forEach(text => {
        if (text) {
            text.textContent = isOnline ? 'Online' : 'Offline';
        }
    });
}

function showMessage(text, type = 'info') {
    console.log('Showing message:', text, type);
    
    // Remove existing messages
    document.querySelectorAll('.message').forEach(msg => msg.remove());
    
    const message = document.createElement('div');
    message.className = `message message-${type}`;
    message.innerHTML = `
        <span>${text}</span>
        <button class="message-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(message);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (message.parentElement) {
            message.remove();
        }
    }, 5000);
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
});

