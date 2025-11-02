/**
 * Conversation Storage System
 * Manages conversation data models, local storage, history retrieval, and data retention policies
 */
class ConversationStorage {
    constructor(config = {}) {
        this.storagePrefix = config.storagePrefix || 'upsc_ai_';
        this.maxConversations = config.maxConversations || 100;
        this.maxContextMessages = config.maxContextMessages || 10;
        this.retentionDays = config.retentionDays || 30;
        this.compressionEnabled = config.compressionEnabled || false;
        
        // Initialize storage keys
        this.keys = {
            conversations: `${this.storagePrefix}conversations`,
            activeConversation: `${this.storagePrefix}active_conversation`,
            conversationIndex: `${this.storagePrefix}conversation_index`,
            metadata: `${this.storagePrefix}metadata`
        };
        
        this.initializeStorage();
    }

    /**
     * Initialize storage structure and perform cleanup
     */
    initializeStorage() {
        try {
            // Create conversation index if it doesn't exist
            if (!localStorage.getItem(this.keys.conversationIndex)) {
                localStorage.setItem(this.keys.conversationIndex, JSON.stringify([]));
            }
            
            // Create metadata if it doesn't exist
            if (!localStorage.getItem(this.keys.metadata)) {
                const metadata = {
                    version: '1.0.0',
                    createdAt: new Date().toISOString(),
                    lastCleanup: new Date().toISOString()
                };
                localStorage.setItem(this.keys.metadata, JSON.stringify(metadata));
            }
            
            // Perform cleanup on initialization
            this.performCleanup();
        } catch (error) {
            console.error('Failed to initialize conversation storage:', error);
        }
    }

    /**
     * Create a new conversation
     * @param {Object} conversationData - Initial conversation data
     * @returns {Object} Created conversation object
     */
    createConversation(conversationData = {}) {
        try {
            const conversation = {
                id: this.generateConversationId(),
                userId: conversationData.userId || 'default',
                mode: conversationData.mode || 'general',
                messages: [],
                context: {
                    subject: conversationData.subject || '',
                    topic: conversationData.topic || '',
                    difficulty: conversationData.difficulty || 'medium',
                    userGoals: conversationData.userGoals || []
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true,
                messageCount: 0,
                lastMessageAt: null
            };

            // Save conversation
            this.saveConversation(conversation);
            
            // Update conversation index
            this.addToIndex(conversation.id, conversation.createdAt);
            
            // Set as active conversation
            this.setActiveConversation(conversation.id);
            
            return conversation;
        } catch (error) {
            console.error('Failed to create conversation:', error);
            throw new Error('Failed to create conversation');
        }
    }

    /**
     * Save conversation to storage
     * @param {Object} conversation - Conversation object to save
     */
    saveConversation(conversation) {
        try {
            const storageKey = `${this.keys.conversations}_${conversation.id}`;
            conversation.updatedAt = new Date().toISOString();
            
            if (this.compressionEnabled) {
                // Simple compression by removing unnecessary whitespace
                const compressed = JSON.stringify(conversation);
                localStorage.setItem(storageKey, compressed);
            } else {
                localStorage.setItem(storageKey, JSON.stringify(conversation));
            }
        } catch (error) {
            console.error('Failed to save conversation:', error);
            throw new Error('Failed to save conversation');
        }
    }

    /**
     * Load conversation from storage
     * @param {string} conversationId - ID of conversation to load
     * @returns {Object|null} Conversation object or null if not found
     */
    loadConversation(conversationId) {
        try {
            const storageKey = `${this.keys.conversations}_${conversationId}`;
            const conversationData = localStorage.getItem(storageKey);
            
            if (!conversationData) {
                return null;
            }
            
            return JSON.parse(conversationData);
        } catch (error) {
            console.error('Failed to load conversation:', error);
            return null;
        }
    }

    /**
     * Add message to conversation
     * @param {string} conversationId - ID of conversation
     * @param {Object} message - Message object to add
     */
    addMessage(conversationId, message) {
        try {
            const conversation = this.loadConversation(conversationId);
            if (!conversation) {
                throw new Error('Conversation not found');
            }

            const messageWithId = {
                id: this.generateMessageId(),
                role: message.role,
                content: message.content,
                timestamp: new Date().toISOString(),
                metadata: {
                    tokens: message.tokens || 0,
                    processingTime: message.processingTime || 0,
                    confidence: message.confidence || 1.0,
                    ...message.metadata
                }
            };

            conversation.messages.push(messageWithId);
            conversation.messageCount = conversation.messages.length;
            conversation.lastMessageAt = messageWithId.timestamp;
            
            // Maintain context window size
            if (conversation.messages.length > this.maxContextMessages * 2) {
                // Keep system messages and recent messages
                const systemMessages = conversation.messages.filter(msg => msg.role === 'system');
                const recentMessages = conversation.messages.slice(-this.maxContextMessages);
                conversation.messages = [...systemMessages, ...recentMessages];
                conversation.messageCount = conversation.messages.length;
            }

            this.saveConversation(conversation);
            return messageWithId;
        } catch (error) {
            console.error('Failed to add message:', error);
            throw new Error('Failed to add message to conversation');
        }
    }

    /**
     * Get conversation history with optional filtering
     * @param {string} conversationId - ID of conversation
     * @param {Object} options - Filtering options
     * @returns {Array} Array of messages
     */
    getConversationHistory(conversationId, options = {}) {
        try {
            const conversation = this.loadConversation(conversationId);
            if (!conversation) {
                return [];
            }

            let messages = [...conversation.messages];

            // Apply filters
            if (options.limit) {
                messages = messages.slice(-options.limit);
            }

            if (options.role) {
                messages = messages.filter(msg => msg.role === options.role);
            }

            if (options.since) {
                const sinceDate = new Date(options.since);
                messages = messages.filter(msg => new Date(msg.timestamp) >= sinceDate);
            }

            return messages;
        } catch (error) {
            console.error('Failed to get conversation history:', error);
            return [];
        }
    }

    /**
     * Get conversation context for AI processing
     * @param {string} conversationId - ID of conversation
     * @returns {Object} Context object with recent messages and metadata
     */
    getConversationContext(conversationId) {
        try {
            const conversation = this.loadConversation(conversationId);
            if (!conversation) {
                return null;
            }

            const recentMessages = conversation.messages.slice(-this.maxContextMessages);
            
            return {
                conversationId: conversation.id,
                mode: conversation.mode,
                context: conversation.context,
                messages: recentMessages,
                messageCount: conversation.messageCount,
                createdAt: conversation.createdAt,
                lastMessageAt: conversation.lastMessageAt
            };
        } catch (error) {
            console.error('Failed to get conversation context:', error);
            return null;
        }
    }

    /**
     * List all conversations with pagination
     * @param {Object} options - Pagination and filtering options
     * @returns {Array} Array of conversation summaries
     */
    listConversations(options = {}) {
        try {
            const index = this.getConversationIndex();
            let conversations = [];

            // Load conversation summaries
            for (const entry of index) {
                const conversation = this.loadConversation(entry.id);
                if (conversation) {
                    conversations.push({
                        id: conversation.id,
                        mode: conversation.mode,
                        context: conversation.context,
                        messageCount: conversation.messageCount,
                        createdAt: conversation.createdAt,
                        updatedAt: conversation.updatedAt,
                        lastMessageAt: conversation.lastMessageAt,
                        isActive: conversation.isActive,
                        preview: this.getConversationPreview(conversation)
                    });
                }
            }

            // Apply filters
            if (options.mode) {
                conversations = conversations.filter(conv => conv.mode === options.mode);
            }

            if (options.isActive !== undefined) {
                conversations = conversations.filter(conv => conv.isActive === options.isActive);
            }

            // Sort by last message time (most recent first)
            conversations.sort((a, b) => {
                const timeA = new Date(a.lastMessageAt || a.updatedAt);
                const timeB = new Date(b.lastMessageAt || b.updatedAt);
                return timeB - timeA;
            });

            // Apply pagination
            const offset = options.offset || 0;
            const limit = options.limit || 20;
            
            return conversations.slice(offset, offset + limit);
        } catch (error) {
            console.error('Failed to list conversations:', error);
            return [];
        }
    }

    /**
     * Delete conversation and cleanup storage
     * @param {string} conversationId - ID of conversation to delete
     */
    deleteConversation(conversationId) {
        try {
            const storageKey = `${this.keys.conversations}_${conversationId}`;
            localStorage.removeItem(storageKey);
            
            // Remove from index
            this.removeFromIndex(conversationId);
            
            // Clear active conversation if it was the deleted one
            const activeId = this.getActiveConversationId();
            if (activeId === conversationId) {
                localStorage.removeItem(this.keys.activeConversation);
            }
        } catch (error) {
            console.error('Failed to delete conversation:', error);
            throw new Error('Failed to delete conversation');
        }
    }

    /**
     * Set active conversation
     * @param {string} conversationId - ID of conversation to set as active
     */
    setActiveConversation(conversationId) {
        try {
            localStorage.setItem(this.keys.activeConversation, conversationId);
        } catch (error) {
            console.error('Failed to set active conversation:', error);
        }
    }

    /**
     * Get active conversation ID
     * @returns {string|null} Active conversation ID or null
     */
    getActiveConversationId() {
        try {
            return localStorage.getItem(this.keys.activeConversation);
        } catch (error) {
            console.error('Failed to get active conversation:', error);
            return null;
        }
    }

    /**
     * Get active conversation
     * @returns {Object|null} Active conversation object or null
     */
    getActiveConversation() {
        try {
            const activeId = this.getActiveConversationId();
            return activeId ? this.loadConversation(activeId) : null;
        } catch (error) {
            console.error('Failed to get active conversation:', error);
            return null;
        }
    }

    /**
     * Perform cleanup based on retention policies
     */
    performCleanup() {
        try {
            const now = new Date();
            const cutoffDate = new Date(now.getTime() - (this.retentionDays * 24 * 60 * 60 * 1000));
            
            const index = this.getConversationIndex();
            const conversationsToDelete = [];
            
            // Check each conversation for cleanup
            for (const entry of index) {
                const conversation = this.loadConversation(entry.id);
                if (conversation) {
                    const lastActivity = new Date(conversation.lastMessageAt || conversation.updatedAt);
                    
                    // Mark for deletion if older than retention period and not active
                    if (lastActivity < cutoffDate && !conversation.isActive) {
                        conversationsToDelete.push(conversation.id);
                    }
                }
            }
            
            // Delete old conversations
            for (const conversationId of conversationsToDelete) {
                this.deleteConversation(conversationId);
            }
            
            // Enforce max conversations limit
            this.enforceConversationLimit();
            
            // Update cleanup timestamp
            this.updateCleanupTimestamp();
            
            console.log(`Cleanup completed: ${conversationsToDelete.length} conversations removed`);
        } catch (error) {
            console.error('Failed to perform cleanup:', error);
        }
    }

    /**
     * Enforce maximum conversation limit
     */
    enforceConversationLimit() {
        try {
            const index = this.getConversationIndex();
            
            if (index.length > this.maxConversations) {
                // Sort by creation date (oldest first)
                index.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                
                // Delete oldest conversations
                const toDelete = index.slice(0, index.length - this.maxConversations);
                for (const entry of toDelete) {
                    this.deleteConversation(entry.id);
                }
            }
        } catch (error) {
            console.error('Failed to enforce conversation limit:', error);
        }
    }

    /**
     * Export conversations for backup
     * @param {Object} options - Export options
     * @returns {Object} Export data
     */
    exportConversations(options = {}) {
        try {
            const conversations = [];
            const index = this.getConversationIndex();
            
            for (const entry of index) {
                const conversation = this.loadConversation(entry.id);
                if (conversation) {
                    // Apply filters
                    if (options.mode && conversation.mode !== options.mode) continue;
                    if (options.since && new Date(conversation.createdAt) < new Date(options.since)) continue;
                    
                    conversations.push(conversation);
                }
            }
            
            return {
                version: '1.0.0',
                exportedAt: new Date().toISOString(),
                conversationCount: conversations.length,
                conversations: conversations
            };
        } catch (error) {
            console.error('Failed to export conversations:', error);
            throw new Error('Failed to export conversations');
        }
    }

    /**
     * Import conversations from backup
     * @param {Object} exportData - Export data to import
     * @returns {Object} Import result
     */
    importConversations(exportData) {
        try {
            if (!exportData.conversations || !Array.isArray(exportData.conversations)) {
                throw new Error('Invalid export data format');
            }
            
            let imported = 0;
            let skipped = 0;
            
            for (const conversation of exportData.conversations) {
                // Check if conversation already exists
                if (this.loadConversation(conversation.id)) {
                    skipped++;
                    continue;
                }
                
                // Save imported conversation
                this.saveConversation(conversation);
                this.addToIndex(conversation.id, conversation.createdAt);
                imported++;
            }
            
            return {
                imported,
                skipped,
                total: exportData.conversations.length
            };
        } catch (error) {
            console.error('Failed to import conversations:', error);
            throw new Error('Failed to import conversations');
        }
    }

    /**
     * Get storage statistics
     * @returns {Object} Storage statistics
     */
    getStorageStats() {
        try {
            const index = this.getConversationIndex();
            let totalMessages = 0;
            let totalSize = 0;
            
            for (const entry of index) {
                const conversation = this.loadConversation(entry.id);
                if (conversation) {
                    totalMessages += conversation.messageCount || 0;
                    totalSize += JSON.stringify(conversation).length;
                }
            }
            
            return {
                conversationCount: index.length,
                totalMessages,
                totalSize,
                averageMessagesPerConversation: index.length > 0 ? Math.round(totalMessages / index.length) : 0,
                storageUsage: `${(totalSize / 1024).toFixed(2)} KB`
            };
        } catch (error) {
            console.error('Failed to get storage stats:', error);
            return {
                conversationCount: 0,
                totalMessages: 0,
                totalSize: 0,
                averageMessagesPerConversation: 0,
                storageUsage: '0 KB'
            };
        }
    }

    // Private helper methods

    /**
     * Generate unique conversation ID
     * @returns {string} Unique conversation ID
     */
    generateConversationId() {
        return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate unique message ID
     * @returns {string} Unique message ID
     */
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get conversation index
     * @returns {Array} Conversation index array
     */
    getConversationIndex() {
        try {
            const indexData = localStorage.getItem(this.keys.conversationIndex);
            return indexData ? JSON.parse(indexData) : [];
        } catch (error) {
            console.error('Failed to get conversation index:', error);
            return [];
        }
    }

    /**
     * Add conversation to index
     * @param {string} conversationId - Conversation ID
     * @param {string} createdAt - Creation timestamp
     */
    addToIndex(conversationId, createdAt) {
        try {
            const index = this.getConversationIndex();
            
            // Check if already exists
            if (!index.find(entry => entry.id === conversationId)) {
                index.push({
                    id: conversationId,
                    createdAt: createdAt
                });
                localStorage.setItem(this.keys.conversationIndex, JSON.stringify(index));
            }
        } catch (error) {
            console.error('Failed to add to index:', error);
        }
    }

    /**
     * Remove conversation from index
     * @param {string} conversationId - Conversation ID to remove
     */
    removeFromIndex(conversationId) {
        try {
            const index = this.getConversationIndex();
            const filteredIndex = index.filter(entry => entry.id !== conversationId);
            localStorage.setItem(this.keys.conversationIndex, JSON.stringify(filteredIndex));
        } catch (error) {
            console.error('Failed to remove from index:', error);
        }
    }

    /**
     * Get conversation preview text
     * @param {Object} conversation - Conversation object
     * @returns {string} Preview text
     */
    getConversationPreview(conversation) {
        if (!conversation.messages || conversation.messages.length === 0) {
            return 'New conversation';
        }
        
        const firstUserMessage = conversation.messages.find(msg => msg.role === 'user');
        if (firstUserMessage) {
            return firstUserMessage.content.substring(0, 100) + (firstUserMessage.content.length > 100 ? '...' : '');
        }
        
        return 'Conversation started';
    }

    /**
     * Update cleanup timestamp
     */
    updateCleanupTimestamp() {
        try {
            const metadata = JSON.parse(localStorage.getItem(this.keys.metadata) || '{}');
            metadata.lastCleanup = new Date().toISOString();
            localStorage.setItem(this.keys.metadata, JSON.stringify(metadata));
        } catch (error) {
            console.error('Failed to update cleanup timestamp:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConversationStorage;
} else if (typeof window !== 'undefined') {
    window.ConversationStorage = ConversationStorage;
}