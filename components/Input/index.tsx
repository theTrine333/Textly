import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import React, { useState } from "react";
import { TextInput, TouchableOpacity, useColorScheme } from "react-native";
import ChatPicker from "../Picker";
import { ContactInfoType } from "../Selector/types";
import { ThemedView } from "../ThemedView";
import styles from "./Styles";
import InputPromps from "./types";
const Index = ({ sendFunction }: InputPromps) => {
  const Theme = useColorScheme() ?? "light";
  const Styles = styles(Theme);
  const [text, setText] = useState<string>("");
  const [modalShown, setModalShown] = useState<boolean>(false);
  const [selectedContact, setSelectedContact] =
    useState<ContactInfoType | null>(null);

  const extractPhoneNumbers = (numbers: any) => {
    let string = "";

    numbers.forEach((item: any) => {
      string += `[Mobile] ${item.number}\n`;
    });

    return string;
  };
  const pickContact = async () => {
    const contact: any = await Contacts.presentContactPickerAsync();
    setSelectedContact(contact);
    setText(
      `${contact?.name}\n${extractPhoneNumbers(contact?.phoneNumbers)}`.trim()
    );
  };
  return (
    <>
      {modalShown && (
        <ChatPicker
          setVisibility={setModalShown}
          docAction={async () => {}}
          imagesAction={async () => {}}
        />
      )}
      <ThemedView style={Styles.container}>
        {/* Input containter */}
        <ThemedView style={Styles.inputContainer}>
          <TouchableOpacity
            hitSlop={20}
            style={Styles.inputContainerBtns}
            onPress={() => {
              setModalShown(true);
            }}
          >
            <Ionicons
              name="add-circle-outline"
              size={25}
              color={Theme === "dark" ? Colors.light.text : Colors.dark.text}
            />
          </TouchableOpacity>
          <TextInput
            placeholder="Send a message"
            multiline
            autoFocus
            value={text}
            onChangeText={setText}
            cursorColor={
              Theme === "dark" ? Colors.light.text : Colors.dark.text
            }
            style={Styles.input}
          />
          {/* Pick contact */}
          <TouchableOpacity
            hitSlop={20}
            style={[Styles.inputContainerBtns, { marginBottom: 12 }]}
            onPress={pickContact}
          >
            <Ionicons
              name="person-add-outline"
              size={20}
              color={Theme === "dark" ? Colors.light.text : Colors.dark.text}
            />
          </TouchableOpacity>
        </ThemedView>
        <TouchableOpacity
          style={Styles.sendBtn}
          onPress={() => {
            text.trim() !== "" && sendFunction(text);
            setText("");
          }}
        >
          <Ionicons name="send" size={20} color={Colors[Theme].background} />
        </TouchableOpacity>
      </ThemedView>
    </>
  );
};

export default Index;
