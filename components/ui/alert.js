// components/ui/alert.js

import * as React from "react"
import { View, Text, StyleSheet } from "react-native"
import { COLORS } from "../../constants/colors"

// Simple utility function to conditionally join classnames
const cn = (...classNames) => {
  return classNames.filter(Boolean).join(" ")
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog"

const Alert = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <View style={styles.alert} {...props} ref={ref}>
      {children}
    </View>
  )
})
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <Text style={styles.alertTitle} {...props} ref={ref}>
      {children}
    </Text>
  )
})
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <Text style={styles.alertDescription} {...props} ref={ref}>
      {children}
    </Text>
  )
})
AlertDescription.displayName = "AlertDescription"

const styles = StyleSheet.create({
  alert: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.2)",
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    padding: 16,
  },
  alertTitle: {
    marginBottom: 4,
    fontWeight: "bold",
    color: COLORS.error,
  },
  alertDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
})

export {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
