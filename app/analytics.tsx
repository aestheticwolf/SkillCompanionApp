import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";

import { useContext } from "react";

import { TaskContext } from "../src/context/TaskContext";
import { COLORS } from "../src/constants/theme";

export default function Analytics() {
  const ctx = useContext(TaskContext);

  if (!ctx) return null;

  const { goals } = ctx;

  let totalTasks = 0;
  let completed = 0;

  goals.forEach((g) => {
    totalTasks += g.tasks.length;
    completed += g.tasks.filter(t => t.completed).length;
  });

  const percent =
    totalTasks === 0
      ? 0
      : Math.round((completed / totalTasks) * 100);

  return (
    <ScrollView style={styles.container}>

      <Text style={styles.title}>
        Analytics 📊
      </Text>

      {/* Summary */}
      <View style={styles.card}>
        <Text>Total Tasks: {totalTasks}</Text>
        <Text>Completed: {completed}</Text>
        <Text>Success Rate: {percent}%</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBg}>
        <View
          style={[
            styles.progressFill,
            { width: `${percent}%` },
          ]}
        />
      </View>

      {/* Weekly */}
      <View style={styles.card}>
        <Text style={styles.subtitle}>
          Weekly Report
        </Text>

        <Text>
          Stay consistent to improve 📈
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
    color: COLORS.secondary,
  },

  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },

  card: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,

    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },

  progressBg: {
    height: 12,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
    marginBottom: 25,
  },

  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
});
