/**
 * ✅ Expo Go Optimized App Component
 * Phiên bản tối ưu cho Expo Go với bundle size nhỏ nhất
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppProvider, useApp } from './src/contexts/AppContext';
import { lightTheme, darkTheme } from './src/constants/themes';
import { t } from './src/i18n';
import { RootStackParamList, TabParamList } from './src/types';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { TabIcon } from './src/components/WorklyIcon';
import { LoadingSpinner } from './src/components/LoadingSpinner';

// ✅ Direct imports cho Expo Go (không lazy load để tránh complexity)
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ShiftManagementScreen } from './src/screens/ShiftManagementScreen';
import { AddEditShiftScreen } from './src/screens/AddEditShiftScreen';
import { NotesScreen } from './src/screens/NotesScreen';
import { NoteDetailScreen } from './src/screens/NoteDetailScreen';
import { StatisticsScreen } from './src/screens/StatisticsScreen';
import { ManualStatusUpdateScreen } from './src/screens/ManualStatusUpdateScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  const { state } = useApp();
  const theme = state.settings?.theme === 'dark' ? darkTheme : lightTheme;
  const currentLanguage = state.settings?.language || 'vi';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap;

          switch (route.name) {
            case 'HomeTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'ShiftsTab':
              iconName = focused ? 'clock' : 'clock-outline';
              break;
            case 'NotesTab':
              iconName = focused ? 'note-text' : 'note-text-outline';
              break;
            case 'StatisticsTab':
              iconName = focused ? 'chart-line' : 'chart-line-variant';
              break;
            case 'SettingsTab':
              iconName = focused ? 'cog' : 'cog-outline';
              break;
            default:
              iconName = 'circle';
          }

          return <TabIcon focused={focused} color={color} size={size} iconName={iconName} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
          elevation: 8,
          height: 75,
          paddingBottom: 16,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 4,
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: t(currentLanguage, 'navigation.home'),
        }}
      />
      <Tab.Screen
        name="ShiftsTab"
        component={ShiftManagementScreen}
        options={{
          tabBarLabel: t(currentLanguage, 'navigation.shifts'),
        }}
      />
      <Tab.Screen
        name="NotesTab"
        component={NotesScreen}
        options={{
          tabBarLabel: t(currentLanguage, 'navigation.notes'),
        }}
      />
      <Tab.Screen
        name="StatisticsTab"
        component={StatisticsScreen}
        options={{
          tabBarLabel: t(currentLanguage, 'navigation.statistics'),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: t(currentLanguage, 'navigation.settings'),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { state } = useApp();
  const theme = state.settings?.theme === 'dark' ? darkTheme : lightTheme;

  // ✅ Simplified splash screen handling cho Expo Go
  useEffect(() => {
    if (!state.isLoading) {
      SplashScreen.hideAsync().catch(console.warn);
    }
  }, [state.isLoading]);

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <StatusBar style={state.settings?.theme === 'dark' ? 'light' : 'dark'} />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="ShiftManagement" component={ShiftManagementScreen} />
          <Stack.Screen name="AddEditShift" component={AddEditShiftScreen} />
          <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
          <Stack.Screen name="ManualStatusUpdate" component={ManualStatusUpdateScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppProvider>
          <AppNavigator />
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
