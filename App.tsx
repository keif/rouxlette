import { SafeAreaProvider } from "react-native-safe-area-context";

import useCachedResources from "./hooks/useCachedResources";
import useColorScheme from "./hooks/useColorScheme";
import Navigation from "./navigation";
import React, { useReducer } from "react";
import { appReducer } from "./context/reducer";
import { initialAppState } from "./context/state";
import { RootContext } from "./context/RootContext";
import "expo-dev-menu";
import { StatusBar } from "expo-status-bar";

export default function App() {
	const isLoadingComplete = useCachedResources();
	const colorScheme = useColorScheme();
	const [state, dispatch] = useReducer(appReducer, initialAppState);

	if (!isLoadingComplete) {
		return null;
	} else {
		return (
			<SafeAreaProvider>
				<RootContext.Provider value={{ state, dispatch }}>
					<Navigation colorScheme={colorScheme} />
					<StatusBar
						backgroundColor="transparent"
						translucent
					/>
				</RootContext.Provider>
			</SafeAreaProvider>
		);
	}
}
