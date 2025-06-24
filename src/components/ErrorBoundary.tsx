import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

/**
 * ErrorBoundary component để bắt và xử lý lỗi React
 * Cải thiện UX bằng cách hiển thị UI thân thiện thay vì crash app
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Cập nhật state để hiển thị fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log lỗi để debug
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo: errorInfo?.componentStack || '',
    });

    // Có thể gửi lỗi lên crash reporting service ở đây
    // crashlytics().recordError(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Hiển thị custom fallback UI nếu có
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Hiển thị default error UI
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Card style={styles.errorCard}>
              <Card.Content>
                <Text style={styles.errorTitle}>Oops! Có lỗi xảy ra</Text>
                <Text style={styles.errorMessage}>
                  Ứng dụng gặp sự cố không mong muốn. Vui lòng thử lại hoặc khởi động lại ứng dụng.
                </Text>
                
                {__DEV__ && this.state.error && (
                  <View style={styles.debugInfo}>
                    <Text style={styles.debugTitle}>Debug Info:</Text>
                    <Text style={styles.debugText}>{this.state.error.message}</Text>
                    {this.state.errorInfo && (
                      <Text style={styles.debugText}>{this.state.errorInfo}</Text>
                    )}
                  </View>
                )}
                
                <Button
                  mode="contained"
                  onPress={this.handleRetry}
                  style={styles.retryButton}
                >
                  Thử lại
                </Button>
              </Card.Content>
            </Card>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  errorCard: {
    padding: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  debugInfo: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  retryButton: {
    marginTop: 8,
  },
});
