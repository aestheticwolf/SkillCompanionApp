import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
} from "react-native";

import { useState, useContext, useRef, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { TaskContext } from "../src/context/TaskContext";
import { COLORS } from "../src/constants/theme";
import { loadTheme } from "../src/services/uiPreferences";
import { showSuccess, showError } from "../src/services/toast";

const HDR_FROM = "#1e3a8a";
const ACCENT   = "#6366f1";

/* Quick tip chips */
const TIPS = ["Be specific", "Make it measurable", "Keep it small", "Set a deadline"];

export default function AddTask() {
  const [task,     setTask]     = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [focused,  setFocused]  = useState(false);

  const router  = useRouter();
  const params  = useLocalSearchParams();
  const goalId  = params.goalId as string;

  const ctx = useContext(TaskContext);
  if (!ctx) return null;
  const { addTask } = ctx;

  /* ── Animations ── */
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(36)).current;
  const hdrScale  = useRef(new Animated.Value(0.96)).current;
  const inputScale = useRef(new Animated.Value(1)).current;
  const btnScale  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadTheme().then(setDarkMode);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 10 }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 460, useNativeDriver: true }),
      Animated.spring(hdrScale,  { toValue: 1, useNativeDriver: true, tension: 80, friction: 9 }),
    ]).start();
  }, []);

  const onFocusInput = () => {
    setFocused(true);
    Animated.spring(inputScale, { toValue: 1.012, useNativeDriver: true, tension: 120, friction: 8 }).start();
  };
  const onBlurInput = () => {
    setFocused(false);
    Animated.spring(inputScale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();
  };

  /* ── Handler (original logic) ── */
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

  const onPressBtn = () => {
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, tension: 200, friction: 5 }),
      Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 5 }),
    ]).start(handleAdd);
  };

  /* ── Theme ── */
  const dark          = !!darkMode;
  const bg            = dark ? "#020617" : "#F0F4FF";
  const card          = dark ? "#0d1424" : "#FFFFFF";
  const textPrimary   = dark ? "#FFFFFF"  : "#0F172A";
  const textSecondary = dark ? "#CBD5F5"  : "#475569";
  const textMuted     = dark ? "rgba(238,242,255,0.38)" : "rgba(15,23,42,0.38)";
  const cardBorder    = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const inputBg       = dark ? "rgba(255,255,255,0.04)" : "#F8FAFF";
  const inputBorder   = focused
    ? ACCENT
    : dark ? "rgba(255,255,255,0.12)" : "rgba(99,102,241,0.2)";

  const cardSh = Platform.OS === "web"
    ? { boxShadow: dark ? "0 4px 24px rgba(0,0,0,0.42)" : "0 4px 20px rgba(99,102,241,0.10)" }
    : { elevation: 4 };

  const hasText = task.trim().length > 0;
  const charCount = task.length;
  const charMax   = 80;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={HDR_FROM} />

      <View style={[styles.screen, { backgroundColor: bg }]}>
        <View style={styles.wrapper}>

          {/* ════ HEADER ════ */}
          <Animated.View
            style={[
              styles.header,
              Platform.OS === "web"
                ? { boxShadow: "0 14px 44px rgba(0,0,0,0.28)" }
                : { elevation: 12 },
              { transform: [{ scale: hdrScale }], opacity: fadeAnim },
            ]}
          >
            {/* Gradient */}
            {Platform.OS === "web" && (
              <View pointerEvents="none" style={[StyleSheet.absoluteFill, {
                borderRadius: 20,
                background: dark
                  ? "linear-gradient(135deg,#020617 0%,#0f2060 60%,#1a1060 100%)"
                  : "linear-gradient(135deg,#1e3a8a 0%,#2563eb 58%,#6d28d9 100%)",
              } as any]} />
            )}
            {Platform.OS !== "web" && (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: HDR_FROM, borderRadius: 20 }]} />
            )}

            {/* Orbs */}
            <View pointerEvents="none" style={[styles.orb, styles.orb1]} />
            <View pointerEvents="none" style={[styles.orb, styles.orb2]} />

            {/* Nav */}
            <View style={styles.hdrTop}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.backTx}>← Back</Text>
              </Pressable>
              <View style={{ alignItems: "center" }}>
                <Text style={styles.hdrTitle}>Add Task</Text>
                <Text style={styles.hdrSub}>Break your goal into steps</Text>
              </View>
              <View style={{ width: 68 }} />
            </View>

            {/* Icon + label */}
            <View style={styles.hdrBody}>
              <View style={styles.hdrIconWrap}>
                <Text style={{ fontSize: 32 }}>📝</Text>
              </View>
              <Text style={styles.hdrHint}>What do you want to accomplish?</Text>
            </View>
          </Animated.View>

          {/* ════ FORM CARD ════ */}
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: card, borderColor: cardBorder, ...cardSh },
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.cardHdr}>
              <Text style={[styles.cardTitle, { color: textPrimary }]}>Task Details</Text>
              <View style={[styles.badge, { backgroundColor: ACCENT + "14" }]}>
                <Text style={{ fontSize: 10, color: ACCENT, fontWeight: "700" }}>New Task</Text>
              </View>
            </View>

            <Text style={[styles.subtitle, { color: textSecondary }]}>
              Keep tasks small and achievable.
            </Text>

            {/* Input */}
            <Animated.View style={{ transform: [{ scale: inputScale }] }}>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    ...(Platform.OS === "web" && focused
                      ? { boxShadow: `0 0 0 3px ${ACCENT}22` }
                      : {}),
                  } as any,
                ]}
              >
                <Text style={[styles.inputIcon, { opacity: focused || hasText ? 1 : 0.4 }]}>✏️</Text>
                <TextInput
                  style={[styles.input, { color: textPrimary }]}
                  placeholder="Enter your task..."
                  placeholderTextColor={textMuted}
                  value={task}
                  onChangeText={t => t.length <= charMax && setTask(t)}
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                  autoFocus={Platform.OS !== "web"}
                  returnKeyType="done"
                  onSubmitEditing={handleAdd}
                />
                {hasText && (
                  <Pressable onPress={() => setTask("")} style={styles.clearBtn}>
                    <Text style={{ color: textMuted, fontSize: 16 }}>✕</Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>

            {/* Char counter */}
            <View style={styles.charRow}>
              <Text style={[styles.charHint, { color: textMuted }]}>
                {hasText ? `"${task.trim()}"` : "Start typing your task above"}
              </Text>
              <Text style={[styles.charCount, { color: charCount > charMax * 0.8 ? "#f97316" : textMuted }]}>
                {charCount}/{charMax}
              </Text>
            </View>

            {/* Save button */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <Pressable
                onPress={onPressBtn}
                style={[
                  styles.saveBtn,
                  {
                    backgroundColor: hasText ? ACCENT : dark ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.2)",
                    ...(Platform.OS === "web" && hasText
                      ? { boxShadow: "0 6px 20px rgba(99,102,241,0.45)" }
                      : {}),
                  } as any,
                ]}
              >
                <Text style={[styles.saveTx, { opacity: hasText ? 1 : 0.5 }]}>
                  {hasText ? "✓  Save Task" : "Enter a task name"}
                </Text>
              </Pressable>
            </Animated.View>
          </Animated.View>

          {/* ════ TIPS CARD ════ */}
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: card, borderColor: cardBorder, ...cardSh },
              { opacity: fadeAnim, transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(12)) }] },
            ]}
          >
            <View style={styles.cardHdr}>
              <Text style={[styles.cardTitle, { color: textPrimary }]}>💡 Tips for great tasks</Text>
            </View>
            <View style={styles.tipsGrid}>
              {TIPS.map((tip, i) => (
                <View
                  key={i}
                  style={[styles.tipChip, { backgroundColor: dark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.07)", borderColor: ACCENT + "22" }]}
                >
                  <Text style={{ fontSize: 12 }}>
                    {["🎯","📏","🔍","⏰"][i]}
                  </Text>
                  <Text style={[styles.tipTx, { color: textSecondary }]}>{tip}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ════════════════════════════════
   STYLES
════════════════════════════════ */
const styles = StyleSheet.create({
  screen:  { flex: 1 },
  wrapper: {
    flex: 1, width: "100%",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 52 : 14,
  },

  /* Header */
  header: {
    borderRadius: 20, paddingHorizontal: 18,
    paddingTop: 14, paddingBottom: 20,
    marginBottom: 14, overflow: "hidden", position: "relative",
  },
  orb:  { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)" } as any,
  orb1: { width: 160, height: 160, top: -50, right: -40 },
  orb2: { width: 90,  height: 90,  bottom: -30, left: 60 },

  hdrTop: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 18, zIndex: 1,
  },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 13, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  backTx:   { color: "white", fontWeight: "700", fontSize: 13 },
  hdrTitle: { color: "white", fontSize: 18, fontWeight: "900", letterSpacing: -0.3 },
  hdrSub:   { color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: "500", marginTop: 2 },

  hdrBody: { alignItems: "center", zIndex: 1 },
  hdrIconWrap: {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.22)",
  },
  hdrHint: {
    color: "rgba(255,255,255,0.72)", fontSize: 13,
    fontWeight: "600", textAlign: "center",
  },

  /* Card */
  card: {
    borderRadius: 18, padding: 18,
    borderWidth: 1, marginBottom: 12,
  },
  cardHdr:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  badge:     { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  subtitle:  { fontSize: 12, fontWeight: "500", marginBottom: 16, lineHeight: 18 },

  /* Input */
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 4,
    marginBottom: 8, gap: 10,
  },
  inputIcon: { fontSize: 17 },
  input: {
    flex: 1, fontSize: 15, fontWeight: "500",
    paddingVertical: 11,
    ...(Platform.OS === "web" ? { outline: "none" } : {}),
  } as any,
  clearBtn: { padding: 4 },

  charRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  charHint:  { fontSize: 11, fontWeight: "500", flex: 1, marginRight: 8 },
  charCount: { fontSize: 10, fontWeight: "700" },

  /* Save button */
  saveBtn: {
    paddingVertical: 15, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
  },
  saveTx: { color: "white", fontWeight: "800", fontSize: 15, letterSpacing: 0.2 },

  /* Tips */
  tipsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 } as any,
  tipChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  tipTx: { fontSize: 12, fontWeight: "600" },
});
