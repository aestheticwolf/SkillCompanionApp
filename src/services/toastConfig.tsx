import React from "react";
import { BaseToast, ErrorToast } from "react-native-toast-message";
import { COLORS } from "../constants/theme";

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: COLORS.primary,
        backgroundColor: "#FFFFFF",
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        fontSize: 15,
        fontWeight: "700",
      }}
      text2Style={{
        fontSize: 13,
        color: "#475569",
      }}
    />
  ),

  error: (props: any) => (
    <ErrorToast
      {...props}
      text1Style={{
        fontSize: 15,
        fontWeight: "700",
      }}
      text2Style={{
        fontSize: 13,
      }}
    />
  ),
};
