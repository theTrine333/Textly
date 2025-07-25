import { Colors } from "@/constants/Colors";
import React from "react";
import { TextInput, TouchableOpacity, useColorScheme } from "react-native";
import { ThemedView } from "../ThemedView";
import styles from "./styles";
import SearchInputPromps from "./types";

const Index = ({
  LeftIcon,
  LeftIconAction,
  RightIcon,
  RightIconAction,
  SearchAction,
  ContainerStyles,
  LeftIconContainerStyles,
  RightIconContainerStyles,
  InputPromps,
  InputStyle,
}: SearchInputPromps) => {
  const theme = useColorScheme() ?? "light";
  const Styles = styles(theme);
  return (
    <ThemedView style={[Styles.container, ContainerStyles]}>
      {/* Left icon */}
      {LeftIcon && (
        <TouchableOpacity
          onPress={LeftIconAction}
          style={[{}, LeftIconContainerStyles]}
        >
          {LeftIcon}
        </TouchableOpacity>
      )}
      {/* TextInput Component */}
      <TextInput
        style={[Styles.input, InputStyle]}
        onChangeText={SearchAction}
        placeholderTextColor="grey"
        cursorColor={Colors[theme].text}
        autoCorrect={false}
        autoCapitalize="none"
        keyboardType="default"
        {...InputPromps}
      />
      {/* Right icon */}
      {RightIcon && (
        <TouchableOpacity
          onPress={RightIconAction}
          hitSlop={20}
          style={[{}, RightIconContainerStyles]}
        >
          {RightIcon}
        </TouchableOpacity>
      )}
    </ThemedView>
  );
};

export default Index;
