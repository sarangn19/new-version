// Diagnostic script to identify reminder issues

(function() {
    'use strict';
    
    console.log('🔍 Reminder diagnostic script loaded');
    
    function diagnoseReminders() {
        console.log('🔍 Starting reminder diagnosis...');
        
        // Check if DOM elements exist
        const container = document.getElementById('reminders-container');
        const emptyState = document.getElementById('empty-state');
        const addButton = document.getElementById('add-reminder-btn');
        
        console.log('📋 DOM Elements Check:');
        console.log('  - reminders-container:', container ? '✅ Found' : '❌ Missing');
        console.log('  - empty-state:', emptyState ? '✅ Found' : '❌ Missing');
        console.log('  - add-reminder-btn:', addButton ? '✅ Found' : '❌ Missing');
        
        // Check if variables exist
        console.log('📋 Variables Check:');
        console.log('  - window.reminders:', typeof window.reminders, window.reminders);
        console.log('  - window.reminderIdCounter:', typeof window.reminderIdCounter, window.reminderIdCounter);
        
        // Check if functions exist
        console.log('📋 Functions Check:');
        console.log('  - window.addNewReminder:', typeof window.addNewReminder);
        console.log('  - window.renderReminders:', typeof window.renderReminders);
        console.log('  - window.saveReminders:', typeof window.saveReminders);
        console.log('  - window.deleteReminder:', typeof window.deleteReminder);
        console.log('  - window.updateReminder:', typeof window.updateReminder);
        
        // Check localStorage
        const storedReminders = localStorage.getItem('dashboardReminders');
        console.log('📋 LocalStorage Check:');
        console.log('  - dashboardReminders:', storedReminders);
        
        // Test function execution
        if (addButton) {
            console.log('📋 Button Event Check:');
            console.log('  - onclick attribute:', addButton.getAttribute('onclick'));
            console.log('  - event listeners:', getEventListeners ? getEventListeners(addButton) : 'Cannot check (use browser dev tools)');
        }
        
        // Try to manually call addNewReminder
        if (typeof window.addNewReminder === 'function') {
            console.log('🧪 Testing addNewReminder function...');
            try {
                // Don't actually call it, just check if it would work
                console.log('  - Function is callable');
                
                // Check if required elements are available for the function
                if (container && emptyState) {
                    console.log('  - Required DOM elements available for function');
                } else {
                    console.log('  - ❌ Required DOM elements missing for function');
                }
            } catch (error) {
                console.error('  - ❌ Error testing function:', error);
            }
        }
        
        // Check for JavaScript errors
        window.addEventListener('error', function(e) {
            console.error('🚨 JavaScript Error Detected:', e.error);
        });
        
        console.log('🔍 Diagnosis complete. Check the logs above for issues.');
    }
    
    // Add a manual test function
    window.testAddReminder = function() {
        console.log('🧪 Manual test: Adding reminder...');
        if (typeof window.addNewReminder === 'function') {
            try {
                window.addNewReminder();
                console.log('✅ Manual test successful');
            } catch (error) {
                console.error('❌ Manual test failed:', error);
            }
        } else {
            console.error('❌ addNewReminder function not found');
        }
    };
    
    // Add button click test
    window.testButtonClick = function() {
        console.log('🧪 Manual test: Simulating button click...');
        const addButton = document.getElementById('add-reminder-btn');
        if (addButton) {
            try {
                addButton.click();
                console.log('✅ Button click test completed');
            } catch (error) {
                console.error('❌ Button click test failed:', error);
            }
        } else {
            console.error('❌ Add button not found');
        }
    };
    
    // Run diagnosis when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', diagnoseReminders);
    } else {
        setTimeout(diagnoseReminders, 1000);
    }
    
    // Also run after a longer delay to catch late-loading scripts
    setTimeout(diagnoseReminders, 3000);
    
    console.log('🔍 Diagnostic functions available:');
    console.log('  - testAddReminder() - Test the addNewReminder function');
    console.log('  - testButtonClick() - Test button click simulation');
    
})();