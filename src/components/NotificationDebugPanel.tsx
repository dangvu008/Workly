/**
 * 🔧 Debug Panel cho Notifications
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, useTheme, Divider } from 'react-native-paper';
import { notificationScheduler } from '../services/notificationScheduler';
import { useApp } from '../contexts/AppContext';
import { useShiftDebug } from '../hooks/useShiftDebug';
import { ShiftDebugViewer } from './ShiftDebugViewer';
import { SPACING, BORDER_RADIUS } from '../constants/themes';

export function NotificationDebugPanel() {
  const theme = useTheme();
  const { state } = useApp();
  const shiftDebug = useShiftDebug();
  const [debugOutput, setDebugOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showShiftDebug, setShowShiftDebug] = useState(false);

  const addToOutput = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugOutput(prev => `${prev}\n[${timestamp}] ${message}`);
  };

  const clearOutput = () => {
    setDebugOutput('');
  };

  const testCleanup = async () => {
    setIsLoading(true);
    try {
      addToOutput('🧹 Starting cleanup test...');
      await notificationScheduler.cleanupAllNotifications();
      addToOutput('✅ Cleanup completed');
    } catch (error) {
      addToOutput(`❌ Cleanup error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testScheduling = async () => {
    if (!state.activeShift) {
      addToOutput('❌ No active shift to test');
      return;
    }

    setIsLoading(true);
    try {
      addToOutput(`📅 Testing scheduling for: ${state.activeShift.name}`);
      await notificationScheduler.scheduleShiftNotifications(state.activeShift);
      addToOutput('✅ Scheduling completed');
    } catch (error) {
      addToOutput(`❌ Scheduling error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const debugScheduled = async () => {
    setIsLoading(true);
    try {
      addToOutput('📋 Checking scheduled notifications...');
      
      // Capture console output
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog(...args);
      };

      await notificationScheduler.debugScheduledNotifications();

      // Restore console.log
      console.log = originalLog;

      // Add captured logs to output
      logs.forEach(log => addToOutput(log));
      
      addToOutput('✅ Debug completed');
    } catch (error) {
      addToOutput(`❌ Debug error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFullCycle = async () => {
    if (!state.activeShift) {
      addToOutput('❌ No active shift to test');
      return;
    }

    setIsLoading(true);
    try {
      addToOutput('🔄 Starting full test cycle...');
      
      // 1. Cleanup
      addToOutput('Step 1: Cleanup');
      await notificationScheduler.cleanupAllNotifications();
      
      // 2. Schedule
      addToOutput('Step 2: Schedule');
      await notificationScheduler.scheduleShiftNotifications(state.activeShift);
      
      // 3. Debug
      addToOutput('Step 3: Debug');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a bit
      
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog(...args);
      };

      await notificationScheduler.debugScheduledNotifications();
      console.log = originalLog;
      
      logs.forEach(log => addToOutput(log));
      addToOutput('✅ Full cycle completed');
    } catch (error) {
      addToOutput(`❌ Full cycle error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          🔧 Notification Debug Panel
        </Text>
        
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Active Shift: {state.activeShift?.name || 'None'}
        </Text>

        <Divider style={styles.divider} />

        <View style={styles.buttonRow}>
          <Button
            mode="outlined"
            onPress={testCleanup}
            disabled={isLoading}
            style={styles.button}
          >
            🧹 Test Cleanup
          </Button>
          
          <Button
            mode="outlined"
            onPress={testScheduling}
            disabled={isLoading || !state.activeShift}
            style={styles.button}
          >
            📅 Test Schedule
          </Button>
        </View>

        <View style={styles.buttonRow}>
          <Button
            mode="outlined"
            onPress={debugScheduled}
            disabled={isLoading}
            style={styles.button}
          >
            📋 Debug Scheduled
          </Button>
          
          <Button
            mode="contained"
            onPress={testFullCycle}
            disabled={isLoading || !state.activeShift}
            style={styles.button}
          >
            🔄 Full Test
          </Button>
        </View>

        {/* Shift Debug Controls */}
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Shift Debug Tests:
        </Text>

        <View style={styles.buttonRow}>
          <Button
            mode="outlined"
            onPress={() => {
              setIsLoading(true);
              shiftDebug.testWithNightShift().finally(() => setIsLoading(false));
            }}
            disabled={isLoading}
            style={styles.button}
          >
            🌙 Night Shift
          </Button>

          <Button
            mode="outlined"
            onPress={() => {
              setIsLoading(true);
              shiftDebug.testWithDayShift().finally(() => setIsLoading(false));
            }}
            disabled={isLoading}
            style={styles.button}
          >
            ☀️ Day Shift
          </Button>
        </View>

        <View style={styles.buttonRow}>
          <Button
            mode="outlined"
            onPress={() => {
              setIsLoading(true);
              shiftDebug.testFullCycle().finally(() => setIsLoading(false));
            }}
            disabled={isLoading || !state.activeShift}
            style={styles.button}
          >
            🔄 Full Cycle
          </Button>

          <Button
            mode="outlined"
            onPress={shiftDebug.clearDebugLogs}
            disabled={isLoading}
            style={styles.button}
          >
            🗑️ Clear Debug
          </Button>
        </View>

        <View style={styles.buttonRow}>
          <Button
            mode="text"
            onPress={clearOutput}
            disabled={isLoading}
            style={styles.button}
          >
            🗑️ Clear Output
          </Button>

          <Button
            mode="text"
            onPress={() => setShowShiftDebug(!showShiftDebug)}
            style={styles.button}
          >
            {showShiftDebug ? '📋 Hide' : '🔍 Show'} Shift Debug
          </Button>
        </View>

        <Divider style={styles.divider} />

        <Text style={[styles.outputTitle, { color: theme.colors.onSurface }]}>
          Debug Output:
        </Text>
        
        <ScrollView style={styles.outputContainer}>
          <Text style={[styles.output, { color: theme.colors.onSurfaceVariant }]}>
            {debugOutput || 'No output yet. Run a test to see results.'}
          </Text>
        </ScrollView>
      </Card.Content>

      {/* Shift Debug Viewer */}
      {showShiftDebug && <ShiftDebugViewer />}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: SPACING.md,
  },
  divider: {
    marginVertical: SPACING.md,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  button: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  outputTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  outputContainer: {
    maxHeight: 200,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  output: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});
