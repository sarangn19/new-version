/**
 * Response Manager
 * Manages AI response saving, categorization, search, and integration with learn page sections
 */
class ResponseManager {
    constructor() {
        this.responses = this.loadResponses();
        this.categories = ['notes', 'flashcards', 'mcqs', 'general'];
        this.storageKey = 'ai_responses';
        this.init();
    }

    /**
     * Initialize the Response Manager
     */
    init() {
        this.setupEventListeners();
        console.log('Response Manager initialized');
    }

    /**
     * Load saved responses from localStorage
     * @returns {Array} Array of saved responses
     */
    loadResponses() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading responses:', error);
            return [];
        }
    }

    /**
     * Save responses to localStorage
     */
    saveResponses() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.responses));
        } catch (error) {
            console.error('Error saving responses:', error);
        }
    }

    /**
     * Save AI response with metadata and categorization
     * @param {Object} response - AI response object
     * @param {Object} metadata - Additional metadata
     * @returns {Object} Saved response object
     */
    saveResponse(response, metadata = {}) {
        try {
            const savedResponse = {
                id: this.generateResponseId(),
                conversationId: response.conversationId || null,
                content: response.content || '',
                mode: response.mode || 'general',
                category: metadata.category || this.inferCategory(response),
                subject: metadata.subject || this.inferSubject(response),
                tags: metadata.tags || this.generateTags(response),
                title: metadata.title || this.generateTitle(response),
                savedAt: new Date().toISOString(),
                lastAccessed: new Date().toISOString(),
                userRating: metadata.userRating || null,
                usefulness: metadata.usefulness || null,
                savedToSection: metadata.savedToSection || null,
                originalResponse: response,
                metadata: {
                    processingTime: response.processingTime || 0,
                    usage: response.usage || {},
                    context: response.context || {},
                    ...metadata
                }
            };

            this.responses.unshift(savedResponse);
            this.saveResponses();

            console.log('Response saved:', savedResponse.id);
            return savedResponse;
        } catch (error) {
            console.error('Error saving response:', error);
            throw new Error('Failed to save response');
        }
    }

    /**
     * Categorize response based on content and mode
     * @param {Object} response - Response object
     * @param {string} category - Category to assign
     * @returns {Object} Updated response
     */
    categorizeResponse(response, category) {
        if (!this.categories.includes(category)) {
            throw new Error(`Invalid category: ${category}`);
        }

        const responseIndex = this.responses.findIndex(r => r.id === response.id);
        if (responseIndex === -1) {
            throw new Error('Response not found');
        }

        this.responses[responseIndex].category = category;
        this.responses[responseIndex].lastAccessed = new Date().toISOString();
        this.saveResponses();

        return this.responses[responseIndex];
    }

    /**
     * Search saved responses with filters
     * @param {string} query - Search query
     * @param {Object} filters - Search filters
     * @returns {Array} Filtered responses
     */
    searchSavedResponses(query = '', filters = {}) {
        let results = [...this.responses];

        // Text search
        if (query.trim()) {
            const searchTerm = query.toLowerCase();
            results = results.filter(response =>
                response.title.toLowerCase().includes(searchTerm) ||
                response.content.toLowerCase().includes(searchTerm) ||
                response.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
                response.subject.toLowerCase().includes(searchTerm)
            );
        }

        // Apply filters
        if (filters.category) {
            results = results.filter(r => r.category === filters.category);
        }

        if (filters.subject) {
            results = results.filter(r => r.subject === filters.subject);
        }

        if (filters.mode) {
            results = results.filter(r => r.mode === filters.mode);
        }

        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            results = results.filter(r => new Date(r.savedAt) >= fromDate);
        }

        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            results = results.filter(r => new Date(r.savedAt) <= toDate);
        }

        if (filters.tags && filters.tags.length > 0) {
            results = results.filter(r => 
                filters.tags.some(tag => r.tags.includes(tag))
            );
        }

        if (filters.minRating) {
            results = results.filter(r => r.userRating >= filters.minRating);
        }

        // Sort results
        const sortBy = filters.sortBy || 'savedAt';
        const sortOrder = filters.sortOrder || 'desc';

        results.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];

            if (sortBy === 'savedAt' || sortBy === 'lastAccessed') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            }

            if (sortOrder === 'desc') {
                return bVal > aVal ? 1 : -1;
            } else {
                return aVal > bVal ? 1 : -1;
            }
        });

        return results;
    }

    /**
     * Export responses in various formats
     * @param {Array} responseIds - IDs of responses to export (null for all)
     * @param {string} format - Export format ('json', 'csv', 'markdown')
     * @returns {string} Exported data
     */
    exportResponses(responseIds = null, format = 'json') {
        const responsesToExport = responseIds ? 
            this.responses.filter(r => responseIds.includes(r.id)) : 
            this.responses;

        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify({
                    exportDate: new Date().toISOString(),
                    totalResponses: responsesToExport.length,
                    responses: responsesToExport
                }, null, 2);

            case 'csv':
                return this.exportToCSV(responsesToExport);

            case 'markdown':
                return this.exportToMarkdown(responsesToExport);

            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Add response to notes section
     * @param {Object} response - Response object
     * @param {string} noteId - Optional note ID to append to
     * @returns {Object} Created/updated note
     */
    addToNotesSection(response, noteId = null) {
        try {
            const noteData = {
                title: response.title || this.generateTitle(response),
                content: response.content,
                richContent: this.formatResponseForNotes(response),
                subject: response.subject || 'AI Assistant',
                tags: [...response.tags, 'ai-generated'],
                color: 'blue'
            };

            let result;
            if (noteId && window.enhancedNoteManager) {
                // Append to existing note
                const existingNote = window.enhancedNoteManager.notes.find(n => n.id === parseInt(noteId));
                if (existingNote) {
                    const updatedContent = existingNote.richContent + '<hr>' + noteData.richContent;
                    result = window.enhancedNoteManager.updateNote(parseInt(noteId), {
                        richContent: updatedContent,
                        content: existingNote.content + '\n\n---\n\n' + noteData.content,
                        updatedAt: new Date().toISOString()
                    });
                } else {
                    result = window.enhancedNoteManager.createNote(noteData);
                }
            } else if (window.enhancedNoteManager) {
                // Create new note
                result = window.enhancedNoteManager.createNote(noteData);
            } else {
                throw new Error('Enhanced Note Manager not available');
            }

            // Update response with saved location
            this.updateResponseSavedLocation(response.id, 'notes', result.id);
            
            return result;
        } catch (error) {
            console.error('Error adding to notes section:', error);
            throw error;
        }
    }

    /**
     * Add response to flashcards section
     * @param {Object} response - Response object
     * @param {string} deckId - Optional deck ID
     * @returns {Object} Created flashcard data
     */
    addToFlashcards(response, deckId = null) {
        try {
            const flashcardData = this.formatResponseForFlashcards(response);
            
            // Store in flashcards storage
            const flashcards = JSON.parse(localStorage.getItem('userFlashcards') || '[]');
            const newFlashcard = {
                id: Date.now(),
                deckId: deckId || 'ai-generated',
                front: flashcardData.front,
                back: flashcardData.back,
                subject: response.subject || 'AI Assistant',
                tags: [...response.tags, 'ai-generated'],
                createdAt: new Date().toISOString(),
                difficulty: 'medium',
                lastReviewed: null,
                reviewCount: 0,
                correctCount: 0
            };

            flashcards.unshift(newFlashcard);
            localStorage.setItem('userFlashcards', JSON.stringify(flashcards));

            // Update response with saved location
            this.updateResponseSavedLocation(response.id, 'flashcards', newFlashcard.id);

            return newFlashcard;
        } catch (error) {
            console.error('Error adding to flashcards section:', error);
            throw error;
        }
    }

    /**
     * Create study material from response
     * @param {Object} response - Response object
     * @param {string} type - Type of study material ('note', 'flashcard', 'mcq')
     * @returns {Object} Created study material
     */
    createStudyMaterial(response, type) {
        switch (type) {
            case 'note':
                return this.addToNotesSection(response);
            case 'flashcard':
                return this.addToFlashcards(response);
            case 'mcq':
                return this.createMCQFromResponse(response);
            default:
                throw new Error(`Unsupported study material type: ${type}`);
        }
    }

    /**
     * Update response with saved location information
     * @param {string} responseId - Response ID
     * @param {string} section - Section where saved
     * @param {string} itemId - ID of created item
     */
    updateResponseSavedLocation(responseId, section, itemId) {
        const responseIndex = this.responses.findIndex(r => r.id === responseId);
        if (responseIndex !== -1) {
            this.responses[responseIndex].savedToSection = section;
            this.responses[responseIndex].savedItemId = itemId;
            this.responses[responseIndex].lastAccessed = new Date().toISOString();
            this.saveResponses();
        }
    }

    /**
     * Delete response
     * @param {string} responseId - Response ID to delete
     * @returns {boolean} Success status
     */
    deleteResponse(responseId) {
        try {
            const index = this.responses.findIndex(r => r.id === responseId);
            if (index === -1) {
                return false;
            }

            this.responses.splice(index, 1);
            this.saveResponses();
            return true;
        } catch (error) {
            console.error('Error deleting response:', error);
            return false;
        }
    }

    /**
     * Update response
     * @param {string} responseId - Response ID
     * @param {Object} updates - Updates to apply
     * @returns {Object} Updated response
     */
    updateResponse(responseId, updates) {
        try {
            const index = this.responses.findIndex(r => r.id === responseId);
            if (index === -1) {
                throw new Error('Response not found');
            }

            this.responses[index] = {
                ...this.responses[index],
                ...updates,
                lastAccessed: new Date().toISOString()
            };

            this.saveResponses();
            return this.responses[index];
        } catch (error) {
            console.error('Error updating response:', error);
            throw error;
        }
    }

    /**
     * Get response by ID
     * @param {string} responseId - Response ID
     * @returns {Object|null} Response object or null
     */
    getResponse(responseId) {
        const response = this.responses.find(r => r.id === responseId);
        if (response) {
            // Update last accessed time
            response.lastAccessed = new Date().toISOString();
            this.saveResponses();
        }
        return response || null;
    }

    /**
     * Get responses by category
     * @param {string} category - Category name
     * @returns {Array} Responses in category
     */
    getResponsesByCategory(category) {
        return this.responses.filter(r => r.category === category);
    }

    /**
     * Get response statistics
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const stats = {
            totalResponses: this.responses.length,
            byCategory: {},
            bySubject: {},
            byMode: {},
            averageRating: 0,
            totalSavedToSections: 0
        };

        this.responses.forEach(response => {
            // Count by category
            stats.byCategory[response.category] = (stats.byCategory[response.category] || 0) + 1;
            
            // Count by subject
            stats.bySubject[response.subject] = (stats.bySubject[response.subject] || 0) + 1;
            
            // Count by mode
            stats.byMode[response.mode] = (stats.byMode[response.mode] || 0) + 1;
            
            // Count saved to sections
            if (response.savedToSection) {
                stats.totalSavedToSections++;
            }
        });

        // Calculate average rating
        const ratedResponses = this.responses.filter(r => r.userRating !== null);
        if (ratedResponses.length > 0) {
            stats.averageRating = ratedResponses.reduce((sum, r) => sum + r.userRating, 0) / ratedResponses.length;
        }

        return stats;
    }

    // Private helper methods

    /**
     * Generate unique response ID
     * @returns {string} Unique ID
     */
    generateResponseId() {
        return 'resp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Infer category from response
     * @param {Object} response - Response object
     * @returns {string} Inferred category
     */
    inferCategory(response) {
        const content = response.content.toLowerCase();
        const mode = response.mode || 'general';

        if (mode === 'mcq' || content.includes('question') || content.includes('answer')) {
            return 'mcqs';
        }
        if (mode === 'essay' || content.includes('essay') || content.includes('writing')) {
            return 'notes';
        }
        if (content.includes('flashcard') || content.includes('memorize') || content.includes('remember')) {
            return 'flashcards';
        }
        
        return 'general';
    }

    /**
     * Infer subject from response
     * @param {Object} response - Response object
     * @returns {string} Inferred subject
     */
    inferSubject(response) {
        const content = response.content.toLowerCase();
        const subjects = {
            'polity': ['constitution', 'government', 'parliament', 'judiciary', 'rights'],
            'economics': ['economy', 'gdp', 'inflation', 'budget', 'fiscal', 'monetary'],
            'geography': ['climate', 'rivers', 'mountains', 'minerals', 'agriculture'],
            'history': ['ancient', 'medieval', 'modern', 'freedom', 'independence'],
            'environment': ['ecology', 'biodiversity', 'pollution', 'climate change'],
            'international relations': ['foreign policy', 'diplomacy', 'treaties', 'organizations']
        };

        for (const [subject, keywords] of Object.entries(subjects)) {
            if (keywords.some(keyword => content.includes(keyword))) {
                return subject.charAt(0).toUpperCase() + subject.slice(1);
            }
        }

        return 'General';
    }

    /**
     * Generate tags from response content
     * @param {Object} response - Response object
     * @returns {Array} Generated tags
     */
    generateTags(response) {
        const content = response.content.toLowerCase();
        const tags = [];

        // Add mode as tag
        if (response.mode) {
            tags.push(response.mode);
        }

        // Extract key terms (simple implementation)
        const keyTerms = content.match(/\b[a-z]{4,}\b/g) || [];
        const commonTerms = keyTerms
            .filter(term => !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'will', 'would', 'could', 'should'].includes(term))
            .slice(0, 5);

        tags.push(...commonTerms);

        return [...new Set(tags)]; // Remove duplicates
    }

    /**
     * Generate title from response content
     * @param {Object} response - Response object
     * @returns {string} Generated title
     */
    generateTitle(response) {
        const content = response.content;
        
        // Try to extract first sentence or first 50 characters
        const firstSentence = content.split('.')[0];
        if (firstSentence.length > 5 && firstSentence.length <= 60) {
            return firstSentence.trim();
        }

        // Fallback to first 50 characters
        return content.substring(0, 50).trim() + (content.length > 50 ? '...' : '');
    }

    /**
     * Format response for notes section
     * @param {Object} response - Response object
     * @returns {string} Formatted HTML content
     */
    formatResponseForNotes(response) {
        const timestamp = new Date(response.savedAt || Date.now()).toLocaleString();
        return `
            <div class="ai-response-content">
                <div class="ai-response-header" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; margin-bottom: 16px;">
                    <small style="color: rgba(255,255,255,0.6);">AI Response - ${timestamp}</small>
                    ${response.mode ? `<span style="background: rgba(44,122,123,0.2); color: #4ECDC4; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 8px;">${response.mode}</span>` : ''}
                </div>
                <div class="ai-response-body">
                    ${response.content.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
    }

    /**
     * Format response for flashcards
     * @param {Object} response - Response object
     * @returns {Object} Flashcard data
     */
    formatResponseForFlashcards(response) {
        const content = response.content;
        
        // Try to split content into question/answer format
        if (content.includes('?')) {
            const parts = content.split('?');
            return {
                front: parts[0].trim() + '?',
                back: parts.slice(1).join('?').trim()
            };
        }

        // Try to find definition pattern
        const definitionMatch = content.match(/(.+?)\s+(?:is|are|means?|refers?\s+to)\s+(.+)/i);
        if (definitionMatch) {
            return {
                front: `What is ${definitionMatch[1].trim()}?`,
                back: definitionMatch[2].trim()
            };
        }

        // Fallback: split content in half
        const midPoint = Math.floor(content.length / 2);
        const splitPoint = content.indexOf(' ', midPoint);
        
        if (splitPoint > 0) {
            return {
                front: content.substring(0, splitPoint).trim(),
                back: content.substring(splitPoint).trim()
            };
        }

        // Last resort: use title as front, content as back
        return {
            front: response.title || 'AI Generated Question',
            back: content
        };
    }

    /**
     * Create MCQ from response
     * @param {Object} response - Response object
     * @returns {Object} MCQ data
     */
    createMCQFromResponse(response) {
        // This is a simplified implementation
        // In a real scenario, you might use AI to generate proper MCQ options
        const mcqData = {
            id: Date.now(),
            question: response.title || this.generateTitle(response),
            options: [
                response.content.substring(0, 50) + '...',
                'Option B (generated)',
                'Option C (generated)',
                'Option D (generated)'
            ],
            correctAnswer: 0,
            explanation: response.content,
            subject: response.subject || 'General',
            difficulty: 'medium',
            tags: [...response.tags, 'ai-generated'],
            createdAt: new Date().toISOString()
        };

        // Store in MCQ storage
        const mcqs = JSON.parse(localStorage.getItem('userMCQs') || '[]');
        mcqs.unshift(mcqData);
        localStorage.setItem('userMCQs', JSON.stringify(mcqs));

        // Update response with saved location
        this.updateResponseSavedLocation(response.id, 'mcqs', mcqData.id);

        return mcqData;
    }

    /**
     * Export responses to CSV format
     * @param {Array} responses - Responses to export
     * @returns {string} CSV content
     */
    exportToCSV(responses) {
        const headers = ['ID', 'Title', 'Content', 'Category', 'Subject', 'Mode', 'Tags', 'Saved At', 'Rating'];
        const rows = responses.map(r => [
            r.id,
            `"${r.title.replace(/"/g, '""')}"`,
            `"${r.content.replace(/"/g, '""')}"`,
            r.category,
            r.subject,
            r.mode,
            `"${r.tags.join(', ')}"`,
            r.savedAt,
            r.userRating || ''
        ]);

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    /**
     * Export responses to Markdown format
     * @param {Array} responses - Responses to export
     * @returns {string} Markdown content
     */
    exportToMarkdown(responses) {
        let markdown = '# AI Responses Export\n\n';
        markdown += `Exported on: ${new Date().toLocaleString()}\n`;
        markdown += `Total responses: ${responses.length}\n\n`;

        responses.forEach((response, index) => {
            markdown += `## ${index + 1}. ${response.title}\n\n`;
            markdown += `**Category:** ${response.category}\n`;
            markdown += `**Subject:** ${response.subject}\n`;
            markdown += `**Mode:** ${response.mode}\n`;
            markdown += `**Tags:** ${response.tags.join(', ')}\n`;
            markdown += `**Saved:** ${new Date(response.savedAt).toLocaleString()}\n\n`;
            markdown += `${response.content}\n\n`;
            markdown += '---\n\n';
        });

        return markdown;
    }

    /**
     * Setup event listeners for response management
     */
    setupEventListeners() {
        // Listen for response save events from AI chat interface
        document.addEventListener('ai-response-save', (event) => {
            const { response, metadata } = event.detail;
            this.saveResponse(response, metadata);
        });

        // Listen for response management actions
        document.addEventListener('click', (event) => {
            const target = event.target;
            
            if (target.classList.contains('save-to-notes-btn')) {
                const responseId = target.dataset.responseId;
                const response = this.getResponse(responseId);
                if (response) {
                    this.addToNotesSection(response);
                    this.showToast('Response saved to notes!', 'success');
                }
            }
            
            if (target.classList.contains('save-to-flashcards-btn')) {
                const responseId = target.dataset.responseId;
                const response = this.getResponse(responseId);
                if (response) {
                    this.addToFlashcards(response);
                    this.showToast('Response saved to flashcards!', 'success');
                }
            }
        });
    }

    /**
     * Show toast notification
     * @param {string} message - Message to show
     * @param {string} type - Toast type ('success', 'error', 'info')
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300 ${
            type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResponseManager;
} else if (typeof window !== 'undefined') {
    window.ResponseManager = ResponseManager;
}