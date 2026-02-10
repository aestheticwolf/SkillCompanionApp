import { Stack } from "expo-router";
import Toast from "react-native-toast-message";

import { TaskProvider } from "../src/context/TaskContext";
import { AuthProvider } from "../src/context/AuthContext";
import { toastConfig } from "../src/services/toastConfig";

export default function Layout() {
  return (
    <AuthProvider>
      <TaskProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <Toast config={toastConfig} />
      </TaskProvider>
    </AuthProvider>
  );
}
