import React, { useState } from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet, FlatList, TextInput, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../hooks/useColors';
import { User } from '../models/types';

interface ScoreDialogProps {
  visible: boolean;
  currentUser: User;
  friends: User[];
  onClose: () => void;
  onSubmit: (opponent: User, outcome: 'win' | 'loss', game: string) => Promise<void>;
}

type Step = 'pick_opponent' | 'pick_game' | 'pick_outcome';

export function ScoreDialog({ visible, currentUser, friends, onClose, onSubmit }: ScoreDialogProps) {
  const colors = useColors();
  const [step, setStep] = useState<Step>('pick_opponent');
  const [opponent, setOpponent] = useState<User | null>(null);
  const [game, setGame] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const filteredFriends = friends.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()),
  );

  /** Union of games from currentUser + opponent (deduped by name). */
  const availableGames: string[] = React.useMemo(() => {
    if (!opponent) return currentUser.games.map((g) => g.name);
    const seen = new Set<string>();
    const names: string[] = [];
    for (const g of [...currentUser.games, ...opponent.games]) {
      const key = g.name.toLowerCase();
      if (!seen.has(key)) { seen.add(key); names.push(g.name); }
    }
    return names;
  }, [opponent, currentUser.games]);

  const reset = () => {
    setStep('pick_opponent');
    setOpponent(null);
    setGame('');
    setLoading(false);
    setSearch('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSelectOpponent = (u: User) => {
    setOpponent(u);
    setStep('pick_game');
  };

  const handleSelectGame = (name: string) => {
    setGame(name);
    setStep('pick_outcome');
  };

  const handleOutcome = async (outcome: 'win' | 'loss') => {
    if (!opponent) return;
    setLoading(true);
    try {
      await onSubmit(opponent, outcome, game || 'Board Game');
      reset();
      onClose();
    } catch {}
    setLoading(false);
  };

  const stepLabel = step === 'pick_opponent'
    ? 'Who did you play against?'
    : step === 'pick_game'
    ? `Game vs. ${opponent?.username}`
    : `vs. ${opponent?.username} · ${game}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>

        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>{stepLabel}</Text>
          <Pressable onPress={handleClose} hitSlop={8}>
            <Feather name="x" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* ── Step 1: Pick opponent ── */}
        {step === 'pick_opponent' && (
          <>
            <View style={[styles.searchWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Feather name="search" size={14} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder="Search players..."
                placeholderTextColor={colors.mutedForeground}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <FlatList
              data={filteredFriends}
              keyExtractor={(u) => u.id}
              style={{ maxHeight: 240 }}
              renderItem={({ item: u }) => (
                <Pressable
                  onPress={() => handleSelectOpponent(u)}
                  style={({ pressed }) => [
                    styles.playerRow,
                    { backgroundColor: pressed ? colors.secondary : 'transparent', borderBottomColor: colors.border },
                  ]}
                >
                  <View style={[styles.avatar, { backgroundColor: colors.primary + '33' }]}>
                    <Text style={[styles.avatarLetter, { color: colors.primary }]}>
                      {u.username[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.playerName, { color: colors.foreground }]}>{u.username}</Text>
                    <Text style={[styles.playerPts, { color: colors.mutedForeground }]}>
                      {u.boardPoints ?? 0} pts
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={[styles.empty, { color: colors.mutedForeground }]}>No players found</Text>
              }
            />
          </>
        )}

        {/* ── Step 2: Pick game ── */}
        {step === 'pick_game' && (
          <View style={styles.gameSection}>
            <Text style={[styles.gameHint, { color: colors.mutedForeground }]}>
              Select the game you played
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
              <View style={styles.gameGrid}>
                {availableGames.map((name) => {
                  const isSelected = game === name;
                  return (
                    <Pressable
                      key={name}
                      onPress={() => handleSelectGame(name)}
                      style={[
                        styles.gameChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surfaceHigh,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.gameChipText, { color: isSelected ? colors.primaryForeground : colors.foreground }]}>
                        {name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            <Pressable onPress={() => setStep('pick_opponent')} style={styles.backLink}>
              <Feather name="arrow-left" size={13} color={colors.mutedForeground} />
              <Text style={[styles.backLinkText, { color: colors.mutedForeground }]}>Change opponent</Text>
            </Pressable>
          </View>
        )}

        {/* ── Step 3: Pick outcome ── */}
        {step === 'pick_outcome' && opponent && (
          <View style={styles.outcomeSection}>
            <View style={[styles.gameSelectedBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
              <Feather name="grid" size={13} color={colors.primary} />
              <Text style={[styles.gameSelectedText, { color: colors.primary }]}>{game}</Text>
            </View>
            <Text style={[styles.outcomeLabel, { color: colors.mutedForeground }]}>What was the result?</Text>
            <View style={styles.outcomeRow}>
              <Pressable
                onPress={() => handleOutcome('win')}
                disabled={loading}
                style={[styles.outcomeBtn, { backgroundColor: '#16a34a', borderColor: '#22c55e' }]}
              >
                <Feather name="trending-up" size={22} color="#fff" />
                <Text style={styles.outcomeBtnText}>WIN</Text>
                <Text style={styles.outcomePoints}>+3 pts</Text>
              </Pressable>
              <Pressable
                onPress={() => handleOutcome('loss')}
                disabled={loading}
                style={[styles.outcomeBtn, { backgroundColor: '#b91c1c', borderColor: '#ef4444' }]}
              >
                <Feather name="trending-down" size={22} color="#fff" />
                <Text style={styles.outcomeBtnText}>LOSS</Text>
                <Text style={styles.outcomePoints}>+1 pt</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => setStep('pick_game')} style={styles.backLink}>
              <Feather name="arrow-left" size={13} color={colors.mutedForeground} />
              <Text style={[styles.backLinkText, { color: colors.mutedForeground }]}>Change game</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  panel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 16, flex: 1, marginRight: 8 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginVertical: 12,
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, height: 42,
  },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14 },
  playerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  playerName: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  playerPts: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 1 },
  empty: { textAlign: 'center', padding: 24, fontFamily: 'Inter_400Regular', fontSize: 14 },
  // Game picker
  gameSection: { padding: 16, gap: 12 },
  gameHint: { fontFamily: 'Inter_500Medium', fontSize: 13, textAlign: 'center' },
  gameGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gameChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1,
  },
  gameChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  // Outcome
  outcomeSection: { padding: 20, gap: 12 },
  gameSelectedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center',
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  gameSelectedText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  outcomeLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, textAlign: 'center' },
  outcomeRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  outcomeBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 22, borderRadius: 16, borderWidth: 1.5, gap: 4,
  },
  outcomeBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 18 },
  outcomePoints: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_400Regular', fontSize: 12 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 4 },
  backLinkText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
});
