// Data Exporter - Comprehensive data export functionality
class DataExporter {
  constructor() {
    this.exportFormats = ['json', 'csv'];
    this.exportCategories = {
      profile: 'User Profile & Preferences',
      bookmarks: 'Bookmarks & Saved Items',
      studyStats: 'Study Statistics & Progress',
      studySessions: 'Study Session History',
      notes: 'Notes & Annotations',
      goals: 'Goals & Achievements',
      all: 'Complete Data Export'
    };
    this.initializeExporter();
  }

  // Initialize the exporter
  initializeExporter() {
    this.createExportInterface();
    this.bindEvents();
  }

  // Create export interface elements
  createExportInterface() {
    // Check if export interface already exists
    if (document.getElementById('data-export-interface')) {
      return;
    }

    const exportInterface = document.createElement('div');
    exportInterface.id = 'data-export-interface';
    exportInterface.className = 'hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    
    exportInterface.innerHTML = `
      <div class="bg-[var(--bg-dark-2)] rounded-xl border border-white/10 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-white">Export Data</h3>
          <button id="close-export-modal" class="text-white/60 hover:text-white transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- Export Categories -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-white/80 mb-3">Select Data to Export</label>
          <div class="space-y-2" id="export-categories">
            ${Object.entries(this.exportCategories).map(([key, label]) => `
              <label class="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                <input type="checkbox" value="${key}" class="export-category-checkbox rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-0">
                <span class="text-sm text-white/90">${label}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Export Format -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-white/80 mb-3">Export Format</label>
          <div class="flex space-x-4">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="radio" name="export-format" value="json" checked class="text-blue-500 focus:ring-blue-500 focus:ring-offset-0">
              <span class="text-sm text-white/90">JSON</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="radio" name="export-format" value="csv" class="text-blue-500 focus:ring-blue-500 focus:ring-offset-0">
              <span class="text-sm text-white/90">CSV</span>
            </label>
          </div>
        </div>

        <!-- Export Options -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-white/80 mb-3">Export Options</label>
          <div class="space-y-2">
            <label class="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" id="include-timestamps" checked class="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-0">
              <span class="text-sm text-white/90">Include timestamps</span>
            </label>
            <label class="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" id="compress-export" class="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-0">
              <span class="text-sm text-white/90">Compress export file</span>
            </label>
          </div>
        </div>

        <!-- Progress Bar -->
        <div id="export-progress" class="hidden mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-white/80">Exporting...</span>
            <span id="export-percentage" class="text-sm text-white/60">0%</span>
          </div>
          <div class="w-full bg-white/10 rounded-full h-2">
            <div id="export-progress-bar" class="bg-blue-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
          </div>
        </div>

        <!-- Export Actions -->
        <div class="flex space-x-3">
          <button id="start-export" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
            Export Data
          </button>
          <button id="cancel-export" class="px-4 py-2 text-white/60 hover:text-white transition-colors">
            Cancel
          </button>
        </div>

        <!-- Export Status -->
        <div id="export-status" class="hidden mt-4 p-3 rounded-lg">
          <div class="flex items-center space-x-2">
            <i data-lucide="check-circle" class="w-5 h-5 text-green-400"></i>
            <span class="text-sm text-white/90">Export completed successfully!</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(exportInterface);

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Bind event listeners
  bindEvents() {
    // Close modal events
    document.addEventListener('click', (e) => {
      if (e.target.id === 'close-export-modal' || e.target.id === 'cancel-export') {
        this.hideExportInterface();
      }
      if (e.target.id === 'data-export-interface') {
        this.hideExportInterface();
      }
    });

    // Start export event
    document.addEventListener('click', (e) => {
      if (e.target.id === 'start-export') {
        this.startExport();
      }
    });

    // Category selection events
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('export-category-checkbox')) {
        this.handleCategorySelection(e.target);
      }
    });

    // Keyboard events
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const exportInterface = document.getElementById('data-export-interface');
        if (exportInterface && !exportInterface.classList.contains('hidden')) {
          this.hideExportInterface();
        }
      }
    });
  }

  // Show export interface
  showExportInterface() {
    const exportInterface = document.getElementById('data-export-interface');
    if (exportInterface) {
      exportInterface.classList.remove('hidden');
      // Focus first checkbox for accessibility
      const firstCheckbox = exportInterface.querySelector('.export-category-checkbox');
      if (firstCheckbox) {
        firstCheckbox.focus();
      }
    }
  }

  // Hide export interface
  hideExportInterface() {
    const exportInterface = document.getElementById('data-export-interface');
    if (exportInterface) {
      exportInterface.classList.add('hidden');
      this.resetExportInterface();
    }
  }

  // Reset export interface to initial state
  resetExportInterface() {
    const progressContainer = document.getElementById('export-progress');
    const statusContainer = document.getElementById('export-status');
    const startButton = document.getElementById('start-export');

    if (progressContainer) progressContainer.classList.add('hidden');
    if (statusContainer) statusContainer.classList.add('hidden');
    if (startButton) {
      startButton.disabled = false;
      startButton.textContent = 'Export Data';
    }

    // Reset progress bar
    const progressBar = document.getElementById('export-progress-bar');
    const percentage = document.getElementById('export-percentage');
    if (progressBar) progressBar.style.width = '0%';
    if (percentage) percentage.textContent = '0%';
  }

  // Handle category selection
  handleCategorySelection(checkbox) {
    const allCheckbox = document.querySelector('input[value="all"]');
    const otherCheckboxes = document.querySelectorAll('.export-category-checkbox:not([value="all"])');

    if (checkbox.value === 'all') {
      // If "all" is selected, check/uncheck all others
      otherCheckboxes.forEach(cb => {
        cb.checked = checkbox.checked;
      });
    } else {
      // If any individual category is unchecked, uncheck "all"
      if (!checkbox.checked && allCheckbox) {
        allCheckbox.checked = false;
      }
      // If all individual categories are checked, check "all"
      const allIndividualChecked = Array.from(otherCheckboxes).every(cb => cb.checked);
      if (allIndividualChecked && allCheckbox) {
        allCheckbox.checked = true;
      }
    }
  }

  // Start the export process
  async startExport() {
    const selectedCategories = this.getSelectedCategories();
    const format = this.getSelectedFormat();
    const options = this.getExportOptions();

    if (selectedCategories.length === 0) {
      this.showError('Please select at least one data category to export.');
      return;
    }

    try {
      this.showProgress();
      const exportData = await this.collectExportData(selectedCategories, options);
      const exportResult = await this.processExport(exportData, format, options);
      await this.downloadExport(exportResult, format);
      this.showSuccess();
    } catch (error) {
      console.error('Export failed:', error);
      this.showError('Export failed. Please try again.');
    }
  }

  // Get selected export categories
  getSelectedCategories() {
    const checkboxes = document.querySelectorAll('.export-category-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value).filter(value => value !== 'all');
  }

  // Get selected export format
  getSelectedFormat() {
    const formatRadio = document.querySelector('input[name="export-format"]:checked');
    return formatRadio ? formatRadio.value : 'json';
  }

  // Get export options
  getExportOptions() {
    return {
      includeTimestamps: document.getElementById('include-timestamps')?.checked || false,
      compress: document.getElementById('compress-export')?.checked || false
    };
  }

  // Collect data for export
  async collectExportData(categories, options) {
    const exportData = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        categories: categories,
        options: options
      }
    };

    let progress = 0;
    const totalSteps = categories.length;

    for (const category of categories) {
      this.updateProgress((progress / totalSteps) * 100, `Collecting ${category} data...`);
      
      switch (category) {
        case 'profile':
          exportData.profile = this.collectProfileData(options);
          break;
        case 'bookmarks':
          exportData.bookmarks = this.collectBookmarksData(options);
          break;
        case 'studyStats':
          exportData.studyStats = this.collectStudyStatsData(options);
          break;
        case 'studySessions':
          exportData.studySessions = this.collectStudySessionsData(options);
          break;
        case 'notes':
          exportData.notes = this.collectNotesData(options);
          break;
        case 'goals':
          exportData.goals = this.collectGoalsData(options);
          break;
      }

      progress++;
      await this.delay(100); // Small delay for progress visualization
    }

    this.updateProgress(100, 'Data collection complete');
    return exportData;
  }

  // Collect profile data
  collectProfileData(options) {
    const profileManager = window.profileManager;
    if (!profileManager) return null;

    const profileData = {
      name: profileManager.profileData.name,
      email: profileManager.profileData.email,
      preferences: profileManager.profileData.preferences
    };

    if (options.includeTimestamps) {
      profileData.exportTimestamp = new Date().toISOString();
    }

    return profileData;
  }

  // Collect bookmarks data
  collectBookmarksData(options) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    
    if (!options.includeTimestamps) {
      return bookmarks.map(bookmark => {
        const { dateAdded, ...bookmarkWithoutDate } = bookmark;
        return bookmarkWithoutDate;
      });
    }

    return bookmarks;
  }

  // Collect study statistics data
  collectStudyStatsData(options) {
    const studyStats = {
      totalHours: localStorage.getItem('totalStudyHours') || '0',
      questionsAttempted: localStorage.getItem('totalQuestions') || '0',
      accuracyRate: localStorage.getItem('overallAccuracy') || '0',
      streak: localStorage.getItem('studyStreak') || '0',
      subjectStats: JSON.parse(localStorage.getItem('subjectStats') || '{}')
    };

    if (options.includeTimestamps) {
      studyStats.lastUpdated = new Date().toISOString();
    }

    return studyStats;
  }

  // Collect study sessions data
  collectStudySessionsData(options) {
    const sessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
    
    if (!options.includeTimestamps) {
      return sessions.map(session => {
        const { timestamp, startTime, endTime, ...sessionWithoutTimes } = session;
        return sessionWithoutTimes;
      });
    }

    return sessions;
  }

  // Collect notes data
  collectNotesData(options) {
    const notes = JSON.parse(localStorage.getItem('userNotes') || '[]');
    
    if (!options.includeTimestamps) {
      return notes.map(note => {
        const { createdAt, updatedAt, ...noteWithoutTimes } = note;
        return noteWithoutTimes;
      });
    }

    return notes;
  }

  // Collect goals data
  collectGoalsData(options) {
    const goals = JSON.parse(localStorage.getItem('userGoals') || '[]');
    
    if (!options.includeTimestamps) {
      return goals.map(goal => {
        const { createdAt, updatedAt, deadline, ...goalWithoutTimes } = goal;
        return goalWithoutTimes;
      });
    }

    return goals;
  }

  // Process export data based on format
  async processExport(data, format, options) {
    this.updateProgress(100, 'Processing export...');

    if (format === 'csv') {
      return this.convertToCSV(data);
    } else {
      return JSON.stringify(data, null, 2);
    }
  }

  // Convert data to CSV format
  convertToCSV(data) {
    const csvSections = [];

    // Export info
    if (data.exportInfo) {
      csvSections.push('Export Information');
      csvSections.push('Timestamp,Version,Categories');
      csvSections.push(`${data.exportInfo.timestamp},${data.exportInfo.version},"${data.exportInfo.categories.join(', ')}"`);
      csvSections.push('');
    }

    // Profile data
    if (data.profile) {
      csvSections.push('Profile Data');
      csvSections.push('Name,Email,Theme Mode,Font Size');
      csvSections.push(`"${data.profile.name}","${data.profile.email}",${data.profile.preferences?.theme?.mode || 'N/A'},${data.profile.preferences?.theme?.fontSize || 'N/A'}`);
      csvSections.push('');
    }

    // Bookmarks
    if (data.bookmarks && data.bookmarks.length > 0) {
      csvSections.push('Bookmarks');
      csvSections.push('ID,Title,URL,Category,Date Added');
      data.bookmarks.forEach(bookmark => {
        csvSections.push(`${bookmark.id},"${bookmark.title}","${bookmark.url || ''}","${bookmark.category}","${bookmark.dateAdded || ''}"`);
      });
      csvSections.push('');
    }

    // Study Stats
    if (data.studyStats) {
      csvSections.push('Study Statistics');
      csvSections.push('Total Hours,Questions Attempted,Accuracy Rate,Current Streak');
      csvSections.push(`${data.studyStats.totalHours},${data.studyStats.questionsAttempted},${data.studyStats.accuracyRate},${data.studyStats.streak}`);
      csvSections.push('');
    }

    // Study Sessions
    if (data.studySessions && data.studySessions.length > 0) {
      csvSections.push('Study Sessions');
      csvSections.push('Session ID,Subject,Duration,Questions,Accuracy,Date');
      data.studySessions.forEach(session => {
        csvSections.push(`${session.id || 'N/A'},"${session.subject || 'N/A'}",${session.duration || 0},${session.questions || 0},${session.accuracy || 0},"${session.timestamp || ''}"`);
      });
      csvSections.push('');
    }

    return csvSections.join('\n');
  }

  // Download the export file
  async downloadExport(data, format) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `learning-platform-export-${timestamp}.${format}`;
    
    const blob = new Blob([data], { 
      type: format === 'csv' ? 'text/csv' : 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // Utility methods
  updateProgress(percentage, message) {
    const progressContainer = document.getElementById('export-progress');
    const progressBar = document.getElementById('export-progress-bar');
    const percentageElement = document.getElementById('export-percentage');

    if (progressContainer) progressContainer.classList.remove('hidden');
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (percentageElement) percentageElement.textContent = `${Math.round(percentage)}%`;

    // Update button text
    const startButton = document.getElementById('start-export');
    if (startButton && message) {
      startButton.textContent = message;
      startButton.disabled = true;
    }
  }

  showProgress() {
    const progressContainer = document.getElementById('export-progress');
    if (progressContainer) {
      progressContainer.classList.remove('hidden');
    }
  }

  showSuccess() {
    const statusContainer = document.getElementById('export-status');
    const startButton = document.getElementById('start-export');
    
    if (statusContainer) {
      statusContainer.classList.remove('hidden');
      statusContainer.className = 'mt-4 p-3 rounded-lg bg-green-500/20 border border-green-500/30';
    }
    
    if (startButton) {
      startButton.textContent = 'Export Complete';
      startButton.disabled = false;
    }

    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.hideExportInterface();
    }, 3000);
  }

  showError(message) {
    const statusContainer = document.getElementById('export-status');
    const startButton = document.getElementById('start-export');
    
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
    
    if (startButton) {
      startButton.textContent = 'Export Data';
      startButton.disabled = false;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Validation methods
  validateExportData(data) {
    const errors = [];

    if (!data || typeof data !== 'object') {
      errors.push('Invalid export data structure');
      return errors;
    }

    // Validate export info
    if (!data.exportInfo) {
      errors.push('Missing export information');
    } else {
      if (!data.exportInfo.timestamp) {
        errors.push('Missing export timestamp');
      }
      if (!data.exportInfo.categories || !Array.isArray(data.exportInfo.categories)) {
        errors.push('Invalid export categories');
      }
    }

    // Validate individual data sections
    if (data.bookmarks && !Array.isArray(data.bookmarks)) {
      errors.push('Invalid bookmarks data format');
    }

    if (data.studySessions && !Array.isArray(data.studySessions)) {
      errors.push('Invalid study sessions data format');
    }

    if (data.notes && !Array.isArray(data.notes)) {
      errors.push('Invalid notes data format');
    }

    if (data.goals && !Array.isArray(data.goals)) {
      errors.push('Invalid goals data format');
    }

    return errors;
  }

  // Get export statistics
  getExportStats() {
    const stats = {
      totalBookmarks: JSON.parse(localStorage.getItem('bookmarks') || '[]').length,
      totalNotes: JSON.parse(localStorage.getItem('userNotes') || '[]').length,
      totalGoals: JSON.parse(localStorage.getItem('userGoals') || '[]').length,
      totalSessions: JSON.parse(localStorage.getItem('studySessions') || '[]').length,
      hasProfile: !!window.profileManager?.profileData
    };

    return stats;
  }

  // Quick export methods for specific data types
  async quickExportBookmarks() {
    const bookmarks = this.collectBookmarksData({ includeTimestamps: true });
    const data = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        categories: ['bookmarks']
      },
      bookmarks: bookmarks
    };

    const exportResult = JSON.stringify(data, null, 2);
    await this.downloadExport(exportResult, 'json');
    return true;
  }

  async quickExportProfile() {
    const profile = this.collectProfileData({ includeTimestamps: true });
    const data = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        categories: ['profile']
      },
      profile: profile
    };

    const exportResult = JSON.stringify(data, null, 2);
    await this.downloadExport(exportResult, 'json');
    return true;
  }
}

// Initialize global data exporter
window.dataExporter = new DataExporter();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataExporter;
}