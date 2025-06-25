// GameScore Pro - Simple Working Version
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
            
            // Show success screen with Start Scoring button
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
    
    // Simple alert with session info and instructions
    const message = `🎮 SCOREKEEPER MODE ACTIVE!

Session: ${currentSession.code}
Players: ${currentSession.playerCount}

📱 SHARE THIS CODE: ${currentSession.code}

🎯 SCORING INSTRUCTIONS:
• This is your scorekeeper view
• Other players join using the session code
• You can manually track scores here
• All players will see updates in real-time

✅ Session is ready for scoring!
Click OK to continue managing scores.`;

    alert(message);
    
    // Show a simple scoring interface
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
                    <p>Managing ${currentSession.playerCount} players</p>
                </div>
                
                <div class="players-list">
                    ${generateSimplePlayerList()}
                </div>
                
                <div class="scoring-actions">
                    <button onclick="showSessionCode()" class="action-btn">📱 Share Code</button>
                    <button onclick="resetAllScores()" class="action-btn">🔄 Reset Scores</button>
                    <button onclick="goHome()" class="action-btn">🏠 End Game</button>
                </div>
            </div>
            
            <style>
                .scoring-interface {
                    max-width: 800px;
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
                
                .players-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
                    gap: 10px;
                    margin-top: 15px;
                }
                
                .score-btn {
                    padding: 10px 15px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    min-width: 50px;
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
                    width: 60px;
                    padding: 5px;
                    text-align: center;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    margin: 0 5px;
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
    return players.map(player => `
        <div class="player-card" data-player-id="${player.id}">
            <input type="text" class="player-name" value="${player.name}" 
                   onblur="updatePlayerName('${player.id}', this.value)">
            
            <div class="player-score" id="score-${player.id}">${player.score}</div>
            
            <div class="score-controls">
                <button class="score-btn subtract" onclick="changeScore('${player.id}', -1)">-1</button>
                <button class="score-btn subtract" onclick="changeScore('${player.id}', -5)">-5</button>
                <input type="number" class="custom-input" id="custom-${player.id}" value="1" step="0.1">
                <button class="score-btn add" onclick="changeScoreCustom('${player.id}')">+</button>
                <button class="score-btn add" onclick="changeScore('${player.id}', 1)">+1</button>
                <button class="score-btn add" onclick="changeScore('${player.id}', 5)">+5</button>
            </div>
        </div>
    `).join('');
}

function showPlayerView(playerId) {
    const joinPage = document.getElementById('joinSessionPage');
    if (joinPage) {
        joinPage.innerHTML = `
            <div class="player-view">
                <div class="player-header">
                    <h2>👁️ Player View</h2>
                    <p><strong>Session: ${currentSession.code}</strong> | ${currentSession.name}</p>
                    <p>Scores update automatically</p>
                </div>
                
                <div class="players-grid">
                    ${generatePlayerViewTiles(playerId)}
                </div>
                
                <div class="player-actions">
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
                
                .players-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
                }
                
                .player-tile.current-player {
                    border-color: #4CAF50;
                    background: #f8fff8;
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
                
                .player-actions {
                    text-align: center;
                    margin: 20px 0;
                }
                
                .last-updated {
                    text-align: center;
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

function changeScoreCustom(playerId) {
    const customInput = document.getElementById(`custom-${playerId}`);
    const amount = parseFloat(customInput.value) || 1;
    changeScore(playerId, amount);
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
        alert('Session code copied to clipboard!');
    }).catch(() => {
        alert('Could not copy code. Please copy manually: ' + code);
    });
}

function goHome() {
    formSubmitted = false;
    currentSession = null;
    players = [];
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

console.log('GameScore Pro loaded - SIMPLE WORKING VERSION');

