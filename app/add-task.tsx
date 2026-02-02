import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { useState } from "react";

export default function AddTask() {
  const [task, setTask] = useState("");

  const handleAdd = () => {
    console.log("Task:", task);
    alert("Task Added");
    setTask("");
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
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 15,
  },
});
