import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../styles/theme/colors';
import AnimatedTabBarIcon from './AnimatedTabBarIcon';

const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.container}>
      <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel || options.title || route.name;
            const isFocused = state.index === index;

            // Get icon name from options
            const iconName = options.tabBarIcon ? 
              options.tabBarIcon({ 
                focused: isFocused, 
                color: isFocused ? COLORS.appPurple : COLORS.appDarkTextSecondary, 
                size: 24 
              }).props.name : 
              'circle';

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <AnimatedTabBarIcon
                key={route.key}
                label={label}
                iconName={iconName}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityState={isFocused ? { selected: true } : {}}
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  blurContainer: {
    overflow: 'hidden',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0,
  },
  tabBar: {
    flexDirection: 'row',
    height: 70,
    paddingBottom: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
});

export default CustomTabBar;
