import ChatBody from "@/components/Chat";
import chatType from "@/components/Chat/types";
import CHeader from "@/components/CHeader";
import Input from "@/components/Input";
import { ContactInfoType } from "@/components/Selector/types";
import { ThemedView } from "@/components/ThemedView";
import { height } from "@/constants/Styles";
import useKeyboardStatus from "@/hooks/useKeyboard";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { FlatList, PermissionsAndroid } from "react-native";
import Animated, { useSharedValue, withSpring } from "react-native-reanimated";
const Chat = () => {
  const params: any = useLocalSearchParams();
  const ContactInfo: ContactInfoType = JSON.parse(params.contactInfo);
  const selectedPhone = params.selectedPhone;
  const animatedheight = useSharedValue(0);
  const flatListRef = useRef<FlatList>(null);
  const isFocused = useKeyboardStatus();
  const [chats, setChats] = useState<chatType[]>([
    {
      id: "0745891380",
      text: "Hello, mambo",
      sender: "user",
      timestamp: Date.now(),
    },
  ]);
  const handleSendSMS = async (Message: string) => {
    setChats([
      ...chats,
      {
        id: "me",
        text: Message,
        sender: "system",
        timestamp: Date.now(),
      },
    ]);
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
      <ThemedView style={{ flex: 1 }}>
        <FlatList
          data={chats}
          keyExtractor={(item: chatType) => item.timestamp.toString()}
          renderItem={({ item, index }) => (
            <ChatBody Chat={item} index={index} key={index} />
          )}
        />
      </ThemedView>
      {/* TextInput */}
      <Input sendFunction={handleSendSMS} />
      <Animated.View style={{ height: animatedheight }} />
    </ThemedView>
  );
};

export default Chat;
