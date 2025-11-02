// Import Handler - Data import with validation and sanitization
class ImportHandler {
  constructor() {
    this.supportedFormats = ['json', 'csv'];
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.validationRules = {
      profile: {
        required: ['name'],
        optional: ['email', 'preferences']
      },
      bookmarks: {
        required: ['title'],
        optional: ['url', 'description', 'category', 'dateAdded']
      },
      notes: {
        required: ['title', 'content'],
        optional: ['richContent', 'subject', 'createdAt', 'updatedAt']
      },
      studySessions: {
        required: ['subject'],
        optional: ['duration', 'questions', 'accuracy', 'timestamp']
      }
    };
    
    this.initializeImportHandler();
  }

  // Initialize the import handler
  initializeImportHandler() {
    this.createImportInterface();
    this.bindEvents();
  }

  // Create import interface
  createImportInterface() {
    if (document.getElementById('import-handler-interface')) {
      return;
    }

    const importInterface = document.createElement('div');
    importInterface.id = 'import-handler-interface';
    importInterface.className = 'hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    
    importInterface.innerHTML = `
      <div class="bg-[var(--bg-dark-2)] rounded-xl border border-white/10 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-white">Import Data</h3>
          <button id="close-import-modal" class="text-white/60 hover:text-white transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- File Upload -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-white/80 mb-3">Select File to Import</label>
          <div class="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors">
            <input type="file" id="import-file-input" accept=".json,.csv" class="hidden">
            <div id="file-drop-zone" class="cursor-pointer">
              <i data-lucide="upload" class="w-8 h-8 mx-auto mb-2 text-white/60"></i>
              <p class="text-white/80 mb-1">Click to select file or drag and drop</p>
              <p class="text-xs text-white/60">Supports JSON and CSV files (max 50MB)</p>
            </div>
            <div id="selected-file-info" class="hidden">
              <i data-lucide="file" class="w-6 h-6 mx-auto mb-2 text-blue-400"></i>
              <p id="file-name" class="text-white/90 font-medium"></p>
              <p id="file-size" class="text-xs text-white/60"></p>
            </div>
          </div>
        </div>

        <!-- Import Options -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-white/80 mb-3">Import Options</label>
          <div class="space-y-2">
            <label class="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" id="merge-data" checked class="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-0">
              <span class="text-sm text-white/90">Merge with existing data</span>
            </label>
            <label class="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" id="validate-data" checked class="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-0">
              <span class="text-sm text-white/90">Validate imported data</span>
            </label>
            <label class="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" id="backup-before-import" checked class="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-0">
              <span class="text-sm text-white/90">Create backup before import</span>
            </label>
          </div>
        </div>

        <!-- Import Preview -->
        <div id="import-preview" class="hidden mb-6">
          <h4 class="text-sm font-medium text-white/80 mb-3">Import Preview</h4>
          <div class="bg-white/5 rounded-lg p-3 max-h-32 overflow-y-auto">
            <div id="preview-content" class="text-xs text-white/70 font-mono"></div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div id="import-progress" class="hidden mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-white/80">Importing...</span>
            <span id="import-percentage" class="text-sm text-white/60">0%</span>
          </div>
          <div class="w-full bg-white/10 rounded-full h-2">
            <div id="import-progress-bar" class="bg-blue-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
          </div>
        </div>

        <!-- Import Actions -->
        <div class="flex space-x-3">
          <button id="start-import" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium" disabled>
            Import Data
          </button>
          <button id="cancel-import" class="px-4 py-2 text-white/60 hover:text-white transition-colors">
            Cancel
          </button>
        </div>

        <!-- Import Status -->
        <div id="import-status" class="hidden mt-4 p-3 rounded-lg">
          <!-- Status messages will appear here -->
        </div>
      </div>
    `;

    document.body.appendChild(importInterface);

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Bind event listeners
  bindEvents() {
    // Close modal events
    document.addEventListener('click', (e) => {
      if (e.target.id === 'close-import-modal' || e.target.id === 'cancel-import') {
        this.hideImportInterface();
      }
      if (e.target.id === 'import-handler-interface') {
        this.hideImportInterface();
      }
    });

    // File selection events
    document.addEventListener('click', (e) => {
      if (e.target.id === 'file-drop-zone' || e.target.closest('#file-drop-zone')) {
        document.getElementById('import-file-input').click();
      }
      if (e.target.id === 'start-import') {
        this.startImport();
      }
    });

    // File input change
    document.addEventListener('change', (e) => {
      if (e.target.id === 'import-file-input') {
        this.handleFileSelection(e.target.files[0]);
      }
    });

    // Drag and drop events
    document.addEventListener('dragover', (e) => {
      if (e.target.closest('#file-drop-zone')) {
        e.preventDefault();
        e.target.closest('#file-drop-zone').classList.add('border-blue-400');
      }
    });

    document.addEventListener('dragleave', (e) => {
      if (e.target.closest('#file-drop-zone')) {
        e.target.closest('#file-drop-zone').classList.remove('border-blue-400');
      }
    });

    document.addEventListener('drop', (e) => {
      if (e.target.closest('#file-drop-zone')) {
        e.preventDefault();
        e.target.closest('#file-drop-zone').classList.remove('border-blue-400');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.handleFileSelection(files[0]);
        }
      }
    });

    // Keyboard events
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const importInterface = document.getElementById('import-handler-interface');
        if (importInterface && !importInterface.classList.contains('hidden')) {
          this.hideImportInterface();
        }
      }
    });
  }

  // Show import interface
  showImportInterface() {
    const importInterface = document.getElementById('import-handler-interface');
    if (importInterface) {
      importInterface.classList.remove('hidden');
      this.resetImportInterface();
    }
  }

  // Hide import interface
  hideImportInterface() {
    const importInterface = document.getElementById('import-handler-interface');
    if (importInterface) {
      importInterface.classList.add('hidden');
      this.resetImportInterface();
    }
  }

  // Reset import interface
  resetImportInterface() {
    const fileInput = document.getElementById('import-file-input');
    const dropZone = document.getElementById('file-drop-zone');
    const fileInfo = document.getElementById('selected-file-info');
    const preview = document.getElementById('import-preview');
    const progress = document.getElementById('import-progress');
    const status = document.getElementById('import-status');
    const startButton = document.getElementById('start-import');

    if (fileInput) fileInput.value = '';
    if (dropZone) dropZone.classList.remove('hidden');
    if (fileInfo) fileInfo.classList.add('hidden');
    if (preview) preview.classList.add('hidden');
    if (progress) progress.classList.add('hidden');
    if (status) status.classList.add('hidden');
    if (startButton) startButton.disabled = true;

    this.selectedFile = null;
    this.parsedData = null;
  }

  // Handle file selection
  async handleFileSelection(file) {
    if (!file) return;

    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      this.showError(validation.error);
      return;
    }

    this.selectedFile = file;

    // Update UI
    this.updateFileInfo(file);

    try {
      // Parse file
      const data = await this.parseFile(file);
      this.parsedData = data;

      // Show preview
      this.showPreview(data);

      // Enable import button
      const startButton = document.getElementById('start-import');
      if (startButton) {
        startButton.disabled = false;
      }

    } catch (error) {
      console.error('File parsing error:', error);
      this.showError('Failed to parse file: ' + error.message);
    }
  }

  // Validate file
  validateFile(file) {
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      return { valid: false, error: 'File size exceeds 50MB limit' };
    }

    // Check file type
    const extension = file.name.toLowerCase().split('.').pop();
    if (!this.supportedFormats.includes(extension)) {
      return { valid: false, error: 'Unsupported file format. Please use JSON or CSV files.' };
    }

    return { valid: true };
  }

  // Parse file
  async parseFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const extension = file.name.toLowerCase().split('.').pop();

          if (extension === 'json') {
            const data = JSON.parse(content);
            resolve(data);
          } else if (extension === 'csv') {
            const data = this.parseCSV(content);
            resolve(data);
          } else {
            reject(new Error('Unsupported file format'));
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  // Parse CSV content
  parseCSV(content) {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('Empty CSV file');
    }

    // Simple CSV parser - assumes first line is headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }

    return { csvData: data, headers: headers };
  }

  // Update file info display
  updateFileInfo(file) {
    const dropZone = document.getElementById('file-drop-zone');
    const fileInfo = document.getElementById('selected-file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');

    if (dropZone) dropZone.classList.add('hidden');
    if (fileInfo) fileInfo.classList.remove('hidden');
    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = this.formatFileSize(file.size);
  }

  // Show preview of parsed data
  showPreview(data) {
    const preview = document.getElementById('import-preview');
    const previewContent = document.getElementById('preview-content');

    if (!preview || !previewContent) return;

    let previewText = '';

    if (data.csvData) {
      previewText = `CSV Data (${data.csvData.length} rows)\n`;
      previewText += `Headers: ${data.headers.join(', ')}\n\n`;
      previewText += 'Sample rows:\n';
      data.csvData.slice(0, 3).forEach((row, index) => {
        previewText += `${index + 1}: ${JSON.stringify(row)}\n`;
      });
    } else {
      previewText = JSON.stringify(data, null, 2).substring(0, 500);
      if (JSON.stringify(data, null, 2).length > 500) {
        previewText += '\n... (truncated)';
      }
    }

    previewContent.textContent = previewText;
    preview.classList.remove('hidden');
  }

  // Start import process
  async startImport() {
    if (!this.parsedData) {
      this.showError('No data to import');
      return;
    }

    const options = this.getImportOptions();

    try {
      this.showProgress();

      // Create backup if requested
      if (options.backupBeforeImport && window.backupManager) {
        this.updateProgress(10, 'Creating backup...');
        await window.backupManager.createBackup();
      }

      this.updateProgress(30, 'Validating data...');

      // Validate data if requested
      if (options.validateData) {
        const validation = this.validateImportData(this.parsedData);
        if (!validation.valid) {
          throw new Error('Data validation failed: ' + validation.errors.join(', '));
        }
      }

      this.updateProgress(50, 'Processing import...');

      // Process import
      const result = await this.processImport(this.parsedData, options);

      this.updateProgress(90, 'Finalizing...');

      // Refresh application data
      this.refreshApplicationData();

      this.updateProgress(100, 'Import complete');

      this.showSuccess(`Import completed successfully! ${result.imported} items imported.`);

    } catch (error) {
      console.error('Import failed:', error);
      this.showError('Import failed: ' + error.message);
    }
  }

  // Get import options
  getImportOptions() {
    return {
      mergeData: document.getElementById('merge-data')?.checked || false,
      validateData: document.getElementById('validate-data')?.checked || false,
      backupBeforeImport: document.getElementById('backup-before-import')?.checked || false
    };
  }

  // Validate import data
  validateImportData(data) {
    const errors = [];

    // Handle CSV data
    if (data.csvData) {
      data.csvData.forEach((row, index) => {
        if (!row.title && !row.name) {
          errors.push(`Row ${index + 1}: Missing required title/name field`);
        }
      });
    } else {
      // Handle JSON data
      Object.keys(data).forEach(key => {
        if (this.validationRules[key]) {
          const rules = this.validationRules[key];
          const items = Array.isArray(data[key]) ? data[key] : [data[key]];

          items.forEach((item, index) => {
            rules.required.forEach(field => {
              if (!item[field]) {
                errors.push(`${key}[${index}]: Missing required field '${field}'`);
              }
            });
          });
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // Process import
  async processImport(data, options) {
    let imported = 0;

    if (data.csvData) {
      // Handle CSV import
      imported = await this.importCSVData(data, options);
    } else {
      // Handle JSON import
      imported = await this.importJSONData(data, options);
    }

    return { imported };
  }

  // Import CSV data
  async importCSVData(data, options) {
    let imported = 0;

    // Determine data type based on headers
    const headers = data.headers;
    let dataType = 'unknown';

    if (headers.includes('title') && headers.includes('url')) {
      dataType = 'bookmarks';
    } else if (headers.includes('title') && headers.includes('content')) {
      dataType = 'notes';
    } else if (headers.includes('name') && headers.includes('email')) {
      dataType = 'profile';
    }

    // Import based on detected type
    for (const row of data.csvData) {
      try {
        if (dataType === 'bookmarks' && window.enhancedBookmarkManager) {
          const sanitized = this.sanitizeBookmarkData(row);
          if (options.mergeData || !this.isDuplicateBookmark(sanitized)) {
            window.enhancedBookmarkManager.addBookmark(sanitized);
            imported++;
          }
        } else if (dataType === 'notes' && window.enhancedNoteManager) {
          const sanitized = this.sanitizeNoteData(row);
          if (options.mergeData || !this.isDuplicateNote(sanitized)) {
            window.enhancedNoteManager.createNote(sanitized);
            imported++;
          }
        }
      } catch (error) {
        console.warn('Failed to import row:', row, error);
      }
    }

    return imported;
  }

  // Import JSON data
  async importJSONData(data, options) {
    let imported = 0;

    // Import profile data
    if (data.profile && window.profileManager) {
      const sanitized = this.sanitizeProfileData(data.profile);
      if (options.mergeData) {
        Object.assign(window.profileManager.profileData, sanitized);
        window.profileManager.saveProfile();
        imported++;
      }
    }

    // Import bookmarks
    if (data.bookmarks && Array.isArray(data.bookmarks) && window.enhancedBookmarkManager) {
      for (const bookmark of data.bookmarks) {
        try {
          const sanitized = this.sanitizeBookmarkData(bookmark);
          if (options.mergeData || !this.isDuplicateBookmark(sanitized)) {
            window.enhancedBookmarkManager.addBookmark(sanitized);
            imported++;
          }
        } catch (error) {
          console.warn('Failed to import bookmark:', bookmark, error);
        }
      }
    }

    // Import notes
    if (data.notes && Array.isArray(data.notes) && window.enhancedNoteManager) {
      for (const note of data.notes) {
        try {
          const sanitized = this.sanitizeNoteData(note);
          if (options.mergeData || !this.isDuplicateNote(sanitized)) {
            window.enhancedNoteManager.createNote(sanitized);
            imported++;
          }
        } catch (error) {
          console.warn('Failed to import note:', note, error);
        }
      }
    }

    return imported;
  }

  // Data sanitization methods
  sanitizeProfileData(data) {
    return {
      name: this.sanitizeString(data.name || ''),
      email: this.sanitizeEmail(data.email || ''),
      preferences: data.preferences || {}
    };
  }

  sanitizeBookmarkData(data) {
    return {
      title: this.sanitizeString(data.title || ''),
      url: this.sanitizeURL(data.url || ''),
      description: this.sanitizeString(data.description || ''),
      category: this.sanitizeString(data.category || 'general'),
      dateAdded: data.dateAdded || new Date().toISOString()
    };
  }

  sanitizeNoteData(data) {
    return {
      title: this.sanitizeString(data.title || ''),
      content: this.sanitizeString(data.content || ''),
      richContent: this.sanitizeHTML(data.richContent || ''),
      subject: this.sanitizeString(data.subject || ''),
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    };
  }

  // Sanitization utilities
  sanitizeString(str) {
    return String(str).trim().replace(/[<>]/g, '');
  }

  sanitizeEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? email : '';
  }

  sanitizeURL(url) {
    try {
      return new URL(url).toString();
    } catch {
      return url.startsWith('http') ? url : '';
    }
  }

  sanitizeHTML(html) {
    // Basic HTML sanitization - remove script tags and dangerous attributes
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/on\w+="[^"]*"/gi, '')
               .replace(/javascript:/gi, '');
  }

  // Duplicate detection
  isDuplicateBookmark(bookmark) {
    if (!window.enhancedBookmarkManager) return false;
    return window.enhancedBookmarkManager.bookmarks.some(b => 
      b.title === bookmark.title && b.url === bookmark.url
    );
  }

  isDuplicateNote(note) {
    if (!window.enhancedNoteManager) return false;
    return window.enhancedNoteManager.notes.some(n => 
      n.title === note.title && n.content === note.content
    );
  }

  // Refresh application data
  refreshApplicationData() {
    // Refresh profile manager
    if (window.profileManager) {
      window.profileManager.profileData = window.profileManager.loadProfile();
      window.profileManager.updateAllProfileElements();
    }

    // Refresh bookmark manager
    if (window.enhancedBookmarkManager) {
      window.enhancedBookmarkManager.loadBookmarks();
      window.enhancedBookmarkManager.renderBookmarks();
    }

    // Refresh note manager
    if (window.enhancedNoteManager) {
      window.enhancedNoteManager.loadNotes();
      window.enhancedNoteManager.renderNotes();
    }
  }

  // Utility methods
  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  }

  updateProgress(percentage, message) {
    const progressContainer = document.getElementById('import-progress');
    const progressBar = document.getElementById('import-progress-bar');
    const percentageElement = document.getElementById('import-percentage');

    if (progressContainer) progressContainer.classList.remove('hidden');
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (percentageElement) percentageElement.textContent = `${Math.round(percentage)}%`;
  }

  showProgress() {
    const progressContainer = document.getElementById('import-progress');
    if (progressContainer) {
      progressContainer.classList.remove('hidden');
    }
  }

  showSuccess(message) {
    const statusContainer = document.getElementById('import-status');
    
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
      this.hideImportInterface();
    }, 3000);
  }

  showError(message) {
    const statusContainer = document.getElementById('import-status');
    
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
}

// Initialize global import handler
window.importHandler = new ImportHandler();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImportHandler;
}