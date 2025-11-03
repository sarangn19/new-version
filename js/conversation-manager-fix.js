/**
 * Conversation Manager Fix - Unified conversation management with proper error handling
 */

class ConversationManagerFix {
    constructor() {
        this.isInitialized = false;
        this.conversations = [];
        this.currentConversationId = null;
        this.init();
    }

    async init() {
        console.log('🔧 Initializing Conversation Manager Fix...');
        
        try {
            // Load conversations from all sources
            await this.loadAllConversations();
            
            // Setup global functions
            this.setupGlobalFunctions();
            
            // Setup event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ Conversation Manager Fix initialized successfully');
            
        } catch (error) {
            console.error('❌ Conversation Manager Fix initialization failed:', error);
        }
    }

    async loadAllConversations() {
        let allConversations = [];

        // Try Firebase first
        if (window.firebaseManager?.isReady()) {
            try {
                const firebaseConversations = await window.firebaseManager.getConversations(8);
                allConversations = allConversations.concat(firebaseConversations);
                console.log('📥 Loaded from Firebase:', firebaseConversations.length);
            } catch (error) {
                console.warn('Firebase load failed:', error);
            }
        }

        // Load from localStorage
        try {
            const localConversations = JSON.parse(localStorage.getItem('conversations') || '[]');
            // Merge with Firebase data, avoiding duplicates
            localConversations.forEach(localConv => {
                if (!allConversations.find(conv => conv.id === localConv.id)) {
                    allConversations.push(localConv);
                }
            });
            console.log('📥 Loaded from localStorage:', localConversations.length);
        } catch (error) {
            console.warn('localStorage load failed:', error);
        }

        // Load from AI service manager
        if (window.aiServiceManager) {
            try {
                const aiConversations = window.aiServiceManager.getRecentConversations(8);
                aiConversations.forEach(aiConv => {
                    if (!allConversations.find(conv => conv.id === aiConv.id)) {
                        allConversations.push(aiConv);
                    }
                });
                console.log('📥 Loaded from AI service:', aiConversations.length);
            } catch (error) {
                console.warn('AI service load failed:', error);
            }
        }

        // Sort by last message time
        this.conversations = allConversations.sort((a, b) => {
            const timeA = new Date(a.lastMessageAt || a.updatedAt || a.timestamp || 0);
            const timeB = new Date(b.lastMessageAt || b.updatedAt || b.timestamp || 0);
            return timeB - timeA;
        });

        console.log('📥 Total conversations loaded:', this.conversations.length);
    }

    setupGlobalFunctions() {
        // Enhanced load recent conversations
        window.loadRecentConversationsEnhanced = async () => {
            try {
                await this.loadAllConversations();
                this.displayRecentConversations();
            } catch (error) {
                console.error('Error loading recent conversations:', error);
            }
        };

        // Enhanced load conversation
        window.loadConversationEnhanced = async (conversationId) => {
            try {
                await this.loadSpecificConversation(conversationId);
            } catch (error) {
                console.error('Error loading conversation:', error);
                this.showError('Failed to load conversation');
            }
        };

        // Enhanced save conversation
        window.saveConversationEnhanced = async (conversationId, userMessage, aiResponse) => {
            try {
                await this.saveConversation(conversationId, userMessage, aiResponse);
            } catch (error) {
                console.error('Error saving conversation:', error);
            }
        };
    }

    displayRecentConversations() {
        const recentChatsList = document.getElementById('recent-chats-list');
        if (!recentChatsList) {
            console.warn('Recent chats list element not found');
            return;
        }

        if (this.conversations.length === 0) {
            recentChatsList.innerHTML = '<li class="text-white/50 text-center py-4">No recent chats</li>';
            return;
        }

        const recentConversations = this.conversations.slice(0, 8);
        recentChatsList.innerHTML = recentConversations.map(chat => {
            const title = this.getConversationTitle(chat);
            const timeAgo = this.formatChatTime(chat.lastMessageAt || chat.updatedAt || chat.timestamp);
            const syncStatus = chat.synced !== false ? '☁️' : '💾';
            
            return `
                <li class="cursor-pointer hover:bg-white/5 rounded-lg px-3 py-2 transition-colors group" 
                    onclick="loadConversationEnhanced('${chat.id}')">
                    <div class="text-white/80 text-sm leading-relaxed mb-1">${title}</div>
                    <div class="text-white/40 text-xs flex items-center gap-1">
                        ${timeAgo}
                        <span class="text-xs">${syncStatus}</span>
                    </div>
                </li>
            `;
        }).join('');

        console.log('✅ Recent conversations displayed:', recentConversations.length);
    }

    async loadSpecificConversation(conversationId) {
        console.log('🔄 Loading conversation:', conversationId);

        // Find conversation in loaded data
        let conversation = this.conversations.find(conv => conv.id === conversationId);

        // If not found, try to load from sources again
        if (!conversation) {
            await this.loadAllConversations();
            conversation = this.conversations.find(conv => conv.id === conversationId);
        }

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        // Get DOM elements safely
        const feed = document.getElementById('chat-feed');
        const greetingSection = document.getElementById('greeting-section');

        if (!feed) {
            throw new Error('Chat feed element not found');
        }

        // Clear current chat
        feed.innerHTML = '';
        if (greetingSection) {
            greetingSection.style.display = 'none';
        }

        // Set global state
        this.currentConversationId = conversationId;
        if (typeof window.isFirstMessage !== 'undefined') {
            window.isFirstMessage = false;
        }
        if (typeof window.currentConversationId !== 'undefined') {
            window.currentConversationId = conversationId;
        }

        // Display conversation header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex items-start gap-3 mb-4';
        headerDiv.innerHTML = `
            <div class="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">🤖</div>
            <div class="text-sm text-white/90">
                <p>Continuing conversation: "${this.getConversationTitle(conversation)}"</p>
                <div class="text-xs text-white/60 mt-1">
                    ${conversation.messageCount || 0} messages • ${conversation.synced !== false ? '☁️ Synced' : '💾 Local only'}
                </div>
            </div>
        `;
        feed.appendChild(headerDiv);

        // Display messages if available
        if (conversation.messages && Array.isArray(conversation.messages) && conversation.messages.length > 0) {
            const recentMessages = conversation.messages.slice(-6); // Show last 6 messages
            
            recentMessages.forEach(message => {
                const messageDiv = document.createElement('div');
                
                if (message.role === 'user') {
                    messageDiv.className = 'flex justify-end mt-4';
                    messageDiv.innerHTML = `
                        <div class="rounded-full bg-white/[0.06] border border-white/10 px-4 py-2 text-sm flex items-center gap-2">
                            <span>${this.escapeHtml(message.content)}</span>
                            <span class="w-6 h-6 rounded-full bg-[#2C7A7B] text-white text-xs flex items-center justify-center">U</span>
                        </div>
                    `;
                } else if (message.role === 'assistant') {
                    messageDiv.className = 'flex items-start gap-3 mt-4';
                    const cleanContent = this.escapeHtml(message.content)
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n/g, '<br>');
                        
                    messageDiv.innerHTML = `
                        <div class="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">🤖</div>
                        <div class="text-sm text-white/90 leading-6">
                            <div class="prose prose-invert max-w-none text-sm leading-relaxed">${cleanContent}</div>
                        </div>
                    `;
                }
                
                feed.appendChild(messageDiv);
            });
        }

        // Scroll to show loaded content
        feed.scrollIntoView({ behavior: 'smooth', block: 'end' });

        this.showSuccess('Conversation loaded successfully');
        console.log('✅ Conversation loaded successfully:', conversationId);
    }

    async saveConversation(conversationId, userMessage, aiResponse) {
        console.log('💾 Saving conversation:', conversationId);

        const newMessages = [
            {
                id: `msg_${Date.now()}_user`,
                role: 'user',
                content: userMessage,
                timestamp: new Date().toISOString()
            },
            {
                id: `msg_${Date.now()}_ai`,
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date().toISOString()
            }
        ];

        // Update local conversations array
        let conversation = this.conversations.find(conv => conv.id === conversationId);
        
        if (conversation) {
            // Update existing conversation
            conversation.messages = conversation.messages || [];
            conversation.messages.push(...newMessages);
            conversation.messageCount = conversation.messages.length;
            conversation.lastMessageAt = new Date().toISOString();
            conversation.updatedAt = new Date().toISOString();
        } else {
            // Create new conversation
            conversation = {
                id: conversationId,
                title: userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage,
                preview: userMessage.substring(0, 100) + (userMessage.length > 100 ? '...' : ''),
                messages: newMessages,
                messageCount: 2,
                lastMessageAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true,
                synced: false
            };
            this.conversations.unshift(conversation);
        }

        // Save to Firebase
        if (window.firebaseManager?.isReady()) {
            try {
                await window.firebaseManager.saveConversation(conversation);
                conversation.synced = true;
                console.log('✅ Conversation saved to Firebase');
            } catch (error) {
                console.warn('Firebase save failed:', error);
                conversation.synced = false;
            }
        } else {
            conversation.synced = false;
        }

        // Save to localStorage
        try {
            const localConversations = this.conversations.slice(0, 50); // Keep only 50 most recent
            localStorage.setItem('conversations', JSON.stringify(localConversations));
            console.log('✅ Conversation saved to localStorage');
        } catch (error) {
            console.error('localStorage save failed:', error);
        }

        // Update display
        this.displayRecentConversations();
    }

    setupEventListeners() {
        // Auto-refresh conversations periodically
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.loadAllConversations().then(() => {
                    this.displayRecentConversations();
                });
            }
        }, 30000); // Every 30 seconds

        // Refresh on visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(() => {
                    this.loadAllConversations().then(() => {
                        this.displayRecentConversations();
                    });
                }, 1000);
            }
        });
    }

    getConversationTitle(conversation) {
        return conversation.title || 
               conversation.preview || 
               (conversation.messages && conversation.messages.length > 0 ? 
                conversation.messages[0].content.substring(0, 50) + '...' : 
                'Untitled Conversation');
    }

    formatChatTime(timestamp) {
        if (!timestamp) return 'Unknown time';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showSuccess(message) {
        if (window.showToast) {
            window.showToast(message, 'success');
        } else {
            console.log('✅', message);
        }
    }

    showError(message) {
        if (window.showToast) {
            window.showToast(message, 'error');
        } else {
            console.error('❌', message);
        }
    }

    // Public methods
    isReady() {
        return this.isInitialized;
    }

    getConversations() {
        return this.conversations;
    }

    async refresh() {
        await this.loadAllConversations();
        this.displayRecentConversations();
    }
}

// Initialize conversation manager fix
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        window.conversationManagerFix = new ConversationManagerFix();
    }, 1000);
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConversationManagerFix;
}