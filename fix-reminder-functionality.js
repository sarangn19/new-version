// Minimal Fix for Reminder Functionality in db.html
// This script only provides fallback functionality if the original functions don't exist

(function() {
    'use strict';
    
    console.log('🔧 Reminder functionality fallback loaded');
    
    // Only initialize if DOM is ready and functions don't exist
    function checkAndInitialize() {
        // Don't interfere if functions already exist
        if (typeof window.addNewReminder === 'function' && 
            typeof window.renderReminders === 'function') {
            console.log('✅ Reminder functions already exist, no fallback needed');
            return;
        }
        
        console.log('⚠️ Some reminder functions missing, providing fallbacks...');
        
        // Initialize variables only if they don't exist
        if (typeof window.reminders === 'undefined') {
            window.reminders = JSON.parse(localStorage.getItem('dashboardReminders')) || [];
        }
        
        if (typeof window.reminderIdCounter === 'undefined') {
            window.reminderIdCounter = Date.now();
        }
        
        // Only add functions if they don't exist
        if (typeof window.saveReminders !== 'function') {
            window.saveReminders = function() {
                localStorage.setItem('dashboardReminders', JSON.stringify(window.reminders));
            };
        }
        
        if (typeof window.renderReminders !== 'function') {
            window.renderReminders = function() {
                const container = document.getElementById('reminders-container');
                const emptyState = document.getElementById('empty-state');
                
                if (!container || !emptyState) return;
                
                if (window.reminders.length === 0) {
                    container.innerHTML = '';
                    emptyState.style.display = 'block';
                    return;
                }
                
                emptyState.style.display = 'none';
                container.innerHTML = window.reminders.map(reminder => `
                    <div class="reminder-note p-3 rounded-lg relative" data-reminder-id="${reminder.id}">
                        <button onclick="deleteReminder(${reminder.id})" 
                            class="reminder-delete-btn absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs transition-colors"
                            title="Delete reminder">
                            <i data-lucide="x" class="w-3 h-3"></i>
                        </button>
                        <textarea 
                            placeholder="Type your reminder here..."
                            class="w-full h-20 pr-8"
                            oninput="updateReminder(${reminder.id}, this.value)"
                            onblur="if(!this.value.trim()) deleteReminder(${reminder.id})"
                        >${reminder.text}</textarea>
                        <div class="text-xs text-amber-700 mt-1 opacity-70">
                            ${new Date(reminder.timestamp).toLocaleDateString()}
                        </div>
                    </div>
                `).join('');
                
                if (window.lucide) window.lucide.createIcons();
            };
        }
        
        console.log('✅ Fallback functions provided');
    }
    
    // Wait for DOM and original scripts to load
    setTimeout(checkAndInitialize, 2000);
    
})();