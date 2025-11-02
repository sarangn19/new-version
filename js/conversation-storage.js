/**
 * Conversation Storage System
 * Manages conversation data models with Firebase integration and localStorage fallback
 */
class ConversationStorage {
    constructor(config = {}) {
        this.storagePrefix = config.storagePrefix || 'upsc_ai_';
        this.maxConversations = config.maxConversations || 100;
        this.maxContextMessages = config.maxContextMessages || 10;
        this.retentionDays = config.retentionDays || 30;
        this.compressionEnabled = config.compressionEnabled || false;
        this.useFirebase = config.useFirebase !== false; // Default to true
        
        // Initialize storage keys
        this.keys = {
            conversations: `${this.storagePrefix}conversations`,
            activeConversation: `${this.storagePrefix}active_conversation`,
            conversationIndex: `${this.storagePrefix}conversation_index`,
            metadata: `${this.storagePrefix}metadata`
        };
        
        // Firebase integration
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.setupEventListeners();
        
        this.initializeStorage();
    }

    /**
     * Setup event listeners for online/offline status
     */
    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processSyncQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    /**
     * Initialize storage structure and perform cleanup
     */
    async initializeStorage() {
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
            
            // Sync with Firebase if available and online
            if (this.useFirebase && this.isOnline && this.isFirebaseReady()) {
                await this.syncWithFirebase();
            }
            
            // Perform cleanup on initialization
            this.performCleanup();
        } catch (error) {
            console.error('Failed to initialize conversation storage:', error);
        }
    }

    /**
     * Check if Firebase is ready
     */
    isFirebaseReady() {
        return window.firebaseUtils && window.firebaseUtils.auth && window.firebaseUtils.auth.currentUser;
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
     * Save conversation to storage (Firebase + localStorage)
     * @param {Object} conversation - Conversation object to save
     */
    async saveConversation(conversation) {
        try {
            conversation.updatedAt = new Date().toISOString();
            
            // Always save to localStorage first for immediate access
            const storageKey = `${this.keys.conversations}_${conversation.id}`;
            if (this.compressionEnabled) {
                const compressed = JSON.stringify(conversation);
                localStorage.setItem(storageKey, compressed);
            } else {
                localStorage.setItem(storageKey, JSON.stringify(conversation));
            }
            
            // Save to Firebase if available and online
            if (this.useFirebase && this.isOnline && this.isFirebaseReady()) {
                try {
                    await this.saveConversationToFirebase(conversation);
                    conversation.synced = true;
                    localStorage.setItem(storageKey, JSON.stringify(conversation));
                } catch (firebaseError) {
                    console.warn('Firebase save failed, queuing for sync:', firebaseError);
                    this.addToSyncQueue('conversation', conversation);
                }
            } else {
                // Queue for sync when online
                this.addToSyncQueue('conversation', conversation);
            }
        } catch (error) {
            console.error('Failed to save conversation:', error);
            throw new Error('Failed to save conversation');
        }
    }

    /**
     * Save conversation to Firebase
     * @param {Object} conversation - Conversation object
     */
    async saveConversationToFirebase(conversation) {
        if (!this.isFirebaseReady()) {
            throw new Error('Firebase not ready');
        }

        const conversationData = {
            ...conversation,
            userId: window.firebaseUtils.auth.currentUser.uid,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await window.firebaseUtils.db
            .collection('users')
            .doc(window.firebaseUtils.auth.currentUser.uid)
            .collection('conversations')
            .doc(conversation.id)
            .set(conversationData, { merge: true });
    }

    /**
     * Load conversation from storage (Firebase with localStorage fallback)
     * @param {string} conversationId - ID of conversation to load
     * @returns {Object|null} Conversation object or null if not found
     */
    async loadConversation(conversationId) {
        try {
            // First try localStorage for immediate response
            const storageKey = `${this.keys.conversations}_${conversationId}`;
            const localData = localStorage.getItem(storageKey);
            let localConversation = null;
            
            if (localData) {
                localConversation = JSON.parse(localData);
            }
            
            // If online and Firebase is ready, try to get latest from Firebase
            if (this.useFirebase && this.isOnline && this.isFirebaseReady()) {
                try {
                    const firebaseConversation = await this.loadConversationFromFirebase(conversationId);
                    
                    if (firebaseConversation) {
                        // Compare timestamps and use the newer version
                        if (!localConversation || 
                            new Date(firebaseConversation.updatedAt) > new Date(localConversation.updatedAt)) {
                            
                            // Update localStorage with Firebase data
                            localStorage.setItem(storageKey, JSON.stringify(firebaseConversation));
                            return firebaseConversation;
                        }
                    }
                } catch (firebaseError) {
                    console.warn('Firebase load failed, using local data:', firebaseError);
                }
            }
            
            return localConversation;
        } catch (error) {
            console.error('Failed to load conversation:', error);
            return null;
        }
    }

    /**
     * Load conversation from Firebase
     * @param {string} conversationId - ID of conversation to load
     * @returns {Object|null} Conversation object or null if not found
     */
    async loadConversationFromFirebase(conversationId) {
        if (!this.isFirebaseReady()) {
            return null;
        }

        const doc = await window.firebaseUtils.db
            .collection('users')
            .doc(window.firebaseUtils.auth.currentUser.uid)
            .collection('conversations')
            .doc(conversationId)
            .get();

        if (doc.exists) {
            const data = doc.data();
            // Convert Firebase timestamp to ISO string
            if (data.updatedAt && data.updatedAt.toDate) {
                data.updatedAt = data.updatedAt.toDate().toISOString();
            }
            if (data.createdAt && data.createdAt.toDate) {
                data.createdAt = data.createdAt.toDate().toISOString();
            }
            return data;
        }
        
        return null;
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
     * List all conversations with pagination (Firebase + localStorage)
     * @param {Object} options - Pagination and filtering options
     * @returns {Array} Array of conversation summaries
     */
    async listConversations(options = {}) {
        try {
            let conversations = [];
            
            // Get conversations from Firebase if available
            if (this.useFirebase && this.isOnline && this.isFirebaseReady()) {
                try {
                    const firebaseConversations = await this.listConversationsFromFirebase(options);
                    conversations = firebaseConversations;
                    
                    // Update localStorage with Firebase data
                    for (const conv of conversations) {
                        const storageKey = `${this.keys.conversations}_${conv.id}`;
                        localStorage.setItem(storageKey, JSON.stringify(conv));
                        this.addToIndex(conv.id, conv.createdAt);
                    }
                } catch (firebaseError) {
                    console.warn('Firebase list failed, using local data:', firebaseError);
                }
            }
            
            // Fallback to localStorage if Firebase failed or unavailable
            if (conversations.length === 0) {
                const index = this.getConversationIndex();
                
                // Load conversation summaries from localStorage
                for (const entry of index) {
                    const conversation = await this.loadConversation(entry.id);
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
     * List conversations from Firebase
     * @param {Object} options - Query options
     * @returns {Array} Array of conversations
     */
    async listConversationsFromFirebase(options = {}) {
        if (!this.isFirebaseReady()) {
            return [];
        }

        let query = window.firebaseUtils.db
            .collection('users')
            .doc(window.firebaseUtils.auth.currentUser.uid)
            .collection('conversations')
            .orderBy('updatedAt', 'desc');

        // Apply filters
        if (options.mode) {
            query = query.where('mode', '==', options.mode);
        }

        if (options.isActive !== undefined) {
            query = query.where('isActive', '==', options.isActive);
        }

        // Apply limit
        const limit = options.limit || 20;
        query = query.limit(limit);

        const snapshot = await query.get();
        const conversations = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            // Convert Firebase timestamps
            if (data.updatedAt && data.updatedAt.toDate) {
                data.updatedAt = data.updatedAt.toDate().toISOString();
            }
            if (data.createdAt && data.createdAt.toDate) {
                data.createdAt = data.createdAt.toDate().toISOString();
            }
            if (data.lastMessageAt && data.lastMessageAt.toDate) {
                data.lastMessageAt = data.lastMessageAt.toDate().toISOString();
            }
            
            conversations.push({
                ...data,
                preview: this.getConversationPreview(data)
            });
        });

        return conversations;
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

    /**
     * Add item to sync queue
     */
    addToSyncQueue(type, data) {
        this.syncQueue.push({ type, data, timestamp: Date.now() });
        
        // Limit queue size
        if (this.syncQueue.length > 100) {
            this.syncQueue = this.syncQueue.slice(-100);
        }
    }

    /**
     * Process sync queue when online
     */
    async processSyncQueue() {
        if (!this.isOnline || !this.isFirebaseReady()) return;

        console.log(`Processing ${this.syncQueue.length} items in sync queue...`);
        
        const itemsToSync = [...this.syncQueue];
        this.syncQueue = [];

        for (const item of itemsToSync) {
            try {
                if (item.type === 'conversation') {
                    await this.saveConversationToFirebase(item.data);
                    
                    // Update local storage to mark as synced
                    item.data.synced = true;
                    const storageKey = `${this.keys.conversations}_${item.data.id}`;
                    localStorage.setItem(storageKey, JSON.stringify(item.data));
                }
            } catch (error) {
                console.error('Sync queue item failed:', error);
                // Re-add to queue for retry
                this.addToSyncQueue(item.type, item.data);
            }
        }
        
        console.log('Sync queue processing completed');
    }

    /**
     * Sync with Firebase - pull latest conversations
     */
    async syncWithFirebase() {
        if (!this.isFirebaseReady()) return;

        try {
            console.log('Syncing conversations with Firebase...');
            
            // Get all conversations from Firebase
            const firebaseConversations = await this.listConversationsFromFirebase({ limit: 100 });
            
            // Update localStorage with Firebase data
            for (const conversation of firebaseConversations) {
                const storageKey = `${this.keys.conversations}_${conversation.id}`;
                const localData = localStorage.getItem(storageKey);
                
                if (!localData) {
                    // New conversation from Firebase
                    localStorage.setItem(storageKey, JSON.stringify(conversation));
                    this.addToIndex(conversation.id, conversation.createdAt);
                } else {
                    // Check if Firebase version is newer
                    const localConversation = JSON.parse(localData);
                    if (new Date(conversation.updatedAt) > new Date(localConversation.updatedAt)) {
                        localStorage.setItem(storageKey, JSON.stringify(conversation));
                    }
                }
            }
            
            console.log(`Synced ${firebaseConversations.length} conversations from Firebase`);
        } catch (error) {
            console.error('Firebase sync failed:', error);
        }
    }

    /**
     * Force sync all local data to Firebase
     */
    async forceSyncToFirebase() {
        if (!this.isFirebaseReady()) {
            throw new Error('Firebase not ready');
        }

        try {
            const index = this.getConversationIndex();
            let syncedCount = 0;
            
            for (const entry of index) {
                const conversation = await this.loadConversation(entry.id);
                if (conversation && !conversation.synced) {
                    await this.saveConversationToFirebase(conversation);
                    
                    // Mark as synced
                    conversation.synced = true;
                    const storageKey = `${this.keys.conversations}_${conversation.id}`;
                    localStorage.setItem(storageKey, JSON.stringify(conversation));
                    
                    syncedCount++;
                }
            }
            
            console.log(`Force synced ${syncedCount} conversations to Firebase`);
            return syncedCount;
        } catch (error) {
            console.error('Force sync failed:', error);
            throw error;
        }
    }

    /**
     * Get sync status
     */
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            isFirebaseReady: this.isFirebaseReady(),
            queueSize: this.syncQueue.length,
            lastSync: localStorage.getItem('lastConversationSync')
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConversationStorage;
} else if (typeof window !== 'undefined') {
    window.ConversationStorage = ConversationStorage;
}