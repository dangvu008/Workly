import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList } from 'react-native';
import {
  Text,
  Card,

  useTheme,
  FAB,
  Menu,
  Button,
  Divider,
  Searchbar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { WorklyIconButton, COMMON_ICONS } from '../components/WorklyIcon';
import { vi, enUS } from 'date-fns/locale';
import { useApp } from '../contexts/AppContext';
import { Note } from '../types';
import { TabParamList, RootStackParamList } from '../types';
import { WorklyBackground } from '../components/WorklyBackground';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { t } from '../i18n';

type NotesScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'NotesTab'>,
  StackNavigationProp<RootStackParamList>
>;

interface NotesScreenProps {
  navigation: NotesScreenNavigationProp;
}

export function NotesScreen({ navigation }: NotesScreenProps) {
  const theme = useTheme();
  const { state, actions } = useApp();
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [displayCountMenuVisible, setDisplayCountMenuVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'title'>('date');
  const [searchQuery, setSearchQuery] = useState('');

  // Lấy ngôn ngữ hiện tại để sử dụng cho i18n
  const currentLanguage = state.settings?.language || 'vi';

  const handleDeleteNote = (note: Note) => {
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
              Alert.alert('Thành công', 'Đã xóa ghi chú.');
            } catch (error) {
              Alert.alert(t(currentLanguage, 'common.error'), `${t(currentLanguage, 'common.error')}: Không thể xóa ${t(currentLanguage, 'notes.title').toLowerCase()}.`);
            }
          }
        }
      ]
    );
  };

  const getSortedAndFilteredNotes = (): Note[] => {
    let notes = [...state.notes];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      notes = notes.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'priority':
        return notes.sort((a, b) => {
          if (a.isPriority && !b.isPriority) return -1;
          if (!a.isPriority && b.isPriority) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
      case 'title':
        return notes.sort((a, b) => a.title.localeCompare(b.title));
      case 'date':
      default:
        return notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
  };

  const formatReminderInfo = (note: Note): string => {
    // Nếu có reminderDateTime (đặt lịch cụ thể)
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

    // Nếu có associatedShiftIds (nhắc theo ca)
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

  const renderNoteItem = (note: Note, index: number) => {
    const reminderText = formatReminderInfo(note);

    return (
      <View key={note.id}>
        <Card
          style={[
            styles.noteCard,
            { backgroundColor: theme.colors.surfaceVariant },
            note.isPriority && { borderLeftWidth: 4, borderLeftColor: theme.colors.primary }
          ]}
          onPress={() => navigation.navigate('NoteDetail', { noteId: note.id })}
        >
          <Card.Content>
            <View style={styles.noteHeader}>
              <View style={styles.noteInfo}>
                <View style={styles.noteTitleRow}>
                  {note.isPriority && (
                    <Text style={styles.priorityIcon}>⭐</Text>
                  )}
                  <Text
                    style={[
                      styles.noteTitle,
                      {
                        color: theme.colors.onSurface,
                        fontWeight: note.isPriority ? 'bold' : '600'
                      }
                    ]}
                    numberOfLines={1}
                  >
                    {note.title}
                  </Text>
                </View>
                <Text
                  style={[styles.noteContent, { color: theme.colors.onSurfaceVariant }]}
                  numberOfLines={2}
                >
                  {note.content}
                </Text>

                <View style={styles.noteMetadata}>
                  {reminderText && (
                    <Text style={[styles.reminderText, { color: theme.colors.primary }]}>
                      {t(currentLanguage, 'timeDate.remind')}: {reminderText}
                    </Text>
                  )}
                  <Text style={[styles.updatedText, { color: theme.colors.onSurfaceVariant }]}>
                    {format(new Date(note.updatedAt), 'dd/MM/yyyy HH:mm')}
                  </Text>
                </View>
              </View>

              <View style={styles.noteActions}>
                <WorklyIconButton
                  name={COMMON_ICONS.delete}
                  size={20}
                  color={theme.colors.error}
                  onPress={() => {
                    handleDeleteNote(note);
                  }}
                />
              </View>
            </View>
          </Card.Content>
        </Card>
        {index < getSortedAndFilteredNotes().length - 1 && <Divider style={styles.divider} />}
      </View>
    );
  };

  const sortedNotes = getSortedAndFilteredNotes();

  return (
    <WorklyBackground variant="default">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
        <View style={{ width: 48 }} />
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
          {t(currentLanguage, 'notes.title')}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Filter and Sort Controls */}
      <View style={styles.controlsRow}>
        <View style={styles.controlItem}>
          <Text style={[styles.controlLabel, { color: theme.colors.onSurface }]}>
            {currentLanguage === 'vi' ? 'Hiển thị:' : 'Display:'}
          </Text>
          <Menu
            visible={displayCountMenuVisible}
            onDismiss={() => setDisplayCountMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                compact={false}
                onPress={() => setDisplayCountMenuVisible(true)}
                style={styles.controlButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                {`${state.settings?.notesDisplayCount || 3} ▼`}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                actions.updateSettings({ notesDisplayCount: 2 });
                setDisplayCountMenuVisible(false);
              }}
              title={`2 ${t(currentLanguage, 'notes.title').toLowerCase()}`}
            />
            <Menu.Item
              onPress={() => {
                actions.updateSettings({ notesDisplayCount: 3 });
                setDisplayCountMenuVisible(false);
              }}
              title={`3 ${t(currentLanguage, 'notes.title').toLowerCase()}`}
            />
            <Menu.Item
              onPress={() => {
                actions.updateSettings({ notesDisplayCount: 4 });
                setDisplayCountMenuVisible(false);
              }}
              title={`4 ${t(currentLanguage, 'notes.title').toLowerCase()}`}
            />
            <Menu.Item
              onPress={() => {
                actions.updateSettings({ notesDisplayCount: 5 });
                setDisplayCountMenuVisible(false);
              }}
              title={`5 ${t(currentLanguage, 'notes.title').toLowerCase()}`}
            />
          </Menu>
        </View>

        <View style={styles.controlItem}>
          <Text style={[styles.controlLabel, { color: theme.colors.onSurface }]}>
            {currentLanguage === 'vi' ? 'Sắp xếp:' : 'Sort:'}
          </Text>
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                compact={false}
                onPress={() => setSortMenuVisible(true)}
                style={styles.controlButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                {sortBy === 'priority'
                  ? (currentLanguage === 'vi' ? 'Ưu tiên ▼' : 'Priority ▼')
                  : sortBy === 'date'
                    ? (currentLanguage === 'vi' ? 'Ngày ▼' : 'Date ▼')
                    : 'ABC ▼'}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setSortBy('priority');
                setSortMenuVisible(false);
              }}
              title={currentLanguage === 'vi' ? 'Ưu tiên' : 'Priority'}
            />
            <Menu.Item
              onPress={() => {
                setSortBy('date');
                setSortMenuVisible(false);
              }}
              title={currentLanguage === 'vi' ? 'Ngày tạo' : 'Date'}
            />
            <Menu.Item
              onPress={() => {
                setSortBy('title');
                setSortMenuVisible(false);
              }}
              title="ABC"
            />
          </Menu>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={currentLanguage === 'vi'
            ? `Tìm kiếm ${t(currentLanguage, 'notes.title').toLowerCase()}...`
            : `Search ${t(currentLanguage, 'notes.title').toLowerCase()}...`
          }
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}
          inputStyle={{ color: theme.colors.onSurface }}
          iconColor={theme.colors.onSurfaceVariant}
        />
      </View>

      <ScrollView style={styles.scrollView}>
        {sortedNotes.length > 0 ? (
          sortedNotes.map((note, index) => renderNoteItem(note, index))
        ) : (
          <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Card.Content>
              {searchQuery.trim() ? (
                <>
                  <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                    {currentLanguage === 'vi'
                      ? `Không tìm thấy ghi chú nào với từ khóa "${searchQuery}"`
                      : `No notes found with keyword "${searchQuery}"`
                    }
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => setSearchQuery('')}
                    style={styles.createFirstButton}
                  >
                    {currentLanguage === 'vi' ? 'Xóa tìm kiếm' : 'Clear search'}
                  </Button>
                </>
              ) : (
                <>
                  <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                    {currentLanguage === 'vi'
                      ? 'Chưa có ghi chú nào. Hãy tạo ghi chú đầu tiên!'
                      : 'No notes yet. Create your first note!'
                    }
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('NoteDetail', {})}
                    style={styles.createFirstButton}
                  >
                    {currentLanguage === 'vi' ? 'Tạo ghi chú đầu tiên' : 'Create first note'}
                  </Button>
                </>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('NoteDetail', {})}
        />
      </SafeAreaView>
    </WorklyBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    gap: 16, // Increased gap between control items
  },
  controlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Allow items to take equal space
    gap: 6, // Reduced gap between label and button
    maxWidth: '48%', // Limit width to prevent overlap
  },
  controlLabel: {
    fontSize: 13, // Slightly smaller font
    fontWeight: '500',
    minWidth: 50, // Reduced minimum width
    flexShrink: 0, // Don't shrink labels
  },
  controlButton: {
    flex: 1, // Take remaining space in the control item
    minHeight: 40, // Ensure adequate height for touch
    borderRadius: 8,
    maxWidth: 120, // Limit button width to prevent overflow
  },
  buttonContent: {
    height: 40, // Match button height
    paddingHorizontal: 8, // Reduced padding to fit more text
    justifyContent: 'center', // Center content vertically
  },
  buttonLabel: {
    fontSize: 12, // Smaller font size to fit better
    textAlign: 'center', // Center text
    lineHeight: 16, // Ensure proper line height
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    elevation: 0,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  noteCard: {
    marginVertical: 4,
    borderRadius: 12,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noteInfo: {
    flex: 1,
    marginRight: 8,
  },
  noteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  noteContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  noteMetadata: {
    gap: 4,
  },
  reminderText: {
    fontSize: 12,
    fontWeight: '500',
  },
  updatedText: {
    fontSize: 11,
  },
  noteActions: {
    flexDirection: 'row',
  },
  divider: {
    marginVertical: 8,
  },
  emptyCard: {
    marginVertical: 32,
    borderRadius: 12,
    elevation: 2,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
  },
  createFirstButton: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
});
