"use client";

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAppContext } from "../context/AppContext";
import { COLORS } from "../constants/colors";
import { MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { useLocalization } from "../localization/LocalizationContext";

const BackupRestoreScreen = () => {
  const { exportData, importData } = useAppContext();
  const { t } = useLocalization();
  const [loading, setLoading] = useState(false);

  const handleExportData = async () => {
    try {
      setLoading(true);
      const data = await exportData();
      const fileName = `workly_backup_${
        new Date().toISOString().split("T")[0]
      }.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, data);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      } else {
        Alert.alert(
          t("backup.sharingNotAvailable"),
          t("backup.sharingNotAvailableMessage")
        );
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      Alert.alert(t("common.error"), t("backup.exportError"));
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.type === "success") {
        const fileContent = await FileSystem.readAsStringAsync(result.uri);

        Alert.alert(
          t("backup.confirmRestore"),
          t("backup.confirmRestoreMessage"),
          [
            { text: t("common.cancel"), style: "cancel" },
            {
              text: t("backup.importData"),
              onPress: async () => {
                try {
                  await importData(fileContent);
                  Alert.alert(t("common.success"), t("backup.importSuccess"));
                } catch (error) {
                  console.error("Error importing data:", error);
                  Alert.alert(t("common.error"), t("backup.importError"));
                } finally {
                  setLoading(false);
                }
              },
            },
          ]
        );
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert(t("common.error"), t("backup.documentPickerError"));
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t("backup.processing")}</Text>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("backup.backupData")}</Text>
            <Text style={styles.sectionDescription}>
              {t("backup.backupDescription")}
            </Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleExportData}
            >
              <MaterialIcons name="backup" size={24} color={COLORS.white} />
              <Text style={styles.actionButtonText}>
                {t("backup.exportData")}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("backup.restoreData")}</Text>
            <Text style={styles.sectionDescription}>
              {t("backup.restoreDescription")}
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, styles.restoreButton]}
              onPress={handleImportData}
            >
              <MaterialIcons name="restore" size={24} color={COLORS.white} />
              <Text style={styles.actionButtonText}>
                {t("backup.importData")}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.warningSection}>
            <MaterialIcons name="warning" size={24} color={COLORS.warning} />
            <Text style={styles.warningText}>{t("backup.backupWarning")}</Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.darkGray,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: COLORS.text,
  },
  sectionDescription: {
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  restoreButton: {
    backgroundColor: COLORS.accent,
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    marginLeft: 8,
  },
  warningSection: {
    backgroundColor: COLORS.warning + "20",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  warningText: {
    marginLeft: 8,
    color: COLORS.darkGray,
    flex: 1,
  },
});

export default BackupRestoreScreen;
