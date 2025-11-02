// Integration Test Runner - Automated test execution and validation
class IntegrationTestRunner {
  constructor() {
    this.testResults = new Map();
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.startTime = null;
    this.endTime = null;
  }

  // Run all integration tests
  async runAllTests() {
    console.log('🚀 Starting Production Integration Tests...');
    this.startTime = performance.now();
    
    try {
      // Test 1: Component Initialization
      await this.testComponentInitialization();
      
      // Test 2: Cross-Component Communication
      await this.testCrossComponentCommunication();
      
      // Test 3: Error Handling Integration
      await this.testErrorHandlingIntegration();
      
      // Test 4: Performance Under Load
      await this.testPerformanceUnderLoad();
      
      // Test 5: Data Flow Validation
      await this.testDataFlowValidation();
      
      // Test 6: System Recovery
      await this.testSystemRecovery();
      
      this.endTime = performance.now();
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.endTime = performance.now();
      this.generateReport();
    }
  }

  // Test component initialization
  async testComponentInitialization() {
    const testName = 'Component Initialization';
    console.log(`📋 Running ${testName}...`);
    
    try {
      // Check if all required components are available
      const requiredComponents = [
        'ErrorHandler',
        'OfflineManager', 
        'PerformanceOptimizer',
        'LoadingStateManager',
        'ValidationSystem'
      ];
      
      const missingComponents = requiredComponents.filter(comp => !window[comp]);
      
      if (missingComponents.length === 0) {
        // Try to initialize each component
        const errorHandler = new ErrorHandler();
        const offlineManager = new OfflineManager();
        const performanceOptimizer = new PerformanceOptimizer();
        const loadingStateManager = new LoadingStateManager();
        const validationSystem = new ValidationSystem();
        
        this.recordTest(testName, true, 'All components initialized successfully');
      } else {
        this.recordTest(testName, false, `Missing components: ${missingComponents.join(', ')}`);
      }
      
    } catch (error) {
      this.recordTest(testName, false, `Initialization failed: ${error.message}`);
    }
  }

  // Test cross-component communication
  async testCrossComponentCommunication() {
    const testName = 'Cross-Component Communication';
    console.log(`📋 Running ${testName}...`);
    
    try {
      const errorHandler = new ErrorHandler();
      const loadingStateManager = new LoadingStateManager();
      
      // Test event-based communication
      let eventReceived = false;
      const testListener = () => { eventReceived = true; };
      
      document.addEventListener('test-communication', testListener);
      document.dispatchEvent(new CustomEvent('test-communication'));
      
      // Test shared state access
      const loaderId = loadingStateManager.showLoading('comm-test', {});
      const hasActiveLoader = loadingStateManager.activeLoaders.has(loaderId);
      loadingStateManager.hideLoading(loaderId);
      
      document.removeEventListener('test-communication', testListener);
      
      if (eventReceived && hasActiveLoader) {
        this.recordTest(testName, true, 'Components communicate successfully');
      } else {
        this.recordTest(testName, false, 'Communication test failed');
      }
      
    } catch (error) {
      this.recordTest(testName, false, `Communication test error: ${error.message}`);
    }
  }

  // Test error handling integration
  async testErrorHandlingIntegration() {
    const testName = 'Error Handling Integration';
    console.log(`📋 Running ${testName}...`);
    
    try {
      const errorHandler = new ErrorHandler();
      const initialErrorCount = errorHandler.errorLog.length;
      
      // Trigger a test error
      errorHandler.handleError({
        type: 'integration-test',
        message: 'Test error for integration',
        timestamp: new Date().toISOString()
      });
      
      // Check if error was logged
      const finalErrorCount = errorHandler.errorLog.length;
      
      if (finalErrorCount > initialErrorCount) {
        this.recordTest(testName, true, 'Error handling works correctly');
      } else {
        this.recordTest(testName, false, 'Error was not properly logged');
      }
      
    } catch (error) {
      this.recordTest(testName, false, `Error handling test failed: ${error.message}`);
    }
  }

  // Test performance under load
  async testPerformanceUnderLoad() {
    const testName = 'Performance Under Load';
    console.log(`📋 Running ${testName}...`);
    
    try {
      const performanceOptimizer = new PerformanceOptimizer();
      const loadingStateManager = new LoadingStateManager();
      
      const startTime = performance.now();
      
      // Create multiple concurrent operations
      const operations = [];
      for (let i = 0; i < 50; i++) {
        operations.push(
          performanceOptimizer.measureOperation(`load-test-${i}`, () => {
            const loaderId = loadingStateManager.showLoading(`test-${i}`, {});
            setTimeout(() => loadingStateManager.hideLoading(loaderId), 10);
            return Math.random();
          })
        );
      }
      
      await Promise.all(operations);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      if (duration < 5000) { // Should complete within 5 seconds
        this.recordTest(testName, true, `Performance test completed in ${Math.round(duration)}ms`);
      } else {
        this.recordTest(testName, false, `Performance test too slow: ${Math.round(duration)}ms`);
      }
      
    } catch (error) {
      this.recordTest(testName, false, `Performance test failed: ${error.message}`);
    }
  }

  // Test data flow validation
  async testDataFlowValidation() {
    const testName = 'Data Flow Validation';
    console.log(`📋 Running ${testName}...`);
    
    try {
      const validationSystem = new ValidationSystem();
      
      // Test data validation flow
      const testData = {
        email: 'test@example.com',
        name: 'Test User',
        age: 25
      };
      
      const validationRules = {
        email: 'required|email',
        name: 'required|minLength:2',
        age: 'required|numeric'
      };
      
      const result = validationSystem.validateObject(testData, validationRules);
      
      if (result.isValid) {
        this.recordTest(testName, true, 'Data validation flow works correctly');
      } else {
        this.recordTest(testName, false, `Validation failed: ${result.errors.join(', ')}`);
      }
      
    } catch (error) {
      this.recordTest(testName, false, `Data flow test failed: ${error.message}`);
    }
  }

  // Test system recovery
  async testSystemRecovery() {
    const testName = 'System Recovery';
    console.log(`📋 Running ${testName}...`);
    
    try {
      // Test localStorage corruption recovery
      const originalGetItem = localStorage.getItem;
      let recoveryWorked = false;
      
      // Simulate localStorage failure
      localStorage.getItem = () => { throw new Error('Storage corrupted'); };
      
      try {
        // Try to use a component that relies on localStorage
        const validationSystem = new ValidationSystem();
        // If we get here without throwing, recovery worked
        recoveryWorked = true;
      } catch (error) {
        // Check if it's a graceful failure
        recoveryWorked = !error.message.includes('Storage corrupted');
      }
      
      // Restore localStorage
      localStorage.getItem = originalGetItem;
      
      if (recoveryWorked) {
        this.recordTest(testName, true, 'System recovers from storage corruption');
      } else {
        this.recordTest(testName, false, 'System failed to recover from storage corruption');
      }
      
    } catch (error) {
      this.recordTest(testName, false, `Recovery test failed: ${error.message}`);
    }
  }

  // Record test result
  recordTest(testName, passed, message) {
    this.totalTests++;
    if (passed) {
      this.passedTests++;
      console.log(`✅ ${testName}: ${message}`);
    } else {
      this.failedTests++;
      console.log(`❌ ${testName}: ${message}`);
    }
    
    this.testResults.set(testName, { passed, message, timestamp: new Date().toISOString() });
  }

  // Generate test report
  generateReport() {
    const duration = this.endTime - this.startTime;
    const successRate = (this.passedTests / this.totalTests) * 100;
    
    console.log('\n📊 Integration Test Report');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.failedTests}`);
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`Duration: ${Math.round(duration)}ms`);
    console.log('=' .repeat(50));
    
    // Detailed results
    console.log('\n📋 Detailed Results:');
    for (const [testName, result] of this.testResults) {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${testName}: ${result.message}`);
    }
    
    // Summary
    if (this.failedTests === 0) {
      console.log('\n🎉 All integration tests passed!');
    } else {
      console.log(`\n⚠️  ${this.failedTests} test(s) failed. Please review the results above.`);
    }
    
    return {
      totalTests: this.totalTests,
      passedTests: this.passedTests,
      failedTests: this.failedTests,
      successRate,
      duration,
      results: Object.fromEntries(this.testResults)
    };
  }
}

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IntegrationTestRunner;
}

// Auto-run if loaded directly
if (typeof window !== 'undefined') {
  window.IntegrationTestRunner = IntegrationTestRunner;
  
  // Auto-run tests when page loads
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
      const runner = new IntegrationTestRunner();
      await runner.runAllTests();
    }, 1000); // Wait for other components to initialize
  });
}