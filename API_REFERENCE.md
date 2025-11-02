# Learning Platform - API Reference

## Overview

This document provides comprehensive API reference for all JavaScript modules and classes in the learning platform. Each module is designed to be modular, extensible, and easy to integrate.

## Table of Contents

1. [ProfileManager API](#profilemanager-api)
2. [EnhancedBookmarkManager API](#enhancedbookmarkmanager-api)
3. [EnhancedNoteManager API](#enhancednotemanager-api)
4. [ValidationSystem API](#validationsystem-api)
5. [FinalPerformanceOptimizer API](#finalperformanceoptimizer-api)
6. [StudyTools API](#studytools-api)
7. [AnalyticsSystem API](#analyticssystem-api)
8. [DataManagement API](#datamanagement-api)
9. [ErrorHandler API](#errorhandler-api)
10. [OfflineManager API](#offlinemanager-api)

## ProfileManager API

### Constructor
```javascript
const profileManager = new ProfileManager();
```

### Profile Operations

#### `getCurrentProfile()`
Returns the current user profile object.
```javascript
const profile = profileManager.getCurrentProfile();
// Returns: { name, email, avatar, preferences, studyStats, ... }
```

#### `updateProfile(updates)`
Updates the user profile with provided data.
```javascript
profileManager.updateProfile({
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'path/to/avatar.jpg'
});
```

#### `resetProfile()`
Resets the profile to default values.
```javascript
profileManager.resetProfile();
```

### Preference Management

#### `updatePreference(key, value)`
Updates a specific preference setting.
```javascript
profileManager.updatePreference('theme', 'dark');
profileManager.updatePreference('fontSize', 'large');
profileManager.updatePreference('notifications', true);
```

#### `getPreference(key)`
Retrieves a specific preference value.
```javascript
const theme = profileManager.getPreference('theme');
// Returns: 'dark' | 'light' | 'auto'
```

#### `resetPreferences()`
Resets all preferences to default values.
```javascript
profileManager.resetPreferences();
```

### Study Goals

#### `setStudyGoal(goalData)`
Creates a new study goal.
```javascript
profileManager.setStudyGoal({
  type: 'daily',        // 'daily' | 'weekly' | 'monthly'
  target: 120,          // minutes
  subject: 'Mathematics',
  deadline: '2024-12-31'
});
```

#### `updateStudyGoal(id, updates)`
Updates an existing study goal.
```javascript
profileManager.updateStudyGoal(goalId, {
  target: 150,
  progress: 75
});
```

#### `getStudyGoals()`
Returns all active study goals.
```javascript
const goals = profileManager.getStudyGoals();
// Returns: Array of goal objects
```

#### `deleteStudyGoal(id)`
Removes a study goal.
```javascript
profileManager.deleteStudyGoal(goalId);
```

### Statistics

#### `getStudyStats()`
Returns comprehensive study statistics.
```javascript
const stats = profileManager.getStudyStats();
// Returns: { totalHours, sessionsCompleted, streakData, ... }
```

#### `updateStudyStats(sessionData)`
Updates statistics with new session data.
```javascript
profileManager.updateStudyStats({
  duration: 30,         // minutes
  subject: 'Physics',
  accuracy: 85,         // percentage
  questionsAnswered: 20
});
```

## EnhancedBookmarkManager API

### Constructor
```javascript
const bookmarkManager = new EnhancedBookmarkManager();
```

### Bookmark Operations

#### `addBookmark(bookmarkData)`
Creates a new bookmark.
```javascript
const bookmark = bookmarkManager.addBookmark({
  title: 'Study Resource',
  url: 'https://example.com',
  description: 'Important study material',
  category: 'articles',
  tags: ['physics', 'important'],
  type: 'article'
});
```

#### `updateBookmark(id, updates)`
Updates an existing bookmark.
```javascript
bookmarkManager.updateBookmark(bookmarkId, {
  title: 'Updated Title',
  category: 'important',
  isFavorite: true
});
```

#### `deleteBookmark(id)`
Removes a bookmark.
```javascript
bookmarkManager.deleteBookmark(bookmarkId);
```

### Bulk Operations

#### `selectAllBookmarks()`
Selects all visible bookmarks for bulk operations.
```javascript
bookmarkManager.selectAllBookmarks();
```

#### `deselectAllBookmarks()`
Deselects all bookmarks.
```javascript
bookmarkManager.deselectAllBookmarks();
```

#### `bulkDeleteBookmarks()`
Deletes all selected bookmarks.
```javascript
bookmarkManager.bulkDeleteBookmarks();
```

#### `bulkCategorizeBookmarks(categoryId)`
Moves selected bookmarks to specified category.
```javascript
bookmarkManager.bulkCategorizeBookmarks('important');
```

#### `exportSelectedBookmarks()`
Exports selected bookmarks to JSON file.
```javascript
bookmarkManager.exportSelectedBookmarks();
```

### Category Management

#### `addCategory(categoryData)`
Creates a new bookmark category.
```javascript
const category = bookmarkManager.addCategory({
  name: 'Research Papers',
  color: '#3B82F6',
  icon: 'file-text',
  description: 'Academic research materials'
});
```

#### `updateCategory(id, updates)`
Updates an existing category.
```javascript
bookmarkManager.updateCategory(categoryId, {
  name: 'Updated Name',
  color: '#EF4444'
});
```

#### `deleteCategory(id)`
Removes a category (moves bookmarks to 'general').
```javascript
bookmarkManager.deleteCategory(categoryId);
```

### Search and Filter

#### `searchBookmarks(query, filters)`
Searches bookmarks with optional filters.
```javascript
const results = bookmarkManager.searchBookmarks('physics', {
  category: 'articles',
  isFavorite: true,
  isUnread: false
});
```

### Statistics

#### `getStatistics()`
Returns comprehensive bookmark statistics.
```javascript
const stats = bookmarkManager.getStatistics();
// Returns: { total, byCategory, byType, favorites, unread, ... }
```

## EnhancedNoteManager API

### Constructor
```javascript
const noteManager = new EnhancedNoteManager();
```

### Note Operations

#### `createNote(noteData)`
Creates a new note with rich content support.
```javascript
const note = noteManager.createNote({
  title: 'Physics Notes',
  content: 'Plain text content',
  richContent: '<h1>Rich HTML content</h1>',
  subject: 'Physics',
  tags: ['mechanics', 'formulas'],
  color: 'blue'
});
```

#### `updateNote(id, updates)`
Updates an existing note.
```javascript
noteManager.updateNote(noteId, {
  title: 'Updated Title',
  richContent: '<h2>Updated content</h2>',
  tags: ['updated', 'physics']
});
```

#### `deleteNote(id)`
Removes a note and its attachments.
```javascript
noteManager.deleteNote(noteId);
```

### Rich Text Editor

#### `setupRichTextEditor(element)`
Initializes rich text editing for an element.
```javascript
const editor = document.querySelector('.note-content');
noteManager.setupRichTextEditor(editor);
```

#### `handleFormatting(command, value)`
Applies formatting to selected text.
```javascript
// Bold text
noteManager.handleFormatting('bold');

// Set font color
noteManager.handleFormatting('foreColor', '#FF0000');

// Create heading
noteManager.handleFormatting('formatBlock', 'h1');
```

### File Attachments

#### `handleFileUpload(files)`
Processes file uploads for attachments.
```javascript
// Handle file input change
const files = fileInput.files;
noteManager.handleFileUpload(files);
```

#### `removeAttachment(attachmentId)`
Removes an attachment from a note.
```javascript
noteManager.removeAttachment(attachmentId);
```

#### `downloadAttachment(attachmentId)`
Downloads an attachment file.
```javascript
noteManager.downloadAttachment(attachmentId);
```

### Search

#### `searchNotes(query, options)`
Searches notes with filtering options.
```javascript
const results = noteManager.searchNotes('physics', {
  subject: 'Physics',
  isFavorite: true,
  hasAttachments: true
});
```

### Import/Export

#### `exportNotes(noteIds)`
Exports notes with attachments.
```javascript
// Export all notes
const exportData = noteManager.exportNotes();

// Export specific notes
const exportData = noteManager.exportNotes([noteId1, noteId2]);
```

#### `importNotes(data)`
Imports notes from exported data.
```javascript
const importedCount = noteManager.importNotes(importData);
console.log(`Imported ${importedCount} notes`);
```

## ValidationSystem API

### Constructor
```javascript
const validationSystem = new ValidationSystem();
```

### Field Validation

#### `validateField(field)`
Validates a single form field.
```javascript
const isValid = validationSystem.validateField(inputElement);
```

#### `validateForm(form)`
Validates an entire form.
```javascript
const isValid = validationSystem.validateForm(formElement);
```

### Data Validation

#### `validateData(data, rules)`
Validates data object against rules.
```javascript
const result = validationSystem.validateData(userData, {
  email: {
    validators: [
      { validator: 'required' },
      { validator: 'email' }
    ],
    sanitizers: ['trim', 'lowercase']
  },
  age: {
    validators: [
      { validator: 'required' },
      { validator: 'integer' },
      { validator: 'range', params: [13, 120] }
    ]
  }
});

// Result: { isValid: boolean, errors: {}, sanitized: {} }
```

### Security Functions

#### `preventXSS(input)`
Sanitizes input to prevent XSS attacks.
```javascript
const safeContent = validationSystem.preventXSS(userInput);
```

#### `preventSQLInjection(input)`
Removes SQL injection patterns.
```javascript
const safeQuery = validationSystem.preventSQLInjection(userInput);
```

#### `validateAndSanitizeUserInput(input, type)`
General input sanitization.
```javascript
const sanitized = validationSystem.validateAndSanitizeUserInput(
  userInput, 
  'general' // 'general' | 'filename' | 'numeric' | 'text'
);
```

### Custom Validators

#### `addValidator(name, validatorFn, errorMessage)`
Adds a custom validator.
```javascript
validationSystem.addValidator('customRule', (value) => {
  return value.includes('required-text');
}, 'Must contain required text');
```

#### `addSanitizer(name, sanitizerFn)`
Adds a custom sanitizer.
```javascript
validationSystem.addSanitizer('customClean', (value) => {
  return value.replace(/[^a-zA-Z0-9]/g, '');
});
```

## FinalPerformanceOptimizer API

### Constructor
```javascript
const optimizer = new FinalPerformanceOptimizer();
```

### Optimization Control

#### `runOptimizations()`
Executes all performance optimizations.
```javascript
optimizer.runOptimizations();
```

### Performance Monitoring

#### `getPerformanceReport()`
Returns comprehensive performance analysis.
```javascript
const report = optimizer.getPerformanceReport();
// Returns: { timestamp, metrics, recommendations, coreWebVitals, ... }
```

#### `recordMetric(name, value)`
Records a custom performance metric.
```javascript
optimizer.recordMetric('customOperation', {
  duration: 150,
  success: true
});
```

#### `exportPerformanceData()`
Exports performance data to JSON file.
```javascript
optimizer.exportPerformanceData();
```

### Core Web Vitals

The optimizer automatically tracks:
- **LCP (Largest Contentful Paint)**: Loading performance
- **FID (First Input Delay)**: Interactivity
- **CLS (Cumulative Layout Shift)**: Visual stability

Access via performance report:
```javascript
const report = optimizer.getPerformanceReport();
console.log('LCP:', report.coreWebVitals.LCP);
console.log('FID:', report.coreWebVitals.FID);
console.log('CLS:', report.coreWebVitals.CLS);
```

## StudyTools API

### PomodoroTimer

#### Constructor
```javascript
const timer = new PomodoroTimer({
  workDuration: 25,      // minutes
  breakDuration: 5,      // minutes
  longBreakDuration: 15, // minutes
  sessionsUntilLongBreak: 4
});
```

#### Methods
```javascript
timer.start();           // Start timer
timer.pause();           // Pause timer
timer.resume();          // Resume timer
timer.reset();           // Reset timer
timer.skip();            // Skip current session

// Get current state
const state = timer.getState();
// Returns: { isRunning, currentSession, timeRemaining, ... }
```

### StudyStreakTracker

#### Constructor
```javascript
const streakTracker = new StudyStreakTracker();
```

#### Methods
```javascript
// Record study session
streakTracker.recordStudySession(30); // 30 minutes

// Get current streak
const streak = streakTracker.getCurrentStreak();
// Returns: { days, longestStreak, lastStudyDate, ... }

// Check if streak is maintained
const isMaintained = streakTracker.isStreakMaintained();
```

### GoalManager

#### Constructor
```javascript
const goalManager = new GoalManager();
```

#### Methods
```javascript
// Create goal
const goal = goalManager.createGoal({
  type: 'daily',        // 'daily' | 'weekly' | 'monthly'
  target: 120,          // minutes
  subject: 'Physics',
  deadline: '2024-12-31'
});

// Update progress
goalManager.updateProgress(goalId, 30); // 30 minutes progress

// Get goals
const goals = goalManager.getGoals();
const activeGoals = goalManager.getActiveGoals();
const completedGoals = goalManager.getCompletedGoals();
```

### SpacedRepetitionEngine

#### Constructor
```javascript
const srs = new SpacedRepetitionEngine();
```

#### Methods
```javascript
// Schedule review
srs.scheduleReview(topicId, difficulty, performance);

// Get due reviews
const dueReviews = srs.getDueReviews();

// Update performance
srs.updatePerformance(topicId, {
  correct: true,
  responseTime: 5000, // milliseconds
  confidence: 4       // 1-5 scale
});
```

## AnalyticsSystem API

### PerformanceAnalyzer

#### Constructor
```javascript
const analyzer = new PerformanceAnalyzer();
```

#### Methods
```javascript
// Calculate metrics
const metrics = analyzer.calculateMetrics(sessionData);

// Analyze trends
const trends = analyzer.analyzeTrends('weekly');

// Identify weaknesses
const weaknesses = analyzer.identifyWeaknesses();

// Generate insights
const insights = analyzer.generateInsights(userData);
```

### ReportGenerator

#### Constructor
```javascript
const reportGenerator = new ReportGenerator();
```

#### Methods
```javascript
// Generate reports
const weeklyReport = reportGenerator.generateWeeklyReport();
const monthlyReport = reportGenerator.generateMonthlyReport();

// Custom report
const customReport = reportGenerator.generateCustomReport({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  subjects: ['Math', 'Physics'],
  includeCharts: true
});

// Export report
reportGenerator.exportReport(report, 'pdf'); // 'pdf' | 'json' | 'csv'
```

## DataManagement API

### DataExporter

#### Constructor
```javascript
const dataExporter = new DataExporter();
```

#### Methods
```javascript
// Export all data
const allData = dataExporter.exportAllData();

// Export specific data
const profileData = dataExporter.exportProfileData();
const studyData = dataExporter.exportStudyData();
const notesData = dataExporter.exportNotesData();

// Export to formats
dataExporter.exportToJSON(data);
dataExporter.exportToCSV(data);
dataExporter.exportToPDF(data);
```

### BackupManager

#### Constructor
```javascript
const backupManager = new BackupManager();
```

#### Methods
```javascript
// Create backup
const backupId = backupManager.createBackup();

// Schedule automatic backups
backupManager.scheduleBackups(24); // hours

// List backups
const backups = backupManager.listBackups();

// Restore backup
backupManager.restoreFromBackup(backupId);

// Verify backup
const isValid = backupManager.verifyBackup(backupId);
```

### ImportHandler

#### Constructor
```javascript
const importHandler = new ImportHandler();
```

#### Methods
```javascript
// Import data
const result = importHandler.importData(fileData, {
  validateStructure: true,
  resolveConflicts: 'merge', // 'merge' | 'replace' | 'skip'
  sanitizeInput: true
});

// Progress tracking
importHandler.onProgress((progress) => {
  console.log(`Import progress: ${progress}%`);
});

// Error handling
importHandler.onError((error) => {
  console.error('Import error:', error);
});
```

## ErrorHandler API

### Constructor
```javascript
const errorHandler = new ErrorHandler();
```

### Methods
```javascript
// Handle error
errorHandler.handleError(error, context);

// Log error
errorHandler.logError(error, severity); // 'low' | 'medium' | 'high' | 'critical'

// Get error logs
const logs = errorHandler.getErrorLogs();

// Clear logs
errorHandler.clearLogs();

// Set error recovery callback
errorHandler.setRecoveryCallback((error) => {
  // Custom recovery logic
});
```

## OfflineManager API

### Constructor
```javascript
const offlineManager = new OfflineManager();
```

### Methods
```javascript
// Check online status
const isOnline = offlineManager.isOnline();

// Queue offline action
offlineManager.queueAction('saveNote', noteData);

// Sync pending actions
offlineManager.syncPendingActions();

// Get queued actions
const queue = offlineManager.getActionQueue();

// Clear queue
offlineManager.clearQueue();

// Event listeners
offlineManager.onOnline(() => {
  console.log('Connection restored');
});

offlineManager.onOffline(() => {
  console.log('Connection lost');
});
```

## Event System

### Global Events
The platform uses a global event system for cross-component communication:

```javascript
// Listen for events
window.addEventListener('profileUpdated', (event) => {
  const profile = event.detail.profile;
  // Handle profile update
});

window.addEventListener('themeChanged', (event) => {
  const theme = event.detail.theme;
  // Handle theme change
});

// Dispatch events
window.dispatchEvent(new CustomEvent('dataExported', {
  detail: { type: 'notes', count: 10 }
}));
```

### Common Events
- `profileUpdated`: Profile data changed
- `themeChanged`: Theme preference updated
- `goalCompleted`: Study goal achieved
- `streakUpdated`: Study streak changed
- `dataExported`: Data export completed
- `dataImported`: Data import completed
- `errorOccurred`: Error handled by system
- `performanceOptimized`: Optimization completed

## Error Handling

### Standard Error Format
```javascript
{
  code: 'ERROR_CODE',
  message: 'Human readable message',
  details: { /* Additional error details */ },
  timestamp: '2024-01-01T00:00:00.000Z',
  severity: 'medium', // 'low' | 'medium' | 'high' | 'critical'
  context: { /* Context where error occurred */ }
}
```

### Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `STORAGE_ERROR`: localStorage operation failed
- `NETWORK_ERROR`: Network request failed
- `IMPORT_ERROR`: Data import failed
- `EXPORT_ERROR`: Data export failed
- `PERFORMANCE_ERROR`: Performance optimization failed
- `SECURITY_ERROR`: Security validation failed

## Best Practices

### API Usage Guidelines

1. **Error Handling**: Always wrap API calls in try-catch blocks
```javascript
try {
  const result = profileManager.updateProfile(data);
} catch (error) {
  errorHandler.handleError(error, 'profile-update');
}
```

2. **Event Listeners**: Clean up event listeners when not needed
```javascript
const handleProfileUpdate = (event) => { /* handler */ };
window.addEventListener('profileUpdated', handleProfileUpdate);
// Later...
window.removeEventListener('profileUpdated', handleProfileUpdate);
```

3. **Performance**: Use performance monitoring for critical operations
```javascript
const startTime = performance.now();
// Perform operation
const duration = performance.now() - startTime;
finalPerformanceOptimizer.recordMetric('operationTime', duration);
```

4. **Validation**: Always validate user input
```javascript
const result = validationSystem.validateData(userData, validationRules);
if (!result.isValid) {
  // Handle validation errors
  console.error('Validation errors:', result.errors);
  return;
}
// Use sanitized data
const sanitizedData = result.sanitized;
```

### Integration Examples

#### Complete User Registration Flow
```javascript
// 1. Validate input
const validationResult = validationSystem.validateData(formData, {
  email: { validators: [{ validator: 'required' }, { validator: 'email' }] },
  password: { validators: [{ validator: 'required' }, { validator: 'minLength', params: [8] }] }
});

if (!validationResult.isValid) {
  // Show validation errors
  return;
}

// 2. Create profile
try {
  profileManager.updateProfile(validationResult.sanitized);
  
  // 3. Set initial preferences
  profileManager.updatePreference('theme', 'dark');
  profileManager.updatePreference('notifications', true);
  
  // 4. Create initial goal
  profileManager.setStudyGoal({
    type: 'daily',
    target: 60,
    subject: 'General'
  });
  
  // 5. Create backup
  backupManager.createBackup();
  
} catch (error) {
  errorHandler.handleError(error, 'user-registration');
}
```

This API reference provides comprehensive documentation for integrating with all platform features. Each API is designed to be intuitive, well-documented, and robust for production use.