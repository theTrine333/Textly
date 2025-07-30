import { Colors } from "@/constants/Colors";
import { height } from "@/constants/Styles";
import { StyleSheet } from "react-native";

const styles = (Theme: "light" | "dark" = "light") => {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: Colors[Theme].blur,
      height: height * 0.18,
      width: "95%",
      alignSelf: "center",
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    closeBtn: {
      position: "absolute",
      right: 10,
      top: 10,
      padding: 5,
      backgroundColor: "#E2003A",
      borderRadius: 1000,
    },
    selectors: {
      height: height * 0.1,
      backgroundColor: "rgba(48, 76, 32, 1)",
      width: (height * 0.2) / 2,
      borderRadius: 10,
      margin: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    lable: { textAlign: "center", fontSize: 13 },
  });
};

export default styles;
