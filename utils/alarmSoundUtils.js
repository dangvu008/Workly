import { Audio } from "expo-av";

import { useLocalization } from "../localization/LocalizationContext";

// List of alarm sounds
export const getAlarmSounds = (t) => [
  {
    id: "alarm_1",
    name: t ? t("alarm.sounds.standard") : "Standard Bell",
    file: require("../assets/sounds/alarm_1.mp3"),
  },
  {
    id: "alarm_2",
    name: t ? t("alarm.sounds.gentle") : "Gentle Bell",
    file: require("../assets/sounds/alarm_2.mp3"),
  },
  {
    id: "alarm_3",
    name: t ? t("alarm.sounds.emergency") : "Emergency Bell",
    file: require("../assets/sounds/alarm_3.mp3"),
  },
];

// For backward compatibility
export const ALARM_SOUNDS = getAlarmSounds();

// Sound object to store the currently playing sound
let sound = null;

// Function to play alarm sound
export const playAlarmSound = async (alarmId = "alarm_1", loop = true) => {
  try {
    // If there's a sound playing, stop it first
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }

    // Find sound by ID
    const selectedAlarm =
      ALARM_SOUNDS.find((alarm) => alarm.id === alarmId) || ALARM_SOUNDS[0];

    // Create new Sound object
    const { sound: newSound } = await Audio.Sound.createAsync(
      selectedAlarm.file,
      {
        shouldPlay: true,
        isLooping: loop,
        volume: 1.0,
      }
    );

    sound = newSound;

    // Set audio mode to allow playing when phone is in silent mode
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    return sound;
  } catch (error) {
    console.error("Error playing alarm sound:", error);
    return null;
  }
};

// Function to stop alarm sound
export const stopAlarmSound = async () => {
  try {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      sound = null;
    }
  } catch (error) {
    console.error("Error stopping alarm sound:", error);
  }
};

// Function to check if alarm is playing
export const isAlarmPlaying = async () => {
  try {
    if (sound) {
      const status = await sound.getStatusAsync();
      return status.isLoaded && status.isPlaying;
    }
    return false;
  } catch (error) {
    console.error("Error checking alarm status:", error);
    return false;
  }
};
