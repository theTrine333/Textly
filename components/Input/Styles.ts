import { Colors } from "@/constants/Colors";
import { height, width } from "@/constants/Styles";
import { StyleSheet } from "react-native";

const styles = (Theme: "light" | "dark" = "light") => {
  return StyleSheet.create({
    container: {
      width: width,
      padding: 10,
      gap: 10,
      backgroundColor: "transparent",
      alignItems: "flex-end",
      minHeight: height * 0.08,
      flexDirection: "row",
    },
    input: {
      backgroundColor: "transparent",
      color: Theme === "dark" ? Colors.light.text : Colors.dark.text,
      flex: 1,
      fontSize: 17,
      padding: 10,
    },
    sendBtn: {
      padding: 13,
      backgroundColor:
        Theme === "dark" ? Colors.light.background : Colors.dark.background,
      borderRadius: 1000,
      justifyContent: "center",
      alignItems: "center",
    },
    inputContainer: {
      backgroundColor:
        Theme === "dark" ? Colors.light.background : Colors.dark.background,
      flex: 1,
      paddingRight: 15,
      minHeight: height * 0.06,
      maxHeight: height * 0.2,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 26,
      paddingHorizontal: 10,
    },
    inputContainerBtns: {
      alignSelf: "flex-end",
      marginBottom: 10,
    },
  });
};

export default styles;
