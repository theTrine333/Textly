import { width } from "@/constants/Styles";
import { StyleSheet } from "react-native";

const styles = (Theme: "light" | "dark" = "light") => {
  return StyleSheet.create({
    container: {
      margin: 5,
      marginHorizontal: 10,
      backgroundColor: "rgba(0,0,180,1)",
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
      padding: 10,
      paddingVertical: 7,
      borderRadius: 26,
      width: width * 0.4,
      justifyContent: "center",
      alignItems: "center",
    },
    meContainer: {
      alignSelf: "flex-end",
      flex: 1,
      maxWidth: width * 0.7,
      backgroundColor: "rgba(0,150,0,1)",
    },
    otherContainer: {},
    chatText: {
      fontSize: 14,
    },
  });
};

export default styles;
