import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity,
  TouchableWithoutFeedback
} from 'react-native';
import { COLORS } from '../../styles/theme/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../styles/theme/typography';
import { SPACING } from '../../styles/theme/spacing';
import { Button } from './Button';

export const Dialog = ({ 
  visible, 
  title, 
  message, 
  confirmText = 'Xác nhận', 
  cancelText = 'Hủy',
  confirmVariant = 'default',
  onConfirm,
  onCancel,
  onDismiss = onCancel
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dialogContainer}>
              <View style={styles.dialog}>
                {title && (
                  <Text style={styles.title}>{title}</Text>
                )}
                
                {message && (
                  <Text style={styles.message}>{message}</Text>
                )}
                
                <View style={styles.actions}>
                  <Button
                    title={cancelText}
                    onPress={onCancel}
                    variant="outline"
                    style={styles.cancelButton}
                  />
                  <Button
                    title={confirmText}
                    onPress={onConfirm}
                    variant={confirmVariant}
                    style={styles.confirmButton}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: '90%',
    maxWidth: 400,
  },
  dialog: {
    backgroundColor: COLORS.appDarkLight,
    borderRadius: 12,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.appDarkBorder,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: FONT_SIZES.md,
    color: COLORS.appDarkTextSecondary,
    marginBottom: SPACING.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    marginRight: SPACING.sm,
  },
  confirmButton: {
    minWidth: 100,
  },
});

export default Dialog;
