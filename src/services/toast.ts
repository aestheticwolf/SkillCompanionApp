import Toast from "react-native-toast-message";

export const showSuccess = (message: string) => {
  Toast.show({
    type: "success",
    text1: "Success",
    text2: message,
    // position: "bottom",
    visibilityTime: 2500,
    autoHide: true,
  });
};

export const showError = (message: string) => {
  Toast.show({
    type: "error",
    text1: "Error",
    text2: message,
    // position: "bottom",
    visibilityTime: 3000,
    autoHide: true,
  });
};

export const showInfo = (message: string) => {
  Toast.show({
    type: "info",
    text1: "Coming Soon",
    text2: message,
    // position: "bottom",
    visibilityTime: 3500,
    autoHide: true,
  });
};

/** Red toast for deletions — task removed, goal removed */
export const showDelete = (message: string) => {
  Toast.show({
    type: "delete",
    text1: "Deleted",
    text2: message,
    // position: "bottom",
    visibilityTime: 2000,
    autoHide: true,
  });
};

/** Blue info toast for v2 / coming-soon features */
export const showComingSoon = (message?: string) => {
  Toast.show({
    type: "info",
    text1: "Coming Soon ✨",
    text2: message || "This feature arrives in v2",
    // position: "bottom",
    visibilityTime: 2800,
    autoHide: true,
  });
};
