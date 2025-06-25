// GameScore Pro - Fixed Version
console.log('GameScore Pro starting...');

// Global variables
let currentSession = null;
let players = [];
let isScorekeeper = false;
let currentPlayer = null;
let formSubmitted = false;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    initializeApp();
});

function initializeApp() {
    console.log('Initializing app...');
    
    // Bind navigation events
    const createBtn = document.getElementById('createSessionBtn');
    if (createBtn) {
        createBtn.addEventListener('click', function() {
            showPage('createSessionPage');
        });
        console.log('Create button bound');
    }
    
    const joinBtn = document.getElementById('joinSessionBtn');
    if (joinBtn) {
        joinBtn.addEventListener('click', function() {
            showPage('joinSessionPage');
        });
        console.log('Join button bound');
    }
    
    // Bind player count controls
    const increaseBtn = document.getElementById('increasePlayer');
    if (increaseBtn) {
        increaseBtn.addEventListener('click', function() {
            changePlayerCount(1);
        });
        console.log('Increase player button bound');
    }
    
    const decreaseBtn = document.getElementById('decreasePlayer');
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', function() {
            changePlayerCount(-1);
        });
        console.log('Decrease player button bound');
    }
    
    // Bind form submissions
    const createForm = document.getElementById('createSessionForm');
    if (createForm) {
        createForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (formSubmitted) {
                console.log('Form already submitted, ignoring');
                return;
            }
            formSubmitted = true;
            console.log('Create session form submitted');
            handleCreateSession(e);
        });
        console.log('Create form bound');
    }
    
    const joinForm = document.getElementById('joinSessionForm');
    if (joinForm) {
        joinForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Join session form submitted');
            handleJoinSession(e);
        });
        console.log('Join form bound');
    }
    
    // Bind back buttons
    const backButtons = document.querySelectorAll('[id*="backTo"]');
    backButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            formSubmitted = false; // Reset form submission flag
            showPage('landingPage');
        });
    });
    
    console.log('App initialized successfully!');
}

function changePlayerCount(delta) {
    const input = document.getElementById('numPlayers');
    if (input) {
        const current = parseInt(input.value) || 2;
        const newValue = Math.max(1, Math.min(12, current + delta));
        input.value = newValue;
        console.log('Player count changed to:', newValue);
    }
}

function showPage(pageId) {
    console.log('Showing page:', pageId);
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        console.log('Page shown:', pageId);
    } else {
        console.error('Page not found:', pageId);
    }
}

function handleCreateSession(e) {
    console.log('Creating session...');
    
    // Disable the submit button to prevent multiple submissions
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
    }
    
    // Get form data
    const formData = new FormData(e.target);
    const sessionName = formData.get('sessionName') || 'Game Session';
    const playerCount = parseInt(document.getElementById('numPlayers').value) || 2;
    const startingScore = parseFloat(document.getElementById('startingScore').value) || 0;
    
    // Generate session code
    const sessionCode = generateSessionCode();
    console.log('Generated session code:', sessionCode);
    
    // Create session
    currentSession = {
        code: sessionCode,
        name: sessionName,
        playerCount: playerCount,
        startingScore: startingScore,
        createdAt: new Date().toISOString()
    };
    
    // Initialize players
    players = [];
    for (let i = 1; i <= playerCount; i++) {
        players.push({
            id: `player${i}`,
            name: `Player ${i}`,
            score: startingScore
        });
    }
    
    isScorekeeper = true;
    
    // Save to Firebase if available
    if (typeof database !== 'undefined' && database) {
        saveSessionToFirebase();
    }
    
    // Show success message with session code
    alert(`🎉 Session Created!\n\nSession Code: ${sessionCode}\n\nShare this code with other players.\n\nClick OK to start scoring!`);
    
    // Show scorekeeper interface
    showScorekeeperInterface();
}

function handleJoinSession(e) {
    console.log('Joining session...');
    
    const formData = new FormData(e.target);
    const joinCode = formData.get('joinCode').toUpperCase();
    const playerName = formData.get('playerName');
    
    if (!joinCode || !playerName) {
        alert('Please enter both session code and your name');
        return;
    }
    
    // Try to join session
    if (typeof database !== 'undefined' && database) {
        joinSessionFromFirebase(joinCode, playerName);
    } else {
        alert('Cannot join session - Firebase not available');
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

function showScorekeeperInterface() {
    console.log('Showing scorekeeper interface...');
    
    const container = document.querySelector('.container');
    if (!container) {
        console.error('Container not found');
        return;
    }
    
    // Clear any existing content
    container.innerHTML = '';
    
    // Create the scorekeeper interface
    const interfaceHTML = `
        <header>
            <div class="header-content">
                <div class="header-left">
                    <h1>GameScore Pro</h1>
                    <p><strong>Session: ${currentSession.code}</strong></p>
                    <p>${currentSession.name}</p>
                </div>
                <div class="header-right">
                    <div class="connection-status">
                        <span class="status-dot online"></span>
                        <span class="status-text">Online</span>
                    </div>
                    <button onclick="showSessionCode()" class="secondary-btn">📱 Show Code</button>
                    <button onclick="endSession()" class="danger-btn">🏁 End Session</button>
                </div>
            </div>
        </header>
        
        <div class="session-info">
            <h2>Scorekeeper Mode</h2>
            <p>Managing ${players.length} players</p>
        </div>
        
        <div class="players-grid" data-player-count="${players.length}">
            ${generatePlayerTiles()}
        </div>
        
        <div class="game-controls">
            <button onclick="resetAllScores()" class="secondary-btn">🔄 Reset All Scores</button>
            <button onclick="goHome()" class="secondary-btn">← Back to Home</button>
        </div>
    `;
    
    container.innerHTML = interfaceHTML;
    console.log('Scorekeeper interface created');
    
    bindScoreControls();
}

function generatePlayerTiles() {
    return players.map(player => `
        <div class="player-tile" data-player-id="${player.id}">
            <div class="player-header">
                <h3 class="player-name" contenteditable="true" onblur="updatePlayerName('${player.id}', this.textContent)">${player.name}</h3>
            </div>
            
            <div class="player-score">
                <span class="score-value" id="score-${player.id}">${player.score}</span>
            </div>
            
            <div class="custom-amount-section">
                <label>Custom Amount:</label>
                <input type="number" class="custom-amount" id="amount-${player.id}" value="1" step="0.1">
                <div class="preset-buttons">
                    <button onclick="changeScore('${player.id}', 1)" class="preset-btn">+1</button>
                    <button onclick="changeScore('${player.id}', 5)" class="preset-btn">+5</button>
                    <button onclick="changeScore('${player.id}', 10)" class="preset-btn">+10</button>
                    <button onclick="changeScore('${player.id}', -1)" class="preset-btn">-1</button>
                </div>
            </div>
            
            <div class="score-controls">
                <button class="score-btn decrease-btn" onclick="changeScoreByAmount('${player.id}', -1)">-</button>
                <button class="score-btn increase-btn" onclick="changeScoreByAmount('${player.id}', 1)">+</button>
            </div>
        </div>
    `).join('');
}

function bindScoreControls() {
    console.log('Score controls bound');
}

function changeScore(playerId, amount) {
    const player = players.find(p => p.id === playerId);
    if (player) {
        player.score += amount;
        updateScoreDisplay(playerId);
        console.log(`${player.name} score changed by ${amount} to ${player.score}`);
        
        // Update Firebase
        if (typeof database !== 'undefined' && database && currentSession) {
            updatePlayerInFirebase(playerId, player);
        }
    }
}

function changeScoreByAmount(playerId, multiplier) {
    const amountInput = document.getElementById(`amount-${playerId}`);
    const amount = parseFloat(amountInput.value) || 1;
    changeScore(playerId, amount * multiplier);
}

function updateScoreDisplay(playerId) {
    const scoreElement = document.getElementById(`score-${playerId}`);
    const player = players.find(p => p.id === playerId);
    if (scoreElement && player) {
        scoreElement.textContent = player.score;
    }
}

function updatePlayerName(playerId, newName) {
    const player = players.find(p => p.id === playerId);
    if (player && newName.trim()) {
        player.name = newName.trim();
        console.log(`Player ${playerId} renamed to ${player.name}`);
        
        // Update Firebase
        if (typeof database !== 'undefined' && database && currentSession) {
            updatePlayerInFirebase(playerId, player);
        }
    }
}

function showSessionCode() {
    alert(`Session Code: ${currentSession.code}\n\nShare this code with other players so they can join your game!`);
}

function resetAllScores() {
    if (confirm('Reset all scores to starting score?')) {
        players.forEach(player => {
            player.score = currentSession.startingScore;
            updateScoreDisplay(player.id);
        });
        console.log('All scores reset');
        
        // Update Firebase
        if (typeof database !== 'undefined' && database && currentSession) {
            saveSessionToFirebase();
        }
    }
}

function endSession() {
    if (confirm('End this session and return to home?')) {
        goHome();
    }
}

function goHome() {
    formSubmitted = false; // Reset form submission flag
    currentSession = null;
    players = [];
    isScorekeeper = false;
    
    // Restore original container content
    location.reload(); // Simple way to reset everything
}

function saveSessionToFirebase() {
    if (typeof database !== 'undefined' && database && currentSession) {
        try {
            const sessionRef = database.ref(`sessions/${currentSession.code}`);
            sessionRef.set({
                metadata: currentSession,
                players: players.reduce((obj, player) => {
                    obj[player.id] = player;
                    return obj;
                }, {}),
                lastUpdated: new Date().toISOString()
            });
            console.log('Session saved to Firebase');
        } catch (error) {
            console.error('Error saving to Firebase:', error);
        }
    }
}

function updatePlayerInFirebase(playerId, player) {
    if (typeof database !== 'undefined' && database && currentSession) {
        try {
            const playerRef = database.ref(`sessions/${currentSession.code}/players/${playerId}`);
            playerRef.set(player);
            console.log(`Player ${playerId} updated in Firebase`);
        } catch (error) {
            console.error('Error updating player in Firebase:', error);
        }
    }
}

function joinSessionFromFirebase(joinCode, playerName) {
    const sessionRef = database.ref(`sessions/${joinCode}`);
    sessionRef.once('value').then(snapshot => {
        if (snapshot.exists()) {
            const sessionData = snapshot.val();
            currentSession = sessionData.metadata;
            players = Object.values(sessionData.players || {});
            
            // Find or assign player
            let assignedPlayer = players.find(p => p.name === playerName);
            if (!assignedPlayer) {
                assignedPlayer = players.find(p => p.name.startsWith('Player '));
                if (assignedPlayer) {
                    assignedPlayer.name = playerName;
                    updatePlayerInFirebase(assignedPlayer.id, assignedPlayer);
                }
            }
            
            if (assignedPlayer) {
                currentPlayer = assignedPlayer.id;
                isScorekeeper = false;
                showPlayerInterface();
                alert(`Joined session as ${playerName}!`);
            } else {
                alert('Session is full');
            }
        } else {
            alert('Session not found');
        }
    }).catch(error => {
        console.error('Error joining session:', error);
        alert('Failed to join session');
    });
}

function showPlayerInterface() {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <header>
            <div class="header-content">
                <div class="header-left">
                    <h1>GameScore Pro</h1>
                    <p><strong>Session: ${currentSession.code}</strong></p>
                    <p>${currentSession.name}</p>
                </div>
                <div class="header-right">
                    <div class="connection-status">
                        <span class="status-dot online"></span>
                        <span class="status-text">Online</span>
                    </div>
                    <button onclick="goHome()" class="danger-btn">🚪 Leave Session</button>
                </div>
            </div>
        </header>
        
        <div class="player-view-info">
            <div class="view-mode-indicator">
                <span class="indicator-icon">👁️</span>
                <span>Player View - Scores update automatically</span>
            </div>
        </div>
        
        <div class="players-grid" data-player-count="${players.length}">
            ${generatePlayerViewTiles()}
        </div>
        
        <div class="last-updated">
            <small>Last updated: <span id="lastUpdated">${new Date().toLocaleTimeString()}</span></small>
        </div>
    `;
    
    // Listen for real-time updates
    if (typeof database !== 'undefined' && database && currentSession) {
        const sessionRef = database.ref(`sessions/${currentSession.code}/players`);
        sessionRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                const updatedPlayers = Object.values(snapshot.val());
                players = updatedPlayers;
                
                // Update the display
                const playersGrid = document.querySelector('.players-grid');
                if (playersGrid) {
                    playersGrid.innerHTML = generatePlayerViewTiles();
                }
                
                // Update timestamp
                const lastUpdated = document.getElementById('lastUpdated');
                if (lastUpdated) {
                    lastUpdated.textContent = new Date().toLocaleTimeString();
                }
            }
        });
    }
}

function generatePlayerViewTiles() {
    return players.map(player => {
        const isCurrentPlayer = player.id === currentPlayer;
        return `
            <div class="player-tile ${isCurrentPlayer ? 'current-player' : ''}" data-player-id="${player.id}">
                <div class="player-header">
                    <h3 class="player-name">${player.name}</h3>
                    ${isCurrentPlayer ? '<span class="current-player-badge">You</span>' : ''}
                </div>
                
                <div class="player-score">
                    <span class="score-value">${player.score}</span>
                </div>
            </div>
        `;
    }).join('');
}

console.log('GameScore Pro script loaded');

