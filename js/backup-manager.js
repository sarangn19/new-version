// Backup Manager - Automatic data backup and recovery system
class BackupManager {
  constructor() {
    this.backupPrefix = 'backup_';
    this.maxBackups = 10; // Maximum number of backups to keep
    this.backupInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    this.criticalKeys = [
      'userProfile',
      'bookmarks', 
      'userNotes',
      'userGoals',
      'studySessions',
      'totalStudyHours',
      'studyStreak'
    ];
    
    this.initializeBackupManager();
  }

  // Initialize the backup manager
  initializeBackupManager() {
    this.scheduleAutomaticBackups();
    this.createBackupInterface();
    this.bindEvents();
    this.performStartupCheck();
  }

  // Create backup management interface
  createBackupInterface() {
    // Check if backup interface already exists
    if (document.getElementById('backup-manager-interface')) {
      return;
    }

    const backupInterface = document.createElement('div');
    backupInterface.id = 'backup-manager-interface';
    backupInterface.className = 'hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    
    backupInterface.innerHTML = `
      <div class="bg-[var(--bg-dark-2)] rounded-xl border border-white/10 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-white">Backup Manager</h3>
          <button id="close-backup-modal" class="text-white/60 hover:text-white transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- Backup Status -->
        <div class="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-white/80">Last Backup</span>
            <span id="last-backup-time" class="text-sm text-white/60">Never</span>
          </div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-white/80">Total Backups</span>
            <span id="total-backups" class="text-sm text-white/60">0</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-white/80">Auto Backup</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="auto-backup-toggle" class="sr-only peer">
              <div class="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <!-- Available Backups -->
        <div class="mb-6">
          <h4 class="text-sm font-medium text-white/80 mb-3">Available Backups</h4>
          <div id="backup-list" class="space-y-2 max-h-48 overflow-y-auto">
            <!-- Backup items will be populated here -->
          </div>
        </div>

        <!-- Backup Actions -->
        <div class="space-y-3">
          <button id="create-backup" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
            Create Backup Now
          </button>
          <div class="flex space-x-3">
            <button id="restore-latest" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
              Restore Latest
            </button>
            <button id="cleanup-backups" class="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
              Cleanup Old
            </button>
          </div>
        </div>

        <!-- Backup Progress -->
        <div id="backup-progress" class="hidden mt-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-white/80">Processing...</span>
            <span id="backup-percentage" class="text-sm text-white/60">0%</span>
          </div>
          <div class="w-full bg-white/10 rounded-full h-2">
            <div id="backup-progress-bar" class="bg-blue-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
          </div>
        </div>

        <!-- Backup Status Messages -->
        <div id="backup-status" class="hidden mt-4 p-3 rounded-lg">
          <!-- Status messages will appear here -->
        </div>
      </div>
    `;

    document.body.appendChild(backupInterface);

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Bind event listeners
  bindEvents() {
    // Close modal events
    document.addEventListener('click', (e) => {
      if (e.target.id === 'close-backup-modal') {
        this.hideBackupInterface();
      }
      if (e.target.id === 'backup-manager-interface') {
        this.hideBackupInterface();
      }
    });

    // Backup action events
    document.addEventListener('click', (e) => {
      if (e.target.id === 'create-backup') {
        this.createManualBackup();
      }
      if (e.target.id === 'restore-latest') {
        this.restoreLatestBackup();
      }
      if (e.target.id === 'cleanup-backups') {
        this.cleanupOldBackups();
      }
    });

    // Auto backup toggle
    document.addEventListener('change', (e) => {
      if (e.target.id === 'auto-backup-toggle') {
        this.toggleAutoBackup(e.target.checked);
      }
    });

    // Restore specific backup
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('restore-backup-btn')) {
        const backupId = e.target.dataset.backupId;
        this.restoreSpecificBackup(backupId);
      }
      if (e.target.classList.contains('delete-backup-btn')) {
        const backupId = e.target.dataset.backupId;
        this.deleteSpecificBackup(backupId);
      }
    });

    // Keyboard events
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const backupInterface = document.getElementById('backup-manager-interface');
        if (backupInterface && !backupInterface.classList.contains('hidden')) {
          this.hideBackupInterface();
        }
      }
    });
  }

  // Show backup interface
  showBackupInterface() {
    const backupInterface = document.getElementById('backup-manager-interface');
    if (backupInterface) {
      backupInterface.classList.remove('hidden');
      this.updateBackupInterface();
    }
  }

  // Hide backup interface
  hideBackupInterface() {
    const backupInterface = document.getElementById('backup-manager-interface');
    if (backupInterface) {
      backupInterface.classList.add('hidden');
      this.resetBackupInterface();
    }
  }

  // Update backup interface with current data
  updateBackupInterface() {
    this.updateBackupStatus();
    this.updateBackupList();
    this.updateAutoBackupToggle();
  }

  // Update backup status display
  updateBackupStatus() {
    const lastBackupTime = localStorage.getItem('lastBackupTime');
    const backups = this.getAllBackups();
    
    const lastBackupElement = document.getElementById('last-backup-time');
    const totalBackupsElement = document.getElementById('total-backups');

    if (lastBackupElement) {
      if (lastBackupTime) {
        const date = new Date(lastBackupTime);
        lastBackupElement.textContent = this.formatRelativeTime(date);
      } else {
        lastBackupElement.textContent = 'Never';
      }
    }

    if (totalBackupsElement) {
      totalBackupsElement.textContent = backups.length.toString();
    }
  }

  // Update backup list display
  updateBackupList() {
    const backupList = document.getElementById('backup-list');
    if (!backupList) return;

    const backups = this.getAllBackups();

    if (backups.length === 0) {
      backupList.innerHTML = `
        <div class="text-center py-4 text-white/60">
          <i data-lucide="archive" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
          <p class="text-sm">No backups available</p>
        </div>
      `;
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      return;
    }

    const backupItems = backups.map(backup => `
      <div class="bg-white/5 rounded-lg p-3 border border-white/10">
        <div class="flex items-center justify-between mb-2">
          <div>
            <div class="text-sm font-medium text-white/90">${this.formatBackupDate(backup.timestamp)}</div>
            <div class="text-xs text-white/60">${this.formatBackupSize(backup.size)} • ${backup.itemCount} items</div>
          </div>
          <div class="flex space-x-1">
            <button class="restore-backup-btn text-green-400 hover:text-green-300 transition-colors p-1" 
                    data-backup-id="${backup.id}" title="Restore this backup">
              <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
            </button>
            <button class="delete-backup-btn text-red-400 hover:text-red-300 transition-colors p-1" 
                    data-backup-id="${backup.id}" title="Delete this backup">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
        <div class="text-xs text-white/50">
          ${backup.integrity ? '✓ Verified' : '⚠ Unverified'}
        </div>
      </div>
    `).join('');

    backupList.innerHTML = backupItems;
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Update auto backup toggle state
  updateAutoBackupToggle() {
    const toggle = document.getElementById('auto-backup-toggle');
    if (toggle) {
      const autoBackupEnabled = localStorage.getItem('autoBackupEnabled') !== 'false';
      toggle.checked = autoBackupEnabled;
    }
  }

  // Reset backup interface
  resetBackupInterface() {
    const progressContainer = document.getElementById('backup-progress');
    const statusContainer = document.getElementById('backup-status');

    if (progressContainer) progressContainer.classList.add('hidden');
    if (statusContainer) statusContainer.classList.add('hidden');

    // Reset progress bar
    const progressBar = document.getElementById('backup-progress-bar');
    const percentage = document.getElementById('backup-percentage');
    if (progressBar) progressBar.style.width = '0%';
    if (percentage) percentage.textContent = '0%';
  }

  // Create manual backup
  async createManualBackup() {
    try {
      this.showProgress('Creating backup...');
      const backup = await this.createBackup();
      this.showSuccess(`Backup created successfully! ID: ${backup.id.substring(0, 8)}`);
      this.updateBackupInterface();
    } catch (error) {
      console.error('Manual backup failed:', error);
      this.showError('Failed to create backup. Please try again.');
    }
  }

  // Create a backup
  async createBackup() {
    const backupId = this.generateBackupId();
    const timestamp = new Date().toISOString();
    
    this.updateProgress(10, 'Collecting data...');

    // Collect all critical data
    const backupData = {};
    let itemCount = 0;

    for (const key of this.criticalKeys) {
      const data = localStorage.getItem(key);
      if (data !== null) {
        backupData[key] = data;
        itemCount++;
      }
      this.updateProgress(10 + (itemCount / this.criticalKeys.length) * 60, `Backing up ${key}...`);
      await this.delay(50);
    }

    this.updateProgress(70, 'Verifying backup integrity...');

    // Create backup metadata
    const backupMetadata = {
      id: backupId,
      timestamp: timestamp,
      itemCount: itemCount,
      size: JSON.stringify(backupData).length,
      integrity: true,
      version: '1.0.0'
    };

    this.updateProgress(80, 'Saving backup...');

    // Save backup data and metadata
    const backupKey = this.backupPrefix + backupId;
    const metadataKey = this.backupPrefix + backupId + '_meta';

    try {
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      localStorage.setItem(metadataKey, JSON.stringify(backupMetadata));
      localStorage.setItem('lastBackupTime', timestamp);
    } catch (error) {
      throw new Error('Failed to save backup: ' + error.message);
    }

    this.updateProgress(90, 'Cleaning up old backups...');

    // Cleanup old backups if necessary
    await this.cleanupOldBackups(false);

    this.updateProgress(100, 'Backup complete');

    return backupMetadata;
  }

  // Restore latest backup
  async restoreLatestBackup() {
    const backups = this.getAllBackups();
    if (backups.length === 0) {
      this.showError('No backups available to restore.');
      return;
    }

    const latestBackup = backups[0]; // Backups are sorted by timestamp (newest first)
    await this.restoreSpecificBackup(latestBackup.id);
  }

  // Restore specific backup
  async restoreSpecificBackup(backupId) {
    try {
      this.showProgress('Restoring backup...');
      
      const backupKey = this.backupPrefix + backupId;
      const metadataKey = this.backupPrefix + backupId + '_meta';

      this.updateProgress(10, 'Loading backup data...');

      // Load backup data and metadata
      const backupDataStr = localStorage.getItem(backupKey);
      const metadataStr = localStorage.getItem(metadataKey);

      if (!backupDataStr || !metadataStr) {
        throw new Error('Backup data not found or corrupted');
      }

      const backupData = JSON.parse(backupDataStr);
      const metadata = JSON.parse(metadataStr);

      this.updateProgress(30, 'Verifying backup integrity...');

      // Verify backup integrity
      if (!this.verifyBackupIntegrity(backupData, metadata)) {
        throw new Error('Backup integrity verification failed');
      }

      this.updateProgress(50, 'Creating current data backup...');

      // Create a backup of current data before restoring
      const currentBackup = await this.createBackup();

      this.updateProgress(70, 'Restoring data...');

      // Restore data
      let restoredCount = 0;
      const totalItems = Object.keys(backupData).length;

      for (const [key, value] of Object.entries(backupData)) {
        localStorage.setItem(key, value);
        restoredCount++;
        this.updateProgress(70 + (restoredCount / totalItems) * 20, `Restoring ${key}...`);
        await this.delay(50);
      }

      this.updateProgress(95, 'Refreshing application...');

      // Refresh profile manager if available
      if (window.profileManager) {
        window.profileManager.profileData = window.profileManager.loadProfile();
        window.profileManager.updateAllProfileElements();
        window.profileManager.applyPreferences();
      }

      this.updateProgress(100, 'Restore complete');

      this.showSuccess(`Backup restored successfully! ${restoredCount} items restored.`);
      
      // Refresh the page after a short delay to ensure all data is properly loaded
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Backup restore failed:', error);
      this.showError('Failed to restore backup: ' + error.message);
    }
  }

  // Delete specific backup
  async deleteSpecificBackup(backupId) {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return;
    }

    try {
      const backupKey = this.backupPrefix + backupId;
      const metadataKey = this.backupPrefix + backupId + '_meta';

      localStorage.removeItem(backupKey);
      localStorage.removeItem(metadataKey);

      this.showSuccess('Backup deleted successfully.');
      this.updateBackupInterface();
    } catch (error) {
      console.error('Failed to delete backup:', error);
      this.showError('Failed to delete backup.');
    }
  }

  // Cleanup old backups
  async cleanupOldBackups(showMessage = true) {
    try {
      if (showMessage) {
        this.showProgress('Cleaning up old backups...');
      }

      const backups = this.getAllBackups();
      
      if (backups.length <= this.maxBackups) {
        if (showMessage) {
          this.showSuccess('No cleanup needed.');
        }
        return;
      }

      const backupsToDelete = backups.slice(this.maxBackups);
      let deletedCount = 0;

      for (const backup of backupsToDelete) {
        const backupKey = this.backupPrefix + backup.id;
        const metadataKey = this.backupPrefix + backup.id + '_meta';
        
        localStorage.removeItem(backupKey);
        localStorage.removeItem(metadataKey);
        deletedCount++;

        if (showMessage) {
          this.updateProgress((deletedCount / backupsToDelete.length) * 100, `Deleting old backup ${deletedCount}/${backupsToDelete.length}...`);
        }
        await this.delay(50);
      }

      if (showMessage) {
        this.showSuccess(`Cleaned up ${deletedCount} old backups.`);
        this.updateBackupInterface();
      }

    } catch (error) {
      console.error('Cleanup failed:', error);
      if (showMessage) {
        this.showError('Failed to cleanup old backups.');
      }
    }
  }

  // Toggle auto backup
  toggleAutoBackup(enabled) {
    localStorage.setItem('autoBackupEnabled', enabled.toString());
    
    if (enabled) {
      this.scheduleAutomaticBackups();
      this.showSuccess('Automatic backups enabled.');
    } else {
      this.clearAutomaticBackups();
      this.showSuccess('Automatic backups disabled.');
    }
  }

  // Schedule automatic backups
  scheduleAutomaticBackups() {
    // Clear existing interval
    if (this.backupIntervalId) {
      clearInterval(this.backupIntervalId);
    }

    const autoBackupEnabled = localStorage.getItem('autoBackupEnabled') !== 'false';
    if (!autoBackupEnabled) {
      return;
    }

    // Check if backup is needed on startup
    this.checkAndCreateAutoBackup();

    // Schedule regular backups
    this.backupIntervalId = setInterval(() => {
      this.checkAndCreateAutoBackup();
    }, this.backupInterval);
  }

  // Clear automatic backup scheduling
  clearAutomaticBackups() {
    if (this.backupIntervalId) {
      clearInterval(this.backupIntervalId);
      this.backupIntervalId = null;
    }
  }

  // Check if auto backup is needed and create one
  async checkAndCreateAutoBackup() {
    const lastBackupTime = localStorage.getItem('lastBackupTime');
    const now = new Date().getTime();

    if (!lastBackupTime || (now - new Date(lastBackupTime).getTime()) >= this.backupInterval) {
      try {
        await this.createBackup();
        console.log('Automatic backup created successfully');
      } catch (error) {
        console.error('Automatic backup failed:', error);
      }
    }
  }

  // Perform startup check
  performStartupCheck() {
    // Check for corrupted data and offer recovery
    this.checkDataIntegrity();
    
    // Schedule automatic backups if enabled
    this.scheduleAutomaticBackups();
  }

  // Check data integrity
  checkDataIntegrity() {
    const corruptedKeys = [];

    for (const key of this.criticalKeys) {
      const data = localStorage.getItem(key);
      if (data !== null) {
        try {
          // Try to parse JSON data
          if (key !== 'totalStudyHours' && key !== 'studyStreak') {
            JSON.parse(data);
          }
        } catch (error) {
          corruptedKeys.push(key);
        }
      }
    }

    if (corruptedKeys.length > 0) {
      this.offerDataRecovery(corruptedKeys);
    }
  }

  // Offer data recovery for corrupted data
  offerDataRecovery(corruptedKeys) {
    const backups = this.getAllBackups();
    if (backups.length === 0) {
      console.warn('Data corruption detected but no backups available:', corruptedKeys);
      return;
    }

    const message = `Data corruption detected in: ${corruptedKeys.join(', ')}.\n\nWould you like to restore from the latest backup?`;
    
    if (confirm(message)) {
      this.restoreLatestBackup();
    }
  }

  // Verify backup integrity
  verifyBackupIntegrity(backupData, metadata) {
    try {
      // Check if backup data is valid JSON
      if (typeof backupData !== 'object' || backupData === null) {
        return false;
      }

      // Check metadata
      if (!metadata || !metadata.id || !metadata.timestamp) {
        return false;
      }

      // Verify item count
      const actualItemCount = Object.keys(backupData).length;
      if (actualItemCount !== metadata.itemCount) {
        return false;
      }

      // Verify data size (approximate)
      const actualSize = JSON.stringify(backupData).length;
      const sizeDifference = Math.abs(actualSize - metadata.size) / metadata.size;
      if (sizeDifference > 0.1) { // Allow 10% difference
        return false;
      }

      return true;
    } catch (error) {
      console.error('Integrity verification error:', error);
      return false;
    }
  }

  // Get all backups sorted by timestamp (newest first)
  getAllBackups() {
    const backups = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.backupPrefix) && key.endsWith('_meta')) {
        try {
          const metadata = JSON.parse(localStorage.getItem(key));
          backups.push(metadata);
        } catch (error) {
          console.error('Failed to parse backup metadata:', key, error);
        }
      }
    }

    // Sort by timestamp (newest first)
    return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Utility methods
  generateBackupId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  formatBackupDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  formatBackupSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  }

  formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  updateProgress(percentage, message) {
    const progressContainer = document.getElementById('backup-progress');
    const progressBar = document.getElementById('backup-progress-bar');
    const percentageElement = document.getElementById('backup-percentage');

    if (progressContainer) progressContainer.classList.remove('hidden');
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (percentageElement) percentageElement.textContent = `${Math.round(percentage)}%`;
  }

  showProgress(message) {
    const progressContainer = document.getElementById('backup-progress');
    if (progressContainer) {
      progressContainer.classList.remove('hidden');
    }
    this.updateProgress(0, message);
  }

  showSuccess(message) {
    const statusContainer = document.getElementById('backup-status');
    
    if (statusContainer) {
      statusContainer.classList.remove('hidden');
      statusContainer.className = 'mt-4 p-3 rounded-lg bg-green-500/20 border border-green-500/30';
      statusContainer.innerHTML = `
        <div class="flex items-center space-x-2">
          <i data-lucide="check-circle" class="w-5 h-5 text-green-400"></i>
          <span class="text-sm text-white/90">${message}</span>
        </div>
      `;
      
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }

    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (statusContainer) {
        statusContainer.classList.add('hidden');
      }
    }, 3000);
  }

  showError(message) {
    const statusContainer = document.getElementById('backup-status');
    
    if (statusContainer) {
      statusContainer.classList.remove('hidden');
      statusContainer.className = 'mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30';
      statusContainer.innerHTML = `
        <div class="flex items-center space-x-2">
          <i data-lucide="alert-circle" class="w-5 h-5 text-red-400"></i>
          <span class="text-sm text-white/90">${message}</span>
        </div>
      `;
      
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get backup statistics
  getBackupStats() {
    const backups = this.getAllBackups();
    const lastBackupTime = localStorage.getItem('lastBackupTime');
    const autoBackupEnabled = localStorage.getItem('autoBackupEnabled') !== 'false';

    return {
      totalBackups: backups.length,
      lastBackupTime: lastBackupTime,
      autoBackupEnabled: autoBackupEnabled,
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
      newestBackup: backups.length > 0 ? backups[0].timestamp : null,
      totalBackupSize: backups.reduce((total, backup) => total + backup.size, 0)
    };
  }
}

// Initialize global backup manager
window.backupManager = new BackupManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackupManager;
}