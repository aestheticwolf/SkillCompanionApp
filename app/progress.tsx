import { View, Text, StyleSheet } from "react-native";
import { useContext } from "react";

import { TaskContext } from "../src/context/TaskContext";
import { COLORS } from "../src/constants/theme";

export default function Progress() {
  const ctx = useContext(TaskContext);

  if (!ctx) return null;

  const { goals } = ctx;

  let totalTasks = 0;
  let completedTasks = 0;

  goals.forEach((g) => {
    totalTasks += g.tasks.length;

    completedTasks += g.tasks.filter(
      (t) => t.completed
    ).length;
  });

  const pending = totalTasks - completedTasks;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          Progress Summary
        </Text>

        <Text>Total Tasks: {totalTasks}</Text>
        <Text>Completed: {completedTasks}</Text>
        <Text>Pending: {pending}</Text>

        <Text style={{ marginTop: 15 }}>
          Recommended Focus:
        </Text>

        {goals.map((g) => {
          const done = g.tasks.filter(
            (t) => t.completed
          ).length;

          if (done < g.tasks.length / 2) {
            return (
              <Text key={g.id}>
                👉 {g.name}
              </Text>
            );
          }

          return null;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    padding: 20,
  },

  card: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    elevation: 4,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
});
