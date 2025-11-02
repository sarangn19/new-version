// AI Components Test Runner - Automated test execution for AI components
class AIComponentsTestRunner {
    constructor() {
        this.testResults = new Map();
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
        this.startTime = null;
        this.endTime = null;
    }

    async runAllTests() {
        console.log('🚀 Starting AI Components Test Suite...');
        this.startTime = Date.now();

        try {
            // Test component availability first
            await this.testComponentAvailability();
            
            // Run core component tests
            await this.testGeminiAPIClient();
            await this.testConversationStorage();
            await this.testAIServiceManager();
            
            // Run integration tests
            await this.testIntegration();
            
            // Run error handling tests
            await this.testErrorHandling();
            
            this.endTime = Date.now();
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Test suite execution failed:', error);
            this.logResult('Test Suite', `Execution failed: ${error.message}`, 'error');
        }
    }

    async testComponentAvailability() {
        console.log('📋 Testing component availability...');
        
        const components = [
            { name: 'GeminiAPIClient', class: window.GeminiAPIClient },
            { name: 'ConversationStorage', class: window.ConversationStorage },
            { name: 'AIServiceManager', class: window.AIServiceManager },
            { name: 'ValidationSystem', class: window.ValidationSystem }
        ];

        for (const component of components) {
            if (component.class && typeof component.class === 'function') {
                this.logResult('Component Availability', `${component.name} is available`, 'success');
            } else {
                this.logResult('Component Availability', `${component.name} is NOT available`, 'error');
            }
        }
    }

    async testGeminiAPIClient() {
        console.log('🤖 Testing Gemini API Client...');
        
        try {
            // Test constructor
            const client = new GeminiAPIClient('test-api-key', {
                model: 'gemini-pro',
                maxTokens: 1024,
                temperature: 0.7
            });
            this.logResult('GeminiAPIClient', 'Constructor initialization', 'success');

            // Test configuration
            if (client.config && client.config.model === 'gemini-pro') {
                this.logResult('GeminiAPIClient', 'Configuration setup', 'success');
            } else {
                this.logResult('GeminiAPIClient', 'Configuration setup', 'error');
            }

            // Test request formatting
            const testPrompt = "Test prompt for formatting";
            const formattedRequest = client.formatRequest(testPrompt, {});
            if (formattedRequest && formattedRequest.contents && Array.isArray(formattedRequest.contents)) {
                this.logResult('GeminiAPIClient', 'Request formatting', 'success');
            } else {
                this.logResult('GeminiAPIClient', 'Request formatting', 'error');
            }

            // Test method availability
            const requiredMethods = ['generateContent', 'validateResponse', 'handleAPIError', 'retryRequest'];
            for (const method of requiredMethods) {
                if (typeof client[method] === 'function') {
                    this.logResult('GeminiAPIClient', `Method ${method} exists`, 'success');
                } else {
                    this.logResult('GeminiAPIClient', `Method ${method} missing`, 'error');
                }
            }

        } catch (error) {
            this.logResult('GeminiAPIClient', `Test failed: ${error.message}`, 'error');
        }
    }

    async testConversationStorage() {
        console.log('💾 Testing Conversation Storage...');
        
        try {
            // Test constructor
            const storage = new ConversationStorage({
                storagePrefix: 'test_runner_',
                maxConversations: 10,
                retentionDays: 7
            });
            this.logResult('ConversationStorage', 'Constructor initialization', 'success');

            // Test conversation creation
            const conversation = storage.createConversation({
                mode: 'general',
                subject: 'test-subject',
                userId: 'test-user'
            });
            
            if (conversation && conversation.id && conversation.mode === 'general') {
                this.logResult('ConversationStorage', 'Conversation creation', 'success');
            } else {
                this.logResult('ConversationStorage', 'Conversation creation', 'error');
            }

            // Test message addition
            const message = storage.addMessage(conversation.id, {
                role: 'user',
                content: 'Test message content',
                metadata: { testFlag: true }
            });
            
            if (message && message.id && message.role === 'user') {
                this.logResult('ConversationStorage', 'Message addition', 'success');
            } else {
                this.logResult('ConversationStorage', 'Message addition', 'error');
            }

            // Test conversation retrieval
            const retrievedConversation = storage.loadConversation(conversation.id);
            if (retrievedConversation && retrievedConversation.messages.length > 0) {
                this.logResult('ConversationStorage', 'Conversation retrieval', 'success');
            } else {
                this.logResult('ConversationStorage', 'Conversation retrieval', 'error');
            }

            // Test conversation history
            const history = storage.getConversationHistory(conversation.id);
            if (Array.isArray(history) && history.length > 0) {
                this.logResult('ConversationStorage', 'Conversation history', 'success');
            } else {
                this.logResult('ConversationStorage', 'Conversation history', 'error');
            }

            // Test conversation listing
            const conversations = storage.listConversations({ limit: 5 });
            if (Array.isArray(conversations)) {
                this.logResult('ConversationStorage', 'Conversation listing', 'success');
            } else {
                this.logResult('ConversationStorage', 'Conversation listing', 'error');
            }

            // Test storage statistics
            const stats = storage.getStorageStats();
            if (stats && typeof stats.conversationCount === 'number') {
                this.logResult('ConversationStorage', 'Storage statistics', 'success');
            } else {
                this.logResult('ConversationStorage', 'Storage statistics', 'error');
            }

            // Cleanup test data
            storage.deleteConversation(conversation.id);
            this.logResult('ConversationStorage', 'Cleanup operations', 'success');

        } catch (error) {
            this.logResult('ConversationStorage', `Test failed: ${error.message}`, 'error');
        }
    }

    async testAIServiceManager() {
        console.log('🧠 Testing AI Service Manager...');
        
        try {
            // Test constructor
            const aiService = new AIServiceManager('test-api-key', {
                maxContextWindow: 10,
                defaultMode: 'general',
                autoSaveResponses: true
            });
            this.logResult('AIServiceManager', 'Constructor initialization', 'success');

            // Test mode configurations
            const expectedModes = ['general', 'mcq', 'essay', 'news'];
            let allModesPresent = true;
            
            for (const mode of expectedModes) {
                if (!aiService.modeConfigs[mode]) {
                    allModesPresent = false;
                    break;
                }
            }
            
            if (allModesPresent) {
                this.logResult('AIServiceManager', 'Mode configurations', 'success');
            } else {
                this.logResult('AIServiceManager', 'Mode configurations', 'error');
            }

            // Test mode switching
            aiService.setMode('mcq');
            if (aiService.currentMode === 'mcq') {
                this.logResult('AIServiceManager', 'Mode switching', 'success');
            } else {
                this.logResult('AIServiceManager', 'Mode switching', 'error');
            }

            // Test context management
            aiService.addContext('subject', 'History');
            aiService.addContext('topic', 'Ancient India');
            
            if (aiService.conversationContext.size > 0) {
                this.logResult('AIServiceManager', 'Context management', 'success');
            } else {
                this.logResult('AIServiceManager', 'Context management', 'error');
            }

            // Test method availability
            const requiredMethods = ['sendMessage', 'setMode', 'addContext', 'clearContext', 'getConversationHistory'];
            for (const method of requiredMethods) {
                if (typeof aiService[method] === 'function') {
                    this.logResult('AIServiceManager', `Method ${method} exists`, 'success');
                } else {
                    this.logResult('AIServiceManager', `Method ${method} missing`, 'error');
                }
            }

        } catch (error) {
            this.logResult('AIServiceManager', `Test failed: ${error.message}`, 'error');
        }
    }

    async testIntegration() {
        console.log('🔗 Testing component integration...');
        
        try {
            // Test AI Service Manager with Conversation Storage integration
            const aiService = new AIServiceManager('test-api-key');
            aiService.conversationStorage = new ConversationStorage({
                storagePrefix: 'integration_test_'
            });

            if (aiService.conversationStorage) {
                this.logResult('Integration', 'AI Service + Conversation Storage', 'success');
            } else {
                this.logResult('Integration', 'AI Service + Conversation Storage', 'error');
            }

            // Test conversation creation through AI service
            const conversation = aiService.conversationStorage.createConversation({
                mode: 'general',
                subject: 'integration-test'
            });

            if (conversation && conversation.id) {
                this.logResult('Integration', 'Conversation creation via AI service', 'success');
            } else {
                this.logResult('Integration', 'Conversation creation via AI service', 'error');
            }

            // Test mode switching with conversation context
            aiService.setMode('essay');
            const context = aiService.conversationStorage.getConversationContext(conversation.id);
            
            if (context && aiService.currentMode === 'essay') {
                this.logResult('Integration', 'Mode switching with context preservation', 'success');
            } else {
                this.logResult('Integration', 'Mode switching with context preservation', 'error');
            }

            // Cleanup
            aiService.conversationStorage.deleteConversation(conversation.id);

        } catch (error) {
            this.logResult('Integration', `Test failed: ${error.message}`, 'error');
        }
    }

    async testErrorHandling() {
        console.log('⚠️ Testing error handling and retry mechanisms...');
        
        try {
            // Test Gemini API Client error handling
            const client = new GeminiAPIClient('invalid-key');
            
            // Test response validation
            const invalidResponse = null;
            const validationResult = client.validateResponse(invalidResponse);
            if (!validationResult) {
                this.logResult('Error Handling', 'Invalid response validation', 'success');
            } else {
                this.logResult('Error Handling', 'Invalid response validation', 'error');
            }

            // Test conversation storage error handling
            const storage = new ConversationStorage();
            
            try {
                storage.addMessage('non-existent-conversation', {
                    role: 'user',
                    content: 'This should fail'
                });
                this.logResult('Error Handling', 'Storage error handling', 'error');
            } catch (expectedError) {
                this.logResult('Error Handling', 'Storage error handling', 'success');
            }

            // Test method existence for error handling
            const errorMethods = [
                { obj: client, method: 'handleAPIError' },
                { obj: client, method: 'retryRequest' },
                { obj: client, method: 'handleRateLimit' }
            ];

            for (const { obj, method } of errorMethods) {
                if (typeof obj[method] === 'function') {
                    this.logResult('Error Handling', `${method} method exists`, 'success');
                } else {
                    this.logResult('Error Handling', `${method} method missing`, 'error');
                }
            }

        } catch (error) {
            this.logResult('Error Handling', `Test failed: ${error.message}`, 'error');
        }
    }

    logResult(category, test, status) {
        this.totalTests++;
        
        if (status === 'success') {
            this.passedTests++;
        } else if (status === 'error') {
            this.failedTests++;
        }

        const result = {
            category,
            test,
            status,
            timestamp: new Date().toISOString()
        };

        if (!this.testResults.has(category)) {
            this.testResults.set(category, []);
        }
        this.testResults.get(category).push(result);

        // Log to console with appropriate emoji
        const emoji = status === 'success' ? '✅' : status === 'error' ? '❌' : 'ℹ️';
        console.log(`${emoji} [${category}] ${test}: ${status.toUpperCase()}`);
    }

    generateReport() {
        const duration = this.endTime - this.startTime;
        const passRate = this.totalTests > 0 ? ((this.passedTests / this.totalTests) * 100).toFixed(1) : 0;

        console.log('\n📊 AI Components Test Report');
        console.log('═'.repeat(50));
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log(`📈 Total Tests: ${this.totalTests}`);
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`📊 Pass Rate: ${passRate}%`);
        console.log('═'.repeat(50));

        // Detailed results by category
        for (const [category, results] of this.testResults) {
            const categoryPassed = results.filter(r => r.status === 'success').length;
            const categoryTotal = results.length;
            const categoryRate = categoryTotal > 0 ? ((categoryPassed / categoryTotal) * 100).toFixed(1) : 0;
            
            console.log(`\n📋 ${category}: ${categoryPassed}/${categoryTotal} (${categoryRate}%)`);
            
            // Show failed tests
            const failedTests = results.filter(r => r.status === 'error');
            if (failedTests.length > 0) {
                console.log('   Failed tests:');
                failedTests.forEach(test => {
                    console.log(`   ❌ ${test.test}`);
                });
            }
        }

        // Overall status
        if (this.failedTests === 0) {
            console.log('\n🎉 All tests passed! AI components are ready for use.');
        } else {
            console.log(`\n⚠️  ${this.failedTests} test(s) failed. Please review the implementation.`);
        }

        return {
            totalTests: this.totalTests,
            passedTests: this.passedTests,
            failedTests: this.failedTests,
            passRate: parseFloat(passRate),
            duration,
            results: this.testResults
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIComponentsTestRunner;
} else if (typeof window !== 'undefined') {
    window.AIComponentsTestRunner = AIComponentsTestRunner;
}

// Auto-run if loaded directly in browser
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for AI components to load
        setTimeout(async () => {
            if (window.GeminiAPIClient && window.ConversationStorage && window.AIServiceManager) {
                console.log('🚀 Auto-running AI Components Test Suite...');
                const runner = new AIComponentsTestRunner();
                await runner.runAllTests();
            } else {
                console.log('⚠️ AI components not fully loaded. Skipping auto-run.');
            }
        }, 2000); // Wait 2 seconds for components to initialize
    });
}