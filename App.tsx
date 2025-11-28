import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";
import Toast from "react-native-toast-message";

import useCachedResources from "./hooks/useCachedResources";
import useColorScheme from "./hooks/useColorScheme";
import Navigation from "./navigation";
import React, { useReducer, useMemo } from "react";
import { appReducer } from "./context/reducer";
import { initialAppState } from "./context/state";
import { RootContext } from "./context/RootContext";
import { ToastProvider } from "./context/ToastContext";
import { StatusBar } from "expo-status-bar";
import { BusinessCardModal } from "./components/shared/BusinessCardModal";
import DevStorageDebug from "./components/shared/DevStorageDebug";

// Match splash screen background color to prevent white flash
const SPLASH_BACKGROUND = "#1B5E20";

export default function App() {
	const isLoadingComplete = useCachedResources();
	const colorScheme = useColorScheme();
	const [state, dispatch] = useReducer(appReducer, initialAppState);

	// Stabilize context value to prevent unnecessary rerenders
	const contextValue = useMemo(() => ({ state, dispatch }), [state, dispatch]);

	if (!isLoadingComplete) {
		// Show green background while loading to match splash screen
		return <View style={{ flex: 1, backgroundColor: SPLASH_BACKGROUND }} />;
	} else {
		return (
			<GestureHandlerRootView style={{ flex: 1 }}>
				<SafeAreaProvider>
					<RootContext.Provider value={contextValue}>
						<ToastProvider>
							<Navigation colorScheme={colorScheme} />
							<StatusBar
								backgroundColor="transparent"
								translucent
							/>
							<BusinessCardModal />
							<DevStorageDebug />
						</ToastProvider>
					</RootContext.Provider>
				</SafeAreaProvider>
				{/* Toast must be LAST and OUTSIDE all other components to appear above modals */}
				<Toast />
			</GestureHandlerRootView>
		);
	}
}
