import { Colors } from "@/constants/Colors";
import { height } from "@/constants/Styles";
import { StyleSheet } from "react-native";

const styles = (Theme: "light" | "dark" = "light") => {
  return StyleSheet.create({
    container: {
      backgroundColor: Colors[Theme].blur,
      alignItems: "center",
      marginHorizontal: 10,
      borderRadius: 8,
      minHeight: height * 0.06,
      paddingHorizontal: 10,
      margin: 10,
      flexDirection: "row",
      gap: 5,
    },
    input: { padding: 5, flex: 1, color: Colors[Theme].text },
  });
};

export default styles;
