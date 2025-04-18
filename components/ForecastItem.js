import { View, Text } from "react-native"
import WeatherIcon from "./WeatherIcon"
import { useTranslation } from "../i18n/useTranslation"
import { forecastItemStyles } from "../styles/components/forecastItem"

const ForecastItem = ({ day, date, icon, minTemp, maxTemp, description }) => {
  const { t } = useTranslation()

  // Format the date to display day name
  const formatDay = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    // Check if it's today or tomorrow
    if (date.toDateString() === today.toDateString()) {
      return t("weather.today")
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t("weather.tomorrow")
    }

    // Otherwise return the day name
    return date.toLocaleDateString(undefined, { weekday: "short" })
  }

  // Format the date to display date in short format
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  }

  return (
    <View style={forecastItemStyles.container}>
      <View style={forecastItemStyles.dayContainer}>
        <Text style={forecastItemStyles.dayText}>{day || formatDay(date)}</Text>
        <Text style={forecastItemStyles.dateText}>{formatDate(date)}</Text>
      </View>

      <View style={forecastItemStyles.iconContainer}>
        <WeatherIcon iconCode={icon} size={40} />
      </View>

      <View style={forecastItemStyles.tempContainer}>
        <Text style={forecastItemStyles.maxTemp}>{Math.round(maxTemp)}°</Text>
        <Text style={forecastItemStyles.minTemp}>{Math.round(minTemp)}°</Text>
      </View>

      <Text style={forecastItemStyles.description} numberOfLines={1} ellipsizeMode="tail">
        {description}
      </Text>
    </View>
  )
}

export default ForecastItem
