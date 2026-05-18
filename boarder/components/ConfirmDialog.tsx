import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useColors } from '../hooks/useColors';
import { PrimaryButton } from './PrimaryButton';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'secondary' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'destructive',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const colors = useColors();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable
          style={[styles.box, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>
          <View style={styles.row}>
            <PrimaryButton
              title={cancelLabel}
              onPress={onCancel}
              variant="secondary"
              style={{ flex: 1, marginRight: 8 }}
            />
            <PrimaryButton
              title={confirmLabel}
              onPress={onConfirm}
              variant={confirmVariant}
              style={{ flex: 1, marginLeft: 8 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  box: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    marginBottom: 10,
  },
  message: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
  },
});
