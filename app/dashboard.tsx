import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Animated,
} from "react-native";

import { useRouter } from "expo-router";
import { useContext, useEffect, useRef } from "react";

import { AuthContext } from "../src/context/AuthContext";
import { TaskContext } from "../src/context/TaskContext";

import { COLORS } from "../src/constants/theme";
import { scheduleReminder } from "../src/services/notifications";

import { LinearGradient } from "expo-linear-gradient";

export default function Dashboard() {
  const router = useRouter();

  const ctx = useContext(TaskContext);
  const authCtx = useContext(AuthContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  /* Protect Route */
  useEffect(() => {
    if (!authCtx?.user) {
      router.replace("/login");
    }
  }, [authCtx?.user]);

  /* Entry Animation */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!authCtx?.user || !ctx) return null;

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

  /* Progress % */

  const getProgress = (tasks: any[]) => {
    if (!tasks.length) return 0;

    const done = tasks.filter(t => t.completed).length;

    return Math.round((done / tasks.length) * 100);
  };

  /* Render Goal */

  const renderGoal = ({ item }: any) => {
    const progress = getProgress(item.tasks);

    return (
      <Animated.View
        style={[
          styles.goalCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Title + Progress */}

        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>
            {item.name}
          </Text>

          <Text style={styles.progressText}>
            {progress}%
          </Text>
        </View>

        {/* Progress Bar */}

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%` },
            ]}
          />
        </View>

        {/* Tasks */}

        {item.tasks.map((t: any) => (
          <Pressable
            key={t.id}
            style={[
              styles.taskPill,
              t.completed && styles.taskDone,
            ]}
            onPress={() =>
              toggleTask(item.id, t.id)
            }
          >
            <Text
              style={[
                styles.taskText,
                t.completed && styles.taskTextDone,
              ]}
            >
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
              params: { goalId: item.id },
            })
          }
        >
          <Text style={styles.addTaskText}>
            + Add Task
          </Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>

      {/* Header */}

      <LinearGradient
        colors={["#2563EB", "#60A5FA"]}
        style={styles.header}
      >
        <View>
          <Text style={styles.welcome}>
            Welcome 👋
          </Text>

          <Text style={styles.username}>
            {authCtx.user.email}
          </Text>
        </View>

        <Pressable
          style={styles.fab}
          onPress={() => router.push("/add-goal")}
        >
          <Text style={styles.fabText}>＋</Text>
        </Pressable>
      </LinearGradient>

      {/* Goals */}

      {goals.length === 0 ? (
        <Text style={styles.empty}>
          No goals yet. Start your journey 🚀
        </Text>
      ) : (
        <FlatList
          data={goals}
          renderItem={renderGoal}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{
            paddingBottom: 140,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bottom Buttons */}

      <View style={styles.bottomBar}>

        <Pressable
          style={[
            styles.bottomBtn,
            { backgroundColor: COLORS.success },
          ]}
          onPress={setReminder}
        >
          <Text style={styles.bottomText}>
            🔔 Reminder
          </Text>
        </Pressable>

        <Pressable
          style={styles.bottomBtn}
          onPress={() =>
            router.push("/progress")
          }
        >
          <Text style={styles.bottomText}>
            📊 Progress
          </Text>
        </Pressable>

      </View>

    </View>
  );
}

/* Styles */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /* Header */

  header: {
    padding: 25,
    paddingTop: 45,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  welcome: {
    color: "#E0F2FE",
    fontSize: 14,
  },

  username: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },

  fab: {
    backgroundColor: "white",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  fabText: {
    fontSize: 26,
    color: COLORS.primary,
    fontWeight: "700",
  },

  /* Cards */

  goalCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 18,
    padding: 18,
    borderRadius: 16,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },

  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  goalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.secondary,
  },

  progressText: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  progressBar: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },

  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },

  /* Tasks */

  taskPill: {
    backgroundColor: "#F1F5F9",
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },

  taskDone: {
    backgroundColor: "#DCFCE7",
  },

  taskText: {
    fontSize: 14,
    color: COLORS.text,
  },

  taskTextDone: {
    textDecorationLine: "line-through",
    color: COLORS.gray,
  },

  addTaskBtn: {
    marginTop: 8,
    alignItems: "center",
  },

  addTaskText: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  /* Empty */

  empty: {
    textAlign: "center",
    marginTop: 60,
    color: COLORS.gray,
    fontSize: 15,
  },

  /* Bottom */

  bottomBar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    gap: 12,
  },

  bottomBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  bottomText: {
    color: "white",
    fontWeight: "700",
  },
});
