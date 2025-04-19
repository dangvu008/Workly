import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  FlatList,
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../styles/theme/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../styles/theme/typography';
import { SPACING } from '../../styles/theme/spacing';

export const Dropdown = ({ 
  value, 
  options = [], 
  onValueChange,
  placeholder = 'Chọn một tùy chọn',
  style
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  // Find selected option label
  const selectedOption = options.find(option => option.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;
  
  // Handle option selection
  const handleSelect = (option) => {
    onValueChange(option.value);
    setModalVisible(false);
  };
  
  // Render option item
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.optionItem,
        item.value === value && styles.selectedOption
      ]}
      onPress={() => handleSelect(item)}
    >
      <Text 
        style={[
          styles.optionText,
          item.value === value && styles.selectedOptionText
        ]}
      >
        {item.label}
      </Text>
      {item.value === value && (
        <MaterialIcons name="check" size={20} color={COLORS.appPurple} />
      )}
    </TouchableOpacity>
  );
  
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={styles.dropdownButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.dropdownButtonText}>{displayText}</Text>
        <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.appDarkTextSecondary} />
      </TouchableOpacity>
      
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{placeholder}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <MaterialIcons name="close" size={24} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
                
                <FlatList
                  data={options}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.value.toString()}
                  style={styles.optionsList}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.appDarkLight,
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
    borderRadius: 8,
    padding: SPACING.sm,
    height: 48,
  },
  dropdownButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: COLORS.appDarkLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.appDarkBorder,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.appDarkBorder,
  },
  selectedOption: {
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
  },
  optionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
  selectedOptionText: {
    color: COLORS.appPurple,
    fontWeight: FONT_WEIGHTS.bold,
  },
});

export default Dropdown;
