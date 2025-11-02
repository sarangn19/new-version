/**
 * Enhanced Note Manager
 * Provides rich text formatting, media attachments, and advanced note management
 */
class EnhancedNoteManager {
  constructor() {
    this.notes = this.loadNotes();
    this.attachments = this.loadAttachments();
    this.currentEditor = null;
    this.maxAttachmentSize = 10 * 1024 * 1024; // 10MB
    this.allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeRichTextEditor();
  }

  loadNotes() {
    return JSON.parse(localStorage.getItem('userNotes') || '[]');
  }

  saveNotes() {
    localStorage.setItem('userNotes', JSON.stringify(this.notes));
  }

  loadAttachments() {
    return JSON.parse(localStorage.getItem('noteAttachments') || '{}');
  }

  saveAttachments() {
    localStorage.setItem('noteAttachments', JSON.stringify(this.attachments));
  }

  setupEventListeners() {
    // Rich text formatting buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('format-btn')) {
        this.handleFormatting(e.target.dataset.format);
      } else if (e.target.classList.contains('attach-file-btn')) {
        this.showAttachmentModal();
      } else if (e.target.classList.contains('insert-link-btn')) {
        this.insertLink();
      } else if (e.target.classList.contains('insert-table-btn')) {
        this.insertTable();
      }
    });

    // File upload handling
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('file-upload-input')) {
        this.handleFileUpload(e.target.files);
      }
    });

    // Drag and drop for attachments
    document.addEventListener('dragover', (e) => {
      if (e.target.classList.contains('note-editor') || e.target.closest('.note-editor')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }
    });

    document.addEventListener('drop', (e) => {
      if (e.target.classList.contains('note-editor') || e.target.closest('.note-editor')) {
        e.preventDefault();
        this.handleFileUpload(e.dataTransfer.files);
      }
    });
  }

  initializeRichTextEditor() {
    // Initialize rich text editor for note content areas
    const editors = document.querySelectorAll('.rich-text-editor');
    editors.forEach(editor => {
      this.setupRichTextEditor(editor);
    });
  }

  setupRichTextEditor(element) {
    if (!element) return;

    // Make element contenteditable
    element.contentEditable = true;
    element.classList.add('note-editor');

    // Add formatting toolbar
    const toolbar = this.createFormattingToolbar();
    element.parentNode.insertBefore(toolbar, element);

    // Store reference to current editor
    element.addEventListener('focus', () => {
      this.currentEditor = element;
      this.updateToolbarState();
    });

    // Handle keyboard shortcuts
    element.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // Handle paste events
    element.addEventListener('paste', (e) => {
      this.handlePaste(e);
    });
  }

  createFormattingToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'rich-text-toolbar flex items-center gap-1 p-2 bg-[var(--bg-dark-2)] border border-white/10 rounded-t-lg';
    toolbar.innerHTML = `
      <div class="flex items-center gap-1 border-r border-white/10 pr-2 mr-2">
        <button class="format-btn toolbar-btn" data-format="bold" title="Bold (Ctrl+B)">
          <i data-lucide="bold" class="w-4 h-4"></i>
        </button>
        <button class="format-btn toolbar-btn" data-format="italic" title="Italic (Ctrl+I)">
          <i data-lucide="italic" class="w-4 h-4"></i>
        </button>
        <button class="format-btn toolbar-btn" data-format="underline" title="Underline (Ctrl+U)">
          <i data-lucide="underline" class="w-4 h-4"></i>
        </button>
        <button class="format-btn toolbar-btn" data-format="strikethrough" title="Strikethrough">
          <i data-lucide="strikethrough" class="w-4 h-4"></i>
        </button>
      </div>
      
      <div class="flex items-center gap-1 border-r border-white/10 pr-2 mr-2">
        <select class="format-select bg-[var(--bg-dark-1)] border border-white/20 rounded px-2 py-1 text-sm text-white" data-format="formatBlock">
          <option value="div">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="p">Paragraph</option>
        </select>
      </div>
      
      <div class="flex items-center gap-1 border-r border-white/10 pr-2 mr-2">
        <button class="format-btn toolbar-btn" data-format="justifyLeft" title="Align Left">
          <i data-lucide="align-left" class="w-4 h-4"></i>
        </button>
        <button class="format-btn toolbar-btn" data-format="justifyCenter" title="Align Center">
          <i data-lucide="align-center" class="w-4 h-4"></i>
        </button>
        <button class="format-btn toolbar-btn" data-format="justifyRight" title="Align Right">
          <i data-lucide="align-right" class="w-4 h-4"></i>
        </button>
      </div>
      
      <div class="flex items-center gap-1 border-r border-white/10 pr-2 mr-2">
        <button class="format-btn toolbar-btn" data-format="insertUnorderedList" title="Bullet List">
          <i data-lucide="list" class="w-4 h-4"></i>
        </button>
        <button class="format-btn toolbar-btn" data-format="insertOrderedList" title="Numbered List">
          <i data-lucide="list-ordered" class="w-4 h-4"></i>
        </button>
        <button class="format-btn toolbar-btn" data-format="outdent" title="Decrease Indent">
          <i data-lucide="indent-decrease" class="w-4 h-4"></i>
        </button>
        <button class="format-btn toolbar-btn" data-format="indent" title="Increase Indent">
          <i data-lucide="indent-increase" class="w-4 h-4"></i>
        </button>
      </div>
      
      <div class="flex items-center gap-1 border-r border-white/10 pr-2 mr-2">
        <button class="insert-link-btn toolbar-btn" title="Insert Link">
          <i data-lucide="link" class="w-4 h-4"></i>
        </button>
        <button class="attach-file-btn toolbar-btn" title="Attach File">
          <i data-lucide="paperclip" class="w-4 h-4"></i>
        </button>
        <button class="insert-table-btn toolbar-btn" title="Insert Table">
          <i data-lucide="table" class="w-4 h-4"></i>
        </button>
      </div>
      
      <div class="flex items-center gap-1">
        <input type="color" class="color-picker w-8 h-8 rounded border border-white/20 bg-transparent cursor-pointer" title="Text Color">
        <button class="format-btn toolbar-btn" data-format="removeFormat" title="Clear Formatting">
          <i data-lucide="eraser" class="w-4 h-4"></i>
        </button>
      </div>
    `;

    // Add event listeners for toolbar
    const formatSelect = toolbar.querySelector('.format-select');
    formatSelect.addEventListener('change', (e) => {
      this.handleFormatting('formatBlock', e.target.value);
    });

    const colorPicker = toolbar.querySelector('.color-picker');
    colorPicker.addEventListener('change', (e) => {
      this.handleFormatting('foreColor', e.target.value);
    });

    return toolbar;
  }

  handleFormatting(command, value = null) {
    if (!this.currentEditor) return;

    this.currentEditor.focus();
    
    try {
      document.execCommand(command, false, value);
      this.updateToolbarState();
      this.saveCurrentNote();
    } catch (error) {
      console.error('Formatting error:', error);
    }
  }

  handleKeyboardShortcuts(e) {
    if (!e.ctrlKey && !e.metaKey) return;

    const shortcuts = {
      'b': 'bold',
      'i': 'italic',
      'u': 'underline',
      'k': 'createLink',
      'z': 'undo',
      'y': 'redo'
    };

    const command = shortcuts[e.key.toLowerCase()];
    if (command) {
      e.preventDefault();
      if (command === 'createLink') {
        this.insertLink();
      } else {
        this.handleFormatting(command);
      }
    }
  }

  handlePaste(e) {
    e.preventDefault();
    
    const clipboardData = e.clipboardData || window.clipboardData;
    const items = clipboardData.items;

    // Handle image paste
    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        this.handleImageFile(file);
        return;
      }
    }

    // Handle text paste
    const text = clipboardData.getData('text/plain');
    if (text) {
      document.execCommand('insertText', false, text);
    }
  }

  updateToolbarState() {
    if (!this.currentEditor) return;

    const toolbar = this.currentEditor.previousElementSibling;
    if (!toolbar || !toolbar.classList.contains('rich-text-toolbar')) return;

    // Update button states based on current selection
    const commands = ['bold', 'italic', 'underline', 'strikethrough'];
    commands.forEach(command => {
      const button = toolbar.querySelector(`[data-format="${command}"]`);
      if (button) {
        const isActive = document.queryCommandState(command);
        button.classList.toggle('active', isActive);
      }
    });
  }

  insertLink() {
    const url = prompt('Enter URL:');
    if (url) {
      const text = window.getSelection().toString() || url;
      const link = `<a href="${url}" target="_blank" class="text-blue-400 hover:text-blue-300 underline">${text}</a>`;
      document.execCommand('insertHTML', false, link);
    }
  }

  insertTable() {
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');
    
    if (rows && cols) {
      let tableHTML = '<table class="border-collapse border border-white/20 my-4"><tbody>';
      
      for (let i = 0; i < parseInt(rows); i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < parseInt(cols); j++) {
          tableHTML += '<td class="border border-white/20 p-2 min-w-[100px]">&nbsp;</td>';
        }
        tableHTML += '</tr>';
      }
      
      tableHTML += '</tbody></table>';
      document.execCommand('insertHTML', false, tableHTML);
    }
  }

  // File attachment methods
  showAttachmentModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-[var(--bg-dark-2)] rounded-2xl p-6 max-w-md w-full border border-white/10">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium">Attach File</h3>
          <button id="closeAttachModal" class="text-white/50 hover:text-white">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
        
        <div class="space-y-4">
          <div class="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition">
            <i data-lucide="upload" class="w-12 h-12 mx-auto mb-4 text-white/50"></i>
            <p class="text-white/70 mb-2">Drop files here or click to browse</p>
            <p class="text-xs text-white/50">Max size: 10MB. Supported: Images, PDF, Text</p>
            <input type="file" class="file-upload-input hidden" multiple accept="image/*,.pdf,.txt">
            <button onclick="this.previousElementSibling.click()" class="mt-4 px-4 py-2 bg-[var(--teal-primary)] text-white rounded-lg hover:bg-[var(--teal-primary)]/80 transition">
              Choose Files
            </button>
          </div>
          
          <div id="upload-progress" class="hidden">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-white/70">Uploading...</span>
              <span class="text-sm text-white/70" id="progress-text">0%</span>
            </div>
            <div class="w-full bg-white/20 rounded-full h-2">
              <div class="bg-[var(--teal-primary)] h-2 rounded-full transition-all" id="progress-bar" style="width: 0%"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('#closeAttachModal').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    // File upload handling
    const fileInput = modal.querySelector('.file-upload-input');
    fileInput.addEventListener('change', (e) => {
      this.handleFileUpload(e.target.files);
      document.body.removeChild(modal);
    });

    // Drag and drop
    const dropZone = modal.querySelector('.border-dashed');
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-[var(--teal-primary)]');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-[var(--teal-primary)]');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-[var(--teal-primary)]');
      this.handleFileUpload(e.dataTransfer.files);
      document.body.removeChild(modal);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  async handleFileUpload(files) {
    if (!files || files.length === 0) return;

    for (let file of files) {
      if (!this.validateFile(file)) continue;

      try {
        const attachment = await this.processFile(file);
        this.insertAttachment(attachment);
      } catch (error) {
        console.error('File upload error:', error);
        this.showToast(`Error uploading ${file.name}: ${error.message}`, 'error');
      }
    }
  }

  validateFile(file) {
    if (file.size > this.maxAttachmentSize) {
      this.showToast(`File ${file.name} is too large. Max size: 10MB`, 'error');
      return false;
    }

    if (!this.allowedFileTypes.includes(file.type)) {
      this.showToast(`File type ${file.type} is not supported`, 'error');
      return false;
    }

    return true;
  }

  async processFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const attachment = {
          id: Date.now() + Math.random(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result,
          dateAdded: new Date().toISOString()
        };

        // Store attachment
        this.attachments[attachment.id] = attachment;
        this.saveAttachments();
        
        resolve(attachment);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  insertAttachment(attachment) {
    if (!this.currentEditor) return;

    let html = '';

    if (attachment.type.startsWith('image/')) {
      html = `
        <div class="attachment-container my-4" data-attachment-id="${attachment.id}">
          <img src="${attachment.data}" alt="${attachment.name}" class="max-w-full h-auto rounded-lg border border-white/20">
          <div class="flex items-center justify-between mt-2 text-xs text-white/60">
            <span>${attachment.name}</span>
            <button onclick="enhancedNoteManager.removeAttachment('${attachment.id}')" class="text-red-400 hover:text-red-300">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `;
    } else {
      const icon = this.getFileIcon(attachment.type);
      html = `
        <div class="attachment-container my-4 p-3 bg-white/5 rounded-lg border border-white/20" data-attachment-id="${attachment.id}">
          <div class="flex items-center gap-3">
            <i data-lucide="${icon}" class="w-8 h-8 text-white/60"></i>
            <div class="flex-1">
              <div class="font-medium text-sm">${attachment.name}</div>
              <div class="text-xs text-white/60">${this.formatFileSize(attachment.size)}</div>
            </div>
            <button onclick="enhancedNoteManager.downloadAttachment('${attachment.id}')" class="text-blue-400 hover:text-blue-300 mr-2">
              <i data-lucide="download" class="w-4 h-4"></i>
            </button>
            <button onclick="enhancedNoteManager.removeAttachment('${attachment.id}')" class="text-red-400 hover:text-red-300">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `;
    }

    document.execCommand('insertHTML', false, html);
    
    // Re-render icons
    if (window.lucide) window.lucide.createIcons();
    
    this.saveCurrentNote();
  }

  getFileIcon(type) {
    if (type.startsWith('image/')) return 'image';
    if (type === 'application/pdf') return 'file-text';
    if (type.startsWith('text/')) return 'file-text';
    return 'file';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  removeAttachment(attachmentId) {
    // Remove from storage
    delete this.attachments[attachmentId];
    this.saveAttachments();

    // Remove from DOM
    const container = document.querySelector(`[data-attachment-id="${attachmentId}"]`);
    if (container) {
      container.remove();
    }

    this.saveCurrentNote();
    this.showToast('Attachment removed', 'success');
  }

  downloadAttachment(attachmentId) {
    const attachment = this.attachments[attachmentId];
    if (!attachment) return;

    const link = document.createElement('a');
    link.href = attachment.data;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Note CRUD operations with rich content support
  createNote(noteData) {
    const note = {
      id: Date.now(),
      title: noteData.title || 'Untitled Note',
      content: noteData.content || '',
      richContent: noteData.richContent || '',
      subject: noteData.subject || 'General',
      tags: noteData.tags || [],
      attachments: noteData.attachments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      color: noteData.color || 'default',
      isFavorite: false,
      isArchived: false
    };

    this.notes.unshift(note);
    this.saveNotes();
    return note;
  }

  updateNote(id, updates) {
    const index = this.notes.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notes[index] = {
        ...this.notes[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveNotes();
      return this.notes[index];
    }
    return null;
  }

  deleteNote(id) {
    // Remove associated attachments
    const note = this.notes.find(n => n.id === id);
    if (note && note.attachments) {
      note.attachments.forEach(attachmentId => {
        delete this.attachments[attachmentId];
      });
      this.saveAttachments();
    }

    this.notes = this.notes.filter(n => n.id !== id);
    this.saveNotes();
  }

  saveCurrentNote() {
    if (!this.currentEditor) return;

    const noteContainer = this.currentEditor.closest('[data-note-id]');
    if (!noteContainer) return;

    const noteId = parseInt(noteContainer.dataset.noteId);
    const content = this.currentEditor.innerHTML;

    this.updateNote(noteId, { 
      richContent: content,
      content: this.currentEditor.textContent // Plain text version
    });
  }

  // Search notes with rich content
  searchNotes(query, options = {}) {
    let results = [...this.notes];

    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(note =>
        note.title.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (options.subject) {
      results = results.filter(note => note.subject === options.subject);
    }

    if (options.isFavorite) {
      results = results.filter(note => note.isFavorite);
    }

    if (options.hasAttachments) {
      results = results.filter(note => note.attachments && note.attachments.length > 0);
    }

    return results;
  }

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300 ${
      type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-gray-600'
    } text-white`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  // Export notes with attachments
  exportNotes(noteIds = null) {
    const notesToExport = noteIds ? 
      this.notes.filter(note => noteIds.includes(note.id)) : 
      this.notes;

    const exportData = {
      exportDate: new Date().toISOString(),
      notes: notesToExport,
      attachments: {}
    };

    // Include attachments for exported notes
    notesToExport.forEach(note => {
      if (note.attachments) {
        note.attachments.forEach(attachmentId => {
          if (this.attachments[attachmentId]) {
            exportData.attachments[attachmentId] = this.attachments[attachmentId];
          }
        });
      }
    });

    return exportData;
  }

  // Import notes with attachments
  importNotes(data) {
    try {
      const importData = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (importData.notes && Array.isArray(importData.notes)) {
        // Import attachments first
        if (importData.attachments) {
          Object.assign(this.attachments, importData.attachments);
          this.saveAttachments();
        }

        // Import notes
        const imported = importData.notes.map(note => ({
          ...note,
          id: Date.now() + Math.random(), // Ensure unique IDs
          createdAt: note.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        this.notes = [...imported, ...this.notes];
        this.saveNotes();
        
        return imported.length;
      }
      
      throw new Error('Invalid note data format');
    } catch (error) {
      console.error('Error importing notes:', error);
      throw error;
    }
  }
}

// Add CSS for rich text editor
const richTextStyles = `
  .rich-text-toolbar {
    border-bottom: none !important;
    border-bottom-left-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
  }
  
  .note-editor {
    border-top-left-radius: 0 !important;
    border-top-right-radius: 0 !important;
    min-height: 200px;
    padding: 16px;
    background: var(--bg-dark-1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-top: none;
    color: white;
    outline: none;
  }
  
  .note-editor:focus {
    border-color: var(--teal-primary);
  }
  
  .toolbar-btn {
    padding: 6px 8px;
    border-radius: 6px;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .toolbar-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  .toolbar-btn.active {
    background: var(--teal-primary);
    color: white;
  }
  
  .attachment-container {
    position: relative;
  }
  
  .attachment-container img {
    max-width: 100%;
    height: auto;
  }
  
  .note-editor h1, .note-editor h2, .note-editor h3, .note-editor h4 {
    font-weight: 600;
    margin: 16px 0 8px 0;
  }
  
  .note-editor h1 { font-size: 2em; }
  .note-editor h2 { font-size: 1.5em; }
  .note-editor h3 { font-size: 1.25em; }
  .note-editor h4 { font-size: 1.1em; }
  
  .note-editor ul, .note-editor ol {
    margin: 8px 0;
    padding-left: 24px;
  }
  
  .note-editor table {
    border-collapse: collapse;
    margin: 16px 0;
    width: 100%;
  }
  
  .note-editor table td, .note-editor table th {
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 8px;
    min-width: 100px;
  }
  
  .note-editor blockquote {
    border-left: 4px solid var(--teal-primary);
    margin: 16px 0;
    padding-left: 16px;
    font-style: italic;
    color: rgba(255, 255, 255, 0.8);
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = richTextStyles;
document.head.appendChild(styleSheet);

// Initialize global enhanced note manager
window.enhancedNoteManager = new EnhancedNoteManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedNoteManager;
}