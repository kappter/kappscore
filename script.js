// GameScore Pro - Final Working Version
console.log('GameScore Pro starting...');

let currentSession = null;
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
            const sessionData = {
                code: sessionCode,
                name: formData.get('sessionName') || 'Game Session',
                playerCount: parseInt(document.getElementById('numPlayers').value) || 2,
                startingScore: parseFloat(document.getElementById('startingScore').value) || 0,
                createdAt: new Date().toISOString()
            };
            
            // Save to Firebase
            if (typeof database !== 'undefined' && database) {
                const sessionRef = database.ref(`sessions/${sessionCode}`);
                const players = {};
                for (let i = 1; i <= sessionData.playerCount; i++) {
                    players[`player${i}`] = {
                        name: `Player ${i}`,
                        score: sessionData.startingScore
                    };
                }
                sessionRef.set({
                    metadata: sessionData,
                    players: players,
                    lastUpdated: new Date().toISOString()
                });
                console.log('Session saved to Firebase');
            }
            
            // Show success on page
            showSessionSuccess(sessionCode, sessionData);
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
                        showMessage(`✅ Successfully joined session ${joinCode} as ${playerName}!`, 'success');
                        e.target.reset();
                    } else {
                        showMessage('❌ Session not found. Check the code and try again.', 'error');
                    }
                }).catch(() => {
                    showMessage('❌ Failed to join session. Try again.', 'error');
                });
            } else {
                showMessage('❌ Cannot join - Firebase not available', 'error');
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

function showSessionSuccess(sessionCode, sessionData) {
    const createPage = document.getElementById('createSessionPage');
    if (createPage) {
        createPage.innerHTML = `
            <div class="session-success">
                <div class="success-header">
                    <h2>🎉 Session Created Successfully!</h2>
                </div>
                
                <div class="session-code-display">
                    <h3>Session Code:</h3>
                    <div class="session-code-large">${sessionCode}</div>
                    <p>Share this code with other players</p>
                </div>
                
                <div class="session-details">
                    <h4>Session Details:</h4>
                    <p><strong>Name:</strong> ${sessionData.name}</p>
                    <p><strong>Players:</strong> ${sessionData.playerCount}</p>
                    <p><strong>Starting Score:</strong> ${sessionData.startingScore}</p>
                </div>
                
                <div class="session-instructions">
                    <h4>How to Join:</h4>
                    <ol>
                        <li>Other players visit: <strong>https://kappter.github.io/kappscore/</strong></li>
                        <li>Click "Join Session"</li>
                        <li>Enter the session code: <strong>${sessionCode}</strong></li>
                        <li>Enter their name</li>
                    </ol>
                </div>
                
                <div class="session-actions">
                    <button onclick="copySessionCode('${sessionCode}')" class="primary-btn">📋 Copy Code</button>
                    <button onclick="createNewSession()" class="secondary-btn">🎮 Create Another Session</button>
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

function showMessage(message, type) {
    // Create a temporary message display
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
        document.body.removeChild(messageDiv);
    }, 5000);
}

function copySessionCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        showMessage('Session code copied to clipboard!', 'success');
    }).catch(() => {
        showMessage('Could not copy code. Please copy manually: ' + code, 'error');
    });
}

function createNewSession() {
    formSubmitted = false;
    showPage('createSessionPage');
    location.reload(); // Refresh to get clean form
}

function goHome() {
    formSubmitted = false;
    showPage('landingPage');
}

function generateSessionCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

console.log('GameScore Pro loaded - FINAL VERSION');

