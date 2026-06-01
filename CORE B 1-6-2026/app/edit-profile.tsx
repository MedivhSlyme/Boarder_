import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Platform,
  ScrollView, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useColors } from '../hooks/useColors';
import { Avatar } from '../components/Avatar';
import { AvatarPicker } from '../components/AvatarPicker';
import { GameRow } from '../components/GameRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { Game, SKILLS, Skill } from '../models/types';
import { KeyboardAwareScrollViewCompat } from '../components/KeyboardAwareScrollViewCompat';

export default function EditProfileScreen() {
  const { currentUser, updateUser } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [username, setUsername] = useState(currentUser?.username ?? '');
  const [bio, setBio] = useState(currentUser?.profile_details?.bio ?? '');
  const [availability, setAvailability] = useState(currentUser?.profile_details?.availability ?? '');
  const [profilePic, setProfilePic] = useState(currentUser?.profile_details?.profile_pic ?? '');
  const [games, setGames] = useState<Game[]>(currentUser?.games ?? []);

  const [newGameName, setNewGameName] = useState('');
  const [newGameSkill, setNewGameSkill] = useState<Skill>('Amateur');
  const [newGameFav, setNewGameFav] = useState(false);
  const [showAddGame, setShowAddGame] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topInset = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  const addGame = () => {
    if (!newGameName.trim()) return;
    setGames((prev) => [
      ...prev,
      { name: newGameName.trim(), skill: newGameSkill, favorite: newGameFav },
    ]);
    setNewGameName('');
    setNewGameSkill('Amateur');
    setNewGameFav(false);
    setShowAddGame(false);
  };

  const removeGame = (index: number) =>
    setGames((prev) => prev.filter((_, i) => i !== index));

  const save = async () => {
    if (!username.trim()) { setError('Username is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      await updateUser({
        username: username.trim(),
        games,
        profile_details: {
          bio: bio.trim(),
          availability: availability.trim(),
          profile_pic: profilePic,
        },
      } as any);
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border },
  ];

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topInset + 16,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 20,
      }}
      bottomOffset={20}
    >
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <PrimaryButton
          icon="chevron-left"
          onPress={() => router.back()}
          variant="secondary"
          style={styles.backBtn}
        />
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>EDIT PROFILE</Text>
        <PrimaryButton
          title={saving ? '...' : 'SAVE'}
          onPress={save}
          disabled={saving}
          style={styles.saveBtn}
        />
      </View>

      {/* ── Avatar preview ── */}
      <View style={styles.avatarPreview}>
        <Avatar
          username={(username || currentUser?.username) ?? '?'}
          profilePic={profilePic}
          size={96}
        />
        <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Preview</Text>
      </View>

      {/* ── Avatar picker ── */}
      <View style={styles.group}>
        <AvatarPicker selected={profilePic} onSelect={setProfilePic} />
      </View>

      {/* ── Username ── */}
      <View style={styles.group}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>USERNAME</Text>
        <TextInput
          style={inputStyle}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={colors.mutedForeground}
        />
      </View>

      {/* ── Bio ── */}
      <View style={styles.group}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>BIO</Text>
        <TextInput
          style={[inputStyle, styles.multiline]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell others about yourself..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* ── Availability ── */}
      <View style={styles.group}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>AVAILABILITY</Text>
        <TextInput
          style={inputStyle}
          value={availability}
          onChangeText={setAvailability}
          placeholder="e.g. weekends only, evenings"
          placeholderTextColor={colors.mutedForeground}
        />
      </View>

      {/* ── Games ── */}
      <View style={styles.group}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>GAMES</Text>
          <Pressable onPress={() => setShowAddGame((v) => !v)} hitSlop={8}>
            <Feather
              name={showAddGame ? 'minus-circle' : 'plus-circle'}
              size={18}
              color={colors.primary}
            />
          </Pressable>
        </View>

        {games.map((g, i) => (
          <GameRow key={i} game={g} onDelete={() => removeGame(i)} />
        ))}

        {showAddGame && (
          <View
            style={[
              styles.addGameForm,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={inputStyle}
              value={newGameName}
              onChangeText={setNewGameName}
              placeholder="Game name (e.g. Chess, Monopoly)"
              placeholderTextColor={colors.mutedForeground}
            />

            <Text
              style={[
                styles.label,
                { color: colors.mutedForeground, marginTop: 10, marginBottom: 8 },
              ]}
            >
              SKILL LEVEL
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 10 }}
            >
              {SKILLS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setNewGameSkill(s)}
                  style={[
                    styles.skillChip,
                    {
                      backgroundColor:
                        newGameSkill === s ? colors.primary : colors.surfaceHigh,
                      borderColor:
                        newGameSkill === s ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color:
                        newGameSkill === s
                          ? colors.primaryForeground
                          : colors.foreground,
                      fontFamily: 'Inter_500Medium',
                      fontSize: 13,
                    }}
                  >
                    {s}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              onPress={() => setNewGameFav((v) => !v)}
              style={styles.favRow}
            >
              <Feather
                name="star"
                size={16}
                color={newGameFav ? colors.accent : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.favLabel,
                  { color: newGameFav ? colors.accent : colors.mutedForeground },
                ]}
              >
                Mark as favourite
              </Text>
            </Pressable>

            <PrimaryButton
              title="ADD GAME"
              onPress={addGame}
              disabled={!newGameName.trim()}
              style={{ marginTop: 12 }}
            />
          </View>
        )}
      </View>

      {error ? (
        <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
      ) : null}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 44, height: 44, marginRight: 8 },
  pageTitle: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  saveBtn: { height: 44, paddingHorizontal: 16 },
  avatarPreview: { alignItems: 'center', marginBottom: 20 },
  tapHint: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 6 },
  group: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  multiline: { height: 90, paddingTop: 12, textAlignVertical: 'top' },
  addGameForm: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  skillChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  favRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  favLabel: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  error: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: 8 },
});
