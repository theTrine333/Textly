import { AntDesign } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity, useColorScheme, View } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import styles from "./styles";
import chatPickerProps from "./types";

const ChatPicker = ({
  setVisibility,
  imagesAction,
  docAction,
}: chatPickerProps) => {
  const theme = useColorScheme() ?? "light";
  const Styles = styles(theme);
  const shutter = () => {
    setVisibility(false);
  };
  return (
    <Animated.View
      entering={SlideInDown.damping(80).stiffness(200)}
      exiting={SlideOutDown.damping(80).stiffness(200)}
    >
      <ThemedView style={Styles.container}>
        {/* Images button */}
        <View>
          <TouchableOpacity
            style={[
              Styles.selectors,
              { backgroundColor: "rgba(58, 58, 114, 1)" },
            ]}
            hitSlop={20}
          >
            <AntDesign name="camera" size={25} color={"white"} />
          </TouchableOpacity>
          <ThemedText style={Styles.lable}>Images</ThemedText>
        </View>

        {/* Docs */}
        <View>
          <TouchableOpacity
            style={[
              Styles.selectors,
              { backgroundColor: "rgba(58, 95, 114, 1)" },
            ]}
            hitSlop={20}
          >
            <AntDesign name="paperclip" size={25} color={"white"} />
          </TouchableOpacity>
          <ThemedText style={Styles.lable}>File</ThemedText>
        </View>
        {/* Close button */}
        <TouchableOpacity
          style={Styles.closeBtn}
          hitSlop={20}
          onPress={shutter}
        >
          <AntDesign name="close" size={15} color={"white"} />
        </TouchableOpacity>
      </ThemedView>
    </Animated.View>
  );
};

export default ChatPicker;
