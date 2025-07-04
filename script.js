// GameScore Pro - Enhanced with Teams, Colors, Spectator Mode, and Dark Mode

// Current session data
let currentSession = null;
let currentPlayerId = null; // ID of the current player (for "You" badge)
let currentPlayerName = "Guest"; // Name of the current player
let currentPlayerTileColor = '#007bff'; // Default tile color
let isSpectator = false; // Track if current user is a spectator

// Constants for page IDs
const PAGE_IDS = {
    LANDING: 'landing',
    CREATE_SESSION: 'createSession',
    JOIN_SESSION: 'joinSession',
    SESSION_SUCCESS: 'sessionSuccess',
    SCOREKEEPER: 'scorekeeper',
    PLAYER_VIEW: 'playerView',
    SPECTATOR_VIEW: 'spectatorView',
    TEAM_SETUP: 'teamSetup'
};

// Color palette for players and teams
const COLOR_PALETTE = [
    '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1',
    '#fd7e14', '#20c997', '#e83e8c', '#6c757d', '#343a40', '#f8f9fa'
];

console.log('GameScore Pro starting...');

// Utility functions
function showPage(pageId) {
    // Hide all pages first
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
    });
    
    // Show the requested page
    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.style.display = 'block';
        activePage.classList.add('active');
        console.log(`Page shown successfully: ${pageId}`);
    } else {
        console.error(`Page not found: ${pageId}`);
        console.log('Available pages:', Array.from(document.querySelectorAll('.page')).map(p => p.id));
    }
}

function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('messageContainer');
    if (messageContainer) {
        messageContainer.textContent = message;
        messageContainer.className = `message ${type}`;
        messageContainer.style.display = 'block';
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 5000);
    }
}

function generateSessionCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function getRandomColor() {
    return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
}

function updateConnectionStatus(isConnected) {
    window.firebaseConnectionStatus = isConnected;
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        if (window.firebaseInitialized) {
            statusElement.textContent = isConnected ? 'Online' : 'Offline';
            statusElement.className = isConnected ? 'connection-status status-online' : 'connection-status status-offline';
        } else {
            statusElement.textContent = 'Local Mode';
            statusElement.className = 'connection-status status-local';
        }
    }
    console.log(`Connection status updated: ${window.firebaseInitialized ? (isConnected ? 'Online' : 'Offline') : 'Local Mode'}`);
}

// Firebase Initialization and Connection Monitoring
async function initializeFirebaseWithRetry(retries = 3, delay = 1000) {
    console.log('Checking Firebase availability...');
    
    // Check if Firebase is loaded and configured
    if (typeof firebase === 'undefined') {
        console.log('Firebase SDK not available, running in local mode');
        window.firebaseInitialized = false;
        updateConnectionStatus(false);
        return;
    }

    // Check if firebase-config.js has been loaded and configured
    if (typeof firebaseConfig === 'undefined' || 
        firebaseConfig.apiKey === "your-api-key-here" || 
        firebaseConfig.databaseURL.includes("your-project-id")) {
        console.log('Firebase not configured with real credentials, running in local mode');
        window.firebaseInitialized = false;
        updateConnectionStatus(false);
        return;
    }

    // Try to initialize Firebase
    for (let i = 1; i <= retries; i++) {
        console.log(`Firebase initialization attempt ${i}/${retries}`);
        try {
            if (!window.firebaseInitialized) {
                firebase.initializeApp(firebaseConfig);
                window.db = firebase.database();
                window.firebaseInitialized = true;
                setupFirebaseConnectionMonitoring();
                console.log('Firebase initialized successfully!');
                return;
            }
        } catch (error) {
            console.log(`Firebase initialization attempt ${i} failed:`, error.message);
            if (i === retries) {
                console.log('All Firebase initialization attempts failed, running in local mode');
                window.firebaseInitialized = false;
                updateConnectionStatus(false);
            } else {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
}

function setupFirebaseConnectionMonitoring() {
    if (!window.firebaseInitialized || !window.db) return;
    
    console.log('Setting up Firebase connection monitoring...');
    try {
        const connectedRef = window.db.ref('.info/connected');
        connectedRef.on('value', snap => {
            const isConnected = snap.val();
            console.log('Firebase connection status changed:', isConnected);
            updateConnectionStatus(isConnected);
        });
    } catch (error) {
        console.log('Connection monitoring setup failed:', error.message);
        updateConnectionStatus(false);
    }
}

// UI Update Functions
function updateScorekeeperInterface() {
    if (!currentSession) return;

    // Update session info in header
    const sessionNameElement = document.getElementById('scorekeeperSessionName');
    const sessionCodeElement = document.getElementById('scorekeeperSessionCode');
    
    if (sessionNameElement) {
        sessionNameElement.textContent = currentSession.name || 'Game Session';
    }
    if (sessionCodeElement) {
        sessionCodeElement.textContent = currentSession.code || '------';
    }

    // Update players grid
    const playersContainer = document.getElementById('playersContainer');
    if (!playersContainer) return;

    playersContainer.innerHTML = '';

    currentSession.players.forEach(player => {
        const playerTile = document.createElement('div');
        playerTile.className = 'player-tile';
        playerTile.id = `player-${player.id}`;
        
        if (player.id === currentPlayerId) {
            playerTile.classList.add('current-player');
        }

        playerTile.innerHTML = `
            <div class="player-name">
                ${player.name}
                ${player.id === currentPlayerId ? '<span class="player-badge">You</span>' : ''}
            </div>
            <div class="player-score" style="color: ${player.color}">${player.score}</div>
            ${currentSession.isHost ? `
                <div class="score-controls">
                    <button class="score-btn negative" onclick="updateScore('${player.id}', -10)">-10</button>
                    <button class="score-btn negative" onclick="updateScore('${player.id}', -5)">-5</button>
                    <button class="score-btn negative" onclick="updateScore('${player.id}', -1)">-1</button>
                    <button class="score-btn" onclick="showCustomScoreInput('${player.id}')">1</button>
                    <button class="score-btn positive" onclick="updateScore('${player.id}', 1)">+</button>
                    <button class="score-btn positive" onclick="updateScore('${player.id}', 5)">+5</button>
                    <button class="score-btn positive" onclick="updateScore('${player.id}', 10)">+10</button>
                </div>
                <div class="color-picker">
                    ${COLOR_PALETTE.map(color => `
                        <div class="color-option ${player.color === color ? 'selected' : ''}" 
                             style="background-color: ${color}"
                             onclick="updatePlayerColor('${player.id}', '${color}')"></div>
                    `).join('')}
                </div>
            ` : ''}
        `;

        playersContainer.appendChild(playerTile);
    });
}

// Session Management
function showSessionSuccessScreen(sessionCode, sessionName) {
    const sessionCodeDisplay = document.getElementById('displaySessionCode');
    const sessionNameDisplay = document.getElementById('displaySessionName');
    const copyCodeButton = document.getElementById('copySessionCode');
    const startScoringButton = document.getElementById('startScoringButton');
    const setupTeamsButton = document.getElementById('setupTeamsButton');

    if (sessionCodeDisplay) sessionCodeDisplay.textContent = sessionCode;
    if (sessionNameDisplay) sessionNameDisplay.textContent = sessionName;

    if (copyCodeButton) {
        copyCodeButton.onclick = () => {
            navigator.clipboard.writeText(sessionCode).then(() => {
                showMessage('Session code copied!', 'success');
            }).catch(err => {
                console.error('Could not copy text: ', err);
                showMessage('Failed to copy code.', 'error');
            });
        };
    }

    if (startScoringButton) {
        startScoringButton.onclick = () => {
            console.log('Start scoring button clicked');
            console.log('Current session:', currentSession);
            console.log('updateScorekeeperInterface function:', typeof updateScorekeeperInterface);
            if (currentSession.isHost) {
                showPage('scorekeeper');
                if (typeof updateScorekeeperInterface === 'function') {
                    updateScorekeeperInterface();
                } else {
                    console.error('updateScorekeeperInterface is not a function');
                }
            } else {
                showMessage('Only the host can start scoring.', 'error');
            }
        };
    }

    if (setupTeamsButton) {
        setupTeamsButton.onclick = () => {
            if (currentSession.isHost) {
                showPage(PAGE_IDS.TEAM_SETUP);
                renderTeamSetup();
            } else {
                showMessage('Only the host can set up teams.', 'error');
            }
        };
    }

    showPage(PAGE_IDS.SESSION_SUCCESS);
}

async function handleCreateSession(event) {
    event.preventDefault();
    const createButton = document.getElementById('createSessionButton');
    if (createButton) {
        createButton.disabled = true;
        createButton.textContent = 'Creating...';
    }

    const sessionNameInput = document.getElementById('sessionName');
    const playerCountInput = document.getElementById('playerCount');
    const startingScoreInput = document.getElementById('startingScore');
    const targetScoreInput = document.getElementById('targetScore');
    const allowDecimalsCheckbox = document.getElementById('allowDecimals');
    const playAfterTargetCheckbox = document.getElementById('playAfterTarget');

    const sessionName = sessionNameInput ? sessionNameInput.value.trim() : 'New Session';
    const playerCount = playerCountInput ? parseInt(playerCountInput.value) : 2;
    const startingScore = startingScoreInput ? parseFloat(startingScoreInput.value) : 0;
    const targetScore = targetScoreInput ? parseFloat(targetScoreInput.value) : 500;
    const allowDecimals = allowDecimalsCheckbox ? allowDecimalsCheckbox.checked : false;
    const playAfterTarget = playAfterTargetCheckbox ? playAfterTargetCheckbox.checked : false;

    if (!sessionName || playerCount < 1) {
        showMessage('Please enter a session name and valid player count.', 'error');
        if (createButton) {
            createButton.disabled = false;
            createButton.textContent = 'Create Session';
        }
        return;
    }

    const sessionCode = generateSessionCode();
    const players = Array.from({length: playerCount}, (_, i) => ({
        id: `player${i + 1}`,
        name: `Player ${i + 1}`,
        score: startingScore,
        color: COLOR_PALETTE[i % COLOR_PALETTE.length],
        history: [{score: startingScore, timestamp: Date.now()}],
        status: 'waiting'
    }));

    currentSession = {
        code: sessionCode,
        name: sessionName,
        playerCount: playerCount,
        startingScore: startingScore,
        allowDecimals: allowDecimals,
        targetScore: targetScore,
        playAfterTarget: playAfterTarget,
        players: players,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        hostId: 'host-' + Date.now(),
        isHost: true,
        teams: {},
        spectators: [] // Track spectators
    };

    console.log('Creating session...');
    console.log('Generated session code:', sessionCode);

    if (window.firebaseInitialized && window.firebaseConnectionStatus) {
        await saveSessionToFirebase(sessionCode, currentSession);
        showMessage('Session created and saved online!', 'success');
    } else {
        // Save to localStorage for local mode
        const localSessionKey = `gameScore_session_${sessionCode}`;
        localStorage.setItem(localSessionKey, JSON.stringify(currentSession));
        showMessage('Session created locally (offline mode)', 'warning');
    }

    currentPlayerId = currentSession.players[0].id;
    currentPlayerName = currentSession.players[0].name;
    currentPlayerTileColor = currentSession.players[0].color;
    isSpectator = false;

    showSessionSuccessScreen(sessionCode, sessionName);

    if (createButton) {
        createButton.disabled = false;
        createButton.textContent = 'Create Session';
    }
}

async function saveSessionToFirebase(sessionCode, sessionData) {
    if (!window.firebaseInitialized || !window.db) {
        console.log('Firebase not available, skipping save');
        return;
    }
    
    try {
        await window.db.ref(`sessions/${sessionCode}`).set(sessionData);
        console.log('Session saved to Firebase successfully');
    } catch (error) {
        console.error('Error saving session to Firebase:', error);
        showMessage('Failed to save session online, but local session is ready', 'warning');
    }
}

async function joinSession(sessionCode, playerName, playerColor, asSpectator = false) {
    if (!sessionCode || (!playerName && !asSpectator)) {
        showMessage('Please enter session code and your name.', 'error');
        return;
    }

    sessionCode = sessionCode.toUpperCase();

    if (!window.firebaseInitialized || !window.firebaseConnectionStatus) {
        showMessage('⚠️ Local Mode Limitation: You can only join sessions created on this same device. For multi-device sessions, Firebase configuration is required.', 'warning');
        
        // Check if there's a local session with this code
        const localSessionKey = `gameScore_session_${sessionCode}`;
        const localSession = localStorage.getItem(localSessionKey);
        
        if (localSession) {
            try {
                currentSession = JSON.parse(localSession);
                currentSession.isHost = false;
                
                if (asSpectator) {
                    // Join as spectator
                    isSpectator = true;
                    currentPlayerId = null;
                    currentPlayerName = playerName || 'Spectator';
                    
                    // Add to spectators list
                    if (!currentSession.spectators) currentSession.spectators = [];
                    const spectatorId = 'spectator-' + Date.now();
                    currentSession.spectators.push({
                        id: spectatorId,
                        name: currentPlayerName,
                        joinedAt: Date.now()
                    });
                    
                    // Save updated session
                    localStorage.setItem(localSessionKey, JSON.stringify(currentSession));
                    
                    showMessage(`Joined as spectator: ${currentPlayerName}`, 'success');
                    showPage('spectatorView');
                    updateSpectatorView();
                } else {
                    // Join as player - find empty slot
                    const emptyPlayerIndex = currentSession.players.findIndex(p => !p.name || p.name.startsWith('Player '));
                    
                    if (emptyPlayerIndex !== -1) {
                        currentSession.players[emptyPlayerIndex].name = playerName;
                        currentSession.players[emptyPlayerIndex].color = playerColor;
                        currentPlayerId = currentSession.players[emptyPlayerIndex].id;
                        currentPlayerName = playerName;
                        currentPlayerTileColor = playerColor;
                        
                        // Save updated session
                        localStorage.setItem(localSessionKey, JSON.stringify(currentSession));
                        
                        showMessage(`Joined as player: ${playerName}`, 'success');
                        showPage('playerView');
                        updatePlayerView();
                    } else {
                        showMessage('Session is full. All player slots are taken.', 'error');
                    }
                }
            } catch (error) {
                console.error('Error parsing local session:', error);
                showMessage('Invalid session data found locally.', 'error');
            }
        } else {
            showMessage('Session not found on this device. In Local Mode, you can only join sessions created on the same device.', 'error');
        }
        return;
    }

    try {
        const snapshot = await window.db.ref(`sessions/${sessionCode}`).once('value');
        if (snapshot.exists()) {
            const sessionData = snapshot.val();
            currentSession = {...sessionData, isHost: false};

            if (asSpectator) {
                // Join as spectator
                isSpectator = true;
                currentPlayerId = null;
                currentPlayerName = playerName || 'Spectator';
                
                // Add to spectators list
                if (!currentSession.spectators) currentSession.spectators = [];
                const spectatorId = 'spectator-' + Date.now();
                currentSession.spectators.push({
                    id: spectatorId,
                    name: currentPlayerName,
                    joinedAt: Date.now()
                });

                // Update Firebase with new spectator
                await db.ref(`sessions/${sessionCode}/spectators`).set(currentSession.spectators);

                setupRealtimeListeners(sessionCode);
                showMessage(`Joined as spectator in session ${sessionCode}!`, 'success');
                showPage(PAGE_IDS.SPECTATOR_VIEW);
                updateSpectatorView();
            } else {
                // Join as player
                isSpectator = false;
                let assignedPlayer = currentSession.players.find(p => p.status !== 'joined' && p.name.startsWith('Player '));
                
                if (assignedPlayer) {
                    assignedPlayer.name = playerName;
                    assignedPlayer.color = playerColor;
                    assignedPlayer.status = 'joined';
                    
                    currentPlayerId = assignedPlayer.id;
                    currentPlayerName = assignedPlayer.name;
                    currentPlayerTileColor = assignedPlayer.color;

                    await db.ref(`sessions/${sessionCode}`).update({
                        players: currentSession.players,
                        lastUpdated: Date.now()
                    });

                    setupRealtimeListeners(sessionCode);
                    showMessage(`Joined session ${sessionCode} as ${playerName}!`, 'success');
                    showPage(PAGE_IDS.PLAYER_VIEW);
                    updatePlayerView();
                } else {
                    showMessage('Session is full. You can join as a spectator instead.', 'error');
                }
            }
        } else {
            showMessage('Session not found. Please check the code.', 'error');
        }
    } catch (error) {
        console.error('Error joining session:', error);
        showMessage('Error joining session. Please try again.', 'error');
    }
}

function leaveSession() {
    if (currentSession && currentSession.code) {
        if (currentSession.isHost) {
            if (window.firebaseInitialized && window.firebaseConnectionStatus) {
                window.db.ref(`sessions/${currentSession.code}`).remove()
                    .then(() => {
                        console.log('Session deleted from Firebase.');
                        showMessage('Session ended and deleted.', 'info');
                    })
                    .catch(error => {
                        console.error('Error deleting session:', error);
                        showMessage('Error deleting session.', 'error');
                    });
            } else {
                // Local mode - remove from localStorage
                const localSessionKey = `gameScore_session_${currentSession.code}`;
                localStorage.removeItem(localSessionKey);
                showMessage('Session ended (local mode).', 'info');
            }
        } else if (isSpectator) {
            // Remove from spectators list
            if (window.firebaseInitialized && window.firebaseConnectionStatus && currentSession.spectators) {
                const updatedSpectators = currentSession.spectators.filter(s => s.name !== currentPlayerName);
                window.db.ref(`sessions/${currentSession.code}/spectators`).set(updatedSpectators);
            } else {
                // Local mode - update localStorage
                if (currentSession.spectators) {
                    currentSession.spectators = currentSession.spectators.filter(s => s.name !== currentPlayerName);
                    const localSessionKey = `gameScore_session_${currentSession.code}`;
                    localStorage.setItem(localSessionKey, JSON.stringify(currentSession));
                }
            }
            showMessage('You have left the session.', 'info');
        } else {
            // Player leaves
            if (window.firebaseInitialized && window.firebaseConnectionStatus && currentPlayerId) {
                const playerRef = window.db.ref(`sessions/${currentSession.code}/players`);
                playerRef.once('value', snapshot => {
                    const players = snapshot.val();
                    const playerIndex = players.findIndex(p => p.id === currentPlayerId);
                    if (playerIndex !== -1) {
                        players[playerIndex].status = 'left';
                        playerRef.set(players);
                    }
                });
            } else {
                // Local mode - update localStorage
                if (currentPlayerId) {
                    const playerIndex = currentSession.players.findIndex(p => p.id === currentPlayerId);
                    if (playerIndex !== -1) {
                        currentSession.players[playerIndex].status = 'left';
                        const localSessionKey = `gameScore_session_${currentSession.code}`;
                        localStorage.setItem(localSessionKey, JSON.stringify(currentSession));
                    }
                }
            }
    }
    
    // Reset session variables
    const sessionCode = currentSession?.code;
    currentSession = null;
    currentPlayerId = null;
    currentPlayerName = "Guest";
    currentPlayerTileColor = '#007bff';
    isSpectator = false;
    
    // Clean up Firebase listeners if they exist
    if (window.db && sessionCode) {
        window.db.ref(`sessions/${sessionCode}`).off();
    }
    
    showPage(PAGE_IDS.LANDING);
}

// Real-time Updates
function setupRealtimeListeners(sessionCode) {
    if (!firebaseInitialized || !firebaseConnectionStatus) return;

    const sessionRef = db.ref(`sessions/${sessionCode}`);
    sessionRef.on('value', snapshot => {
        const updatedSession = snapshot.val();
        if (updatedSession) {
            currentSession = {...updatedSession, isHost: currentSession ? currentSession.isHost : false};
            console.log('Session data updated in real-time:', currentSession);

            // Update appropriate view
            if (isSpectator) {
                updateSpectatorView();
            } else if (document.getElementById(PAGE_IDS.SCOREKEEPER).style.display === 'block') {
                updateScorekeeperInterface();
            } else if (document.getElementById(PAGE_IDS.PLAYER_VIEW).style.display === 'block') {
                updatePlayerView();
            } else if (document.getElementById(PAGE_IDS.TEAM_SETUP).style.display === 'block') {
                renderTeamSetup();
            }

            checkWinCondition();
        } else {
            showMessage('The host has ended the session.', 'info');
            leaveSession();
        }
    });
}

// Score Management Functions - Interface Updates
function updateScorekeeperInterfacePlayers() {
    const scorekeeperPlayersContainer = document.getElementById('scorekeeperPlayers');
    if (!scorekeeperPlayersContainer) return;

    scorekeeperPlayersContainer.innerHTML = '';

    currentSession.players.forEach(player => {
        const playerTile = document.createElement('div');
        playerTile.className = 'player-tile';
        playerTile.style.borderLeft = `4px solid ${player.color}`;

        // Player Name
        const playerNameElement = document.createElement('div');
        playerNameElement.className = 'player-name';
        playerNameElement.textContent = player.name;
        if (player.id === currentPlayerId) {
            playerNameElement.textContent += ' (You)';
        }
        playerTile.appendChild(playerNameElement);

        // Player Score
        const playerScoreElement = document.createElement('div');
        playerScoreElement.className = 'player-score';
        playerScoreElement.textContent = player.score.toFixed(currentSession.allowDecimals ? 1 : 0);
        playerTile.appendChild(playerScoreElement);

        // Score Controls
        const scoreControls = document.createElement('div');
        scoreControls.className = 'score-controls';

        const createButton = (text, amount) => {
            const button = document.createElement('button');
            button.className = 'score-btn';
            button.textContent = text;
            button.onclick = () => updateScore(player.id, amount);
            return button;
        };

        scoreControls.appendChild(createButton('-10', -10));
        scoreControls.appendChild(createButton('-5', -5));
        scoreControls.appendChild(createButton('-1', -1));

        const customAmountInput = document.createElement('input');
        customAmountInput.type = 'number';
        customAmountInput.placeholder = 'Custom';
        customAmountInput.className = 'custom-amount-input';
        customAmountInput.step = currentSession.allowDecimals ? '0.1' : '1';
        scoreControls.appendChild(customAmountInput);

        const customAddButton = document.createElement('button');
        customAddButton.textContent = '+';
        customAddButton.onclick = () => {
            const amount = parseFloat(customAmountInput.value);
            if (!isNaN(amount)) updateScore(player.id, amount);
            customAmountInput.value = '';
        };
        scoreControls.appendChild(customAddButton);

        const customSubtractButton = document.createElement('button');
        customSubtractButton.textContent = '-';
        customSubtractButton.onclick = () => {
            const amount = parseFloat(customAmountInput.value);
            if (!isNaN(amount)) updateScore(player.id, -amount);
            customAmountInput.value = '';
        };
        scoreControls.appendChild(customSubtractButton);

        scoreControls.appendChild(createButton('+1', 1));
        scoreControls.appendChild(createButton('+5', 5));
        scoreControls.appendChild(createButton('+10', 10));

        playerTile.appendChild(scoreControls);

        // Reset Score Button
        const resetScoreButton = document.createElement('button');
        resetScoreButton.textContent = 'Reset Score';
        resetScoreButton.className = 'reset-score-button';
        resetScoreButton.onclick = () => resetPlayerScore(player.id);
        playerTile.appendChild(resetScoreButton);

        scorekeeperPlayersContainer.appendChild(playerTile);
    });

    // Display Team Scores
    displayTeamScores('scorekeeperTeamScores');
    
    // Display Spectator Count
    displaySpectatorInfo('scorekeeperSpectatorInfo');
}

function updatePlayerView() {
    if (!currentSession || isSpectator) return;

    const playerViewPlayersContainer = document.getElementById('playerViewPlayers');
    if (!playerViewPlayersContainer) return;

    playerViewPlayersContainer.innerHTML = '';

    const sortedPlayers = [...currentSession.players].sort((a, b) => {
        if (a.id === currentPlayerId) return -1;
        if (b.id === currentPlayerId) return 1;
        return 0;
    });

    // Update session info
    const playerViewSessionCode = document.getElementById('playerViewSessionCode');
    const playerViewSessionName = document.getElementById('playerViewSessionName');
    if (playerViewSessionCode) playerViewSessionCode.textContent = currentSession.code;
    if (playerViewSessionName) playerViewSessionName.textContent = currentSession.name;

    sortedPlayers.forEach(player => {
        const playerTile = document.createElement('div');
        playerTile.className = 'player-tile compact';
        playerTile.style.backgroundColor = player.color;

        let playerNameText = player.name;
        if (player.id === currentPlayerId) {
            playerNameText += ' (You)';
            playerTile.classList.add('current-player');
            
            // Add color picker for current player
            const colorPicker = document.createElement('input');
            colorPicker.type = 'color';
            colorPicker.value = player.color;
            colorPicker.className = 'color-picker-small';
            colorPicker.onchange = (e) => updatePlayerColor(player.id, e.target.value);
            playerTile.appendChild(colorPicker);
        } else if (player.status !== 'joined') {
            playerNameText += ' (Waiting)';
            playerTile.classList.add('waiting-player');
        }

        const playerNameElement = document.createElement('h4');
        playerNameElement.className = 'player-name';
        playerNameElement.textContent = playerNameText;
        if (player.id === currentPlayerId) {
            playerNameElement.onclick = () => editPlayerName(player.id, player.name);
        }
        playerTile.appendChild(playerNameElement);

        const playerScoreElement = document.createElement('div');
        playerScoreElement.className = 'player-score';
        playerScoreElement.textContent = player.score.toFixed(currentSession.allowDecimals ? 1 : 0);
        playerTile.appendChild(playerScoreElement);

        // Team Badge
        const teamId = Object.keys(currentSession.teams || {}).find(tId =>
            currentSession.teams[tId].players.includes(player.id)
        );
        if (teamId) {
            const team = currentSession.teams[teamId];
            const teamBadge = document.createElement('span');
            teamBadge.className = 'team-badge';
            teamBadge.style.backgroundColor = team.color || '#ccc';
            teamBadge.textContent = team.name;
            playerTile.appendChild(teamBadge);
        }

        playerViewPlayersContainer.appendChild(playerTile);
    });

    displayTeamScores('playerViewTeamScores');
    displaySpectatorInfo('playerViewSpectatorInfo');
}

function updateSpectatorView() {
    if (!currentSession || !isSpectator) return;

    const spectatorViewPlayersContainer = document.getElementById('spectatorViewPlayers');
    if (!spectatorViewPlayersContainer) return;

    spectatorViewPlayersContainer.innerHTML = '';

    // Update session info
    const spectatorViewSessionCode = document.getElementById('spectatorViewSessionCode');
    const spectatorViewSessionName = document.getElementById('spectatorViewSessionName');
    if (spectatorViewSessionCode) spectatorViewSessionCode.textContent = currentSession.code;
    if (spectatorViewSessionName) spectatorViewSessionName.textContent = currentSession.name;

    // Sort players by score (highest first)
    const sortedPlayers = [...currentSession.players].sort((a, b) => b.score - a.score);

    sortedPlayers.forEach((player, index) => {
        const playerTile = document.createElement('div');
        playerTile.className = 'player-tile compact spectator';
        playerTile.style.backgroundColor = player.color;

        // Ranking badge
        const rankBadge = document.createElement('span');
        rankBadge.className = 'rank-badge';
        rankBadge.textContent = `#${index + 1}`;
        playerTile.appendChild(rankBadge);

        let playerNameText = player.name;
        if (player.status !== 'joined') {
            playerNameText += ' (Waiting)';
            playerTile.classList.add('waiting-player');
        }

        const playerNameElement = document.createElement('h4');
        playerNameElement.className = 'player-name';
        playerNameElement.textContent = playerNameText;
        playerTile.appendChild(playerNameElement);

        const playerScoreElement = document.createElement('div');
        playerScoreElement.className = 'player-score';
        playerScoreElement.textContent = player.score.toFixed(currentSession.allowDecimals ? 1 : 0);
        playerTile.appendChild(playerScoreElement);

        // Team Badge
        const teamId = Object.keys(currentSession.teams || {}).find(tId =>
            currentSession.teams[tId].players.includes(player.id)
        );
        if (teamId) {
            const team = currentSession.teams[teamId];
            const teamBadge = document.createElement('span');
            teamBadge.className = 'team-badge';
            teamBadge.style.backgroundColor = team.color || '#ccc';
            teamBadge.textContent = team.name;
            playerTile.appendChild(teamBadge);
        }

        spectatorViewPlayersContainer.appendChild(playerTile);
    });

    displayTeamScores('spectatorViewTeamScores');
    displaySpectatorInfo('spectatorViewSpectatorInfo');
}

function displayTeamScores(containerId) {
    const teamScoresContainer = document.getElementById(containerId);
    if (!teamScoresContainer) return;

    teamScoresContainer.innerHTML = '';
    const teams = currentSession.teams || {};
    const teamNames = Object.keys(teams);

    if (teamNames.length > 0) {
        const teamHeader = document.createElement('h3');
        teamHeader.textContent = 'Team Scores';
        teamScoresContainer.appendChild(teamHeader);

        teamNames.forEach(teamId => {
            const team = teams[teamId];
            const teamScore = calculateTeamScore(team.players);
            const teamDiv = document.createElement('div');
            teamDiv.className = 'team-score-display';
            teamDiv.style.backgroundColor = team.color || '#ccc';
            teamDiv.innerHTML = `
                <h4>${team.name}</h4>
                <p>${teamScore.toFixed(currentSession.allowDecimals ? 1 : 0)}</p>
            `;
            teamScoresContainer.appendChild(teamDiv);
        });
    }
}

function displaySpectatorInfo(containerId) {
    const spectatorInfoContainer = document.getElementById(containerId);
    if (!spectatorInfoContainer) return;

    spectatorInfoContainer.innerHTML = '';
    const spectators = currentSession.spectators || [];

    if (spectators.length > 0) {
        const spectatorHeader = document.createElement('h4');
        spectatorHeader.textContent = `Spectators (${spectators.length})`;
        spectatorInfoContainer.appendChild(spectatorHeader);

        const spectatorList = document.createElement('div');
        spectatorList.className = 'spectator-list';
        spectators.forEach(spectator => {
            const spectatorItem = document.createElement('span');
            spectatorItem.className = 'spectator-item';
            spectatorItem.textContent = spectator.name;
            spectatorList.appendChild(spectatorItem);
        });
        spectatorInfoContainer.appendChild(spectatorList);
    }
}

// Score Logic - Make globally accessible
async function updateScore(playerId, amount) {
    if (!currentSession || !currentSession.isHost) return;

    const playerIndex = currentSession.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    let newScore = currentSession.players[playerIndex].score + amount;
    if (!currentSession.allowDecimals) {
        newScore = Math.round(newScore);
    }

    currentSession.players[playerIndex].score = newScore;
    currentSession.players[playerIndex].history.push({
        score: newScore,
        change: amount,
        timestamp: Date.now()
    });
    currentSession.lastUpdated = Date.now();

    console.log(`Player ${playerId} score changed by ${amount} to ${newScore}`);

    // Save to localStorage for local mode
    if (currentSession.code) {
        const localSessionKey = `gameScore_session_${currentSession.code}`;
        localStorage.setItem(localSessionKey, JSON.stringify(currentSession));
    }

    if (window.firebaseInitialized && window.firebaseConnectionStatus) {
        try {
            await window.db.ref(`sessions/${currentSession.code}`).update({
                players: currentSession.players,
                lastUpdated: currentSession.lastUpdated
            });
        } catch (error) {
            console.error('Error updating score in Firebase:', error);
            showMessage('Error updating score. Check connection.', 'error');
        }
    } else {
        updateScorekeeperInterface();
    }
}

// Make updateScore globally accessible
window.updateScore = updateScore;

async function updatePlayerColor(playerId, newColor) {
    if (!currentSession) return;

    const playerIndex = currentSession.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    // Only allow host or the player themselves to change color
    if (!currentSession.isHost && playerId !== currentPlayerId) {
        showMessage('You can only change your own tile color.', 'error');
        return;
    }

    currentSession.players[playerIndex].color = newColor;
    currentSession.lastUpdated = Date.now();

    if (playerId === currentPlayerId) {
        currentPlayerTileColor = newColor;
    }

    // Save to localStorage for local mode
    if (currentSession.code) {
        const localSessionKey = `gameScore_session_${currentSession.code}`;
        localStorage.setItem(localSessionKey, JSON.stringify(currentSession));
    }

    if (window.firebaseInitialized && window.firebaseConnectionStatus) {
        try {
            await window.db.ref(`sessions/${currentSession.code}`).update({
                players: currentSession.players,
                lastUpdated: currentSession.lastUpdated
            });
        } catch (error) {
            console.error('Error updating color in Firebase:', error);
            showMessage('Error updating color. Check connection.', 'error');
        }
    } else {
        if (currentSession.isHost) {
            updateScorekeeperInterface();
        } else {
            updatePlayerView();
        }
    }
}

// Make updatePlayerColor globally accessible
window.updatePlayerColor = updatePlayerColor;

async function resetPlayerScore(playerId) {
    if (!currentSession || !currentSession.isHost) return;

    const playerIndex = currentSession.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    const confirmReset = confirm(`Are you sure you want to reset ${currentSession.players[playerIndex].name}'s score to ${currentSession.startingScore}?`);
    if (!confirmReset) return;

    currentSession.players[playerIndex].score = currentSession.startingScore;
    currentSession.players[playerIndex].history.push({
        score: currentSession.startingScore,
        change: 'reset',
        timestamp: Date.now()
    });
    currentSession.lastUpdated = Date.now();

    if (firebaseInitialized && firebaseConnectionStatus) {
        try {
            await db.ref(`sessions/${currentSession.code}`).update({
                players: currentSession.players,
                lastUpdated: currentSession.lastUpdated
            });
            showMessage(`${currentSession.players[playerIndex].name}'s score reset!`, 'success');
        } catch (error) {
            console.error('Error resetting score in Firebase:', error);
            showMessage('Error resetting score. Check connection.', 'error');
        }
    } else {
        updateScorekeeperInterface();
    }
}

function showCustomScoreInput(playerId) {
    const customAmount = prompt('Enter custom score amount (positive or negative):');
    if (customAmount !== null && customAmount.trim() !== '') {
        const amount = parseFloat(customAmount);
        if (!isNaN(amount)) {
            updateScore(playerId, amount);
        } else {
            showMessage('Please enter a valid number.', 'error');
        }
    }
}

// Make showCustomScoreInput globally accessible
window.showCustomScoreInput = showCustomScoreInput;

async function editPlayerName(playerId, currentName) {
    if (!currentSession) return;

    let newName = prompt(`Enter new name for ${currentName}:`, currentName);
    if (newName === null || newName.trim() === '') return;
    newName = newName.trim();

    const playerIndex = currentSession.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    if (currentSession.isHost || playerId === currentPlayerId) {
        currentSession.players[playerIndex].name = newName;
        currentSession.lastUpdated = Date.now();

        if (playerId === currentPlayerId) {
            currentPlayerName = newName;
        }

        if (firebaseInitialized && firebaseConnectionStatus) {
            try {
                await db.ref(`sessions/${currentSession.code}`).update({
                    players: currentSession.players,
                    lastUpdated: currentSession.lastUpdated
                });
                showMessage(`Name updated to ${newName}!`, 'success');
            } catch (error) {
                console.error('Error updating name in Firebase:', error);
                showMessage('Error updating name. Check connection.', 'error');
            }
        } else {
            if (currentSession.isHost) {
                updateScorekeeperInterface();
            } else {
                updatePlayerView();
            }
        }
    } else {
        showMessage('Only the host can edit other players\' names.', 'error');
    }
}

// Team Management
function calculateTeamScore(playerIds) {
    if (!currentSession || !playerIds) return 0;
    return playerIds.reduce((total, playerId) => {
        const player = currentSession.players.find(p => p.id === playerId);
        return total + (player ? player.score : 0);
    }, 0);
}

function renderTeamSetup() {
    renderAvailablePlayers();
    renderTeamsList();
    
    const createTeamBtn = document.getElementById('createTeamBtn');
    if (createTeamBtn) {
        createTeamBtn.onclick = createNewTeam;
    }
}

function renderAvailablePlayers() {
    const availablePlayersContainer = document.getElementById('availablePlayers');
    if (!availablePlayersContainer) return;

    availablePlayersContainer.innerHTML = '';
    
    currentSession.players.forEach(player => {
        const isInTeam = Object.values(currentSession.teams || {}).some(team => 
            team.players.includes(player.id)
        );
        
        if (!isInTeam) {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            playerCard.draggable = true;
            playerCard.dataset.playerId = player.id;
            
            playerCard.innerHTML = `
                <div class="player-avatar" style="background-color: ${player.color}">
                    ${player.name.charAt(0).toUpperCase()}
                </div>
                <div class="player-name">${player.name}</div>
            `;
            
            // Add drag event listeners
            playerCard.addEventListener('dragstart', handleDragStart);
            playerCard.addEventListener('dragend', handleDragEnd);
            
            availablePlayersContainer.appendChild(playerCard);
        }
    });
    
    if (availablePlayersContainer.children.length === 0) {
        availablePlayersContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <p>All players are assigned to teams</p>
            </div>
        `;
    }
}

    playerPool.innerHTML = '';
    
    currentSession.players.forEach(player => {
        const isInTeam = Object.values(currentSession.teams || {}).some(team => 
            team.players.includes(player.id)
        );
        
        if (!isInTeam) {
            const playerElement = document.createElement('div');
            playerElement.className = 'draggable-player';
            playerElement.draggable = true;
            playerElement.dataset.playerId = player.id;
            playerElement.style.backgroundColor = player.color;
            playerElement.textContent = player.name;
            
            playerElement.ondragstart = (e) => {
                e.dataTransfer.setData('text/plain', player.id);
            };
            
            playerPool.appendChild(playerElement);
        }
    });
}

function renderTeamsList() {
    const teamsContainer = document.getElementById('teamsContainer');
    if (!teamsContainer) return;

    teamsContainer.innerHTML = '';
    
    const teams = currentSession.teams || {};
    
    if (Object.keys(teams).length === 0) {
        teamsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏆</div>
                <p>No teams created yet</p>
                <p style="font-size: 0.875rem; opacity: 0.7;">Click "Create New Team" to get started</p>
            </div>
        `;
        return;
    }
    
    Object.entries(teams).forEach(([teamId, team]) => {
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card';
        
        teamCard.innerHTML = `
            <div class="team-header">
                <input type="text" value="${team.name}" onchange="updateTeamName('${teamId}', this.value)" 
                       class="team-name" style="background: transparent; border: none; font-size: 1.125rem; font-weight: 600; color: var(--text-primary); width: 100%;">
                <div class="team-badge">${team.players.length} players</div>
            </div>
            <div class="team-players" 
                 ondrop="dropPlayer(event, '${teamId}')" 
                 ondragover="allowDrop(event)"
                 data-team-id="${teamId}">
                ${team.players.length === 0 ? 
                    '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">Drop players here</div>' :
                    team.players.map(playerId => {
                        const player = currentSession.players.find(p => p.id === playerId);
                        return player ? `
                            <div class="team-player" draggable="true" ondragstart="dragTeamPlayer(event, '${playerId}')">
                                <div class="player-avatar" style="background-color: ${player.color}; width: 2rem; height: 2rem; font-size: 0.875rem;">
                                    ${player.name.charAt(0).toUpperCase()}
                                </div>
                                <span>${player.name}</span>
                            </div>
                        ` : '';
                    }).join('')
                }
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                <div style="font-weight: 500; color: var(--text-secondary);">
                    Team Score: ${calculateTeamScore(team.players).toFixed(currentSession.allowDecimals ? 1 : 0)}
                </div>
                <button onclick="deleteTeam('${teamId}')" class="btn btn-danger" style="padding: 0.5rem; font-size: 0.875rem;">
                    🗑️ Delete
                </button>
            </div>
        `;
        
        teamsContainer.appendChild(teamCard);
    });
}

function createNewTeam() {
    const teamName = prompt('Enter team name:');
    if (!teamName || teamName.trim() === '') return;

    const teamId = 'team-' + Date.now();
    const teamColor = getRandomColor();
    
    if (!currentSession.teams) currentSession.teams = {};
    currentSession.teams[teamId] = {
        name: teamName.trim(),
        color: teamColor,
        players: []
    };
    
    renderTeamsList();
}

function allowDrop(event) {
    event.preventDefault();
}

function dropPlayer(event, teamId) {
    event.preventDefault();
    const playerId = event.dataTransfer.getData('text/plain');
    
    if (!currentSession.teams[teamId].players.includes(playerId)) {
        currentSession.teams[teamId].players.push(playerId);
        renderPlayerPool();
        renderTeamsList();
    }
}

function dragTeamPlayer(event, playerId) {
    event.dataTransfer.setData('text/plain', playerId);
}

function updateTeamName(teamId, newName) {
    if (currentSession.teams[teamId]) {
        currentSession.teams[teamId].name = newName;
    }
}

function updateTeamColor(teamId, newColor) {
    if (currentSession.teams[teamId]) {
        currentSession.teams[teamId].color = newColor;
        renderTeamsList();
    }
}

function deleteTeam(teamId) {
    if (confirm('Are you sure you want to delete this team?')) {
        delete currentSession.teams[teamId];
        renderPlayerPool();
        renderTeamsList();
    }
}

// Make deleteTeam globally accessible
window.deleteTeam = deleteTeam;

function clearAllTeams() {
    if (confirm('Are you sure you want to clear all teams?')) {
        currentSession.teams = {};
        renderPlayerPool();
        renderTeamsList();
    }
}

async function saveTeamConfiguration() {
    if (!currentSession || !currentSession.isHost) return;

    currentSession.lastUpdated = Date.now();

    if (firebaseInitialized && firebaseConnectionStatus) {
        try {
            await db.ref(`sessions/${currentSession.code}`).update({
                teams: currentSession.teams,
                lastUpdated: currentSession.lastUpdated
            });
            showMessage('Team configuration saved!', 'success');
        } catch (error) {
            console.error('Error saving teams to Firebase:', error);
            showMessage('Error saving teams. Check connection.', 'error');
        }
    } else {
        showMessage('Teams saved locally (offline mode)', 'warning');
    }
}

// Game Win Condition
function checkWinCondition() {
    if (!currentSession || !currentSession.targetScore) return;

    const winners = currentSession.players.filter(player => player.score >= currentSession.targetScore);

    if (winners.length > 0) {
        winners.sort((a, b) => b.score - a.score);
        const winnerNames = winners.map(w => w.name).join(', ');
        const winnerScores = winners.map(w => w.score).join(', ');

        if (!currentSession.playAfterTarget && currentSession.gameEnded) {
            return;
        }

        if (!currentSession.playAfterTarget) {
            currentSession.gameEnded = true;
            if (currentSession.isHost && firebaseInitialized && firebaseConnectionStatus) {
                db.ref(`sessions/${currentSession.code}/gameEnded`).set(true);
            }
            showMessage(`Game Over! Winner(s): ${winnerNames} with scores: ${winnerScores}!`, 'success');
            alert(`Game Over! Winner(s): ${winnerNames} with scores: ${winnerScores}!`);
        } else {
            showMessage(`Target score reached by: ${winnerNames}! Current scores: ${winnerScores}. Game continues!`, 'info');
        }
    } else {
        if (currentSession.gameEnded && currentSession.isHost && firebaseInitialized && firebaseConnectionStatus) {
            db.ref(`sessions/${currentSession.code}/gameEnded`).set(false);
        }
        currentSession.gameEnded = false;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Page loaded, initializing...');
    
    // Initialize theme
    initializeTheme();
    
    await initializeFirebaseWithRetry();
    
    // Bind event listeners
    console.log('Starting button binding...');
    const createButton = document.getElementById('createNewSessionBtn');
    console.log('Create button element:', createButton);
    if (createButton) {
        createButton.onclick = () => {
            console.log('Create button clicked, navigating to createSession');
            showPage('createSession');
        };
        console.log('Create button bound');
    } else {
        console.log('Create button not found');
    }

    const joinButton = document.getElementById('joinSessionBtn');
    if (joinButton) {
        joinButton.onclick = () => showPage(PAGE_IDS.JOIN_SESSION);
        console.log('Join button bound');
    }

    const createForm = document.getElementById('createSessionForm');
    if (createForm) {
        createForm.onsubmit = handleCreateSession;
        console.log('Create form bound');
    }

    const joinForm = document.getElementById('joinSessionForm');
    if (joinForm) {
        joinForm.onsubmit = (event) => {
            event.preventDefault();
            
            const joinCodeInput = document.getElementById('joinCode');
            const playerNameInput = document.getElementById('joinPlayerName');
            
            const joinCode = joinCodeInput ? joinCodeInput.value.trim() : '';
            const playerName = playerNameInput ? playerNameInput.value.trim() : '';

            if (joinCode && playerName) {
                joinSession(joinCode.toUpperCase(), playerName, getRandomColor(), false);
            } else {
                showMessage('Please enter both session code and your name.', 'error');
            }
        };
        console.log('Join form bound');
    }
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', toggleTheme);
        console.log('Theme toggle bound');
    }

    // Spectator button
    const spectatorButton = document.getElementById('spectatorBtn');
    console.log('Looking for spectator button:', spectatorButton);
    if (spectatorButton) {
        spectatorButton.onclick = () => {
            console.log('Spectator button clicked');
            showPage('spectatorJoin');
        };
        console.log('Spectator button bound');
    } else {
        console.log('Spectator button not found!');
    }

    // Spectator join form
    const spectatorJoinForm = document.getElementById('spectatorJoinForm');
    if (spectatorJoinForm) {
        spectatorJoinForm.onsubmit = (event) => {
            event.preventDefault();
            const joinCodeInput = document.getElementById('spectatorSessionCode');
            const joinCode = joinCodeInput ? joinCodeInput.value.trim() : '';
            
            if (joinCode) {
                if (!window.firebaseInitialized || !window.firebaseConnectionStatus) {
                    showMessage('Spectator mode requires Firebase connection. Currently running in local mode where sessions are only available on the host device.', 'error');
                    return;
                }
                
                const spectatorName = 'Spectator-' + Date.now().toString().slice(-4);
                joinSession(joinCode.toUpperCase(), spectatorName, '#000000', true);
            } else {
                showMessage('Please enter session code to join as spectator.', 'error');
            }
        };
        console.log('Spectator join form bound');
    }

    // Player count controls
    const increasePlayerButton = document.getElementById('increasePlayerCount');
    if (increasePlayerButton) {
        increasePlayerButton.onclick = () => {
            const playerCountInput = document.getElementById('playerCount');
            if (playerCountInput) {
                let count = parseInt(playerCountInput.value) || 2;
                if (count < 12) {
                    count++;
                    playerCountInput.value = count;
                }
            }
        };
        console.log('Increase player button bound');
    }

    const decreasePlayerButton = document.getElementById('decreasePlayerCount');
    if (decreasePlayerButton) {
        decreasePlayerButton.onclick = () => {
            const playerCountInput = document.getElementById('playerCount');
            if (playerCountInput) {
                let count = parseInt(playerCountInput.value) || 2;
                if (count > 1) {
                    count--;
                    playerCountInput.value = count;
                }
            }
        };
        console.log('Decrease player button bound');
    }

    console.log('App initialized successfully!');
    showPage(PAGE_IDS.LANDING);
});

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('gameScoreTheme') || 'light';
    const themeToggle = document.getElementById('themeToggle');
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    if (themeToggle) {
        themeToggle.checked = savedTheme === 'dark';
    }
}

function toggleTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const newTheme = themeToggle && themeToggle.checked ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('gameScoreTheme', newTheme);
}

console.log('GameScore Pro script loaded - Enhanced with Teams, Colors, and Spectator Mode');

