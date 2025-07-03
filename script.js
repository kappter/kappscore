// GameScore Pro - Modern Implementation with Cross-Browser Session Sharing
console.log('GameScore Pro starting...');

// Global variables (avoid conflicts with firebase-config.js)
let currentSession = null;
let currentPlayerId = null;
let currentPlayerName = "Guest";

// Session sharing via URL parameters
function getSessionFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('session');
}

function shareSessionURL(sessionCode) {
    const baseURL = window.location.origin + window.location.pathname;
    return `${baseURL}?session=${sessionCode}`;
}

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
    } else {
        // Fallback to alert if no message container
        alert(text);
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

// Enhanced session management with cross-browser sharing
function createSession() {
    const sessionName = document.getElementById('sessionName')?.value.trim() || 'Game Session';
    const playerCount = parseInt(document.getElementById('playerCountDisplay')?.textContent) || 2;
    const startingScore = parseInt(document.getElementById('startingScore')?.value) || 0;
    const allowDecimals = document.getElementById('allowDecimals')?.checked || false;
    const targetScore = parseInt(document.getElementById('targetScore')?.value) || null;
    const playAfterTarget = document.getElementById('playAfterTarget')?.checked || false;

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
        teams: {},
        isHost: true,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        shareURL: shareSessionURL(sessionCode)
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

    // Save to localStorage AND sessionStorage for better sharing
    const sessionData = JSON.stringify(currentSession);
    localStorage.setItem(`gameScore_session_${sessionCode}`, sessionData);
    sessionStorage.setItem(`gameScore_session_${sessionCode}`, sessionData);
    
    // Also save to a global sessions list
    const allSessions = JSON.parse(localStorage.getItem('gameScore_allSessions') || '{}');
    allSessions[sessionCode] = {
        code: sessionCode,
        name: sessionName,
        createdAt: Date.now(),
        lastUpdated: Date.now()
    };
    localStorage.setItem('gameScore_allSessions', JSON.stringify(allSessions));

    console.log('Session created:', currentSession);
    updateSessionSuccessPage();
    showPage('sessionSuccess');
}

function updateSessionSuccessPage() {
    if (!currentSession) return;

    const elements = {
        displaySessionCode: document.getElementById('displaySessionCode'),
        displaySessionName: document.getElementById('displaySessionName'),
        displayPlayerCount: document.getElementById('displayPlayerCount'),
        displayStartingScore: document.getElementById('displayStartingScore'),
        displayTargetScore: document.getElementById('displayTargetScore'),
        instructionSessionCode: document.getElementById('instructionSessionCode')
    };

    if (elements.displaySessionCode) elements.displaySessionCode.textContent = currentSession.code;
    if (elements.displaySessionName) elements.displaySessionName.textContent = currentSession.name;
    if (elements.displayPlayerCount) elements.displayPlayerCount.textContent = currentSession.playerCount;
    if (elements.displayStartingScore) elements.displayStartingScore.textContent = currentSession.startingScore;
    if (elements.displayTargetScore) elements.displayTargetScore.textContent = currentSession.targetScore || 'None';
    if (elements.instructionSessionCode) elements.instructionSessionCode.textContent = currentSession.code;
}

function joinSession(sessionCode, playerName) {
    console.log(`Attempting to join session ${sessionCode} as ${playerName}`);
    
    // Try multiple storage locations
    let sessionData = localStorage.getItem(`gameScore_session_${sessionCode}`) ||
                     sessionStorage.getItem(`gameScore_session_${sessionCode}`);
    
    if (sessionData) {
        try {
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
                    currentSession.isHost = false; // This player is not the host
                    
                    // Save updated session
                    const updatedData = JSON.stringify(currentSession);
                    localStorage.setItem(`gameScore_session_${sessionCode}`, updatedData);
                    sessionStorage.setItem(`gameScore_session_${sessionCode}`, updatedData);
                    
                    showMessage(`Joined as ${playerName}`, 'success');
                } else {
                    showMessage('Session is full', 'error');
                    return;
                }
            }
            
            updateScorekeeperInterface();
            showPage('scorekeeper');
        } catch (error) {
            console.error('Error parsing session data:', error);
            showMessage('Session data is corrupted. Please try again.', 'error');
        }
    } else {
        // Enhanced error message with suggestions
        const allSessions = JSON.parse(localStorage.getItem('gameScore_allSessions') || '{}');
        const availableSessions = Object.keys(allSessions);
        
        let errorMessage = `Session "${sessionCode}" not found.`;
        
        if (availableSessions.length > 0) {
            errorMessage += `\n\nAvailable sessions on this device: ${availableSessions.join(', ')}`;
        } else {
            errorMessage += '\n\nNo sessions found on this device. Make sure you\'re using the same browser/device where the session was created, or ask the host to share the session URL.';
        }
        
        showMessage(errorMessage, 'error');
        console.log('Available sessions:', availableSessions);
    }
}

function updateScorekeeperInterface() {
    if (!currentSession) return;

    // Update header info
    const elements = {
        scorekeeperSessionCode: document.getElementById('scorekeeperSessionCode'),
        scorekeeperSessionName: document.getElementById('scorekeeperSessionName'),
        scorekeeperTargetScore: document.getElementById('scorekeeperTargetScore'),
        scorekeeperPlayerCount: document.getElementById('scorekeeperPlayerCount')
    };

    if (elements.scorekeeperSessionCode) elements.scorekeeperSessionCode.textContent = currentSession.code;
    if (elements.scorekeeperSessionName) elements.scorekeeperSessionName.textContent = currentSession.name;
    if (elements.scorekeeperTargetScore) elements.scorekeeperTargetScore.textContent = currentSession.targetScore || 'None';
    if (elements.scorekeeperPlayerCount) elements.scorekeeperPlayerCount.textContent = currentSession.players.length;

    // Update players grid
    const playersContainer = document.getElementById('playersContainer');
    if (playersContainer) {
        playersContainer.innerHTML = '';

        currentSession.players.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            playerCard.innerHTML = `
                <div class="player-header">
                    <div class="player-name" onclick="editPlayerName('${player.id}', '${player.name}')" style="cursor: pointer; text-decoration: underline;" title="Click to edit name">${player.name}</div>
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
                <div class="player-actions">
                    <button class="btn btn-secondary" onclick="resetPlayerScore('${player.id}')" style="font-size: 12px; padding: 4px 8px;">Reset</button>
                    <button class="btn btn-secondary" onclick="updatePlayerColor('${player.id}')" style="font-size: 12px; padding: 4px 8px;">Color</button>
                </div>
            `;
            playersContainer.appendChild(playerCard);
        });
    }

    // Show team scores if teams exist
    if (Object.keys(currentSession.teams).length > 0) {
        updateTeamScores();
    }
}

// Player management functions
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

        // Save to both storage types
        const sessionData = JSON.stringify(currentSession);
        localStorage.setItem(`gameScore_session_${currentSession.code}`, sessionData);
        sessionStorage.setItem(`gameScore_session_${currentSession.code}`, sessionData);

        updateScorekeeperInterface();
        showMessage(`Name updated to ${newName}!`, 'success');
    } else {
        showMessage('Only the host can edit other players\' names.', 'error');
    }
}

async function updatePlayerColor(playerId) {
    if (!currentSession) return;

    const colors = ['#4f46e5', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
    const colorNames = ['Blue', 'Green', 'Red', 'Orange', 'Purple', 'Cyan', 'Pink', 'Teal'];
    
    let colorChoice = prompt(`Choose a color for the player:\n${colorNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}\n\nEnter number (1-${colors.length}):`);
    
    if (colorChoice === null) return;
    
    const colorIndex = parseInt(colorChoice) - 1;
    if (colorIndex >= 0 && colorIndex < colors.length) {
        const playerIndex = currentSession.players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            currentSession.players[playerIndex].color = colors[colorIndex];
            currentSession.lastUpdated = Date.now();

            // Save to both storage types
            const sessionData = JSON.stringify(currentSession);
            localStorage.setItem(`gameScore_session_${currentSession.code}`, sessionData);
            sessionStorage.setItem(`gameScore_session_${currentSession.code}`, sessionData);

            updateScorekeeperInterface();
            showMessage(`Color updated to ${colorNames[colorIndex]}!`, 'success');
        }
    } else {
        showMessage('Invalid color choice.', 'error');
    }
}

async function resetPlayerScore(playerId) {
    if (!currentSession || !currentSession.isHost) return;

    if (confirm('Are you sure you want to reset this player\'s score?')) {
        const playerIndex = currentSession.players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            currentSession.players[playerIndex].score = currentSession.startingScore;
            currentSession.players[playerIndex].history.push({
                score: currentSession.startingScore,
                change: 0,
                timestamp: Date.now()
            });
            currentSession.lastUpdated = Date.now();

            // Save to both storage types
            const sessionData = JSON.stringify(currentSession);
            localStorage.setItem(`gameScore_session_${currentSession.code}`, sessionData);
            sessionStorage.setItem(`gameScore_session_${currentSession.code}`, sessionData);

            updateScorekeeperInterface();
            showMessage(`${currentSession.players[playerIndex].name}'s score reset!`, 'success');
        }
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

function createTeam() {
    if (!currentSession || !currentSession.isHost) {
        showMessage('Only the host can create teams.', 'error');
        return;
    }

    const teamName = prompt('Enter team name:');
    if (teamName && teamName.trim()) {
        const teamId = `team_${Date.now()}`;
        currentSession.teams[teamId] = {
            id: teamId,
            name: teamName.trim(),
            players: [],
            color: getRandomColor()
        };

        // Save to both storage types
        const sessionData = JSON.stringify(currentSession);
        localStorage.setItem(`gameScore_session_${currentSession.code}`, sessionData);
        sessionStorage.setItem(`gameScore_session_${currentSession.code}`, sessionData);

        updateTeamScores();
        showMessage(`Team "${teamName}" created!`, 'success');
    }
}

function addPlayerToTeam(playerId, teamId) {
    if (!currentSession || !currentSession.isHost) return;

    // Remove player from other teams first
    Object.values(currentSession.teams).forEach(team => {
        team.players = team.players.filter(id => id !== playerId);
    });

    // Add to new team
    if (currentSession.teams[teamId]) {
        currentSession.teams[teamId].players.push(playerId);
        
        // Save to both storage types
        const sessionData = JSON.stringify(currentSession);
        localStorage.setItem(`gameScore_session_${currentSession.code}`, sessionData);
        sessionStorage.setItem(`gameScore_session_${currentSession.code}`, sessionData);

        updateTeamScores();
    }
}

function updateTeamScores() {
    if (!currentSession || Object.keys(currentSession.teams).length === 0) return;

    let teamScoresHtml = '<div class="team-scores"><h3>Team Scores:</h3>';
    
    Object.values(currentSession.teams).forEach(team => {
        const teamScore = calculateTeamScore(team.players);
        const playerNames = team.players.map(id => {
            const player = currentSession.players.find(p => p.id === id);
            return player ? player.name : 'Unknown';
        }).join(', ');

        teamScoresHtml += `
            <div class="team-score-card" style="border-left: 4px solid ${team.color}">
                <div class="team-name">${team.name}</div>
                <div class="team-score">${teamScore}</div>
                <div class="team-players">${playerNames || 'No players'}</div>
            </div>
        `;
    });
    
    teamScoresHtml += '</div>';

    // Add team scores to the page
    let teamContainer = document.getElementById('teamScoresContainer');
    if (!teamContainer) {
        const playersContainer = document.getElementById('playersContainer');
        if (playersContainer && playersContainer.parentNode) {
            teamContainer = document.createElement('div');
            teamContainer.id = 'teamScoresContainer';
            playersContainer.parentNode.insertBefore(teamContainer, playersContainer.nextSibling);
        }
    }
    if (teamContainer) {
        teamContainer.innerHTML = teamScoresHtml;
    }
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

    // Save to both storage types
    if (currentSession.code) {
        const sessionData = JSON.stringify(currentSession);
        localStorage.setItem(`gameScore_session_${currentSession.code}`, sessionData);
        sessionStorage.setItem(`gameScore_session_${currentSession.code}`, sessionData);
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
window.editPlayerName = editPlayerName;
window.updatePlayerColor = updatePlayerColor;
window.resetPlayerScore = resetPlayerScore;
window.createTeam = createTeam;
window.addPlayerToTeam = addPlayerToTeam;

// Event handlers
function handleCreateSession(event) {
    event.preventDefault();
    console.log('Creating session...');
    createSession();
}

function handleJoinSession(event) {
    event.preventDefault();
    
    const joinCode = document.getElementById('joinCode')?.value.trim().toUpperCase();
    const playerName = document.getElementById('joinPlayerName')?.value.trim();
    
    if (joinCode && playerName) {
        console.log(`Attempting to join session ${joinCode} as ${playerName}`);
        joinSession(joinCode, playerName);
    } else {
        showMessage('Please enter both session code and your name.', 'error');
    }
}

function copySessionCode() {
    if (currentSession) {
        const shareURL = shareSessionURL(currentSession.code);
        navigator.clipboard.writeText(shareURL).then(() => {
            showMessage('Session URL copied to clipboard! Share this with other players.', 'success');
        }).catch(() => {
            showMessage(`Failed to copy URL. Please copy manually: ${shareURL}`, 'error');
        });
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, initializing...');

    // Check for session in URL
    const sessionFromURL = getSessionFromURL();
    if (sessionFromURL) {
        // Auto-fill join form if session code is in URL
        const joinCodeInput = document.getElementById('joinCode');
        if (joinCodeInput) {
            joinCodeInput.value = sessionFromURL;
            showPage('joinSession');
        }
    }

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
                    
                    // Save to both storage types
                    const sessionData = JSON.stringify(currentSession);
                    localStorage.setItem(`gameScore_session_${currentSession.code}`, sessionData);
                    sessionStorage.setItem(`gameScore_session_${currentSession.code}`, sessionData);
                    
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

