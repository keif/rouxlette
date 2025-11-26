import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../../theme';

// Alias for error color (was accentRed in AppStyles)
const accentRed = colors.error;

interface StorageStats {
  totalKeys: number;
  rouxKeys: number;
  searchCacheKeys: number;
  totalSizeKB: number;
  keys: string[];
}

/**
 * Dev-only floating panel to monitor and clear AsyncStorage
 * Helps debug the "Property storage exceeds 196607 properties" error
 */
const DevStorageDebug: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const rouxKeys = allKeys.filter(k => k.startsWith('@roux:'));
      const searchCacheKeys = allKeys.filter(k =>
        k.includes('search:') || k.includes('v2:search:')
      );

      // Calculate approximate size
      let totalSize = 0;
      const keyValues = await AsyncStorage.multiGet(allKeys);
      keyValues.forEach(([_, value]) => {
        if (value) {
          totalSize += value.length;
        }
      });

      setStats({
        totalKeys: allKeys.length,
        rouxKeys: rouxKeys.length,
        searchCacheKeys: searchCacheKeys.length,
        totalSizeKB: Math.round(totalSize / 1024),
        keys: [...allKeys].sort(),
      });
    } catch (error: any) {
      console.error('[DevStorageDebug] Failed to load stats:', error?.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isExpanded) {
      loadStats();
    }
  }, [isExpanded, loadStats]);

  const clearSearchCache = async () => {
    Alert.alert(
      'Clear Search Cache',
      'This will remove all cached search results. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const allKeys = await AsyncStorage.getAllKeys();
              const searchKeys = allKeys.filter(k =>
                k.includes('search:') || k.includes('v2:search:')
              );
              await AsyncStorage.multiRemove(searchKeys);
              await loadStats();
              Alert.alert('Done', `Cleared ${searchKeys.length} cache entries`);
            } catch (error: any) {
              Alert.alert('Error', error?.message);
            }
          },
        },
      ]
    );
  };

  const clearAllStorage = async () => {
    Alert.alert(
      'Clear ALL Storage',
      'This will remove ALL app data including favorites, history, and filters. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              await loadStats();
              Alert.alert('Done', 'All storage cleared');
            } catch (error: any) {
              Alert.alert('Error', error?.message);
            }
          },
        },
      ]
    );
  };

  const clearRouxStorage = async () => {
    Alert.alert(
      'Clear Rouxlette Storage',
      'This will remove all @roux: prefixed data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const allKeys = await AsyncStorage.getAllKeys();
              const rouxKeys = allKeys.filter(k => k.startsWith('@roux:'));
              await AsyncStorage.multiRemove(rouxKeys);
              await loadStats();
              Alert.alert('Done', `Cleared ${rouxKeys.length} entries`);
            } catch (error: any) {
              Alert.alert('Error', error?.message);
            }
          },
        },
      ]
    );
  };

  if (!__DEV__) return null;

  return (
    <>
      {/* Floating toggle button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsExpanded(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="server-outline" size={20} color={colors.white} />
        {stats && stats.totalKeys > 50 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{stats.totalKeys}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Modal panel */}
      <Modal
        visible={isExpanded}
        animationType="slide"
        transparent
        onRequestClose={() => setIsExpanded(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Storage Debug</Text>
              <TouchableOpacity onPress={() => setIsExpanded(false)}>
                <Ionicons name="close" size={24} color={colors.gray700} />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : stats ? (
              <>
                {/* Stats */}
                <View style={styles.statsContainer}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Total Keys:</Text>
                    <Text style={[
                      styles.statValue,
                      stats.totalKeys > 100 && styles.statWarning,
                      stats.totalKeys > 500 && styles.statDanger,
                    ]}>
                      {stats.totalKeys}
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>@roux Keys:</Text>
                    <Text style={styles.statValue}>{stats.rouxKeys}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Search Cache:</Text>
                    <Text style={styles.statValue}>{stats.searchCacheKeys}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Total Size:</Text>
                    <Text style={styles.statValue}>{stats.totalSizeKB} KB</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={loadStats}
                  >
                    <Ionicons name="refresh" size={18} color={colors.primary} />
                    <Text style={styles.actionText}>Refresh</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.warningButton]}
                    onPress={clearSearchCache}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.warning} />
                    <Text style={[styles.actionText, styles.warningText]}>
                      Clear Cache
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.warningButton]}
                    onPress={clearRouxStorage}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.warning} />
                    <Text style={[styles.actionText, styles.warningText]}>
                      Clear @roux
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.dangerButton]}
                    onPress={clearAllStorage}
                  >
                    <Ionicons name="nuclear-outline" size={18} color={accentRed} />
                    <Text style={[styles.actionText, styles.dangerText]}>
                      Clear ALL
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Keys list */}
                <Text style={styles.sectionTitle}>All Keys ({stats.keys.length})</Text>
                <ScrollView style={styles.keysList}>
                  {stats.keys.map((key, index) => (
                    <Text key={index} style={styles.keyItem} numberOfLines={1}>
                      {key}
                    </Text>
                  ))}
                </ScrollView>
              </>
            ) : (
              <Text style={styles.loadingText}>Failed to load stats</Text>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray700,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: accentRed,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...typography.caption2,
    color: colors.white,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title2,
    color: colors.gray900,
  },
  loadingText: {
    ...typography.body,
    color: colors.gray500,
    textAlign: 'center',
    padding: spacing.lg,
  },
  statsContainer: {
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  statLabel: {
    ...typography.subheadline,
    color: colors.gray700,
  },
  statValue: {
    ...typography.subheadline,
    color: colors.gray900,
    fontWeight: '600',
  },
  statWarning: {
    color: colors.warning,
  },
  statDanger: {
    color: accentRed,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.gray100,
  },
  warningButton: {
    backgroundColor: `${colors.warning}15`,
  },
  dangerButton: {
    backgroundColor: `${accentRed}15`,
  },
  actionText: {
    ...typography.subheadline,
    color: colors.primary,
    fontWeight: '500',
  },
  warningText: {
    color: colors.warning,
  },
  dangerText: {
    color: accentRed,
  },
  sectionTitle: {
    ...typography.footnote,
    color: colors.gray500,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  keysList: {
    maxHeight: 200,
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  keyItem: {
    ...typography.caption1,
    color: colors.gray700,
    fontFamily: 'monospace',
    paddingVertical: 2,
  },
});

export default DevStorageDebug;
