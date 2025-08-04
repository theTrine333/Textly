import { width } from "@/constants/Styles";
import { StyleSheet } from "react-native";

const styles = (Theme: "light" | "dark" = "light") => {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      flexWrap: "wrap",
      padding: 10,
      paddingVertical: 7,
      borderRadius: 20,
      marginHorizontal: 20,
      marginVertical: 4,
      maxWidth: width * 0.8,
      alignSelf: "flex-start",
      backgroundColor: Theme === "dark" ? "#1a237e" : "#dce3ff",
    },

    meContainer: {
      alignSelf: "flex-end",
      backgroundColor: Theme === "dark" ? "#2e7d32" : "#d0f0c0",
    },

    chatText: {
      fontSize: 15,
      lineHeight: 20,
      color: Theme === "dark" ? "#fff" : "#000",
      flexShrink: 1,
    },
  });
};

export default styles;
