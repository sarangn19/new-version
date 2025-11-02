/**
 * Enhanced Bookmark Manager
 * Provides bulk operations, categorization, and advanced bookmark management
 */
class EnhancedBookmarkManager {
  constructor() {
    this.bookmarks = this.loadBookmarks();
    this.categories = this.loadCategories();
    this.selectedBookmarks = new Set();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeDefaultCategories();
  }

  loadBookmarks() {
    return JSON.parse(localStorage.getItem('bookmarks') || '[]');
  }

  saveBookmarks() {
    localStorage.setItem('bookmarks', JSON.stringify(this.bookmarks));
  }

  loadCategories() {
    const defaultCategories = [
      { id: 'general', name: 'General', color: '#6B7280', icon: 'folder' },
      { id: 'news', name: 'News', color: '#EF4444', icon: 'newspaper' },
      { id: 'articles', name: 'Articles', color: '#3B82F6', icon: 'file-text' },
      { id: 'videos', name: 'Videos', color: '#8B5CF6', icon: 'play-circle' },
      { id: 'notes', name: 'Notes', color: '#10B981', icon: 'edit-3' },
      { id: 'important', name: 'Important', color: '#F59E0B', icon: 'star' }
    ];
    
    const saved = JSON.parse(localStorage.getItem('bookmarkCategories') || '[]');
    return saved.length > 0 ? saved : defaultCategories;
  }

  saveCategories() {
    localStorage.setItem('bookmarkCategories', JSON.stringify(this.categories));
  }

  initializeDefaultCategories() {
    if (this.categories.length === 0) {
      this.saveCategories();
    }
  }

  setupEventListeners() {
    // Bulk selection handlers
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('bookmark-checkbox')) {
        this.handleBookmarkSelection(e.target);
      }
    });

    // Bulk action handlers
    document.addEventListener('click', (e) => {
      if (e.target.id === 'select-all-bookmarks') {
        this.selectAllBookmarks();
      } else if (e.target.id === 'deselect-all-bookmarks') {
        this.deselectAllBookmarks();
      } else if (e.target.id === 'bulk-delete-bookmarks') {
        this.bulkDeleteBookmarks();
      } else if (e.target.id === 'bulk-categorize-bookmarks') {
        this.showBulkCategorizeModal();
      } else if (e.target.id === 'export-selected-bookmarks') {
        this.exportSelectedBookmarks();
      }
    });
  }

  // Bookmark CRUD operations
  addBookmark(bookmarkData) {
    const bookmark = {
      id: Date.now(),
      title: bookmarkData.title,
      url: bookmarkData.url || '#',
      description: bookmarkData.description || '',
      category: bookmarkData.category || 'general',
      tags: bookmarkData.tags || [],
      dateAdded: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      type: bookmarkData.type || 'link',
      favicon: bookmarkData.favicon || null,
      thumbnail: bookmarkData.thumbnail || null,
      isRead: false,
      isFavorite: false,
      readingTime: bookmarkData.readingTime || null
    };

    this.bookmarks.unshift(bookmark);
    this.saveBookmarks();
    this.updateBookmarksDisplay();
    return bookmark;
  }

  updateBookmark(id, updates) {
    const index = this.bookmarks.findIndex(b => b.id === id);
    if (index !== -1) {
      this.bookmarks[index] = {
        ...this.bookmarks[index],
        ...updates,
        dateModified: new Date().toISOString()
      };
      this.saveBookmarks();
      this.updateBookmarksDisplay();
      return this.bookmarks[index];
    }
    return null;
  }

  deleteBookmark(id) {
    this.bookmarks = this.bookmarks.filter(b => b.id !== id);
    this.saveBookmarks();
    this.updateBookmarksDisplay();
  }

  // Bulk operations
  handleBookmarkSelection(checkbox) {
    const bookmarkId = parseInt(checkbox.dataset.bookmarkId);
    if (checkbox.checked) {
      this.selectedBookmarks.add(bookmarkId);
    } else {
      this.selectedBookmarks.delete(bookmarkId);
    }
    this.updateBulkActionsVisibility();
  }

  selectAllBookmarks() {
    const checkboxes = document.querySelectorAll('.bookmark-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = true;
      this.selectedBookmarks.add(parseInt(checkbox.dataset.bookmarkId));
    });
    this.updateBulkActionsVisibility();
  }

  deselectAllBookmarks() {
    const checkboxes = document.querySelectorAll('.bookmark-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    this.selectedBookmarks.clear();
    this.updateBulkActionsVisibility();
  }

  bulkDeleteBookmarks() {
    if (this.selectedBookmarks.size === 0) return;

    const count = this.selectedBookmarks.size;
    if (confirm(`Are you sure you want to delete ${count} bookmark(s)?`)) {
      this.bookmarks = this.bookmarks.filter(b => !this.selectedBookmarks.has(b.id));
      this.selectedBookmarks.clear();
      this.saveBookmarks();
      this.updateBookmarksDisplay();
      this.showToast(`${count} bookmark(s) deleted successfully`);
    }
  }

  bulkCategorizeBookmarks(categoryId) {
    if (this.selectedBookmarks.size === 0) return;

    const category = this.categories.find(c => c.id === categoryId);
    if (!category) return;

    this.bookmarks.forEach(bookmark => {
      if (this.selectedBookmarks.has(bookmark.id)) {
        bookmark.category = categoryId;
        bookmark.dateModified = new Date().toISOString();
      }
    });

    const count = this.selectedBookmarks.size;
    this.selectedBookmarks.clear();
    this.saveBookmarks();
    this.updateBookmarksDisplay();
    this.showToast(`${count} bookmark(s) moved to ${category.name}`);
  }

  exportSelectedBookmarks() {
    if (this.selectedBookmarks.size === 0) return;

    const selectedData = this.bookmarks.filter(b => this.selectedBookmarks.has(b.id));
    const exportData = {
      exportDate: new Date().toISOString(),
      bookmarks: selectedData,
      categories: this.categories
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmarks-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast(`${selectedData.length} bookmark(s) exported successfully`);
  }

  // Category management
  addCategory(categoryData) {
    const category = {
      id: Date.now().toString(),
      name: categoryData.name,
      color: categoryData.color || '#6B7280',
      icon: categoryData.icon || 'folder',
      description: categoryData.description || '',
      dateCreated: new Date().toISOString()
    };

    this.categories.push(category);
    this.saveCategories();
    return category;
  }

  updateCategory(id, updates) {
    const index = this.categories.findIndex(c => c.id === id);
    if (index !== -1) {
      this.categories[index] = { ...this.categories[index], ...updates };
      this.saveCategories();
      return this.categories[index];
    }
    return null;
  }

  deleteCategory(id) {
    // Move bookmarks to general category before deleting
    this.bookmarks.forEach(bookmark => {
      if (bookmark.category === id) {
        bookmark.category = 'general';
      }
    });

    this.categories = this.categories.filter(c => c.id !== id);
    this.saveCategories();
    this.saveBookmarks();
  }

  // Search and filter
  searchBookmarks(query, filters = {}) {
    let results = [...this.bookmarks];

    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(bookmark =>
        bookmark.title.toLowerCase().includes(searchTerm) ||
        bookmark.description.toLowerCase().includes(searchTerm) ||
        bookmark.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (filters.category) {
      results = results.filter(bookmark => bookmark.category === filters.category);
    }

    if (filters.type) {
      results = results.filter(bookmark => bookmark.type === filters.type);
    }

    if (filters.isFavorite) {
      results = results.filter(bookmark => bookmark.isFavorite);
    }

    if (filters.isUnread) {
      results = results.filter(bookmark => !bookmark.isRead);
    }

    return results;
  }

  // UI Methods
  updateBulkActionsVisibility() {
    const bulkActions = document.getElementById('bulk-actions');
    const selectedCount = document.getElementById('selected-count');
    
    if (bulkActions) {
      bulkActions.style.display = this.selectedBookmarks.size > 0 ? 'flex' : 'none';
    }
    
    if (selectedCount) {
      selectedCount.textContent = this.selectedBookmarks.size;
    }
  }

  showBulkCategorizeModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-[var(--bg-dark-2)] rounded-2xl p-6 max-w-md w-full border border-white/10">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium">Move to Category</h3>
          <button id="closeCategorizeModal" class="text-white/50 hover:text-white">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
        <div class="space-y-3 max-h-60 overflow-y-auto">
          ${this.categories.map(category => `
            <button onclick="enhancedBookmarkManager.bulkCategorizeBookmarks('${category.id}'); document.body.removeChild(this.closest('.fixed'))" 
                    class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition text-left">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background-color: ${category.color}20; color: ${category.color}">
                <i data-lucide="${category.icon}" class="w-4 h-4"></i>
              </div>
              <span class="font-medium">${category.name}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    modal.querySelector('#closeCategorizeModal').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    if (window.lucide) window.lucide.createIcons();
  }

  updateBookmarksDisplay() {
    // This method should be implemented based on the specific UI requirements
    // It will be called after bookmark operations to refresh the display
    if (window.profileManager && typeof window.profileManager.updateBookmarksDisplay === 'function') {
      window.profileManager.updateBookmarksDisplay();
    }
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

  // Import bookmarks
  importBookmarks(data) {
    try {
      const importData = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (importData.bookmarks && Array.isArray(importData.bookmarks)) {
        const imported = importData.bookmarks.map(bookmark => ({
          ...bookmark,
          id: Date.now() + Math.random(), // Ensure unique IDs
          dateAdded: bookmark.dateAdded || new Date().toISOString(),
          dateModified: new Date().toISOString()
        }));

        this.bookmarks = [...imported, ...this.bookmarks];
        this.saveBookmarks();
        this.updateBookmarksDisplay();
        
        return imported.length;
      }
      
      throw new Error('Invalid bookmark data format');
    } catch (error) {
      console.error('Error importing bookmarks:', error);
      throw error;
    }
  }

  // Get statistics
  getStatistics() {
    const stats = {
      total: this.bookmarks.length,
      byCategory: {},
      byType: {},
      favorites: this.bookmarks.filter(b => b.isFavorite).length,
      unread: this.bookmarks.filter(b => !b.isRead).length,
      recentlyAdded: this.bookmarks.filter(b => {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return new Date(b.dateAdded) > dayAgo;
      }).length
    };

    // Count by category
    this.categories.forEach(category => {
      stats.byCategory[category.name] = this.bookmarks.filter(b => b.category === category.id).length;
    });

    // Count by type
    const types = [...new Set(this.bookmarks.map(b => b.type))];
    types.forEach(type => {
      stats.byType[type] = this.bookmarks.filter(b => b.type === type).length;
    });

    return stats;
  }
}

// Initialize global enhanced bookmark manager
window.enhancedBookmarkManager = new EnhancedBookmarkManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedBookmarkManager;
}