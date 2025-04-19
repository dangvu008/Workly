import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalization } from "../localization/LocalizationContext";
import { COLORS } from "../styles/theme/colors";
import { formatDate } from "../utils/dateUtils";
import { BlurView } from "expo-blur";

const WorkNotes = ({
  notes,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onViewAll,
}) => {
  const { t } = useLocalization();
  const [expandedNote, setExpandedNote] = useState(null);

  // Toggle note expansion
  const toggleNoteExpansion = (noteId) => {
    setExpandedNote(expandedNote === noteId ? null : noteId);
  };

  // Render empty state
  const renderEmptyState = () => (
    <BlurView intensity={20} tint="dark" style={styles.emptyContainer}>
      <MaterialIcons name="note-add" size={40} color={COLORS.white} />
      <Text style={styles.emptyText}>{t("notes.noNotes")}</Text>
      <TouchableOpacity style={styles.addButton} onPress={onAddNote}>
        <Text style={styles.addButtonText}>{t("notes.addNotePrompt")}</Text>
      </TouchableOpacity>
    </BlurView>
  );

  // Render note item
  const renderNoteItem = ({ item }) => {
    const isExpanded = expandedNote === item.id;

    return (
      <View style={styles.noteItem}>
        <View style={styles.noteContent}>
          <View style={styles.noteHeader}>
            <Text style={styles.noteTitle} numberOfLines={isExpanded ? 0 : 2}>
              {item.title}
            </Text>
            <View style={styles.noteActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onEditNote(item)}
              >
                <MaterialIcons
                  name="edit"
                  size={18}
                  color={COLORS.appDarkTextSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onDeleteNote(item)}
              >
                <MaterialIcons
                  name="delete"
                  size={18}
                  color={COLORS.appStatusError}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.noteText} numberOfLines={3}>
            {item.content}
          </Text>

          <View style={styles.noteFooter}>
            <View style={styles.reminderContainer}>
              <MaterialIcons
                name="access-time"
                size={14}
                color={COLORS.appDarkTextSecondary}
              />
              <Text style={styles.reminderText}>{item.reminderTime}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("home.notes")}</Text>
        <TouchableOpacity style={styles.addNoteButton} onPress={onAddNote}>
          <Text style={styles.addNoteButtonText}>{t("home.addNewNote")}</Text>
          <MaterialIcons name="add" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {notes.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={notes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notesList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
  },
  addNoteButton: {
    backgroundColor: COLORS.appPurple,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addNoteButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    marginRight: 4,
    fontSize: 14,
  },
  notesList: {
    paddingBottom: 8,
  },
  noteItem: {
    backgroundColor: COLORS.appDarkLight,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
  },
  noteContent: {
    padding: 12,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
    flex: 1,
    marginRight: 8,
  },
  noteText: {
    fontSize: 14,
    color: COLORS.appDarkTextSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  reminderContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.appDarkBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reminderText: {
    fontSize: 12,
    color: COLORS.appDarkTextSecondary,
    marginLeft: 4,
  },
  noteActions: {
    flexDirection: "row",
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  emptyContainer: {
    backgroundColor: COLORS.appDarkLight,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.appDarkTextSecondary,
    marginVertical: 8,
    textAlign: "center",
  },
  addButton: {
    backgroundColor: COLORS.appPurple,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
});

export default WorkNotes;
