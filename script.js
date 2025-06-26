// GameScore Pro - Enhanced with Teams & Colors
console.log('GameScore Pro starting...');

let players = [];
let currentSession = null;
let scoreHistory = [];
let teams = [];
let currentPlayerId = null;
let isHost = false;

// Color palette for player tiles
const playerColors = [
    { name: 'Blue', value: '#2196F3', light: '#E3F2FD' },
    { name: 'Green', value: '#4CAF50', light: '#E8F5E9' },
    { name: 'Purple', value: '#9C27B0', light: '#F3E5F5' },
    { name: 'Orange', value: '#FF9800', light: '#FFF3E0' },
    { name: 'Red', value: '#F44336', light: '#FFEBEE' },
    { name: 'Teal', value: '#009688', light: '#E0F2F1' },
    { name: 'Pink', value: '#E91E63', light: '#FCE4EC' },
    { name: 'Indigo', value: '#3F51B5', light: '#E8EAF6' },
    { name: 'Cyan', value: '#00BCD4', light: '#E0F7FA' },
    { name: 'Amber', value: '#FFC107', light: '#FFF8E1' },
    { name: 'Deep Purple', value: '#673AB7', light: '#EDE7F6' },
    { name: 'Light Green', value: '#8BC34A', light: '#F1F8E9' }
];

document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    initializeApp();
});

function initializeApp() {
    console.log('Initializing app...');
    
    // Bind main navigation buttons
    const createBtn = document.querySelector('[onclick*="showPage"][onclick*="createSession"]');
    if (createBtn) {
        createBtn.addEventListener('click', () => showPage('createSessionPage'));
        console.log('Create button bound');
    }
    
    const joinBtn = document.querySelector('[onclick*="showPage"][onclick*="joinSession"]');
    if (joinBtn) {
        joinBtn.addEventListener('click', () => showPage('joinSessionPage'));
        console.log('Join button bound');
    }
    
    // Bind player count controls
    const increaseBtn = document.querySelector('[onclick*="changePlayerCount(1)"]');
    if (increaseBtn) {
        increaseBtn.addEventListener('click', () => changePlayerCount(1));
        console.log('Increase player button bound');
    }
    
    const decreaseBtn = document.querySelector('[onclick*="changePlayerCount(-1)"]');
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', () => changePlayerCount(-1));
        console.log('Decrease player button bound');
    }
    
    // Bind forms
    const createForm = document.querySelector('#createSessionForm, form[onsubmit*="createSession"]');
    if (createForm) {
        createForm.addEventListener('submit', handleCreateSession);
        console.log('Create form bound');
    }
    
    const joinForm = document.querySelector('#joinSessionForm, form[onsubmit*="joinSession"]');
    if (joinForm) {
        joinForm.addEventListener('submit', handleJoinSession);
        console.log('Join form bound');
    }
    
    console.log('App initialized successfully!');
}

function showPage(pageId) {
    console.log('Showing page:', pageId);
    
    const pages = ['landing', 'createSession', 'joinSession', 'scorekeeper', 'playerView'];
    
    pages.forEach(id => {
        const page = document.getElementById(id) || document.getElementById(id + 'Page');
        if (page) {
            page.style.display = 'none';
        }
    });
    
    const targetPage = document.getElementById(pageId) || document.getElementById(pageId.replace('Page', ''));
    if (targetPage) {
        targetPage.style.display = 'block';
        console.log('Page shown:', pageId);
    } else {
        console.log('Page not found:', pageId);
    }
}

function changePlayerCount(delta) {
    const playerCountInput = document.getElementById('playerCount') || document.querySelector('input[name="playerCount"]');
    if (playerCountInput) {
        let currentCount = parseInt(playerCountInput.value) || 2;
        currentCount = Math.max(1, Math.min(12, currentCount + delta));
        playerCountInput.value = currentCount;
        console.log('Player count changed to:', currentCount);
    }
}

function handleCreateSession(e) {
    e.preventDefault();
    console.log('Create session form submitted');
    
    // Get form data with multiple fallbacks
    const form = e.target;
    const formData = new FormData(form);
    
    const sessionName = formData.get('sessionName') || document.getElementById('sessionName')?.value || 'Game Session';
    const playerCount = parseInt(formData.get('playerCount') || document.getElementById('playerCount')?.value || 2);
    const startingScore = parseInt(formData.get('startingScore') || document.getElementById('startingScore')?.value || 0);
    const targetScore = parseInt(formData.get('targetScore') || document.getElementById('targetScore')?.value || 500);
    const allowDecimals = formData.get('allowDecimals') === 'on' || document.querySelector('input[name="allowDecimals"]')?.checked || false;
    const playAfterTarget = formData.get('playAfterTarget') === 'on' || document.querySelector('input[name="playAfterTarget"]')?.checked || false;
    
    const sessionData = {
        name: sessionName,
        playerCount: playerCount,
        startingScore: startingScore,
        allowDecimals: allowDecimals,
        targetScore: targetScore,
        playAfterTarget: playAfterTarget
    };
    
    console.log('Session data:', sessionData);
    createSession(sessionData);
}

function createSession(sessionData) {
    console.log('Creating session...');
    
    // Generate session code
    const sessionCode = generateSessionCode();
    console.log('Generated session code:', sessionCode);
    
    // Initialize players with default colors
    const initialPlayers = [];
    for (let i = 0; i < sessionData.playerCount; i++) {
        initialPlayers.push({
            id: `player${i + 1}`,
            name: `Player ${i + 1}`,
            score: sessionData.startingScore,
            isAssigned: false,
            color: playerColors[i % playerColors.length],
            teamId: null
        });
    }
    
    players = initialPlayers;
    console.log('Initialized players:', players);
    
    // Create session object
    currentSession = {
        code: sessionCode,
        name: sessionData.name,
        playerCount: sessionData.playerCount,
        startingScore: sessionData.startingScore,
        allowDecimals: sessionData.allowDecimals,
        targetScore: sessionData.targetScore,
        playAfterTarget: sessionData.playAfterTarget,
        gameEnded: false,
        winner: null,
        createdAt: new Date().toISOString(),
        hasTeams: false
    };
    
    teams = []; // Initialize empty teams
    scoreHistory = [];
    isHost = true;
    
    console.log('Current session created:', currentSession);
    
    // Show session success screen
    showSessionSuccess();
    
    // Save to Firebase if available
    if (typeof database !== 'undefined' && database) {
        console.log('Saving session to Firebase...');
        const sessionRef = database.ref(`sessions/${sessionCode}`);
        sessionRef.set({
            metadata: currentSession,
            players: players.reduce((acc, player) => {
                acc[player.id] = player;
                return acc;
            }, {}),
            teams: {},
            scoreHistory: []
        }).then(() => {
            console.log('Session saved to Firebase');
        }).catch(error => {
            console.error('Error saving to Firebase:', error);
        });
    }
}

function showSessionSuccess() {
    document.body.innerHTML = `
        <div class="session-success">
            <div class="success-header">
                <h1>🎉 Session Created!</h1>
                <div class="session-code-display">
                    <div class="session-code-label">Session Code:</div>
                    <div class="session-code-value">${currentSession.code}</div>
                </div>
            </div>
            
            <div class="session-details">
                <h3>📋 Session Details</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Game Name:</strong> ${currentSession.name}
                    </div>
                    <div class="detail-item">
                        <strong>Players:</strong> ${currentSession.playerCount}
                    </div>
                    <div class="detail-item">
                        <strong>Starting Score:</strong> ${currentSession.startingScore}
                    </div>
                    <div class="detail-item">
                        <strong>Target Score:</strong> ${currentSession.targetScore}
                    </div>
                </div>
            </div>
            
            <div class="sharing-instructions">
                <h3>📱 How Others Can Join</h3>
                <div class="instruction-box">
                    <ol>
                        <li>Go to the GameScore Pro website</li>
                        <li>Click "Join Session"</li>
                        <li>Enter code: <strong>${currentSession.code}</strong></li>
                        <li>Enter their name</li>
                    </ol>
                </div>
            </div>
            
            <div class="session-actions">
                <button onclick="setupTeams()" class="primary-btn large-btn">👥 Setup Teams (Optional)</button>
                <button onclick="startScoring()" class="primary-btn large-btn">🎮 Start Scoring</button>
                <button onclick="copySessionCode('${currentSession.code}')" class="secondary-btn">📋 Copy Code</button>
                <button onclick="goHome()" class="secondary-btn">← Back to Home</button>
            </div>
        </div>
        
        <!-- Fixed Footer -->
        <div class="fixed-footer">
            © 2025 Ken Kapptie | For educational use only | All rights reserved | <a href="#" onclick="alert('More tools coming soon!')">More tools like this</a>
        </div>
        
        <style>
            .session-success {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                text-align: center;
            }
            
            .success-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 15px;
                margin-bottom: 30px;
            }
            
            .session-code-display {
                margin-top: 20px;
            }
            
            .session-code-label {
                font-size: 1.1em;
                margin-bottom: 10px;
                opacity: 0.9;
            }
            
            .session-code-value {
                font-size: 3em;
                font-weight: bold;
                letter-spacing: 0.1em;
                background: rgba(255,255,255,0.2);
                padding: 15px 30px;
                border-radius: 10px;
                display: inline-block;
                border: 2px solid rgba(255,255,255,0.3);
            }
            
            .session-details {
                background: #f8f9fa;
                padding: 25px;
                border-radius: 10px;
                margin-bottom: 25px;
            }
            
            .detail-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }
            
            .detail-item {
                background: white;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #667eea;
            }
            
            .sharing-instructions {
                background: #e8f4fd;
                padding: 25px;
                border-radius: 10px;
                margin-bottom: 25px;
            }
            
            .instruction-box {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin-top: 15px;
            }
            
            .instruction-box ol {
                text-align: left;
                margin: 0;
                padding-left: 20px;
            }
            
            .instruction-box li {
                margin-bottom: 8px;
                font-size: 1.1em;
            }
            
            .session-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                justify-content: center;
                margin-bottom: 60px;
            }
            
            .primary-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                transition: transform 0.2s;
            }
            
            .primary-btn:hover {
                transform: translateY(-2px);
            }
            
            .large-btn {
                padding: 18px 36px;
                font-size: 18px;
            }
            
            .secondary-btn {
                background: #6c757d;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
            }
            
            .secondary-btn:hover {
                background: #5a6268;
            }
            
            /* Fixed Footer */
            .fixed-footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: #333;
                color: #fff;
                text-align: center;
                padding: 8px 10px;
                font-size: 12px;
                z-index: 1000;
                border-top: 1px solid #555;
                box-shadow: 0 -2px 5px rgba(0,0,0,0.1);
            }
            
            .fixed-footer a {
                color: #4CAF50;
                text-decoration: none;
            }
            
            .fixed-footer a:hover {
                text-decoration: underline;
            }
            
            body {
                padding-bottom: 50px;
            }
            
            @media (max-width: 768px) {
                .session-code-value {
                    font-size: 2.2em;
                    padding: 12px 20px;
                }
                
                .detail-grid {
                    grid-template-columns: 1fr;
                }
                
                .session-actions {
                    flex-direction: column;
                    align-items: center;
                }
                
                .primary-btn, .secondary-btn {
                    width: 100%;
                    max-width: 300px;
                }
            }
        </style>
    `;
}

function setupTeams() {
    document.body.innerHTML = `
        <div class="team-setup">
            <div class="team-header">
                <h1>👥 Team Setup</h1>
                <p>Create teams and assign players. Teams must have 2+ players.</p>
            </div>
            
            <div class="current-players">
                <h3>🎮 Current Players</h3>
                <div class="players-grid" id="playersGrid">
                    ${generatePlayerSetupTiles()}
                </div>
            </div>
            
            <div class="team-management">
                <h3>🏆 Teams</h3>
                <div class="team-controls">
                    <button onclick="createNewTeam()" class="primary-btn">➕ Create New Team</button>
                    <button onclick="clearAllTeams()" class="secondary-btn">🗑️ Clear All Teams</button>
                </div>
                <div class="teams-list" id="teamsList">
                    ${generateTeamsList()}
                </div>
            </div>
            
            <div class="team-actions">
                <button onclick="finishTeamSetup()" class="primary-btn large-btn">✅ Finish Team Setup</button>
                <button onclick="startScoring()" class="secondary-btn">⏭️ Skip Teams & Start Scoring</button>
                <button onclick="showSessionSuccess()" class="secondary-btn">← Back</button>
            </div>
        </div>
        
        <!-- Fixed Footer -->
        <div class="fixed-footer">
            © 2025 Ken Kapptie | For educational use only | All rights reserved | <a href="#" onclick="alert('More tools coming soon!')">More tools like this</a>
        </div>
        
        <style>
            .team-setup {
                max-width: 1000px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .team-header {
                text-align: center;
                margin-bottom: 30px;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 15px;
            }
            
            .current-players, .team-management {
                background: #f8f9fa;
                padding: 25px;
                border-radius: 10px;
                margin-bottom: 25px;
            }
            
            .players-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }
            
            .player-setup-tile {
                background: white;
                border: 2px solid #ddd;
                border-radius: 10px;
                padding: 15px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
                position: relative;
            }
            
            .player-setup-tile:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            
            .player-setup-tile.in-team {
                border-color: #4CAF50;
                background: #f8fff8;
            }
            
            .player-color-selector {
                display: flex;
                justify-content: center;
                gap: 5px;
                margin: 10px 0;
                flex-wrap: wrap;
            }
            
            .color-option {
                width: 25px;
                height: 25px;
                border-radius: 50%;
                cursor: pointer;
                border: 2px solid transparent;
                transition: all 0.2s;
            }
            
            .color-option:hover {
                transform: scale(1.1);
            }
            
            .color-option.selected {
                border-color: #333;
                transform: scale(1.2);
            }
            
            .player-name-input {
                background: none;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 8px;
                text-align: center;
                width: 100%;
                margin-bottom: 10px;
                font-weight: bold;
            }
            
            .team-badge {
                position: absolute;
                top: -8px;
                right: -8px;
                background: #4CAF50;
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.7em;
                font-weight: bold;
            }
            
            .team-controls {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            
            .teams-list {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
            }
            
            .team-card {
                background: white;
                border: 2px solid #4CAF50;
                border-radius: 10px;
                padding: 20px;
                position: relative;
            }
            
            .team-header-card {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            
            .team-name-input {
                background: none;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 8px;
                font-weight: bold;
                font-size: 1.1em;
                flex-grow: 1;
                margin-right: 10px;
            }
            
            .delete-team-btn {
                background: #dc3545;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .team-members {
                min-height: 60px;
                border: 2px dashed #ddd;
                border-radius: 8px;
                padding: 10px;
                background: #f8f9fa;
            }
            
            .team-member {
                display: inline-block;
                background: #e9ecef;
                padding: 5px 10px;
                border-radius: 15px;
                margin: 2px;
                font-size: 0.9em;
                border-left: 4px solid;
            }
            
            .team-actions {
                text-align: center;
                margin: 30px 0 60px 0;
            }
            
            .primary-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                margin: 5px 10px;
                transition: transform 0.2s;
            }
            
            .primary-btn:hover {
                transform: translateY(-2px);
            }
            
            .large-btn {
                padding: 18px 36px;
                font-size: 18px;
            }
            
            .secondary-btn {
                background: #6c757d;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                margin: 5px 10px;
            }
            
            .secondary-btn:hover {
                background: #5a6268;
            }
            
            /* Fixed Footer */
            .fixed-footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: #333;
                color: #fff;
                text-align: center;
                padding: 8px 10px;
                font-size: 12px;
                z-index: 1000;
                border-top: 1px solid #555;
                box-shadow: 0 -2px 5px rgba(0,0,0,0.1);
            }
            
            .fixed-footer a {
                color: #4CAF50;
                text-decoration: none;
            }
            
            .fixed-footer a:hover {
                text-decoration: underline;
            }
            
            body {
                padding-bottom: 50px;
            }
            
            @media (max-width: 768px) {
                .players-grid {
                    grid-template-columns: 1fr;
                }
                
                .teams-list {
                    grid-template-columns: 1fr;
                }
                
                .team-controls {
                    flex-direction: column;
                }
                
                .team-actions {
                    flex-direction: column;
                    align-items: center;
                }
                
                .primary-btn, .secondary-btn {
                    width: 100%;
                    max-width: 300px;
                    margin: 5px 0;
                }
            }
        </style>
    `;
}

function generatePlayerSetupTiles() {
    return players.map(player => {
        const team = teams.find(t => t.members.includes(player.id));
        return `
            <div class="player-setup-tile ${team ? 'in-team' : ''}" data-player-id="${player.id}">
                ${team ? `<div class="team-badge">${team.name}</div>` : ''}
                
                <input type="text" class="player-name-input" value="${player.name}" 
                       onchange="updatePlayerName('${player.id}', this.value)">
                
                <div class="player-color-selector">
                    ${playerColors.map(color => `
                        <div class="color-option ${player.color.value === color.value ? 'selected' : ''}" 
                             style="background-color: ${color.value}"
                             onclick="updatePlayerColor('${player.id}', '${color.value}')"
                             title="${color.name}">
                        </div>
                    `).join('')}
                </div>
                
                <div style="margin-top: 10px;">
                    ${team ? 
                        `<button onclick="removeFromTeam('${player.id}')" class="secondary-btn" style="font-size: 12px;">Remove from Team</button>` :
                        `<button onclick="showTeamSelector('${player.id}')" class="primary-btn" style="font-size: 12px;">Add to Team</button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

function generateTeamsList() {
    if (teams.length === 0) {
        return '<div style="text-align: center; color: #666; padding: 20px;">No teams created yet. Click "Create New Team" to get started!</div>';
    }
    
    return teams.map(team => {
        const teamMembers = team.members.map(playerId => {
            const player = players.find(p => p.id === playerId);
            return player ? `<span class="team-member" style="border-left-color: ${player.color.value}">${player.name}</span>` : '';
        }).join('');
        
        return `
            <div class="team-card">
                <div class="team-header-card">
                    <input type="text" class="team-name-input" value="${team.name}" 
                           onchange="updateTeamName('${team.id}', this.value)">
                    <button onclick="deleteTeam('${team.id}')" class="delete-team-btn">🗑️</button>
                </div>
                
                <div class="team-members">
                    ${teamMembers || '<em style="color: #666;">No members yet</em>'}
                </div>
                
                <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                    Members: ${team.members.length} | Total Score: ${calculateTeamScore(team.id)}
                </div>
            </div>
        `;
    }).join('');
}

function updatePlayerName(playerId, newName) {
    const player = players.find(p => p.id === playerId);
    if (player) {
        player.name = newName;
        console.log(`Updated player ${playerId} name to: ${newName}`);
    }
}

function updatePlayerColor(playerId, colorValue) {
    const player = players.find(p => p.id === playerId);
    const color = playerColors.find(c => c.value === colorValue);
    if (player && color) {
        player.color = color;
        console.log(`Updated player ${playerId} color to: ${color.name}`);
        
        // Refresh the display
        const playersGrid = document.getElementById('playersGrid');
        if (playersGrid) {
            playersGrid.innerHTML = generatePlayerSetupTiles();
        }
    }
}

function createNewTeam() {
    const teamName = prompt('Enter team name:');
    if (teamName && teamName.trim()) {
        const teamId = `team${teams.length + 1}`;
        teams.push({
            id: teamId,
            name: teamName.trim(),
            members: [],
            color: playerColors[teams.length % playerColors.length]
        });
        
        console.log('Created new team:', teamName);
        refreshTeamSetup();
    }
}

function deleteTeam(teamId) {
    if (confirm('Are you sure you want to delete this team?')) {
        // Remove players from team
        const team = teams.find(t => t.id === teamId);
        if (team) {
            team.members.forEach(playerId => {
                const player = players.find(p => p.id === playerId);
                if (player) {
                    player.teamId = null;
                }
            });
        }
        
        // Remove team
        teams = teams.filter(t => t.id !== teamId);
        console.log('Deleted team:', teamId);
        refreshTeamSetup();
    }
}

function updateTeamName(teamId, newName) {
    const team = teams.find(t => t.id === teamId);
    if (team) {
        team.name = newName;
        console.log(`Updated team ${teamId} name to: ${newName}`);
    }
}

function showTeamSelector(playerId) {
    if (teams.length === 0) {
        alert('Please create a team first!');
        return;
    }
    
    const teamOptions = teams.map(team => `${team.name} (${team.members.length} members)`);
    const selectedIndex = prompt(`Select a team for this player:\n\n${teamOptions.map((option, index) => `${index + 1}. ${option}`).join('\n')}\n\nEnter team number (1-${teams.length}):`);
    
    if (selectedIndex && !isNaN(selectedIndex)) {
        const teamIndex = parseInt(selectedIndex) - 1;
        if (teamIndex >= 0 && teamIndex < teams.length) {
            addPlayerToTeam(playerId, teams[teamIndex].id);
        }
    }
}

function addPlayerToTeam(playerId, teamId) {
    const player = players.find(p => p.id === playerId);
    const team = teams.find(t => t.id === teamId);
    
    if (player && team) {
        // Remove from current team if any
        if (player.teamId) {
            removeFromTeam(playerId);
        }
        
        // Add to new team
        player.teamId = teamId;
        team.members.push(playerId);
        
        console.log(`Added player ${playerId} to team ${teamId}`);
        refreshTeamSetup();
    }
}

function removeFromTeam(playerId) {
    const player = players.find(p => p.id === playerId);
    if (player && player.teamId) {
        const team = teams.find(t => t.id === player.teamId);
        if (team) {
            team.members = team.members.filter(id => id !== playerId);
        }
        player.teamId = null;
        
        console.log(`Removed player ${playerId} from team`);
        refreshTeamSetup();
    }
}

function clearAllTeams() {
    if (confirm('Are you sure you want to clear all teams?')) {
        // Remove all players from teams
        players.forEach(player => {
            player.teamId = null;
        });
        
        // Clear teams array
        teams = [];
        
        console.log('Cleared all teams');
        refreshTeamSetup();
    }
}

function calculateTeamScore(teamId) {
    const team = teams.find(t => t.id === teamId);
    if (!team) return 0;
    
    return team.members.reduce((total, playerId) => {
        const player = players.find(p => p.id === playerId);
        return total + (player ? player.score : 0);
    }, 0);
}

function refreshTeamSetup() {
    const playersGrid = document.getElementById('playersGrid');
    const teamsList = document.getElementById('teamsList');
    
    if (playersGrid) {
        playersGrid.innerHTML = generatePlayerSetupTiles();
    }
    
    if (teamsList) {
        teamsList.innerHTML = generateTeamsList();
    }
}

function finishTeamSetup() {
    // Validate teams (must have 2+ members)
    const invalidTeams = teams.filter(team => team.members.length < 2);
    if (invalidTeams.length > 0) {
        alert(`Teams must have at least 2 members. Please fix: ${invalidTeams.map(t => t.name).join(', ')}`);
        return;
    }
    
    currentSession.hasTeams = teams.length > 0;
    console.log('Team setup finished. Teams:', teams);
    
    startScoring();
}

function startScoring() {
    console.log('Starting scoring interface...');
    isHost = true;
    showScorekeeperInterface();
}

function showScorekeeperInterface() {
    document.body.innerHTML = `
        <div class="scoring-interface">
            <div class="scoring-header">
                <h2>🎮 ${currentSession.name}</h2>
                <div class="session-info">
                    <span class="session-code">Session: ${currentSession.code}</span>
                    <span class="target-info">Target: ${currentSession.targetScore}</span>
                    ${currentSession.hasTeams ? '<span class="team-mode">👥 Team Mode</span>' : ''}
                </div>
                ${currentSession.gameEnded ? `<div class="game-ended">🏆 Game Won by ${currentSession.winner}!</div>` : ''}
            </div>
            
            ${currentSession.hasTeams ? generateTeamScoreboard() : ''}
            
            <div class="players-list">
                ${generateHostPlayerList()}
            </div>
            
            <div class="scoring-actions">
                <button onclick="showSessionCode()" class="action-btn">📱 Share Code</button>
                <button onclick="generateReport()" class="action-btn">📊 View Report</button>
                <button onclick="resetAllScores()" class="action-btn">🔄 Reset Scores</button>
                ${currentSession.hasTeams ? '<button onclick="setupTeams()" class="action-btn">👥 Edit Teams</button>' : ''}
                <button onclick="goHome()" class="action-btn">🏠 End Game</button>
            </div>
        </div>
        
        <!-- Fixed Footer -->
        <div class="fixed-footer">
            © 2025 Ken Kapptie | For educational use only | All rights reserved | <a href="#" onclick="alert('More tools coming soon!')">More tools like this</a>
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
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 10px;
            }
            
            .session-info {
                display: flex;
                justify-content: center;
                gap: 20px;
                margin-top: 10px;
                flex-wrap: wrap;
            }
            
            .session-info span {
                background: rgba(255,255,255,0.2);
                padding: 5px 12px;
                border-radius: 15px;
                font-size: 0.9em;
            }
            
            .team-mode {
                background: rgba(76, 175, 80, 0.8) !important;
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
            
            .team-scoreboard {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 30px;
            }
            
            .team-scoreboard h3 {
                text-align: center;
                margin-bottom: 20px;
                color: #333;
            }
            
            .teams-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
            }
            
            .team-score-card {
                background: white;
                border: 3px solid;
                border-radius: 10px;
                padding: 15px;
                text-align: center;
                position: relative;
            }
            
            .team-score-card.winning {
                border-color: #FFD700;
                background: #FFFACD;
            }
            
            .team-name {
                font-size: 1.2em;
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .team-total-score {
                font-size: 2em;
                font-weight: bold;
                color: #667eea;
                margin-bottom: 10px;
            }
            
            .team-members-list {
                font-size: 0.9em;
                color: #666;
            }
            
            .players-list {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
                border-left: 6px solid;
            }
            
            .player-card.assigned {
                border-color: #4CAF50;
                background: #f8fff8;
            }
            
            .player-card.winner {
                border-color: #FFD700;
                background: #FFFACD;
            }
            
            .player-status {
                position: absolute;
                top: -8px;
                right: -8px;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.7em;
                font-weight: bold;
            }
            
            .status-assigned {
                background: #4CAF50;
                color: white;
            }
            
            .status-waiting {
                background: #FF9800;
                color: white;
            }
            
            .winner-badge {
                background: #FFD700;
                color: #333;
            }
            
            .team-badge {
                position: absolute;
                top: -8px;
                left: -8px;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.7em;
                font-weight: bold;
                background: #2196F3;
                color: white;
            }
            
            .player-name {
                font-size: 1.2em;
                font-weight: bold;
                margin-bottom: 15px;
                background: none;
                border: 1px solid #ddd;
                border-radius: 4px;
                width: 100%;
                text-align: center;
                cursor: text;
                padding: 8px;
            }
            
            .player-name:focus {
                outline: 2px solid #4CAF50;
                border-color: #4CAF50;
            }
            
            .player-score {
                font-size: 2.5em;
                font-weight: bold;
                color: #667eea;
                margin-bottom: 20px;
            }
            
            .score-controls {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 8px;
                margin-bottom: 15px;
            }
            
            .score-btn {
                background: #f8f9fa;
                border: 1px solid #ddd;
                border-radius: 6px;
                padding: 8px 4px;
                cursor: pointer;
                font-size: 0.9em;
                font-weight: bold;
                transition: all 0.2s;
            }
            
            .score-btn:hover {
                background: #e9ecef;
                transform: translateY(-1px);
            }
            
            .score-btn.negative {
                color: #dc3545;
            }
            
            .score-btn.positive {
                color: #28a745;
            }
            
            .custom-score {
                display: flex;
                gap: 5px;
                margin-top: 10px;
            }
            
            .custom-input {
                flex: 1;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                text-align: center;
            }
            
            .custom-btn {
                background: #667eea;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 12px;
                cursor: pointer;
                font-weight: bold;
            }
            
            .custom-btn:hover {
                background: #5a67d8;
            }
            
            .scoring-actions {
                text-align: center;
                margin: 30px 0 60px 0;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 10px;
                position: relative;
                z-index: 100;
                clear: both;
            }
            
            .action-btn {
                background: #2196F3;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                margin: 5px 10px;
                display: inline-block;
                position: relative;
                z-index: 101;
            }
            
            .action-btn:hover {
                background: #1976D2;
            }
            
            /* Fixed Footer */
            .fixed-footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: #333;
                color: #fff;
                text-align: center;
                padding: 8px 10px;
                font-size: 12px;
                z-index: 1000;
                border-top: 1px solid #555;
                box-shadow: 0 -2px 5px rgba(0,0,0,0.1);
            }
            
            .fixed-footer a {
                color: #4CAF50;
                text-decoration: none;
            }
            
            .fixed-footer a:hover {
                text-decoration: underline;
            }
            
            body {
                padding-bottom: 50px;
            }
            
            @media (max-width: 768px) {
                .players-list {
                    grid-template-columns: 1fr;
                }
                
                .teams-grid {
                    grid-template-columns: 1fr;
                }
                
                .session-info {
                    flex-direction: column;
                    gap: 10px;
                }
                
                .scoring-actions {
                    flex-direction: column;
                    align-items: center;
                }
                
                .action-btn {
                    width: 100%;
                    max-width: 300px;
                    margin: 5px 0;
                }
            }
        </style>
    `;
    
    console.log('Scorekeeper interface created');
}

function generateTeamScoreboard() {
    if (!currentSession.hasTeams || teams.length === 0) return '';
    
    const sortedTeams = teams.map(team => ({
        ...team,
        totalScore: calculateTeamScore(team.id)
    })).sort((a, b) => b.totalScore - a.totalScore);
    
    const winningScore = sortedTeams[0]?.totalScore || 0;
    
    return `
        <div class="team-scoreboard">
            <h3>🏆 Team Leaderboard</h3>
            <div class="teams-grid">
                ${sortedTeams.map(team => `
                    <div class="team-score-card ${team.totalScore === winningScore && winningScore > 0 ? 'winning' : ''}" 
                         style="border-color: ${team.color.value}">
                        <div class="team-name">${team.name}</div>
                        <div class="team-total-score">${team.totalScore}</div>
                        <div class="team-members-list">
                            ${team.members.map(playerId => {
                                const player = players.find(p => p.id === playerId);
                                return player ? `${player.name} (${player.score})` : '';
                            }).filter(Boolean).join(', ')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function generateHostPlayerList() {
    return players.map(player => {
        const isWinner = currentSession.gameEnded && currentSession.winner === player.name;
        const hasReachedTarget = player.score >= currentSession.targetScore;
        const team = teams.find(t => t.members.includes(player.id));
        
        return `
            <div class="player-card ${player.isAssigned ? 'assigned' : ''} ${isWinner ? 'winner' : ''}" 
                 data-player-id="${player.id}"
                 style="border-left-color: ${player.color.value}; background-color: ${player.color.light}">
                
                ${isWinner ? '<div class="winner-badge">🏆</div>' : ''}
                ${hasReachedTarget && !currentSession.gameEnded ? '<div class="winner-badge">🎯</div>' : ''}
                ${team ? `<div class="team-badge">${team.name}</div>` : ''}
                ${!player.isAssigned ? '<div class="status-waiting">Waiting</div>' : '<div class="status-assigned">Joined</div>'}
                
                <input type="text" class="player-name" value="${player.name}" 
                       onchange="updatePlayerName('${player.id}', this.value)" 
                       ${!isHost ? 'readonly' : ''}>
                
                <div class="player-score">${player.score}</div>
                
                <div class="score-controls">
                    <button class="score-btn negative" onclick="changeScore('${player.id}', -10)">-10</button>
                    <button class="score-btn negative" onclick="changeScore('${player.id}', -5)">-5</button>
                    <button class="score-btn negative" onclick="changeScore('${player.id}', -1)">-1</button>
                    <button class="score-btn positive" onclick="changeScore('${player.id}', 1)">+1</button>
                    <button class="score-btn positive" onclick="changeScore('${player.id}', 5)">+5</button>
                </div>
                
                <div class="custom-score">
                    <input type="number" class="custom-input" id="custom-${player.id}" placeholder="Amount" 
                           step="${currentSession.allowDecimals ? '0.1' : '1'}">
                    <button class="custom-btn" onclick="applyCustomScore('${player.id}', false)">+</button>
                    <button class="custom-btn" onclick="applyCustomScore('${player.id}', true)">-</button>
                </div>
            </div>
        `;
    }).join('');
}

function changeScore(playerId, amount) {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    const oldScore = player.score;
    player.score += amount;
    
    // Record score change
    scoreHistory.push({
        playerId: playerId,
        playerName: player.name,
        change: amount,
        oldScore: oldScore,
        newScore: player.score,
        timestamp: new Date().toISOString()
    });
    
    console.log(`Player ${playerId} score changed by ${amount} to ${player.score}`);
    
    // Check for win condition
    checkWinCondition();
    
    // Update display
    updatePlayerDisplay(playerId);
    
    // Update team scoreboard if teams exist
    if (currentSession.hasTeams) {
        updateTeamScoreboard();
    }
    
    // Save to Firebase
    saveToFirebase();
}

function applyCustomScore(playerId, isNegative) {
    const input = document.getElementById(`custom-${playerId}`);
    const amount = parseFloat(input.value);
    
    if (isNaN(amount) || amount === 0) {
        alert('Please enter a valid number');
        return;
    }
    
    const finalAmount = isNegative ? -Math.abs(amount) : Math.abs(amount);
    changeScore(playerId, finalAmount);
    
    input.value = '';
}

function updatePlayerDisplay(playerId) {
    const playerCard = document.querySelector(`[data-player-id="${playerId}"]`);
    if (playerCard) {
        const scoreElement = playerCard.querySelector('.player-score');
        const player = players.find(p => p.id === playerId);
        if (scoreElement && player) {
            scoreElement.textContent = player.score;
        }
    }
}

function updateTeamScoreboard() {
    const teamScoreboard = document.querySelector('.team-scoreboard');
    if (teamScoreboard && currentSession.hasTeams) {
        teamScoreboard.innerHTML = `
            <h3>🏆 Team Leaderboard</h3>
            ${generateTeamScoreboard().replace('<div class="team-scoreboard">', '').replace('</div>', '')}
        `;
    }
}

function checkWinCondition() {
    if (currentSession.gameEnded) return;
    
    const winners = players.filter(p => p.score >= currentSession.targetScore);
    if (winners.length > 0) {
        if (!currentSession.playAfterTarget) {
            // Game ends immediately
            const winner = winners.reduce((prev, current) => 
                (prev.score > current.score) ? prev : current
            );
            
            currentSession.gameEnded = true;
            currentSession.winner = winner.name;
            
            alert(`🏆 Game Over! ${winner.name} wins with ${winner.score} points!`);
            
            // Update header
            const header = document.querySelector('.scoring-header');
            if (header && !header.querySelector('.game-ended')) {
                header.innerHTML += `<div class="game-ended">🏆 Game Won by ${winner.name}!</div>`;
            }
        } else {
            // Just show target reached notification
            winners.forEach(winner => {
                if (!winner.targetNotified) {
                    alert(`🎯 ${winner.name} has reached the target score of ${currentSession.targetScore}!`);
                    winner.targetNotified = true;
                }
            });
        }
    }
}

function handleJoinSession(e) {
    e.preventDefault();
    console.log('Join session form submitted');
    
    const form = e.target;
    const inputs = form.querySelectorAll('input[type="text"]');
    
    let joinCode = '';
    let playerName = '';
    
    // Try to find the fields by looking at input values and placeholders
    inputs.forEach(input => {
        const value = (input.value || '').toString().trim();
        const placeholder = (input.placeholder || '').toLowerCase();
        
        if (value.length === 6 && /^[A-Z0-9]+$/.test(value.toUpperCase())) {
            joinCode = value.toUpperCase();
        } else if (value.length > 0 && (placeholder.includes('name') || placeholder.includes('player'))) {
            playerName = value;
        } else if (value.length > 0 && !joinCode) {
            joinCode = value.toUpperCase();
        } else if (value.length > 0 && !playerName) {
            playerName = value;
        }
    });
    
    console.log('Join attempt:', { joinCode, playerName });
    
    if (!joinCode || !playerName) {
        alert('Please enter both session code and your name');
        return;
    }
    
    joinSession(joinCode, playerName);
}

function joinSession(sessionCode, playerName) {
    console.log(`Attempting to join session ${sessionCode} as ${playerName}`);
    
    if (typeof database !== 'undefined' && database) {
        const sessionRef = database.ref(`sessions/${sessionCode}`);
        sessionRef.once('value').then(snapshot => {
            if (snapshot.exists()) {
                const sessionData = snapshot.val();
                currentSession = sessionData.metadata;
                players = Object.values(sessionData.players || {});
                teams = Object.values(sessionData.teams || {});
                scoreHistory = sessionData.scoreHistory || [];
                
                // Find an unassigned player slot
                const availablePlayer = players.find(p => !p.isAssigned);
                if (availablePlayer) {
                    availablePlayer.isAssigned = true;
                    availablePlayer.name = playerName;
                    currentPlayerId = availablePlayer.id;
                    isHost = false;
                    
                    // Update in Firebase
                    sessionRef.child(`players/${availablePlayer.id}`).update({
                        isAssigned: true,
                        name: playerName
                    });
                    
                    console.log(`Joined as player: ${availablePlayer.id}`);
                    showPlayerView(availablePlayer.id);
                } else {
                    alert('Session is full! All player slots are taken.');
                }
            } else {
                alert('Session not found! Please check the code and try again.');
            }
        }).catch(error => {
            console.error('Error joining session:', error);
            alert('Error joining session. Please try again.');
        });
    } else {
        alert('Unable to connect to game server. Please try again later.');
    }
}

function showPlayerView(playerId) {
    document.body.innerHTML = `
        <div class="player-view">
            <div class="player-header">
                <h2>🎮 ${currentSession.name}</h2>
                <p><strong>Session: ${currentSession.code}</strong> | ${currentSession.name}<br>Target Score: ${currentSession.targetScore} | Scores update automatically</p>
                <div class="player-badge">You are: <strong>${players.find(p => p.id === playerId)?.name}</strong></div>
                ${currentSession.gameEnded ? `<div class="game-ended">🏆 Game Won by ${currentSession.winner}!</div>` : ''}
            </div>
            
            ${currentSession.hasTeams ? generatePlayerTeamView() : ''}
            
            <div class="players-grid">
                ${generatePlayerViewTiles(playerId)}
            </div>
            
            <div class="player-actions">
                <button onclick="editMyName('${playerId}')" class="action-btn">✏️ Edit My Name</button>
                <button onclick="generateReport()" class="action-btn">📊 View Report</button>
                <button onclick="goHome()" class="action-btn">🚪 Leave Session</button>
            </div>
            
            <div class="last-updated">
                <small>Last updated: <span id="lastUpdated">${new Date().toLocaleTimeString()}</span></small>
            </div>
        </div>
        
        <!-- Fixed Footer -->
        <div class="fixed-footer">
            © 2025 Ken Kapptie | For educational use only | All rights reserved | <a href="#" onclick="alert('More tools coming soon!')">More tools like this</a>
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
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 10px;
            }
            
            .player-badge {
                background: rgba(255,255,255,0.2);
                padding: 10px 20px;
                border-radius: 20px;
                margin-top: 15px;
                display: inline-block;
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
            
            .player-team-view {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 30px;
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
                border-radius: 10px;
                padding: 15px;
                text-align: center;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                position: relative;
                border-left: 6px solid;
                transition: transform 0.2s;
            }
            
            .player-tile:hover {
                transform: translateY(-2px);
            }
            
            .player-tile.current-player {
                border-color: #4CAF50;
                background: #f8fff8;
            }
            
            .player-tile.winner {
                border-color: #FFD700;
                background: #FFFACD;
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
            
            .team-badge {
                position: absolute;
                top: -8px;
                left: 50%;
                transform: translateX(-50%);
                background: #2196F3;
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.7em;
                font-weight: bold;
            }
            
            .player-name {
                font-size: 1.1em;
                font-weight: bold;
                margin-bottom: 10px;
                color: #333;
            }
            
            .current-player-badge {
                background: #4CAF50;
                color: white;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 0.8em;
                margin-left: 8px;
            }
            
            .player-score {
                font-size: 2em;
                font-weight: bold;
                color: #667eea;
            }
            
            .player-actions {
                text-align: center;
                margin: 30px 0;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 10px;
                position: relative;
                z-index: 100;
                clear: both;
            }
            
            .action-btn {
                background: #2196F3;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                margin: 5px 10px;
                display: inline-block;
                position: relative;
                z-index: 101;
            }
            
            .action-btn:hover {
                background: #1976D2;
            }
            
            .last-updated {
                text-align: center;
                color: #666;
                margin-bottom: 80px;
            }
            
            /* Fixed Footer */
            .fixed-footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: #333;
                color: #fff;
                text-align: center;
                padding: 8px 10px;
                font-size: 12px;
                z-index: 1000;
                border-top: 1px solid #555;
                box-shadow: 0 -2px 5px rgba(0,0,0,0.1);
            }
            
            .fixed-footer a {
                color: #4CAF50;
                text-decoration: none;
            }
            
            .fixed-footer a:hover {
                text-decoration: underline;
            }
            
            body {
                padding-bottom: 50px;
            }
            
            .player-view, .scoring-interface, .session-success {
                margin-bottom: 60px;
            }
            
            @media (max-width: 768px) {
                .players-grid {
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                }
                
                .player-actions {
                    flex-direction: column;
                    align-items: center;
                }
                
                .action-btn {
                    width: 100%;
                    max-width: 300px;
                    margin: 5px 0;
                }
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
                const updatedTeams = Object.values(sessionData.teams || {});
                
                players = updatedPlayers;
                currentSession = updatedSession;
                teams = updatedTeams;
                scoreHistory = sessionData.scoreHistory || scoreHistory;
                
                // Update the display
                const playersGrid = document.querySelector('.players-grid');
                if (playersGrid) {
                    playersGrid.innerHTML = generatePlayerViewTiles(playerId);
                }
                
                // Update team view if exists
                const teamView = document.querySelector('.player-team-view');
                if (teamView && currentSession.hasTeams) {
                    teamView.innerHTML = generatePlayerTeamView().replace('<div class="player-team-view">', '').replace('</div>', '');
                }
                
                // Update player badge with current player info
                const playerBadge = document.querySelector('.player-badge');
                if (playerBadge) {
                    const currentPlayer = players.find(p => p.id === playerId);
                    if (currentPlayer) {
                        playerBadge.innerHTML = `You are: <strong>${currentPlayer.name}</strong>`;
                    }
                }
                
                // Update header info
                const playerHeader = document.querySelector('.player-header');
                if (playerHeader) {
                    // Update session info
                    const sessionInfo = playerHeader.querySelector('p');
                    if (sessionInfo) {
                        sessionInfo.innerHTML = `<strong>Session: ${currentSession.code}</strong> | ${currentSession.name}<br>Target Score: ${currentSession.targetScore} | Scores update automatically`;
                    }
                    
                    // Add game ended message if needed
                    if (currentSession.gameEnded) {
                        const existingGameEnded = playerHeader.querySelector('.game-ended');
                        if (!existingGameEnded) {
                            playerHeader.innerHTML += `<div class="game-ended">🏆 Game Won by ${currentSession.winner}!</div>`;
                        }
                    }
                }
                
                // Update timestamp
                const lastUpdated = document.getElementById('lastUpdated');
                if (lastUpdated) {
                    lastUpdated.textContent = new Date().toLocaleTimeString();
                }
                
                console.log('Player view updated - Players:', players.map(p => `${p.name} (${p.isAssigned ? 'Joined' : 'Waiting'})`));
            }
        });
    }
}

function generatePlayerTeamView() {
    if (!currentSession.hasTeams || teams.length === 0) return '';
    
    const sortedTeams = teams.map(team => ({
        ...team,
        totalScore: calculateTeamScore(team.id)
    })).sort((a, b) => b.totalScore - a.totalScore);
    
    return `
        <div class="player-team-view">
            <h3>👥 Team Standings</h3>
            <div class="teams-grid">
                ${sortedTeams.map(team => `
                    <div class="team-score-card" style="border-color: ${team.color.value}">
                        <div class="team-name">${team.name}</div>
                        <div class="team-total-score">${team.totalScore}</div>
                        <div class="team-members-list">
                            ${team.members.map(playerId => {
                                const player = players.find(p => p.id === playerId);
                                return player ? `${player.name} (${player.score})` : '';
                            }).filter(Boolean).join(', ')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function generatePlayerViewTiles(currentPlayerId) {
    return players.map(player => {
        const isCurrentPlayer = player.id === currentPlayerId;
        const isWinner = currentSession.gameEnded && currentSession.winner === player.name;
        const hasReachedTarget = player.score >= currentSession.targetScore;
        const team = teams.find(t => t.members.includes(player.id));
        
        return `
            <div class="player-tile ${isCurrentPlayer ? 'current-player' : ''} ${isWinner ? 'winner' : ''}" 
                 data-player-id="${player.id}"
                 style="border-left-color: ${player.color.value}; background-color: ${player.color.light}">
                
                ${isWinner ? '<div class="winner-badge">🏆</div>' : ''}
                ${hasReachedTarget && !currentSession.gameEnded ? '<div class="target-badge">🎯</div>' : ''}
                ${team ? `<div class="team-badge">${team.name}</div>` : ''}
                
                <div class="player-name">
                    ${player.name}
                    ${isCurrentPlayer ? '<span class="current-player-badge">You</span>' : ''}
                    ${!player.isAssigned ? ' (Waiting)' : ''}
                </div>
                <div class="player-score">${player.score}</div>
            </div>
        `;
    }).join('');
}

function editMyName(playerId) {
    const currentPlayer = players.find(p => p.id === playerId);
    if (!currentPlayer) return;
    
    const newName = prompt(`Edit your name:`, currentPlayer.name);
    if (newName && newName.trim() && newName.trim() !== currentPlayer.name) {
        currentPlayer.name = newName.trim();
        
        // Update in Firebase
        if (typeof database !== 'undefined' && database && currentSession) {
            const sessionRef = database.ref(`sessions/${currentSession.code}`);
            sessionRef.child(`players/${playerId}`).update({
                name: newName.trim()
            });
        }
        
        // Update local display
        const playerBadge = document.querySelector('.player-badge');
        if (playerBadge) {
            playerBadge.innerHTML = `You are: <strong>${newName.trim()}</strong>`;
        }
        
        console.log(`Updated player ${playerId} name to: ${newName.trim()}`);
    }
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

function copySessionCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        alert(`Session code ${code} copied to clipboard!`);
    }).catch(() => {
        prompt('Copy this session code:', code);
    });
}

function showSessionCode() {
    alert(`Session Code: ${currentSession.code}\n\nShare this code with other players so they can join your game!`);
}

function resetAllScores() {
    if (confirm('Are you sure you want to reset all scores to the starting score?')) {
        players.forEach(player => {
            player.score = currentSession.startingScore;
        });
        
        scoreHistory.push({
            action: 'reset_all',
            timestamp: new Date().toISOString()
        });
        
        currentSession.gameEnded = false;
        currentSession.winner = null;
        
        console.log('All scores reset');
        
        // Refresh display
        if (isHost) {
            showScorekeeperInterface();
        }
        
        saveToFirebase();
    }
}

function saveToFirebase() {
    if (typeof database !== 'undefined' && database && currentSession) {
        const sessionRef = database.ref(`sessions/${currentSession.code}`);
        sessionRef.update({
            metadata: currentSession,
            players: players.reduce((acc, player) => {
                acc[player.id] = player;
                return acc;
            }, {}),
            teams: teams.reduce((acc, team) => {
                acc[team.id] = team;
                return acc;
            }, {}),
            scoreHistory: scoreHistory
        });
    }
}

function generateReport() {
    // Create a comprehensive report with charts
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>GameScore Pro Report - ${currentSession.name}</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 30px; }
                .chart-container { width: 100%; height: 400px; margin: 20px 0; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
                .stat-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
                .player-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
                .player-card { background: white; border: 2px solid #ddd; border-radius: 8px; padding: 15px; }
                .team-section { background: #e8f4fd; padding: 20px; border-radius: 10px; margin: 20px 0; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎮 GameScore Pro Report</h1>
                <h2>${currentSession.name}</h2>
                <p>Session: ${currentSession.code} | Generated: ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="section">
                <h3>📊 Game Statistics</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h4>Players</h4>
                        <div style="font-size: 2em; color: #667eea;">${players.length}</div>
                    </div>
                    <div class="stat-card">
                        <h4>Target Score</h4>
                        <div style="font-size: 2em; color: #667eea;">${currentSession.targetScore}</div>
                    </div>
                    <div class="stat-card">
                        <h4>Score Changes</h4>
                        <div style="font-size: 2em; color: #667eea;">${scoreHistory.filter(h => h.change).length}</div>
                    </div>
                    <div class="stat-card">
                        <h4>Game Status</h4>
                        <div style="font-size: 1.5em; color: ${currentSession.gameEnded ? '#4CAF50' : '#FF9800'};">
                            ${currentSession.gameEnded ? '🏆 Completed' : '🎮 In Progress'}
                        </div>
                    </div>
                </div>
            </div>
            
            ${currentSession.hasTeams ? `
            <div class="team-section">
                <h3>👥 Team Results</h3>
                <div class="stats-grid">
                    ${teams.map(team => `
                        <div class="stat-card" style="border-left: 4px solid ${team.color.value}">
                            <h4>${team.name}</h4>
                            <div style="font-size: 2em; color: ${team.color.value};">${calculateTeamScore(team.id)}</div>
                            <div style="font-size: 0.9em; color: #666;">${team.members.length} members</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <div class="section">
                <h3>📈 Score Progression Chart</h3>
                <div class="chart-container">
                    <canvas id="scoreChart"></canvas>
                </div>
            </div>
            
            <div class="section">
                <h3>🏆 Final Rankings</h3>
                <div class="player-list">
                    ${players.sort((a, b) => b.score - a.score).map((player, index) => {
                        const team = teams.find(t => t.members.includes(player.id));
                        return `
                            <div class="player-card" style="border-left: 4px solid ${player.color.value}">
                                <h4>#${index + 1} ${player.name} ${currentSession.winner === player.name ? '🏆' : ''}</h4>
                                <div style="font-size: 2em; color: ${player.color.value};">${player.score}</div>
                                ${team ? `<div style="color: #666;">Team: ${team.name}</div>` : ''}
                                <div style="color: #666;">
                                    Changes: ${scoreHistory.filter(h => h.playerId === player.id).length}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <div class="section">
                <h3>📝 Recent Activity</h3>
                <div style="max-height: 300px; overflow-y: auto; background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    ${scoreHistory.slice(-20).reverse().map(entry => {
                        if (entry.action === 'reset_all') {
                            return `<div style="padding: 5px 0; border-bottom: 1px solid #ddd;">
                                🔄 All scores reset - ${new Date(entry.timestamp).toLocaleTimeString()}
                            </div>`;
                        } else if (entry.change) {
                            return `<div style="padding: 5px 0; border-bottom: 1px solid #ddd;">
                                ${entry.playerName}: ${entry.oldScore} → ${entry.newScore} (${entry.change > 0 ? '+' : ''}${entry.change}) - 
                                ${new Date(entry.timestamp).toLocaleTimeString()}
                            </div>`;
                        }
                        return '';
                    }).join('')}
                </div>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 30px;">
                <button onclick="window.print()" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; margin: 0 10px;">
                    🖨️ Print Report
                </button>
                <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; margin: 0 10px;">
                    ✖️ Close
                </button>
            </div>
            
            <script>
                // Generate score progression chart
                const ctx = document.getElementById('scoreChart').getContext('2d');
                
                // Prepare data for chart
                const players = ${JSON.stringify(players)};
                const scoreHistory = ${JSON.stringify(scoreHistory)};
                const playerColors = ${JSON.stringify(playerColors)};
                
                // Create timeline data
                const timelineData = {};
                players.forEach(player => {
                    timelineData[player.id] = [{
                        x: 0,
                        y: ${currentSession.startingScore}
                    }];
                });
                
                // Process score history
                let timeIndex = 1;
                scoreHistory.forEach(entry => {
                    if (entry.change && timelineData[entry.playerId]) {
                        timelineData[entry.playerId].push({
                            x: timeIndex,
                            y: entry.newScore
                        });
                        timeIndex++;
                    }
                });
                
                // Create datasets for chart
                const datasets = players.map(player => ({
                    label: player.name,
                    data: timelineData[player.id] || [],
                    borderColor: player.color.value,
                    backgroundColor: player.color.light,
                    borderWidth: 3,
                    fill: false,
                    tension: 0.1
                }));
                
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        datasets: datasets
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                type: 'linear',
                                title: {
                                    display: true,
                                    text: 'Game Progress'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Score'
                                }
                            }
                        },
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
                        interaction: {
                            intersect: false,
                            mode: 'index'
                        }
                    }
                });
            </script>
        </body>
        </html>
    `);
    reportWindow.document.close();
}

function goHome() {
    if (confirm('Are you sure you want to leave this session?')) {
        location.reload();
    }
}

console.log('GameScore Pro loaded - Enhanced with Teams & Colors');

