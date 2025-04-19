"use client";

import { useState, useEffect, useCallback } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AppProvider } from "./context/AppContext";
import HomeScreen from "./screens/HomeScreen";
import ShiftListScreen from "./screens/ShiftListScreen";
import ShiftDetailScreen from "./screens/ShiftDetailScreen";
import SettingsScreen from "./screens/SettingsScreen";
import CheckInOutScreen from "./screens/CheckInOutScreen";
import WeatherScreen from "./screens/WeatherScreen";
import BackupRestoreScreen from "./screens/BackupRestoreScreen";
import NotesScreen from "./screens/NotesScreen";
import { COLORS } from "./constants/colors";
import {
  LocalizationProvider,
  useLocalization,
} from "./localization/LocalizationContext";
import { View, Text, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import BottomNav from "./components/BottomNav";
// Import the ThemeProvider
import { ThemeProvider, useTheme } from "./context/ThemeContext";
// Import SplashScreen
import * as SplashScreen from "expo-splash-screen";
import AnimatedSplashScreen from "./components/AnimatedSplashScreen";
// Add the import for TranslationDemoScreen
import TranslationDemoScreen from "./screens/TranslationDemoScreen";

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Component tạm thời hiển thị khi đang tải i18n
const LoadingScreen = () => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: COLORS.background,
    }}
  >
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={{ marginTop: 16, color: COLORS.darkGray }}>
      Đang tải ứng dụng...
    </Text>
  </View>
);

// Stack Navigator cho Home
const HomeStack = () => {
  const { t } = useLocalization();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ title: t("common.appName") }}
      />
      <Stack.Screen
        name="CheckInOut"
        component={CheckInOutScreen}
        options={{
          title: `${t("attendance.checkIn")} / ${t("attendance.checkOut")}`,
        }}
      />
    </Stack.Navigator>
  );
};

// Stack Navigator cho Shifts
const ShiftsStack = () => {
  const { t } = useLocalization();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="ShiftList"
        component={ShiftListScreen}
        options={{ title: t("shifts.shiftList") }}
      />
      <Stack.Screen
        name="ShiftDetail"
        component={ShiftDetailScreen}
        options={({ route }) => ({
          title: route.params?.isNew
            ? t("shifts.addShift")
            : t("shifts.shiftDetails"),
        })}
      />
    </Stack.Navigator>
  );
};

// Stack Navigator cho Settings
const SettingsStack = () => {
  const { t } = useLocalization();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{ title: t("settings.settings") }}
      />
      <Stack.Screen
        name="BackupRestore"
        component={BackupRestoreScreen}
        options={{ title: t("backup.backupRestore") }}
      />
      <Stack.Screen
        name="TranslationDemo"
        component={TranslationDemoScreen}
        options={{ title: t("settings.language") }}
      />
    </Stack.Navigator>
  );
};

// Tối ưu hóa TabNavigator bằng useMemo
const TabNav = () => {
  const { t } = useLocalization();
  const { isDarkMode } = useTheme();

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: COLORS.appPurple,
          tabBarInactiveTintColor: COLORS.appDarkTextSecondary,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
            height: 70,
          },
          tabBarLabelStyle: {
            fontSize: 12,
          },
          headerShown: false,
        }}
        tabBar={(props) => <BottomNav {...props} />}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{
            tabBarLabel: t("common.appName"),
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Shifts"
          component={ShiftsStack}
          options={{
            tabBarLabel: t("shifts.shiftList"),
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="work" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Notes"
          component={NotesScreen}
          options={{
            tabBarLabel: t("notes.notes"),
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="event-note" size={size} color={color} />
            ),
            headerStyle: {
              backgroundColor: COLORS.primary,
            },
            headerTintColor: COLORS.white,
            headerTitleStyle: {
              fontWeight: "bold",
            },
            headerShown: true,
            title: t("notes.notes"),
          }}
        />
        <Tab.Screen
          name="Weather"
          component={WeatherScreen}
          options={{
            tabBarLabel: t("weather.weather"),
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="wb-cloudy" size={size} color={color} />
            ),
            headerStyle: {
              backgroundColor: COLORS.primary,
            },
            headerTintColor: COLORS.white,
            headerTitleStyle: {
              fontWeight: "bold",
            },
            headerShown: true,
            title: t("weather.weather"),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsStack}
          options={{
            tabBarLabel: t("settings.settings"),
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="settings" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </>
  );
};

// Component chính sau khi đã tải i18n
const AppWithNavigation = () => {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

  // Tối ưu hóa onAnimationComplete bằng useCallback
  const onAnimationComplete = useCallback(() => {
    setShowAnimatedSplash(false);
  }, []); // Không cần thêm dependencies vì không sử dụng biến bên ngoài

  useEffect(() => {
    // When app is ready, we can show our animated splash screen
    if (appIsReady) {
      SplashScreen.hideAsync().catch((error) => {
        console.warn("Error hiding splash screen:", error);
      });
    }
  }, [appIsReady]); // Thêm appIsReady vào dependencies

  return (
    <SafeAreaProvider>
      <AppProvider>
        <LocalizationProvider>
          <ThemeProvider>
            <NavigationContainer>
              {showAnimatedSplash ? (
                <AnimatedSplashScreen
                  onAnimationComplete={onAnimationComplete}
                />
              ) : null}
              <TabNav />
            </NavigationContainer>
          </ThemeProvider>
        </LocalizationProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
};

// Component gốc của ứng dụng
export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    // Prepare app
    const prepare = async () => {
      try {
        // Simulate some loading time for resources
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // App is ready
        setAppIsReady(true);
      } catch (error) {
        console.error("Error initializing app:", error);
        // Still set app ready to avoid infinite loading
        setAppIsReady(true);
      }
    };

    prepare();
  }, []);

  // Hiển thị ứng dụng sau khi đã khởi tại
  return <AppWithNavigation />;
}
