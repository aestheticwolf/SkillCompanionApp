import { View, Text, StyleSheet } from "react-native";
import { useContext } from "react";

import Animated, {
  FadeInUp,
} from "react-native-reanimated";

import { TaskContext } from "../src/context/TaskContext";
import { COLORS } from "../src/constants/theme";

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
      <Animated.View
        entering={FadeInUp.delay(200)}
        style={styles.card}
      >
        <Text style={styles.title}>
          Progress Summary
        </Text>

        <Text style={styles.text}>
          Total: {tasks.length}
        </Text>

        <Text style={styles.text}>
          Completed: {completed}
        </Text>

        <Text style={styles.text}>
          Pending: {pending}
        </Text>
      </Animated.View>
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

  text: {
    fontSize: 16,
    marginBottom: 6,
  },
});
