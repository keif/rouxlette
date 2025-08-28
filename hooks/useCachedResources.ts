import { FontAwesome } from '@expo/vector-icons';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { logSafe } from '../utils/log';

export default function useCachedResources() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);

  // Load any resources or data that we need prior to rendering the app
  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        SplashScreen.preventAutoHideAsync();

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
  }, []);

  return isLoadingComplete;
}
