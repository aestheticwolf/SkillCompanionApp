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

  // const ctx = useContext(TaskContext)!;
  // const taskCtx = ctx!;
  // const authCtx = useContext(AuthContext);

  const taskCtx = useContext(TaskContext);
const authCtx = useContext(AuthContext);

if (!taskCtx || !authCtx || !authCtx.user) {
  return null;
}

const user = authCtx.user;

  const [darkMode, setDarkMode] = useState<boolean | null>(null);
  const [isSynced, setIsSynced] = useState(false);


  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const [showPicker, setShowPicker] = useState(false);
const [reminderTime, setReminderTime] = useState(new Date());
const [hoveredTask, setHoveredTask] = useState<string | null>(null);



  /* Animation */
  // useEffect(() => {
  //   Animated.parallel([
  //     Animated.timing(fadeAnim, {
  //       toValue: 1,
  //       duration: 600,
  //       useNativeDriver: true,
  //     }),

  //     Animated.timing(slideAnim, {
  //       toValue: 0,
  //       duration: 500,
  //       useNativeDriver: true,
  //     }),
  //   ]).start();
  // }, []);



  useEffect(() => {
  Animated.parallel([
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
    }),
    Animated.timing(fadeAnim, {
      toValue: 1,
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


  // const user = authCtx!.user!;


const {
  goals,
  toggleTask,
  getOverallProgress,
  getGoalProgress,
  getRecommendation,
  hasPendingTasks,
} = taskCtx;

useEffect(() => {
  Animated.timing(progressAnim, {
    toValue: getOverallProgress(),
    duration: 800,
    useNativeDriver: false,
  }).start();
}, [goals]);


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

  const mutedBg = darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)";
const cardBorder = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";

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
        

<View style={styles.headerLeft}>
  <Text
    style={[
      styles.sync,
      { color: isSynced ? "#22C55E" : "#EF4444" },
    ]}
  >
    ☁ {isSynced ? "Synced" : "Offline"}
  </Text>
</View>

<View style={styles.headerCenter}>
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

  <Pressable
    onPress={handleLogout}
    style={({ pressed }) => [
      styles.logoutBtn,
      pressed && { opacity: 0.7 },
    ]}
  >
    <Text style={styles.logoutText}>Logout</Text>
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
{/* 
        <Pressable
  style={[
    styles.addBtn,
    !isSynced && { opacity: 0.6 },
  ]}
  disabled={!isSynced}
  onPress={() => router.push("/add-goal")}
>
          <Text style={styles.addText}>＋</Text>
        </Pressable> */}

        {/* Goals */}

<View style={styles.goalsHeader}>
  <Text
    style={[
      styles.sectionTitle,
      { color: darkMode ? "#E5E7EB" : "#334155" },
    ]}
  >
    Your Goals
  </Text>

  <Pressable
    onPress={() => router.push("/add-goal")}
    disabled={!isSynced}
    style={({ pressed }) => [
      styles.addGoalTopBtn,
      !isSynced && { opacity: 0.5 },
      pressed && { opacity: 0.8 },
    ]}
  >
    <Text style={styles.addGoalTopText}>＋ Add Goal</Text>
  </Pressable>
</View>

        <ScrollView
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ paddingBottom: 160 }}
>

          {goals.length === 0 && (
            <View
  style={[
    styles.emptyCard,
    {
      backgroundColor: darkMode
        ? "rgba(255,255,255,0.05)"
        : "rgba(0,0,0,0.03)",
    },
  ]}
>
  <Text style={styles.emptyTitle}>No goals yet 🚀</Text>
  <Text style={styles.emptySub}>
    Create your first learning goal to get started
  </Text>
</View>
          )}

          {goals.map((g: any, index: number) => (

         <Animated.View
  key={g.id}
style={[
  styles.goalBox,
  {
    backgroundColor: card,
    borderWidth: 1,
    borderColor: darkMode
      ? "rgba(255,255,255,0.08)"
      : "rgba(0,0,0,0.05)",
    opacity: fadeAnim,
    transform: [
      { translateY: Animated.add(slideAnim, new Animated.Value(index * 6)) },
    ],
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

  <View
    style={[
      styles.progressTrack,
      {
        backgroundColor: darkMode
          ? "rgba(255,255,255,0.15)"
          : "rgba(0,0,0,0.08)",
      },
    ]}
  >
    {/* <Animated.View
      style={[
        styles.progressFill,
        {
          width: progressAnim.interpolate({
            inputRange: [0, 100],
            outputRange: ["0%", "100%"],
          }),
        },
      ]}
    /> */}


    <Animated.View
  style={[
    styles.progressFill,
    { width: `${getGoalProgress(g.id)}%` },
  ]}
/>
  </View>
</View>


              {g.tasks.map((t: any) => (

<Pressable
  key={t.id}
  onHoverIn={() => Platform.OS === "web" && setHoveredTask(t.id)}
  onHoverOut={() => Platform.OS === "web" && setHoveredTask(null)}
 style={[
  styles.taskRow,
  {
    backgroundColor: darkMode
      ? "rgba(255,255,255,0.05)"
      : "rgba(0,0,0,0.03)",
  },
  Platform.OS === "web" &&
    hoveredTask === t.id && {
      backgroundColor: "rgba(37,99,235,0.08)",
    },
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
  onHoverIn={() => Platform.OS === "web" && setHoveredTask("reminder")}
  onHoverOut={() => Platform.OS === "web" && setHoveredTask(null)}
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
    position: "relative",
  },

 header: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: 18,
  paddingHorizontal: 20,
  borderRadius: 16,
  marginBottom: 20,
  boxShadow: Platform.OS === "web"
    ? "0 10px 30px rgba(0,0,0,0.12)"
    : undefined,
  elevation: 6,
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
  flex: 1,
  flexDirection: "row",
  justifyContent: "flex-end",
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
  position: "absolute",
  right: 24,
  bottom: 110,
  backgroundColor: COLORS.primary,
  width: 56,
  height: 56,
  borderRadius: 28,
  justifyContent: "center",
  alignItems: "center",
  elevation: 8,
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
  padding: 18,
  borderRadius: 18,
  marginBottom: 18,
  boxShadow: Platform.OS === "web"
    ? "0 10px 20px rgba(0,0,0,0.08)"
    : undefined,
  elevation: 4,
},

  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

 goalTitle: {
  fontSize: 19,
  fontWeight: "800",
},

progress: {
  color: COLORS.primary,
  fontWeight: "800",
  fontSize: 14,
},

taskRow: {
  marginBottom: 8,
  paddingVertical: 8,
  paddingHorizontal: 10,
  borderRadius: 8,
},

addTaskBtn: {
  marginTop: 14,
  paddingVertical: 10,
  alignItems: "center",
},

  addTaskText: {
  color: COLORS.primary,
  fontWeight: "700",
  fontSize: 14,
},

bottomBar: {
  flexDirection: "row",
  gap: 14,
  marginTop: 16,
  marginBottom: 10,
},

bottomBtn: {
  flex: 1,
  backgroundColor: COLORS.primary,
  paddingVertical: 16,
  borderRadius: 14,
  alignItems: "center",
  boxShadow: Platform.OS === "web"
    ? "0 10px 25px rgba(37,99,235,0.35)"
    : undefined,
},

  btnText: {
    color: "white",
    fontWeight: "600",
  },

  /* Recommendation */

recommendBox: {
  padding: 18,
  borderRadius: 16,
  marginBottom: 20,
  borderLeftWidth: 5,
  boxShadow: Platform.OS === "web"
    ? "0 12px 25px rgba(0,0,0,0.08)"
    : undefined,
  elevation: 4,
},

recommendTitle: {
  fontWeight: "800",
  fontSize: 17,
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

progressTrack: {
  height: 8,
  borderRadius: 4,
  marginBottom: 12,
  overflow: "hidden",
},

progressFill: {
  height: "100%",
  borderRadius: 4,
  backgroundColor: COLORS.primary,
},

emptyCard: {
  padding: 28,
  borderRadius: 18,
  alignItems: "center",
},

emptyTitle: {
  fontSize: 16,
  fontWeight: "800",
},

emptySub: {
  marginTop: 6,
  fontSize: 13,
  color: "#64748B",
},


sectionTitle: {
  fontSize: 16,
  fontWeight: "800",
  marginBottom: 12,
},


logoutBtn: {
  backgroundColor: "rgba(255,255,255,0.2)",
  paddingHorizontal: 14,
  paddingVertical: 6,
  borderRadius: 20,
},

logoutText: {
  color: "white",
  fontWeight: "600",
  fontSize: 13,
},

headerLeft: {
  flex: 1,
},

headerCenter: {
  flex: 2,
  alignItems: "center",
},

goalsHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
},

addGoalTopBtn: {
  backgroundColor: COLORS.primary,
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 20,
},

addGoalTopText: {
  color: "white",
  fontWeight: "700",
  fontSize: 13,
},

});


