import { width } from "@/constants/Styles";
import { StyleSheet } from "react-native";

const styles = (Theme: "light" | "dark" = "light") => {
  return StyleSheet.create({
    container: {
      width: width,
      paddingTop: 50,
      gap: 10,
      padding: 10,
      flexDirection: "row",
      alignItems: "center",
    },
    infoBtn: { flex: 1, flexDirection: "row", gap: 10, alignItems: "center" },
    avatarText: { color: "white", fontWeight: "bold", fontSize: 20 },
    avatar: {
      width: 35,
      justifyContent: "center",
      alignItems: "center",
      padding: 3,
      height: 35,
      borderRadius: 25,
      backgroundColor: "orange",
    },
    infoContainer: {
      flex: 1,
      maxWidth: "60%",
      justifyContent: "center",
      flexDirection: "column",
    },
  });
};

export default styles;
