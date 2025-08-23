import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";
import { ColorSchemeName, Pressable } from "react-native";
import useColorScheme from "../hooks/useColorScheme";
import NotFoundScreen from "../screens/NotFoundScreen";
import { RootStackParamList, RootTabParamList, RootTabScreenProps } from "../types";
import LinkingConfiguration from "./LinkingConfiguration";
import SearchScreen from "../screens/SearchScreen";
import HomeScreen from "../screens/HomeScreen";
import FavoritesScreen from "../screens/FavoritesScreen";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import AppStyles from "../AppStyles";
import { Ionicons } from "@expo/vector-icons";

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
			initialRouteName={"Home"}
			screenOptions={{
				tabBarActiveTintColor: AppStyles.color.roulette.gold,
				tabBarInactiveTintColor: AppStyles.color.greylight,
				tabBarStyle: { 
					backgroundColor: AppStyles.color.white,
					borderBottomWidth: 1,
					borderBottomColor: AppStyles.color.background,
				},
				tabBarIndicatorStyle: {
					backgroundColor: AppStyles.color.roulette.gold,
					height: 3,
				},
				tabBarLabelStyle: {
					fontSize: 14,
					fontFamily: AppStyles.fonts.semiBold,
					textTransform: 'none',
				},
				tabBarShowIcon: true,
				tabBarIconStyle: {
					marginBottom: 4,
				},
			}}
		>
			<Tabs.Screen
				component={HomeScreen}
				name="Home"
				options={{
					title: "Home",
					tabBarIcon: ({ color, focused }) => (
						<Ionicons name={focused ? "home" : "home-outline"} size={20} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				component={SearchScreen}
				name="Search"
				options={{
					title: "Search",
					tabBarIcon: ({ color, focused }) => (
						<Ionicons name={focused ? "search" : "search-outline"} size={20} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				component={FavoritesScreen}
				name="Favorites"
				options={{
					title: "Favorites",
					tabBarIcon: ({ color, focused }) => (
						<Ionicons name={focused ? "heart" : "heart-outline"} size={20} color={color} />
					),
				}}
			/>
		</Tabs.Navigator>
	);
}
