import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";

import { useState, useContext } from "react";
import { useRouter } from "expo-router";

import { TaskContext } from "../src/context/TaskContext";
import { COLORS } from "../src/constants/theme";

export default function AddGoal() {
  const [goal, setGoal] = useState("");
  const ctx = useContext(TaskContext);
  const router = useRouter();

  if (!ctx) return null;

  const { addGoal } = ctx;

  const handleAdd = () => {
    if (!goal.trim()) return;

    addGoal(goal);
    setGoal("");
    alert("Goal Added");

    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Add Learning Goal
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ex: Learn Java"
        value={goal}
        onChangeText={setGoal}
      />

      <Pressable
        style={styles.btn}
        onPress={handleAdd}
      >
        <Text style={styles.btnText}>
          Save Goal
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
    justifyContent: "center",
  },

  title: {
    fontSize: 22,
    textAlign: "center",
    marginBottom: 20,
  },

  input: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 15,
  },

  btn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  btnText: {
    color: "white",
    fontWeight: "600",
  },
});
