import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
} from "react-native";

import { useState, useContext } from "react";

import { TaskContext } from "../src/context/TaskContext";
import { COLORS } from "../src/constants/theme";

export default function AddTask() {
  const [task, setTask] = useState("");
  const taskContext = useContext(TaskContext);

  if (!taskContext) return null;

  const { addTask } = taskContext;

  const handleAdd = () => {
    if (!task.trim()) return;

    addTask(task);
    setTask("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        New Task
      </Text>

      <TextInput
        style={styles.input}
        placeholder="What will you learn today?"
        value={task}
        onChangeText={setTask}
      />

      <Pressable
        style={styles.btn}
        onPress={handleAdd}
      >
        <Text style={styles.btnText}>
          Save Task
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    padding: 24,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },

  input: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginBottom: 20,
  },

  btn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  btnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
