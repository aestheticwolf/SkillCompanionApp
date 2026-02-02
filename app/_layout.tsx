import { Stack } from "expo-router";
import { TaskProvider } from "../src/context/TaskContext";

export default function Layout() {
  return (
    <TaskProvider>
      <Stack />
    </TaskProvider>
  );
}
