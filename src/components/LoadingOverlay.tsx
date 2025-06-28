import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
}

/**
 * LoadingOverlay component để hiển thị loading state
 * Cải thiện UX bằng cách cung cấp feedback rõ ràng cho user
 */
export function LoadingOverlay({ 
  visible, 
  message = 'Đang xử lý...', 
  transparent = true 
}: LoadingOverlayProps) {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <Modal
      transparent={transparent}
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={[
        styles.overlay,
        { backgroundColor: transparent ? 'rgba(0, 0, 0, 0.5)' : theme.colors.background }
      ]}>
        <View style={[
          styles.container,
          { backgroundColor: theme.colors.surface }
        ]}>
          <ActivityIndicator 
            size="large" 
            color={theme.colors.primary}
            style={styles.spinner}
          />
          <Text 
            style={[
              styles.message,
              { color: theme.colors.onSurface }
            ]}
          >
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});
