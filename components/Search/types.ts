import { ReactNode } from "react";
import { TextInputProps, TextStyle, ViewStyle } from "react-native";

interface SearchInputPromps {
  LeftIcon?: ReactNode;
  LeftIconContainerStyles?: ViewStyle;
  ContainerStyles?: ViewStyle;
  LeftIconAction?: any;
  InputPromps?: TextInputProps;
  InputStyle?: ViewStyle | TextStyle | any;
  RightIcon?: ReactNode;
  RightIconContainerStyles?: ViewStyle;
  RightIconAction?: any;
  SearchAction?: any;
}

export default SearchInputPromps;
