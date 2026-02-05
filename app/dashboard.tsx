import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Switch,
  Platform,
} from "react-native";

import { useRouter } from "expo-router";
import { AuthContext } from "../src/context/AuthContext";
import { useContext, useEffect, useRef, useState } from "react";

import { TaskContext } from "../src/context/TaskContext";
import { COLORS } from "../src/constants/theme";
import { scheduleReminder } from "../src/services/notifications";

import { signOut } from "firebase/auth";
import { auth } from "../src/services/firebase";

export default function Dashboard() {
  const router = useRouter();

  const ctx = useContext(TaskContext);
  const authCtx = useContext(AuthContext);

  const [darkMode, setDarkMode] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  /* Animation */
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!authCtx?.user || !ctx) return null;

  const { goals, toggleTask } = ctx;

  /* Recommendation System */

let totalTasks = 0;
let completedTasks = 0;

goals.forEach((g) => {
  totalTasks += g.tasks.length;
  completedTasks += g.tasks.filter(
    (t) => t.completed
  ).length;
});

const progressPercent =
  totalTasks === 0
    ? 0
    : Math.round(
        (completedTasks / totalTasks) * 100
      );

let recommendation = "";

if (progressPercent < 30) {
  recommendation =
    "Start small. Complete at least 1 task today.";
} else if (progressPercent < 60) {
  recommendation =
    "Good progress. Stay consistent.";
} else if (progressPercent < 90) {
  recommendation =
    "Almost there. Push harder!";
} else {
  recommendation =
    "Excellent! Try advanced topics next.";
}


  /* Logout */
  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  /* Reminder */
  const setReminder = async () => {
    await scheduleReminder(
      "Skill Companion Reminder",
      "Complete your pending tasks today!",
      20
    );

    alert("Daily reminder set");
  };

  /* Theme */

  const bg = darkMode ? "#020617" : "#F8FAFC";
  const card = darkMode ? "#020617" : "#FFFFFF";

  const textPrimary = darkMode ? "#FFFFFF" : "#0F172A";
  const textSecondary = darkMode ? "#CBD5F5" : "#475569";

  const headerBg = darkMode ? "#020617" : "#2563EB";

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>

      {/* Web Center Wrapper */}
      <View style={styles.wrapper}>

        {/* Header */}

        <View style={[styles.header, { backgroundColor: headerBg }]}>

          {/* Left */}

          <Text style={styles.sync}>☁ Synced</Text>

          {/* Center */}

          <View style={{ alignItems: "center" }}>
            <Text style={styles.welcome}>Welcome 👋</Text>

            <Text style={styles.email}>
              {authCtx.user.email}
            </Text>
          </View>

          {/* Right */}

          <View style={styles.headerRight}>

            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
            />

            <Pressable
              style={styles.avatar}
              onPress={() => router.push("/profile")}
            >
              <Text style={styles.avatarText}>
                {authCtx.user.email?.[0].toUpperCase()}
              </Text>
            </Pressable>

            <Pressable onPress={handleLogout}>
              <Text style={styles.logout}>⎋</Text>
            </Pressable>

          </View>
        </View>

        {/* Recommendation Card */}

<View style={styles.recommendBox}>
  <Text style={styles.recommendTitle}>
    📌 Your Recommendation
  </Text>

  <Text style={styles.recommendText}>
    {recommendation}
  </Text>

  <Text style={styles.progressText}>
    Progress: {progressPercent}%
  </Text>
</View>


        {/* Add Goal */}

        <Pressable
          style={styles.addBtn}
          onPress={() => router.push("/add-goal")}
        >
          <Text style={styles.addText}>＋</Text>
        </Pressable>

        {/* Goals */}

        <ScrollView showsVerticalScrollIndicator={false}>

          {goals.length === 0 && (
            <Text style={styles.empty}>
              No goals yet. Start today 🚀
            </Text>
          )}

          {goals.map((g) => (

            <Animated.View
              key={g.id}
              style={[
                styles.goalBox,
                {
                  backgroundColor: card,
                  opacity: fadeAnim,
                },
              ]}
            >

              {/* Goal Header */}

              <View style={styles.goalHeader}>

                <Text
                  style={[
                    styles.goalTitle,
                    { color: textPrimary },
                  ]}
                >
                  {g.name}
                </Text>

                <Text style={styles.progress}>
                  {Math.round(
                    (g.tasks.filter(t => t.completed).length /
                      (g.tasks.length || 1)) * 100
                  )}%
                </Text>

              </View>

              {/* Tasks */}

              {g.tasks.map((t) => (

                <Pressable
                  key={t.id}
                  style={styles.taskRow}
                  onPress={() =>
                    toggleTask(g.id, t.id)
                  }
                >
                  <Text style={{ color: textSecondary }}>
                    {t.completed ? "✅" : "⬜"} {t.title}
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
                <Text style={styles.addTaskText}>
                  + Add Task
                </Text>
              </Pressable>

            </Animated.View>

          ))}

        </ScrollView>

        {/* Bottom Bar */}

        <View style={styles.bottomBar}>

          <Pressable
            style={[styles.bottomBtn, { backgroundColor: "#16A34A" }]}
            onPress={setReminder}
          >
            <Text style={styles.btnText}>🔔 Reminder</Text>
          </Pressable>

          <Pressable
            style={styles.bottomBtn}
            onPress={() => router.push("/analytics")}
          >
            <Text style={styles.btnText}>📊 Analytics</Text>
          </Pressable>

        </View>

      </View>
    </View>
  );
}

/* Styles */

const styles = StyleSheet.create({

  /* Main */

  screen: {
    flex: 1,
    alignItems: "center",
  },

  /* Web Width */

  wrapper: {
    width: "100%",
    maxWidth: 900,     // 👈 Professional width
    padding: 16,
    flex: 1,
  },

  /* Header */

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    padding: 14,
    borderRadius: 14,

    marginBottom: 15,
  },

  sync: {
    color: "#22C55E",
    fontWeight: "600",
  },

  welcome: {
    color: "white",
    fontSize: 14,
  },

  email: {
    color: "white",
    fontWeight: "700",
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  avatar: {
    backgroundColor: "white",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontWeight: "700",
    color: COLORS.primary,
  },

  logout: {
    fontSize: 20,
    color: "white",
  },

  /* Add */

  addBtn: {
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: 24,

    justifyContent: "center",
    alignItems: "center",

    alignSelf: "flex-end",
    marginBottom: 10,
  },

  addText: {
    color: "white",
    fontSize: 28,
  },

  /* Goals */

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#64748B",
  },

  goalBox: {
    padding: 15,
    borderRadius: 14,
    marginBottom: 15,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  goalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  progress: {
    color: COLORS.primary,
    fontWeight: "700",
  },

  taskRow: {
    marginLeft: 8,
    marginBottom: 6,
  },

  addTaskBtn: {
    marginTop: 10,
    alignItems: "center",
  },

  addTaskText: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  /* Bottom */

  bottomBar: {
    flexDirection: "row",
    gap: 10,
    marginTop: 5,
    marginBottom: 10,
  },

  bottomBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,

    padding: 14,
    borderRadius: 12,

    alignItems: "center",
  },

  btnText: {
    color: "white",
    fontWeight: "600",
  },

  /* Recommendation */

recommendBox: {
  backgroundColor: "#EFF6FF",
  padding: 15,
  borderRadius: 14,
  marginBottom: 15,
  borderLeftWidth: 4,
  borderLeftColor: COLORS.primary,
},

recommendTitle: {
  fontWeight: "700",
  fontSize: 16,
  marginBottom: 6,
  color: COLORS.secondary,
},

recommendText: {
  color: "#334155",
  marginBottom: 4,
},

progressText: {
  fontSize: 13,
  color: "#64748B",
},

});
