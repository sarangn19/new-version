/**
 * Chat Interface Manager
 * Handles chat UI interactions, message display, and response saving functionality
 */
class ChatInterface {
    constructor() {
        this.aiServiceManager = null;
        this.conversationStorage = null;
        this.currentConversationId = null;
        this.isProcessing = false;
        
        // DOM elements
        this.elements = {
            chatMessages: null,
            chatInput: null,
            sendButton: null,
            modeSelector: null,
            typingIndicator: null,
            errorDisplay: null,
            errorMessage: null,
            charCount: null,
            saveModal: null,
            closeModal: null,
            saveOptions: null
        };
        
        // Current response being saved
        this.currentSaveResponse = null;
        
        // UI Performance optimization
        this.uiOptimizer = new UIPerformanceOptimizer({
            virtualScrollThreshold: 30, // Start virtual scrolling after 30 messages
            chunkSize: 15, // Load messages in chunks of 15
            debounceDelay: 100
        });
        
        // Message management for performance
        this.messageElements = [];
        this.virtualScrollController = null;
        this.progressiveLoadController = null;
        
        this.initialize();
    }

    /**
     * Initialize the chat interface
     */
    async initialize() {
        try {
            // Get DOM elements
            this.getDOMElements();
            
            // Initialize AI services
            await this.initializeAIServices();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load conversation history
            await this.loadConversationHistory();
            
            // Set up UI performance optimizations
            this.setupUIOptimizations();
            
            console.log('Chat interface initialized successfully');
        } catch (error) {
            console.error('Failed to initialize chat interface:', error);
            this.showError('Failed to initialize chat interface. Please refresh the page.');
        }
    }

    /**
     * Get DOM elements
     */
    getDOMElements() {
        this.elements.chatMessages = document.getElementById('chat-messages');
        this.elements.chatInput = document.getElementById('chat-input');
        this.elements.sendButton = document.getElementById('send-button');
        this.elements.modeSelector = document.getElementById('mode-selector');
        this.elements.typingIndicator = document.getElementById('typing-indicator');
        this.elements.errorDisplay = document.getElementById('error-display');
        this.elements.errorMessage = document.getElementById('error-message');
        this.elements.charCount = document.getElementById('char-count');
        this.elements.saveModal = document.getElementById('save-modal');
        this.elements.closeModal = document.getElementById('close-modal');
        this.elements.saveOptions = document.querySelectorAll('.save-option');
        
        // Validate required elements
        const requiredElements = ['chatMessages', 'chatInput', 'sendButton', 'modeSelector'];
        for (const elementName of requiredElements) {
            if (!this.elements[elementName]) {
                throw new Error(`Required element not found: ${elementName}`);
            }
        }
    }

    /**
     * Initialize AI services
     */
    async initializeAIServices() {
        // Initialize conversation storage
        if (typeof ConversationStorage !== 'undefined') {
            this.conversationStorage = new ConversationStorage();
        }
        
        // Initialize AI service manager (will be configured with API key later)
        if (typeof AIServiceManager !== 'undefined') {
            // For now, create without API key - will be set when user provides it
            this.aiServiceManager = new AIServiceManager('', {
                maxContextWindow: 10,
                defaultMode: 'general',
                autoSaveResponses: false
            });
        }
        
        // Initialize response manager
        if (typeof ResponseManager !== 'undefined') {
            this.responseManager = new ResponseManager();
        }
        
        // Initialize loading state manager integration
        this.loadingStateManager = window.loadingStateManager;
        
        // Initialize error handler integration
        this.errorHandler = window.errorHandler;
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Chat input events
        this.elements.chatInput.addEventListener('input', this.handleInputChange.bind(this));
        this.elements.chatInput.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Send button
        this.elements.sendButton.addEventListener('click', this.handleSendMessage.bind(this));
        
        // Mode selector
        this.elements.modeSelector.addEventListener('change', this.handleModeChange.bind(this));
        
        // Save modal events
        if (this.elements.closeModal) {
            this.elements.closeModal.addEventListener('click', this.closeSaveModal.bind(this));
        }
        
        if (this.elements.saveModal) {
            this.elements.saveModal.addEventListener('click', (e) => {
                if (e.target === this.elements.saveModal) {
                    this.closeSaveModal();
                }
            });
        }
        
        // Save option buttons
        this.elements.saveOptions.forEach(option => {
            option.addEventListener('click', this.handleSaveOption.bind(this));
        });
        
        // Response action buttons (using event delegation)
        this.elements.chatMessages.addEventListener('click', this.handleResponseAction.bind(this));
        
        // Auto-resize textarea
        this.setupAutoResize();
    }

    /**
     * Handle input change events
     */
    handleInputChange() {
        const input = this.elements.chatInput.value;
        const length = input.length;
        
        // Update character count
        if (this.elements.charCount) {
            this.elements.charCount.textContent = length;
        }
        
        // Enable/disable send button
        this.elements.sendButton.disabled = length === 0 || this.isProcessing;
        
        // Hide error if user starts typing
        if (length > 0) {
            this.hideError();
        }
    }

    /**
     * Handle keydown events
     */
    handleKeyDown(event) {
        // Send message on Enter (without Shift)
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (!this.elements.sendButton.disabled) {
                this.handleSendMessage();
            }
        }
    }

    /**
     * Handle send message
     */
    async handleSendMessage() {
        const message = this.elements.chatInput.value.trim();
        
        if (!message || this.isProcessing) {
            return;
        }
        
        let loadingId = null;
        
        try {
            this.isProcessing = true;
            this.updateUIState();
            
            // Add user message to chat
            this.addMessage('user', message);
            
            // Clear input
            this.elements.chatInput.value = '';
            this.handleInputChange();
            
            // Show loading state using LoadingStateManager
            if (this.loadingStateManager) {
                loadingId = this.loadingStateManager.showLoading('chat_processing', {
                    message: 'AI is thinking...',
                    showProgress: false,
                    target: this.elements.typingIndicator
                });
            } else {
                this.showTypingIndicator();
            }
            
            // Get AI response (simulate for now since we don't have API key)
            const response = await this.getAIResponse(message);
            
            // Add AI response to chat
            this.addMessage('assistant', response.content, response);
            
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Use ErrorHandler if available
            if (this.errorHandler) {
                this.errorHandler.handleError({
                    type: 'javascript',
                    message: error.message || 'Failed to send message',
                    error: error,
                    context: { component: 'ChatInterface', action: 'sendMessage' }
                });
            } else {
                this.showError(error.message || 'Failed to send message. Please try again.');
            }
        } finally {
            // Hide loading state
            if (loadingId && this.loadingStateManager) {
                this.loadingStateManager.hideLoading(loadingId);
            } else {
                this.hideTypingIndicator();
            }
            
            this.isProcessing = false;
            this.updateUIState();
        }
    }

    /**
     * Get AI response (placeholder implementation)
     */
    async getAIResponse(message) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // For now, return a simulated response based on mode
        const mode = this.elements.modeSelector.value;
        const responses = this.getSimulatedResponses(mode, message);
        
        return {
            id: 'resp_' + Date.now(),
            content: responses[Math.floor(Math.random() * responses.length)],
            mode: mode,
            timestamp: new Date().toISOString(),
            processingTime: 1500
        };
    }

    /**
     * Get simulated responses based on mode
     */
    getSimulatedResponses(mode, message) {
        const responses = {
            general: [
                "That's a great question about UPSC preparation! Based on the syllabus and exam pattern, I'd recommend focusing on understanding the core concepts first, then practicing with previous year questions.",
                "For UPSC preparation, it's important to maintain a balance between current affairs and static portions. I suggest creating a structured study plan that covers all subjects systematically.",
                "This topic is quite relevant for the UPSC exam. Let me break it down into key points that you should remember for both Prelims and Mains preparation."
            ],
            mcq: [
                "Let me analyze this MCQ for you:\n\n**Correct Answer Analysis:**\nThe correct option demonstrates understanding of the fundamental concept. Here's why it's right...\n\n**Why Other Options Are Wrong:**\n- Option A: Incorrect because...\n- Option B: This is a common misconception...\n- Option C: While partially correct, it misses the key point...",
                "Great MCQ practice! Here's the detailed explanation:\n\n**Key Concept:** This question tests your understanding of...\n\n**Solution Approach:**\n1. Identify the core concept being tested\n2. Eliminate obviously wrong options\n3. Apply the principle to find the correct answer\n\n**Exam Tip:** Similar questions often appear in UPSC Prelims, so remember this pattern."
            ],
            essay: [
                "**Essay Feedback:**\n\n**Strengths:**\n- Good introduction with clear thesis statement\n- Relevant examples and case studies\n- Logical flow of arguments\n\n**Areas for Improvement:**\n- Consider adding more diverse perspectives\n- Strengthen the conclusion with actionable recommendations\n- Include more recent data and statistics\n\n**UPSC Mains Tips:**\n- Aim for 250-300 words for 15-mark questions\n- Use subheadings for better structure\n- Always include a balanced view",
                "**Essay Analysis:**\n\nYour essay shows good understanding of the topic. Here's my detailed feedback:\n\n**Content (7/10):** Well-researched with relevant examples\n**Structure (8/10):** Clear introduction, body, and conclusion\n**Language (7/10):** Good vocabulary, minor grammatical improvements needed\n**UPSC Relevance (8/10):** Addresses the question directly\n\n**Suggestions:**\n1. Add more contemporary examples\n2. Include government schemes/policies\n3. Provide specific recommendations"
            ],
            news: [
                "**UPSC Relevance Analysis:**\n\n**Exam Importance:** High (likely to appear in Prelims/Mains)\n\n**Subject Connections:**\n- Polity: Constitutional provisions and governance\n- Economics: Policy implications and fiscal impact\n- Current Affairs: Recent developments and trends\n\n**Key Points to Remember:**\n1. Background and context\n2. Government's response and policy measures\n3. Implications for various stakeholders\n4. Future outlook and challenges\n\n**Mains Angle:** This topic could be asked in the context of governance, policy implementation, or socio-economic development.",
                "**Current Affairs Summary:**\n\nThis news item is highly relevant for UPSC preparation. Here's what you need to know:\n\n**Background:** Brief context and why it's important\n**Key Developments:** Recent changes and updates\n**Government Response:** Official statements and policy measures\n**Impact Analysis:** Effects on different sectors/groups\n**Exam Perspective:** How this might be tested in Prelims/Mains\n\n**Related Topics:** Connect this with other current affairs and static portions for comprehensive understanding."
            ]
        };
        
        return responses[mode] || responses.general;
    }

    /**
     * Handle mode change
     */
    handleModeChange() {
        const newMode = this.elements.modeSelector.value;
        
        // Update AI service manager mode if available
        if (this.aiServiceManager) {
            try {
                this.aiServiceManager.setMode(newMode);
            } catch (error) {
                console.error('Failed to change mode:', error);
            }
        }
        
        // Update placeholder text based on mode
        this.updateInputPlaceholder(newMode);
        
        // Add mode change message
        this.addSystemMessage(`Switched to ${this.getModeDisplayName(newMode)} mode`);
    }

    /**
     * Update input placeholder based on mode
     */
    updateInputPlaceholder(mode) {
        const placeholders = {
            general: 'Ask me anything about UPSC preparation...',
            mcq: 'Share an MCQ for detailed analysis and explanation...',
            essay: 'Share your essay for feedback and improvement suggestions...',
            news: 'Share a news article for UPSC relevance analysis...'
        };
        
        this.elements.chatInput.placeholder = placeholders[mode] || placeholders.general;
    }

    /**
     * Get mode display name
     */
    getModeDisplayName(mode) {
        const names = {
            general: 'General',
            mcq: 'MCQ Analysis',
            essay: 'Essay Feedback',
            news: 'News Analysis'
        };
        
        return names[mode] || 'General';
    }

    /**
     * Add message to chat with performance optimizations
     */
    addMessage(role, content, metadata = {}) {
        const messageData = {
            role: role,
            content: content,
            metadata: metadata,
            timestamp: new Date().toISOString(),
            id: metadata.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        };
        
        // Add to message array for virtual scrolling
        this.messageElements.push(messageData);
        
        // Use optimistic UI update for immediate feedback
        if (role === 'user') {
            this.addMessageOptimistically(messageData);
        } else {
            // For AI responses, add normally but with progressive enhancement
            this.addMessageWithProgressive(messageData);
        }
        
        // Store in conversation if storage is available
        if (this.conversationStorage && this.currentConversationId) {
            this.conversationStorage.addMessage(this.currentConversationId, {
                role: role,
                content: content,
                timestamp: messageData.timestamp,
                metadata: metadata
            });
        }
        
        // Update virtual scrolling if enabled
        this.updateVirtualScrolling();
    }

    /**
     * Add system message
     */
    addSystemMessage(content) {
        const messageElement = document.createElement('div');
        messageElement.className = 'text-center text-sm text-white/50 py-2';
        messageElement.textContent = content;
        this.elements.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }

    /**
     * Create message element
     */
    createMessageElement(role, content, metadata = {}) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${role} p-4`;
        
        const isUser = role === 'user';
        const avatarClass = isUser ? 'bg-blue-500' : 'bg-[#84D0F7]';
        const avatarIcon = isUser ? 'user' : 'bot';
        const avatarTextColor = isUser ? 'text-white' : 'text-black';
        
        messageDiv.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="w-8 h-8 ${avatarClass} rounded-full flex items-center justify-center flex-shrink-0">
                    <i data-lucide="${avatarIcon}" class="${avatarTextColor} w-4 h-4"></i>
                </div>
                <div class="flex-1">
                    <div class="message-content">
                        ${this.formatMessageContent(content)}
                    </div>
                    ${!isUser ? this.createMessageActions(metadata) : ''}
                </div>
            </div>
        `;
        
        // Initialize icons in the new message
        if (typeof lucide !== 'undefined') {
            lucide.createIcons(messageDiv);
        }
        
        return messageDiv;
    }

    /**
     * Format message content
     */
    formatMessageContent(content) {
        // Convert line breaks to HTML
        let formatted = content.replace(/\n/g, '<br>');
        
        // Format bold text (markdown-style)
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Format bullet points
        formatted = formatted.replace(/^- (.*$)/gim, '<li>$1</li>');
        formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul class="list-disc list-inside space-y-1 mt-2">$1</ul>');
        
        return formatted;
    }

    /**
     * Create message actions (save button, etc.)
     */
    createMessageActions(metadata) {
        const responseId = metadata.id || Date.now();
        return `
            <div class="message-actions mt-3 flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <button class="save-to-notes-btn action-btn px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-xs font-medium transition-colors text-blue-300" 
                            data-response-id="${responseId}" title="Save to Notes">
                        <i data-lucide="file-text" class="w-3 h-3 mr-1"></i>
                        Notes
                    </button>
                    <button class="save-to-flashcards-btn action-btn px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-xs font-medium transition-colors text-green-300" 
                            data-response-id="${responseId}" title="Save to Flashcards">
                        <i data-lucide="layers" class="w-3 h-3 mr-1"></i>
                        Cards
                    </button>
                    <button class="save-to-mcqs-btn action-btn px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-xs font-medium transition-colors text-purple-300" 
                            data-response-id="${responseId}" title="Save to MCQs">
                        <i data-lucide="help-circle" class="w-3 h-3 mr-1"></i>
                        MCQs
                    </button>
                    <button class="copy-response-btn action-btn px-3 py-1.5 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 rounded-lg text-xs font-medium transition-colors text-gray-300" 
                            data-response-id="${responseId}" title="Copy Response">
                        <i data-lucide="copy" class="w-3 h-3 mr-1"></i>
                        Copy
                    </button>
                </div>
                <span class="text-xs text-white/40">
                    ${new Date(metadata.timestamp || Date.now()).toLocaleTimeString()}
                </span>
            </div>
        `;
    }

    /**
     * Open save modal
     */
    openSaveModal(responseId) {
        // Find the response content
        const messageElements = this.elements.chatMessages.querySelectorAll('.message-assistant');
        let responseContent = '';
        
        for (const element of messageElements) {
            const actions = element.querySelector('.message-actions button');
            if (actions && actions.onclick && actions.onclick.toString().includes(responseId)) {
                responseContent = element.querySelector('.message-content').textContent;
                break;
            }
        }
        
        this.currentSaveResponse = {
            id: responseId,
            content: responseContent,
            mode: this.elements.modeSelector.value,
            timestamp: new Date().toISOString()
        };
        
        if (this.elements.saveModal) {
            this.elements.saveModal.classList.remove('hidden');
        }
    }

    /**
     * Close save modal
     */
    closeSaveModal() {
        if (this.elements.saveModal) {
            this.elements.saveModal.classList.add('hidden');
        }
        this.currentSaveResponse = null;
    }

    /**
     * Handle response action buttons
     */
    handleResponseAction(event) {
        const target = event.target.closest('.action-btn');
        if (!target) return;

        const responseId = target.dataset.responseId;
        const response = this.findResponseById(responseId);
        
        if (!response) {
            console.error('Response not found:', responseId);
            return;
        }

        try {
            if (target.classList.contains('save-to-notes-btn')) {
                this.saveToNotes(response);
            } else if (target.classList.contains('save-to-flashcards-btn')) {
                this.saveToFlashcards(response);
            } else if (target.classList.contains('save-to-mcqs-btn')) {
                this.saveToMCQs(response);
            } else if (target.classList.contains('copy-response-btn')) {
                this.copyResponse(response);
            }
        } catch (error) {
            console.error('Error handling response action:', error);
            this.showError('Failed to perform action. Please try again.');
        }
    }

    /**
     * Find response by ID from chat messages
     */
    findResponseById(responseId) {
        const messageElements = this.elements.chatMessages.querySelectorAll('.message-assistant');
        
        for (const element of messageElements) {
            const actionBtn = element.querySelector(`[data-response-id="${responseId}"]`);
            if (actionBtn) {
                const contentElement = element.querySelector('.message-content');
                return {
                    id: responseId,
                    content: contentElement.textContent.trim(),
                    htmlContent: contentElement.innerHTML,
                    mode: this.elements.modeSelector.value,
                    timestamp: new Date().toISOString()
                };
            }
        }
        return null;
    }

    /**
     * Save response to notes
     */
    async saveToNotes(response) {
        try {
            if (this.responseManager) {
                // Save to response manager first
                const savedResponse = this.responseManager.saveResponse(response, {
                    category: 'notes',
                    title: this.responseManager.generateTitle(response)
                });
                
                // Add to notes section
                const note = this.responseManager.addToNotesSection(savedResponse);
                this.showSuccessMessage('Response saved to Notes!');
                
                // Update button state
                this.updateButtonState(response.id, 'notes');
            } else {
                throw new Error('Response Manager not available');
            }
        } catch (error) {
            console.error('Error saving to notes:', error);
            this.showError('Failed to save to notes. Please try again.');
        }
    }

    /**
     * Save response to flashcards
     */
    async saveToFlashcards(response) {
        try {
            if (this.responseManager) {
                // Save to response manager first
                const savedResponse = this.responseManager.saveResponse(response, {
                    category: 'flashcards',
                    title: this.responseManager.generateTitle(response)
                });
                
                // Add to flashcards section
                const flashcard = this.responseManager.addToFlashcards(savedResponse);
                this.showSuccessMessage('Response saved to Flashcards!');
                
                // Update button state
                this.updateButtonState(response.id, 'flashcards');
            } else {
                throw new Error('Response Manager not available');
            }
        } catch (error) {
            console.error('Error saving to flashcards:', error);
            this.showError('Failed to save to flashcards. Please try again.');
        }
    }

    /**
     * Save response to MCQs
     */
    async saveToMCQs(response) {
        try {
            if (this.responseManager) {
                // Save to response manager first
                const savedResponse = this.responseManager.saveResponse(response, {
                    category: 'mcqs',
                    title: this.responseManager.generateTitle(response)
                });
                
                // Create MCQ from response
                const mcq = this.responseManager.createStudyMaterial(savedResponse, 'mcq');
                this.showSuccessMessage('Response saved to MCQs!');
                
                // Update button state
                this.updateButtonState(response.id, 'mcqs');
            } else {
                throw new Error('Response Manager not available');
            }
        } catch (error) {
            console.error('Error saving to MCQs:', error);
            this.showError('Failed to save to MCQs. Please try again.');
        }
    }

    /**
     * Copy response to clipboard
     */
    async copyResponse(response) {
        try {
            await navigator.clipboard.writeText(response.content);
            this.showSuccessMessage('Response copied to clipboard!');
        } catch (error) {
            console.error('Error copying response:', error);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = response.content;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showSuccessMessage('Response copied to clipboard!');
        }
    }

    /**
     * Update button state after saving
     */
    updateButtonState(responseId, section) {
        const button = document.querySelector(`[data-response-id="${responseId}"].save-to-${section}-btn`);
        if (button) {
            button.innerHTML = `<i data-lucide="check" class="w-3 h-3 mr-1"></i>Saved`;
            button.disabled = true;
            button.classList.add('opacity-60');
            
            // Re-initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons(button);
            }
        }
    }

    /**
     * Handle save option selection (legacy modal support)
     */
    handleSaveOption(event) {
        const section = event.currentTarget.dataset.section;
        
        if (!this.currentSaveResponse) {
            return;
        }
        
        try {
            this.saveResponseToSection(this.currentSaveResponse, section);
            this.closeSaveModal();
            this.showSuccessMessage(`Response saved to ${section}!`);
        } catch (error) {
            console.error('Failed to save response:', error);
            this.showError('Failed to save response. Please try again.');
        }
    }

    /**
     * Save response to specific section
     */
    saveResponseToSection(response, section) {
        // Create a structured data object for saving
        const saveData = {
            id: `ai_${section}_${Date.now()}`,
            content: response.content,
            source: 'ai_assistant',
            mode: response.mode,
            section: section,
            timestamp: response.timestamp,
            tags: [response.mode, 'ai_generated']
        };
        
        // Save to localStorage with section-specific key
        const storageKey = `upsc_ai_saved_${section}`;
        const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
        existingData.unshift(saveData); // Add to beginning
        
        // Limit to 100 saved items per section
        if (existingData.length > 100) {
            existingData.splice(100);
        }
        
        localStorage.setItem(storageKey, JSON.stringify(existingData));
        
        console.log(`Response saved to ${section}:`, saveData);
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        if (this.elements.typingIndicator) {
            this.elements.typingIndicator.classList.remove('hidden');
            this.scrollToBottom();
        }
    }

    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        if (this.elements.typingIndicator) {
            this.elements.typingIndicator.classList.add('hidden');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        // Use ErrorHandler if available for consistent error display
        if (this.errorHandler) {
            this.errorHandler.showNotification(message, 'error');
        } else if (this.elements.errorDisplay && this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
            this.elements.errorDisplay.classList.remove('hidden');
        }
    }

    /**
     * Hide error message
     */
    hideError() {
        if (this.elements.errorDisplay) {
            this.elements.errorDisplay.classList.add('hidden');
        }
    }

    /**
     * Show success message
     */
    showSuccessMessage(message) {
        // Create temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm z-50';
        successDiv.innerHTML = `
            <div class="flex items-center space-x-2">
                <i data-lucide="check-circle" class="w-4 h-4"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(successDiv);
        
        // Initialize icon
        if (typeof lucide !== 'undefined') {
            lucide.createIcons(successDiv);
        }
        
        // Remove after 3 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    /**
     * Update UI state based on processing status
     */
    updateUIState() {
        this.elements.sendButton.disabled = this.isProcessing || !this.elements.chatInput.value.trim();
        this.elements.chatInput.disabled = this.isProcessing;
        this.elements.modeSelector.disabled = this.isProcessing;
    }

    /**
     * Scroll to bottom of chat
     */
    scrollToBottom() {
        // Use smooth scrolling for better UX
        setTimeout(() => {
            if (this.virtualScrollController && this.virtualScrollController.isEnabled) {
                // For virtual scrolling, scroll to the end
                const container = this.elements.chatMessages;
                container.scrollTop = container.scrollHeight;
            } else {
                this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
            }
        }, 100);
    }

    /**
     * Setup auto-resize for textarea
     */
    setupAutoResize() {
        this.elements.chatInput.addEventListener('input', () => {
            this.elements.chatInput.style.height = 'auto';
            this.elements.chatInput.style.height = Math.min(this.elements.chatInput.scrollHeight, 128) + 'px';
        });
    }

    /**
     * Load conversation history
     */
    async loadConversationHistory() {
        try {
            if (!this.conversationStorage) {
                return;
            }
            
            // Get or create active conversation
            let activeConversation = this.conversationStorage.getActiveConversation();
            
            if (!activeConversation) {
                activeConversation = this.conversationStorage.createConversation({
                    mode: 'general',
                    subject: 'UPSC Preparation',
                    topic: 'General Discussion'
                });
            }
            
            this.currentConversationId = activeConversation.id;
            
            // Load recent messages (skip welcome message)
            const messages = activeConversation.messages.slice(-10);
            
            for (const message of messages) {
                if (message.role !== 'system') {
                    this.addMessage(message.role, message.content, message.metadata || {});
                }
            }
            
        } catch (error) {
            console.error('Failed to load conversation history:', error);
        }
    }

    /**
     * Set API key for AI service
     */
    setAPIKey(apiKey) {
        if (this.aiServiceManager && apiKey) {
            this.aiServiceManager.apiClient = new GeminiAPIClient(apiKey);
            console.log('API key configured for AI service');
        }
    }

    /**
     * Check if AI service is ready
     */
    isAIServiceReady() {
        return this.aiServiceManager && this.aiServiceManager.isReady();
    }

    /**
     * Set up UI performance optimizations
     */
    setupUIOptimizations() {
        try {
            // Set up progressive loading for conversation history
            this.progressiveLoadController = this.uiOptimizer.enableProgressiveLoading(
                this.elements.chatMessages,
                this.loadMoreMessages.bind(this),
                {
                    threshold: 100,
                    initialLoad: false,
                    renderItem: this.renderMessageElement.bind(this)
                }
            );
            
            // Set up virtual scrolling if we have many messages
            if (this.messageElements.length >= this.uiOptimizer.config.virtualScrollThreshold) {
                this.enableVirtualScrolling();
            }
            
            console.log('UI optimizations set up successfully');
        } catch (error) {
            console.error('Failed to set up UI optimizations:', error);
        }
    }

    /**
     * Enable virtual scrolling for messages
     */
    enableVirtualScrolling() {
        this.virtualScrollController = this.uiOptimizer.enableVirtualScrolling(
            this.elements.chatMessages,
            this.messageElements,
            this.renderMessageElement.bind(this)
        );
    }

    /**
     * Update virtual scrolling when messages change
     */
    updateVirtualScrolling() {
        if (this.virtualScrollController && this.virtualScrollController.isEnabled) {
            // Check if we need to enable virtual scrolling
            if (this.messageElements.length >= this.uiOptimizer.config.virtualScrollThreshold) {
                this.virtualScrollController.items = this.messageElements;
                this.uiOptimizer.updateVirtualScrolling(this.virtualScrollController);
            }
        } else if (this.messageElements.length >= this.uiOptimizer.config.virtualScrollThreshold) {
            // Enable virtual scrolling if we've reached the threshold
            this.enableVirtualScrolling();
        }
    }

    /**
     * Render message element for virtual scrolling
     * @param {Object} messageData - Message data
     * @param {number} index - Message index
     * @returns {HTMLElement} Message element
     */
    renderMessageElement(messageData, index) {
        return this.createMessageElement(messageData.role, messageData.content, messageData.metadata);
    }

    /**
     * Add message with optimistic UI update
     * @param {Object} messageData - Message data
     */
    addMessageOptimistically(messageData) {
        const messageElement = this.createMessageElement(messageData.role, messageData.content, messageData.metadata);
        
        // Create optimistic update
        const updateId = `msg_${messageData.id}`;
        const optimisticUpdate = this.uiOptimizer.createOptimisticUpdate(
            updateId,
            messageElement,
            (element) => {
                // Add pending state styling
                element.classList.add('message-pending');
                this.elements.chatMessages.appendChild(element);
                this.scrollToBottom();
            },
            (element) => {
                // Rollback: remove the message
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }
        );
        
        // Auto-confirm after a short delay (simulating successful send)
        setTimeout(() => {
            optimisticUpdate.confirm();
        }, 100);
    }

    /**
     * Add message with progressive enhancement
     * @param {Object} messageData - Message data
     */
    addMessageWithProgressive(messageData) {
        const messageElement = this.createMessageElement(messageData.role, messageData.content, messageData.metadata);
        
        // Add with fade-in animation
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(20px)';
        
        this.elements.chatMessages.appendChild(messageElement);
        
        // Animate in
        requestAnimationFrame(() => {
            messageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        });
        
        this.scrollToBottom();
    }

    /**
     * Load more messages for progressive loading
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     * @returns {Promise<Object>} Load result
     */
    async loadMoreMessages(page, limit) {
        try {
            if (!this.conversationStorage || !this.currentConversationId) {
                return { items: [], hasMore: false };
            }
            
            // Simulate loading delay for better UX
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Get older messages
            const offset = page * limit;
            const conversation = this.conversationStorage.loadConversation(this.currentConversationId);
            
            if (!conversation || !conversation.messages) {
                return { items: [], hasMore: false };
            }
            
            const totalMessages = conversation.messages.length;
            const startIndex = Math.max(0, totalMessages - offset - limit);
            const endIndex = totalMessages - offset;
            
            const messages = conversation.messages.slice(startIndex, endIndex);
            const hasMore = startIndex > 0;
            
            return {
                items: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    metadata: msg.metadata || {},
                    timestamp: msg.timestamp,
                    id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
                })),
                hasMore: hasMore
            };
        } catch (error) {
            console.error('Error loading more messages:', error);
            return { items: [], hasMore: false };
        }
    }

    /**
     * Scroll to bottom with smooth animation
     */
    scrollToBottomSmooth() {
        if (this.virtualScrollController && this.virtualScrollController.isEnabled) {
            // For virtual scrolling, scroll to the end
            const container = this.elements.chatMessages;
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        } else {
            // Regular smooth scroll
            this.elements.chatMessages.scrollTo({
                top: this.elements.chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Get UI performance metrics
     * @returns {Object} Performance metrics
     */
    getUIPerformanceMetrics() {
        return {
            ...this.uiOptimizer.getPerformanceMetrics(),
            totalMessages: this.messageElements.length,
            virtualScrollingEnabled: this.virtualScrollController?.isEnabled || false,
            progressiveLoadingEnabled: this.progressiveLoadController?.isEnabled || false
        };
    }

    /**
     * Optimize chat performance
     */
    optimizeChatPerformance() {
        // Clean up old message elements if we have too many
        const maxMessages = 200;
        if (this.messageElements.length > maxMessages) {
            const toRemove = this.messageElements.length - maxMessages;
            this.messageElements.splice(0, toRemove);
            
            // Re-render if virtual scrolling is enabled
            if (this.virtualScrollController && this.virtualScrollController.isEnabled) {
                this.uiOptimizer.updateVirtualScrolling(this.virtualScrollController);
            }
        }
        
        // Clear optimistic updates older than 30 seconds
        const thirtySecondsAgo = Date.now() - 30000;
        for (const [id, update] of this.uiOptimizer.optimisticUpdates) {
            if (update.timestamp < thirtySecondsAgo) {
                this.uiOptimizer.rollbackOptimisticUpdate(id);
            }
        }
    }
}

// Initialize chat interface when DOM is loaded
let chatInterface;

document.addEventListener('DOMContentLoaded', function() {
    try {
        chatInterface = new ChatInterface();
        window.chatInterface = chatInterface; // Make globally available
    } catch (error) {
        console.error('Failed to initialize chat interface:', error);
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatInterface;
}