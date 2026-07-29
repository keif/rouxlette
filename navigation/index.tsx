import {DarkTheme, DefaultTheme, NavigationContainer, createNavigationContainerRef} from "@react-navigation/native";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import * as React from "react";
import {ColorSchemeName, Platform} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import useColorScheme from "../hooks/useColorScheme";
import NotFoundScreen from "../screens/NotFoundScreen";
import {RootStackParamList, RootTabParamList} from "../types";
import LinkingConfiguration from "./LinkingConfiguration";
import {SearchScreen} from "../screens/SearchScreen";
import {HomeScreen} from "../screens/HomeScreen";
import {SavedTabNavigator} from "./SavedTabNavigator";
import AppStyles from "../AppStyles";

// Ref so components rendered OUTSIDE the NavigationContainer (e.g. the global
// BusinessCardModal in App.tsx) can navigate — used by the winner modal's
// "View All" action to jump to the Search results list.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootTabParamList) {
    if (navigationRef.isReady()) {
        // Tabs live under the "Root" screen of the root stack.
        navigationRef.navigate('Root', {screen: name} as never);
    }
}

export default function Navigation({colorScheme}: { colorScheme: ColorSchemeName }) {
    return (
        <NavigationContainer
            ref={navigationRef}
            linking={LinkingConfiguration}
            theme={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <RootNavigator/>
        </NavigationContainer>
    );
}

/**
 * Root stack navigator for modals
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Root" component={BottomTabNavigator} options={{headerShown: false}}/>
            <Stack.Screen name="NotFound" component={NotFoundScreen} options={{title: "Oops!"}}/>
        </Stack.Navigator>
    );
}

/**
 * Bottom tab navigator (iOS style)
 */
const BottomTabs = createBottomTabNavigator<RootTabParamList>();

function BottomTabNavigator() {
    const colorScheme = useColorScheme();

    return (
        <BottomTabs.Navigator
            initialRouteName="Home"
            screenOptions={{
                tabBarActiveTintColor: AppStyles.color.primary,
                tabBarInactiveTintColor: AppStyles.color.gray500,
                tabBarStyle: {
                    backgroundColor: AppStyles.color.white,
                    borderTopWidth: 1,
                    borderTopColor: AppStyles.color.border,
                    height: Platform.OS === 'ios' ? 88 : 60, // Extra height for iOS safe area
                    paddingTop: 8,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
                    ...Platform.select({
                        ios: {
                            shadowColor: AppStyles.color.shadow,
                            shadowOffset: {width: 0, height: -2},
                            shadowRadius: 8,
                            shadowOpacity: 0.1,
                        },
                        android: {
                            elevation: 8,
                        },
                    }),
                },
                tabBarLabelStyle: {
                    ...AppStyles.typography.caption2,
                    marginTop: 4,
                },
                tabBarIconStyle: {
                    marginTop: 4,
                },
                headerShown: false,
            }}
        >
            <BottomTabs.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    title: "Home",
                    tabBarIcon: ({color, focused}) => (
                        <Ionicons
                            name={focused ? "home" : "home-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <BottomTabs.Screen
                name="Search"
                component={SearchScreen}
                options={{
                    title: "Search",
                    tabBarIcon: ({color, focused}) => (
                        <Ionicons
                            name={focused ? "search" : "search-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <BottomTabs.Screen
                name="Saved"
                component={SavedTabNavigator}
                options={{
                    title: "Saved",
                    tabBarIcon: ({color, focused}) => (
                        <Ionicons
                            name={focused ? "bookmark" : "bookmark-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
        </BottomTabs.Navigator>
    );
}
