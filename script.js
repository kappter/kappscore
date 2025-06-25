// GameScore Pro - Minimal Working Version
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
            
            // Save to Firebase
            const sessionData = {
                code: sessionCode,
                name: new FormData(e.target).get('sessionName') || 'Game Session',
                playerCount: parseInt(document.getElementById('numPlayers').value) || 2,
                startingScore: parseFloat(document.getElementById('startingScore').value) || 0,
                createdAt: new Date().toISOString()
            };
            
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
            }
            
            // Show success message
            alert(`🎉 SESSION CREATED!\n\nSession Code: ${sessionCode}\n\nShare this code with other players!\n\nThey can join at: https://kappter.github.io/kappscore/`);
            
            // Reset form
            formSubmitted = false;
            e.target.reset();
            document.getElementById('numPlayers').value = 2;
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
                        alert(`✅ JOINED SESSION!\n\nYou joined as: ${playerName}\nSession: ${joinCode}\n\nThe scorekeeper will manage scores for everyone.`);
                        e.target.reset();
                    } else {
                        alert('❌ Session not found. Check the code and try again.');
                    }
                }).catch(() => {
                    alert('❌ Failed to join session. Try again.');
                });
            } else {
                alert('❌ Cannot join - Firebase not available');
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

function generateSessionCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

console.log('GameScore Pro loaded - MINIMAL VERSION');

