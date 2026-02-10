import Toast from "react-native-toast-message";

export const showSuccess = (msg: string) => {
  Toast.show({
    type: "success",
    text1: "Success",
    text2: msg,
    position: "bottom",
    visibilityTime: 2500,
  });
};

export const showError = (msg: string) => {
  Toast.show({
    type: "error",
    text1: "Error",
    text2: msg,
    position: "bottom",
    visibilityTime: 3000,
  });
};