import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../styles/theme/colors';
import { FONT_SIZES } from '../../styles/theme/typography';
import { SPACING } from '../../styles/theme/spacing';
import DateTimePicker from '@react-native-community/datetimepicker';

export const TimeInput = ({ 
  value, 
  onChangeText, 
  style, 
  ...props 
}) => {
  const [showPicker, setShowPicker] = useState(false);
  
  // Parse time string to Date object
  const getTimeAsDate = () => {
    const date = new Date();
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      date.setHours(hours);
      date.setMinutes(minutes);
    }
    return date;
  };
  
  // Format time from Date object to string
  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  // Handle time change from picker
  const handleTimeChange = (event, selectedDate) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      onChangeText(formatTime(selectedDate));
    }
  };
  
  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, style]}
        value={value}
        onChangeText={onChangeText}
        placeholder="00:00"
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        {...props}
      />
      
      <TouchableOpacity 
        style={styles.iconButton}
        onPress={() => setShowPicker(true)}
      >
        <MaterialIcons name="access-time" size={24} color={COLORS.appDarkTextSecondary} />
      </TouchableOpacity>
      
      {showPicker && (
        <DateTimePicker
          value={getTimeAsDate()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    backgroundColor: COLORS.appDarkLight,
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
    borderRadius: 8,
    padding: SPACING.sm,
    paddingLeft: 40, // Space for icon
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
  },
  iconButton: {
    position: 'absolute',
    left: 8,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
});

export default TimeInput;
