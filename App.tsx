import React, { useEffect, Suspense, lazy } from 'react';
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

// ✅ Lazy load screens để tối ưu thời gian khởi động
const HomeScreen = lazy(() => import('./src/screens/HomeScreen').then(module => ({ default: module.HomeScreen })));
const SettingsScreen = lazy(() => import('./src/screens/SettingsScreen').then(module => ({ default: module.SettingsScreen })));
const ShiftManagementScreen = lazy(() => import('./src/screens/ShiftManagementScreen').then(module => ({ default: module.ShiftManagementScreen })));
const AddEditShiftScreen = lazy(() => import('./src/screens/AddEditShiftScreen').then(module => ({ default: module.AddEditShiftScreen })));
const NotesScreen = lazy(() => import('./src/screens/NotesScreen').then(module => ({ default: module.NotesScreen })));
const NoteDetailScreen = lazy(() => import('./src/screens/NoteDetailScreen').then(module => ({ default: module.NoteDetailScreen })));
const StatisticsScreen = lazy(() => import('./src/screens/StatisticsScreen').then(module => ({ default: module.StatisticsScreen })));
const WeatherDetailScreen = lazy(() => import('./src/screens/WeatherDetailScreen').then(module => ({ default: module.WeatherDetailScreen })));
const ManualStatusUpdateScreen = lazy(() => import('./src/screens/ManualStatusUpdateScreen').then(module => ({ default: module.ManualStatusUpdateScreen })));


const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// ✅ Wrapper component với Suspense cho lazy loading
function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const currentLanguage = state.settings?.language || 'vi';

  return (
    <Suspense fallback={<LoadingSpinner message={t(currentLanguage, 'common.loading')} />}>
      {children}
    </Suspense>
  );
}

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

          // ✅ Sử dụng TabIcon đơn giản thay vì TabBarIcon phức tạp
          return <TabIcon focused={focused} color={color} size={size} iconName={iconName} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
          elevation: 8,
          height: 75, // Tăng chiều cao từ 60 lên 75
          paddingBottom: 16, // Tăng padding bottom từ 8 lên 16 để tạo khoảng cách với đáy
          paddingTop: 12, // Tăng padding top từ 8 lên 12 để cân bằng
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 4, // Thêm margin bottom cho text để tạo khoảng cách với đáy
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        options={{
          tabBarLabel: t(currentLanguage, 'navigation.home'),
        }}
      >
        {(props) => <SuspenseWrapper><HomeScreen {...props} /></SuspenseWrapper>}
      </Tab.Screen>
      <Tab.Screen
        name="ShiftsTab"
        options={{
          tabBarLabel: t(currentLanguage, 'navigation.shifts'),
        }}
      >
        {(props) => <SuspenseWrapper><ShiftManagementScreen {...props} /></SuspenseWrapper>}
      </Tab.Screen>
      <Tab.Screen
        name="NotesTab"
        options={{
          tabBarLabel: t(currentLanguage, 'navigation.notes'),
        }}
      >
        {(props) => <SuspenseWrapper><NotesScreen {...props} /></SuspenseWrapper>}
      </Tab.Screen>
      <Tab.Screen
        name="StatisticsTab"
        options={{
          tabBarLabel: t(currentLanguage, 'navigation.statistics'),
        }}
      >
        {(props) => <SuspenseWrapper><StatisticsScreen {...props} /></SuspenseWrapper>}
      </Tab.Screen>
      <Tab.Screen
        name="SettingsTab"
        options={{
          tabBarLabel: t(currentLanguage, 'navigation.settings'),
        }}
      >
        {(props) => <SuspenseWrapper><SettingsScreen {...props} /></SuspenseWrapper>}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { state } = useApp();

  const theme = state.settings?.theme === 'dark' ? darkTheme : lightTheme;

  // ✅ Tối ưu splash screen - ẩn ngay khi có dữ liệu cơ bản
  useEffect(() => {
    const hideSplash = async () => {
      try {
        // Chỉ ẩn splash screen khi không còn loading
        if (!state.isLoading) {
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        console.warn('Lỗi ẩn splash screen:', error);
      }
    };

    // Ẩn splash screen ngay khi loading hoàn thành
    if (!state.isLoading) {
      const timer = setTimeout(hideSplash, 50); // Giảm delay từ 100ms xuống 50ms
      return () => clearTimeout(timer);
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
          <Stack.Screen name="ShiftManagement">
            {(props) => <SuspenseWrapper><ShiftManagementScreen {...props} /></SuspenseWrapper>}
          </Stack.Screen>
          <Stack.Screen name="AddEditShift">
            {(props) => <SuspenseWrapper><AddEditShiftScreen {...props} /></SuspenseWrapper>}
          </Stack.Screen>
          <Stack.Screen name="NoteDetail">
            {(props) => <SuspenseWrapper><NoteDetailScreen {...props} /></SuspenseWrapper>}
          </Stack.Screen>
          <Stack.Screen name="WeatherDetail">
            {(props) => <SuspenseWrapper><WeatherDetailScreen {...props} /></SuspenseWrapper>}
          </Stack.Screen>
          <Stack.Screen name="ManualStatusUpdate">
            {(props) => <SuspenseWrapper><ManualStatusUpdateScreen {...props} /></SuspenseWrapper>}
          </Stack.Screen>

        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}



/**
 * ✅ App tối ưu hóa - Loại bỏ icon preloader không cần thiết
 * Expo tự động handle icon loading, không cần preload thủ công
 */

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
