// GameScore Pro - Enhanced with Reports and Win Detection
console.log('GameScore Pro starting...');

let currentSession = null;
let players = [];
let formSubmitted = false;
let currentPlayerId = null; // Track which player this client is
let scoreHistory = []; // Track score changes over time

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
                targetScore: parseFloat(document.getElementById('targetScore').value) || 500,
                allowDecimals: document.querySelector('input[name="allowDecimals"]')?.checked || false,
                playAfterTarget: document.querySelector('input[name="playAfterTarget"]')?.checked || false,
                createdAt: new Date().toISOString(),
                gameEnded: false,
                winner: null
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
            
            // Initialize score history
            scoreHistory = [{
                timestamp: new Date().toISOString(),
                scores: players.reduce((acc, player) => {
                    acc[player.id] = player.score;
                    return acc;
                }, {})
            }];
            
            // Set current player as scorekeeper (player1)
            currentPlayerId = 'player1';
            
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
                    scoreHistory: scoreHistory,
                    lastUpdated: new Date().toISOString()
                });
                console.log('Session saved to Firebase');
            }
            
            // Show success screen with Start Scoring button
            showSessionSuccess();
        });
    }
    
    // Join form
    const joinForm = document.getElementById('joinSessionForm');
    if (joinForm) {
        joinForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get values directly from form elements
            const codeInput = joinForm.querySelector('input[type="text"]') || joinForm.querySelector('input[placeholder*="code"]') || joinForm.querySelector('input[placeholder*="Code"]');
            const nameInput = joinForm.querySelector('input[placeholder*="name"]') || joinForm.querySelector('input[placeholder*="Name"]') || joinForm.querySelectorAll('input[type="text"]')[1];
            
            const joinCode = codeInput ? codeInput.value.trim().toUpperCase() : '';
            const playerName = nameInput ? nameInput.value.trim() : '';
            
            console.log('Join attempt:', { joinCode, playerName });
            
            if (!joinCode || !playerName) {
                alert('Please enter both session code and your name');
                return;
            }
            
            if (typeof database !== 'undefined' && database) {
                const sessionRef = database.ref(`sessions/${joinCode}`);
                sessionRef.once('value').then(snapshot => {
                    if (snapshot.exists()) {
                        const sessionData = snapshot.val();
                        currentSession = sessionData.metadata;
                        players = Object.values(sessionData.players || {});
                        scoreHistory = sessionData.scoreHistory || [];
                        
                        // Find or assign player
                        let assignedPlayer = players.find(p => p.name === playerName);
                        if (!assignedPlayer) {
                            assignedPlayer = players.find(p => p.name.startsWith('Player '));
                            if (assignedPlayer) {
                                assignedPlayer.name = playerName;
                                // Update in Firebase
                                const playerRef = database.ref(`sessions/${joinCode}/players/${assignedPlayer.id}`);
                                playerRef.set(assignedPlayer);
                                
                                // Record name change in history
                                recordScoreChange('nameChange', assignedPlayer.id, assignedPlayer.name);
                            }
                        }
                        
                        if (assignedPlayer) {
                            currentPlayerId = assignedPlayer.id; // Set current player ID
                            alert(`Successfully joined session ${joinCode}!\\n\\nYou are: ${assignedPlayer.name}\\n\\nYou can now see live score updates from the scorekeeper.`);
                            showPlayerView(assignedPlayer.id);
                        } else {
                            alert('Session is full');
                        }
                    } else {
                        alert('Session not found. Check the code and try again.');
                    }
                }).catch(() => {
                    alert('Failed to join session. Try again.');
                });
            } else {
                alert('Cannot join - Firebase not available');
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
                    <p><strong>Target Score:</strong> ${currentSession.targetScore}</p>
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
    showSimpleScoringInterface();
}

function showSimpleScoringInterface() {
    const createPage = document.getElementById('createSessionPage');
    if (createPage) {
        createPage.innerHTML = `
            <div class="scoring-interface">
                <div class="scoring-header">
                    <h2>🎮 Scorekeeper Mode</h2>
                    <p><strong>Session: ${currentSession.code}</strong> | ${currentSession.name}</p>
                    <p>Target Score: ${currentSession.targetScore} | Managing ${currentSession.playerCount} players</p>
                    ${currentSession.gameEnded ? `<div class="game-ended">🏆 Game Won by ${currentSession.winner}!</div>` : ''}
                </div>
                
                <div class="players-list">
                    ${generateSimplePlayerList()}
                </div>
                
                <div class="scoring-actions">
                    <button onclick="showSessionCode()" class="action-btn">📱 Share Code</button>
                    <button onclick="generateReport()" class="action-btn">📊 View Report</button>
                    <button onclick="resetAllScores()" class="action-btn">🔄 Reset Scores</button>
                    <button onclick="goHome()" class="action-btn">🏠 End Game</button>
                </div>
            </div>
            
            <style>
                .scoring-interface {
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                .scoring-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: #f0f2f5;
                    border-radius: 10px;
                }
                
                .scoring-header h2 {
                    color: #333;
                    margin-bottom: 10px;
                }
                
                .game-ended {
                    background: #4CAF50;
                    color: white;
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 15px;
                    font-size: 1.2em;
                    font-weight: bold;
                }
                
                .players-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .player-card {
                    background: white;
                    border: 2px solid #ddd;
                    border-radius: 10px;
                    padding: 20px;
                    text-align: center;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    position: relative;
                }
                
                .player-card.winner {
                    border-color: #FFD700;
                    background: #FFFACD;
                }
                
                .winner-badge {
                    position: absolute;
                    top: -10px;
                    right: -10px;
                    background: #FFD700;
                    color: #333;
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 0.8em;
                    font-weight: bold;
                }
                
                .player-name {
                    font-size: 1.2em;
                    font-weight: bold;
                    margin-bottom: 15px;
                    background: none;
                    border: none;
                    width: 100%;
                    text-align: center;
                    cursor: text;
                }
                
                .player-name:focus {
                    outline: 2px solid #4CAF50;
                    border-radius: 4px;
                }
                
                .player-score {
                    font-size: 2.5em;
                    font-weight: bold;
                    color: #667eea;
                    margin: 15px 0;
                }
                
                .score-controls {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 15px;
                    flex-wrap: wrap;
                }
                
                .score-btn {
                    padding: 8px 12px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    min-width: 45px;
                    font-size: 0.9em;
                }
                
                .score-btn.add {
                    background: #4CAF50;
                    color: white;
                }
                
                .score-btn.subtract {
                    background: #f44336;
                    color: white;
                }
                
                .score-btn:hover {
                    opacity: 0.8;
                }
                
                .custom-input {
                    width: 50px;
                    padding: 5px;
                    text-align: center;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    margin: 0 3px;
                }
                
                .scoring-actions {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    flex-wrap: wrap;
                }
                
                .action-btn {
                    background: #2196F3;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                }
                
                .action-btn:hover {
                    background: #1976D2;
                }
            </style>
        `;
    }
}

function generateSimplePlayerList() {
    return players.map(player => {
        const isWinner = currentSession.gameEnded && currentSession.winner === player.name;
        const hasReachedTarget = player.score >= currentSession.targetScore;
        
        return `
            <div class="player-card ${isWinner ? 'winner' : ''}" data-player-id="${player.id}">
                ${isWinner ? '<div class="winner-badge">🏆 WINNER</div>' : ''}
                ${hasReachedTarget && !currentSession.gameEnded ? '<div class="winner-badge">🎯 TARGET</div>' : ''}
                
                <input type="text" class="player-name" value="${player.name}" 
                       onblur="updatePlayerName('${player.id}', this.value)">
                
                <div class="player-score" id="score-${player.id}">${player.score}</div>
                
                <div class="score-controls">
                    <button class="score-btn subtract" onclick="changeScore('${player.id}', -10)">-10</button>
                    <button class="score-btn subtract" onclick="changeScore('${player.id}', -5)">-5</button>
                    <button class="score-btn subtract" onclick="changeScore('${player.id}', -1)">-1</button>
                    <input type="number" class="custom-input" id="custom-${player.id}" value="1" step="${currentSession.allowDecimals ? '0.1' : '1'}">
                    <button class="score-btn add" onclick="changeScoreCustom('${player.id}', false)">-</button>
                    <button class="score-btn add" onclick="changeScoreCustom('${player.id}', true)">+</button>
                    <button class="score-btn add" onclick="changeScore('${player.id}', 1)">+1</button>
                    <button class="score-btn add" onclick="changeScore('${player.id}', 5)">+5</button>
                    <button class="score-btn add" onclick="changeScore('${player.id}', 10)">+10</button>
                </div>
            </div>
        `;
    }).join('');
}

function showPlayerView(playerId) {
    const joinPage = document.getElementById('joinSessionPage');
    if (joinPage) {
        joinPage.innerHTML = `
            <div class="player-view">
                <div class="player-header">
                    <h2>👁️ Player View</h2>
                    <p><strong>Session: ${currentSession.code}</strong> | ${currentSession.name}</p>
                    <p>Target Score: ${currentSession.targetScore} | Scores update automatically</p>
                    ${currentSession.gameEnded ? `<div class="game-ended">🏆 Game Won by ${currentSession.winner}!</div>` : ''}
                </div>
                
                <div class="players-grid">
                    ${generatePlayerViewTiles(playerId)}
                </div>
                
                <div class="player-actions">
                    <button onclick="generateReport()" class="action-btn">📊 View Report</button>
                    <button onclick="goHome()" class="action-btn">🚪 Leave Session</button>
                </div>
                
                <div class="last-updated">
                    <small>Last updated: <span id="lastUpdated">${new Date().toLocaleTimeString()}</span></small>
                </div>
            </div>
            
            <style>
                .player-view {
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                .player-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: #e3f2fd;
                    border-radius: 10px;
                }
                
                .game-ended {
                    background: #4CAF50;
                    color: white;
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 15px;
                    font-size: 1.2em;
                    font-weight: bold;
                }
                
                .players-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 30px;
                }
                
                .player-tile {
                    background: white;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    padding: 15px;
                    text-align: center;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    position: relative;
                }
                
                .player-tile.current-player {
                    border-color: #4CAF50;
                    background: #f8fff8;
                }
                
                .player-tile.winner {
                    border-color: #FFD700;
                    background: #FFFACD;
                }
                
                .player-tile .player-name {
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: #333;
                }
                
                .player-tile .player-score {
                    font-size: 2em;
                    font-weight: bold;
                    color: #667eea;
                }
                
                .current-player-badge {
                    background: #4CAF50;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 0.8em;
                    margin-left: 5px;
                }
                
                .winner-badge {
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    background: #FFD700;
                    color: #333;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.7em;
                    font-weight: bold;
                }
                
                .target-badge {
                    position: absolute;
                    top: -8px;
                    left: -8px;
                    background: #FF9800;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.7em;
                    font-weight: bold;
                }
                
                .player-actions {
                    text-align: center;
                    margin: 20px 0;
                }
                
                .action-btn {
                    background: #2196F3;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 0 10px;
                }
                
                .action-btn:hover {
                    background: #1976D2;
                }
                
                .last-updated {
                    text-align: center;
                    color: #666;
                }
            </style>
        `;
        
        // Listen for real-time updates
        if (typeof database !== 'undefined' && database && currentSession) {
            const sessionRef = database.ref(`sessions/${currentSession.code}`);
            sessionRef.on('value', (snapshot) => {
                if (snapshot.exists()) {
                    const sessionData = snapshot.val();
                    const updatedPlayers = Object.values(sessionData.players || {});
                    const updatedSession = sessionData.metadata || currentSession;
                    
                    players = updatedPlayers;
                    currentSession = updatedSession;
                    scoreHistory = sessionData.scoreHistory || scoreHistory;
                    
                    // Update the display
                    const playersGrid = document.querySelector('.players-grid');
                    if (playersGrid) {
                        playersGrid.innerHTML = generatePlayerViewTiles(playerId);
                    }
                    
                    // Update header if game ended
                    const playerHeader = document.querySelector('.player-header');
                    if (playerHeader && currentSession.gameEnded) {
                        const existingGameEnded = playerHeader.querySelector('.game-ended');
                        if (!existingGameEnded) {
                            playerHeader.innerHTML += `<div class="game-ended">🏆 Game Won by ${currentSession.winner}!</div>`;
                        }
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
}

function generatePlayerViewTiles(currentPlayerId) {
    return players.map(player => {
        const isCurrentPlayer = player.id === currentPlayerId;
        const isWinner = currentSession.gameEnded && currentSession.winner === player.name;
        const hasReachedTarget = player.score >= currentSession.targetScore;
        
        return `
            <div class="player-tile ${isCurrentPlayer ? 'current-player' : ''} ${isWinner ? 'winner' : ''}" data-player-id="${player.id}">
                ${isWinner ? '<div class="winner-badge">🏆</div>' : ''}
                ${hasReachedTarget && !currentSession.gameEnded ? '<div class="target-badge">🎯</div>' : ''}
                
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
    if (player && !currentSession.gameEnded) {
        const oldScore = player.score;
        player.score += amount;
        
        // Round to appropriate decimal places
        if (!currentSession.allowDecimals) {
            player.score = Math.round(player.score);
        } else {
            player.score = Math.round(player.score * 10) / 10;
        }
        
        updateScoreDisplay(playerId);
        console.log(`${player.name} score changed by ${amount} to ${player.score}`);
        
        // Record score change
        recordScoreChange('scoreChange', playerId, amount, oldScore, player.score);
        
        // Check for win condition
        checkWinCondition();
        
        // Update Firebase
        if (typeof database !== 'undefined' && database && currentSession) {
            const sessionRef = database.ref(`sessions/${currentSession.code}`);
            const playersObj = {};
            players.forEach(p => {
                playersObj[p.id] = p;
            });
            sessionRef.update({
                players: playersObj,
                metadata: currentSession,
                scoreHistory: scoreHistory,
                lastUpdated: new Date().toISOString()
            });
        }
    }
}

function changeScoreCustom(playerId, isAdd) {
    const customInput = document.getElementById(`custom-${playerId}`);
    const amount = parseFloat(customInput.value) || 1;
    changeScore(playerId, isAdd ? amount : -amount);
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
    if (player && newName.trim() && newName.trim() !== player.name) {
        const oldName = player.name;
        player.name = newName.trim();
        console.log(`Player ${playerId} renamed from ${oldName} to ${player.name}`);
        
        // Record name change
        recordScoreChange('nameChange', playerId, newName, oldName);
        
        // Update Firebase
        if (typeof database !== 'undefined' && database && currentSession) {
            const sessionRef = database.ref(`sessions/${currentSession.code}`);
            const playersObj = {};
            players.forEach(p => {
                playersObj[p.id] = p;
            });
            sessionRef.update({
                players: playersObj,
                scoreHistory: scoreHistory,
                lastUpdated: new Date().toISOString()
            });
        }
    }
}

function recordScoreChange(type, playerId, value, oldValue = null, newValue = null) {
    const player = players.find(p => p.id === playerId);
    const change = {
        timestamp: new Date().toISOString(),
        type: type,
        playerId: playerId,
        playerName: player ? player.name : 'Unknown',
        value: value
    };
    
    if (type === 'scoreChange') {
        change.oldScore = oldValue;
        change.newScore = newValue;
        change.amount = value;
    } else if (type === 'nameChange') {
        change.oldName = oldValue;
        change.newName = value;
    }
    
    // Add current scores snapshot
    change.scores = players.reduce((acc, p) => {
        acc[p.id] = p.score;
        return acc;
    }, {});
    
    scoreHistory.push(change);
}

function checkWinCondition() {
    if (currentSession.gameEnded) return;
    
    const playersAtTarget = players.filter(p => p.score >= currentSession.targetScore);
    
    if (playersAtTarget.length > 0) {
        if (!currentSession.playAfterTarget) {
            // End game immediately when first player reaches target
            const winner = playersAtTarget.reduce((prev, current) => 
                (prev.score > current.score) ? prev : current
            );
            
            currentSession.gameEnded = true;
            currentSession.winner = winner.name;
            currentSession.endedAt = new Date().toISOString();
            
            // Record game end
            recordScoreChange('gameEnd', winner.id, winner.score);
            
            alert(`🏆 GAME WON! 🏆\\n\\n${winner.name} wins with ${winner.score} points!\\n\\nTarget was ${currentSession.targetScore} points.`);
            
            // Refresh the interface to show winner
            if (currentPlayerId === 'player1') {
                showSimpleScoringInterface();
            }
        }
    }
}

function generateReport() {
    const reportWindow = window.open('', '_blank', 'width=1000,height=800');
    
    const playerColors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
        '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
    ];
    
    // Prepare data for line chart
    const chartData = prepareChartData(playerColors);
    
    reportWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>GameScore Pro - Session Report</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    background: #f5f5f5;
                }
                .report-container {
                    max-width: 1000px;
                    margin: 0 auto;
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .report-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #eee;
                }
                .report-title {
                    color: #333;
                    margin-bottom: 10px;
                }
                .session-info {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .info-card {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                }
                .info-card h4 {
                    margin: 0 0 10px 0;
                    color: #666;
                }
                .info-card .value {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: #333;
                }
                .chart-container {
                    margin: 30px 0;
                    height: 400px;
                }
                .final-scores {
                    margin: 30px 0;
                }
                .scores-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                }
                .score-card {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                    border-left: 4px solid #ddd;
                }
                .score-card.winner {
                    background: #fff3cd;
                    border-left-color: #ffc107;
                }
                .score-card .player-name {
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .score-card .player-score {
                    font-size: 1.8em;
                    color: #333;
                }
                .game-timeline {
                    margin: 30px 0;
                }
                .timeline-item {
                    padding: 10px;
                    margin: 5px 0;
                    background: #f8f9fa;
                    border-radius: 5px;
                    border-left: 3px solid #007bff;
                }
                .print-btn {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 10px 5px;
                }
                .print-btn:hover {
                    background: #0056b3;
                }
                @media print {
                    .print-btn { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="report-container">
                <div class="report-header">
                    <h1 class="report-title">🎮 GameScore Pro - Session Report</h1>
                    <p><strong>Session:</strong> ${currentSession.code} | <strong>Game:</strong> ${currentSession.name}</p>
                    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                </div>
                
                <div class="session-info">
                    <div class="info-card">
                        <h4>Players</h4>
                        <div class="value">${currentSession.playerCount}</div>
                    </div>
                    <div class="info-card">
                        <h4>Target Score</h4>
                        <div class="value">${currentSession.targetScore}</div>
                    </div>
                    <div class="info-card">
                        <h4>Game Duration</h4>
                        <div class="value">${calculateGameDuration()}</div>
                    </div>
                    <div class="info-card">
                        <h4>Total Score Changes</h4>
                        <div class="value">${scoreHistory.filter(h => h.type === 'scoreChange').length}</div>
                    </div>
                </div>
                
                <div class="chart-container">
                    <h3>📈 Score Progression Over Time</h3>
                    <canvas id="scoreChart"></canvas>
                </div>
                
                <div class="final-scores">
                    <h3>🏆 Final Scores</h3>
                    <div class="scores-grid">
                        ${generateFinalScoresHTML(playerColors)}
                    </div>
                </div>
                
                <div class="game-timeline">
                    <h3>📋 Game Timeline</h3>
                    ${generateTimelineHTML()}
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <button class="print-btn" onclick="window.print()">🖨️ Print Report</button>
                    <button class="print-btn" onclick="window.close()">❌ Close</button>
                </div>
            </div>
            
            <script>
                // Create the line chart
                const ctx = document.getElementById('scoreChart').getContext('2d');
                new Chart(ctx, ${JSON.stringify(chartData)});
            </script>
        </body>
        </html>
    `);
    
    reportWindow.document.close();
}

function prepareChartData(playerColors) {
    // Get all unique timestamps
    const timestamps = [...new Set(scoreHistory.map(h => h.timestamp))].sort();
    
    // Create datasets for each player
    const datasets = players.map((player, index) => {
        const data = [];
        let currentScore = currentSession.startingScore;
        
        timestamps.forEach(timestamp => {
            const change = scoreHistory.find(h => h.timestamp === timestamp && h.playerId === player.id && h.type === 'scoreChange');
            if (change) {
                currentScore = change.newScore;
            }
            data.push(currentScore);
        });
        
        return {
            label: player.name,
            data: data,
            borderColor: playerColors[index % playerColors.length],
            backgroundColor: playerColors[index % playerColors.length] + '20',
            fill: false,
            tension: 0.1,
            pointRadius: 4,
            pointHoverRadius: 6
        };
    });
    
    return {
        type: 'line',
        data: {
            labels: timestamps.map((_, index) => `Move ${index + 1}`),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Player Score Progression'
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
                        text: 'Game Progress'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    };
}

function generateFinalScoresHTML(playerColors) {
    return players
        .sort((a, b) => b.score - a.score)
        .map((player, index) => {
            const isWinner = currentSession.gameEnded && currentSession.winner === player.name;
            const color = playerColors[players.findIndex(p => p.id === player.id) % playerColors.length];
            
            return `
                <div class="score-card ${isWinner ? 'winner' : ''}" style="border-left-color: ${color}">
                    <div class="player-name">
                        ${isWinner ? '🏆 ' : `#${index + 1} `}${player.name}
                    </div>
                    <div class="player-score">${player.score}</div>
                </div>
            `;
        }).join('');
}

function generateTimelineHTML() {
    return scoreHistory
        .filter(h => h.type === 'scoreChange' || h.type === 'gameEnd')
        .slice(-20) // Show last 20 events
        .reverse()
        .map(change => {
            const time = new Date(change.timestamp).toLocaleTimeString();
            let description = '';
            
            if (change.type === 'scoreChange') {
                const sign = change.amount > 0 ? '+' : '';
                description = `${change.playerName}: ${change.oldScore} → ${change.newScore} (${sign}${change.amount})`;
            } else if (change.type === 'gameEnd') {
                description = `🏆 Game won by ${change.playerName} with ${change.value} points!`;
            }
            
            return `
                <div class="timeline-item">
                    <strong>${time}</strong> - ${description}
                </div>
            `;
        }).join('');
}

function calculateGameDuration() {
    if (scoreHistory.length < 2) return '0 min';
    
    const start = new Date(scoreHistory[0].timestamp);
    const end = currentSession.gameEnded ? 
        new Date(currentSession.endedAt) : 
        new Date(scoreHistory[scoreHistory.length - 1].timestamp);
    
    const diffMs = end - start;
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
        return `${diffMins} min`;
    } else {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h ${mins}m`;
    }
}

function showSessionCode() {
    const message = `🎮 Session Code: ${currentSession.code}\n\n📱 Share this code with other players!\n\n🌐 They can visit: https://kappter.github.io/kappscore/\nThen click "Join Session" and enter this code.`;
    alert(message);
}

function resetAllScores() {
    if (confirm('Reset all scores to starting score? This will clear the game history.')) {
        players.forEach(player => {
            player.score = currentSession.startingScore;
            updateScoreDisplay(player.id);
        });
        
        // Reset game state
        currentSession.gameEnded = false;
        currentSession.winner = null;
        
        // Reset score history
        scoreHistory = [{
            timestamp: new Date().toISOString(),
            type: 'gameReset',
            scores: players.reduce((acc, player) => {
                acc[player.id] = player.score;
                return acc;
            }, {})
        }];
        
        console.log('All scores reset');
        
        // Update Firebase
        if (typeof database !== 'undefined' && database && currentSession) {
            const sessionRef = database.ref(`sessions/${currentSession.code}`);
            const playersObj = {};
            players.forEach(player => {
                playersObj[player.id] = player;
            });
            sessionRef.update({
                players: playersObj,
                metadata: currentSession,
                scoreHistory: scoreHistory,
                lastUpdated: new Date().toISOString()
            });
        }
        
        // Refresh interface
        if (currentPlayerId === 'player1') {
            showSimpleScoringInterface();
        }
    }
}

function copySessionCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        alert('Session code copied to clipboard!');
    }).catch(() => {
        alert('Could not copy code. Please copy manually: ' + code);
    });
}

function goHome() {
    formSubmitted = false;
    currentSession = null;
    players = [];
    currentPlayerId = null;
    scoreHistory = [];
    location.reload();
}

function generateSessionCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

console.log('GameScore Pro loaded - ENHANCED WITH REPORTS AND WIN DETECTION');

