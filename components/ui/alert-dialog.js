import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { COLORS } from "../../constants/colors"

export const AlertDialog = ({ children }) => {
  return <View>{children}</View>
}

export const AlertDialogTrigger = ({ children, ...props }) => {
  return <TouchableOpacity {...props}>{children}</TouchableOpacity>
}

export const AlertDialogContent = ({ children }) => {
  return <View style={styles.content}>{children}</View>
}

export const AlertDialogHeader = ({ children }) => {
  return <View style={styles.header}>{children}</View>
}

export const AlertDialogFooter = ({ children }) => {
  return <View style={styles.footer}>{children}</View>
}

export const AlertDialogTitle = ({ children }) => {
  return <Text style={styles.title}>{children}</Text>
}

export const AlertDialogDescription = ({ children }) => {
  return <Text style={styles.description}>{children}</Text>
}

export const AlertDialogAction = ({ children, ...props }) => {
  return (
    <TouchableOpacity style={styles.action} {...props}>
      {children}
    </TouchableOpacity>
  )
}

export const AlertDialogCancel = ({ children, ...props }) => {
  return (
    <TouchableOpacity style={styles.cancel} {...props}>
      {children}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    width: "80%",
    maxWidth: 500,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    marginBottom: 12,
  },
  footer: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  description: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  action: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
  },
  cancel: {
    backgroundColor: COLORS.lightGray,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
})
