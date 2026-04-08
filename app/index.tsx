import React, { useContext } from "react";
import { Platform, View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { AuthContext } from "../src/context/AuthContext";

export default function Home() {
  const { user, loading } = useContext(AuthContext);

  //  wait for auth
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  //  DIRECT redirect 
  if (user) {
    return <Redirect href="/dashboard" />;
  }

  //  landing page
  if (Platform.OS === "web") {
    return (
      <iframe
        src="/landing"
        style={{
          width: "100%",
          height: "100vh",
          border: "none",
        }}
      />
    );
  }

  return null;
}