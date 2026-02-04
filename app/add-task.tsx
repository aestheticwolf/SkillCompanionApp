import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";

import { useState, useContext, useRef, useEffect } from "react";

import { TaskContext } from "../src/context/TaskContext";
import { COLORS } from "../src/constants/theme";
import { useLocalSearchParams, useRouter } from "expo-router";

import { LinearGradient } from "expo-linear-gradient";

export default function AddTask() {
  const [task, setTask] = useState("");

  const params = useLocalSearchParams();
  const router = useRouter();

  const goalId = params.goalId as string;

  const ctx = useContext(TaskContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  /* Entry Animation */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!ctx) return null;

  const { addTask } = ctx;

  const handleAdd = () => {
    if (!task.trim()) {
      alert("Enter task name");
      return;
    }

    if (!goalId) {
      alert("Invalid goal");
      return;
    }

    addTask(goalId, task);
    setTask("");

    alert("Task added successfully");

    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={["#2563EB", "#60A5FA"]}
        style={styles.container}
      >

        {/* Header */}

        <View style={styles.header}>
          <Text style={styles.icon}>📝</Text>

          <Text style={styles.headerTitle}>
            Add New Task
          </Text>

          <Text style={styles.subtitle}>
            Stay consistent. One task at a time.
          </Text>
        </View>

        {/* Card */}

        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>
            Task Details
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your task..."
            value={task}
            onChangeText={setTask}
            placeholderTextColor="#94A3B8"
          />

          <Pressable
            style={styles.btn}
            onPress={handleAdd}
          >
            <Text style={styles.btnText}>
              Save Task
            </Text>
          </Pressable>
        </Animated.View>

      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

/* Styles */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },

  /* Header */

  header: {
    alignItems: "center",
    marginBottom: 25,
  },

  icon: {
    fontSize: 50,
    marginBottom: 8,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
  },

  subtitle: {
    marginTop: 5,
    color: "#E0F2FE",
    fontSize: 13,
  },

  /* Card */

  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: COLORS.secondary,
  },

  input: {
    backgroundColor: "#F8FAFC",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
    fontSize: 15,
    color: COLORS.text,
  },

  btn: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
  },

  btnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});
