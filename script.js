// GameScore Pro - Quick Fix for Event Binding
// Add this to the end of your existing script.js file

// Wait for page to fully load, then fix event bindings
document.addEventListener('DOMContentLoaded', function() {
    console.log('Fixing event bindings...');
    
    // Fix create session form
    const createForm = document.getElementById('createSessionForm');
    if (createForm && app) {
        createForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Create session triggered');
            app.handleCreateSession(e);
        });
        console.log('Create session form binding fixed');
    }
    
    // Fix join session form  
    const joinForm = document.getElementById('joinSessionForm');
    if (joinForm && app) {
        joinForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Join session triggered');
            app.handleJoinSession(e);
        });
        console.log('Join session form binding fixed');
    }
    
    // Fix navigation buttons
    const createBtn = document.getElementById('createSessionBtn');
    if (createBtn && app) {
        createBtn.addEventListener('click', function() {
            app.showPage('createSessionPage');
        });
    }
    
    const joinBtn = document.getElementById('joinSessionBtn');
    if (joinBtn && app) {
        joinBtn.addEventListener('click', function() {
            app.showPage('joinSessionPage');
        });
    }
    
    console.log('Event binding fixes applied!');
});

