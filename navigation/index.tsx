import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";
import { ColorSchemeName, Pressable } from "react-native";
import useColorScheme from "../hooks/useColorScheme";
import NotFoundScreen from "../screens/NotFoundScreen";
import { RootStackParamList, RootTabParamList, RootTabScreenProps } from "../types";
import LinkingConfiguration from "./LinkingConfiguration";
import SearchScreen from "../screens/SearchScreen";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import AppStyles from "../AppStyles";
import { FontAwesome } from "@expo/vector-icons";
import Colors from "../constants/Colors";

export default function Navigation({ colorScheme }: { colorScheme: ColorSchemeName }) {
	return (
		<NavigationContainer
			linking={LinkingConfiguration}
			theme={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
			<RootNavigator />
		</NavigationContainer>
	);
}

/**
 * A root stack navigator is often used for displaying modals on top of all other content.
 * https://reactnavigation.org/docs/modal
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
	const colorScheme = useColorScheme();

	return (
		<Stack.Navigator>
			<Stack.Screen name="Root" component={TopTabNavigator} options={{ headerShown: false }} />
			<Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: "Oops!" }} />
		</Stack.Navigator>
	);
}

/**
 * A bottom tab navigator displays tab buttons on the bottom of the display to switch screens.
 * https://reactnavigation.org/docs/bottom-tab-navigator
 */
const Tabs = createMaterialTopTabNavigator<RootTabParamList>();

function TopTabNavigator() {
	const colorScheme = useColorScheme();

	return (
		<Tabs.Navigator
			initialRouteName={"Search"}
			screenOptions={{
				tabBarActiveTintColor: "#e91e63",
				tabBarStyle: { backgroundColor: AppStyles.color.black },
			}}
		>
			<Tabs.Screen
				component={SearchScreen}
				name="Search"
				options={({ navigation }: RootTabScreenProps<"Search">) => ({
					headerStyle: {
						height: 0,
					},
					style: {
						height: 0,
					},
					title: "Rouxlette",
				})}
			/>
		</Tabs.Navigator>
	);
}
