import { Alert } from 'react-native';

/**
 * AlertManager - Quản lý việc hiển thị Alert để tránh hiển thị nhiều Alert cùng lúc
 * Giải quyết vấn đề "notification nhắc nhở nổ ra" khi bấm nút đa năng
 */
class AlertManager {
  private static instance: AlertManager;
  private isAlertVisible = false;
  private alertQueue: Array<() => void> = [];
  private lastAlertTime = 0;
  private readonly ALERT_COOLDOWN = 500; // 500ms cooldown giữa các Alert

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  /**
   * Hiển thị Alert với queue management để tránh overlap
   */
  showAlert(
    title: string, 
    message: string, 
    buttons?: any[], 
    options?: any
  ): Promise<void> {
    return new Promise((resolve) => {
      const showAlertFn = () => {
        const now = Date.now();
        
        // Kiểm tra cooldown
        if (now - this.lastAlertTime < this.ALERT_COOLDOWN) {
          console.log('🚫 AlertManager: Alert skipped due to cooldown');
          resolve();
          return;
        }

        this.isAlertVisible = true;
        this.lastAlertTime = now;

        const wrappedButtons = buttons?.map(button => ({
          ...button,
          onPress: () => {
            this.isAlertVisible = false;
            this.processQueue();
            button.onPress?.();
            resolve();
          }
        })) || [
          {
            text: 'OK',
            onPress: () => {
              this.isAlertVisible = false;
              this.processQueue();
              resolve();
            }
          }
        ];

        Alert.alert(
          title,
          message,
          wrappedButtons,
          {
            ...options,
            onDismiss: () => {
              this.isAlertVisible = false;
              this.processQueue();
              options?.onDismiss?.();
              resolve();
            }
          }
        );
      };

      if (this.isAlertVisible) {
        // Nếu đã có Alert đang hiển thị, thêm vào queue
        console.log('📋 AlertManager: Alert queued');
        this.alertQueue.push(showAlertFn);
      } else {
        // Hiển thị ngay lập tức
        showAlertFn();
      }
    });
  }

  /**
   * Xử lý queue Alert tiếp theo
   */
  private processQueue(): void {
    if (this.alertQueue.length > 0 && !this.isAlertVisible) {
      const nextAlert = this.alertQueue.shift();
      if (nextAlert) {
        // Delay nhỏ để tránh conflict
        setTimeout(nextAlert, 100);
      }
    }
  }

  /**
   * Kiểm tra xem có Alert nào đang hiển thị không
   */
  isShowingAlert(): boolean {
    return this.isAlertVisible;
  }

  /**
   * Xóa tất cả Alert trong queue (dùng khi cần reset)
   */
  clearQueue(): void {
    this.alertQueue = [];
    console.log('🧹 AlertManager: Queue cleared');
  }

  /**
   * Hiển thị Alert lỗi với format chuẩn
   */
  showError(message: string, title: string = 'Lỗi'): Promise<void> {
    return this.showAlert(
      title,
      message,
      [{ text: 'OK', style: 'default' }]
    );
  }

  /**
   * Hiển thị Alert thành công với format chuẩn
   */
  showSuccess(message: string, title: string = 'Thành công'): Promise<void> {
    return this.showAlert(
      title,
      message,
      [{ text: 'OK', style: 'default' }]
    );
  }

  /**
   * Hiển thị Alert xác nhận với format chuẩn
   */
  showConfirm(
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    title: string = 'Xác nhận'
  ): Promise<void> {
    return this.showAlert(
      title,
      message,
      [
        {
          text: 'Hủy',
          style: 'cancel',
          onPress: onCancel
        },
        {
          text: 'Xác nhận',
          style: 'default',
          onPress: onConfirm
        }
      ]
    );
  }
}

// Export singleton instance
export const alertManager = AlertManager.getInstance();
