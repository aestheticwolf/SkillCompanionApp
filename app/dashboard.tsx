import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Switch,
} from "react-native";

import { useRouter } from "expo-router";
import { AuthContext } from "../src/context/AuthContext";
import { useContext, useEffect, useRef, useState } from "react";

import { TaskContext } from "../src/context/TaskContext";
import { COLORS } from "../src/constants/theme";
import { scheduleReminder } from "../src/services/notifications";

import { signOut } from "firebase/auth";
import { auth } from "../src/services/firebase";
import { listenToNetwork } from "../src/services/network";
import AsyncStorage from "@react-native-async-storage/async-storage";



export default function Dashboard() {
  const router = useRouter();

  const ctx = useContext(TaskContext);
  const authCtx = useContext(AuthContext);

  const [darkMode, setDarkMode] = useState<boolean | null>(null);
  const [isSynced, setIsSynced] = useState(false);


  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  /* Animation */
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

  useEffect(() => {
  loadTheme();
}, []);

const loadTheme = async () => {
  const saved = await AsyncStorage.getItem("DARK_MODE");

  if (saved !== null) {
    setDarkMode(saved === "true");
  } else {
    setDarkMode(false);
  }
};


useEffect(() => {
  const unsub = listenToNetwork(setIsSynced);

  return () => unsub();
}, []);



  if (!authCtx?.user || !ctx) return null;

  const user = authCtx.user;


  const { goals, toggleTask } = ctx;

  /* Recommendation System */

  let totalTasks = 0;
  let completedTasks = 0;

  goals.forEach((g) => {
    totalTasks += g.tasks.length;
    completedTasks += g.tasks.filter((t) => t.completed).length;
  });

  const progressPercent =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100);

  let recommendation = "";

  if (totalTasks === 0) {
    recommendation = "Start by creating your first learning goal.";
  } else if (completedTasks === 0) {
    recommendation = "Begin with one small task today.";
  } else if (progressPercent < 30) {
    recommendation = "Try completing 2 tasks daily for faster growth.";
  } else if (progressPercent < 60) {
    recommendation = "Good consistency. Maintain your routine.";
  } else if (progressPercent < 80) {
    recommendation = "Great work. Focus on difficult topics now.";
  } else if (progressPercent < 100) {
    recommendation = "Almost complete. Finish remaining tasks.";
  } else {
    recommendation = "Excellent. Start a new advanced skill.";
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

  const recommendBg = darkMode ? "#020617" : "#EFF6FF";
  const recommendTextColor = darkMode ? "#CBD5F5" : "#334155";
  const recommendBorder = darkMode ? "#38BDF8" : COLORS.primary;

  const bg = darkMode ? "#020617" : "#F8FAFC";
  const card = darkMode ? "#020617" : "#FFFFFF";

  const textPrimary = darkMode ? "#FFFFFF" : "#0F172A";
  const textSecondary = darkMode ? "#CBD5F5" : "#475569";

  const headerBg = darkMode ? "#020617" : "#2563EB";

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      <View style={styles.wrapper}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: headerBg }]}>

  <Text
    style={[
      styles.sync,
      { color: isSynced ? "#22C55E" : "#EF4444" },
    ]}
  >
    ☁ {isSynced ? "Synced" : "Offline"}
  </Text>

  <View style={{ alignItems: "center" }}>
    <Text style={styles.welcome}>Welcome 👋</Text>

    <Text style={styles.email}>
      {user.displayName || user.email}
    </Text>
  </View>

  <View style={styles.headerRight}>

  <Switch
  value={!!darkMode}
  onValueChange={async (v) => {
    setDarkMode(v);
    await AsyncStorage.setItem("DARK_MODE", v.toString());
  }}
/>


    <Pressable
      style={styles.avatar}
      onPress={() => router.push("/profile")}
    >
      <Text style={styles.avatarText}>
        {(user.displayName || user.email)
          ?.charAt(0)
          .toUpperCase()}
      </Text>
    </Pressable>

    <Pressable onPress={handleLogout}>
      <Text style={styles.logout}>⎋</Text>
    </Pressable>

  </View>
</View>


        {/* Recommendation Card */}

        <Animated.View
          style={[
            styles.recommendBox,
            {
              backgroundColor: recommendBg,
              borderLeftColor: recommendBorder,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text
            style={[
              styles.recommendTitle,
              { color: darkMode ? "#FFFFFF" : COLORS.secondary },
            ]}
          >
            📌 Your Recommendation
          </Text>

          <Text
            style={[
              styles.recommendText,
              { color: recommendTextColor },
            ]}
          >
            {recommendation}
          </Text>

          <Text
            style={[
              styles.progressText,
              { color: recommendTextColor },
            ]}
          >
            Progress: {progressPercent}%
          </Text>
        </Animated.View>

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

  screen: {
    flex: 1,
    alignItems: "center",
  },

  wrapper: {
    width: "100%",
    maxWidth: 900,
    padding: 16,
    flex: 1,
  },

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
    padding: 15,
    borderRadius: 14,
    marginBottom: 15,
    borderLeftWidth: 4,
  },

  recommendTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 6,
  },

  recommendText: {
    marginBottom: 4,
  },

  progressText: {
    fontSize: 13,
  },
});
