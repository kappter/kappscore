// GameScore Pro - Modern Implementation
console.log('GameScore Pro starting...');

// Global variables (avoid conflicts with firebase-config.js)
let currentSession = null;
let currentPlayerId = null;
let currentPlayerName = "Guest";

// Utility functions
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        console.log(`Page shown successfully: ${pageId}`);
    }
}

function showMessage(text, type = 'info') {
    const messageContainer = document.getElementById('messageContainer');
    if (messageContainer) {
        messageContainer.textContent = text;
        messageContainer.className = `message ${type}`;
        messageContainer.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageContainer.classList.add('hidden');
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
    const colors = ['#4f46e5', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Session management
function createSession() {
    const sessionName = document.getElementById('sessionName').value.trim() || 'Game Session';
    const playerCount = parseInt(document.getElementById('playerCountDisplay').textContent);
    const startingScore = parseInt(document.getElementById('startingScore').value) || 0;
    const allowDecimals = document.getElementById('allowDecimals').checked;
    const targetScore = parseInt(document.getElementById('targetScore').value) || null;
    const playAfterTarget = document.getElementById('playAfterTarget').checked;

    const sessionCode = generateSessionCode();
    
    currentSession = {
        code: sessionCode,
        name: sessionName,
        playerCount: playerCount,
        startingScore: startingScore,
        allowDecimals: allowDecimals,
        targetScore: targetScore,
        playAfterTarget: playAfterTarget,
        players: [],
        isHost: true,
        createdAt: Date.now(),
        lastUpdated: Date.now()
    };

    // Create host player
    const hostPlayer = {
        id: 'host',
        name: 'Player 1',
        score: startingScore,
        color: getRandomColor(),
        isHost: true,
        history: [{
            score: startingScore,
            change: 0,
            timestamp: Date.now()
        }]
    };

    currentSession.players.push(hostPlayer);
    currentPlayerId = 'host';
    currentPlayerName = 'Player 1';

    // Create additional players
    for (let i = 2; i <= playerCount; i++) {
        const player = {
            id: `player_${i}`,
            name: `Player ${i}`,
            score: startingScore,
            color: getRandomColor(),
            isHost: false,
            history: [{
                score: startingScore,
                change: 0,
                timestamp: Date.now()
            }]
        };
        currentSession.players.push(player);
    }

    // Save to localStorage
    localStorage.setItem(`gameScore_session_${sessionCode}`, JSON.stringify(currentSession));

    console.log('Session created:', currentSession);
    updateSessionSuccessPage();
    showPage('sessionSuccess');
}

function updateSessionSuccessPage() {
    if (!currentSession) return;

    document.getElementById('displaySessionCode').textContent = currentSession.code;
    document.getElementById('displaySessionName').textContent = currentSession.name;
    document.getElementById('displayPlayerCount').textContent = currentSession.playerCount;
    document.getElementById('displayStartingScore').textContent = currentSession.startingScore;
    document.getElementById('displayTargetScore').textContent = currentSession.targetScore || 'None';
    document.getElementById('instructionSessionCode').textContent = currentSession.code;
}

function joinSession(sessionCode, playerName) {
    // Try to load from localStorage
    const sessionKey = `gameScore_session_${sessionCode}`;
    const sessionData = localStorage.getItem(sessionKey);
    
    if (sessionData) {
        currentSession = JSON.parse(sessionData);
        
        // Check if player already exists
        const existingPlayer = currentSession.players.find(p => p.name === playerName);
        if (existingPlayer) {
            currentPlayerId = existingPlayer.id;
            currentPlayerName = playerName;
            showMessage(`Rejoined as ${playerName}`, 'success');
        } else {
            // Add new player if there's space
            if (currentSession.players.length < currentSession.playerCount) {
                const newPlayer = {
                    id: `player_${Date.now()}`,
                    name: playerName,
                    score: currentSession.startingScore,
                    color: getRandomColor(),
                    isHost: false,
                    history: [{
                        score: currentSession.startingScore,
                        change: 0,
                        timestamp: Date.now()
                    }]
                };
                
                currentSession.players.push(newPlayer);
                currentPlayerId = newPlayer.id;
                currentPlayerName = playerName;
                
                // Save updated session
                localStorage.setItem(sessionKey, JSON.stringify(currentSession));
                showMessage(`Joined as ${playerName}`, 'success');
            } else {
                showMessage('Session is full', 'error');
                return;
            }
        }
        
        updateScorekeeperInterface();
        showPage('scorekeeper');
    } else {
        showMessage('Session not found. Make sure the code is correct.', 'error');
    }
}

function updateScorekeeperInterface() {
    if (!currentSession) return;

    // Update header info
    document.getElementById('scorekeeperSessionCode').textContent = currentSession.code;
    document.getElementById('scorekeeperSessionName').textContent = currentSession.name;
    document.getElementById('scorekeeperTargetScore').textContent = currentSession.targetScore || 'None';
    document.getElementById('scorekeeperPlayerCount').textContent = currentSession.players.length;

    // Update players grid
    const playersContainer = document.getElementById('playersContainer');
    playersContainer.innerHTML = '';

    currentSession.players.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.innerHTML = `
            <div class="player-header">
                <div class="player-name">${player.name}</div>
                <div class="player-score" style="color: ${player.color}">${player.score}</div>
            </div>
            <div class="score-controls">
                <button class="score-btn negative" onclick="updateScore('${player.id}', -10)">-10</button>
                <button class="score-btn negative" onclick="updateScore('${player.id}', -5)">-5</button>
                <button class="score-btn negative" onclick="updateScore('${player.id}', -1)">-1</button>
                <button class="score-btn neutral" onclick="showCustomScoreInput('${player.id}')">1</button>
                <button class="score-btn positive" onclick="updateScore('${player.id}', 1)">+</button>
                <button class="score-btn positive" onclick="updateScore('${player.id}', 5)">+5</button>
                <button class="score-btn positive" onclick="updateScore('${player.id}', 10)">+10</button>
            </div>
        `;
        playersContainer.appendChild(playerCard);
    });
}

// Score management
function updateScore(playerId, amount) {
    if (!currentSession) return;

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

    // Save to localStorage
    if (currentSession.code) {
        const sessionKey = `gameScore_session_${currentSession.code}`;
        localStorage.setItem(sessionKey, JSON.stringify(currentSession));
    }

    updateScorekeeperInterface();
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

// Make functions globally accessible
window.updateScore = updateScore;
window.showCustomScoreInput = showCustomScoreInput;

// Event handlers
function handleCreateSession(event) {
    event.preventDefault();
    console.log('Creating session...');
    createSession();
}

function handleJoinSession(event) {
    event.preventDefault();
    
    const joinCode = document.getElementById('joinCode').value.trim().toUpperCase();
    const playerName = document.getElementById('joinPlayerName').value.trim();
    
    if (joinCode && playerName) {
        console.log(`Attempting to join session ${joinCode} as ${playerName}`);
        joinSession(joinCode, playerName);
    } else {
        showMessage('Please enter both session code and your name.', 'error');
    }
}

function copySessionCode() {
    if (currentSession) {
        navigator.clipboard.writeText(currentSession.code).then(() => {
            showMessage('Session code copied to clipboard!', 'success');
        }).catch(() => {
            showMessage('Failed to copy code. Please copy manually: ' + currentSession.code, 'error');
        });
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, initializing...');

    // Check if elements exist before binding events
    const createSessionCard = document.getElementById('createSessionCard');
    if (createSessionCard) {
        createSessionCard.addEventListener('click', () => {
            showPage('createSession');
        });
    }

    const joinSessionCard = document.getElementById('joinSessionCard');
    if (joinSessionCard) {
        joinSessionCard.addEventListener('click', () => {
            showPage('joinSession');
        });
    }

    // Back buttons
    const backToLanding = document.getElementById('backToLanding');
    if (backToLanding) {
        backToLanding.addEventListener('click', () => {
            showPage('landing');
        });
    }

    const backToLandingFromJoin = document.getElementById('backToLandingFromJoin');
    if (backToLandingFromJoin) {
        backToLandingFromJoin.addEventListener('click', () => {
            showPage('landing');
        });
    }

    const backToHomeBtn = document.getElementById('backToHomeBtn');
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => {
            showPage('landing');
        });
    }

    // Player count controls
    const decreasePlayerCount = document.getElementById('decreasePlayerCount');
    if (decreasePlayerCount) {
        decreasePlayerCount.addEventListener('click', () => {
            const display = document.getElementById('playerCountDisplay');
            if (display) {
                let count = parseInt(display.textContent);
                if (count > 1) {
                    display.textContent = count - 1;
                }
            }
        });
    }

    const increasePlayerCount = document.getElementById('increasePlayerCount');
    if (increasePlayerCount) {
        increasePlayerCount.addEventListener('click', () => {
            const display = document.getElementById('playerCountDisplay');
            if (display) {
                let count = parseInt(display.textContent);
                if (count < 12) {
                    display.textContent = count + 1;
                }
            }
        });
    }

    // Form submissions
    const createSessionForm = document.getElementById('createSessionForm');
    if (createSessionForm) {
        createSessionForm.addEventListener('submit', handleCreateSession);
    }

    const joinSessionForm = document.getElementById('joinSessionForm');
    if (joinSessionForm) {
        joinSessionForm.addEventListener('submit', handleJoinSession);
    }

    // Session success actions
    const startScoringBtn = document.getElementById('startScoringBtn');
    if (startScoringBtn) {
        startScoringBtn.addEventListener('click', () => {
            updateScorekeeperInterface();
            showPage('scorekeeper');
        });
    }

    const copyCodeBtn = document.getElementById('copyCodeBtn');
    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', copySessionCode);
    }

    // Scorekeeper actions
    const shareCodeBtn = document.getElementById('shareCodeBtn');
    if (shareCodeBtn) {
        shareCodeBtn.addEventListener('click', copySessionCode);
    }
    
    const resetScoresBtn = document.getElementById('resetScoresBtn');
    if (resetScoresBtn) {
        resetScoresBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all scores?')) {
                if (currentSession) {
                    currentSession.players.forEach(player => {
                        player.score = currentSession.startingScore;
                        player.history.push({
                            score: currentSession.startingScore,
                            change: 0,
                            timestamp: Date.now()
                        });
                    });
                    
                    // Save to localStorage
                    const sessionKey = `gameScore_session_${currentSession.code}`;
                    localStorage.setItem(sessionKey, JSON.stringify(currentSession));
                    
                    updateScorekeeperInterface();
                    showMessage('All scores have been reset!', 'success');
                }
            }
        });
    }

    const endGameBtn = document.getElementById('endGameBtn');
    if (endGameBtn) {
        endGameBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to end the game?')) {
                currentSession = null;
                currentPlayerId = null;
                currentPlayerName = "Guest";
                showPage('landing');
                showMessage('Game ended successfully!', 'success');
            }
        });
    }

    console.log('App initialized successfully!');
});

console.log('GameScore Pro script loaded successfully!');

