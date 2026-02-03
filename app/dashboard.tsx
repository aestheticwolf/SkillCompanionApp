import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";

import { useRouter } from "expo-router";
import { AuthContext } from "../src/context/AuthContext";
import { useContext } from "react";
import { useEffect } from "react";


import { TaskContext } from "../src/context/TaskContext";
import { COLORS } from "../src/constants/theme";
import { scheduleReminder } from "../src/services/notifications";

export default function Dashboard() {
  const router = useRouter();

  const ctx = useContext(TaskContext);
  const authCtx = useContext(AuthContext);

  /* Protect Route */
  useEffect(() => {
    if (!authCtx?.user) {
      router.replace("/login");
    }
  }, [authCtx?.user]);

  if (!authCtx?.user) {
    return null;
  }

  if (!ctx) {
    return null;
  }

  const { goals, toggleTask } = ctx;


  /* Reminder */

  const setReminder = async () => {
    await scheduleReminder(
      "Skill Companion Reminder",
      "Complete your pending tasks today!",
      20
    );

    alert("Daily reminder set for 8 PM");
  };

  return (
    <View style={styles.container}>
      {/* Header */}

      <View style={styles.header}>
        <Text style={styles.title}>
          My Learning Goals
        </Text>

        <Pressable
          style={styles.addBtn}
          onPress={() =>
            router.push("/add-goal")
          }
        >
          <Text style={styles.addText}>
            ＋
          </Text>
        </Pressable>
      </View>

      {/* No Goals */}

      {goals.length === 0 && (
        <Text style={styles.empty}>
          No goals yet. Add one!
        </Text>
      )}

      {/* Goals & Tasks */}

      {goals.map((g) => (
        <View
          key={g.id}
          style={styles.goalBox}
        >
          <Text style={styles.goalTitle}>
            {g.name}
          </Text>

          {/* Tasks */}

          {g.tasks.map((t) => (
            <Pressable
              key={t.id}
              style={styles.taskRow}
              onPress={() =>
                toggleTask(g.id, t.id)
              }
            >
              <Text>
                {t.completed
                  ? "✅"
                  : "⬜"}{" "}
                {t.title}
              </Text>
            </Pressable>
          ))}

          {/* Add Task */}

          <Pressable
            style={styles.addTaskBtn}
            onPress={() =>
              router.push({
                pathname: "/add-task",
                params: { goalId: g.id },
              })
            }
          >
            <Text>Add Task</Text>
          </Pressable>
        </View>
      ))}

      {/* Reminder */}

      <Pressable
        style={[
          styles.bottomBtn,
          { backgroundColor: "#16A34A" },
        ]}
        onPress={setReminder}
      >
        <Text style={styles.btnText}>
          Set Daily Reminder
        </Text>
      </Pressable>

      {/* Progress */}

      <Pressable
        style={styles.bottomBtn}
        onPress={() =>
          router.push("/progress")
        }
      >
        <Text style={styles.btnText}>
          View Progress
        </Text>
      </Pressable>
    </View>
  );
}

/* Styles */

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

  empty: {
    textAlign: "center",
    marginTop: 30,
    color: "#64748B",
  },

  goalBox: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },

  goalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },

  taskRow: {
    marginLeft: 10,
    marginBottom: 5,
  },

  addTaskBtn: {
    backgroundColor: "#DBEAFE",
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    alignItems: "center",
  },

  bottomBtn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  btnText: {
    color: "white",
    fontWeight: "600",
  },
});
