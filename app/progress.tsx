import { View, Text, StyleSheet } from "react-native";
import { useContext } from "react";
import { TaskContext } from "../src/context/TaskContext";

export default function Progress() {
  const taskContext = useContext(TaskContext);

  if (!taskContext) return null;

  const { tasks } = taskContext;

  const completed = tasks.filter(
    (t) => t.completed
  ).length;

  const pending = tasks.length - completed;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress</Text>

      <Text>Total: {tasks.length}</Text>
      <Text>Completed: {completed}</Text>
      <Text>Pending: {pending}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    marginBottom: 15,
  },
});
