/**
 * 🧪 Weather Spam Test Screen
 * Component để test và verify rằng spam weather notification đã được khắc phục
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { weatherNotificationTester } from '../utils/weatherNotificationTest';
import { notificationScheduler } from '../services/notificationScheduler';
import { extremeWeatherService } from '../services/extremeWeatherService';

interface TestResult {
  spamTest?: any;
  cleanupTest?: boolean;
  overallPassed?: boolean;
}

export const WeatherSpamTestScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [output, setOutput] = useState<string[]>([]);

  const addToOutput = (message: string) => {
    setOutput(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleRunSpamTest = async () => {
    setIsLoading(true);
    setOutput([]);
    addToOutput('🧪 Starting spam detection test...');

    try {
      const result = await weatherNotificationTester.runSpamDetectionTest();
      addToOutput(`📊 Total notifications: ${result.totalNotifications}`);
      addToOutput(`🌤️ Weather notifications: ${result.weatherNotifications}`);
      addToOutput(`🌪️ Extreme weather notifications: ${result.extremeWeatherNotifications}`);
      addToOutput(`🔄 Duplicate IDs: ${result.duplicateIds.length}`);
      addToOutput(`⚠️ Spam detected: ${result.spamDetected ? 'YES' : 'NO'}`);
      addToOutput(`✅ Test passed: ${result.testPassed ? 'YES' : 'NO'}`);

      setTestResult({ spamTest: result });

      if (result.testPassed) {
        Alert.alert('✅ Test Passed', 'No spam notifications detected!');
      } else {
        Alert.alert('❌ Test Failed', 'Spam patterns detected. Check output for details.');
      }
    } catch (error) {
      addToOutput(`❌ Error: ${error}`);
      Alert.alert('Error', 'Test failed with error. Check output for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunCleanupTest = async () => {
    setIsLoading(true);
    addToOutput('\n🧹 Starting cleanup test...');

    try {
      const result = await weatherNotificationTester.testCleanupFunctionality();
      addToOutput(`🧹 Cleanup test: ${result ? 'PASSED' : 'FAILED'}`);

      setTestResult(prev => ({ ...prev, cleanupTest: result }));

      if (result) {
        Alert.alert('✅ Cleanup Test Passed', 'All weather notifications cleaned up successfully!');
      } else {
        Alert.alert('❌ Cleanup Test Failed', 'Some weather notifications remain after cleanup.');
      }
    } catch (error) {
      addToOutput(`❌ Cleanup error: ${error}`);
      Alert.alert('Error', 'Cleanup test failed with error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunFullTest = async () => {
    setIsLoading(true);
    setOutput([]);
    addToOutput('🚀 Starting full test suite...');

    try {
      const result = await weatherNotificationTester.runFullTestSuite();
      
      addToOutput('\n📊 FINAL RESULTS:');
      addToOutput(`Spam Test: ${result.spamTest.testPassed ? '✅ PASSED' : '❌ FAILED'}`);
      addToOutput(`Cleanup Test: ${result.cleanupTest ? '✅ PASSED' : '❌ FAILED'}`);
      addToOutput(`Overall: ${result.overallPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);

      setTestResult(result);

      if (result.overallPassed) {
        Alert.alert(
          '🎉 All Tests Passed!', 
          'Weather notification spam has been successfully fixed!'
        );
      } else {
        Alert.alert(
          '⚠️ Some Tests Failed', 
          'There are still issues with weather notifications. Check output for details.'
        );
      }
    } catch (error) {
      addToOutput(`❌ Full test error: ${error}`);
      Alert.alert('Error', 'Full test suite failed with error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceCleanup = async () => {
    setIsLoading(true);
    addToOutput('\n🔧 Force cleaning all weather notifications...');

    try {
      await notificationScheduler.cancelAllWeatherWarnings();
      await extremeWeatherService.cancelAllExtremeWeatherChecks();
      addToOutput('✅ Force cleanup completed');
      
      Alert.alert('✅ Force Cleanup', 'All weather notifications have been force cleaned.');
    } catch (error) {
      addToOutput(`❌ Force cleanup error: ${error}`);
      Alert.alert('Error', 'Force cleanup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearOutput = () => {
    setOutput([]);
    setTestResult(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Weather Spam Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleRunSpamTest}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🔍 Test Spam Detection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleRunCleanupTest}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🧹 Test Cleanup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.successButton]}
          onPress={handleRunFullTest}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🚀 Run Full Test</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={handleForceCleanup}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🔧 Force Cleanup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.neutralButton]}
          onPress={clearOutput}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🗑️ Clear Output</Text>
        </TouchableOpacity>
      </View>

      {testResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>📊 Last Test Result:</Text>
          {testResult.overallPassed !== undefined && (
            <Text style={[
              styles.resultText,
              testResult.overallPassed ? styles.successText : styles.errorText
            ]}>
              Overall: {testResult.overallPassed ? '✅ PASSED' : '❌ FAILED'}
            </Text>
          )}
        </View>
      )}

      <ScrollView style={styles.outputContainer}>
        <Text style={styles.outputTitle}>📝 Test Output:</Text>
        {output.map((line, index) => (
          <Text key={index} style={styles.outputText}>
            {line}
          </Text>
        ))}
        {isLoading && (
          <Text style={styles.loadingText}>⏳ Running test...</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#5856D6',
  },
  successButton: {
    backgroundColor: '#34C759',
  },
  warningButton: {
    backgroundColor: '#FF9500',
  },
  neutralButton: {
    backgroundColor: '#8E8E93',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600',
  },
  successText: {
    color: '#34C759',
  },
  errorText: {
    color: '#FF3B30',
  },
  outputContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  outputTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  outputText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
    color: '#666',
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 10,
  },
});
