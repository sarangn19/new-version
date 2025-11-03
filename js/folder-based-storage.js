/**
 * Folder-Based Storage Manager
 * Organizes notes, MCQs, and flashcards into proper folder structures
 */
class FolderBasedStorage {
  constructor() {
    this.folders = {
      notes: 'notes',
      mcqs: 'mcqs', 
      flashcards: 'flashcards',
      bookmarks: 'bookmarks'
    };
    this.init();
  }

  init() {
    this.createFolderStructure();
    this.migrateExistingData();
  }

  /**
   * Create folder structure in localStorage
   */
  createFolderStructure() {
    Object.values(this.folders).forEach(folder => {
      const key = `folder_${folder}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]));
      }
    });
  }

  /**
   * Migrate existing data to folder structure
   */
  migrateExistingData() {
    try {
      // Migrate notes
      const existingNotes = JSON.parse(localStorage.getItem('userNotes') || '[]');
      if (existingNotes.length > 0) {
        this.saveToFolder('notes', existingNotes);
        console.log(`📁 Migrated ${existingNotes.length} notes to notes folder`);
      }

      // Migrate bookmarks (contains flashcards and MCQs)
      const existingBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      if (existingBookmarks.length > 0) {
        const flashcards = existingBookmarks.filter(item => 
          item.metadata?.type === 'flashcard' || 
          item.front || 
          (item.title && item.title.includes('Flashcard'))
        );
        
        const mcqs = existingBookmarks.filter(item => 
          item.metadata?.type === 'mcq' || 
          item.question || 
          (item.title && item.title.includes('MCQ'))
        );
        
        const regularBookmarks = existingBookmarks.filter(item => 
          !flashcards.includes(item) && !mcqs.includes(item)
        );

        if (flashcards.length > 0) {
          this.saveToFolder('flashcards', flashcards);
          console.log(`📁 Migrated ${flashcards.length} flashcards to flashcards folder`);
        }

        if (mcqs.length > 0) {
          this.saveToFolder('mcqs', mcqs);
          console.log(`📁 Migrated ${mcqs.length} MCQs to mcqs folder`);
        }

        if (regularBookmarks.length > 0) {
          this.saveToFolder('bookmarks', regularBookmarks);
          console.log(`📁 Migrated ${regularBookmarks.length} bookmarks to bookmarks folder`);
        }
      }

      // Migrate standalone flashcards and MCQs if they exist
      const standaloneFlashcards = JSON.parse(localStorage.getItem('flashcards') || '[]');
      if (standaloneFlashcards.length > 0) {
        this.saveToFolder('flashcards', standaloneFlashcards, true);
        console.log(`📁 Migrated ${standaloneFlashcards.length} standalone flashcards`);
      }

      const standaloneMCQs = JSON.parse(localStorage.getItem('mcqs') || '[]');
      if (standaloneMCQs.length > 0) {
        this.saveToFolder('mcqs', standaloneMCQs, true);
        console.log(`📁 Migrated ${standaloneMCQs.length} standalone MCQs`);
      }

    } catch (error) {
      console.error('Migration error:', error);
    }
  }

  /**
   * Save data to specific folder
   */
  saveToFolder(folderType, data, append = false) {
    const key = `folder_${folderType}`;
    let folderData = [];

    if (append) {
      folderData = JSON.parse(localStorage.getItem(key) || '[]');
    }

    if (Array.isArray(data)) {
      // Merge arrays, avoiding duplicates
      data.forEach(item => {
        const exists = folderData.find(existing => existing.id === item.id);
        if (!exists) {
          folderData.unshift(item);
        }
      });
    } else {
      // Single item
      const exists = folderData.find(existing => existing.id === data.id);
      if (!exists) {
        folderData.unshift(data);
      } else {
        // Update existing item
        const index = folderData.findIndex(existing => existing.id === data.id);
        folderData[index] = { ...folderData[index], ...data };
      }
    }

    localStorage.setItem(key, JSON.stringify(folderData));
    
    // Also maintain backward compatibility
    this.updateLegacyStorage(folderType, folderData);
  }

  /**
   * Update legacy storage keys for backward compatibility
   */
  updateLegacyStorage(folderType, data) {
    switch (folderType) {
      case 'notes':
        localStorage.setItem('userNotes', JSON.stringify(data));
        break;
      case 'flashcards':
        // Update bookmarks with flashcard metadata
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        const nonFlashcards = bookmarks.filter(item => 
          !(item.metadata?.type === 'flashcard' || item.front)
        );
        const flashcardBookmarks = data.map(item => ({
          ...item,
          metadata: { ...item.metadata, type: 'flashcard' }
        }));
        localStorage.setItem('bookmarks', JSON.stringify([...flashcardBookmarks, ...nonFlashcards]));
        break;
      case 'mcqs':
        // Update bookmarks with MCQ metadata
        const allBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        const nonMCQs = allBookmarks.filter(item => 
          !(item.metadata?.type === 'mcq' || item.question)
        );
        const mcqBookmarks = data.map(item => ({
          ...item,
          metadata: { ...item.metadata, type: 'mcq' }
        }));
        localStorage.setItem('bookmarks', JSON.stringify([...mcqBookmarks, ...nonMCQs]));
        break;
    }
  }

  /**
   * Get data from specific folder
   */
  getFromFolder(folderType) {
    const key = `folder_${folderType}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  /**
   * Save note to notes folder
   */
  saveNote(noteData) {
    const note = {
      id: noteData.id || Date.now(),
      title: noteData.title || 'Untitled Note',
      content: noteData.content || '',
      richContent: noteData.richContent || '',
      subject: noteData.subject || 'General',
      tags: noteData.tags || [],
      createdAt: noteData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      color: noteData.color || 'default',
      folder: 'notes',
      ...noteData
    };

    this.saveToFolder('notes', note);
    console.log('📝 Note saved to notes folder:', note.title);
    return note;
  }

  /**
   * Save flashcard to flashcards folder
   */
  saveFlashcard(flashcardData) {
    const flashcard = {
      id: flashcardData.id || Date.now(),
      title: flashcardData.title || 'Untitled Flashcard',
      front: flashcardData.front || flashcardData.question || '',
      back: flashcardData.back || flashcardData.answer || '',
      category: flashcardData.category || flashcardData.subject || 'General',
      difficulty: flashcardData.difficulty || 'medium',
      tags: flashcardData.tags || [],
      createdAt: flashcardData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      folder: 'flashcards',
      metadata: { type: 'flashcard', ...flashcardData.metadata },
      ...flashcardData
    };

    this.saveToFolder('flashcards', flashcard);
    console.log('🃏 Flashcard saved to flashcards folder:', flashcard.title);
    return flashcard;
  }

  /**
   * Save MCQ to mcqs folder
   */
  saveMCQ(mcqData) {
    const mcq = {
      id: mcqData.id || Date.now(),
      title: mcqData.title || 'Untitled MCQ',
      question: mcqData.question || '',
      options: mcqData.options || [],
      correctAnswer: mcqData.correctAnswer || '',
      explanation: mcqData.explanation || mcqData.content || '',
      category: mcqData.category || mcqData.subject || 'General',
      difficulty: mcqData.difficulty || 'medium',
      tags: mcqData.tags || [],
      createdAt: mcqData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      folder: 'mcqs',
      metadata: { type: 'mcq', ...mcqData.metadata },
      ...mcqData
    };

    this.saveToFolder('mcqs', mcq);
    console.log('❓ MCQ saved to mcqs folder:', mcq.title);
    return mcq;
  }

  /**
   * Delete item from folder
   */
  deleteFromFolder(folderType, itemId) {
    const key = `folder_${folderType}`;
    let folderData = JSON.parse(localStorage.getItem(key) || '[]');
    folderData = folderData.filter(item => item.id !== itemId);
    localStorage.setItem(key, JSON.stringify(folderData));
    
    // Update legacy storage
    this.updateLegacyStorage(folderType, folderData);
    
    console.log(`🗑️ Deleted item ${itemId} from ${folderType} folder`);
  }

  /**
   * Search within specific folder
   */
  searchInFolder(folderType, query) {
    const data = this.getFromFolder(folderType);
    const searchTerm = query.toLowerCase();
    
    return data.filter(item => {
      return (
        (item.title && item.title.toLowerCase().includes(searchTerm)) ||
        (item.content && item.content.toLowerCase().includes(searchTerm)) ||
        (item.question && item.question.toLowerCase().includes(searchTerm)) ||
        (item.front && item.front.toLowerCase().includes(searchTerm)) ||
        (item.back && item.back.toLowerCase().includes(searchTerm)) ||
        (item.explanation && item.explanation.toLowerCase().includes(searchTerm)) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    });
  }

  /**
   * Get folder statistics
   */
  getFolderStats() {
    return {
      notes: this.getFromFolder('notes').length,
      flashcards: this.getFromFolder('flashcards').length,
      mcqs: this.getFromFolder('mcqs').length,
      bookmarks: this.getFromFolder('bookmarks').length,
      total: Object.values(this.folders).reduce((sum, folder) => 
        sum + this.getFromFolder(folder).length, 0
      )
    };
  }

  /**
   * Export folder data
   */
  exportFolder(folderType) {
    const data = this.getFromFolder(folderType);
    return {
      folder: folderType,
      exportDate: new Date().toISOString(),
      itemCount: data.length,
      data: data
    };
  }

  /**
   * Import data to folder
   */
  importToFolder(folderType, importData) {
    if (!importData.data || !Array.isArray(importData.data)) {
      throw new Error('Invalid import data format');
    }

    const existingData = this.getFromFolder(folderType);
    const newItems = importData.data.filter(item => 
      !existingData.find(existing => existing.id === item.id)
    );

    if (newItems.length > 0) {
      this.saveToFolder(folderType, newItems, true);
      console.log(`📥 Imported ${newItems.length} items to ${folderType} folder`);
    }

    return newItems.length;
  }

  /**
   * Clean up empty folders and duplicates
   */
  cleanup() {
    Object.values(this.folders).forEach(folder => {
      const data = this.getFromFolder(folder);
      
      // Remove duplicates based on ID
      const uniqueData = data.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      );

      if (uniqueData.length !== data.length) {
        this.saveToFolder(folder, uniqueData);
        console.log(`🧹 Cleaned up ${data.length - uniqueData.length} duplicates from ${folder} folder`);
      }
    });
  }
}

// Initialize folder-based storage
window.folderStorage = new FolderBasedStorage();

// Enhanced save functions that use folder structure
window.saveToNotesFolder = function(noteData) {
  return window.folderStorage.saveNote(noteData);
};

window.saveToFlashcardsFolder = function(flashcardData) {
  return window.folderStorage.saveFlashcard(flashcardData);
};

window.saveToMCQsFolder = function(mcqData) {
  return window.folderStorage.saveMCQ(mcqData);
};

// Override existing save functions to use folder structure
const originalSaveAIResponse = window.saveAIResponse;
window.saveAIResponse = async function(content, type, originalQuestion) {
  const timestamp = new Date().toISOString();
  const selectedMode = window.selectedMode || 'general';
  
  try {
    let savedData;
    
    switch (type) {
      case 'note':
        savedData = {
          id: Date.now(),
          title: originalQuestion.length > 50 ? originalQuestion.substring(0, 50) + '...' : originalQuestion,
          content: content,
          richContent: content.replace(/\n/g, '<br>'),
          subject: selectedMode === 'news' ? 'Current Affairs' : 
                  selectedMode === 'mcq' ? 'MCQ Analysis' : 
                  selectedMode === 'essay' ? 'Essay Writing' : 'General',
          tags: ['ai-generated', selectedMode],
          createdAt: timestamp,
          source: 'AI Generated',
          mode: selectedMode
        };
        
        savedData = window.folderStorage.saveNote(savedData);
        break;
        
      case 'flashcard':
        savedData = {
          id: Date.now(),
          title: originalQuestion.length > 50 ? originalQuestion.substring(0, 50) + '...' : originalQuestion,
          front: originalQuestion,
          back: content,
          category: selectedMode === 'news' ? 'Current Affairs' : 
                   selectedMode === 'mcq' ? 'MCQ Analysis' : 'General',
          tags: ['ai-generated', 'flashcard', selectedMode],
          difficulty: 'medium',
          createdAt: timestamp,
          source: 'AI Generated',
          mode: selectedMode
        };
        
        savedData = window.folderStorage.saveFlashcard(savedData);
        break;
        
      case 'mcq':
        savedData = {
          id: Date.now(),
          title: `MCQ: ${originalQuestion.length > 40 ? originalQuestion.substring(0, 40) + '...' : originalQuestion}`,
          question: originalQuestion,
          explanation: content,
          category: selectedMode === 'news' ? 'Current Affairs' : 
                   selectedMode === 'essay' ? 'Essay Writing' : 'General',
          tags: ['ai-generated', 'mcq', selectedMode],
          createdAt: timestamp,
          source: 'AI Generated',
          mode: selectedMode
        };
        
        savedData = window.folderStorage.saveMCQ(savedData);
        break;
    }

    console.log(`✅ Saved AI response to ${type} folder:`, savedData);
    
    // Trigger count update event
    window.dispatchEvent(new CustomEvent('contentSaved', {
      detail: { type, data: savedData }
    }));
    
    return savedData;
    
  } catch (error) {
    console.error(`❌ Error saving AI response to ${type}:`, error);
    // Fallback to original function if available
    if (originalSaveAIResponse) {
      return originalSaveAIResponse(content, type, originalQuestion);
    }
    throw error;
  }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FolderBasedStorage;
}