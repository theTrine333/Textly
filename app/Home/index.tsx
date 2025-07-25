import Search from "@/components/Search";
import Selector from "@/components/Selector";
import { ContactInfoType } from "@/components/Selector/types";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import Styles from "@/constants/Styles";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import { router } from "expo-router";
import * as SMS from "expo-sms";
import React, { useEffect, useState } from "react";
import { TouchableOpacity, useColorScheme, View } from "react-native";
const Home = () => {
  const theme = useColorScheme() ?? "light";
  const styles = Styles(theme);
  const [selectShown, showSelector] = useState<boolean>(false);
  const [ContactInfo, setContactInfo] = useState<ContactInfoType | null>(null);

  const askContactPermissions = async () => {
    const permissions = await Contacts.getPermissionsAsync();
    if (permissions.status === Contacts.PermissionStatus.DENIED) {
      console.log("User DENIED permissions");
    } else if (permissions.status === Contacts.PermissionStatus.GRANTED) {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });
      //   console.log(data);
    } else if (permissions.status === Contacts.PermissionStatus.UNDETERMINED) {
      await Contacts.requestPermissionsAsync();
    }
  };

  const askSmsPermissions = async () => {
    const permissions = await SMS.isAvailableAsync();
    // console.log(permissions);
  };

  const pickContact = async () => {
    const contact: any = await Contacts.presentContactPickerAsync();
    setContactInfo(contact);
    showSelector(true);
  };
  useEffect(() => {
    askContactPermissions();
    askSmsPermissions();
  }, []);
  return (
    <ThemedView style={styles.container}>
      {/* Search component */}
      <Search
        InputPromps={{
          placeholder: "Search for numbers, names & more",
        }}
        LeftIcon={<View style={styles.miniAvatar}></View>}
        RightIcon={
          <View>
            <Ionicons
              name="ellipsis-vertical"
              color={Colors[theme].text}
              size={20}
            />
          </View>
        }
      />
      {/* Chat lists */}

      {/* Floating button and Selector modal*/}
      {selectShown ? (
        <Selector
          Visibility={selectShown}
          setVisibility={showSelector}
          Router={router}
          ContactInfo={ContactInfo}
        />
      ) : (
        <TouchableOpacity style={styles.floatingBtn} onPress={pickContact}>
          <MaterialCommunityIcons
            name="comment-plus"
            size={25}
            color={"white"}
          />
        </TouchableOpacity>
      )}
    </ThemedView>
  );
};

export default Home;
