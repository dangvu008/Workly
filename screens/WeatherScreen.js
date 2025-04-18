"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from "react-native"
import { useAppContext } from "../context/AppContext"
import { MaterialIcons } from "@expo/vector-icons"
import * as Location from "expo-location"
import WeatherIcon from "../components/WeatherIcon"
import ForecastItem from "../components/ForecastItem"
import { useTranslation } from "../i18n/useTranslation"
import { useTheme } from "../context/ThemeContext"
import { weatherScreenStyles } from "../styles/screens/weatherScreen"

// Constants
const WEATHER_REFRESH_INTERVAL = 3600000 // 1 hour in milliseconds
const LOCATION_CONFIG = {
  accuracy: Location.Accuracy.Balanced,
}
const WEATHER_THRESHOLDS = {
  HIGH_TEMP: 35,
  LOW_TEMP: 10,
  HEAVY_RAIN: 10, // mm per hour
}

// Memoized WeatherDetail component
const WeatherDetail = memo(({ icon, text, color }) => (
  <View style={weatherScreenStyles.detailItem}>
    <MaterialIcons name={icon} size={24} color={color} />
    <Text style={[weatherScreenStyles.detailText, { color }]}>{text}</Text>
  </View>
))

WeatherDetail.displayName = "WeatherDetail"

// Memoized WeatherWarning component
const WeatherWarning = memo(({ warning, color }) => {
  if (!warning) return null

  return (
    <View style={weatherScreenStyles.warningContainer}>
      <MaterialIcons name="warning" size={24} color={color} />
      <Text style={weatherScreenStyles.warningText}>{warning}</Text>
    </View>
  )
})

WeatherWarning.displayName = "WeatherWarning"

// Memoized WeatherHeader component
const WeatherHeader = memo(({ location, lastUpdatedTime, colors }) => (
  <View style={weatherScreenStyles.weatherHeader}>
    <Text style={[weatherScreenStyles.locationText, { color: colors.text }]}>{location}</Text>
    <Text style={[weatherScreenStyles.updateText, { color: colors.gray }]}>{lastUpdatedTime}</Text>
  </View>
))

WeatherHeader.displayName = "WeatherHeader"

// Memoized WeatherMain component
const WeatherMain = memo(({ icon, temperature, description, colors }) => (
  <View style={weatherScreenStyles.weatherMain}>
    <WeatherIcon iconCode={icon} size={100} />
    <Text style={[weatherScreenStyles.temperatureText, { color: colors.text }]}>{temperature}°C</Text>
    <Text style={[weatherScreenStyles.descriptionText, { color: colors.darkGray }]}>{description}</Text>
  </View>
))

WeatherMain.displayName = "WeatherMain"

// Main WeatherScreen component
const WeatherScreen = () => {
  const { userSettings, weatherData, updateWeatherData, updateSettings } = useAppContext()
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [forecast, setForecast] = useState([])
  const [locationPermission, setLocationPermission] = useState(null)
  const { t } = useTranslation()
  const { colors } = useTheme()

  // Memoize API key
  const OPENWEATHER_API_KEY = useMemo(() => process.env.OPENWEATHER_API_KEY || "db077a0c565a5ff3e7a3ca8ff9623575", [])

  // Check if weather data is stale (older than 1 hour)
  const isWeatherDataStale = useMemo(() => {
    if (!weatherData || !weatherData.lastUpdated) return true

    const lastUpdate = new Date(weatherData.lastUpdated)
    const now = new Date()
    return now - lastUpdate > WEATHER_REFRESH_INTERVAL
  }, [weatherData])

  // Format update time - optimized with useCallback
  const formatUpdateTime = useCallback(
    (dateString) => {
      if (!dateString) return ""

      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return ""

        return date.toLocaleTimeString(userSettings.language === "vi" ? "vi-VN" : "en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: userSettings.timeFormat === "12h",
        })
      } catch (error) {
        console.error("Error formatting date:", error)
        return ""
      }
    },
    [userSettings.language, userSettings.timeFormat],
  )

  // Process forecast data - optimized with useCallback
  const processForecastData = useCallback((forecastList) => {
    if (!forecastList || !Array.isArray(forecastList) || forecastList.length === 0) {
      return []
    }

    const dailyData = {}

    // Group forecast data by day
    forecastList.forEach((item) => {
      if (!item || !item.dt) return

      const date = new Date(item.dt * 1000)
      const day = date.toISOString().split("T")[0]

      if (!dailyData[day]) {
        dailyData[day] = {
          date: date.toISOString(),
          temps: [],
          icons: [],
          descriptions: [],
        }
      }

      if (item.main && typeof item.main.temp === "number") {
        dailyData[day].temps.push(item.main.temp)
      }

      if (item.weather && item.weather[0]) {
        dailyData[day].icons.push(item.weather[0].icon)
        dailyData[day].descriptions.push(item.weather[0].description)
      }
    })

    // Calculate min/max temperatures and get most frequent icon and description
    const processedData = Object.keys(dailyData).map((day) => {
      const dayData = dailyData[day]

      // Get min and max temperatures
      const minTemp = dayData.temps.length > 0 ? Math.min(...dayData.temps) : 0
      const maxTemp = dayData.temps.length > 0 ? Math.max(...dayData.temps) : 0

      // Get most frequent icon
      const iconCounts = {}
      dayData.icons.forEach((icon) => {
        iconCounts[icon] = (iconCounts[icon] || 0) + 1
      })
      const icon = Object.keys(iconCounts).reduce(
        (a, b) => (iconCounts[a] > iconCounts[b] ? a : b),
        dayData.icons[0] || "",
      )

      // Get most frequent description
      const descCounts = {}
      dayData.descriptions.forEach((desc) => {
        descCounts[desc] = (descCounts[desc] || 0) + 1
      })
      const description = Object.keys(descCounts).reduce(
        (a, b) => (descCounts[a] > descCounts[b] ? a : b),
        dayData.descriptions[0] || "",
      )

      return {
        date: dayData.date,
        minTemp,
        maxTemp,
        icon,
        description,
      }
    })

    // Sort by date and limit to 5 days
    return processedData.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5)
  }, [])

  // Check for extreme weather conditions - optimized with useCallback
  const checkForExtremeWeather = useCallback(
    (weatherData) => {
      if (!weatherData || !weatherData.main) return null

      // Check for extreme weather conditions
      if (weatherData.main.temp > WEATHER_THRESHOLDS.HIGH_TEMP) {
        return t("weather.warnings.highTemp")
      } else if (weatherData.main.temp < WEATHER_THRESHOLDS.LOW_TEMP) {
        return t("weather.warnings.lowTemp")
      }

      if (weatherData.weather && weatherData.weather[0]) {
        if (weatherData.weather[0].main === "Thunderstorm") {
          return t("weather.warnings.thunderstorm")
        } else if (
          weatherData.weather[0].main === "Rain" &&
          weatherData.rain &&
          weatherData.rain["1h"] > WEATHER_THRESHOLDS.HEAVY_RAIN
        ) {
          return t("weather.warnings.heavyRain")
        }
      }

      return null
    },
    [t],
  )

  // Check location permission - optimized with useCallback
  const checkLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync()
      setLocationPermission(status)
      return status === "granted"
    } catch (error) {
      console.error("Error checking location permission:", error)
      setLocationPermission("denied")
      return false
    }
  }, [])

  // Request location permission - optimized with useCallback
  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      setLocationPermission(status)
      return status === "granted"
    } catch (error) {
      console.error("Error requesting location permission:", error)
      setLocationPermission("denied")
      return false
    }
  }, [])

  // Get current location - optimized with useCallback
  const getCurrentLocation = useCallback(async () => {
    try {
      // Check if permission is already granted
      const hasPermission = await checkLocationPermission()

      // If not, request permission
      if (!hasPermission) {
        const granted = await requestLocationPermission()
        if (!granted) {
          throw new Error(t("weather.locationDenied"))
        }
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync(LOCATION_CONFIG)
      return location.coords
    } catch (error) {
      console.error("Error getting location:", error)
      throw error
    }
  }, [checkLocationPermission, requestLocationPermission, t])

  // Fetch weather data - optimized with useCallback
  const fetchWeatherData = useCallback(
    async (isRefreshing = false) => {
      if (loading && !isRefreshing) return // Prevent multiple simultaneous fetches

      try {
        isRefreshing ? setRefreshing(true) : setLoading(true)
        setError(null)

        // Get current location
        const { latitude, longitude } = await getCurrentLocation()

        // Update location in settings
        updateSettings({
          weatherLocation: { lat: latitude, lon: longitude },
        })

        // Fetch current weather data from OpenWeather API
        const weatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHER_API_KEY}&lang=${userSettings.language}`,
        )

        if (!weatherResponse.ok) {
          throw new Error(`${t("weather.weatherError")} (${weatherResponse.status})`)
        }

        const weatherData = await weatherResponse.json()

        // Fetch forecast data (5 days / 3 hour forecast)
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHER_API_KEY}&lang=${userSettings.language}`,
        )

        if (!forecastResponse.ok) {
          throw new Error(`${t("weather.forecastError")} (${forecastResponse.status})`)
        }

        const forecastData = await forecastResponse.json()

        // Get location name
        const locationResponse = await fetch(
          `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${OPENWEATHER_API_KEY}`,
        )

        let locationName = t("weather.currentLocation")

        if (locationResponse.ok) {
          const locationData = await locationResponse.json()
          if (locationData.length > 0) {
            locationName = locationData[0].name
            if (locationData[0].state && locationData[0].state !== locationData[0].name) {
              locationName += `, ${locationData[0].state}`
            }
          }
        }

        // Check for extreme weather conditions
        const warningKey = checkForExtremeWeather(weatherData)
        const warning = warningKey ? t(warningKey) : null

        // Update weather data
        const weatherInfo = {
          location: locationName,
          temperature: Math.round(weatherData.main.temp),
          description: weatherData.weather[0].description,
          humidity: weatherData.main.humidity,
          windSpeed: weatherData.wind.speed,
          icon: weatherData.weather[0].icon,
          warning,
          lastUpdated: new Date().toISOString(),
        }

        updateWeatherData(weatherInfo)

        // Process forecast data
        const processedForecast = processForecastData(forecastData.list)
        setForecast(processedForecast)

        // Show success message
        if (!isRefreshing) {
          Alert.alert(t("common.success"), t("weather.updatedSuccessfully"), [{ text: t("common.ok") }])
        }
      } catch (err) {
        console.error("Error fetching weather:", err)
        setError(err.message || t("weather.weatherError"))
        if (!isRefreshing) {
          Alert.alert(t("common.error"), err.message || t("weather.weatherError"), [{ text: t("common.ok") }])
        }
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [
      loading,
      getCurrentLocation,
      updateSettings,
      OPENWEATHER_API_KEY,
      userSettings.language,
      t,
      checkForExtremeWeather,
      updateWeatherData,
      processForecastData,
    ],
  )

  // Handle pull-to-refresh - optimized with useCallback
  const handleRefresh = useCallback(() => {
    fetchWeatherData(true)
  }, [fetchWeatherData])

  // Memoize last updated time
  const lastUpdatedTime = useMemo(() => {
    return weatherData?.lastUpdated ? `${t("weather.updatedAt")} ${formatUpdateTime(weatherData.lastUpdated)}` : ""
  }, [weatherData?.lastUpdated, formatUpdateTime, t])

  // Automatically fetch data when component mounts or when data is stale
  useEffect(() => {
    const checkAndFetchWeather = async () => {
      // Check if we need to fetch new data
      if (isWeatherDataStale) {
        try {
          // Check permission first without showing UI
          const hasPermission = await checkLocationPermission()

          if (hasPermission) {
            // If permission is granted, fetch weather data
            fetchWeatherData()
          } else {
            // If permission is not granted, just set the permission state
            // We'll show a UI to request permission
            setLocationPermission("denied")
          }
        } catch (error) {
          console.error("Error in initial weather check:", error)
          setError(error.message || t("weather.weatherError"))
        }
      }
    }

    checkAndFetchWeather()
  }, [isWeatherDataStale, checkLocationPermission, fetchWeatherData, t])

  // Memoize UI components to prevent unnecessary re-renders
  const LoadingView = useMemo(
    () => (
      <View style={weatherScreenStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[weatherScreenStyles.loadingText, { color: colors.darkGray }]}>{t("weather.loadingWeather")}</Text>
      </View>
    ),
    [t, colors.primary, colors.darkGray],
  )

  const LocationDeniedView = useMemo(
    () => (
      <View style={weatherScreenStyles.errorContainer}>
        <MaterialIcons name="location-off" size={48} color={colors.error} />
        <Text style={[weatherScreenStyles.errorText, { color: colors.darkGray }]}>{t("weather.locationDenied")}</Text>
        <TouchableOpacity
          style={[weatherScreenStyles.retryButton, { backgroundColor: colors.primary }]}
          onPress={requestLocationPermission}
        >
          <Text style={[weatherScreenStyles.retryButtonText, { color: colors.white }]}>{t("common.allowAccess")}</Text>
        </TouchableOpacity>
      </View>
    ),
    [t, colors, requestLocationPermission],
  )

  const ErrorView = useMemo(
    () => (
      <View style={weatherScreenStyles.errorContainer}>
        <MaterialIcons name="error" size={48} color={colors.error} />
        <Text style={[weatherScreenStyles.errorText, { color: colors.darkGray }]}>{error}</Text>
        <TouchableOpacity
          style={[weatherScreenStyles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => fetchWeatherData()}
        >
          <Text style={[weatherScreenStyles.retryButtonText, { color: colors.white }]}>{t("common.retry")}</Text>
        </TouchableOpacity>
      </View>
    ),
    [error, fetchWeatherData, t, colors],
  )

  const NoDataView = useMemo(
    () => (
      <View style={weatherScreenStyles.errorContainer}>
        <MaterialIcons name="cloud-off" size={48} color={colors.gray} />
        <Text style={[weatherScreenStyles.errorText, { color: colors.darkGray }]}>{t("weather.noWeatherData")}</Text>
        <TouchableOpacity
          style={[weatherScreenStyles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => fetchWeatherData()}
        >
          <Text style={[weatherScreenStyles.retryButtonText, { color: colors.white }]}>{t("weather.loadData")}</Text>
        </TouchableOpacity>
      </View>
    ),
    [fetchWeatherData, t, colors],
  )

  // Memoize forecast items to prevent unnecessary re-renders
  const ForecastItems = useMemo(() => {
    return forecast.map((item, index) => (
      <ForecastItem
        key={`forecast-${index}-${item.date}`}
        date={item.date}
        icon={item.icon}
        minTemp={item.minTemp}
        maxTemp={item.maxTemp}
        description={item.description}
      />
    ))
  }, [forecast])

  // Memoize weather details to prevent unnecessary re-renders
  const WeatherDetails = useMemo(() => {
    if (!weatherData) return null

    return (
      <>
        <WeatherDetail
          icon="opacity"
          text={`${t("weather.humidity")}: ${weatherData.humidity}%`}
          color={colors.primary}
        />
        <WeatherDetail icon="air" text={`${t("weather.wind")}: ${weatherData.windSpeed} m/s`} color={colors.primary} />
      </>
    )
  }, [weatherData, t, colors.primary])

  // Render the component
  return (
    <ScrollView
      style={[weatherScreenStyles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      contentContainerStyle={!weatherData && { flexGrow: 1 }}
    >
      {loading && !refreshing ? (
        LoadingView
      ) : locationPermission === "denied" ? (
        LocationDeniedView
      ) : error ? (
        ErrorView
      ) : weatherData ? (
        <View style={weatherScreenStyles.weatherContainer}>
          <WeatherHeader location={weatherData.location} lastUpdatedTime={lastUpdatedTime} colors={colors} />

          <WeatherMain
            icon={weatherData.icon}
            temperature={weatherData.temperature}
            description={weatherData.description}
            colors={colors}
          />

          <View style={[weatherScreenStyles.weatherDetails, { backgroundColor: colors.card }]}>{WeatherDetails}</View>

          <WeatherWarning warning={weatherData.warning} color={colors.warning} />

          {/* 5-Day Forecast Section */}
          {forecast.length > 0 && (
            <View style={weatherScreenStyles.forecastSection}>
              <Text style={[weatherScreenStyles.forecastTitle, { color: colors.text }]}>{t("weather.forecast")}</Text>
              {ForecastItems}
            </View>
          )}

          <TouchableOpacity
            style={[weatherScreenStyles.refreshButton, { backgroundColor: colors.primary }]}
            onPress={() => fetchWeatherData()}
            disabled={loading}
          >
            <MaterialIcons name="refresh" size={20} color={colors.white} />
            <Text style={[weatherScreenStyles.refreshButtonText, { color: colors.white }]}>{t("weather.update")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        NoDataView
      )}
    </ScrollView>
  )
}

export default memo(WeatherScreen)
