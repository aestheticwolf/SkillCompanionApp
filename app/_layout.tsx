import { Stack } from "expo-router";

import { TaskProvider } from "../src/context/TaskContext";
import { AuthProvider } from "../src/context/AuthContext";
import Toast from "react-native-toast-message";

export default function Layout() {
  return (
    <AuthProvider>
      <TaskProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
        <Toast />
      </TaskProvider>
    </AuthProvider>
  );
}
