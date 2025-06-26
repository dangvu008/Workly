import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Vibration, Text } from 'react-native';
import { Button, IconButton, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { FastIcon } from './WorklyIcon';
import { useApp } from '../contexts/AppContext';
import { BUTTON_STATES } from '../constants';
import { storageService } from '../services/storage';
import { LoadingOverlay } from './LoadingOverlay';
import { SPACING, BORDER_RADIUS, SCREEN_DIMENSIONS } from '../constants/themes';
import { t } from '../i18n';
// import { autoModeService } from '../services/autoMode';
import { isExpoGo } from '../utils/expoGoCompat';

interface MultiFunctionButtonProps {
  onPress?: () => void;
}

export function MultiFunctionButton({ onPress }: MultiFunctionButtonProps) {
  const theme = useTheme();
  const { state, actions } = useApp();
  const [isPressed, setIsPressed] = useState(false);
  const [hasTodayLogs, setHasTodayLogs] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [punchButtonPressed, setPunchButtonPressed] = useState(false); // ✅ Trạng thái ẩn nút ký công
  const [lastPressTime, setLastPressTime] = useState(0); // ✅ Debouncing cho button press

  // Lấy ngôn ngữ hiện tại để sử dụng cho i18n
  const currentLanguage = state.settings?.language || 'vi';
  const buttonConfig = BUTTON_STATES[state.currentButtonState] || BUTTON_STATES.go_work;

  // Function để lấy text cho button state với i18n
  const getButtonStateText = (buttonState: string): string => {
    switch (buttonState) {
      case 'go_work':
        return t(currentLanguage, 'buttonStates.goWork');
      case 'awaiting_check_in':
        return t(currentLanguage, 'buttonStates.awaitingCheckIn');
      case 'check_in':
        return t(currentLanguage, 'buttonStates.checkIn');
      case 'check_out':
        return t(currentLanguage, 'buttonStates.checkOut');
      case 'completed_day':
        return t(currentLanguage, 'buttonStates.completedDay');
      // ✅ Loại bỏ working, awaiting_check_out, awaiting_complete, complete
      default:
        // Fallback về text gốc từ BUTTON_STATES
        return (BUTTON_STATES as any)[buttonState]?.text || 'UNKNOWN';
    }
  };

  // Logic disabled theo thiết kế mới - Chỉ disabled khi processing hoặc đã hoàn tất
  const isDisabled = isProcessing || state.currentButtonState === 'completed_day';

  // ✅ PRODUCTION: Debug logging removed

  // Check if there are attendance logs for today
  useEffect(() => {
    checkTodayLogs();
  }, [state.currentButtonState]);

  // ✅ CRITICAL FIX: Auto-reset processing state if stuck
  useEffect(() => {
    if (isProcessing) {
      console.log('🔄 MultiFunctionButton: Processing state detected, setting auto-reset timer');
      const resetTimer = setTimeout(() => {
        console.log('⚠️ MultiFunctionButton: Auto-resetting stuck processing state');
        setIsProcessing(false);
        setIsPressed(false);
      }, 5000); // Reset after 5 seconds if still processing

      return () => clearTimeout(resetTimer);
    }
  }, [isProcessing]);

  const checkTodayLogs = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const logs = await storageService.getAttendanceLogsForDate(today);
      setHasTodayLogs(logs.length > 0);

      // ✅ Reset trạng thái punch button khi hoàn tất hoặc reset
      if (state.currentButtonState === 'completed_day' || state.currentButtonState === 'go_work') {
        setPunchButtonPressed(false);
      }
    } catch (error) {
      console.error('Error checking today logs:', error);
      setHasTodayLogs(false);
    }
  };

  // Kiểm tra xem có cần xác nhận không (bấm không đúng thời gian)
  const checkIfNeedsConfirmation = async (): Promise<boolean> => {
    if (!state.activeShift) return false;

    const now = new Date();
    const currentState = state.currentButtonState;

    // Chỉ cần xác nhận cho một số trạng thái nhất định
    if (currentState === 'go_work' || currentState === 'check_in' || currentState === 'check_out') {
      // Logic kiểm tra thời gian phù hợp
      const shift = state.activeShift;
      const startTime = new Date();
      const [startHour, startMinute] = shift.startTime.split(':').map(Number);
      startTime.setHours(startHour, startMinute, 0, 0);

      const endTime = new Date();
      const [endHour, endMinute] = shift.endTime.split(':').map(Number);
      endTime.setHours(endHour, endMinute, 0, 0);

      // Xử lý ca đêm
      if (shift.isNightShift && endTime <= startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      const timeDiffFromStart = Math.abs(now.getTime() - startTime.getTime()) / (1000 * 60); // phút
      const timeDiffFromEnd = Math.abs(now.getTime() - endTime.getTime()) / (1000 * 60); // phút

      // Cần xác nhận nếu:
      // - Bấm "Đi làm" hoặc "Check-in" quá sớm (>2 giờ trước ca)
      // - Bấm "Check-out" quá sớm (>2 giờ trước kết thúc ca)
      if (currentState === 'go_work' || currentState === 'check_in') {
        return timeDiffFromStart > 120; // 2 giờ
      }

      if (currentState === 'check_out') {
        return timeDiffFromEnd > 120; // 2 giờ
      }
    }

    return false;
  };

  // Hiển thị dialog xác nhận với i18n
  const showConfirmationDialog = () => {
    const actionText: Record<string, string> = {
      'go_work': t(currentLanguage, 'buttonStates.goWork').toLowerCase(),
      'check_in': t(currentLanguage, 'buttonStates.checkIn').toLowerCase(),
      'check_out': t(currentLanguage, 'buttonStates.checkOut').toLowerCase(),
      'complete': t(currentLanguage, 'buttonStates.complete').toLowerCase(),
    };

    const text = actionText[state.currentButtonState] || t(currentLanguage, 'buttonStates.goWork').toLowerCase();

    Alert.alert(
      t(currentLanguage, 'modals.confirmAction'),
      t(currentLanguage, 'modals.confirmActionMessage').replace('{action}', text),
      [
        {
          text: t(currentLanguage, 'common.cancel'),
          style: 'cancel',
          onPress: () => {
            setIsPressed(false);
            setIsProcessing(false);
          }
        },
        {
          text: t(currentLanguage, 'modals.continue'),
          style: 'default',
          onPress: async () => {
            try {
              // ✅ Execute main action - nếu gặp RapidPressDetectedException thì tự động confirm
              await actions.handleButtonPress();

              // ✅ Background refresh (non-blocking)
              checkTodayLogs().catch(error => {
                console.warn('Background checkTodayLogs failed:', error);
              });

              onPress?.();
            } catch (error) {
              console.error('Error in confirmed button press:', error);
              // ✅ Kiểm tra nếu vẫn là RapidPressDetectedException thì tự động confirm
              if ((error as any)?.name === 'RapidPressDetectedException') {
                console.warn('⚠️ RapidPressDetectedException in confirmation dialog - auto confirming rapid press');
                // Tự động confirm rapid press
                try {
                  await actions.handleRapidPressConfirmed(
                    (error as any).checkInTime,
                    (error as any).checkOutTime
                  );

                  // ✅ Background refresh (non-blocking)
                  checkTodayLogs().catch(error => {
                    console.warn('Background checkTodayLogs failed after rapid press:', error);
                  });

                  onPress?.();
                } catch (bypassError) {
                  console.error('Error in auto rapid press confirm:', bypassError);
                  Alert.alert(t(currentLanguage, 'common.error'), t(currentLanguage, 'common.error') + ': Không thể xử lý. Vui lòng thử lại.');
                }
              } else {
                Alert.alert(t(currentLanguage, 'common.error'), t(currentLanguage, 'common.error') + ': Có lỗi xảy ra. Vui lòng thử lại.');
              }
            } finally {
              setIsPressed(false);
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const handlePress = async () => {
    if (isDisabled) return;

    // 🤖 Kiểm tra auto mode - không cho phép manual press (chỉ trên Development Build)
    if (state.settings?.multiButtonMode === 'auto') {
      if (isExpoGo()) {
        Alert.alert(
          '⚠️ Expo Go',
          'Chế độ tự động không hoạt động trên Expo Go. Vui lòng sử dụng Development Build để test tính năng này.',
          [{ text: t(currentLanguage, 'common.ok') }]
        );
      } else {
        Alert.alert(
          '🤖 Chế độ tự động',
          'Bạn đang ở chế độ tự động. Hệ thống sẽ tự động chấm công theo lịch ca làm việc.\n\nMuốn chấm công thủ công? Hãy chuyển về chế độ "Đầy đủ" hoặc "Đơn giản" trong Cài đặt.',
          [{ text: t(currentLanguage, 'common.ok') }]
        );
      }
      return;
    }

    // ✅ Debouncing - prevent rapid successive clicks
    const now = Date.now();
    if (now - lastPressTime < 500) { // 500ms debounce
      console.log('🚫 Button press ignored due to debouncing');
      return;
    }
    setLastPressTime(now);

    // 📈 Không track manual action ở đây - chỉ track khi có rapid press

    try {
      console.log('🚀 MultiFunctionButton: Button press started');
      console.log('🚀 MultiFunctionButton: Current button state:', state.currentButtonState);
      console.log('🚀 MultiFunctionButton: Multi-button mode:', state.settings?.multiButtonMode);
      console.log('🚀 MultiFunctionButton: Rapid press threshold:', state.settings?.rapidPressThresholdSeconds);

      // ✅ Immediate feedback - set pressed state first
      setIsPressed(true);

      // ✅ Vibrate immediately for instant feedback
      if (state.settings?.alarmVibrationEnabled) {
        Vibration.vibrate(100);
      }

      // ✅ Set processing state after immediate feedback
      setIsProcessing(true);

      // Kiểm tra xem có phải bấm không đúng thời gian không
      const shouldConfirm = await checkIfNeedsConfirmation();

      if (shouldConfirm) {
        showConfirmationDialog();
        return;
      }

      // ✅ Execute main action
      await actions.handleButtonPress();

      // ✅ Refresh logs status in background (non-blocking)
      checkTodayLogs().catch(error => {
        console.warn('Background checkTodayLogs failed:', error);
      });

      onPress?.();
    } catch (error) {
      // Kiểm tra nếu là RapidPressDetectedException trước - đây không phải lỗi thực sự
      if ((error as any)?.name === 'RapidPressDetectedException') {
        console.log('🚀 MultiFunctionButton: Detected RapidPressDetectedException - showing confirmation dialog');
        // Không log như error vì đây là flow bình thường
        const rapidError = error as any; // Type assertion để truy cập properties

        console.log('🚀 MultiFunctionButton: RapidError details:', {
          actualDurationSeconds: rapidError.actualDurationSeconds,
          thresholdSeconds: rapidError.thresholdSeconds,
          checkInTime: rapidError.checkInTime,
          checkOutTime: rapidError.checkOutTime
        });

        // Kiểm tra xem duration có hợp lý không
        if (rapidError.actualDurationSeconds < 0 || rapidError.actualDurationSeconds > 3600) {
          console.warn('⚠️ MultiFunctionButton: Invalid duration detected, treating as normal error');
          Alert.alert(
            t(currentLanguage, 'common.error'),
            'Thời gian không hợp lệ. Vui lòng thử lại.'
          );
          return;
        }

        // 📈 Track rapid press để suggest auto mode (disabled for Expo Go)
        // if (!isExpoGo()) {
        //   autoModeService.trackRapidPress().catch(error => {
        //     console.warn('Failed to track rapid press:', error);
        //   });
        // }

        // ✅ Reset trạng thái processing trước khi hiển thị dialog
        setIsPressed(false);
        setIsProcessing(false);

        const durationText = rapidError.actualDurationSeconds < 60
          ? `${Math.round(rapidError.actualDurationSeconds)} ${t(currentLanguage, 'time.seconds')}`
          : `${Math.round(rapidError.actualDurationSeconds / 60 * 10) / 10} ${t(currentLanguage, 'time.minutes')}`;

        Alert.alert(
          t(currentLanguage, 'modals.rapidPressDetected'),
          t(currentLanguage, 'modals.rapidPressConfirmMessage').replace('{duration}', durationText),
          [
            {
              text: t(currentLanguage, 'common.cancel'),
              style: 'cancel',
              onPress: () => {
                console.log('❌ Người dùng hủy xác nhận bấm nhanh');
              }
            },
            {
              text: t(currentLanguage, 'common.confirm'),
              style: 'default',
              onPress: async () => {
                try {
                  console.log('🚀 MultiFunctionButton: User confirmed rapid press, calling handleRapidPressConfirmed');

                  // ✅ Execute rapid press confirmation
                  await actions.handleRapidPressConfirmed(
                    rapidError.checkInTime,
                    rapidError.checkOutTime
                  );

                  console.log('✅ MultiFunctionButton: handleRapidPressConfirmed completed successfully');

                  // ✅ Background refresh (non-blocking)
                  checkTodayLogs().catch(error => {
                    console.warn('Background checkTodayLogs failed after rapid press:', error);
                  });

                  // ✅ Show success message immediately
                  Alert.alert(
                    t(currentLanguage, 'modals.rapidPressSuccess'),
                    t(currentLanguage, 'modals.rapidPressSuccessMessage'),
                    [{
                      text: t(currentLanguage, 'common.ok'),
                      onPress: () => {
                        // 💡 Auto mode suggestion disabled for Expo Go
                        // if (!isExpoGo() && autoModeService.shouldSuggestAutoMode()) {
                        //   // Auto mode suggestion logic disabled
                        // }
                      }
                    }]
                  );

                  onPress?.();
                } catch (confirmError) {
                  console.error('❌ MultiFunctionButton: Error confirming rapid press:', confirmError);
                  Alert.alert(
                    t(currentLanguage, 'common.error'),
                    t(currentLanguage, 'common.error') + ': Không thể xác nhận. Vui lòng thử lại.',
                    [{ text: t(currentLanguage, 'common.ok') }]
                  );
                }
              }
            }
          ]
        );
        return; // ✅ Quan trọng: return để không chạy finally block
      } else {
        // Lỗi thực sự - log và hiển thị cho user
        console.error('Error in button press:', error);
        console.log('🔍 MultiFunctionButton: Error details:', {
          errorType: typeof error,
          errorName: (error as any)?.name,
          errorMessage: (error as any)?.message,
          isError: error instanceof Error
        });

        Alert.alert(
          t(currentLanguage, 'common.error'),
          t(currentLanguage, 'common.error') + ': Có lỗi xảy ra khi thực hiện thao tác. Vui lòng thử lại.',
          [{ text: t(currentLanguage, 'common.ok') }]
        );
      }
    } finally {
      // ✅ CRITICAL FIX: Luôn reset trạng thái processing trong finally block
      // Đảm bảo UI không bị treo ở trạng thái loading
      setIsPressed(false);
      setIsProcessing(false);
      console.log('✅ MultiFunctionButton: Reset processing state in finally block');
    }
  };

  // ✅ PRODUCTION: Cleanup function removed

  // ✅ Force reset button state
  const handleForceReset = () => {
    Alert.alert(
      'Force Reset Button',
      'Reset trạng thái nút về bình thường?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'default',
          onPress: () => {
            console.log('🔄 MultiFunctionButton: Force resetting button state');
            setIsProcessing(false);
            setIsPressed(false);
            setPunchButtonPressed(false);
            setLastPressTime(0);
          }
        }
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      t(currentLanguage, 'modals.resetConfirm'),
      t(currentLanguage, 'modals.resetConfirmMessage'),
      [
        { text: t(currentLanguage, 'common.cancel'), style: 'cancel' },
        {
          text: t(currentLanguage, 'common.yes'),
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔄 MultiFunctionButton: Starting manual reset');

              // ✅ Execute reset immediately
              await actions.resetDailyStatus();

              console.log('🔄 MultiFunctionButton: Refreshing all states after reset');

              // ✅ Reset local component states first
              setIsProcessing(false);
              setIsPressed(false);
              setPunchButtonPressed(false);
              setLastPressTime(0);
              setHasTodayLogs(false);

              // ✅ Refresh states sequentially to ensure proper order
              await actions.refreshButtonState();
              await checkTodayLogs();

              // ✅ Refresh other states in parallel
              await Promise.all([
                actions.refreshWeeklyStatus(),
                actions.refreshTimeDisplayInfo()
              ]).catch(error => {
                console.warn('Some refresh operations failed:', error);
              });

              console.log(`✅ MultiFunctionButton: Manual reset completed, current button state: ${state.currentButtonState}`);

              // ✅ Show success message with context
              const isWorkDay = state.activeShift?.workDays.includes(new Date().getDay()) || false;
              const successMessage = isWorkDay
                ? 'Đã reset trạng thái chấm công hôm nay.'
                : 'Đã reset trạng thái. Hôm nay không phải ngày làm việc của ca hiện tại.';

              Alert.alert(t(currentLanguage, 'common.success'), successMessage);
            } catch (error) {
              console.error('❌ MultiFunctionButton: Reset failed:', error);
              Alert.alert(t(currentLanguage, 'common.error'), t(currentLanguage, 'common.error') + ': Không thể reset trạng thái. Vui lòng thử lại.');
            }
          }
        },
      ]
    );
  };

  // ✅ Memoize gradient colors to prevent unnecessary recalculations
  const getGradientColors = React.useMemo((): [string, string] => {
    const baseColor = buttonConfig.color;
    if (isDisabled) {
      return [theme.colors.surfaceDisabled, theme.colors.surfaceDisabled];
    }
    if (isPressed) {
      return [baseColor, theme.colors.primary];
    }
    return [baseColor, baseColor + '80'];
  }, [buttonConfig.color, isDisabled, isPressed, theme.colors.surfaceDisabled, theme.colors.primary]);

  // ✅ Memoize reset button visibility to prevent unnecessary recalculations
  const showResetButton = React.useMemo(() => {
    return state.currentButtonState === 'completed_day' || hasTodayLogs;
  }, [state.currentButtonState, hasTodayLogs]);

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <LinearGradient
          colors={getGradientColors}
          style={[
            styles.gradient,
            isPressed && styles.pressed,
            isDisabled && styles.disabled,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Button
            mode="contained"
            onPress={handlePress}
            disabled={isDisabled}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={[
              styles.buttonText,
              { color: isDisabled ? theme.colors.onSurfaceDisabled : '#FFFFFF' }
            ]}
          >
            <View style={styles.buttonInner}>
              <FastIcon
                name={buttonConfig.icon as any}
                size={SCREEN_DIMENSIONS.isSmallScreen ? 24 : 28}
                color={isDisabled ? theme.colors.onSurfaceDisabled : '#FFFFFF'}
                style={styles.buttonIcon}
              />
              <Text style={[
                styles.buttonLabel,
                { color: isDisabled ? theme.colors.onSurfaceDisabled : '#FFFFFF' }
              ]}>
                {getButtonStateText(state.currentButtonState)}
              </Text>
            </View>
          </Button>
        </LinearGradient>

        {showResetButton && (
          <View style={styles.actionButtonsContainer}>
            {/* ✅ Hiển thị force reset khi button đang stuck, ngược lại hiển thị reset thường */}
            {(isProcessing || isPressed) ? (
              <IconButton
                icon="refresh"
                size={20}
                iconColor={theme.colors.error}
                style={styles.forceResetButton}
                onPress={handleForceReset}
              />
            ) : (
              <IconButton
                icon="restart"
                size={20}
                iconColor={theme.colors.primary}
                style={styles.resetButton}
                onPress={handleReset}
              />
            )}
          </View>
        )}
      </View>

      {/* ✅ Nút ký công thiết kế mới với icon đẹp và logic ẩn sau khi ấn */}
      {state.activeShift?.showPunch &&
       (state.currentButtonState === 'check_in' || state.currentButtonState === 'check_out') &&
       !punchButtonPressed && (
        <View style={styles.punchButtonContainer}>
          <LinearGradient
            colors={['#FF6B6B', '#FF8E8E']}
            style={styles.punchButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Button
              mode="contained"
              onPress={async () => {
                try {
                  // ✅ Immediate feedback - vibration and hide button first
                  if (state.settings?.alarmVibrationEnabled) {
                    Vibration.vibrate(150);
                  }

                  // ✅ Hide button immediately to prevent spam
                  setPunchButtonPressed(true);

                  // ✅ Execute punch action in background
                  const today = new Date().toISOString().split('T')[0];
                  await storageService.addAttendanceLog(today, {
                    type: 'punch',
                    time: new Date().toISOString(),
                  });

                  // ✅ Show success message immediately
                  Alert.alert(
                    t(currentLanguage, 'modals.punchSuccess'),
                    t(currentLanguage, 'modals.punchSuccessMessage'),
                    [{ text: t(currentLanguage, 'common.ok') }]
                  );
                } catch (error) {
                  // ✅ If error, show button again
                  setPunchButtonPressed(false);
                  Alert.alert(
                    t(currentLanguage, 'common.error'),
                    t(currentLanguage, 'common.error') + ': Không thể ký công. Vui lòng thử lại.'
                  );
                }
              }}
              style={styles.punchButton}
              contentStyle={styles.punchButtonContent}
              labelStyle={styles.punchButtonLabel}
            >
              <View style={styles.punchButtonInner}>
                <FastIcon
                  name="signature-freehand"
                  size={20}
                  color="#FFFFFF"
                  style={styles.punchButtonIcon}
                />
                <Text style={styles.punchButtonText}>
                  {t(currentLanguage, 'modals.punchButton')}
                </Text>
              </View>
            </Button>
          </LinearGradient>
        </View>
      )}

      {/* ✅ Hiển thị trạng thái ngày làm việc */}
      {state.currentButtonState === 'completed_day' && !hasTodayLogs && (
        <Text style={styles.workDayStatus}>
          {state.activeShift?.workDays.includes(new Date().getDay())
            ? 'Đã hoàn thành công việc hôm nay'
            : 'Hôm nay không phải ngày làm việc'
          }
        </Text>
      )}

      {/* Loading overlay for processing state */}
      <LoadingOverlay
        visible={isProcessing}
        message={t(currentLanguage, 'common.loading')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  buttonContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  gradient: {
    borderRadius: SCREEN_DIMENSIONS.isSmallScreen ? 50 : 60,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  button: {
    width: SCREEN_DIMENSIONS.isSmallScreen ? 100 : 120,
    height: SCREEN_DIMENSIONS.isSmallScreen ? 100 : 120,
    borderRadius: SCREEN_DIMENSIONS.isSmallScreen ? 50 : 60,
    backgroundColor: 'transparent',
    elevation: 0,
  },
  buttonContent: {
    width: SCREEN_DIMENSIONS.isSmallScreen ? 100 : 120,
    height: SCREEN_DIMENSIONS.isSmallScreen ? 100 : 120,
    borderRadius: SCREEN_DIMENSIONS.isSmallScreen ? 50 : 60,
  },
  buttonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  buttonIcon: {
    marginBottom: SPACING.xs,
  },
  buttonLabel: {
    fontSize: SCREEN_DIMENSIONS.isSmallScreen ? 10 : 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonText: {
    fontSize: SCREEN_DIMENSIONS.isSmallScreen ? 10 : 12,
    fontWeight: 'bold',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  disabled: {
    opacity: 0.6,
  },
  actionButtonsContainer: {
    position: 'absolute',
    top: -10,
    right: -10,
    flexDirection: 'row',
    gap: 4,
  },
  resetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 4,
    borderRadius: BORDER_RADIUS.round,
  },
  // ✅ PRODUCTION: Cleanup button styles removed
  forceResetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 4,
    borderRadius: BORDER_RADIUS.round,
  },
  // ✅ Styles mới cho nút ký công thiết kế đẹp
  punchButtonContainer: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  punchButtonGradient: {
    borderRadius: BORDER_RADIUS.lg,
    elevation: 4,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  punchButton: {
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'transparent',
  },
  punchButtonContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  punchButtonLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  punchButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  punchButtonIcon: {
    marginRight: SPACING.xs,
  },
  punchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  workDayStatus: {
    marginTop: SPACING.sm,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
