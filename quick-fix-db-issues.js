// Quick fix for db.html issues: duplicate reminders and broken cat animation

(function() {
    'use strict';
    
    console.log('🔧 Quick fix for db.html issues loaded');
    
    // Fix 1: Prevent duplicate reminder creation
    let reminderButtonFixed = false;
    
    function fixReminderButton() {
        if (reminderButtonFixed) return;
        
        const addButton = document.getElementById('add-reminder-btn');
        if (addButton) {
            // Remove the onclick attribute to prevent double execution
            addButton.removeAttribute('onclick');
            
            // Add a single, controlled event listener
            addButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Call the original function if it exists
                if (typeof window.addNewReminder === 'function') {
                    window.addNewReminder();
                } else {
                    console.error('addNewReminder function not found');
                }
            });
            
            reminderButtonFixed = true;
            console.log('✅ Reminder button fixed - onclick removed, single event listener added');
        }
    }
    
    // Fix 2: Ensure cat animation works
    function fixCatAnimation() {
        const revisionSvgContainer = document.getElementById('revision-svg-container');
        const revisionReadingSvg = document.getElementById('revision-reading-svg');
        
        if (!revisionSvgContainer || !revisionReadingSvg) {
            console.log('⚠️ Cat animation elements not found');
            return;
        }
        
        // Check if animation variables exist
        if (typeof window.handleMouseMove !== 'function' || typeof window.animateLoop !== 'function') {
            console.log('⚠️ Cat animation functions not found, reinitializing...');
            
            // Reinitialize animation variables
            let targetLampRotation = 0;
            let currentLampRotation = 0;
            const LAMP_DAMPING_FACTOR = 0.15;
            const PIVOT_X_SVG = 1310;
            const PIVOT_Y_SVG = 105;
            const INITIAL_LIGHT_ANGLE = 150;
            const MAX_ROTATION = 15;
            const MIN_ROTATION = -15;
            
            let pupilPositionX = 0;
            const MAX_PUPIL_MOVEMENT_X = 2.5;
            const READING_SPEED = 0.005;
            
            // Screen to SVG coordinate conversion
            function screenToSvg(clientX, clientY, svgElement) {
                const CTM = svgElement.getScreenCTM();
                if (!CTM) return { x: 0, y: 0 };
                return {
                    x: (clientX - CTM.e) / CTM.a,
                    y: (clientY - CTM.f) / CTM.d
                };
            }
            
            // Mouse move handler
            window.handleMouseMove = function(event) {
                if (!revisionReadingSvg) return;
                
                const cursorSvg = screenToSvg(event.clientX, event.clientY, revisionReadingSvg);
                const dx = cursorSvg.x - PIVOT_X_SVG;
                const dy = cursorSvg.y - PIVOT_Y_SVG;
                
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                let normalizedAngle = angle - INITIAL_LIGHT_ANGLE;
                
                if (normalizedAngle > 180) normalizedAngle -= 360;
                if (normalizedAngle < -180) normalizedAngle += 360;
                
                targetLampRotation = Math.max(MIN_ROTATION, Math.min(MAX_ROTATION, normalizedAngle));
            };
            
            // Animation loop
            window.animateLoop = function(timestamp) {
                // Lamp movement with damping
                const difference = targetLampRotation - currentLampRotation;
                currentLampRotation += difference * LAMP_DAMPING_FACTOR;
                
                const lampHead = document.getElementById('lamp-head');
                const lightBeam = document.getElementById('light-beam');
                
                if (lampHead) {
                    lampHead.style.transformOrigin = `${PIVOT_X_SVG}px ${PIVOT_Y_SVG}px`;
                    lampHead.style.transform = `rotate(${currentLampRotation}deg)`;
                }
                
                if (lightBeam) {
                    lightBeam.style.transformOrigin = `${PIVOT_X_SVG}px ${PIVOT_Y_SVG}px`;
                    lightBeam.style.transform = `rotate(${currentLampRotation}deg)`;
                }
                
                // Eye movement
                pupilPositionX = Math.sin(timestamp * READING_SPEED) * MAX_PUPIL_MOVEMENT_X;
                
                const leftPupilGroup = document.getElementById('left-pupil-group');
                const rightPupilGroup = document.getElementById('right-pupil-group');
                
                if (leftPupilGroup) {
                    leftPupilGroup.style.transform = `translateX(${pupilPositionX}px)`;
                }
                
                if (rightPupilGroup) {
                    rightPupilGroup.style.transform = `translateX(${pupilPositionX}px)`;
                }
                
                requestAnimationFrame(window.animateLoop);
            };
            
            // Add event listener and start animation
            revisionSvgContainer.addEventListener('mousemove', window.handleMouseMove);
            window.animateLoop(0);
            
            console.log('✅ Cat animation reinitialized');
        } else {
            console.log('✅ Cat animation functions already exist');
        }
    }
    
    // Apply fixes when DOM is ready
    function applyFixes() {
        fixReminderButton();
        fixCatAnimation();
    }
    
    // Try to apply fixes at different times to ensure they work
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyFixes);
    } else {
        applyFixes();
    }
    
    // Also try after a delay
    setTimeout(applyFixes, 1500);
    setTimeout(applyFixes, 3000);
    
})();