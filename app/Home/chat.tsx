import CHeader from "@/components/CHeader";
import Input from "@/components/Input";
import { ContactInfoType } from "@/components/Selector/types";
import { ThemedView } from "@/components/ThemedView";
import { height } from "@/constants/Styles";
import useKeyboardStatus from "@/hooks/useKeyboard";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef } from "react";
import { FlatList, PermissionsAndroid } from "react-native";
import Animated, { useSharedValue, withSpring } from "react-native-reanimated";
import * as SmsManager from "sms-manager";
const Chat = () => {
  const params: any = useLocalSearchParams();
  const ContactInfo: ContactInfoType = JSON.parse(params.contactInfo);
  const selectedPhone = params.selectedPhone;
  const animatedheight = useSharedValue(0);
  const flatListRef = useRef<FlatList>(null);
  const isFocused = useKeyboardStatus();

  const handleSendSMS = async (Message: string) => {
    const result = await SmsManager.default.sendSms(selectedPhone, Message);
    console.log(result);
  };

  const getSendSMSPermissions = async () => {
    const permissions = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.SEND_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_MMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_WAP_PUSH,
    ]);
  };
  useEffect(() => {
    // getSendSMSPermissions();
    if (isFocused) {
      animatedheight.value = withSpring(height * 0.4, animatedProps);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150); // slight delay for keyboard animation
    } else {
      animatedheight.value = withSpring(0, animatedProps);
    }
  }, [isFocused]);

  const animatedProps = {
    damping: 80,
    stiffness: 200,
  };

  useEffect(() => {
    if (isFocused) {
      animatedheight.value = withSpring(height * 0.4, animatedProps);
    } else {
      animatedheight.value = withSpring(0, animatedProps);
    }
  }, [isFocused]);

  return (
    <ThemedView style={{ flex: 1 }}>
      <CHeader Info={ContactInfo} SelectedPhone={selectedPhone} />
      {/* List */}
      <ThemedView style={{ flex: 1 }}></ThemedView>
      {/* TextInput */}
      <Input sendFunction={handleSendSMS} />
      <Animated.View style={{ height: animatedheight }} />
    </ThemedView>
  );
};

export default Chat;
