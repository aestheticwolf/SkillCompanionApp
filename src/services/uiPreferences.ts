import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "DARK_MODE";

export const saveTheme = async (value: boolean) => {
  await AsyncStorage.setItem(THEME_KEY, value.toString());
};

export const loadTheme = async (): Promise<boolean> => {
  const saved = await AsyncStorage.getItem(THEME_KEY);
  return saved === "true";
};