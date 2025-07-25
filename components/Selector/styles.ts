import { height } from "@/constants/Styles";
import { StyleSheet } from "react-native";

const styles = (Theme: "light" | "dark" = "light") => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "transparent",
      justifyContent: "flex-end",
    },
    selectorItems: {
      width: "100%",
      opacity: 0.8,
      backgroundColor: "#6b707592",
      padding: 10,
      borderRadius: 8,
      alignSelf: "center",
      alignItems: "center",
      marginVertical: 1,
    },
    selectorItemsText: {
      color: "grey",
      fontWeight: "bold",
      fontSize: 15,
    },
    bottomView: {
      backgroundColor: "white",
      alignItems: "center",
      padding: 20,
      minHeight: height * 0.3,
      borderTopRightRadius: 18,
      borderTopLeftRadius: 18,
    },
    instructionText: {
      fontSize: 11,
      marginBottom: 5,
      color: "rgba(65, 121, 241, 1)",
    },
    selectorView: {
      minHeight: height * 0.08,
      borderRadius: 10,
      borderWidth: 1,
      width: "100%",
      alignItems: "center",
      padding: 10,
      backgroundColor: "transparent",
      borderStyle: "dashed",
    },
    selectBtn: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: "#333",
      padding: 10,
      margin: 10,
      borderRadius: 10,
    },
    selectBtnText: {
      color: "#333",
      fontWeight: "bold",
      fontSize: 16,
    },
    avatar: {
      height: 70,
      justifyContent: "center",
      alignItems: "center",
      width: 70,
      borderRadius: 40,
      backgroundColor: "orange",
    },
  });
};

export default styles;
