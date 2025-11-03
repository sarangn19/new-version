/**
 * Conversation Fix - Resolves issues with recent chat loading and Firebase integration
 */

class ConversationFix {
    constructor() {
        this.isInitialized = false;
        this.retryAttempts = 0;
        this.maxRetries = 3;
        this.init();
    }

    async init() {
        console.log('🔧 Initializing Conversation Fix...');
        
        try {
            // Wait for dependencies
            await this.waitForDependencies();
            
            // Fix conversation loading
            this.fixConversationLoading();
            
            // Fix Firebase integration
            this.fixFirebaseIntegration();
            
            // Fix recent conversations display
            this.fixRecentConversationsDisplay();
            
            this.isInitialized = true;
            console.log('✅ Conversation Fix initialized successfully');
            
        } catch (error) {
            console.error('❌ Conversation Fix initialization failed:', error);
            this.retryInitialization();
        }
    }

    async waitForDependencies() {
        const maxWait = 10000; // 10 seconds
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            if (window.aiServiceManager && window.firebaseManager) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.warn('⚠️ Some dependencies not loaded, proceeding with available ones');
        return false;
    }

    fixConversationLoading() {
        console.log('🔧 Fixing conversation loading...');
        
        // Enhanced loadRecentConversations function
        window.loadRecentConversationsFixed = async function() {
            try {
                const recentChatsList = document.getElementById('recent-chats-list');
                if (!recentChatsList) {
                    console.warn('Recent chats list element not found');
                    return;
                }

                let conversations = [];

                // Try Firebase first
                if (window.firebaseManager?.isReady()) {
                    try {
                        conversations = await window.firebaseManager.getConversations(8);
                        console.log('📥 Loaded conversations from Firebase:', conversations.length);
                    } catch (firebaseError) {
                        console.warn('Firebase load failed:', firebaseError);
                    }
                }

                // Fallback to localStorage
                if (conversations.length === 0) {
                    const localConversations = JSON.parse(localStorage.getItem('conversations') || '[]');
                    conversations = localConversations.slice(0, 8);
                    console.log('📥 Loaded conversations from localStorage:', conversations.length);
                }

                // Fallback to AI service manager
                if (conversations.length === 0 && window.aiServiceManager) {
                    conversations = window.aiServiceManager.getRecentConversations(8);
                    console.log('📥 Loaded conversations from AI service:', conversations.length);
                }

                // Display conversations
                if (conversations.length === 0) {
                    recentChatsList.innerHTML = '<li class="text-white/50 text-center py-4">No recent chats</li>';
                } else {
                    recentChatsList.innerHTML = conversations.map(chat => {
                        const title = chat.title || chat.preview || this.getConversationPreview(chat) || 'Untitled Conversation';
                        const timestamp = chat.timestamp || chat.createdAt || chat.updatedAt;
                        const timeAgo = this.formatChatTime(timestamp);
                        const syncStatus = chat.synced !== false ? '☁️' : '💾';
                        
                        return `
                            <li class="cursor-pointer hover:bg-white/5 rounded-lg px-3 py-2 transition-colors group" 
                                onclick="loadConversationFixed('${chat.id}')">
                                <div class="text-white/80 text-sm leading-relaxed mb-1">${title}</div>
                                <div class="text-white/40 text-xs flex items-center gap-1">
                                    ${timeAgo}
                                    <span class="text-xs">${syncStatus}</span>
                                </div>
                            </li>
                        `;
                    }).join('');
                }

            } catch (error) {
                console.error('Error loading recent conversations:', error);
                const recentChatsList = document.getElementById('recent-chats-list');
                if (recentChatsList) {
                    recentChatsList.innerHTML = '<li class="text-red-400 text-center py-4">Error loading conversations</li>';
                }
            }
        }.bind(this);

        // Enhanced loadConversation function
        window.loadConversationFixed = async function(conversationId) {
            try {
                console.log('📥 Loading conversation:', conversationId);
                
                const feed = document.getElementById('chat-feed');
                const greetingSection = document.getElementById('greeting-section');
                
                if (!feed) {
                    console.error('Chat feed element not found');
                    return;
                }

                // Clear current chat
                feed.innerHTML = '';
                if (greetingSection) {
                    greetingSection.style.display = 'none';
                }
                
                // Set global variables if they exist
                if (typeof window.isFirstMessage !== 'undefined') {
                    window.isFirstMessage = false;
                }
                if (typeof window.currentConversationId !== 'undefined') {
                    window.currentConversationId = conversationId;
                }

                let conversation = null;

                // Try Firebase first
                if (window.firebaseManager?.isReady()) {
                    try {
                        const conversations = await window.firebaseManager.getConversations(100);
                        conversation = conversations.find(conv => conv.id === conversationId);
                        if (conversation) {
                            console.log('📥 Loaded conversation from Firebase');
                        }
                    } catch (firebaseError) {
                        console.warn('Firebase conversation load failed:', firebaseError);
                    }
                }

                // Fallback to localStorage
                if (!conversation) {
                    const localConversations = JSON.parse(localStorage.getItem('conversations') || '[]');
                    conversation = localConversations.find(conv => conv.id === conversationId);
                    if (conversation) {
                        console.log('📥 Loaded conversation from localStorage');
                    }
                }

                // Fallback to AI service manager
                if (!conversation && window.aiServiceManager) {
                    const recentChats = window.aiServiceManager.getRecentConversations(50);
                    conversation = recentChats.find(chat => chat.id === conversationId);
                    if (conversation) {
                        console.log('📥 Loaded conversation from AI service');
                    }
                }

                if (conversation) {
                    // Display conversation header
                    const headerDiv = document.createElement('div');
                    headerDiv.className = 'flex items-start gap-3 mb-4';
                    headerDiv.innerHTML = `
                        <div class="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">🤖</div>
                        <div class="text-sm text-white/90">
                            <p>Continuing conversation: "${conversation.title || 'Untitled'}"</p>
                            <div class="text-xs text-white/60 mt-1">
                                ${conversation.messageCount || 0} messages • ${conversation.synced !== false ? '☁️ Synced' : '💾 Local only'}
                            </div>
                        </div>
                    `;
                    feed.appendChild(headerDiv);

                    // Display messages if available
                    if (conversation.messages && conversation.messages.length > 0) {
                        const recentMessages = conversation.messages.slice(-6); // Show last 6 messages
                        
                        recentMessages.forEach(message => {
                            const messageDiv = document.createElement('div');
                            
                            if (message.role === 'user') {
                                messageDiv.className = 'flex justify-end mt-4';
                                messageDiv.innerHTML = `
                                    <div class="rounded-full bg-white/[0.06] border border-white/10 px-4 py-2 text-sm flex items-center gap-2">
                                        <span>${message.content}</span>
                                        <span class="w-6 h-6 rounded-full bg-[#2C7A7B] text-white text-xs flex items-center justify-center">U</span>
                                    </div>
                                `;
                            } else if (message.role === 'assistant') {
                                messageDiv.className = 'flex items-start gap-3 mt-4';
                                const cleanContent = message.content
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

                    // Set current conversation ID
                    window.currentConversationId = conversationId;

                    // Show success message
                    if (window.showNotification) {
                        window.showNotification('Conversation loaded successfully', 'success');
                    }

                } else {
                    console.error('Conversation not found:', conversationId);
                    if (window.showNotification) {
                        window.showNotification('Conversation not found', 'error');
                    }
                }

                // Scroll to show loaded content
                feed.scrollIntoView({ behavior: 'smooth', block: 'end' });
                
            } catch (error) {
                console.error('Error loading conversation:', error);
                if (window.showNotification) {
                    window.showNotification('Error loading conversation', 'error');
                }
            }
        }.bind(this);
    }

    fixFirebaseIntegration() {
        console.log('🔧 Fixing Firebase integration...');
        
        // Enhanced Firebase conversation saving
        window.saveConversationToFirebaseFixed = async function(conversationId, userMessage, aiResponse) {
            try {
                if (!window.firebaseManager?.isReady()) {
                    console.log('Firebase not ready, saving locally only');
                    this.saveConversationLocally(conversationId, userMessage, aiResponse);
                    return;
                }

                const conversationData = {
                    id: conversationId,
                    title: userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage,
                    preview: userMessage.substring(0, 100) + (userMessage.length > 100 ? '...' : ''),
                    messages: [
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
                    ],
                    messageCount: 2,
                    lastMessageAt: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isActive: true,
                    synced: true
                };

                await window.firebaseManager.saveConversation(conversationData);
                
                // Also save locally as backup
                this.saveConversationLocally(conversationId, userMessage, aiResponse);
                
                console.log('✅ Conversation saved to Firebase and localStorage');
                
            } catch (error) {
                console.error('❌ Error saving conversation to Firebase:', error);
                // Fallback to local storage
                this.saveConversationLocally(conversationId, userMessage, aiResponse);
            }
        }.bind(this);
    }

    saveConversationLocally(conversationId, userMessage, aiResponse) {
        try {
            const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
            
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

            // Check if conversation exists
            const existingIndex = conversations.findIndex(conv => conv.id === conversationId);
            if (existingIndex !== -1) {
                // Update existing conversation
                const existingConversation = conversations[existingIndex];
                existingConversation.messages = existingConversation.messages || [];
                existingConversation.messages.push(...newMessages);
                existingConversation.messageCount = existingConversation.messages.length;
                existingConversation.lastMessageAt = new Date().toISOString();
                existingConversation.updatedAt = new Date().toISOString();
                existingConversation.synced = false;
            } else {
                // Add new conversation
                const conversationData = {
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
                conversations.unshift(conversationData);
            }

            // Keep only last 50 conversations
            if (conversations.length > 50) {
                conversations.splice(50);
            }

            localStorage.setItem('conversations', JSON.stringify(conversations));
            console.log('💾 Conversation saved locally');
            
        } catch (error) {
            console.error('Error saving conversation locally:', error);
        }
    }

    fixRecentConversationsDisplay() {
        console.log('🔧 Fixing recent conversations display...');
        
        // Auto-refresh recent conversations
        setInterval(() => {
            if (window.loadRecentConversationsFixed) {
                window.loadRecentConversationsFixed();
            }
        }, 30000); // Refresh every 30 seconds

        // Refresh on visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && window.loadRecentConversationsFixed) {
                setTimeout(() => {
                    window.loadRecentConversationsFixed();
                }, 1000);
            }
        });
    }

    getConversationPreview(conversation) {
        if (conversation.messages && conversation.messages.length > 0) {
            const firstUserMessage = conversation.messages.find(msg => msg.role === 'user');
            if (firstUserMessage) {
                return firstUserMessage.content.substring(0, 60) + (firstUserMessage.content.length > 60 ? '...' : '');
            }
        }
        return conversation.preview || 'New conversation';
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

    retryInitialization() {
        this.retryAttempts++;
        if (this.retryAttempts < this.maxRetries) {
            console.log(`🔄 Retrying conversation fix initialization (${this.retryAttempts}/${this.maxRetries})...`);
            setTimeout(() => this.init(), 2000);
        } else {
            console.error('❌ Conversation fix initialization failed after maximum retries');
        }
    }

    // Public methods
    isReady() {
        return this.isInitialized;
    }

    async refreshConversations() {
        if (window.loadRecentConversationsFixed) {
            await window.loadRecentConversationsFixed();
        }
    }
}

// Initialize conversation fix
document.addEventListener('DOMContentLoaded', () => {
    window.conversationFix = new ConversationFix();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConversationFix;
}