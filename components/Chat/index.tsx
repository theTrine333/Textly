import React from "react";
import { useColorScheme } from "react-native";
import { ThemedView } from "../ThemedView";
import InlineEmojiText from "./InlineEmojiText";
import styles from "./styles";
import chatType from "./types";

const Index = ({ Chat, index }: { Chat: chatType; index: number }) => {
  const theme = useColorScheme() ?? "light";
  const Styles = styles(theme);
  // console.log(Chat.text);

  return (
    <ThemedView
      key={index}
      style={[Styles.container, Chat.id === "me" && Styles.meContainer]}
    >
      <InlineEmojiText text={Chat.text} fontSize={18} />
    </ThemedView>
  );
};

export default Index;
