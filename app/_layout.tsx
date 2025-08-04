import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { smsService } from "../utils/smsService";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Initialize SMS/MMS services
    const initializeServices = async () => {
      try {
        await smsService.requestPermissions();
        console.log("SMS/MMS services initialized");
      } catch (error) {
        console.error("Error initializing services:", error);
      }
    };

    initializeServices();
  }, []);

  return (
    <>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="conversation" />
        <Stack.Screen name="compose" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="search" />
        <Stack.Screen name="media-viewer" />
      </Stack>
    </>
  );
}
