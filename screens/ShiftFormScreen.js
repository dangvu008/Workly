import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { COLORS } from '../styles/theme/colors';
import ShiftForm from '../components/ShiftForm';

const ShiftFormScreen = ({ navigation, route }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ShiftForm navigation={navigation} route={route} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appDark,
  },
});

export default ShiftFormScreen;
