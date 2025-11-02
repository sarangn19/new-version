/**
 * Response Management Interface
 * Provides UI for searching, filtering, organizing, and managing saved AI responses
 */
class ResponseManagementInterface {
    constructor() {
        this.responseManager = null;
        this.currentFilters = {
            category: '',
            subject: '',
            mode: '',
            dateFrom: '',
            dateTo: '',
            tags: [],
            minRating: 0,
            sortBy: 'savedAt',
            sortOrder: 'desc'
        };
        this.searchQuery = '';
        this.selectedResponses = new Set();
        this.currentPage = 1;
        this.itemsPerPage = 10;
        
        this.init();
    }

    /**
     * Initialize the interface
     */
    init() {
        // Initialize response manager
        if (typeof ResponseManager !== 'undefined') {
            this.responseManager = new ResponseManager();
        } else {
            console.error('ResponseManager not available');
            return;
        }

        this.setupEventListeners();
        this.loadResponses();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('response-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
        }

        // Filter controls
        const filterControls = document.querySelectorAll('.filter-control');
        filterControls.forEach(control => {
            control.addEventListener('change', this.handleFilterChange.bind(this));
        });

        // Sort controls
        const sortControls = document.querySelectorAll('.sort-control');
        sortControls.forEach(control => {
            control.addEventListener('change', this.handleSortChange.bind(this));
        });

        // Bulk actions
        const bulkActionBtn = document.getElementById('bulk-action-btn');
        if (bulkActionBtn) {
            bulkActionBtn.addEventListener('click', this.showBulkActionMenu.bind(this));
        }

        // Export button
        const exportBtn = document.getElementById('export-responses-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', this.showExportModal.bind(this));
        }

        // Clear filters button
        const clearFiltersBtn = document.getElementById('clear-filters-btn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', this.clearFilters.bind(this));
        }

        // Response list event delegation
        const responseList = document.getElementById('response-list');
        if (responseList) {
            responseList.addEventListener('click', this.handleResponseAction.bind(this));
            responseList.addEventListener('change', this.handleResponseSelection.bind(this));
        }

        // Pagination
        const paginationContainer = document.getElementById('pagination-container');
        if (paginationContainer) {
            paginationContainer.addEventListener('click', this.handlePagination.bind(this));
        }
    }

    /**
     * Load and display responses
     */
    loadResponses() {
        try {
            const responses = this.responseManager.searchSavedResponses(this.searchQuery, this.currentFilters);
            this.displayResponses(responses);
            this.updateStatistics(responses);
            this.updatePagination(responses.length);
        } catch (error) {
            console.error('Error loading responses:', error);
            this.showError('Failed to load responses');
        }
    }

    /**
     * Display responses in the list
     */
    displayResponses(responses) {
        const responseList = document.getElementById('response-list');
        if (!responseList) return;

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedResponses = responses.slice(startIndex, endIndex);

        if (paginatedResponses.length === 0) {
            responseList.innerHTML = this.createEmptyState();
            return;
        }

        responseList.innerHTML = paginatedResponses.map(response => 
            this.createResponseCard(response)
        ).join('');

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons(responseList);
        }
    }

    /**
     * Create response card HTML
     */
    createResponseCard(response) {
        const isSelected = this.selectedResponses.has(response.id);
        const savedDate = new Date(response.savedAt).toLocaleDateString();
        const savedTime = new Date(response.savedAt).toLocaleTimeString();
        
        return `
            <div class="response-card bg-[var(--bg-dark-2)] rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-200" data-response-id="${response.id}">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-start space-x-3 flex-1">
                        <input type="checkbox" class="response-checkbox mt-1 rounded border-white/20 bg-transparent text-[var(--teal-primary)] focus:ring-[var(--teal-primary)]" 
                               ${isSelected ? 'checked' : ''} data-response-id="${response.id}">
                        <div class="flex-1 min-w-0">
                            <h3 class="text-lg font-medium text-white mb-2 line-clamp-2">${response.title}</h3>
                            <div class="flex items-center space-x-4 mb-3">
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${this.getCategoryColor(response.category)}-500/20 text-${this.getCategoryColor(response.category)}-300">
                                    <i data-lucide="${this.getCategoryIcon(response.category)}" class="w-3 h-3 mr-1"></i>
                                    ${response.category}
                                </span>
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-300">
                                    ${response.mode}
                                </span>
                                <span class="text-xs text-white/60">${response.subject}</span>
                            </div>
                            <p class="text-white/70 text-sm line-clamp-3 mb-3">${response.content}</p>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-4 text-xs text-white/50">
                                    <span>Saved: ${savedDate} at ${savedTime}</span>
                                    ${response.savedToSection ? `<span>→ ${response.savedToSection}</span>` : ''}
                                </div>
                                ${response.userRating ? `
                                    <div class="flex items-center space-x-1">
                                        ${this.createStarRating(response.userRating)}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2 ml-4">
                        <button class="action-btn edit-response-btn p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition-colors" 
                                data-response-id="${response.id}" title="Edit Response">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button class="action-btn view-response-btn p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 transition-colors" 
                                data-response-id="${response.id}" title="View Details">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                        <button class="action-btn delete-response-btn p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors" 
                                data-response-id="${response.id}" title="Delete Response">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                ${response.tags.length > 0 ? `
                    <div class="flex flex-wrap gap-2">
                        ${response.tags.map(tag => `
                            <span class="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/10 text-white/70">
                                #${tag}
                            </span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Create empty state HTML
     */
    createEmptyState() {
        return `
            <div class="text-center py-12">
                <div class="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                    <i data-lucide="search" class="w-8 h-8 text-white/50"></i>
                </div>
                <h3 class="text-lg font-medium text-white mb-2">No responses found</h3>
                <p class="text-white/60 mb-4">Try adjusting your search criteria or filters</p>
                <button onclick="responseManagementInterface.clearFilters()" class="px-4 py-2 bg-[var(--teal-primary)] text-white rounded-lg hover:bg-[var(--teal-primary)]/80 transition-colors">
                    Clear Filters
                </button>
            </div>
        `;
    }

    /**
     * Handle search input
     */
    handleSearch(event) {
        this.searchQuery = event.target.value.trim();
        this.currentPage = 1;
        this.loadResponses();
    }

    /**
     * Handle filter changes
     */
    handleFilterChange(event) {
        const filterName = event.target.dataset.filter;
        const filterValue = event.target.value;

        if (filterName === 'tags') {
            // Handle tag filter (multi-select)
            if (event.target.checked) {
                this.currentFilters.tags.push(filterValue);
            } else {
                this.currentFilters.tags = this.currentFilters.tags.filter(tag => tag !== filterValue);
            }
        } else {
            this.currentFilters[filterName] = filterValue;
        }

        this.currentPage = 1;
        this.loadResponses();
    }

    /**
     * Handle sort changes
     */
    handleSortChange(event) {
        const [sortBy, sortOrder] = event.target.value.split('-');
        this.currentFilters.sortBy = sortBy;
        this.currentFilters.sortOrder = sortOrder;
        this.loadResponses();
    }

    /**
     * Handle response actions (edit, view, delete)
     */
    handleResponseAction(event) {
        const target = event.target.closest('.action-btn');
        if (!target) return;

        const responseId = target.dataset.responseId;
        
        if (target.classList.contains('edit-response-btn')) {
            this.editResponse(responseId);
        } else if (target.classList.contains('view-response-btn')) {
            this.viewResponse(responseId);
        } else if (target.classList.contains('delete-response-btn')) {
            this.deleteResponse(responseId);
        }
    }

    /**
     * Handle response selection
     */
    handleResponseSelection(event) {
        if (event.target.classList.contains('response-checkbox')) {
            const responseId = event.target.dataset.responseId;
            
            if (event.target.checked) {
                this.selectedResponses.add(responseId);
            } else {
                this.selectedResponses.delete(responseId);
            }
            
            this.updateBulkActionButton();
        }
    }

    /**
     * Handle pagination
     */
    handlePagination(event) {
        const target = event.target.closest('[data-page]');
        if (!target) return;

        const page = parseInt(target.dataset.page);
        if (page && page !== this.currentPage) {
            this.currentPage = page;
            this.loadResponses();
        }
    }

    /**
     * Edit response
     */
    editResponse(responseId) {
        const response = this.responseManager.getResponse(responseId);
        if (!response) return;

        this.showEditModal(response);
    }

    /**
     * View response details
     */
    viewResponse(responseId) {
        const response = this.responseManager.getResponse(responseId);
        if (!response) return;

        this.showViewModal(response);
    }

    /**
     * Delete response
     */
    deleteResponse(responseId) {
        const response = this.responseManager.getResponse(responseId);
        if (!response) return;

        if (confirm(`Are you sure you want to delete "${response.title}"?`)) {
            try {
                this.responseManager.deleteResponse(responseId);
                this.selectedResponses.delete(responseId);
                this.loadResponses();
                this.showToast('Response deleted successfully', 'success');
            } catch (error) {
                console.error('Error deleting response:', error);
                this.showToast('Failed to delete response', 'error');
            }
        }
    }

    /**
     * Show edit modal
     */
    showEditModal(response) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-[var(--bg-dark-2)] rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-medium">Edit Response</h3>
                    <button class="close-modal text-white/50 hover:text-white">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
                
                <form class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-white/80 mb-2">Title</label>
                        <input type="text" class="w-full bg-[var(--bg-dark-1)] border border-white/20 rounded-lg p-3 text-white" 
                               value="${response.title}" id="edit-title">
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-white/80 mb-2">Category</label>
                            <select class="w-full bg-[var(--bg-dark-1)] border border-white/20 rounded-lg p-3 text-white" id="edit-category">
                                <option value="notes" ${response.category === 'notes' ? 'selected' : ''}>Notes</option>
                                <option value="flashcards" ${response.category === 'flashcards' ? 'selected' : ''}>Flashcards</option>
                                <option value="mcqs" ${response.category === 'mcqs' ? 'selected' : ''}>MCQs</option>
                                <option value="general" ${response.category === 'general' ? 'selected' : ''}>General</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-white/80 mb-2">Subject</label>
                            <input type="text" class="w-full bg-[var(--bg-dark-1)] border border-white/20 rounded-lg p-3 text-white" 
                                   value="${response.subject}" id="edit-subject">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-white/80 mb-2">Rating</label>
                            <select class="w-full bg-[var(--bg-dark-1)] border border-white/20 rounded-lg p-3 text-white" id="edit-rating">
                                <option value="">No rating</option>
                                <option value="1" ${response.userRating === 1 ? 'selected' : ''}>1 Star</option>
                                <option value="2" ${response.userRating === 2 ? 'selected' : ''}>2 Stars</option>
                                <option value="3" ${response.userRating === 3 ? 'selected' : ''}>3 Stars</option>
                                <option value="4" ${response.userRating === 4 ? 'selected' : ''}>4 Stars</option>
                                <option value="5" ${response.userRating === 5 ? 'selected' : ''}>5 Stars</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-white/80 mb-2">Tags (comma-separated)</label>
                        <input type="text" class="w-full bg-[var(--bg-dark-1)] border border-white/20 rounded-lg p-3 text-white" 
                               value="${response.tags.join(', ')}" id="edit-tags">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-white/80 mb-2">Content</label>
                        <textarea class="w-full bg-[var(--bg-dark-1)] border border-white/20 rounded-lg p-3 text-white h-40 resize-none" 
                                  id="edit-content">${response.content}</textarea>
                    </div>
                    
                    <div class="flex items-center justify-end space-x-4 pt-4">
                        <button type="button" class="cancel-edit px-6 py-2 text-white/70 hover:text-white transition-colors">
                            Cancel
                        </button>
                        <button type="submit" class="save-edit px-6 py-2 bg-[var(--teal-primary)] text-white rounded-lg hover:bg-[var(--teal-primary)]/80 transition-colors">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('.cancel-edit').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveResponseEdit(response.id, modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons(modal);
        }
    }

    /**
     * Save response edit
     */
    saveResponseEdit(responseId, modal) {
        try {
            const updates = {
                title: modal.querySelector('#edit-title').value.trim(),
                category: modal.querySelector('#edit-category').value,
                subject: modal.querySelector('#edit-subject').value.trim(),
                userRating: modal.querySelector('#edit-rating').value ? parseInt(modal.querySelector('#edit-rating').value) : null,
                tags: modal.querySelector('#edit-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
                content: modal.querySelector('#edit-content').value.trim()
            };

            this.responseManager.updateResponse(responseId, updates);
            document.body.removeChild(modal);
            this.loadResponses();
            this.showToast('Response updated successfully', 'success');
        } catch (error) {
            console.error('Error updating response:', error);
            this.showToast('Failed to update response', 'error');
        }
    }

    /**
     * Show view modal
     */
    showViewModal(response) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-[var(--bg-dark-2)] rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-medium">${response.title}</h3>
                    <button class="close-modal text-white/50 hover:text-white">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
                
                <div class="space-y-6">
                    <div class="flex flex-wrap gap-4">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-${this.getCategoryColor(response.category)}-500/20 text-${this.getCategoryColor(response.category)}-300">
                            <i data-lucide="${this.getCategoryIcon(response.category)}" class="w-4 h-4 mr-2"></i>
                            ${response.category}
                        </span>
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-500/20 text-gray-300">
                            Mode: ${response.mode}
                        </span>
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-500/20 text-gray-300">
                            Subject: ${response.subject}
                        </span>
                        ${response.userRating ? `
                            <div class="flex items-center space-x-1">
                                ${this.createStarRating(response.userRating)}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="bg-[var(--bg-dark-1)] rounded-lg p-4">
                        <h4 class="text-sm font-medium text-white/80 mb-2">Content</h4>
                        <div class="text-white/90 whitespace-pre-wrap">${response.content}</div>
                    </div>
                    
                    ${response.tags.length > 0 ? `
                        <div>
                            <h4 class="text-sm font-medium text-white/80 mb-2">Tags</h4>
                            <div class="flex flex-wrap gap-2">
                                ${response.tags.map(tag => `
                                    <span class="inline-flex items-center px-2 py-1 rounded-md text-xs bg-white/10 text-white/70">
                                        #${tag}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/60">
                        <div>
                            <strong>Saved:</strong> ${new Date(response.savedAt).toLocaleString()}
                        </div>
                        <div>
                            <strong>Last Accessed:</strong> ${new Date(response.lastAccessed).toLocaleString()}
                        </div>
                        ${response.savedToSection ? `
                            <div>
                                <strong>Saved to:</strong> ${response.savedToSection}
                            </div>
                        ` : ''}
                        ${response.conversationId ? `
                            <div>
                                <strong>Conversation ID:</strong> ${response.conversationId}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons(modal);
        }
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.currentFilters = {
            category: '',
            subject: '',
            mode: '',
            dateFrom: '',
            dateTo: '',
            tags: [],
            minRating: 0,
            sortBy: 'savedAt',
            sortOrder: 'desc'
        };
        this.searchQuery = '';
        this.currentPage = 1;

        // Reset form controls
        const searchInput = document.getElementById('response-search');
        if (searchInput) searchInput.value = '';

        const filterControls = document.querySelectorAll('.filter-control');
        filterControls.forEach(control => {
            if (control.type === 'checkbox') {
                control.checked = false;
            } else {
                control.value = '';
            }
        });

        this.loadResponses();
    }

    /**
     * Update statistics display
     */
    updateStatistics(responses) {
        const statsContainer = document.getElementById('response-stats');
        if (!statsContainer) return;

        const stats = this.responseManager.getStatistics();
        
        statsContainer.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-[var(--bg-dark-2)] rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-white">${responses.length}</div>
                    <div class="text-sm text-white/60">Found</div>
                </div>
                <div class="bg-[var(--bg-dark-2)] rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-white">${stats.totalResponses}</div>
                    <div class="text-sm text-white/60">Total</div>
                </div>
                <div class="bg-[var(--bg-dark-2)] rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-white">${stats.totalSavedToSections}</div>
                    <div class="text-sm text-white/60">Saved</div>
                </div>
                <div class="bg-[var(--bg-dark-2)] rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-white">${stats.averageRating.toFixed(1)}</div>
                    <div class="text-sm text-white/60">Avg Rating</div>
                </div>
            </div>
        `;
    }

    /**
     * Update pagination
     */
    updatePagination(totalItems) {
        const paginationContainer = document.getElementById('pagination-container');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="flex items-center justify-center space-x-2">';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<button class="px-3 py-2 rounded-lg bg-[var(--bg-dark-2)] text-white hover:bg-white/10 transition-colors" data-page="${this.currentPage - 1}">Previous</button>`;
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<button class="px-3 py-2 rounded-lg bg-[var(--teal-primary)] text-white" data-page="${i}">${i}</button>`;
            } else if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                paginationHTML += `<button class="px-3 py-2 rounded-lg bg-[var(--bg-dark-2)] text-white hover:bg-white/10 transition-colors" data-page="${i}">${i}</button>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                paginationHTML += '<span class="px-3 py-2 text-white/50">...</span>';
            }
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `<button class="px-3 py-2 rounded-lg bg-[var(--bg-dark-2)] text-white hover:bg-white/10 transition-colors" data-page="${this.currentPage + 1}">Next</button>`;
        }
        
        paginationHTML += '</div>';
        paginationContainer.innerHTML = paginationHTML;
    }

    /**
     * Update bulk action button
     */
    updateBulkActionButton() {
        const bulkActionBtn = document.getElementById('bulk-action-btn');
        if (!bulkActionBtn) return;

        const selectedCount = this.selectedResponses.size;
        if (selectedCount > 0) {
            bulkActionBtn.textContent = `Actions (${selectedCount})`;
            bulkActionBtn.disabled = false;
        } else {
            bulkActionBtn.textContent = 'Bulk Actions';
            bulkActionBtn.disabled = true;
        }
    }

    // Helper methods

    /**
     * Get category color
     */
    getCategoryColor(category) {
        const colors = {
            notes: 'blue',
            flashcards: 'green',
            mcqs: 'purple',
            general: 'gray'
        };
        return colors[category] || 'gray';
    }

    /**
     * Get category icon
     */
    getCategoryIcon(category) {
        const icons = {
            notes: 'file-text',
            flashcards: 'layers',
            mcqs: 'help-circle',
            general: 'message-circle'
        };
        return icons[category] || 'message-circle';
    }

    /**
     * Create star rating HTML
     */
    createStarRating(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i data-lucide="star" class="w-4 h-4 text-yellow-400 fill-current"></i>';
            } else {
                stars += '<i data-lucide="star" class="w-4 h-4 text-gray-400"></i>';
            }
        }
        return stars;
    }

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Show toast notification
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

    /**
     * Show error message
     */
    showError(message) {
        this.showToast(message, 'error');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResponseManagementInterface;
} else if (typeof window !== 'undefined') {
    window.ResponseManagementInterface = ResponseManagementInterface;
}