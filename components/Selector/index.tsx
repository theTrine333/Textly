import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import styles from "./styles";
import SelectorPromps from "./types";

const Index = ({
  Visibility,
  setVisibility,
  Router,
  ContactInfo,
}: SelectorPromps) => {
  const Theme = useColorScheme() ?? "light";
  const Styles = styles(Theme);
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [phoneIndex, setPhoneIndex] = useState<number[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>();

  const parsePhoneNumbers = async () => {
    setPhoneNumbers([]);
    for (
      let i = 0;
      i <
      ((ContactInfo?.phoneNumbers && ContactInfo?.phoneNumbers.length) || 1);
      i++
    ) {
      const phone =
        ContactInfo?.phoneNumbers[i].number.replaceAll(" ", "").trim() || "";
      if (!phoneNumbers.includes(phone)) {
        phoneNumbers.push(phone);
        phoneIndex.push(i);
      }
    }

    if (phoneIndex.length === 1) {
      setSelectedPhone(ContactInfo?.phoneNumbers[0].number);
      // handlePhoneSelection();
    }
  };

  const handlePhoneSelection = async () => {
    setVisibility(false);
    router.push({
      pathname: "/Home/chat",
      params: {
        contactInfo: JSON.stringify(ContactInfo),
        selectedPhone: selectedPhone,
      },
    });
  };

  useEffect(() => {
    parsePhoneNumbers();
  }, [ContactInfo?.phoneNumbers]);

  return (
    <Modal
      visible={Visibility}
      onRequestClose={() => {
        setVisibility(false);
      }}
      transparent
      animationType="slide"
    >
      <ThemedView style={Styles.container}>
        <ThemedView style={Styles.bottomView}>
          {ContactInfo?.imageAvailable ? (
            <Image
              source={{ uri: ContactInfo?.image?.uri }}
              style={Styles.avatar}
            />
          ) : (
            <ThemedView style={Styles.avatar}>
              <Text
                style={{ fontWeight: "bold", fontSize: 30, color: "white" }}
              >
                {ContactInfo?.name.charAt(0)}
              </Text>
            </ThemedView>
          )}
          {/* Name tag */}
          <Text style={[Styles.selectBtnText, { color: "black", margin: 10 }]}>
            {ContactInfo?.name}
          </Text>
          <ThemedText style={Styles.instructionText}>
            Select a phone number to text
          </ThemedText>
          {/* Selection tag */}
          <ThemedView style={Styles.selectorView}>
            {phoneIndex.map((i, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  Styles.selectorItems,
                  selectedPhone === ContactInfo?.phoneNumbers[i].number && {
                    backgroundColor: "#333",
                    opacity: 1,
                  },
                ]}
                onPress={() =>
                  setSelectedPhone(ContactInfo?.phoneNumbers[i].number)
                }
              >
                <Text
                  style={[
                    Styles.selectorItemsText,
                    selectedPhone === ContactInfo?.phoneNumbers[i].number && {
                      color: "white",
                      opacity: 1,
                    },
                  ]}
                >
                  {ContactInfo?.phoneNumbers[i].number}
                </Text>
              </TouchableOpacity>
            ))}
          </ThemedView>
          {/* Select button */}
          <TouchableOpacity
            style={[Styles.selectBtn, { opacity: selectedPhone ? 1 : 0.5 }]}
            disabled={selectedPhone == null}
            onPress={handlePhoneSelection}
          >
            <Text style={Styles.selectBtnText}>Select</Text>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
};

export default Index;
