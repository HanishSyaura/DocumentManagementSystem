// src/navigations/AppNavigator.tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import MainScreen from '../screens/MainScreen';
import SearchScreen from '../screens/SearchScreen';
import CheckInScreen from '../screens/CheckInScreen';
import ArchiveScreen from '../screens/ArchiveScreen';
import CheckOutScreen from '../screens/CheckOutScreen';
import SettingScreen from '../screens/SettingScreen';
import SignInScreen from '../screens/SignInScreen';
import { Colors } from '../styles/theme';
import { AuthBackend } from '../backend';
import type { AuthState } from '../backend/auth/authStore';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const [auth, setAuth] = useState<AuthState>(() => AuthBackend.getState());

  useEffect(() => {
    return AuthBackend.onChange(setAuth);
  }, []);

  if (!auth.initialized) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e64a8' }}>
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        key={auth.loggedIn ? 'app' : 'auth'}
        initialRouteName={auth.loggedIn ? 'Home' : 'SignIn'}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ color, size }) => {
            let name = 'view-grid-outline';
            if (route.name === 'Home') name = 'view-dashboard-outline';
            else if (route.name === 'Search') name = 'magnify';
            else if (route.name === 'CheckIn') name = 'folder-download-outline';
            else if (route.name === 'Archive') name = 'archive-outline';
            else if (route.name === 'CheckOut') name = 'folder-upload-outline';
            else if (route.name === 'Settings') name = 'cog-outline';
            return <Icon name={name} size={size} color={color} />;
          },
        })}
      >
        {auth.loggedIn ? (
          <>
            <Tab.Screen name="Home" component={MainScreen} />
            <Tab.Screen name="Search" component={SearchScreen} />
            <Tab.Screen name="CheckIn" component={CheckInScreen} />
            <Tab.Screen name="Archive" component={ArchiveScreen} />
            <Tab.Screen name="CheckOut" component={CheckOutScreen} />
            <Tab.Screen name="Settings" component={SettingScreen} />
          </>
        ) : (
          <Tab.Screen name="SignIn" component={SignInScreen} />
        )}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
