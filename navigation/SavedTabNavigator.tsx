import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SavedTabParamList } from '../types';
import AppStyles from '../AppStyles';
import FavoritesScreen from '../screens/FavoritesScreen';
import HistoryScreen from '../screens/HistoryScreen';
import { MaterialIcons } from '@expo/vector-icons';

const SavedTabs = createMaterialTopTabNavigator<SavedTabParamList>();

export function SavedTabNavigator() {
  return (
    <SavedTabs.Navigator
      initialRouteName="Favorites"
      screenOptions={{
        tabBarActiveTintColor: AppStyles.color.roulette.accent,
        tabBarInactiveTintColor: AppStyles.color.greylight,
        tabBarStyle: {
          backgroundColor: AppStyles.color.white,
          borderBottomWidth: 1,
          borderBottomColor: AppStyles.color.background,
        },
        tabBarIndicatorStyle: {
          backgroundColor: AppStyles.color.roulette.accent,
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
  );
}