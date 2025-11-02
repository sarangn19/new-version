// OfflineManager - Offline functionality and data synchronization
class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.offlineData = new Map();
    this.lastSyncTime = null;
    this.syncInProgress = false;
    
    this.initializeOfflineSupport();
    this.loadOfflineData();
    this.initializeNetworkListeners();
    this.initializeOfflineIndicators();
  }

  // Initialize offline support
  initializeOfflineSupport() {
    // Register service worker if supported
    if ('serviceWorker' in navigator) {
      this.registerServiceWorker();
    }

    // Initialize offline storage
    this.initializeOfflineStorage();
    
    // Set up periodic sync attempts
    this.setupPeriodicSync();
  }

  // Register service worker for offline caching
  async registerServiceWorker() {
    try {
      // Create a simple service worker inline
      const swCode = `
        const CACHE_NAME = 'learning-platform-v1';
        const OFFLINE_URLS = [
          '/',
          '/styles/glassmorphism.css',
          '/styles/theme-system.css',
          '/styles/accessibility.css',
          '/js/profile-manager.js',
          '/js/error-handler.js',
          '/js/offline-manager.js'
        ];

        self.addEventListener('install', event => {
          event.waitUntil(
            caches.open(CACHE_NAME)
              .then(cache => cache.addAll(OFFLINE_URLS))
          );
        });

        self.addEventListener('fetch', event => {
          event.respondWith(
            caches.match(event.request)
              .then(response => {
                return response || fetch(event.request);
              })
              .catch(() => {
                // Return offline page for navigation requests
                if (event.request.mode === 'navigate') {
                  return caches.match('/offline.html');
                }
              })
          );
        });
      `;

      const blob = new Blob([swCode], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(blob);
      
      const registration = await navigator.serviceWorker.register(swUrl);
      console.log('Service Worker registered:', registration);
      
      URL.revokeObjectURL(swUrl);
    } catch (error) {
      console.warn('Service Worker registration failed:', error);
    }
  }

  // Initialize offline storage
  initializeOfflineStorage() {
    // Define core data that should be available offline
    this.coreOfflineData = [
      'userProfile',
      'bookmarks',
      'studyStats',
      'preferences',
      'notes',
      'flashcards',
      'studySessions',
      'goals',
      'streakData'
    ];

    // Cache current data for offline use
    this.cacheCurrentData();
  }

  // Cache current data for offline access
  cacheCurrentData() {
    this.coreOfflineData.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          this.offlineData.set(key, JSON.parse(data));
        }
      } catch (error) {
        console.warn(`Failed to cache data for ${key}:`, error);
      }
    });
  }

  // Initialize network listeners
  initializeNetworkListeners() {
    window.addEventListener('online', () => {
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.handleOffline();
    });

    // Initial status check
    this.updateConnectionStatus();
  }

  // Handle online event
  async handleOnline() {
    this.isOnline = true;
    this.updateConnectionStatus();
    this.showConnectionNotification('Connection restored', 'success');
    
    // Start synchronization
    await this.syncOfflineData();
  }

  // Handle offline event
  handleOffline() {
    this.isOnline = false;
    this.updateConnectionStatus();
    this.showConnectionNotification('You are offline - limited functionality available', 'warning');
    
    // Cache current state
    this.cacheCurrentData();
  }

  // Update connection status indicators
  updateConnectionStatus() {
    // Update offline indicators
    const offlineIndicators = document.querySelectorAll('.offline-indicator');
    offlineIndicators.forEach(indicator => {
      if (this.isOnline) {
        indicator.classList.add('hidden');
      } else {
        indicator.classList.remove('hidden');
      }
    });

    // Update online indicators
    const onlineIndicators = document.querySelectorAll('.online-indicator');
    onlineIndicators.forEach(indicator => {
      if (this.isOnline) {
        indicator.classList.remove('hidden');
      } else {
        indicator.classList.add('hidden');
      }
    });

    // Update connection status text
    const statusElements = document.querySelectorAll('.connection-status');
    statusElements.forEach(element => {
      element.textContent = this.isOnline ? 'Online' : 'Offline';
      element.className = `connection-status ${this.isOnline ? 'text-green-400' : 'text-yellow-400'}`;
    });

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('connectionStatusChanged', {
      detail: { isOnline: this.isOnline }
    }));
  }

  // Initialize offline indicators in the UI
  initializeOfflineIndicators() {
    // Add offline indicator to the page if it doesn't exist
    if (!document.querySelector('.offline-indicator')) {
      this.createOfflineIndicator();
    }
  }

  // Create offline indicator element
  createOfflineIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'offline-indicator fixed top-0 left-0 right-0 bg-yellow-600 text-white text-center py-2 text-sm z-50 hidden';
    indicator.innerHTML = `
      <div class="flex items-center justify-center gap-2">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
        <span>You are offline - some features may be limited</span>
        <button onclick="offlineManager.checkConnection()" class="ml-4 bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs transition-colors">
          Check Connection
        </button>
      </div>
    `;
    
    document.body.insertBefore(indicator, document.body.firstChild);
  }

  // Check connection status
  async checkConnection() {
    try {
      // Try to fetch a small resource to test connectivity
      const response = await fetch('data:text/plain,', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        if (!this.isOnline) {
          this.handleOnline();
        }
      }
    } catch (error) {
      if (this.isOnline) {
        this.handleOffline();
      }
    }
  }

  // Queue operation for sync when online
  queueForSync(operation) {
    const syncItem = {
      id: this.generateSyncId(),
      operation: operation.type,
      data: operation.data,
      timestamp: new Date().toISOString(),
      retries: 0,
      maxRetries: 3
    };

    this.syncQueue.push(syncItem);
    this.saveSyncQueue();
    
    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncOfflineData();
    }

    return syncItem.id;
  }

  // Generate unique sync ID
  generateSyncId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Sync offline data when connection is restored
  async syncOfflineData() {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    this.showSyncProgress(true);

    try {
      // Process sync queue
      const successfulSyncs = [];
      const failedSyncs = [];

      for (const item of this.syncQueue) {
        try {
          await this.processSyncItem(item);
          successfulSyncs.push(item);
        } catch (error) {
          item.retries++;
          if (item.retries >= item.maxRetries) {
            failedSyncs.push(item);
          }
          console.warn(`Sync failed for item ${item.id}:`, error);
        }
      }

      // Remove successful syncs from queue
      this.syncQueue = this.syncQueue.filter(item => 
        !successfulSyncs.includes(item) && !failedSyncs.includes(item)
      );

      // Update last sync time
      this.lastSyncTime = new Date().toISOString();
      localStorage.setItem('lastSyncTime', this.lastSyncTime);

      // Save updated queue
      this.saveSyncQueue();

      // Show sync results
      if (successfulSyncs.length > 0) {
        this.showConnectionNotification(
          `Synced ${successfulSyncs.length} items successfully`, 
          'success'
        );
      }

      if (failedSyncs.length > 0) {
        this.showConnectionNotification(
          `${failedSyncs.length} items failed to sync`, 
          'error'
        );
      }

    } catch (error) {
      console.error('Sync process failed:', error);
      this.showConnectionNotification('Sync failed - will retry later', 'error');
    } finally {
      this.syncInProgress = false;
      this.showSyncProgress(false);
    }
  }

  // Process individual sync item
  async processSyncItem(item) {
    switch (item.operation) {
      case 'profile_update':
        return this.syncProfileUpdate(item.data);
      case 'bookmark_add':
        return this.syncBookmarkAdd(item.data);
      case 'bookmark_remove':
        return this.syncBookmarkRemove(item.data);
      case 'note_save':
        return this.syncNoteSave(item.data);
      case 'study_session':
        return this.syncStudySession(item.data);
      case 'goal_update':
        return this.syncGoalUpdate(item.data);
      default:
        throw new Error(`Unknown sync operation: ${item.operation}`);
    }
  }

  // Sync profile update
  async syncProfileUpdate(data) {
    // In a real app, this would sync with a server
    // For now, we'll just ensure local storage is updated
    localStorage.setItem('userProfile', JSON.stringify(data));
    return true;
  }

  // Sync bookmark addition
  async syncBookmarkAdd(data) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    if (!bookmarks.find(b => b.id === data.id)) {
      bookmarks.push(data);
      localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    }
    return true;
  }

  // Sync bookmark removal
  async syncBookmarkRemove(data) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    const filtered = bookmarks.filter(b => b.id !== data.id);
    localStorage.setItem('bookmarks', JSON.stringify(filtered));
    return true;
  }

  // Sync note save
  async syncNoteSave(data) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const existingIndex = notes.findIndex(n => n.id === data.id);
    
    if (existingIndex >= 0) {
      notes[existingIndex] = data;
    } else {
      notes.push(data);
    }
    
    localStorage.setItem('notes', JSON.stringify(notes));
    return true;
  }

  // Sync study session
  async syncStudySession(data) {
    const sessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
    sessions.push(data);
    localStorage.setItem('studySessions', JSON.stringify(sessions));
    return true;
  }

  // Sync goal update
  async syncGoalUpdate(data) {
    const goals = JSON.parse(localStorage.getItem('goals') || '[]');
    const existingIndex = goals.findIndex(g => g.id === data.id);
    
    if (existingIndex >= 0) {
      goals[existingIndex] = data;
    } else {
      goals.push(data);
    }
    
    localStorage.setItem('goals', JSON.stringify(goals));
    return true;
  }

  // Show sync progress indicator
  showSyncProgress(show) {
    let indicator = document.querySelector('.sync-indicator');
    
    if (show && !indicator) {
      indicator = document.createElement('div');
      indicator.className = 'sync-indicator fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      indicator.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span>Syncing data...</span>
        </div>
      `;
      document.body.appendChild(indicator);
    } else if (!show && indicator) {
      indicator.remove();
    }
  }

  // Show connection notification
  showConnectionNotification(message, type) {
    // Use error handler's notification system if available
    if (window.errorHandler && typeof window.errorHandler.showNotification === 'function') {
      window.errorHandler.showNotification(message, type);
    } else if (typeof showToast === 'function') {
      showToast(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  // Save sync queue to localStorage
  saveSyncQueue() {
    try {
      localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.warn('Failed to save sync queue:', error);
    }
  }

  // Load sync queue from localStorage
  loadOfflineData() {
    try {
      // Load sync queue
      const savedQueue = localStorage.getItem('syncQueue');
      if (savedQueue) {
        this.syncQueue = JSON.parse(savedQueue);
      }

      // Load last sync time
      this.lastSyncTime = localStorage.getItem('lastSyncTime');

      // Load offline data cache
      this.cacheCurrentData();
    } catch (error) {
      console.warn('Failed to load offline data:', error);
    }
  }

  // Setup periodic sync attempts
  setupPeriodicSync() {
    // Try to sync every 30 seconds when online
    setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0 && !this.syncInProgress) {
        this.syncOfflineData();
      }
    }, 30000);

    // Check connection every 10 seconds when offline
    setInterval(() => {
      if (!this.isOnline) {
        this.checkConnection();
      }
    }, 10000);
  }

  // Get offline data
  getOfflineData(key) {
    if (this.isOnline) {
      // When online, get from localStorage
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.warn(`Failed to get data for ${key}:`, error);
        return this.offlineData.get(key) || null;
      }
    } else {
      // When offline, get from cache
      return this.offlineData.get(key) || null;
    }
  }

  // Set offline data
  setOfflineData(key, value) {
    // Always update cache
    this.offlineData.set(key, value);

    if (this.isOnline) {
      // When online, save to localStorage immediately
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn(`Failed to save data for ${key}:`, error);
        // Queue for sync later
        this.queueForSync({
          type: 'data_update',
          data: { key, value }
        });
      }
    } else {
      // When offline, queue for sync
      this.queueForSync({
        type: 'data_update',
        data: { key, value }
      });
    }
  }

  // Check if feature is available offline
  isFeatureAvailableOffline(feature) {
    const offlineFeatures = [
      'profile_view',
      'bookmarks_view',
      'notes_view',
      'flashcards_practice',
      'mcq_practice',
      'study_timer',
      'goal_tracking',
      'statistics_view'
    ];

    return offlineFeatures.includes(feature);
  }

  // Get offline capabilities status
  getOfflineStatus() {
    return {
      isOnline: this.isOnline,
      lastSyncTime: this.lastSyncTime,
      pendingSyncItems: this.syncQueue.length,
      cachedDataKeys: Array.from(this.offlineData.keys()),
      syncInProgress: this.syncInProgress,
      offlineFeatures: [
        'View profile and preferences',
        'Access bookmarks and notes',
        'Practice with cached flashcards',
        'Use study timer and goal tracking',
        'View statistics and progress'
      ]
    };
  }

  // Clear offline data
  clearOfflineData() {
    this.offlineData.clear();
    this.syncQueue = [];
    this.saveSyncQueue();
    localStorage.removeItem('lastSyncTime');
    this.showConnectionNotification('Offline data cleared', 'info');
  }

  // Force sync now
  async forceSyncNow() {
    if (!this.isOnline) {
      this.showConnectionNotification('Cannot sync while offline', 'error');
      return false;
    }

    if (this.syncInProgress) {
      this.showConnectionNotification('Sync already in progress', 'info');
      return false;
    }

    await this.syncOfflineData();
    return true;
  }

  // Offline-aware wrapper for operations
  offlineAwareOperation(operation, fallback = null) {
    if (this.isOnline) {
      return operation();
    } else {
      if (typeof fallback === 'function') {
        return fallback();
      } else {
        this.showConnectionNotification('This feature requires an internet connection', 'warning');
        return null;
      }
    }
  }

  // Wrap function to work offline
  makeOfflineAware(fn, offlineHandler = null) {
    return (...args) => {
      if (this.isOnline) {
        return fn.apply(this, args);
      } else {
        if (offlineHandler) {
          return offlineHandler.apply(this, args);
        } else {
          this.showConnectionNotification('This action will be synced when you\'re back online', 'info');
          // Queue the operation for later sync
          this.queueForSync({
            type: 'deferred_operation',
            data: { functionName: fn.name, args }
          });
        }
      }
    };
  }
}

// Initialize global offline manager
window.offlineManager = new OfflineManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OfflineManager;
}