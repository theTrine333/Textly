import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { TextInput, TouchableOpacity, useColorScheme } from "react-native";
import { ThemedView } from "../ThemedView";
import styles from "./Styles";
import InputPromps from "./types";

const Index = ({ sendFunction }: InputPromps) => {
  const Theme = useColorScheme() ?? "light";
  const Styles = styles(Theme);
  const [text, setText] = useState<string>("");
  return (
    <ThemedView style={Styles.container}>
      {/* Input containter */}
      <ThemedView style={Styles.inputContainer}>
        <TouchableOpacity hitSlop={20} style={Styles.inputContainerBtns}>
          <Ionicons
            name="add-circle-outline"
            size={25}
            color={Theme === "dark" ? Colors.light.text : Colors.dark.text}
          />
        </TouchableOpacity>
        <TextInput
          placeholder="Send a message"
          multiline
          autoFocus
          onChangeText={setText}
          cursorColor={Theme === "dark" ? Colors.light.text : Colors.dark.text}
          style={Styles.input}
        />
        <TouchableOpacity
          hitSlop={20}
          style={[Styles.inputContainerBtns, { marginBottom: 12 }]}
        >
          <Ionicons
            name="person-add-outline"
            size={20}
            color={Theme === "dark" ? Colors.light.text : Colors.dark.text}
          />
        </TouchableOpacity>
      </ThemedView>
      <TouchableOpacity
        style={Styles.sendBtn}
        onPress={() => {
          text.trim() !== "" && sendFunction(text);
          setText("");
        }}
      >
        <Ionicons name="send" size={20} color={Colors[Theme].background} />
      </TouchableOpacity>
    </ThemedView>
  );
};

export default Index;
