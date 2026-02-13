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


import { signOut } from "firebase/auth";
import { auth } from "../src/services/firebase";
import { listenToNetwork } from "../src/services/network";
import { loadTheme, saveTheme } from "../src/services/uiPreferences";

import { showSuccess, showError } from "../src/services/toast";

import {
  requestNotificationPermission,
  scheduleDailyReminder,
} from "../src/services/notifications";

import DateTimePicker from "@react-native-community/datetimepicker";




export default function Dashboard() {
  const router = useRouter();

  const ctx = useContext(TaskContext);
  const authCtx = useContext(AuthContext);

  const [darkMode, setDarkMode] = useState<boolean | null>(null);
  const [isSynced, setIsSynced] = useState(false);


  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const [showPicker, setShowPicker] = useState(false);
const [reminderTime, setReminderTime] = useState(new Date());


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
  loadTheme().then(setDarkMode);
}, []);



useEffect(() => {
  const unsub = listenToNetwork(setIsSynced);

  return () => unsub();
}, []);



  if (!authCtx?.user || !ctx) return null;

  const user = authCtx.user;


const {
  goals,
  toggleTask,
  getOverallProgress,
  getGoalProgress,
  getRecommendation,
  hasPendingTasks,
} = ctx;


  /* Logout */
const handleLogout = async () => {
  await signOut(auth);
  showSuccess("Logged out successfully");
  router.replace("/login");
};


  /* Reminder */
// const setReminder = async () => {
//   await scheduleReminder(
//     "Skill Companion Reminder",
//     "Complete your pending tasks today!",
//     20
//   );
//   alert("Daily reminder set");
// };



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

        {!isSynced && (
  <View style={styles.offlineBanner}>
    <Text style={styles.offlineText}>
      You are offline. Changes will sync when online.
    </Text>
  </View>
)}
        

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
    await saveTheme(v);
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
            {getRecommendation()}
          </Text>

        <Text style={[styles.progressText, { color: recommendTextColor }]}>
  Progress: {getOverallProgress()}%
</Text>

        </Animated.View>

        {/* Add Goal */}

        <Pressable
  style={[
    styles.addBtn,
    !isSynced && { opacity: 0.6 },
  ]}
  disabled={!isSynced}
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
  {getGoalProgress(g.id)}%
</Text>


              </View>

              {g.tasks.map((t) => (

<Pressable
  key={t.id}
  style={[
    styles.taskRow,
    !isSynced && { opacity: 0.5 },
  ]}
  onPress={() => {
    if (!isSynced) {
      showError("You are offline. Changes will sync later.");
      return;
    }

    toggleTask(g.id, t.id);

    showSuccess(
      t.completed ? "Task marked incomplete" : "Task completed 🎉"
    );
  }}
>
  <Text style={{ color: textSecondary }}>
    {t.completed ? "✅" : "⬜"} {t.title}
  </Text>
</Pressable>

              ))}

            <Pressable
  style={[
    styles.addTaskBtn,
    !isSynced && { opacity: 0.5 },
  ]}
  disabled={!isSynced}
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
  style={styles.bottomBtn}
  onPress={() => {
    if (Platform.OS === "web") {
      showError("Smart reminders work only on mobile app");
      return;
    }

    setShowPicker(true);
  }}
>
  <Text style={styles.btnText}>🔔 Smart Reminder</Text>
</Pressable>


  <Pressable
    style={styles.bottomBtn}
    onPress={() => router.push("/analytics")}
  >
    <Text style={styles.btnText}>📊 Analytics</Text>
  </Pressable>

</View>

{showPicker && Platform.OS !== "web" && (
  <DateTimePicker
    value={reminderTime}
    mode="time"
    is24Hour={true}
    display="default"
    onChange={async (_, selectedDate) => {
      setShowPicker(false);
      if (!selectedDate) return;

      setReminderTime(selectedDate);

      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();

      const granted = await requestNotificationPermission();
      if (!granted) {
        showError("Notification permission denied");
        return;
      }

      if (!hasPendingTasks()) {
        showSuccess("No pending tasks. You’re all caught up 🎉");
        return;
      }

      await scheduleDailyReminder(hour, minute);
     showSuccess(
  `Reminder set for ${hour % 12 || 12}:${minute
    .toString()
    .padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`
);
    }}
  />
)}



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
  marginBottom: 8,
  paddingVertical: 6,
  borderRadius: 6,
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


  offlineBanner: {
  backgroundColor: "#FEF3C7",
  padding: 10,
  borderRadius: 10,
  marginBottom: 12,
},

offlineText: {
  color: "#92400E",
  fontSize: 13,
  textAlign: "center",
  fontWeight: "600",
},
});
