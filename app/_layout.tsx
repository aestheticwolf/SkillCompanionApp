import { Stack } from "expo-router";
import { useEffect } from "react";

import { TaskProvider } from "../src/context/TaskContext";
import { requestPermission } from "../src/services/notifications";

export default function Layout() {
  useEffect(() => {
    requestPermission();
  }, []);

  return (
    <TaskProvider>
      <Stack />
    </TaskProvider>
  );
}
