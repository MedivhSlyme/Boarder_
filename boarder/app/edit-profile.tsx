import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Platform,
  ScrollView, Pressable, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useColors } from '../hooks/useColors';
import { Avatar, AVATAR_MAP } from '../components/Avatar';
import { GameRow } from '../components/GameRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { Game, SKILLS, Skill } from '../models/types';
import { KeyboardAwareScrollViewCompat } from '../components/KeyboardAwareScrollViewCompat';

// Array of keys to loop through for the selection grid
const AVATAR_KEYS = Object.keys(AVATAR_MAP);

export default function EditProfileScreen() {
  const { currentUser, updateUser } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [username, setUsername] = useState(currentUser?.username ?? '');
  const [bio, setBio] = useState(currentUser?.profile_details?.bio ?? '');
  const [availability, setAvailability] = useState(currentUser?.profile_details?.availability ?? '');
  const [profilePic, setProfilePic] = useState(currentUser?.profile_details?.profile_pic ?? 'avatar1');
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
    setGames((prev) => [...prev, { name: newGameName.trim(), skill: newGameSkill, favorite: newGameFav }]);
    setNewGameName('');
    setNewGameSkill('Amateur');
    setNewGameFav(false);
    setShowAddGame(false);
  };

  const removeGame = (index: number) => {
    setGames((prev) => prev.filter((_, i) => i !== index));
  };

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
          profile_pic: profilePic, // Saves the string 'avatar1', 'avatar2', etc.
        },
      });
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [styles.input, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }];

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topInset + 16, paddingBottom: insets.bottom + 40, paddingHorizontal: 20 }}
      bottomOffset={20}
    >
      <View style={styles.topBar}>
        <PrimaryButton icon="chevron-left" onPress={() => router.back()} variant="secondary" style={styles.backBtn} />
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>EDIT PROFILE</Text>
        <PrimaryButton title={saving ? '...' : 'SAVE'} onPress={save} disabled={saving} style={styles.saveBtn} />
      </View>

      <View style={styles.avatarSection}>
        <Avatar username={username || '?'} profilePic={profilePic} size={100} />
        <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20, marginBottom: 12 }]}>SELECT AVATAR</Text>
        
        <View style={styles.avatarGrid}>
          {AVATAR_KEYS.map((key) => (
            <Pressable 
              key={key} 
              onPress={() => setProfilePic(key)}
              style={[
                styles.gridItem, 
                { borderColor: profilePic === key ? colors.primary : 'transparent' }
              ]}
            >
              <Image source={AVATAR_MAP[key]} style={styles.gridImage} />
              {profilePic === key && (
                <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]}>
                  <Feather name="check" size={10} color="#fff" />
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>USERNAME</Text>
        <TextInput style={inputStyle} value={username} onChangeText={setUsername}
          autoCapitalize="none" autoCorrect={false} placeholderTextColor={colors.mutedForeground} />
      </View>

      <View style={styles.group}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>BIO</Text>
        <TextInput
          style={[inputStyle, styles.multiline]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell others a bit about yourself..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.group}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>AVAILABILITY</Text>
        <TextInput style={inputStyle} value={availability} onChangeText={setAvailability}
          placeholder="e.g. weekends only, evenings" placeholderTextColor={colors.mutedForeground} />
      </View>

      <View style={styles.group}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>GAMES</Text>
          <Pressable onPress={() => setShowAddGame((v) => !v)} hitSlop={8}>
            <Feather name={showAddGame ? 'minus-circle' : 'plus-circle'} size={18} color={colors.primary} />
          </Pressable>
        </View>

        {games.map((g, i) => <GameRow key={i} game={g} onDelete={() => removeGame(i)} />)}

        {showAddGame && (
          <View style={[styles.addGameForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[inputStyle, { marginBottom: 10 }]}
              value={newGameName}
              onChangeText={setNewGameName}
              placeholder="Game name"
              placeholderTextColor={colors.mutedForeground}
            />
            <Text style={[styles.label, { color: colors.mutedForeground, marginBottom: 8 }]}>SKILL LEVEL</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {SKILLS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setNewGameSkill(s)}
                  style={[
                    styles.skillChip,
                    {
                      backgroundColor: newGameSkill === s ? colors.primary : colors.surfaceHigh,
                      borderColor: newGameSkill === s ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: newGameSkill === s ? colors.primaryForeground : colors.foreground, fontFamily: 'Inter_500Medium', fontSize: 13 }}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <PrimaryButton title="ADD GAME" onPress={addGame} disabled={!newGameName.trim()} />
          </View>
        )}
      </View>

      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backBtn: { width: 44, height: 44, marginRight: 8 },
  pageTitle: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: 1 },
  saveBtn: { height: 44, paddingHorizontal: 16 },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  gridItem: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, padding: 2, position: 'relative' },
  gridImage: { width: '100%', height: '100%', borderRadius: 28 },
  activeIndicator: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  group: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1 },
  input: { height: 50, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontFamily: 'Inter_400Regular', fontSize: 15 },
  multiline: { height: 90, paddingTop: 12, textAlignVertical: 'top' },
  addGameForm: { padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 4 },
  skillChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  error: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: 8 },
});