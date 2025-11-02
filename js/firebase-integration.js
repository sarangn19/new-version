/**
 * Firebase Integration Service
 * Handles integration between existing localStorage system and Firebase
 */
class FirebaseIntegration {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.setupEventListeners();
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
     * Enhanced save function that works with both localStorage and Firebase
     */
    async saveData(type, data, options = {}) {
        // Always save to localStorage first for immediate access
        this.saveToLocalStorage(type, data);

        // If online and Firebase is ready, sync to cloud
        if (this.isOnline && window.firebaseManager?.isReady()) {
            try {
                await this.saveToFirebase(type, data);
                data.synced = true;
                this.saveToLocalStorage(type, data); // Update sync status
            } catch (error) {
                console.error('Firebase save failed, queuing for later:', error);
                this.addToSyncQueue(type, data);
            }
        } else {
            // Queue for sync when online
            this.addToSyncQueue(type, data);
        }
    }

    /**
     * Save to localStorage with correct keys
     */
    saveToLocalStorage(type, data) {
        try {
            // Map to correct localStorage keys
            const storageKey = this.getStorageKey(type);
            let existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            // Check if updating existing item
            const existingIndex = existingData.findIndex(item => item.id === data.id);
            if (existingIndex !== -1) {
                existingData[existingIndex] = { ...existingData[existingIndex], ...data };
            } else {
                existingData.unshift(data);
            }
            
            localStorage.setItem(storageKey, JSON.stringify(existingData));
            console.log(`💾 Saved to localStorage (${storageKey}):`, data.title || data.question || 'Item');
        } catch (error) {
            console.error('LocalStorage save error:', error);
        }
    }

    /**
     * Get correct localStorage key for data type
     */
    getStorageKey(type) {
        const keyMap = {
            'notes': 'userNotes',
            'userNotes': 'userNotes',
            'flashcards': 'bookmarks',
            'bookmarks': 'bookmarks',
            'mcq-explanations': 'bookmarks',
            'mcqs': 'bookmarks',
            'conversations': 'conversations'
        };
        return keyMap[type] || type;
    }

    /**
     * Save to Firebase based on data type
     */
    async saveToFirebase(type, data) {
        if (!window.firebaseManager) return;

        switch (type) {
            case 'notes':
                return await window.firebaseManager.saveNote(data);
            case 'flashcards':
                return await window.firebaseManager.saveFlashcard(data);
            case 'mcq-explanations':
                return await window.firebaseManager.saveMCQ(data);
            case 'conversations':
                return await window.firebaseManager.saveConversation(data);
            case 'studyGroups':
                return await window.firebaseManager.createStudyGroup(data);
            default:
                console.warn('Unknown data type for Firebase save:', type);
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
        if (!this.isOnline || !window.firebaseManager?.isReady()) return;

        console.log(`Processing ${this.syncQueue.length} items in sync queue...`);
        
        const itemsToSync = [...this.syncQueue];
        this.syncQueue = [];

        for (const item of itemsToSync) {
            try {
                await this.saveToFirebase(item.type, item.data);
                
                // Update local storage to mark as synced
                item.data.synced = true;
                this.saveToLocalStorage(item.type, item.data);
                
            } catch (error) {
                console.error('Sync queue item failed:', error);
                // Re-add to queue for retry
                this.addToSyncQueue(item.type, item.data);
            }
        }
        
        console.log('Sync queue processing completed');
    }

    /**
     * Get data with Firebase fallback
     */
    async getData(type, options = {}) {
        // First try localStorage for immediate response
        let localData = JSON.parse(localStorage.getItem(type) || '[]');
        
        // If online and Firebase is ready, try to get latest data
        if (this.isOnline && window.firebaseManager?.isReady() && options.syncFromCloud) {
            try {
                let cloudData = [];
                
                switch (type) {
                    case 'notes':
                        cloudData = await window.firebaseManager.getNotes();
                        break;
                    case 'conversations':
                        cloudData = await window.firebaseManager.getConversations();
                        break;
                    case 'studyGroups':
                        cloudData = await window.firebaseManager.getUserStudyGroups();
                        break;
                }
                
                // Merge cloud data with local data
                if (cloudData.length > 0) {
                    const mergedData = this.mergeData(localData, cloudData);
                    localStorage.setItem(type, JSON.stringify(mergedData));
                    return mergedData;
                }
            } catch (error) {
                console.error('Firebase get failed, using local data:', error);
            }
        }
        
        return localData;
    }

    /**
     * Merge local and cloud data intelligently
     */
    mergeData(localData, cloudData) {
        const merged = [...localData];
        
        cloudData.forEach(cloudItem => {
            const existingIndex = merged.findIndex(item => item.id === cloudItem.id);
            if (existingIndex !== -1) {
                // Update if cloud version is newer
                const localItem = merged[existingIndex];
                const cloudTime = new Date(cloudItem.updatedAt || cloudItem.createdAt);
                const localTime = new Date(localItem.updatedAt || localItem.timestamp || localItem.createdAt);
                
                if (cloudTime > localTime) {
                    merged[existingIndex] = { ...localItem, ...cloudItem };
                }
            } else {
                // Add new item from cloud
                merged.push(cloudItem);
            }
        });
        
        // Sort by creation date (newest first)
        return merged.sort((a, b) => {
            const aTime = new Date(a.createdAt || a.timestamp);
            const bTime = new Date(b.createdAt || b.timestamp);
            return bTime - aTime;
        });
    }

    /**
     * Delete data from both localStorage and Firebase
     */
    async deleteData(type, itemId) {
        // Remove from localStorage
        let localData = JSON.parse(localStorage.getItem(type) || '[]');
        localData = localData.filter(item => item.id !== itemId);
        localStorage.setItem(type, JSON.stringify(localData));

        // Remove from Firebase if online
        if (this.isOnline && window.firebaseManager?.isReady()) {
            try {
                if (type === 'studyGroups') {
                    await window.firebaseManager.deleteStudyGroup(itemId);
                }
                // Add other delete operations as needed
            } catch (error) {
                console.error('Firebase delete failed:', error);
            }
        }
    }

    /**
     * Upload file with Firebase Storage
     */
    async uploadFile(file, type, itemId) {
        if (!this.isOnline || !window.firebaseManager?.isReady()) {
            throw new Error('Cannot upload files while offline');
        }

        try {
            let downloadURL;
            
            switch (type) {
                case 'answer-image':
                    downloadURL = await window.firebaseManager.uploadAnswerImage(file, itemId);
                    break;
                case 'profile-picture':
                    downloadURL = await window.firebaseManager.uploadProfilePicture(file);
                    break;
                default:
                    throw new Error('Unknown file type');
            }
            
            return downloadURL;
        } catch (error) {
            console.error('File upload failed:', error);
            throw error;
        }
    }

    /**
     * Get sync status
     */
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            isFirebaseReady: window.firebaseManager?.isReady() || false,
            queueSize: this.syncQueue.length,
            lastSync: localStorage.getItem('lastSyncTime')
        };
    }

    /**
     * Force sync all local data to Firebase
     */
    async forceSyncAll() {
        if (!this.isOnline || !window.firebaseManager?.isReady()) {
            throw new Error('Cannot sync while offline or Firebase not ready');
        }

        try {
            await window.firebaseManager.syncLocalDataToFirebase();
            localStorage.setItem('lastSyncTime', new Date().toISOString());
            console.log('Force sync completed successfully');
        } catch (error) {
            console.error('Force sync failed:', error);
            throw error;
        }
    }
}

// Create global Firebase integration instance
window.firebaseIntegration = new FirebaseIntegration();

// Enhanced save functions for existing code compatibility
window.saveAIResponse = async function(content, type, originalQuestion) {
    const timestamp = new Date().toISOString();
    const selectedMode = window.selectedMode || 'general';
    
    try {
        let savedData;
        
        switch (type) {
            case 'note':
                savedData = {
                    id: Date.now(),
                    title: originalQuestion.length > 50 ? originalQuestion.substring(0, 50) + '...' : originalQuestion,
                    content: content,
                    richContent: content.replace(/\n/g, '<br>'),
                    subject: selectedMode === 'news' ? 'Current Affairs' : 
                            selectedMode === 'mcq' ? 'MCQ Analysis' : 
                            selectedMode === 'essay' ? 'Essay Writing' : 'General',
                    tags: ['ai-generated', selectedMode],
                    attachments: [],
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    color: 'blue',
                    isFavorite: false,
                    isArchived: false,
                    source: 'AI Generated',
                    mode: selectedMode
                };
                
                // Save to Firebase
                if (window.firebaseManager?.isReady()) {
                    await window.firebaseManager.saveNote(savedData);
                    savedData.synced = true;
                } else {
                    savedData.synced = false;
                }
                
                // Also save to localStorage for offline access
                await window.firebaseIntegration.saveData('userNotes', savedData);
                break;
                
            case 'flashcard':
                savedData = {
                    id: Date.now(),
                    title: originalQuestion.length > 50 ? originalQuestion.substring(0, 50) + '...' : originalQuestion,
                    front: originalQuestion,
                    back: content,
                    tags: ['ai-generated', 'flashcard', selectedMode],
                    difficulty: 'medium',
                    category: selectedMode === 'news' ? 'Current Affairs' : 
                             selectedMode === 'mcq' ? 'MCQ Analysis' : 'General',
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    source: 'AI Generated',
                    mode: selectedMode
                };
                
                // Save to Firebase
                if (window.firebaseManager?.isReady()) {
                    await window.firebaseManager.saveFlashcard(savedData);
                    savedData.synced = true;
                } else {
                    savedData.synced = false;
                }
                
                // Also save to localStorage as bookmark for compatibility
                const flashcardBookmark = {
                    ...savedData,
                    url: '#',
                    description: content,
                    category: 'notes',
                    isImportant: false,
                    notes: `Front: ${originalQuestion}\n\nBack: ${content}`,
                    metadata: {
                        type: 'flashcard',
                        front: originalQuestion,
                        back: content,
                        difficulty: 'medium',
                        source: 'AI Generated'
                    }
                };
                await window.firebaseIntegration.saveData('bookmarks', flashcardBookmark);
                break;
                
            case 'mcq':
                savedData = {
                    id: Date.now(),
                    title: `MCQ: ${originalQuestion.length > 40 ? originalQuestion.substring(0, 40) + '...' : originalQuestion}`,
                    question: originalQuestion,
                    explanation: content,
                    tags: ['ai-generated', 'mcq', selectedMode],
                    category: selectedMode === 'news' ? 'Current Affairs' : 
                             selectedMode === 'essay' ? 'Essay Writing' : 'General',
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    source: 'AI Generated',
                    mode: selectedMode
                };
                
                // Save to Firebase
                if (window.firebaseManager?.isReady()) {
                    await window.firebaseManager.saveMCQ(savedData);
                    savedData.synced = true;
                } else {
                    savedData.synced = false;
                }
                
                // Also save to localStorage as bookmark for compatibility
                const mcqBookmark = {
                    ...savedData,
                    url: '#',
                    description: content,
                    category: 'notes',
                    isImportant: false,
                    notes: `Question: ${originalQuestion}\n\nExplanation: ${content}`,
                    metadata: {
                        type: 'mcq',
                        question: originalQuestion,
                        explanation: content,
                        source: 'AI Generated'
                    }
                };
                await window.firebaseIntegration.saveData('bookmarks', mcqBookmark);
                break;
                
            case 'evaluation':
                savedData = {
                    id: Date.now(),
                    title: 'Answer Evaluation - ' + originalQuestion.substring(0, 30) + '...',
                    content: content,
                    richContent: content.replace(/\n/g, '<br>'),
                    subject: 'Answer Evaluation',
                    tags: ['ai-generated', 'evaluation', selectedMode],
                    attachments: [],
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    color: 'orange',
                    isFavorite: false,
                    isArchived: false,
                    source: 'AI Generated',
                    mode: selectedMode,
                    evaluation: content,
                    originalQuestion: originalQuestion
                };
                
                // Save to Firebase
                if (window.firebaseManager?.isReady()) {
                    await window.firebaseManager.saveNote(savedData);
                    savedData.synced = true;
                } else {
                    savedData.synced = false;
                }
                
                await window.firebaseIntegration.saveData('userNotes', savedData);
                break;
        }

        console.log(`✅ Saved AI response to ${type} (Firebase + localStorage):`, savedData);
        
        // Trigger count update event
        window.dispatchEvent(new CustomEvent('contentSaved', {
            detail: { type, data: savedData }
        }));
        
        return savedData;
        
    } catch (error) {
        console.error(`❌ Error saving AI response to ${type}:`, error);
        throw error;
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseIntegration;
}