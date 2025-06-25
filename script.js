// GameScore Pro - Better Event Binding Fix
// Add this to the end of your existing script.js file

// Wait for both page load and app initialization
function waitForApp() {
    if (typeof app !== 'undefined' && app) {
        console.log('App found, fixing event bindings...');
        
        // Fix create session form
        const createForm = document.getElementById('createSessionForm');
        if (createForm) {
            // Remove any existing listeners first
            const newForm = createForm.cloneNode(true);
            createForm.parentNode.replaceChild(newForm, createForm);
            
            newForm.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('Create session triggered');
                app.handleCreateSession(e);
            });
            console.log('Create session form binding fixed');
        }
        
        // Fix join session form  
        const joinForm = document.getElementById('joinSessionForm');
        if (joinForm) {
            // Remove any existing listeners first
            const newJoinForm = joinForm.cloneNode(true);
            joinForm.parentNode.replaceChild(newJoinForm, joinForm);
            
            newJoinForm.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('Join session triggered');
                app.handleJoinSession(e);
            });
            console.log('Join session form binding fixed');
        }
        
        console.log('Event binding fixes applied successfully!');
    } else {
        console.log('App not ready yet, retrying...');
        setTimeout(waitForApp, 100);
    }
}

// Start checking for app after page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, waiting for app...');
    waitForApp();
});

// Also try after a short delay in case DOMContentLoaded already fired
setTimeout(waitForApp, 500);

