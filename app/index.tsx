import { Redirect } from "expo-router";
import React, { useEffect } from "react";
import { PermissionsAndroid } from "react-native";

const Index = () => {
  useEffect(() => {
    const askPermissions = async () => {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        PermissionsAndroid.PERMISSIONS.WRITE_CONTACTS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_MMS,
      ]);
    };
  });

  return <Redirect href={"/Home"} />;
};

export default Index;
