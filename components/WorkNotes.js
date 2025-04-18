import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalization } from "../localization/LocalizationContext";
import { COLORS } from "../constants/colors";
import { formatDate } from "../utils/dateUtils";

const WorkNotes = ({ notes, onAddNote, onEditNote, onDeleteNote, onViewAll }) => {
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
    const hasReminder = item.reminderDate && new Date(item.reminderDate) > new Date();
    
    return (
      <TouchableOpacity
        style={[
          styles.noteItem,
          item.important && styles.importantNote,
          isExpanded && styles.expandedNote,
        ]}
        onPress={() => toggleNoteExpansion(item.id)}
      >
        <BlurView intensity={20} tint="dark" style={styles.noteContent}>
          <View style={styles.noteHeader}>
            <Text style={styles.noteTitle} numberOfLines={isExpanded ? 0 : 1}>
              {item.title}
            </Text>
            {item.important && (
              <MaterialIcons name="star" size={16} color={COLORS.warning} />
            )}
          </View>
          
          {isExpanded && (
            <Text style={styles.noteText}>{item.content}</Text>
          )}
          
          <View style={styles.noteFooter}>
            <Text style={styles.noteDate}>
              {formatDate(new Date(item.updatedAt), "date")}
            </Text>
            
            {hasReminder && (
              <View style={styles.reminderContainer}>
                <MaterialIcons name="alarm" size={14} color={COLORS.info} />
                <Text style={styles.reminderText}>
                  {formatDate(new Date(item.reminderDate), "datetime")}
                </Text>
              </View>
            )}
            
            {isExpanded && (
              <View style={styles.noteActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onEditNote(item)}
                >
                  <MaterialIcons name="edit" size={20} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => onDeleteNote(item)}
                >
                  <MaterialIcons name="delete" size={20} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("notes.workNotes")}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
            <Text style={styles.viewAllText}>{t("common.viewAll")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addNoteButton} onPress={onAddNote}>
            <MaterialIcons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
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
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllButton: {
    marginRight: 8,
  },
  viewAllText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  addNoteButton: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  notesList: {
    paddingBottom: 8,
  },
  noteItem: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
  },
  importantNote: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  expandedNote: {
    minHeight: 120,
  },
  noteContent: {
    padding: 12,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
    flex: 1,
  },
  noteText: {
    fontSize: 14,
    color: COLORS.white,
    marginVertical: 8,
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  noteDate: {
    fontSize: 12,
    color: COLORS.lightGray,
  },
  reminderContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  reminderText: {
    fontSize: 12,
    color: COLORS.info,
    marginLeft: 4,
  },
  noteActions: {
    flexDirection: "row",
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
  },
  emptyContainer: {
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.white,
    marginVertical: 8,
    textAlign: "center",
  },
  addButton: {
    backgroundColor: COLORS.primary,
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
