import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../styles/theme/colors';
import { SPACING, RADIUS } from '../styles/theme/spacing';
import { FONT_SIZES } from '../styles/theme/typography';
import { useLocalization } from '../localization/LocalizationContext';

const ShiftInfo = ({ shift }) => {
  const { t } = useLocalization();
  
  if (!shift) return null;
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="calendar-today" size={20} color={COLORS.appBlue} />
        <Text style={styles.title}>{t('home.todayShift')}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.shiftName}>{shift.name}</Text>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{shift.startTime}</Text>
          <MaterialIcons name="arrow-right-alt" size={20} color={COLORS.appDarkTextSecondary} />
          <Text style={styles.timeText}>{shift.endTime}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.appDarkLight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.appDarkBorder,
  },
  title: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  content: {
    padding: SPACING.md,
  },
  shiftName: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    color: COLORS.appDarkTextSecondary,
    fontSize: FONT_SIZES.md,
    marginHorizontal: SPACING.sm,
  },
});

export default ShiftInfo;
