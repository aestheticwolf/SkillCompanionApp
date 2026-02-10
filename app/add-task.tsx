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
import { useLocalSearchParams, useRouter } from "expo-router";

import { TaskContext } from "../src/context/TaskContext";
import { COLORS } from "../src/constants/theme";
import { loadTheme } from "../src/services/uiPreferences";
import { showSuccess, showError } from "../src/services/toast";

export default function AddTask() {
  const [task, setTask] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const router = useRouter();
  const params = useLocalSearchParams();
  const goalId = params.goalId as string;

  const ctx = useContext(TaskContext);
  if (!ctx) return null;

  const { addTask } = ctx;

  /* Animations */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadTheme().then(setDarkMode);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

const handleAdd = () => {
  if (!task.trim()) {
    showError("Task name cannot be empty");
    return;
  }

  try {
    addTask(goalId, task.trim());
    showSuccess("Task added");
    router.back();
  } catch {
    showError("Something went wrong");
  }
};

  /* Theme */
  const bg = darkMode ? "#020617" : "#F8FAFC";
  const card = darkMode ? "#020617" : "#FFFFFF";
  const textPrimary = darkMode ? "#FFFFFF" : "#0F172A";
  const textSecondary = darkMode ? "#CBD5F5" : "#475569";
  const border = darkMode ? "#1E293B" : "#E5E7EB";
  const inputBg = darkMode ? "#020617" : "#F8FAFC";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { backgroundColor: bg }]}>
        <View style={styles.wrapper}>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: border }]}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backBtn,
                {
                  backgroundColor: darkMode ? "#1E293B" : "#E5E7EB",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.backIcon,
                  { color: darkMode ? "#E5E7EB" : COLORS.primary },
                ]}
              >
                ←
              </Text>
            </Pressable>

            <Text style={[styles.title, { color: textPrimary }]}>
              Add Task
            </Text>

            <View style={{ width: 40 }} />
          </View>

          {/* Card */}
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: card,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: textPrimary }]}>
              Task Details
            </Text>

            <Text style={[styles.subtitle, { color: textSecondary }]}>
              Keep tasks small and achievable.
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: inputBg,
                  borderColor: border,
                  color: textPrimary,
                },
              ]}
              placeholder="Enter your task..."
              placeholderTextColor={textSecondary}
              value={task}
              onChangeText={setTask}
            />

            <Pressable
              style={({ pressed }) => [
                styles.btn,
                { opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={handleAdd}
            >
              <Text style={styles.btnText}>
                Save Task
              </Text>
            </Pressable>
          </Animated.View>

        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* Styles */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  wrapper: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    padding: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    marginBottom: 24,
    borderBottomWidth: 1,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  backIcon: {
    fontSize: 18,
    fontWeight: "700",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
  },

  card: {
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 13,
    marginBottom: 16,
  },

  input: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    fontSize: 15,
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
    fontSize: 15,
  },
});
