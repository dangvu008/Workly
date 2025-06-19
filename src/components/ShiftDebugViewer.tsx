/**
 * 🔍 Component hiển thị debug logs cho shift application
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Share } from 'react-native';
import { Card, Text, Button, useTheme, Chip, Divider } from 'react-native-paper';
import { ShiftDebugLogger, DebugLogEntry } from '../utils/shiftDebugLogger';
import { SPACING, BORDER_RADIUS } from '../constants/themes';

export function ShiftDebugViewer() {
  const theme = useTheme();
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    // Load initial logs
    setLogs(ShiftDebugLogger.getLogs());

    // Subscribe to log updates
    const unsubscribe = ShiftDebugLogger.subscribe((newLogs) => {
      setLogs(newLogs);
    });

    return unsubscribe;
  }, []);

  const categories = ['all', 'shift_change', 'notification', 'cleanup', 'validation', 'timing'];
  
  const filteredLogs = selectedCategory === 'all' 
    ? logs 
    : logs.filter(log => log.category === selectedCategory);

  const getLogIcon = (log: DebugLogEntry): string => {
    if (log.level === 'error') return '❌';
    if (log.level === 'warning') return '⚠️';
    if (log.level === 'success') return '✅';

    switch (log.category) {
      case 'shift_change': return '🔄';
      case 'notification': return '🔔';
      case 'cleanup': return '🧹';
      case 'validation': return '🔍';
      case 'timing': return '⏰';
      default: return 'ℹ️';
    }
  };

  const getLogColor = (log: DebugLogEntry): string => {
    switch (log.level) {
      case 'error': return theme.colors.error;
      case 'warning': return theme.colors.secondary;
      case 'success': return theme.colors.primary;
      default: return theme.colors.onSurface;
    }
  };

  const handleClearLogs = () => {
    ShiftDebugLogger.clearLogs();
  };

  const handleExportLogs = async () => {
    try {
      const logsText = ShiftDebugLogger.exportLogsAsText();
      await Share.share({
        message: logsText,
        title: 'Shift Debug Logs',
      });
    } catch (error) {
      console.error('Error sharing logs:', error);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          🔍 Shift Debug Logs ({logs.length})
        </Text>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
          {categories.map(category => (
            <Chip
              key={category}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
              style={styles.categoryChip}
            >
              {category === 'all' ? 'All' : category.replace('_', ' ')}
            </Chip>
          ))}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={handleClearLogs}
            style={styles.actionButton}
            icon="delete"
          >
            Clear
          </Button>
          <Button
            mode="outlined"
            onPress={handleExportLogs}
            style={styles.actionButton}
            icon="share"
          >
            Export
          </Button>
        </View>

        <Divider style={styles.divider} />

        {/* Logs List */}
        <ScrollView style={styles.logsContainer} showsVerticalScrollIndicator={false}>
          {filteredLogs.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No logs available. Perform some actions to see debug information.
            </Text>
          ) : (
            filteredLogs.map((log, index) => (
              <View key={index} style={styles.logEntry}>
                <View style={styles.logHeader}>
                  <Text style={styles.logIcon}>{getLogIcon(log)}</Text>
                  <Text style={[styles.logTimestamp, { color: theme.colors.onSurfaceVariant }]}>
                    {formatTimestamp(log.timestamp)}
                  </Text>
                  <Chip size="small" style={styles.categoryTag}>
                    {log.category}
                  </Chip>
                </View>
                
                <Text style={[styles.logMessage, { color: getLogColor(log) }]}>
                  {log.message}
                </Text>
                
                {log.data && (
                  <View style={[styles.logData, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Text style={[styles.logDataText, { color: theme.colors.onSurfaceVariant }]}>
                      {JSON.stringify(log.data, null, 2)}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    maxHeight: 600,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  categoryContainer: {
    marginBottom: SPACING.md,
  },
  categoryChip: {
    marginRight: SPACING.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  divider: {
    marginBottom: SPACING.md,
  },
  logsContainer: {
    maxHeight: 300,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    padding: SPACING.lg,
  },
  logEntry: {
    marginBottom: SPACING.md,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  logIcon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  logTimestamp: {
    fontSize: 12,
    marginRight: SPACING.sm,
    fontFamily: 'monospace',
  },
  categoryTag: {
    height: 24,
  },
  logMessage: {
    fontSize: 14,
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
  logData: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.xs,
    marginTop: SPACING.xs,
  },
  logDataText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});
