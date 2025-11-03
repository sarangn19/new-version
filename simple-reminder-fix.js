// Simple, direct fix for reminder functionality

(function() {
    'use strict';
    
    console.log('🔧 Simple reminder fix loaded');
    
    // Wait for everything to load
    function initSimpleReminders() {
        console.log('🚀 Initializing simple reminders...');
        
        // Ensure we have the basic elements
        const container = document.getElementById('reminders-container');
        const emptyState = document.getElementById('empty-state');
        const addButton = document.getElementById('add-reminder-btn');
        
        if (!container || !emptyState || !addButton) {
            console.log('⚠️ Required elements not found, retrying...');
            setTimeout(initSimpleReminders, 1000);
            return;
        }
        
        // Initialize global variables if they don't exist
        if (!window.reminders) {
            window.reminders = JSON.parse(localStorage.getItem('dashboardReminders')) || [];
        }
        
        if (!window.reminderIdCounter) {
            window.reminderIdCounter = Date.now();
        }
        
        // Override the addNewReminder function with a simple version
        window.addNewReminder = function() {
            console.log('➕ Simple addNewReminder called');
            
            const reminder = {
                id: window.reminderIdCounter++,
                text: '',
                timestamp: Date.now()
            };
            
            window.reminders.unshift(reminder);
            localStorage.setItem('dashboardReminders', JSON.stringify(window.reminders));
            
            // Simple render
            renderSimpleReminders();
            
            // Focus on new reminder
            setTimeout(() => {
                const textarea = document.querySelector(`[data-reminder-id="${reminder.id}"] textarea`);
                if (textarea) textarea.focus();
            }, 100);
        };
        
        // Simple render function
        function renderSimpleReminders() {
            console.log('🎨 Rendering simple reminders...');
            
            if (window.reminders.length === 0) {
                container.innerHTML = '';
                emptyState.style.display = 'block';
                return;
            }
            
            emptyState.style.display = 'none';
            
            container.innerHTML = window.reminders.map(reminder => `
                <div class="reminder-note p-3 rounded-lg relative" data-reminder-id="${reminder.id}" style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border: 1px solid #F59E0B; color: #92400E; transform: rotate(-1deg); transition: all 0.2s ease;">
                    <button onclick="deleteSimpleReminder(${reminder.id})" 
                        class="reminder-delete-btn absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs transition-colors"
                        title="Delete reminder" style="opacity: 0;">
                        ×
                    </button>
                    <textarea 
                        placeholder="Type your reminder here..."
                        style="width: 100%; height: 80px; padding-right: 32px; background: transparent; border: none; outline: none; resize: none; color: #92400E; font-weight: 500;"
                        oninput="updateSimpleReminder(${reminder.id}, this.value)"
                        onblur="if(!this.value.trim()) deleteSimpleReminder(${reminder.id})"
                    >${reminder.text}</textarea>
                    <div style="font-size: 12px; color: #D97706; margin-top: 4px; opacity: 0.7;">
                        ${new Date(reminder.timestamp).toLocaleDateString()}
                    </div>
                </div>
            `).join('');
            
            // Add hover effects
            document.querySelectorAll('.reminder-note').forEach((note, index) => {
                if (index % 2 === 1) {
                    note.style.transform = 'rotate(1deg)';
                }
                
                note.addEventListener('mouseenter', () => {
                    note.style.transform = 'rotate(0deg) scale(1.02)';
                    note.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
                    const deleteBtn = note.querySelector('.reminder-delete-btn');
                    if (deleteBtn) deleteBtn.style.opacity = '1';
                });
                
                note.addEventListener('mouseleave', () => {
                    note.style.transform = index % 2 === 0 ? 'rotate(-1deg)' : 'rotate(1deg)';
                    note.style.boxShadow = 'none';
                    const deleteBtn = note.querySelector('.reminder-delete-btn');
                    if (deleteBtn) deleteBtn.style.opacity = '0';
                });
            });
        }
        
        // Simple delete function
        window.deleteSimpleReminder = function(id) {
            console.log('🗑️ Deleting reminder:', id);
            window.reminders = window.reminders.filter(r => r.id !== id);
            localStorage.setItem('dashboardReminders', JSON.stringify(window.reminders));
            renderSimpleReminders();
        };
        
        // Simple update function
        window.updateSimpleReminder = function(id, text) {
            const reminder = window.reminders.find(r => r.id === id);
            if (reminder) {
                reminder.text = text;
                localStorage.setItem('dashboardReminders', JSON.stringify(window.reminders));
            }
        };
        
        // Override the render function
        window.renderReminders = renderSimpleReminders;
        
        // Remove existing onclick and add new event listener
        addButton.removeAttribute('onclick');
        addButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.addNewReminder();
        });
        
        // Initial render
        renderSimpleReminders();
        
        console.log('✅ Simple reminders initialized successfully');
    }
    
    // Initialize after everything loads
    setTimeout(initSimpleReminders, 2000);
    
})();