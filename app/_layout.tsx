import { Stack } from "expo-router";

import { TaskProvider } from "../src/context/TaskContext";
import { AuthProvider } from "../src/context/AuthContext";

export default function Layout() {
  return (
    <AuthProvider>
      <TaskProvider>
        <Stack />
      </TaskProvider>
    </AuthProvider>
  );
}
