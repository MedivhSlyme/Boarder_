import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Modal, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../hooks/useColors';

const EMOJI_ROWS = [
  ['😀','😂','😍','🥰','😎','🤩','🥳','😅','🤔','😏'],
  ['😭','😢','😤','😡','🤯','🥶','😱','😴','🤤','😷'],
  ['👍','👎','👏','🙌','🤝','🤜','🤛','✌️','🤞','🖐️'],
  ['❤️','🔥','⭐','✨','🎉','🎊','🎮','♟️','🃏','🎲'],
  ['😈','👻','💀','🤖','👽','🦊','🐱','🐶','🦁','🐻'],
  ['🍕','🎂','🍺','🥂','☕','🍰','🍫','🍭','🌮','🍜'],
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiGifPicker({ onEmojiSelect }: EmojiPickerProps) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        style={[styles.triggerBtn, { backgroundColor: colors.secondary }]}
      >
        <Text style={styles.triggerIcon}>😊</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
        <View style={[styles.panel, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Emoji</Text>
            <Pressable onPress={() => setVisible(false)} style={styles.closeBtn}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <ScrollView style={styles.emojiScroll}>
            {EMOJI_ROWS.map((row, ri) => (
              <View key={ri} style={styles.emojiRow}>
                {row.map((em, ei) => (
                  <Pressable
                    key={ei}
                    onPress={() => { onEmojiSelect(em); setVisible(false); }}
                    style={styles.emojiBtn}
                  >
                    <Text style={styles.emojiChar}>{em}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  triggerIcon: { fontSize: 22 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  panel: {
    height: 300, borderTopWidth: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  closeBtn: { padding: 4 },
  emojiScroll: { flex: 1, padding: 8 },
  emojiRow: { flexDirection: 'row', marginBottom: 4 },
  emojiBtn: { width: '10%', alignItems: 'center', paddingVertical: 6 },
  emojiChar: { fontSize: 26 },
});
