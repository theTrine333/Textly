import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Linking,
  Platform,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import styles from "./styles";
import CHeaderPromps from "./types";
const Index = ({ Info, SelectedPhone }: CHeaderPromps) => {
  const Theme = useColorScheme() ?? "light";
  const Styles = styles(Theme);

  const handleCallBtn = async () => {
    if (Platform.OS === "android") {
      Linking.openURL(`tel:${SelectedPhone}`);
    } else if (Platform.OS === "ios") {
      Linking.openURL(`telephone:${SelectedPhone}`);
    } else {
      alert("This function is not supported by your os");
    }
  };

  return (
    <ThemedView style={Styles.container}>
      <TouchableOpacity
        onPress={() => {
          router.back();
        }}
      >
        <Ionicons name="arrow-back" color={Colors[Theme].text} size={25} />
      </TouchableOpacity>
      <TouchableOpacity style={Styles.infoBtn}>
        {/* Avatart */}
        {Info.imageAvailable ? (
          <Image source={{ uri: Info.image?.uri }} style={Styles.avatar} />
        ) : (
          <ThemedView style={Styles.avatar}>
            <Text style={Styles.avatarText}>{Info.name.charAt(0)}</Text>
            {/* <AntDesign name="user" color={"white"} size={20} /> */}
          </ThemedView>
        )}

        {/* Details Holder */}
        <ThemedView style={Styles.infoContainer}>
          <ThemedText numberOfLines={1}>{Info.name}</ThemedText>
          <ThemedText style={{ fontSize: 10 }} numberOfLines={1}>
            {SelectedPhone}
          </ThemedText>
        </ThemedView>
      </TouchableOpacity>
      {/* Right Icons */}
      <TouchableOpacity hitSlop={20} onPress={handleCallBtn}>
        <Ionicons name="call-outline" size={20} color={Colors[Theme].text} />
      </TouchableOpacity>
      <TouchableOpacity hitSlop={20} style={{ marginHorizontal: 10 }}>
        <Ionicons
          name="ellipsis-vertical"
          size={20}
          color={Colors[Theme].text}
        />
      </TouchableOpacity>
    </ThemedView>
  );
};

export default Index;
