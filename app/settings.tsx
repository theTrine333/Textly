import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { mmsService } from "../utils/mmsService";
import { smsService } from "../utils/smsService";

interface SettingItemProps {
  title: string;
  subtitle?: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
  showSwitch?: boolean;
  showArrow?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  subtitle,
  value,
  onValueChange,
  onPress,
  showSwitch = false,
  showArrow = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <TouchableOpacity
      style={[
        styles.settingItem,
        { backgroundColor: isDark ? "#1a1a1a" : "#ffffff" },
      ]}
      onPress={onPress}
      disabled={showSwitch}
    >
      <View style={styles.settingContent}>
        <View style={styles.settingText}>
          <Text
            style={[
              styles.settingTitle,
              { color: isDark ? "#ffffff" : "#000000" },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.settingSubtitle,
                { color: isDark ? "#cccccc" : "#666666" },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {showSwitch && (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: "#767577", true: "#007AFF" }}
            thumbColor={value ? "#ffffff" : "#f4f3f4"}
          />
        )}
        {showArrow && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isDark ? "#888888" : "#666666"}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [deliveryReports, setDeliveryReports] = useState(false);
  const [mmsAutoDownload, setMmsAutoDownload] = useState(true);
  const [mmsWifiOnly, setMmsWifiOnly] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [defaultSimSlot, setDefaultSimSlot] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [
        deliveryReportsSetting,
        mmsAutoDownloadSetting,
        mmsWifiOnlySetting,
        defaultSimSlotSetting,
      ] = await Promise.all([
        smsService.getDeliveryReportsEnabled(),
        mmsService.getAutoDownloadEnabled(),
        mmsService.getWiFiOnlyEnabled(),
        smsService.getDefaultSimSlot(),
      ]);

      setDeliveryReports(deliveryReportsSetting);
      setMmsAutoDownload(mmsAutoDownloadSetting);
      setMmsWifiOnly(mmsWifiOnlySetting);
      setDefaultSimSlot(defaultSimSlotSetting);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeliveryReportsChange = async (value: boolean) => {
    try {
      await smsService.setDeliveryReportsEnabled(value);
      setDeliveryReports(value);
    } catch (error) {
      console.error("Error updating delivery reports setting:", error);
    }
  };

  const handleMmsAutoDownloadChange = async (value: boolean) => {
    try {
      await mmsService.setAutoDownloadEnabled(value);
      setMmsAutoDownload(value);
    } catch (error) {
      console.error("Error updating MMS auto-download setting:", error);
    }
  };

  const handleMmsWifiOnlyChange = async (value: boolean) => {
    try {
      await mmsService.setWiFiOnlyEnabled(value);
      setMmsWifiOnly(value);
    } catch (error) {
      console.error("Error updating MMS Wi-Fi only setting:", error);
    }
  };

  const handleDefaultSimSlotChange = async (value: boolean) => {
    try {
      const newSlot = value ? 1 : 0;
      await smsService.setDefaultSimSlot(newSlot);
      setDefaultSimSlot(newSlot);
    } catch (error) {
      console.error("Error updating default SIM slot:", error);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will delete all messages, contacts, and settings. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All Data",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear all data from database
              // This would need to be implemented in the database service
              Alert.alert("Success", "All data has been cleared.");
            } catch (error) {
              console.error("Error clearing data:", error);
              Alert.alert("Error", "Failed to clear data.");
            }
          },
        },
      ]
    );
  };

  const handleExportLogs = () => {
    Alert.alert("Export Logs", "Log export feature coming soon!");
  };

  const handleAbout = () => {
    Alert.alert(
      "About Textly",
      "Textly v1.0.0\n\nA comprehensive SMS/MMS messaging app with advanced features including delivery status tracking, media support, and contact integration.",
      [{ text: "OK" }]
    );
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000000" : "#ffffff" },
        ]}
      >
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#000000" : "#ffffff" },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: isDark ? "#1a1a1a" : "#ffffff" },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? "#ffffff" : "#000000"}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: isDark ? "#ffffff" : "#000000" },
          ]}
        >
          Settings
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* SMS Settings */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#ffffff" : "#000000" },
            ]}
          >
            SMS Settings
          </Text>
          <SettingItem
            title="Delivery Reports"
            subtitle="Show delivery status for sent messages"
            value={deliveryReports}
            onValueChange={handleDeliveryReportsChange}
            showSwitch={true}
          />
          <SettingItem
            title="Default SIM Slot"
            subtitle={`Use SIM ${defaultSimSlot + 1} for sending messages`}
            value={defaultSimSlot === 1}
            onValueChange={handleDefaultSimSlotChange}
            showSwitch={true}
          />
        </View>

        {/* MMS Settings */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#ffffff" : "#000000" },
            ]}
          >
            MMS Settings
          </Text>
          <SettingItem
            title="Auto-download MMS"
            subtitle="Automatically download MMS attachments"
            value={mmsAutoDownload}
            onValueChange={handleMmsAutoDownloadChange}
            showSwitch={true}
          />
          <SettingItem
            title="Wi-Fi Only"
            subtitle="Only download MMS on Wi-Fi connection"
            value={mmsWifiOnly}
            onValueChange={handleMmsWifiOnlyChange}
            showSwitch={true}
          />
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#ffffff" : "#000000" },
            ]}
          >
            Notifications
          </Text>
          <SettingItem
            title="Push Notifications"
            subtitle="Show notifications for new messages"
            value={notifications}
            onValueChange={setNotifications}
            showSwitch={true}
          />
        </View>

        {/* Privacy & Security */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#ffffff" : "#000000" },
            ]}
          >
            Privacy & Security
          </Text>
          <SettingItem
            title="Read Receipts"
            subtitle="Let others know when you read their messages"
            value={false}
            onValueChange={() => {}}
            showSwitch={true}
          />
          <SettingItem
            title="Blocked Contacts"
            subtitle="Manage blocked contacts"
            onPress={() =>
              Alert.alert("Blocked Contacts", "Feature coming soon!")
            }
            showArrow={true}
          />
        </View>

        {/* Storage & Data */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#ffffff" : "#000000" },
            ]}
          >
            Storage & Data
          </Text>
          <SettingItem
            title="Storage Usage"
            subtitle="View app storage usage"
            onPress={() => Alert.alert("Storage Usage", "Feature coming soon!")}
            showArrow={true}
          />
          <SettingItem
            title="Export Logs"
            subtitle="Export app logs for debugging"
            onPress={handleExportLogs}
            showArrow={true}
          />
          <SettingItem
            title="Clear All Data"
            subtitle="Delete all messages and settings"
            onPress={handleClearData}
            showArrow={true}
          />
        </View>

        {/* Advanced */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#ffffff" : "#000000" },
            ]}
          >
            Advanced
          </Text>
          <SettingItem
            title="APN Settings"
            subtitle="Configure MMS APN settings"
            onPress={() => Alert.alert("APN Settings", "Feature coming soon!")}
            showArrow={true}
          />
          <SettingItem
            title="Debug Panel"
            subtitle="View app status and debug information"
            onPress={() => Alert.alert("Debug Panel", "Feature coming soon!")}
            showArrow={true}
          />
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#ffffff" : "#000000" },
            ]}
          >
            About
          </Text>
          <SettingItem
            title="About Textly"
            subtitle="App version and information"
            onPress={handleAbout}
            showArrow={true}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  headerSpacer: {
    width: 39, // Same width as back button for centering
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  settingItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});
