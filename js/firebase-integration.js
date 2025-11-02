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
     * Save to localStorage
     */
    saveToLocalStorage(type, data) {
        try {
            let existingData = JSON.parse(localStorage.getItem(type) || '[]');
            
            // Check if updating existing item
            const existingIndex = existingData.findIndex(item => item.id === data.id);
            if (existingIndex !== -1) {
                existingData[existingIndex] = { ...existingData[existingIndex], ...data };
            } else {
                existingData.unshift(data);
            }
            
            localStorage.setItem(type, JSON.stringify(existingData));
        } catch (error) {
            console.error('LocalStorage save error:', error);
        }
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
    const savedData = {
        id: Date.now(),
        content: content,
        question: originalQuestion,
        timestamp: timestamp,
        mode: window.selectedMode || 'general',
        synced: false
    };

    switch (type) {
        case 'note':
            savedData.title = originalQuestion.substring(0, 50) + '...';
            savedData.tags = ['ai-generated'];
            savedData.category = 'AI Responses';
            await window.firebaseIntegration.saveData('notes', savedData);
            break;
            
        case 'flashcard':
            savedData.front = originalQuestion;
            savedData.back = content;
            savedData.tags = ['ai-generated'];
            savedData.difficulty = 'medium';
            await window.firebaseIntegration.saveData('flashcards', savedData);
            break;
            
        case 'mcq':
            savedData.question = originalQuestion;
            savedData.explanation = content;
            savedData.source = 'AI Generated';
            await window.firebaseIntegration.saveData('mcq-explanations', savedData);
            break;
            
        case 'evaluation':
            savedData.title = 'Answer Evaluation - ' + originalQuestion.substring(0, 30) + '...';
            savedData.evaluation = content;
            savedData.category = 'Answer Evaluations';
            await window.firebaseIntegration.saveData('notes', savedData);
            break;
    }

    console.log(`Saved AI response to ${type}:`, savedData);
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseIntegration;
}