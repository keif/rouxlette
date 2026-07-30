import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SavedTabParamList } from '../types';
import AppStyles from '../AppStyles';
import { supperClub } from '../theme/supperClub';
import FavoritesScreen from '../screens/FavoritesScreen';
import BlockedScreen from '../screens/BlockedScreen';
import HistoryScreen from '../screens/HistoryScreen';
import { MaterialIcons } from '@expo/vector-icons';

const SavedTabs = createMaterialTopTabNavigator<SavedTabParamList>();

export function SavedTabNavigator() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: supperClub.background }} edges={['top']}>
      <SavedTabs.Navigator
        initialRouteName="Favorites"
        screenOptions={{
          tabBarActiveTintColor: supperClub.gold,
          tabBarInactiveTintColor: supperClub.textMuted,
          tabBarStyle: {
            backgroundColor: supperClub.background,
            borderBottomWidth: 1,
            borderBottomColor: supperClub.borderSoft,
          },
        tabBarIndicatorStyle: {
          backgroundColor: supperClub.gold,
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
      <SavedTabs.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name={focused ? 'favorite' : 'favorite-border'}
              size={20}
              color={color}
            />
          ),
        }}
      />
      <SavedTabs.Screen
        name="Blocked"
        component={BlockedScreen}
        options={{
          title: 'Blocked',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name="block"
              size={20}
              color={color}
            />
          ),
        }}
      />
      <SavedTabs.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name={focused ? 'history' : 'history'}
              size={20}
              color={color}
            />
          ),
        }}
      />
      </SavedTabs.Navigator>
    </SafeAreaView>
  );
}