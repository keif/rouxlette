import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import useCachedResources from "./hooks/useCachedResources";
import useColorScheme from "./hooks/useColorScheme";
import Navigation from "./navigation";
import { useReducer } from "react";
import { appReducer } from "./context/reducer";
import { initialAppState } from "./context/state";
import { RootContext } from "./context/RootContext";

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
					<StatusBar />
				</RootContext.Provider>
			</SafeAreaProvider>
		);
	}
}
