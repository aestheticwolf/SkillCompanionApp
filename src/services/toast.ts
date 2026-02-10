import Toast from "react-native-toast-message";

export const showSuccess = (message: string) => {
  Toast.show({
    type: "success",
    text1: "Success",
    text2: message,
    position: "bottom",
    visibilityTime: 2500,
    autoHide: true,
  });
};

export const showError = (message: string) => {
  Toast.show({
    type: "error",
    text1: "Error",
    text2: message,
    position: "bottom",
    visibilityTime: 3000,
    autoHide: true,
  });
};