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
import { SavedTabNavigator } from "./SavedTabNavigator";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import AppStyles from "../AppStyles";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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
	const insets = useSafeAreaInsets();

	return (
	  <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: AppStyles.color.white }}>
		<Tabs.Navigator
		  initialRouteName={"Home"}
		  screenOptions={{
			tabBarActiveTintColor: AppStyles.color.roulette.accent,
			tabBarInactiveTintColor: AppStyles.color.greylight,
			tabBarStyle: {
			  backgroundColor: AppStyles.color.white,
			  borderBottomWidth: 1,
			  borderBottomColor: AppStyles.color.background,
			  // Give the tab bar a little breathing room below the notch even with SafeAreaView
			  paddingTop: 4,
			  minHeight: 40,
			},
			tabBarIndicatorStyle: {
			  backgroundColor: AppStyles.color.roulette.accent,
			  height: 2,
			},
			tabBarLabelStyle: {
			  fontSize: 14,
			  fontFamily: AppStyles.fonts.semiBold,
			  textTransform: 'none',
			},
			tabBarShowIcon: true,
			tabBarIconStyle: {
			},
		  }}
		>
		  <Tabs.Screen
			component={HomeScreen}
			name="Home"
			options={{
			  title: "Rouxlette",
			  tabBarIcon: ({ color, focused }) => (
				<Ionicons name={focused ? "dice" : "dice-outline"} size={20} color={color} />
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
			component={SavedTabNavigator}
			name="Saved"
			options={{
			  title: "Saved",
			  tabBarIcon: ({ color, focused }) => (
				<Ionicons name={focused ? "bookmark" : "bookmark-outline"} size={20} color={color} />
			  ),
			}}
		  />
		</Tabs.Navigator>
	  </SafeAreaView>
	);
}
