import { emojiMap } from "@/utils/emojiMap";
import { parseTextWithEmojis } from "@/utils/parseTextWithEmojis";
import LottieView from "lottie-react-native";
import React from "react";
import { View } from "react-native";
import { ThemedText } from "../ThemedText";

interface InlineEmojiTextProps {
  text: string;
  fontSize?: number;
}

const InlineEmojiText: React.FC<InlineEmojiTextProps> = ({
  text,
  fontSize = 18,
}) => {
  const parts = parseTextWithEmojis(text);
  const emojiSize = fontSize + 4;

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      {parts.map((part, index) => {
        if (part.type === "emoji" && emojiMap[part.value]) {
          return (
            <View
              key={index}
              style={{
                width: emojiSize,
                height: emojiSize,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <LottieView
                source={emojiMap[part.value]}
                autoPlay
                loop
                style={{
                  width: emojiSize,
                  height: emojiSize,
                  marginTop: 2,
                }}
              />
            </View>
          );
        } else if (part.type === "emoji") {
          return (
            <ThemedText key={index} style={{ fontSize }}>
              {part.value}
            </ThemedText>
          );
        }

        return (
          <ThemedText key={index} style={{ fontSize }}>
            {part.value}
          </ThemedText>
        );
      })}
    </View>
  );
};

export default InlineEmojiText;
