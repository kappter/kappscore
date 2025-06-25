// GameScore Pro - Complete Working Version
console.log('GameScore Pro starting...');

let currentSession = null;
let players = [];
let formSubmitted = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    
    // Create button
    const createBtn = document.getElementById('createSessionBtn');
    if (createBtn) {
        createBtn.addEventListener('click', function() {
            showPage('createSessionPage');
        });
    }
    
    // Join button  
    const joinBtn = document.getElementById('joinSessionBtn');
    if (joinBtn) {
        joinBtn.addEventListener('click', function() {
            showPage('joinSessionPage');
        });
    }
    
    // Player count controls
    const increaseBtn = document.getElementById('increasePlayer');
    if (increaseBtn) {
        increaseBtn.addEventListener('click', function() {
            const input = document.getElementById('numPlayers');
            if (input) {
                const current = parseInt(input.value) || 2;
                input.value = Math.min(12, current + 1);
            }
        });
    }
    
    const decreaseBtn = document.getElementById('decreasePlayer');
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', function() {
            const input = document.getElementById('numPlayers');
            if (input) {
                const current = parseInt(input.value) || 2;
                input.value = Math.max(1, current - 1);
            }
        });
    }
    
    // Create form
    const createForm = document.getElementById('createSessionForm');
    if (createForm) {
        createForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (formSubmitted) return;
            formSubmitted = true;
            
            // Generate session code
            const sessionCode = generateSessionCode();
            console.log('Session created:', sessionCode);
            
            // Get form data
            const formData = new FormData(e.target);
            currentSession = {
                code: sessionCode,
                name: formData.get('sessionName') || 'Game Session',
                playerCount: parseInt(document.getElementById('numPlayers').value) || 2,
                startingScore: parseFloat(document.getElementById('startingScore').value) || 0,
                createdAt: new Date().toISOString()
            };
            
            // Initialize players
            players = [];
            for (let i = 1; i <= currentSession.playerCount; i++) {
                players.push({
                    id: `player${i}`,
                    name: `Player ${i}`,
                    score: currentSession.startingScore
                });
            }
            
            // Save to Firebase
            if (typeof database !== 'undefined' && database) {
                const sessionRef = database.ref(`sessions/${sessionCode}`);
                const playersObj = {};
                players.forEach(player => {
                    playersObj[player.id] = player;
                });
                sessionRef.set({
                    metadata: currentSession,
                    players: playersObj,
                    lastUpdated: new Date().toISOString()
                });
                console.log('Session saved to Firebase');
            }
            
            // Show success screen
            showSessionSuccess();
        });
    }
    
    // Join form
    const joinForm = document.getElementById('joinSessionForm');
    if (joinForm) {
        joinForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const joinCode = formData.get('joinCode').toUpperCase();
            const playerName = formData.get('playerName');
            
            if (!joinCode || !playerName) {
                showMessage('Please enter both session code and your name', 'error');
                return;
            }
            
            if (typeof database !== 'undefined' && database) {
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
                                // Update in Firebase
                                const playerRef = database.ref(`sessions/${joinCode}/players/${assignedPlayer.id}`);
                                playerRef.set(assignedPlayer);
                            }
                        }
                        
                        if (assignedPlayer) {
                            showPlayerView(assignedPlayer.id);
                        } else {
                            showMessage('Session is full', 'error');
                        }
                    } else {
                        showMessage('Session not found. Check the code and try again.', 'error');
                    }
                }).catch(() => {
                    showMessage('Failed to join session. Try again.', 'error');
                });
            } else {
                showMessage('Cannot join - Firebase not available', 'error');
            }
        });
    }
    
    // Back buttons
    document.querySelectorAll('[id*="backTo"]').forEach(btn => {
        btn.addEventListener('click', function() {
            formSubmitted = false;
            showPage('landingPage');
        });
    });
    
    console.log('App initialized successfully!');
});

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
}

function showSessionSuccess() {
    const createPage = document.getElementById('createSessionPage');
    if (createPage) {
        createPage.innerHTML = `
            <div class="session-success">
                <div class="success-header">
                    <h2>🎉 Session Created Successfully!</h2>
                </div>
                
                <div class="session-code-display">
                    <h3>Session Code:</h3>
                    <div class="session-code-large">${currentSession.code}</div>
                    <p>Share this code with other players</p>
                </div>
                
                <div class="session-details">
                    <h4>Session Details:</h4>
                    <p><strong>Name:</strong> ${currentSession.name}</p>
                    <p><strong>Players:</strong> ${currentSession.playerCount}</p>
                    <p><strong>Starting Score:</strong> ${currentSession.startingScore}</p>
                </div>
                
                <div class="session-instructions">
                    <h4>How to Join:</h4>
                    <ol>
                        <li>Other players visit: <strong>https://kappter.github.io/kappscore/</strong></li>
                        <li>Click "Join Session"</li>
                        <li>Enter the session code: <strong>${currentSession.code}</strong></li>
                        <li>Enter their name</li>
                    </ol>
                </div>
                
                <div class="session-actions">
                    <button onclick="startScoring()" class="primary-btn large-btn">🎮 Start Scoring</button>
                    <button onclick="copySessionCode('${currentSession.code}')" class="secondary-btn">📋 Copy Code</button>
                    <button onclick="goHome()" class="secondary-btn">← Back to Home</button>
                </div>
            </div>
            
            <style>
                .session-success {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    text-align: center;
                }
                
                .success-header h2 {
                    color: #4CAF50;
                    margin-bottom: 30px;
                }
                
                .session-code-display {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 15px;
                    margin: 20px 0;
                }
                
                .session-code-large {
                    font-size: 3em;
                    font-weight: bold;
                    letter-spacing: 0.2em;
                    margin: 10px 0;
                    font-family: 'Courier New', monospace;
                }
                
                .session-details {
                    background: #f5f5f5;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                    text-align: left;
                }
                
                .session-instructions {
                    background: #e3f2fd;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                    text-align: left;
                }
                
                .session-instructions ol {
                    margin: 10px 0;
                    padding-left: 20px;
                }
                
                .session-actions {
                    margin-top: 30px;
                }
                
                .session-actions button {
                    margin: 5px;
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                }
                
                .large-btn {
                    padding: 20px 40px !important;
                    font-size: 20px !important;
                    font-weight: bold;
                }
                
                .primary-btn {
                    background: #4CAF50;
                    color: white;
                }
                
                .secondary-btn {
                    background: #2196F3;
                    color: white;
                }
                
                .primary-btn:hover, .secondary-btn:hover {
                    opacity: 0.9;
                }
            </style>
        `;
    }
}

function startScoring() {
    console.log('Starting scoring interface...');
    showScorekeeperInterface();
}

function showScorekeeperInterface() {
    const container = document.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <div class="scorekeeper-interface">
                <header class="game-header">
                    <div class="header-content">
                        <div class="header-left">
                            <h1>GameScore Pro</h1>
                            <p><strong>Session: ${currentSession.code}</strong></p>
                            <p>${currentSession.name} (${players.length} players)</p>
                        </div>
                        <div class="header-right">
                            <div class="connection-status">
                                <span class="status-dot online"></span>
                                <span class="status-text">Online</span>
                            </div>
                            <button onclick="showSessionCode()" class="header-btn">📱 Code</button>
                            <button onclick="goHome()" class="header-btn">← Home</button>
                        </div>
                    </div>
                </header>
                
                <div class="scorekeeper-content">
                    <div class="session-info">
                        <h2>🎮 Scorekeeper Mode</h2>
                        <p>Managing scores for ${players.length} players</p>
                    </div>
                    
                    <div class="players-grid" data-player-count="${players.length}">
                        ${generatePlayerTiles()}
                    </div>
                    
                    <div class="game-controls">
                        <button onclick="resetAllScores()" class="control-btn">🔄 Reset All</button>
                        <button onclick="showSessionCode()" class="control-btn">📱 Share Code</button>
                        <button onclick="goHome()" class="control-btn">🏠 End Game</button>
                    </div>
                </div>
            </div>
            
            <style>
                .scorekeeper-interface {
                    min-height: 100vh;
                    background: #f0f2f5;
                }
                
                .game-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                
                .header-left h1 {
                    margin: 0;
                    font-size: 1.5em;
                }
                
                .header-left p {
                    margin: 2px 0;
                    opacity: 0.9;
                }
                
                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .connection-status {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #4CAF50;
                }
                
                .header-btn {
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                }
                
                .header-btn:hover {
                    background: rgba(255,255,255,0.3);
                }
                
                .scorekeeper-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                .session-info {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .session-info h2 {
                    color: #333;
                    margin-bottom: 10px;
                }
                
                .players-grid {
                    display: grid;
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .players-grid[data-player-count="1"] { grid-template-columns: 1fr; }
                .players-grid[data-player-count="2"] { grid-template-columns: repeat(2, 1fr); }
                .players-grid[data-player-count="3"] { grid-template-columns: repeat(3, 1fr); }
                .players-grid[data-player-count="4"] { grid-template-columns: repeat(2, 1fr); }
                .players-grid[data-player-count="5"], 
                .players-grid[data-player-count="6"] { grid-template-columns: repeat(3, 1fr); }
                .players-grid[data-player-count="7"], 
                .players-grid[data-player-count="8"] { grid-template-columns: repeat(4, 1fr); }
                .players-grid[data-player-count="9"], 
                .players-grid[data-player-count="10"], 
                .players-grid[data-player-count="11"], 
                .players-grid[data-player-count="12"] { grid-template-columns: repeat(4, 1fr); }
                
                @media (max-width: 768px) {
                    .players-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
                
                @media (max-width: 480px) {
                    .players-grid { grid-template-columns: 1fr !important; }
                }
                
                .player-tile {
                    background: white;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    text-align: center;
                    transition: transform 0.2s;
                }
                
                .player-tile:hover {
                    transform: translateY(-2px);
                }
                
                .player-name {
                    font-size: 1.2em;
                    font-weight: bold;
                    margin-bottom: 15px;
                    color: #333;
                    background: none;
                    border: none;
                    cursor: text;
                    width: 100%;
                    text-align: center;
                }
                
                .player-name:focus {
                    outline: 2px solid #667eea;
                    border-radius: 4px;
                }
                
                .player-score {
                    font-size: 3em;
                    font-weight: bold;
                    color: #667eea;
                    margin: 20px 0;
                }
                
                .score-controls {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    margin-top: 20px;
                }
                
                .score-btn {
                    width: 50px;
                    height: 50px;
                    border: none;
                    border-radius: 50%;
                    font-size: 24px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .score-btn.increase {
                    background: #4CAF50;
                    color: white;
                }
                
                .score-btn.decrease {
                    background: #f44336;
                    color: white;
                }
                
                .score-btn:hover {
                    transform: scale(1.1);
                }
                
                .score-btn:active {
                    transform: scale(0.95);
                }
                
                .preset-buttons {
                    display: flex;
                    justify-content: center;
                    gap: 5px;
                    margin: 15px 0;
                    flex-wrap: wrap;
                }
                
                .preset-btn {
                    background: #e0e0e0;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: background 0.2s;
                }
                
                .preset-btn:hover {
                    background: #d0d0d0;
                }
                
                .custom-amount {
                    width: 80px;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    text-align: center;
                    margin: 10px 0;
                }
                
                .game-controls {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    flex-wrap: wrap;
                }
                
                .control-btn {
                    background: #2196F3;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    transition: background 0.2s;
                }
                
                .control-btn:hover {
                    background: #1976D2;
                }
            </style>
        `;
        
        console.log('Scorekeeper interface displayed');
    }
}

function generatePlayerTiles() {
    return players.map(player => `
        <div class="player-tile" data-player-id="${player.id}">
            <input type="text" class="player-name" value="${player.name}" 
                   onblur="updatePlayerName('${player.id}', this.value)">
            
            <div class="player-score" id="score-${player.id}">${player.score}</div>
            
            <div class="preset-buttons">
                <button class="preset-btn" onclick="changeScore('${player.id}', 1)">+1</button>
                <button class="preset-btn" onclick="changeScore('${player.id}', 5)">+5</button>
                <button class="preset-btn" onclick="changeScore('${player.id}', 10)">+10</button>
                <button class="preset-btn" onclick="changeScore('${player.id}', -1)">-1</button>
            </div>
            
            <input type="number" class="custom-amount" id="amount-${player.id}" value="1" step="0.1">
            
            <div class="score-controls">
                <button class="score-btn decrease" onclick="changeScoreByAmount('${player.id}', -1)">-</button>
                <button class="score-btn increase" onclick="changeScoreByAmount('${player.id}', 1)">+</button>
            </div>
        </div>
    `).join('');
}

function showPlayerView(playerId) {
    const container = document.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <div class="player-interface">
                <header class="game-header">
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
                            <button onclick="goHome()" class="header-btn">🚪 Leave</button>
                        </div>
                    </div>
                </header>
                
                <div class="player-content">
                    <div class="player-view-info">
                        <div class="view-mode-indicator">
                            <span class="indicator-icon">👁️</span>
                            <span>Player View - Scores update automatically</span>
                        </div>
                    </div>
                    
                    <div class="players-grid compact" data-player-count="${players.length}">
                        ${generatePlayerViewTiles(playerId)}
                    </div>
                    
                    <div class="last-updated">
                        <small>Last updated: <span id="lastUpdated">${new Date().toLocaleTimeString()}</span></small>
                    </div>
                </div>
            </div>
            
            <style>
                .player-interface {
                    min-height: 100vh;
                    background: #f0f2f5;
                }
                
                .player-content {
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                .player-view-info {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .view-mode-indicator {
                    background: #e3f2fd;
                    padding: 15px;
                    border-radius: 10px;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 500;
                }
                
                .indicator-icon {
                    font-size: 1.2em;
                }
                
                .players-grid.compact {
                    display: grid;
                    gap: 15px;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                }
                
                .players-grid.compact .player-tile {
                    background: white;
                    border-radius: 10px;
                    padding: 15px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    text-align: center;
                }
                
                .players-grid.compact .player-tile.current-player {
                    border: 3px solid #4CAF50;
                    background: #f8fff8;
                }
                
                .players-grid.compact .player-name {
                    font-size: 1.1em;
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: #333;
                }
                
                .players-grid.compact .player-score {
                    font-size: 2em;
                    font-weight: bold;
                    color: #667eea;
                }
                
                .current-player-badge {
                    background: #4CAF50;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.8em;
                    margin-left: 8px;
                }
                
                .last-updated {
                    text-align: center;
                    margin-top: 30px;
                    color: #666;
                }
            </style>
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
                        playersGrid.innerHTML = generatePlayerViewTiles(playerId);
                    }
                    
                    // Update timestamp
                    const lastUpdated = document.getElementById('lastUpdated');
                    if (lastUpdated) {
                        lastUpdated.textContent = new Date().toLocaleTimeString();
                    }
                }
            });
        }
        
        console.log('Player view displayed');
    }
}

function generatePlayerViewTiles(currentPlayerId) {
    return players.map(player => {
        const isCurrentPlayer = player.id === currentPlayerId;
        return `
            <div class="player-tile ${isCurrentPlayer ? 'current-player' : ''}" data-player-id="${player.id}">
                <div class="player-name">
                    ${player.name}
                    ${isCurrentPlayer ? '<span class="current-player-badge">You</span>' : ''}
                </div>
                <div class="player-score">${player.score}</div>
            </div>
        `;
    }).join('');
}

function changeScore(playerId, amount) {
    const player = players.find(p => p.id === playerId);
    if (player) {
        player.score += amount;
        updateScoreDisplay(playerId);
        console.log(`${player.name} score changed by ${amount} to ${player.score}`);
        
        // Update Firebase
        if (typeof database !== 'undefined' && database && currentSession) {
            const playerRef = database.ref(`sessions/${currentSession.code}/players/${playerId}`);
            playerRef.set(player);
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
            const playerRef = database.ref(`sessions/${currentSession.code}/players/${playerId}`);
            playerRef.set(player);
        }
    }
}

function showSessionCode() {
    const message = `🎮 Session Code: ${currentSession.code}\n\n📱 Share this code with other players!\n\n🌐 They can visit: https://kappter.github.io/kappscore/\nThen click "Join Session" and enter this code.`;
    alert(message);
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
            const playersObj = {};
            players.forEach(player => {
                playersObj[player.id] = player;
            });
            const sessionRef = database.ref(`sessions/${currentSession.code}/players`);
            sessionRef.set(playersObj);
        }
    }
}

function copySessionCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        showMessage('Session code copied to clipboard!', 'success');
    }).catch(() => {
        showMessage('Could not copy code. Please copy manually: ' + code, 'error');
    });
}

function goHome() {
    formSubmitted = false;
    currentSession = null;
    players = [];
    location.reload();
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        max-width: 400px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
    `;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (document.body.contains(messageDiv)) {
            document.body.removeChild(messageDiv);
        }
    }, 5000);
}

function generateSessionCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

console.log('GameScore Pro loaded - COMPLETE VERSION');

