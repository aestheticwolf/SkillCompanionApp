import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from "react-native";

import { useRouter } from "expo-router";
import { useContext } from "react";

import { TaskContext } from "../src/context/TaskContext";
import TaskCard from "../src/components/TaskCard";
import { COLORS } from "../src/constants/theme";

export default function Dashboard() {
  const router = useRouter();
  const taskContext = useContext(TaskContext);

  if (!taskContext) return null;

  const { tasks, toggleTask } = taskContext;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Tasks</Text>

        <Pressable
          style={styles.addBtn}
          onPress={() => router.push("/add-task")}
        >
          <Text style={styles.addText}>＋</Text>
        </Pressable>
      </View>

      {/* Task List */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <TaskCard
            title={item.title}
            completed={item.completed}
            onPress={() => toggleTask(item.id)}
          />
        )}
      />

      {/* Progress Button */}
      <Pressable
        style={styles.progressBtn}
        onPress={() => router.push("/progress")}
      >
        <Text style={styles.progressText}>
          View Progress
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.secondary,
  },

  addBtn: {
    backgroundColor: COLORS.primary,
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },

  addText: {
    color: "white",
    fontSize: 26,
  },

  progressBtn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  progressText: {
    color: "white",
    fontWeight: "600",
  },
});
