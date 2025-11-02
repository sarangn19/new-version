// Profile Manager - Shared profile data across all pages
class ProfileManager {
  constructor() {
    this.profileData = this.loadProfile();
    this.initializeProfileElements();
    this.themeListenerCleanup = this.initializeThemeListener();
    
    // Initialize accessibility features
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.initializeKeyboardNavigation();
        this.enhanceAriaLabels();
      });
    } else {
      this.initializeKeyboardNavigation();
      this.enhanceAriaLabels();
    }
  }

  // Load profile data from localStorage
  loadProfile() {
    const defaultProfile = {
      name: 'User',
      email: 'user@upsc.com',
      initials: 'U',
      avatar: null,
      selectedDP: localStorage.getItem('selectedDP') || null,
      preferences: {
        // Theme preferences
        theme: {
          mode: 'dark', // 'dark', 'light', 'auto'
          fontSize: 'medium', // 'small', 'medium', 'large'
          colorScheme: 'default', // 'default', 'high-contrast', 'colorblind'
          animations: true
        },
        // Accessibility preferences
        accessibility: {
          highContrast: false,
          colorblindFriendly: false,
          keyboardNavigation: true,
          screenReaderOptimized: false,
          reducedMotion: false
        },
        // Study preferences
        study: {
          pomodoroWorkTime: 25, // minutes
          pomodoroBreakTime: 5, // minutes
          dailyGoal: 120, // minutes
          reminderFrequency: 'daily', // 'none', 'daily', 'weekly'
          spacedRepetition: true,
          autoSave: true
        },
        // Dashboard preferences
        dashboard: {
          layout: 'compact', // 'compact', 'spacious'
          widgets: ['stats', 'progress', 'goals', 'recent'], // array of enabled widgets
          showAnimations: true,
          compactMode: false
        },
        // Legacy preferences for backward compatibility
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
    const selectedDP = localStorage.getItem('selectedDP');
    
    if (profileName || profileEmail || selectedDP) {
      return {
        ...defaultProfile,
        name: profileName || defaultProfile.name,
        email: profileEmail || defaultProfile.email,
        selectedDP: selectedDP || defaultProfile.selectedDP
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
    
    // Save selectedDP for cross-page consistency
    if (this.profileData.selectedDP) {
      localStorage.setItem('selectedDP', this.profileData.selectedDP);
    }
    
    this.updateAllProfileElements();
  }

  // Update profile information
  updateProfile(updates) {
    this.profileData = { ...this.profileData, ...updates };
    this.saveProfile();
  }

  // Validate preference values
  validatePreferences(preferences) {
    const validThemeModes = ['dark', 'light', 'auto'];
    const validFontSizes = ['small', 'medium', 'large'];
    const validColorSchemes = ['default', 'high-contrast', 'colorblind'];
    const validLayouts = ['compact', 'spacious'];
    const validReminderFrequencies = ['none', 'daily', 'weekly'];

    const validated = { ...preferences };

    // Validate theme preferences
    if (validated.theme) {
      if (!validThemeModes.includes(validated.theme.mode)) {
        validated.theme.mode = 'dark';
      }
      if (!validFontSizes.includes(validated.theme.fontSize)) {
        validated.theme.fontSize = 'medium';
      }
      if (!validColorSchemes.includes(validated.theme.colorScheme)) {
        validated.theme.colorScheme = 'default';
      }
    }

    // Validate study preferences
    if (validated.study) {
      if (typeof validated.study.pomodoroWorkTime !== 'number' || validated.study.pomodoroWorkTime < 1 || validated.study.pomodoroWorkTime > 60) {
        validated.study.pomodoroWorkTime = 25;
      }
      if (typeof validated.study.pomodoroBreakTime !== 'number' || validated.study.pomodoroBreakTime < 1 || validated.study.pomodoroBreakTime > 30) {
        validated.study.pomodoroBreakTime = 5;
      }
      if (typeof validated.study.dailyGoal !== 'number' || validated.study.dailyGoal < 15 || validated.study.dailyGoal > 480) {
        validated.study.dailyGoal = 120;
      }
      if (!validReminderFrequencies.includes(validated.study.reminderFrequency)) {
        validated.study.reminderFrequency = 'daily';
      }
    }

    // Validate dashboard preferences
    if (validated.dashboard) {
      if (!validLayouts.includes(validated.dashboard.layout)) {
        validated.dashboard.layout = 'compact';
      }
      if (!Array.isArray(validated.dashboard.widgets)) {
        validated.dashboard.widgets = ['stats', 'progress', 'goals', 'recent'];
      }
    }

    return validated;
  }

  // Update specific preference category
  updatePreferences(category, updates) {
    if (!this.profileData.preferences[category]) {
      console.error(`Invalid preference category: ${category}`);
      return false;
    }

    const newPreferences = {
      ...this.profileData.preferences,
      [category]: {
        ...this.profileData.preferences[category],
        ...updates
      }
    };

    const validatedPreferences = this.validatePreferences(newPreferences);
    this.profileData.preferences = validatedPreferences;
    this.saveProfile();
    this.applyPreferences();
    return true;
  }

  // Get specific preference category
  getPreferences(category = null) {
    if (category) {
      return this.profileData.preferences[category] || null;
    }
    return this.profileData.preferences;
  }

  // Apply preferences to the current page
  applyPreferences() {
    this.applyThemePreferences();
    this.applyAccessibilityPreferences();
    this.applyDashboardPreferences();
    
    // Trigger custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('preferencesUpdated', {
      detail: { preferences: this.profileData.preferences }
    }));
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
        this.applyPreferences();
      });
    } else {
      this.updateAllProfileElements();
      this.applyPreferences();
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

    // Update initials elements and profile pictures
    const initialsElements = document.querySelectorAll('#user-initials, .user-initials');
    initialsElements.forEach(el => {
      if (el) {
        const parentContainer = el.parentElement;
        
        // Check if we have a selected DP
        if (this.profileData.selectedDP) {
          // Replace initials with image
          parentContainer.innerHTML = `<img src="image/${this.profileData.selectedDP}.png" alt="Profile Picture" class="w-full h-full object-cover">`;
        } else {
          // Show initials
          el.textContent = this.generateInitials(this.profileData.name);
        }
      }
    });

    // Update main avatar elements (like in profile page)
    const avatarInitialElements = document.querySelectorAll('#avatarInitial');
    avatarInitialElements.forEach(el => {
      if (el) {
        const parentContainer = el.parentElement;
        
        if (this.profileData.selectedDP) {
          // Replace with image
          parentContainer.innerHTML = `<img src="image/${this.profileData.selectedDP}.png" alt="Profile Picture" class="w-full h-full object-cover">`;
        } else {
          // Show initials
          el.textContent = this.generateInitials(this.profileData.name).charAt(0);
        }
      }
    });

    // Update avatar elements
    const avatarElements = document.querySelectorAll('.user-avatar');
    avatarElements.forEach(el => {
      if (this.profileData.avatar || this.profileData.selectedDP) {
        const imageSrc = this.profileData.selectedDP ? `image/${this.profileData.selectedDP}.png` : this.profileData.avatar;
        el.style.backgroundImage = `url(${imageSrc})`;
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

  // Apply theme preferences
  applyThemePreferences() {
    const themePrefs = this.profileData.preferences.theme;
    const root = document.documentElement;

    // Apply theme mode
    if (themePrefs.mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', themePrefs.mode);
    }

    // Apply font size
    const fontSizeMap = {
      'small': '14px',
      'medium': '16px',
      'large': '18px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[themePrefs.fontSize]);

    // Apply color scheme
    root.setAttribute('data-color-scheme', themePrefs.colorScheme);

    // Apply animations preference
    if (!themePrefs.animations) {
      root.style.setProperty('--animation-duration', '0s');
    } else {
      root.style.removeProperty('--animation-duration');
    }
  }

  // Apply accessibility preferences
  applyAccessibilityPreferences() {
    const accessibilityPrefs = this.profileData.preferences.accessibility;
    const root = document.documentElement;

    // High contrast mode
    if (accessibilityPrefs.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Colorblind friendly mode
    if (accessibilityPrefs.colorblindFriendly) {
      root.classList.add('colorblind-friendly');
    } else {
      root.classList.remove('colorblind-friendly');
    }

    // Reduced motion
    if (accessibilityPrefs.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Screen reader optimization
    if (accessibilityPrefs.screenReaderOptimized) {
      root.classList.add('screen-reader-optimized');
    } else {
      root.classList.remove('screen-reader-optimized');
    }
  }

  // Apply dashboard preferences
  applyDashboardPreferences() {
    const dashboardPrefs = this.profileData.preferences.dashboard;
    const root = document.documentElement;

    // Apply layout preference
    root.setAttribute('data-dashboard-layout', dashboardPrefs.layout);

    // Apply compact mode
    if (dashboardPrefs.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }

    // Hide/show dashboard animations
    if (!dashboardPrefs.showAnimations) {
      root.classList.add('no-dashboard-animations');
    } else {
      root.classList.remove('no-dashboard-animations');
    }
  }

  // Theme customization methods
  setThemeMode(mode) {
    if (['dark', 'light', 'auto'].includes(mode)) {
      this.updatePreferences('theme', { mode });
      return true;
    }
    return false;
  }

  setFontSize(size) {
    if (['small', 'medium', 'large'].includes(size)) {
      this.updatePreferences('theme', { fontSize: size });
      return true;
    }
    return false;
  }

  setColorScheme(scheme) {
    if (['default', 'high-contrast', 'colorblind'].includes(scheme)) {
      this.updatePreferences('theme', { colorScheme: scheme });
      return true;
    }
    return false;
  }

  toggleAnimations() {
    const currentAnimations = this.profileData.preferences.theme.animations;
    this.updatePreferences('theme', { animations: !currentAnimations });
    return !currentAnimations;
  }

  // Live preview functionality for theme changes
  previewTheme(themeSettings) {
    const root = document.documentElement;
    const originalSettings = { ...this.profileData.preferences.theme };

    // Apply preview settings temporarily
    const previewSettings = { ...originalSettings, ...themeSettings };

    // Apply theme mode
    if (previewSettings.mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', previewSettings.mode);
    }

    // Apply font size
    const fontSizeMap = {
      'small': '14px',
      'medium': '16px',
      'large': '18px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[previewSettings.fontSize]);

    // Apply color scheme
    root.setAttribute('data-color-scheme', previewSettings.colorScheme);

    // Apply animations
    if (!previewSettings.animations) {
      root.style.setProperty('--animation-duration', '0s');
    } else {
      root.style.removeProperty('--animation-duration');
    }

    // Return a function to revert the preview
    return () => {
      this.applyThemePreferences();
    };
  }

  // Get current theme settings
  getCurrentTheme() {
    return { ...this.profileData.preferences.theme };
  }

  // Reset theme to defaults
  resetTheme() {
    const defaultTheme = {
      mode: 'dark',
      fontSize: 'medium',
      colorScheme: 'default',
      animations: true
    };
    this.updatePreferences('theme', defaultTheme);
    return defaultTheme;
  }

  // Auto-detect system theme preference
  detectSystemTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  // Listen for system theme changes when in auto mode
  initializeThemeListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleThemeChange = (e) => {
      if (this.profileData.preferences.theme.mode === 'auto') {
        this.applyThemePreferences();
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleThemeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleThemeChange);
      } else {
        mediaQuery.removeListener(handleThemeChange);
      }
    };
  }

  // Accessibility enhancement methods
  toggleHighContrast() {
    const current = this.profileData.preferences.accessibility.highContrast;
    this.updatePreferences('accessibility', { highContrast: !current });
    return !current;
  }

  toggleColorblindFriendly() {
    const current = this.profileData.preferences.accessibility.colorblindFriendly;
    this.updatePreferences('accessibility', { colorblindFriendly: !current });
    return !current;
  }

  toggleReducedMotion() {
    const current = this.profileData.preferences.accessibility.reducedMotion;
    this.updatePreferences('accessibility', { reducedMotion: !current });
    return !current;
  }

  toggleScreenReaderOptimization() {
    const current = this.profileData.preferences.accessibility.screenReaderOptimized;
    this.updatePreferences('accessibility', { screenReaderOptimized: !current });
    return !current;
  }

  // Keyboard navigation enhancements
  initializeKeyboardNavigation() {
    // Add keyboard navigation support
    document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
    
    // Add focus indicators
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.addEventListener('focusout', this.handleFocusOut.bind(this));
    
    // Add skip links for screen readers
    this.addSkipLinks();
  }

  handleKeyboardNavigation(event) {
    // ESC key to close modals/dropdowns
    if (event.key === 'Escape') {
      const openModals = document.querySelectorAll('.modal.show, .dropdown.show');
      openModals.forEach(modal => {
        modal.classList.remove('show');
      });
    }

    // Tab navigation improvements
    if (event.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }

    // Arrow key navigation for lists and grids
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      this.handleArrowNavigation(event);
    }
  }

  handleArrowNavigation(event) {
    const focusedElement = document.activeElement;
    const navigableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const currentIndex = Array.from(navigableElements).indexOf(focusedElement);
    
    if (currentIndex === -1) return;

    let nextIndex;
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : navigableElements.length - 1;
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = currentIndex < navigableElements.length - 1 ? currentIndex + 1 : 0;
        break;
    }

    if (nextIndex !== undefined) {
      event.preventDefault();
      navigableElements[nextIndex].focus();
    }
  }

  handleFocusIn(event) {
    // Add visual focus indicator
    event.target.classList.add('focused');
  }

  handleFocusOut(event) {
    // Remove visual focus indicator
    event.target.classList.remove('focused');
    
    // Remove keyboard navigation class after a delay
    setTimeout(() => {
      if (!document.querySelector(':focus')) {
        document.body.classList.remove('keyboard-navigation');
      }
    }, 100);
  }

  addSkipLinks() {
    // Add skip to main content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: var(--accent-primary);
      color: white;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 1000;
      transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);

    // Ensure main content has proper ID
    let mainContent = document.getElementById('main-content');
    if (!mainContent) {
      mainContent = document.querySelector('main, .main-content, .content');
      if (mainContent) {
        mainContent.id = 'main-content';
      }
    }
  }

  // Screen reader announcements
  announceToScreenReader(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Enhanced ARIA labels and descriptions
  enhanceAriaLabels() {
    // Add ARIA labels to buttons without text
    const iconButtons = document.querySelectorAll('button:not([aria-label]):empty, button:not([aria-label]) > i:only-child');
    iconButtons.forEach(button => {
      const icon = button.querySelector('i') || button;
      const iconClass = icon.className;
      
      // Map common icon classes to labels
      const iconLabels = {
        'bookmark': 'Bookmark',
        'heart': 'Like',
        'share': 'Share',
        'edit': 'Edit',
        'delete': 'Delete',
        'close': 'Close',
        'menu': 'Menu',
        'search': 'Search',
        'settings': 'Settings',
        'user': 'User profile',
        'home': 'Home',
        'back': 'Go back',
        'forward': 'Go forward',
        'play': 'Play',
        'pause': 'Pause',
        'stop': 'Stop'
      };

      for (const [iconName, label] of Object.entries(iconLabels)) {
        if (iconClass.includes(iconName)) {
          button.setAttribute('aria-label', label);
          break;
        }
      }
    });

    // Add descriptions to form inputs
    const inputs = document.querySelectorAll('input:not([aria-describedby]), textarea:not([aria-describedby])');
    inputs.forEach(input => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      const helpText = input.parentElement.querySelector('.help-text, .form-help');
      
      if (helpText) {
        const descId = `${input.id || 'input'}-desc`;
        helpText.id = descId;
        input.setAttribute('aria-describedby', descId);
      }
    });
  }

  // Get current accessibility settings
  getAccessibilitySettings() {
    return { ...this.profileData.preferences.accessibility };
  }

  // Reset accessibility settings to defaults
  resetAccessibilitySettings() {
    const defaultSettings = {
      highContrast: false,
      colorblindFriendly: false,
      keyboardNavigation: true,
      screenReaderOptimized: false,
      reducedMotion: false
    };
    this.updatePreferences('accessibility', defaultSettings);
    return defaultSettings;
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