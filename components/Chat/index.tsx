import LottieView from "lottie-react-native";
import React from "react";
import { useColorScheme } from "react-native";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import styles from "./styles";
import chatType from "./types";
const Index = ({ Chat, index }: { Chat: chatType; index: number }) => {
  const theme = useColorScheme() ?? "light";
  const Styles = styles(theme);
  return (
    <ThemedView
      key={index}
      style={[Styles.container, Chat.id === "me" && Styles.meContainer]}
    >
      <ThemedText style={Styles.chatText} key={index}>
        {Chat.message}
      </ThemedText>
      <LottieView
        key={index}
        source={require("@/assets/emojis/blue-heart.json")}
        autoPlay
        loop
        style={{ width: 24, height: 24 }}
      />
    </ThemedView>
  );
};

export default Index;
