import {View, Text, TextInput, Button, StyleSheet,} from "react-native";
import { useState, useContext } from "react";
import { TaskContext } from "../src/context/TaskContext";

export default function AddTask() {
  const [task, setTask] = useState("");
  const taskContext = useContext(TaskContext);

  if (!taskContext) return null;

  const { addTask } = taskContext;

  const handleAdd = () => {
    if (!task.trim()) return;

    addTask(task);
    setTask("");
    alert("Task Added");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Task</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter task"
        value={task}
        onChangeText={setTask}
      />

      <Button title="Save" onPress={handleAdd} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 15,
  },
});
