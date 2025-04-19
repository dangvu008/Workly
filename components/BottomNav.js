import React, { useRef, useEffect, useMemo } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { COLORS } from "../styles/theme/colors";
import * as Haptics from "expo-haptics";

// Animated tab indicator
const TabIndicator = ({ position, width }) => {
  return (
    <Animated.View
      style={[
        styles.indicator,
        {
          transform: [{ translateX: position }],
          width,
        },
      ]}
    >
      <View style={styles.indicatorGlow} />
    </Animated.View>
  );
};

export const BottomNav = (props) => {
  // Sử dụng props từ Tab.Navigator thay vì useNavigation và useRoute
  const { state, navigation } = props;

  // Define tabs with useMemo to prevent re-creation on each render
  const tabs = useMemo(
    () => [
      { name: "Home", icon: "home", label: "Trang chủ" },
      { name: "Shifts", icon: "work", label: "Ca làm việc" },
      { name: "Notes", icon: "event-note", label: "Ghi chú" },
      { name: "Weather", icon: "wb-cloudy", label: "Thời tiết" },
      { name: "Settings", icon: "settings", label: "Cài đặt" },
    ],
    []
  );

  // Animation values for each tab
  const tabAnimations = useRef(
    tabs.map(() => ({
      scale: new Animated.Value(1),
      opacity: new Animated.Value(0.7),
      rotate: new Animated.Value(0),
    }))
  ).current;

  // Calculate indicator position
  const tabWidth = 100 / tabs.length;
  const currentTabIndex = state ? state.index : 0;
  const indicatorPosition = useRef(
    new Animated.Value(currentTabIndex * tabWidth)
  ).current;

  // Update animations when route changes
  useEffect(() => {
    const activeIndex = state ? state.index : 0;

    // Animate all tabs
    tabs.forEach((_, index) => {
      const isActive = index === activeIndex;

      // Scale animation
      Animated.spring(tabAnimations[index].scale, {
        toValue: isActive ? 1.2 : 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Opacity animation
      Animated.timing(tabAnimations[index].opacity, {
        toValue: isActive ? 1 : 0.7,
        duration: 250,
        useNativeDriver: true,
      }).start();

      // Rotation animation (only for active tab)
      if (isActive) {
        Animated.sequence([
          Animated.timing(tabAnimations[index].rotate, {
            toValue: 0.05,
            duration: 100,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(tabAnimations[index].rotate, {
            toValue: -0.05,
            duration: 100,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(tabAnimations[index].rotate, {
            toValue: 0,
            duration: 100,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });

    // Animate indicator
    Animated.spring(indicatorPosition, {
      toValue: activeIndex * tabWidth,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [state, tabs, tabAnimations, indicatorPosition, tabWidth]);

  // Handle tab press
  const handleTabPress = (tabName, index) => {
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Navigate to the tab using the navigation prop from Tab.Navigator
    const isFocused = state.index === index;
    const event = navigation.emit({
      type: "tabPress",
      target: tabName,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(tabName);
    }
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
        <View style={styles.content}>
          {/* Animated indicator */}
          <TabIndicator
            position={Animated.multiply(
              indicatorPosition,
              new Animated.Value((tabWidth / 100) * styles.content.width)
            )}
            width={tabWidth + "%"}
          />

          {/* Tab buttons */}
          {tabs.map((tab, index) => {
            const isActive = state ? state.index === index : false;

            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.tab}
                onPress={() => handleTabPress(tab.name, index)}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={[
                    styles.iconContainer,
                    isActive && styles.activeIconContainer,
                    {
                      transform: [
                        { scale: tabAnimations[index].scale },
                        {
                          rotate: tabAnimations[index].rotate.interpolate({
                            inputRange: [-0.05, 0, 0.05],
                            outputRange: ["-5deg", "0deg", "5deg"],
                          }),
                        },
                      ],
                      opacity: tabAnimations[index].opacity,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={tab.icon}
                    size={20}
                    color={
                      isActive ? COLORS.appPurple : COLORS.appDarkTextSecondary
                    }
                  />
                  {isActive && <View style={styles.iconGlow} />}
                </Animated.View>
                <Animated.Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive
                        ? COLORS.appPurple
                        : COLORS.appDarkTextSecondary,
                      opacity: tabAnimations[index].opacity,
                    },
                  ]}
                >
                  {tab.label}
                </Animated.Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  blurContainer: {
    overflow: "hidden",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderBottomWidth: 0,
  },
  content: {
    flexDirection: "row",
    height: 55, // Giảm chiều cao xuống
    width: "100%",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    position: "relative",
  },
  tab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 4, // Giảm padding
  },
  iconContainer: {
    width: 36, // Giảm kích thước icon
    height: 36, // Giảm kích thước icon
    borderRadius: 18, // Giảm border radius tương ứng
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 1, // Giảm margin
    backgroundColor: "transparent",
    position: "relative",
  },
  activeIconContainer: {
    backgroundColor: "rgba(147, 51, 234, 0.1)",
  },
  iconGlow: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 18, // Giảm border radius tương ứng
    backgroundColor: "transparent",
    shadowColor: COLORS.appPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8, // Giảm shadow radius
    elevation: 4, // Giảm elevation
  },
  tabLabel: {
    fontSize: 10, // Giảm kích thước font
    fontWeight: "500",
  },
  indicator: {
    height: 3,
    backgroundColor: COLORS.appPurple,
    position: "absolute",
    bottom: 0,
    left: 0,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  indicatorGlow: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
    shadowColor: COLORS.appPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
});

export default BottomNav;
