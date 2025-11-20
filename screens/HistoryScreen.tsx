import React, { useContext } from 'react';
import { StyleSheet, FlatList, Text, View, Pressable, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import AppStyles from '../AppStyles';
import { useHistory } from '../hooks/useHistory';
import { HistoryItem } from '../types/favorites';
import { RootContext } from '../context/RootContext';
import { setSelectedBusiness, showBusinessModal } from '../context/reducer';
import Config from '../Config';
import { logSafe } from '../utils/log';

const HistoryScreen: React.FC = () => {
  const { sortedHistory, clearHistory } = useHistory();
  const { dispatch } = useContext(RootContext);

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return diffMinutes === 0 ? 'Just now' : `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleHistoryItemPress = (item: HistoryItem) => {
    // Convert HistoryItem to YelpBusiness format for the modal
    const business = {
      id: item.businessId,
      name: item.name,
      image_url: '', // We don't store image in history, but the modal can handle it
      rating: 0,
      price: '',
      location: {
        city: item.context?.locationText || '',
        display_address: [item.context?.locationText || ''].filter(Boolean),
      },
      categories: (item.context?.filters?.categories || []).map(cat => ({ title: cat, alias: cat })),
      is_closed: false,
      url: `https://www.yelp.com/biz/${item.businessId}`,
      phone: '',
      display_phone: '',
      coordinates: item.context?.coords || { latitude: undefined, longitude: undefined },
    };

    logSafe('[HistoryScreen] Opening history item detail', { businessId: item.businessId, name: item.name });
    dispatch(setSelectedBusiness(business));
    dispatch(showBusinessModal());
  };

  const handleSpinAgain = (item: HistoryItem) => {
    // TODO: Implement "Spin Again" functionality
    // This would need to trigger a new search with the stored context
    logSafe('[HistoryScreen] Spin Again requested', { 
      businessId: item.businessId, 
      context: item.context 
    });
    
    Alert.alert(
      'Spin Again',
      `Search for restaurants again with the same criteria as when you found "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Spin Again', 
          onPress: () => {
            // This would navigate to search screen with the stored context
            // For now, just show an alert
            Alert.alert('Coming Soon', 'Spin Again functionality will be implemented in a future update.');
          }
        },
      ]
    );
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: clearHistory
        },
      ]
    );
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <Pressable
      style={({ pressed }) => [
        styles.historyItem,
        { opacity: !Config.isAndroid && pressed ? 0.8 : 1 },
      ]}
      onPress={() => handleHistoryItemPress(item)}
      android_ripple={{
        color: AppStyles.color.background,
        radius: 200,
      }}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <View style={styles.itemTitleContainer}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.sourceBadge}>
              <MaterialIcons
                name={item.source === 'spin' ? 'casino' : 'touch-app'}
                size={12}
                color={AppStyles.color.white}
              />
              <Text style={styles.sourceBadgeText}>
                {item.source === 'spin' ? 'Spin' : 'Manual'}
              </Text>
            </View>
          </View>
          <Text style={styles.timestamp}>
            {formatTimestamp(item.selectedAt)}
          </Text>
        </View>

        {item.context && (
          <View style={styles.contextContainer}>
            {item.context.searchTerm && (
              <Text style={styles.contextText}>
                <MaterialIcons name="search" size={14} color={AppStyles.color.greylight} />
                {' '}{item.context.searchTerm}
              </Text>
            )}
            {item.context.locationText && (
              <Text style={styles.contextText}>
                <MaterialIcons name="location-on" size={14} color={AppStyles.color.greylight} />
                {' '}{item.context.locationText}
              </Text>
            )}
            {item.context.filters && (
              <View style={styles.filtersContainer}>
                {item.context.filters.openNow && (
                  <View style={styles.filterChip}>
                    <Text style={styles.filterChipText}>Open Now</Text>
                  </View>
                )}
                {item.context.filters.priceLevels && item.context.filters.priceLevels.length > 0 && (
                  <View style={styles.filterChip}>
                    <Text style={styles.filterChipText}>
                      {'$'.repeat(Math.max(...item.context.filters.priceLevels))}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.openButton,
              { opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
            ]}
            onPress={() => handleHistoryItemPress(item)}
            android_ripple={{
              color: AppStyles.color.white,
              radius: 20,
            }}
          >
            <MaterialIcons name="open-in-new" size={16} color={AppStyles.color.white} />
            <Text style={styles.actionButtonTextWhite}>Open</Text>
          </Pressable>

          {item.context && (
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.spinAgainButton,
                { opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
              ]}
              onPress={() => handleSpinAgain(item)}
              android_ripple={{
                color: AppStyles.color.background,
                radius: 20,
              }}
            >
              <MaterialIcons name="casino" size={16} color={AppStyles.color.primary} />
              <Text style={styles.actionButtonText}>Spin Again</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>History</Text>
              {sortedHistory.length > 0 && (
                <Text style={styles.subtitle}>
                  {sortedHistory.length} restaurant{sortedHistory.length !== 1 ? 's' : ''} visited
                </Text>
              )}
            </View>

            {sortedHistory.length > 0 && (
              <Pressable
                style={({ pressed }) => [
                  styles.clearButton,
                  { opacity: !Config.isAndroid && pressed ? 0.6 : 1 },
                ]}
                onPress={handleClearHistory}
                android_ripple={{
                  color: AppStyles.color.background,
                  radius: 20,
                  borderless: true,
                }}
              >
                <MaterialIcons 
                  name="clear-all" 
                  size={24} 
                  color={AppStyles.color.error} 
                />
              </Pressable>
            )}
          </View>
        </View>

        {sortedHistory.length > 0 ? (
          <FlatList
            data={sortedHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="history" size={64} color={AppStyles.color.gray300} />
            <Text style={styles.emptyTitle}>No spins yet</Text>
            <Text style={styles.emptyText}>
              Try the roulette feature to discover new restaurants. Your selections will appear here with options to revisit or spin again with the same criteria!
            </Text>
          </View>
        )}

        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppStyles.color.background,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: AppStyles.color.white,
    borderBottomWidth: 1,
    borderBottomColor: AppStyles.color.background,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: AppStyles.fonts.bold,
    color: AppStyles.color.greydark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.greylight,
  },
  clearButton: {
    backgroundColor: AppStyles.color.background,
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppStyles.color.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  historyItem: {
    backgroundColor: AppStyles.color.white,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: AppStyles.color.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemContent: {
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 18,
    fontFamily: AppStyles.fonts.semiBold,
    color: AppStyles.color.black,
    marginBottom: 4,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppStyles.color.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  sourceBadgeText: {
    color: AppStyles.color.white,
    fontSize: 12,
    fontFamily: AppStyles.fonts.medium,
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.greylight,
  },
  contextContainer: {
    marginBottom: 12,
  },
  contextText: {
    fontSize: 14,
    fontFamily: AppStyles.fonts.regular,
    color: AppStyles.color.greylight,
    marginBottom: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  filterChip: {
    backgroundColor: AppStyles.color.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.greydark,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: AppStyles.color.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  openButton: {
    backgroundColor: AppStyles.color.primary,
  },
  spinAgainButton: {
    backgroundColor: AppStyles.color.background,
    borderWidth: 1,
    borderColor: AppStyles.color.primary,
  },
  actionButtonTextWhite: {
    color: AppStyles.color.white,
    fontSize: 14,
    fontFamily: AppStyles.fonts.medium,
    marginLeft: 4,
  },
  actionButtonText: {
    color: AppStyles.color.primary,
    fontSize: 14,
    fontFamily: AppStyles.fonts.medium,
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: AppStyles.fonts.bold,
    color: AppStyles.color.greydark,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.greylight,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default HistoryScreen;