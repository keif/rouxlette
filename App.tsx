import "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import useCachedResources from "./hooks/useCachedResources";
import useColorScheme from "./hooks/useColorScheme";
import Navigation from "./navigation";
import React, { useReducer, useMemo } from "react";
import { appReducer } from "./context/reducer";
import { initialAppState } from "./context/state";
import { RootContext } from "./context/RootContext";
import "expo-dev-menu";
import { StatusBar } from "expo-status-bar";
import { BusinessCardModal } from "./components/shared/BusinessCardModal";

export default function App() {
	const isLoadingComplete = useCachedResources();
	const colorScheme = useColorScheme();
	const [state, dispatch] = useReducer(appReducer, initialAppState);

	// Stabilize context value to prevent unnecessary rerenders
	const contextValue = useMemo(() => ({ state, dispatch }), [state, dispatch]);

	if (!isLoadingComplete) {
		return null;
	} else {
		return (
			<SafeAreaProvider>
				<RootContext.Provider value={contextValue}>
					<Navigation colorScheme={colorScheme} />
					<StatusBar
						backgroundColor="transparent"
						translucent
					/>
					<BusinessCardModal />
				</RootContext.Provider>
			</SafeAreaProvider>
		);
	}
}
