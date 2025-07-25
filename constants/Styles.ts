import { Dimensions, StyleSheet } from "react-native";
export const { width, height } = Dimensions.get("window");
const Styles = (theme: "light" | "dark" = "light") => {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 40,
    },
    floatingBtn: {
      position: "absolute",
      flexDirection: "row",
      gap: 10,
      elevation: 4,
      backgroundColor: "rgba(37, 37, 237, 1)",
      bottom: 40,
      padding: 10,
      paddingHorizontal: 15,
      maxWidth: 120,
      height: 50,
      right: 20,
      borderRadius: 15,
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "flex-end",
    },
    miniAvatar: {
      backgroundColor: "grey",
      width: 35,
      height: 35,
      borderRadius: 20,
    },
  });
};

export default Styles;
