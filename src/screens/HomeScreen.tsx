import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, useTheme, Button, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useApp } from '../contexts/AppContext';
import { MultiFunctionButton, SimpleMultiFunctionButton } from '../components/MultiFunctionButton';
import { WeeklyStatusGrid } from '../components/WeeklyStatusGrid';
import { WeatherWidget } from '../components/WeatherWidget';
import { AttendanceHistory } from '../components/AttendanceHistory';
import { t } from '../i18n';
// ✅ PRODUCTION: NotificationStatusBanner removed

import ExpoGoBanner from '../components/ExpoGoBanner';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AnimatedCard } from '../components/AnimatedCard';
import { WorklyBackground } from '../components/WorklyBackground';
import { WorklyIconButton, COMMON_ICONS } from '../components/WorklyIcon';

import { commonStyles, SPACING, TYPOGRAPHY, BORDER_RADIUS, getResponsivePadding } from '../constants/themes';
import { TabParamList, RootStackParamList } from '../types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { notificationService } from '../services/notifications';
import { debounce } from '../utils/debounce';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'HomeTab'>,
  StackNavigationProp<RootStackParamList>
>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

// Memoized components để tránh re-render không cần thiết
const MemoizedWeatherWidget = React.memo(WeatherWidget);
const MemoizedWeeklyStatusGrid = React.memo(WeeklyStatusGrid);
const MemoizedAttendanceHistory = React.memo(AttendanceHistory);

export function HomeScreen({ navigation }: HomeScreenProps) {
  const theme = useTheme();
  const { state, actions } = useApp();

  // Lấy ngôn ngữ hiện tại để sử dụng cho i18n
  const currentLanguage = state.settings?.language || 'vi';

  // ✅ Tất cả useState hooks được khai báo đầu tiên và nhất quán
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [topNotes, setTopNotes] = useState<any[]>([]);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // Memoized responsive padding
  const responsivePadding = useMemo(() => getResponsivePadding(), []);

  // Update time every minute - Optimized to reduce unnecessary re-renders
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Optimized refresh function với useCallback
  const onRefresh = useCallback(async () => {
    if (refreshing || isRefreshingData) return; // Prevent multiple simultaneous refreshes

    setRefreshing(true);
    setIsRefreshingData(true);

    try {
      // Batch all refresh operations for better performance
      await Promise.all([
        actions.refreshButtonState(),
        actions.refreshWeeklyStatus(),
        actions.refreshWeatherData(),
        actions.refreshTimeDisplayInfo()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
      // Could show user-friendly error message here
    } finally {
      setRefreshing(false);
      setIsRefreshingData(false);
    }
  }, [refreshing, isRefreshingData, actions]);



  // ✅ Get all notes (có và không có thông báo) với advanced filtering
  const getUpcomingNotes = () => {
    const now = new Date();
    const settings = state.settings;
    const maxCount = settings?.notesDisplayCount || 3;
    const timeWindow = settings?.notesTimeWindow || 'always';

    // ✅ Hiển thị TẤT CẢ ghi chú, không chỉ ghi chú có reminder
    let allNotes = state.notes.filter(note => {
      // Skip hidden notes
      if (note.isHiddenFromHome) return false;

      // Skip snoozed notes
      if (note.snoozeUntil && new Date(note.snoozeUntil) > now) return false;

      // ✅ Ghi chú có specific reminder time
      if (note.reminderDateTime) {
        const reminderTime = new Date(note.reminderDateTime);
        if (reminderTime <= now) return false; // Past reminders

        // Apply time window filter chỉ cho ghi chú có reminder
        if (timeWindow !== 'always') {
          const timeWindowMs = timeWindow * 60 * 1000; // Convert minutes to milliseconds
          const timeDiff = reminderTime.getTime() - now.getTime();
          if (timeDiff > timeWindowMs) return false;
        }

        return true;
      }

      // ✅ Ghi chú có shift-based reminders
      if (note.associatedShiftIds && note.associatedShiftIds.length > 0) {
        return true; // Always show shift-based notes as they have recurring reminders
      }

      // ✅ Ghi chú KHÔNG có reminder - vẫn hiển thị trên màn hình chính
      return true;
    });

    // ✅ Sort by priority, reminder status, and time
    const sortedNotes = allNotes.sort((a, b) => {
      // Priority notes first
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;

      // ✅ Ghi chú có reminder trước ghi chú không có reminder
      const aHasReminder = !!(a.reminderDateTime || (a.associatedShiftIds && a.associatedShiftIds.length > 0));
      const bHasReminder = !!(b.reminderDateTime || (b.associatedShiftIds && b.associatedShiftIds.length > 0));

      if (aHasReminder && !bHasReminder) return -1;
      if (!aHasReminder && bHasReminder) return 1;

      // Both have reminders - sort by reminder time
      if (a.reminderDateTime && b.reminderDateTime) {
        return new Date(a.reminderDateTime).getTime() - new Date(b.reminderDateTime).getTime();
      }
      if (a.reminderDateTime && !b.reminderDateTime) return -1;
      if (!a.reminderDateTime && b.reminderDateTime) return 1;

      // ✅ Cả hai đều không có reminder hoặc đều là shift-based - sort by updated time
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return sortedNotes.slice(0, maxCount);
  };

  // Check for conflicting reminders - Optimized with memoization
  const getConflictWarning = useMemo(() => {
    if (!state.settings?.notesShowConflictWarning || topNotes.length === 0) return null;

    const upcomingNotes = topNotes.filter(note => note.reminderDateTime);
    if (upcomingNotes.length < 2) return null; // No conflicts possible with less than 2 notes

    // Group notes by time windows (5-minute intervals)
    const timeGroups: { [key: string]: any[] } = {};

    upcomingNotes.forEach(note => {
      if (note.reminderDateTime) {
        const reminderTime = new Date(note.reminderDateTime);
        const timeKey = Math.floor(reminderTime.getTime() / (5 * 60 * 1000)); // 5-minute groups

        if (!timeGroups[timeKey]) {
          timeGroups[timeKey] = [];
        }
        timeGroups[timeKey].push(note);
      }
    });

    // Find groups with multiple notes
    const conflictGroups = Object.values(timeGroups).filter(group => group.length > 1);

    if (conflictGroups.length > 0) {
      const totalConflicts = conflictGroups.reduce((sum, group) => sum + group.length, 0);
      return `${t(currentLanguage, 'common.warning')}: ${totalConflicts} ${t(currentLanguage, 'notes.title').toLowerCase()} nhắc nhở cùng lúc`;
    }

    return null;
  }, [state.settings?.notesShowConflictWarning, topNotes]);

  // Load upcoming notes - Debounced to prevent excessive calls (reduced delay)
  const loadTopNotes = useCallback(
    debounce(async () => {
      try {
        const upcomingNotes = getUpcomingNotes();
        setTopNotes(upcomingNotes);
      } catch (error) {
        console.error('Error loading top notes:', error);
        setTopNotes([]);
      }
    }, 100), // Reduced from 300ms to 100ms
    [state.notes, state.settings?.notesDisplayCount, state.activeShift?.id]
  );

  // Load top notes when notes or settings change - Optimized with reduced dependencies
  useEffect(() => {
    loadTopNotes();
  }, [state.notes.length, state.settings?.notesDisplayCount, state.activeShift?.id]);

  // Helper function to format reminder info
  const formatReminderInfo = (note: any): string => {
    // Specific reminder time
    if (note.reminderDateTime) {
      try {
        const reminderDate = new Date(note.reminderDateTime);
        const now = new Date();
        const diffMs = reminderDate.getTime() - now.getTime();

        if (diffMs < 0) {
          return t(currentLanguage, 'timeDate.passed');
        } else if (diffMs < 24 * 60 * 60 * 1000) {
          return `${t(currentLanguage, 'timeDate.today')} ${format(reminderDate, 'HH:mm')}`;
        } else if (diffMs < 7 * 24 * 60 * 60 * 1000) {
          return format(reminderDate, 'EEEE HH:mm', { locale: currentLanguage === 'vi' ? vi : enUS });
        } else {
          return format(reminderDate, 'dd/MM/yyyy HH:mm');
        }
      } catch (error) {
        return t(currentLanguage, 'timeDate.timeError');
      }
    }

    // Shift-based reminders
    if (note.associatedShiftIds && note.associatedShiftIds.length > 0) {
      const associatedShifts = state.shifts.filter(shift =>
        note.associatedShiftIds!.includes(shift.id)
      );

      if (associatedShifts.length === 0) {
        return t(currentLanguage, 'timeDate.shiftDeleted');
      }

      const shiftNames = associatedShifts.map(shift => shift.name).join(', ');
      return `${t(currentLanguage, 'timeDate.byShift')}: ${shiftNames}`;
    }

    return '';
  };

  // Toggle note expansion
  const toggleNoteExpansion = (noteId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  // Handle note deletion with confirmation
  const handleDeleteNote = (note: any) => {
    Alert.alert(
      t(currentLanguage, 'common.confirm') + ' ' + t(currentLanguage, 'common.delete').toLowerCase(),
      `${t(currentLanguage, 'common.confirm')} ${t(currentLanguage, 'common.delete').toLowerCase()} ${t(currentLanguage, 'notes.title').toLowerCase()} "${note.title}"?`,
      [
        { text: t(currentLanguage, 'common.cancel'), style: 'cancel' },
        {
          text: t(currentLanguage, 'common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await actions.deleteNote(note.id);
            } catch (error) {
              Alert.alert(t(currentLanguage, 'common.error'), `${t(currentLanguage, 'common.error')}: Không thể xóa ${t(currentLanguage, 'notes.title').toLowerCase()}.`);
            }
          }
        }
      ]
    );
  };

  // Handle hide note from home screen
  const handleHideNote = (note: any) => {
    Alert.alert(
      t(currentLanguage, 'actions.hide') + ' ' + t(currentLanguage, 'notes.title').toLowerCase(),
      `${t(currentLanguage, 'common.confirm')} ${t(currentLanguage, 'actions.hide').toLowerCase()} ${t(currentLanguage, 'notes.title').toLowerCase()} "${note.title}" khỏi ${t(currentLanguage, 'home.title').toLowerCase()}?`,
      [
        { text: t(currentLanguage, 'common.cancel'), style: 'cancel' },
        {
          text: t(currentLanguage, 'actions.hide'),
          onPress: async () => {
            try {
              await actions.updateNote(note.id, { isHiddenFromHome: true });
              // ✅ Cancel any scheduled reminders for this note (chỉ nếu có thông báo)
              if (note.enableNotifications !== false) {
                await notificationService.cancelNoteReminder(note.id);
              }
            } catch (error) {
              Alert.alert(t(currentLanguage, 'common.error'), `${t(currentLanguage, 'common.error')}: Không thể ẩn ${t(currentLanguage, 'notes.title').toLowerCase()}.`);
            }
          }
        }
      ]
    );
  };

  // Handle snooze note
  const handleSnoozeNote = (note: any) => {
    Alert.alert(
      t(currentLanguage, 'timeDate.snoozeOptions.title'),
      t(currentLanguage, 'timeDate.snoozeOptions.selectTime'),
      [
        { text: t(currentLanguage, 'common.cancel'), style: 'cancel' },
        {
          text: t(currentLanguage, 'timeDate.snoozeOptions.fiveMinutes'),
          onPress: () => snoozeNote(note, 5)
        },
        {
          text: t(currentLanguage, 'timeDate.snoozeOptions.fifteenMinutes'),
          onPress: () => snoozeNote(note, 15)
        },
        {
          text: t(currentLanguage, 'timeDate.snoozeOptions.thirtyMinutes'),
          onPress: () => snoozeNote(note, 30)
        },
        {
          text: t(currentLanguage, 'timeDate.snoozeOptions.oneHour'),
          onPress: () => snoozeNote(note, 60)
        }
      ]
    );
  };

  const snoozeNote = async (note: any, minutes: number) => {
    try {
      const snoozeUntil = new Date();
      snoozeUntil.setMinutes(snoozeUntil.getMinutes() + minutes);

      await actions.updateNote(note.id, {
        snoozeUntil: snoozeUntil.toISOString()
      });

      // ✅ Reschedule reminder for snooze time (chỉ nếu ghi chú có bật thông báo)
      await notificationService.cancelNoteReminder(note.id);
      if (note.enableNotifications !== false) {
        await notificationService.scheduleNoteReminder({
          ...note,
          reminderDateTime: snoozeUntil.toISOString()
        });
      }
    } catch (error) {
      Alert.alert(t(currentLanguage, 'common.error'), `${t(currentLanguage, 'common.error')}: Không thể ${t(currentLanguage, 'actions.snooze').toLowerCase()} ${t(currentLanguage, 'notes.title').toLowerCase()}.`);
    }
  };

  // ✅ PRODUCTION: All debug functions removed

  // Show loading spinner when app is loading
  if (state.isLoading) {
    return (
      <SafeAreaView style={[commonStyles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingSpinner message={t(currentLanguage, 'common.loading')} />
      </SafeAreaView>
    );
  }

  return (
    <WorklyBackground variant="home">
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={[styles.scrollView, { padding: responsivePadding }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
        {/* Header với animation - Tối ưu delay */}
        <AnimatedCard animationType="fadeIn" delay={0} backgroundColor={theme.colors.surfaceVariant}>
          <Card.Content>
            <View style={[commonStyles.header, styles.header]}>
              <View>
                <Text style={[styles.dateTime, { color: theme.colors.onSurface }]}>
                  {format(currentTime, 'EEEE, dd/MM', { locale: currentLanguage === 'vi' ? vi : enUS })}
                </Text>
                <Text style={[styles.time, { color: theme.colors.primary }]}>
                  {format(currentTime, 'HH:mm')}
                </Text>
              </View>
            </View>
          </Card.Content>
        </AnimatedCard>

        {/* Expo Go Banner - Hiển thị khi chạy trong Expo Go */}
        <AnimatedCard animationType="slideUp" delay={0}>
          <ExpoGoBanner />
        </AnimatedCard>

        {/* ✅ PRODUCTION: Notification Status Banner removed */}

        {/* Weather Widget với animation */}
        <AnimatedCard animationType="slideUp" delay={0}>
          <MemoizedWeatherWidget onPress={() => navigation.navigate('WeatherDetail')} />
        </AnimatedCard>

        {/* Active Shift với animation */}
        <AnimatedCard animationType="slideUp" delay={0} elevated backgroundColor={theme.colors.surfaceVariant}>
          <Card.Content>
            <View style={styles.shiftHeader}>
              <Text style={[commonStyles.cardTitle, { color: theme.colors.onSurface }]}>
                {t(currentLanguage, 'home.currentShift')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {/* ✅ PRODUCTION: Debug buttons removed */}
                <WorklyIconButton
                  name={COMMON_ICONS.edit}
                  size={20}
                  color={theme.colors.primary}
                  onPress={() => navigation.navigate('ShiftsTab')}
                  style={commonStyles.accessibleTouchTarget}
                />
              </View>
            </View>
            <Text style={[styles.shiftName, { color: theme.colors.primary }]}>
              {state.activeShift?.name || t(currentLanguage, 'home.noActiveShift')}
            </Text>
            {state.activeShift && (
              <Text style={[commonStyles.bodyText, { color: theme.colors.onSurfaceVariant }]}>
                {state.activeShift.startTime} - {state.activeShift.endTime}
              </Text>
            )}
          </Card.Content>
        </AnimatedCard>

        {/* Multi-Function Button - Luôn hiển thị khi có active shift */}
        {state.activeShift && (
          state.settings?.multiButtonMode === 'simple' ? (
            <SimpleMultiFunctionButton />
          ) : (
            <MultiFunctionButton />
          )
        )}

        {/* Attendance History - Show below Multi-Function Button */}
        {state.activeShift && (
          <AnimatedCard animationType="slideUp" delay={0} style={styles.attendanceHistoryCard} backgroundColor={theme.colors.surfaceVariant}>
            <Card.Content>
              <MemoizedAttendanceHistory />
            </Card.Content>
          </AnimatedCard>
        )}

        {/* Weekly Status Grid với animation */}
        <AnimatedCard animationType="slideUp" delay={0} elevated backgroundColor={theme.colors.surfaceVariant}>
          <Card.Content>
            <MemoizedWeeklyStatusGrid onDayPress={() => {
              // Day press handled by WeeklyStatusGrid internally
            }} />
          </Card.Content>
        </AnimatedCard>



        {/* Notes Section với animation */}
        <AnimatedCard animationType="slideUp" delay={0} elevated backgroundColor={theme.colors.surfaceVariant}>
          <Card.Content>
            <View style={styles.notesHeader}>
              <Text style={[commonStyles.cardTitle, { color: theme.colors.onSurface }]}>
                {t(currentLanguage, 'home.upcomingReminders')}
              </Text>
              <WorklyIconButton
                name="menu"
                size={20}
                color={theme.colors.primary}
                onPress={() => navigation.navigate('NotesTab')}
                style={commonStyles.accessibleTouchTarget}
              />
            </View>

            {/* Conflict Warning */}
            {getConflictWarning && (
              <View style={[styles.conflictWarning, { backgroundColor: theme.colors.errorContainer }]}>
                <Text style={[commonStyles.bodyText, { color: theme.colors.onErrorContainer }]}>
                  ⚠️ {getConflictWarning}
                </Text>
              </View>
            )}

            {topNotes.length > 0 ? (
              <>
                {topNotes.map((note, index) => {
                  const isExpanded = expandedNotes.has(note.id);
                  const reminderInfo = formatReminderInfo(note);

                  return (
                    <View key={note.id}>
                      <TouchableOpacity
                        style={styles.noteItem}
                        onPress={() => toggleNoteExpansion(note.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.noteContent}>
                          {note.isPriority && (
                            <Text style={styles.priorityIcon}>⭐</Text>
                          )}
                          {/* ✅ Visual indicator cho tùy chọn thông báo */}
                          {note.enableNotifications === false && (
                            <Text style={styles.notificationIcon}>🔕</Text>
                          )}
                          <View style={styles.noteText}>
                            <Text
                              style={[styles.noteTitle, { color: theme.colors.onSurface }]}
                              numberOfLines={1}
                            >
                              {note.title}
                            </Text>
                            <Text
                              style={[styles.noteDescription, { color: theme.colors.onSurfaceVariant }]}
                              numberOfLines={isExpanded ? undefined : 2}
                            >
                              {note.content}
                            </Text>
                            {reminderInfo && (
                              <Text style={[styles.noteReminder, { color: theme.colors.primary }]}>
                                {t(currentLanguage, 'timeDate.remind')}: {reminderInfo}
                              </Text>
                            )}
                          </View>
                        </View>
                        <View style={styles.noteActions}>
                          <WorklyIconButton
                            name={COMMON_ICONS.edit}
                            size={14}
                            color={theme.colors.primary}
                            onPress={() => {
                              navigation.navigate('NoteDetail', { noteId: note.id });
                            }}
                          />
                          <WorklyIconButton
                            name="bell-sleep"
                            size={14}
                            color={theme.colors.secondary}
                            onPress={() => {
                              handleSnoozeNote(note);
                            }}
                          />
                          <WorklyIconButton
                            name={COMMON_ICONS.eyeOff}
                            size={14}
                            color={theme.colors.outline}
                            onPress={() => {
                              handleHideNote(note);
                            }}
                          />
                          <WorklyIconButton
                            name={COMMON_ICONS.delete}
                            size={14}
                            color={theme.colors.error}
                            onPress={() => {
                              handleDeleteNote(note);
                            }}
                          />
                        </View>
                      </TouchableOpacity>
                      {index < topNotes.length - 1 && <Divider />}
                    </View>
                  );
                })}
              </>
            ) : (
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                {t(currentLanguage, 'notes.noNotes')}
              </Text>
            )}

            <Button
              mode="outlined"
              onPress={() => navigation.navigate('NoteDetail', {})}
              style={styles.addNoteButton}
              icon="plus"
            >
              {t(currentLanguage, 'notes.addNote')}
            </Button>
          </Card.Content>
        </AnimatedCard>

        </ScrollView>
      </SafeAreaView>
    </WorklyBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    marginBottom: SPACING.sm,
  },
  dateTime: {
    ...TYPOGRAPHY.titleMedium,
    textTransform: 'capitalize',
  },
  time: {
    ...TYPOGRAPHY.headlineSmall,
    fontWeight: 'bold',
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftName: {
    ...TYPOGRAPHY.titleLarge,
    fontWeight: 'bold',
    marginTop: SPACING.xs,
  },
  conflictWarning: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteItem: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  noteContent: {
    flex: 1,
    flexDirection: 'row',
  },
  priorityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  notificationIcon: {
    fontSize: 14,
    marginRight: 6,
    opacity: 0.7,
  },
  noteText: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  noteDescription: {
    fontSize: 12,
    marginBottom: 4,
  },
  noteReminder: {
    fontSize: 11,
    fontWeight: '500',
  },
  noteActions: {
    flexDirection: 'row',
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 16,
  },
  addNoteButton: {
    marginTop: SPACING.sm,
  },
  attendanceHistoryCard: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
    zIndex: 1, // Ensure it's above other elements
  },
});
