import {
  View,
  Text,
  Button,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useContext } from "react";
import { TaskContext } from "../src/context/TaskContext";

export default function Dashboard() {
  const router = useRouter();
  const taskContext = useContext(TaskContext);

  if (!taskContext) return null;

  const { tasks, toggleTask } = taskContext;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      <Button
        title="Add Task"
        onPress={() => router.push("/add-task")}
      />

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => toggleTask(item.id)}
          >
            <Text
              style={[
                styles.task,
                item.completed && styles.done,
              ]}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Button
        title="View Progress"
        onPress={() => router.push("/progress")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    textAlign: "center",
    marginBottom: 15,
  },
  task: {
    padding: 10,
    borderBottomWidth: 1,
  },
  done: {
    textDecorationLine: "line-through",
    color: "gray",
  },
});
