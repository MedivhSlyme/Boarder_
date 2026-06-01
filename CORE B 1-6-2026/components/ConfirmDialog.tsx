import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { useColors } from '../hooks/useColors';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  const colors = useColors();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>
          <View style={styles.buttons}>
            <Pressable
              onPress={onCancel}
              style={[styles.btn, { backgroundColor: colors.secondary }]}
            >
              <Text style={[styles.btnText, { color: colors.secondaryForeground }]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[styles.btn, { backgroundColor: destructive ? colors.destructive : colors.primary }]}
            >
              <Text style={[styles.btnText, { color: destructive ? colors.destructiveForeground : colors.primaryForeground }]}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 360, borderRadius: 16, borderWidth: 1, padding: 24 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 18, marginBottom: 10 },
  message: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginBottom: 24 },
  buttons: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
