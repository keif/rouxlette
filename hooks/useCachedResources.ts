import { FontAwesome } from '@expo/vector-icons';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logSafe } from '../utils/log';
import useResultsPersistence from './useResultsPersistence';

/**
 * Log AsyncStorage stats on startup to help debug property storage errors
 */
async function logStorageStats() {
  if (!__DEV__) return;

  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const rouxKeys = allKeys.filter(k => k.startsWith('@roux:'));
    const searchKeys = allKeys.filter(k => k.includes('search:'));

    // Calculate approximate total size
    let totalSize = 0;
    const keyValues = await AsyncStorage.multiGet(allKeys);
    keyValues.forEach(([_, value]) => {
      if (value) totalSize += value.length;
    });

    logSafe('[STORAGE STATS]', {
      totalKeys: allKeys.length,
      rouxKeys: rouxKeys.length,
      searchCacheKeys: searchKeys.length,
      totalSizeKB: Math.round(totalSize / 1024),
      warning: allKeys.length > 100 ? 'HIGH KEY COUNT' : null,
    });

    // Warn if key count is getting high
    if (allKeys.length > 100) {
      logSafe('[STORAGE WARNING]', 'High key count detected - may cause property storage errors');
    }
  } catch (error: any) {
    logSafe('[STORAGE STATS] Failed to get stats', { message: error?.message });
  }
}

export default function useCachedResources() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);
  const resultsPersistence = useResultsPersistence();

  // Load any resources or data that we need prior to rendering the app
  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        SplashScreen.preventAutoHideAsync();

        // Log storage stats on startup to help debug property storage errors
        await logStorageStats();

        // Clean up corrupted cache entries from MAX_DEPTH_EXCEEDED pollution
        await resultsPersistence.clearCorruptedCache();

        // Load fonts
        await Font.loadAsync({
          ...FontAwesome.font,
          'space-mono': require('../assets/fonts/SpaceMono-Regular.ttf'),
          'Roboto-Bold': require('../assets/fonts/Roboto-Bold.ttf'),
          'Roboto-Medium': require('../assets/fonts/Roboto-Medium.ttf'),
          'Roboto-Regular': require('../assets/fonts/Roboto-Regular.ttf'),
          'WorkSans-Bold': require('../assets/fonts/WorkSans-Bold.ttf'),
          'WorkSans-Medium': require('../assets/fonts/WorkSans-Medium.ttf'),
          'WorkSans-Regular': require('../assets/fonts/WorkSans-Regular.ttf'),
          'WorkSans-SemiBold': require('../assets/fonts/WorkSans-SemiBold.ttf'),
        });
      } catch (e: any) {
        // We might want to provide this error information to an error reporting service
        logSafe('Font loading error', { message: e?.message });
      } finally {
        setLoadingComplete(true);
        SplashScreen.hideAsync();
      }
    }

    loadResourcesAndDataAsync();
  }, [resultsPersistence]);

  return isLoadingComplete;
}
