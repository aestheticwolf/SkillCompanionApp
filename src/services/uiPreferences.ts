import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const THEME_KEY = "DARK_MODE";


if (Platform.OS === "web" && typeof document !== "undefined") {
  try {
    const existing =
      localStorage.getItem("DARK_MODE") ||
      localStorage.getItem("theme");

    if (existing === "true" || existing === "dark") {
      document.documentElement.dataset.skTheme = "dark";
    } else if (existing === "false" || existing === "light") {
      document.documentElement.dataset.skTheme = "light";
    }
  } catch {}
}


function stampDomTheme(isDark: boolean) {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    document.documentElement.dataset.skTheme = isDark ? "dark" : "light";
  }
}

/* KEEP SAME FUNCTION SIGNATURE */
export const saveTheme = async (value: boolean) => {
  await AsyncStorage.setItem(THEME_KEY, value.toString());


  await AsyncStorage.setItem("theme", value ? "dark" : "light");

  stampDomTheme(value);
};

export const loadTheme = async (): Promise<boolean> => {
  const saved = await AsyncStorage.getItem(THEME_KEY);
  const isDark = saved === "true";

  stampDomTheme(isDark);

  return isDark;
};