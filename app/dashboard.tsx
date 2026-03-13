import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Switch,
  Platform,
  Dimensions,
  StatusBar,
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

import { updateStreak } from "../src/services/streak";

import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../src/services/firebase";

import {
  requestNotificationPermission,
  scheduleDailyReminder,
} from "../src/services/notifications";

import DateTimePicker from "@react-native-community/datetimepicker";



/* ─── accent palette for goal cards ─── */
const GOAL_COLORS = [
  "#6366f1","#f97316","#06b6d4","#a78bfa",
  "#fbbf24","#34d399","#3b82f6","#ec4899",
];
const GOAL_EMOJIS = ["☕","🦋","⚛️","🔥","🎨","🚀","📚","🎯"];

/* ════════════════════════════════
   SHIMMER PROGRESS BAR
════════════════════════════════ */
function ShimmerBar({ pct, color, h = 6 }: { pct: number; color: string; h?: number }) {
  const x = useRef(new Animated.Value(-1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(x, { toValue: 2, duration: 1800, useNativeDriver: true })
    ).start();
  }, []);

  if (Platform.OS !== "web") {
    return (
      <View style={{ height: h, borderRadius: 99, backgroundColor: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <View style={{ height: "100%", width: `${pct}%` as any, backgroundColor: color, borderRadius: 99 }} />
      </View>
    );
  }
  return (
    <View style={{ height: h, borderRadius: 99, backgroundColor: "rgba(0,0,0,0.07)", overflow: "hidden" } as any}>
      <View style={[{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: 99, position: "relative", overflow: "hidden" } as any]}>
        <Animated.View style={{
          position: "absolute", top: 0, bottom: 0, width: "45%",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
          transform: [{ translateX: x.interpolate({ inputRange: [-1, 2], outputRange: ["-100%", "280%"] }) }],
        } as any} />
      </View>
    </View>
  );
}

/* ════════════════════════════════
   MAIN DASHBOARD
════════════════════════════════ */
export default function Dashboard() {
  const router = useRouter();

  const taskCtx = useContext(TaskContext);
  const authCtx = useContext(AuthContext);

  if (!taskCtx || !authCtx || !authCtx.user) {
    return null;
  }

  const user = authCtx.user;

  const [darkMode, setDarkMode] = useState<boolean | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);


  /* ── Animations ── */
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(40)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const hdrScale    = useRef(new Animated.Value(0.97)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 10 }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(hdrScale,  { toValue: 1, useNativeDriver: true, tension: 80, friction: 9 }),
    ]).start();

    /* pulsing sync dot */
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.6, duration: 750, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => { loadTheme().then(setDarkMode); }, []);
  useEffect(() => {
    const unsub = listenToNetwork(setIsSynced);
    return () => unsub();
  }, []);

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

useEffect(() => {
  const userRef = doc(db, "users", user.uid);

  const unsubscribe = onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      setStreak(data.streak || 0);
    }
  });

  return unsubscribe;
}, []);

  /* ── Theme tokens (same logic as original) ── */
  const dark = !!darkMode;
  const bg            = dark ? "#020617" : "#F0F4FF";
  const card          = dark ? "#0d1424" : "#FFFFFF";
  const textPrimary   = dark ? "#FFFFFF" : "#0F172A";
  const textSecondary = dark ? "#CBD5F5" : "#475569";
  const headerBg      = dark ? "#020617" : "#1e3a8a";
  const recBg         = dark ? "#020617" : "#EFF6FF";
  const recBorder     = dark ? "#38BDF8" : COLORS.primary;
  const recText       = dark ? "#CBD5F5" : "#334155";
  const cardBorder    = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";

  const overallPct  = getOverallProgress();
  const displayName = user.displayName || user.email || "User";
  const initials    = (displayName).charAt(0).toUpperCase();

  const isWide = Platform.OS === "web" && Dimensions.get("window").width > 720;

  const cardShadow = Platform.OS === "web"
    ? { boxShadow: dark ? "0 4px 24px rgba(0,0,0,0.4)" : "0 4px 20px rgba(99,102,241,0.09)" }
    : { elevation: 4 };

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={headerBg} />

      {/* ── Full-width wrapper, NO maxWidth ── */}
      <View style={styles.wrapper}>

        {/* Offline banner */}
        {!isSynced && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>
              ⚡ You are offline. Changes will sync when online.
            </Text>
          </View>
        )}

        {/* ════ HEADER ════ */}
        <Animated.View
          style={[
            styles.header,
            { backgroundColor: headerBg },
            Platform.OS === "web"
              ? { boxShadow: "0 16px 48px rgba(0,0,0,0.28)" }
              : { elevation: 12 },
            { transform: [{ scale: hdrScale }], opacity: fadeAnim },
          ]}
        >
          {/* Web gradient overlay */}
          {Platform.OS === "web" && (
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, {
                borderRadius: 20,
                background: dark
                  ? "linear-gradient(135deg,#020617 0%,#0f2060 60%,#1a1060 100%)"
                  : "linear-gradient(135deg,#1e3a8a 0%,#2563eb 60%,#6d28d9 100%)",
              } as any]}
            />
          )}

          {/* Decorative orbs */}
          <View pointerEvents="none" style={[styles.orb, styles.orb1]} />
          <View pointerEvents="none" style={[styles.orb, styles.orb2]} />

          {/* Row 1: sync + controls */}
          <View style={styles.headerRow1}>
            {/* Sync badge */}
            <View style={styles.syncBadge}>
              <Animated.View style={[
                styles.syncDot,
                { backgroundColor: isSynced ? "#22C55E" : "#EF4444", transform: [{ scale: pulseAnim }] },
              ]} />
              <Text style={[styles.syncText, { color: isSynced ? "#22C55E" : "#EF4444" }]}>
                {isSynced ? "Synced" : "Offline"}
              </Text>
            </View>

            {/* Controls */}
            <View style={styles.headerControls}>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleEmoji}>{dark ? "🌙" : "☀️"}</Text>
                <Switch
                  value={dark}
                  onValueChange={async (v) => { setDarkMode(v); await saveTheme(v); }}
                  trackColor={{ false: "rgba(255,255,255,0.25)", true: "#6366f1" }}
                  thumbColor="#ffffff"
                  style={{ transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }] }}
                />
              </View>

              <Pressable style={styles.avatar} onPress={() => router.push("/profile")}>
                <Text style={styles.avatarText}>{initials}</Text>
              </Pressable>

              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.logoutText}>Logout</Text>
              </Pressable>
            </View>
          </View>

          {/* Row 2: greeting + ring */}
          <View style={styles.headerRow2}>
            <View>
              <Text style={styles.welcomeText}>Welcome 👋</Text>
              <Text style={styles.nameText}>{displayName}</Text>
              <Text style={styles.roleText}>Intern Developer</Text>
            </View>

            {/* Conic progress ring */}
            <View style={[
              styles.ringOuter,
              Platform.OS === "web"
                ? { background: `conic-gradient(rgba(255,255,255,0.9) ${overallPct * 3.6}deg, rgba(255,255,255,0.13) 0deg)` } as any
                : { borderWidth: 4, borderColor: "rgba(255,255,255,0.3)" },
            ]}>
              <View style={[styles.ringInner, { backgroundColor: headerBg }]}>
                <Text style={styles.ringPct}>{overallPct}%</Text>
                <Text style={styles.ringDone}>done</Text>
              </View>
            </View>
          </View>

          {/* Row 3: stat chips */}
          <View style={styles.statRow}>
            {[
              { icon: "🎯", val: String(goals.length), lbl: "Goals" },
              { icon: "✅", val: String(goals.reduce((a: number, g: any) => a + g.tasks.filter((t: any) => t.completed).length, 0)), lbl: "Done" },
              { icon: "🔥", val: `${streak}d`, lbl: "Streak" },
              { icon: "⭐", val: "842", lbl: "Score"  },
            ].map((s, i) => (
              <Animated.View
                key={i}
                style={[styles.chip, {
                  opacity: fadeAnim,
                  transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(i * 5)) }],
                }]}
              >
                <Text style={styles.chipIcon}>{s.icon}</Text>
                <Text style={styles.chipVal}>{s.val}</Text>
                <Text style={styles.chipLbl}>{s.lbl}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* ════ RECOMMENDATION ════ */}
        <Animated.View
          style={[
            styles.recommendBox,
            {
              backgroundColor: recBg,
              borderLeftColor: recBorder,
              ...cardShadow,
            },
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.recRow}>
            <View style={styles.recIconWrap}>
              <Text style={{ fontSize: 20 }}>🚀</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.recommendTitle, { color: dark ? "#FFFFFF" : COLORS.secondary }]}>
                📌 Your Recommendation
              </Text>
              <Text style={[styles.recommendText, { color: recText }]}>
                {getRecommendation()}
              </Text>
            </View>
          </View>

          <View style={styles.recProgRow}>
            <Text style={[styles.progressText, { color: recText }]}>Overall progress</Text>
            <Text style={[styles.progressText, { color: dark ? "#a78bfa" : COLORS.primary, fontWeight: "800" as const }]}>
              {overallPct}%
            </Text>
          </View>

          {/* Shimmer progress bar */}
          <ShimmerBar pct={overallPct} color={dark ? "#6366f1" : COLORS.primary} h={7} />
        </Animated.View>

        {/* ════ GOALS HEADER ════ */}
        <Animated.View style={[styles.goalsHeader, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={[styles.sectionTitle, { color: dark ? "#E5E7EB" : "#334155" }]}>
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
        </Animated.View>

        {/* ════ SCROLL AREA ════ */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 108 }}
        >
          {/* Empty state */}
          {goals.length === 0 && (
            <Animated.View
              style={[
                styles.emptyCard,
                { backgroundColor: dark ? "rgba(255,255,255,0.05)" : "rgba(99,102,241,0.04)", borderColor: cardBorder, ...cardShadow },
                { opacity: fadeAnim },
              ]}
            >
              <Text style={styles.emptyEmoji}>🚀</Text>
              <Text style={[styles.emptyTitle, { color: textPrimary }]}>No goals yet</Text>
              <Text style={styles.emptySub}>Create your first learning goal to get started</Text>
              <Pressable
                onPress={() => router.push("/add-goal")}
                disabled={!isSynced}
                style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.emptyBtnText}>Create Goal →</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Goal cards — 2 col on wide screens */}
          {goals.length > 0 && (
            <View style={isWide ? styles.gridWide : styles.gridNarrow}>
              {goals.map((g: any, index: number) => {
                const accent  = GOAL_COLORS[index % GOAL_COLORS.length];
                const goalPct = getGoalProgress(g.id);
                const doneCnt = g.tasks.filter((t: any) => t.completed).length;

                return (
                  <Animated.View
                    key={g.id}
                    style={[
                      styles.goalBox,
                      isWide ? styles.goalBoxWide : styles.goalBoxFull,
                      {
                        backgroundColor: card,
                        borderColor: cardBorder,
                        borderLeftColor: accent,
                        ...cardShadow,
                      },
                      {
                        opacity: fadeAnim,
                        transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(index * 7)) }],
                      },
                    ]}
                  >
                    {/* Goal top row */}
                    <View style={styles.goalHeader}>
                      <View style={[styles.goalIconWrap, { backgroundColor: accent + "1c" }]}>
                        <Text style={{ fontSize: 20 }}>{GOAL_EMOJIS[index % GOAL_EMOJIS.length]}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={[styles.goalTitle, { color: textPrimary }]} numberOfLines={1}>
                          {g.name}
                        </Text>
                        <View style={styles.goalMeta}>
                          <Text style={[styles.goalMetaTx, { color: textSecondary }]}>
                            {doneCnt}/{g.tasks.length} tasks
                          </Text>
                          <View style={[styles.goalMetaDot, { backgroundColor: textSecondary }]} />
                          <Text style={[styles.goalMetaTx, { color: accent, fontWeight: "700" as const }]}>
                            {goalPct}%
                          </Text>
                        </View>
                      </View>

                      {/* Mini progress ring */}
                      <View style={[
                        styles.miniRing,
                        Platform.OS === "web"
                          ? { background: `conic-gradient(${accent} ${goalPct * 3.6}deg, ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"} 0deg)` } as any
                          : { borderWidth: 2.5, borderColor: accent + "55" },
                      ]}>
                        <View style={[styles.miniRingInner, { backgroundColor: card }]}>
                          <Text style={[styles.miniRingTx, { color: accent }]}>{goalPct}%</Text>
                        </View>
                      </View>

                      <Pressable
                        onPress={() => taskCtx.deleteGoal(g.id)}
                        style={({ pressed }) => [styles.deleteGoalBtn, pressed && { opacity: 0.55 }]}
                      >
                        <Text style={styles.deleteText}>🗑</Text>
                      </Pressable>
                    </View>

                    {/* Shimmer progress bar */}
                    <View style={{ marginBottom: 12 }}>
                      <ShimmerBar pct={goalPct} color={accent} h={5} />
                    </View>

                    {/* Tasks */}
                    {g.tasks.map((t: any) => (
                      <Pressable
                        key={t.id}
                        onHoverIn={() => Platform.OS === "web" && setHoveredTask(t.id)}
                        onHoverOut={() => Platform.OS === "web" && setHoveredTask(null)}
                        style={[
                          styles.taskRow,
                          {
                            backgroundColor: t.completed
                              ? accent + "0d"
                              : dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.025)",
                            borderColor: t.completed ? accent + "28" : cardBorder,
                          },
                          Platform.OS === "web" && hoveredTask === t.id && {
                            backgroundColor: accent + "14",
                          } as any,
                          !isSynced && { opacity: 0.5 },
                        ]}
                        onPress={async () => {
                          if (!isSynced) {
                            showError("You are offline. Changes will sync later.");
                            return;
                          }
                          toggleTask(g.id, t.id);
                          if (!t.completed) {
                            await updateStreak(user.uid);
                          }
                          showSuccess(t.completed ? "Task marked incomplete" : "Task completed 🎉");
                        }}
                      >
                        <View style={styles.taskContent}>
                          <View style={[
                            styles.checkbox,
                            t.completed
                              ? { backgroundColor: accent, borderColor: accent }
                              : { backgroundColor: "transparent", borderColor: dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)" },
                          ]}>
                            {t.completed && <Text style={styles.checkmark}>✓</Text>}
                          </View>
                          <Text style={[
                            styles.taskTitle,
                            {
                              color: t.completed ? (dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)") : textSecondary,
                              textDecorationLine: t.completed ? "line-through" : "none",
                            },
                          ]}>
                            {t.title}
                          </Text>
                          <Pressable onPress={() => taskCtx.deleteTask(g.id, t.id)}>
                            <Text style={styles.deleteText}>✕</Text>
                          </Pressable>
                        </View>
                      </Pressable>
                    ))}

                    <Pressable
                      style={[styles.addTaskBtn, { borderColor: accent + "44" }, !isSynced && { opacity: 0.5 }]}
                      disabled={!isSynced}
                      onPress={() => router.push({ pathname: "/add-task", params: { goalId: g.id } })}
                    >
                      <Text style={[styles.addTaskText, { color: accent }]}>+ Add Task</Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* ════ BOTTOM BAR ════ */}
        <View style={[styles.bottomBar, {
          backgroundColor: dark ? "rgba(2,6,23,0.96)" : "rgba(240,244,255,0.96)",
          borderTopColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
        }]}>
          <Pressable
            style={[styles.bottomBtn, styles.reminderBtn]}
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
            style={[styles.bottomBtn, styles.analyticsBtn]}
            onPress={() => router.push("/analytics")}
          >
            <Text style={styles.btnText}>📊 Analytics</Text>
          </Pressable>
        </View>

        {/* Date Picker */}
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
              const hour   = selectedDate.getHours();
              const minute = selectedDate.getMinutes();
              const granted = await requestNotificationPermission();
              if (!granted) { showError("Notification permission denied"); return; }
              if (!hasPendingTasks()) { showSuccess("No pending tasks. You're all caught up 🎉"); return; }
              await scheduleDailyReminder(hour, minute);
              showSuccess(
                `Reminder set for ${hour % 12 || 12}:${minute.toString().padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`
              );
            }}
          />
        )}

      </View>
    </View>
  );
}

/* ════════════════════════════════════════
   STYLES
════════════════════════════════════════ */
const styles = StyleSheet.create({

  /* Layout — full width, no maxWidth */
  screen: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 52 : 14,
  },

  /* Offline */
  offlineBanner: {
    backgroundColor: "#FEF3C7",
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  offlineText: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  /* Header */
  header: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    marginBottom: 12,
    overflow: "hidden",
    position: "relative",
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    pointerEvents: "none",
  } as any,
  orb1: { width: 200, height: 200, top: -70, right: -50 },
  orb2: { width: 120, height: 120, bottom: -50, right: 130 },

  headerRow1: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    zIndex: 1,
  },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  syncDot: { width: 7, height: 7, borderRadius: 4 },
  syncText: { fontSize: 11, fontWeight: "700" },

  headerControls: { flexDirection: "row", alignItems: "center", gap: 10 },
  toggleRow:      { flexDirection: "row", alignItems: "center", gap: 3 },
  toggleEmoji:    { fontSize: 13 },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.45)",
  },
  avatarText: { fontWeight: "800", fontSize: 15, color: "#1e3a8a" },

  logoutBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  logoutText: { color: "white", fontWeight: "700", fontSize: 12 },

  headerRow2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    zIndex: 1,
  },
  welcomeText: { color: "rgba(255,255,255,0.62)", fontSize: 12, fontWeight: "500", marginBottom: 2 },
  nameText:    { color: "white", fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  roleText:    { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "500", marginTop: 2 },

  ringOuter: { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center" },
  ringInner: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center" },
  ringPct:   { color: "white", fontSize: 14, fontWeight: "900", lineHeight: 16 },
  ringDone:  { color: "rgba(255,255,255,0.55)", fontSize: 9, fontWeight: "500" },

  statRow: { flexDirection: "row", gap: 7, zIndex: 1 },
  chip: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.11)",
    borderRadius: 13,
    paddingVertical: 10,
    paddingHorizontal: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  chipIcon: { fontSize: 16, marginBottom: 3 },
  chipVal:  { color: "white", fontSize: 15, fontWeight: "900" },
  chipLbl:  { color: "rgba(255,255,255,0.55)", fontSize: 9, fontWeight: "500", marginTop: 1 },

  /* Recommendation */
  recommendBox: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  recRow:      { flexDirection: "row", alignItems: "flex-start", gap: 11, marginBottom: 10 },
  recIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(99,102,241,0.14)", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  recommendTitle: { fontWeight: "800", fontSize: 15, marginBottom: 3 },
  recommendText:  { fontSize: 13, fontWeight: "500", lineHeight: 18 },
  recProgRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 7 },
  progressText:{ fontSize: 11, fontWeight: "500" },

  /* Goals section */
  goalsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  addGoalTopBtn: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 11,
    ...(Platform.OS === "web" ? { boxShadow: "0 4px 14px rgba(99,102,241,0.42)" } : { elevation: 5 }),
  },
  addGoalTopText: { color: "white", fontWeight: "700", fontSize: 12 },

  /* Grid layouts */
  gridNarrow: { width: "100%" },
  gridWide:   { flexDirection: "row", flexWrap: "wrap" } as any,

  goalBox: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 13,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  goalBoxFull: { width: "100%" },
  goalBoxWide: { width: "49%", marginHorizontal: "0.5%" },

  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  goalIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  goalTitle: { fontSize: 15, fontWeight: "800", letterSpacing: -0.2, marginBottom: 2 },
  goalMeta:  { flexDirection: "row", alignItems: "center", gap: 5 },
  goalMetaTx:{ fontSize: 11, fontWeight: "500" },
  goalMetaDot:{ width: 3, height: 3, borderRadius: 2 },

  miniRing:      { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  miniRingInner: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  miniRingTx:    { fontSize: 8, fontWeight: "800" },

  deleteGoalBtn: { padding: 5 },
  deleteText:    { color: "#EF4444", fontSize: 15 },

  /* Task row */
  taskRow: {
    marginBottom: 6,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  taskContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: {
    width: 18, height: 18, borderRadius: 5, borderWidth: 2,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  checkmark:  { color: "white", fontSize: 10, fontWeight: "800" },
  taskTitle:  { fontSize: 13, fontWeight: "500", flex: 1 },

  addTaskBtn: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 10,
  },
  addTaskText: { fontWeight: "700", fontSize: 12 },

  /* Empty state */
  emptyCard: { borderRadius: 20, padding: 36, alignItems: "center", borderWidth: 1, marginTop: 6 },
  emptyEmoji:    { fontSize: 42, marginBottom: 12 },
  emptyTitle:    { fontSize: 17, fontWeight: "800", marginBottom: 6 },
  emptySub:      { fontSize: 12, fontWeight: "500", textAlign: "center", lineHeight: 19, color: "#64748B" },
  emptyBtn:      { marginTop: 20, backgroundColor: "#6366f1", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText:  { color: "white", fontWeight: "700", fontSize: 13 },

  /* Bottom bar */
  bottomBar: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 2,
    borderTopWidth: 1,
  },
  bottomBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderBtn: {
    backgroundColor: "#f97316",
    ...(Platform.OS === "web" ? { boxShadow: "0 4px 16px rgba(249,115,22,0.42)" } : { elevation: 5 }),
  },
  analyticsBtn: {
    backgroundColor: "#6366f1",
    ...(Platform.OS === "web" ? { boxShadow: "0 4px 16px rgba(99,102,241,0.42)" } : { elevation: 5 }),
  },
  btnText: { color: "white", fontWeight: "700", fontSize: 14 },
});
