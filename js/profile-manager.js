// Profile Manager - Shared profile data across all pages
class ProfileManager {
  constructor() {
    this.profileData = this.loadProfile();
    this.initializeProfileElements();
  }

  // Load profile data from localStorage
  loadProfile() {
    const defaultProfile = {
      name: 'Jane Doe',
      email: 'jane.doe@aspirant.com',
      initials: 'JD',
      avatar: null,
      preferences: {
        theme: 'dark',
        notifications: true,
        studyReminders: true
      },
      bookmarks: JSON.parse(localStorage.getItem('bookmarks') || '[]'),
      studyStats: {
        totalHours: 247,
        questionsAttempted: 1847,
        accuracyRate: 78.5,
        streak: 23
      }
    };

    // Check for profile.html individual storage keys first
    const profileName = localStorage.getItem('profile.name');
    const profileEmail = localStorage.getItem('profile.email');
    
    if (profileName || profileEmail) {
      return {
        ...defaultProfile,
        name: profileName || defaultProfile.name,
        email: profileEmail || defaultProfile.email
      };
    }

    // Check for unified userProfile storage
    const saved = localStorage.getItem('userProfile');
    if (saved) {
      try {
        const parsedProfile = JSON.parse(saved);
        // Check if this is test data and clear it
        if (parsedProfile.name && parsedProfile.name.startsWith('Test User')) {
          localStorage.removeItem('userProfile');
          return defaultProfile;
        }
        return { ...defaultProfile, ...parsedProfile };
      } catch (e) {
        // If parsing fails, return default
        localStorage.removeItem('userProfile');
        return defaultProfile;
      }
    }
    
    return defaultProfile;
  }

  // Save profile data to localStorage
  saveProfile() {
    localStorage.setItem('userProfile', JSON.stringify(this.profileData));
    
    // Also save individual keys for profile.html compatibility
    localStorage.setItem('profile.name', this.profileData.name);
    localStorage.setItem('profile.email', this.profileData.email);
    
    this.updateAllProfileElements();
  }

  // Update profile information
  updateProfile(updates) {
    this.profileData = { ...this.profileData, ...updates };
    this.saveProfile();
  }

  // Update avatar
  updateAvatar(file) {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profileData.avatar = e.target.result;
        this.saveProfile();
      };
      reader.readAsDataURL(file);
    }
  }

  // Generate initials from name
  generateInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  // Initialize profile elements on page load
  initializeProfileElements() {
    // Update immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.updateAllProfileElements();
      });
    } else {
      this.updateAllProfileElements();
    }
  }

  // Update all profile elements across the page
  updateAllProfileElements() {
    // Update name elements
    const nameElements = document.querySelectorAll('#user-name, .user-name');
    nameElements.forEach(el => {
      if (el) el.textContent = this.profileData.name;
    });

    // Update email elements
    const emailElements = document.querySelectorAll('#user-email, .user-email');
    emailElements.forEach(el => {
      if (el) el.textContent = this.profileData.email;
    });

    // Update initials elements
    const initialsElements = document.querySelectorAll('#user-initials, .user-initials');
    initialsElements.forEach(el => {
      if (el) el.textContent = this.generateInitials(this.profileData.name);
    });

    // Update avatar elements
    const avatarElements = document.querySelectorAll('.user-avatar');
    avatarElements.forEach(el => {
      if (this.profileData.avatar) {
        el.style.backgroundImage = `url(${this.profileData.avatar})`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        const initialsEl = el.querySelector('.user-initials');
        if (initialsEl) initialsEl.style.display = 'none';
      } else {
        el.style.backgroundImage = 'none';
        const initialsEl = el.querySelector('.user-initials');
        if (initialsEl) initialsEl.style.display = 'flex';
      }
    });

    // Re-create lucide icons if available
    if (typeof lucide !== 'undefined') {
      try {
        lucide.createIcons();
      } catch (error) {
        console.warn('Error creating lucide icons:', error);
      }
    }
  }

  // Bookmark management
  addBookmark(item) {
    if (!item || !item.title) {
      console.error('Invalid bookmark item:', item);
      return null;
    }

    const bookmark = {
      id: Date.now(),
      title: item.title,
      url: item.url || '#',
      category: item.category || 'General',
      dateAdded: new Date().toISOString(),
      type: item.type || 'news' // news, article, video, etc.
    };
    
    this.profileData.bookmarks.unshift(bookmark);
    localStorage.setItem('bookmarks', JSON.stringify(this.profileData.bookmarks));
    this.saveProfile();
    
    // Update display with error handling
    try {
      this.updateBookmarksDisplay();
    } catch (error) {
      console.error('Error updating bookmarks display:', error);
    }
    
    return bookmark;
  }

  removeBookmark(id) {
    if (!id) {
      console.error('Invalid bookmark ID:', id);
      return;
    }

    this.profileData.bookmarks = this.profileData.bookmarks.filter(b => b.id !== id);
    localStorage.setItem('bookmarks', JSON.stringify(this.profileData.bookmarks));
    this.saveProfile();
    
    // Update display with error handling
    try {
      this.updateBookmarksDisplay();
    } catch (error) {
      console.error('Error updating bookmarks display:', error);
    }
  }

  getBookmarks() {
    return this.profileData.bookmarks;
  }

  updateBookmarksDisplay() {
    const bookmarksContainer = document.getElementById('bookmarks-container');
    if (!bookmarksContainer) {
      console.warn('Bookmarks container not found');
      return;
    }

    if (this.profileData.bookmarks.length === 0) {
      bookmarksContainer.innerHTML = `
        <div class="text-center py-8 text-white/60">
          <i data-lucide="bookmark" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
          <p>No bookmarks yet</p>
          <p class="text-sm">Bookmark articles and news to access them later</p>
        </div>
      `;
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      return;
    }

    const bookmarksHTML = this.profileData.bookmarks.map(bookmark => `
      <div class="bg-[var(--bg-dark-2)] rounded-lg p-4 border border-white/5 hover:border-white/10 transition-all">
        <div class="flex items-start justify-between mb-2">
          <h4 class="font-medium text-sm line-clamp-2">${bookmark.title}</h4>
          <button onclick="profileManager.removeBookmark(${bookmark.id})" 
                  class="text-white/40 hover:text-red-400 transition-colors ml-2">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <div class="flex items-center justify-between text-xs text-white/60">
          <span class="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">${bookmark.category}</span>
          <span>${new Date(bookmark.dateAdded).toLocaleDateString()}</span>
        </div>
      </div>
    `).join('');

    bookmarksContainer.innerHTML = bookmarksHTML;
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// Initialize global profile manager
window.profileManager = new ProfileManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProfileManager;
}