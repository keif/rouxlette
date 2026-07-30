import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supperClub } from '../theme/supperClub';
import { COMMON_CUISINES } from '../constants/foodCategories';

interface AvoidingBarProps {
  dealbreakers: string[];
  perSearchExcludes: string[];
  // Per-search category inclusions. A cuisine that is both a standing dealbreaker
  // and an explicit include is SHOWN by the reducer (include wins), so it must be
  // dropped from the avoided list here to mirror that override.
  includes?: string[];
  blockedCount: number;
  onPress: () => void;
}

const labelFor = (alias: string) =>
  COMMON_CUISINES.find(c => c.alias === alias)?.label ?? alias;

export const AvoidingBar: React.FC<AvoidingBarProps> = ({ dealbreakers, perSearchExcludes, includes = [], blockedCount, onPress }) => {
  const cuisineAliases = [...new Set([...dealbreakers, ...perSearchExcludes])]
    .filter(a => !includes.includes(a));
  if (cuisineAliases.length === 0 && blockedCount === 0) return null;

  const cuisineLabels = cuisineAliases.map(labelFor).join(', ');
  const parts = [
    cuisineLabels ? `Avoiding: ${cuisineLabels}` : 'Avoiding',
    blockedCount > 0 ? `${blockedCount} blocked` : null,
  ].filter(Boolean);

  return (
    <Pressable
      style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
      onPress={onPress}
      testID="avoiding-bar"
      accessibilityRole="button"
      accessibilityLabel={`Avoiding filters. ${parts.join('. ')}. Tap to edit.`}
    >
      <Ionicons name="eye-off-outline" size={14} color={supperClub.textMuted} />
      <Text style={styles.text} numberOfLines={1}>{parts.join('  ·  ')}</Text>
      <Ionicons name="chevron-forward" size={14} color={supperClub.textMuted} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: supperClub.surface,
    borderWidth: 1,
    borderColor: supperClub.borderSoft,
  },
  pressed: { opacity: 0.7 },
  text: { flex: 1, fontSize: 12, color: supperClub.textMuted },
});

export default AvoidingBar;
