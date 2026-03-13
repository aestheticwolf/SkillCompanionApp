import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Animated,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from "react-native";

import { useState, useContext, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { TaskContext } from "../src/context/TaskContext";
import { COLORS } from "../src/constants/theme";
import { loadTheme } from "../src/services/uiPreferences";
import { showSuccess, showError } from "../src/services/toast";

const HDR_FROM = "#1e3a8a";
const ACCENT   = "#6366f1";

/* Goal idea suggestions */
const SUGGESTIONS = [
  { icon: "☕", label: "Learn Java"     },
  { icon: "⚛️", label: "React Native"  },
  { icon: "🔥", label: "Firebase"      },
  { icon: "🎨", label: "UI Design"     },
  { icon: "🦋", label: "Flutter"       },
  { icon: "🚀", label: "Node.js"       },
];

export default function AddGoal() {
  const router = useRouter();
  const ctx = useContext(TaskContext);
  if (!ctx) return null;

  const { addGoal } = ctx;

  const [goal,     setGoal]     = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [focused,  setFocused]  = useState(false);

  /* ── Animations ── */
  const fadeAnim      = useRef(new Animated.Value(0)).current;
  const slideAnim     = useRef(new Animated.Value(36)).current;
  const scaleAnim     = useRef(new Animated.Value(0.96)).current;
  const hdrScale      = useRef(new Animated.Value(0.96)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  const btnScale      = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadTheme().then(setDarkMode);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 10 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6 }),
      Animated.spring(hdrScale,  { toValue: 1, useNativeDriver: true, tension: 80, friction: 9 }),
    ]).start();
  }, []);

  const onFocus = () => {
    setFocused(true);
    Animated.timing(inputFocusAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(inputFocusAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  /* ── Handler (original logic) ── */
  const handleSave = async () => {
    if (!goal.trim()) {
      showError("Goal name cannot be empty");
      return;
    }
    try {
      await addGoal(goal.trim());
      showSuccess("Goal added");
      router.back();
    } catch {
      showError("Something went wrong");
    }
  };

  const onPressBtn = () => {
    if (!goal.trim()) return;
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, tension: 200, friction: 5 }),
      Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 5 }),
    ]).start(handleSave);
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

  const cardSh = Platform.OS === "web"
    ? { boxShadow: dark ? "0 4px 24px rgba(0,0,0,0.42)" : "0 4px 20px rgba(99,102,241,0.10)" }
    : { elevation: 4 };

  const hasText   = goal.trim().length > 0;
  const charCount = goal.length;
  const charMax   = 60;

  const inputBorderColor = inputFocusAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [
      dark ? "rgba(255,255,255,0.12)" : "rgba(99,102,241,0.2)",
      ACCENT,
    ],
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={HDR_FROM} />

      <ScrollView
        style={{ flex: 1, backgroundColor: bg }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
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
                <Text style={styles.hdrTitle}>Add Goal</Text>
                <Text style={styles.hdrSub}>Define your next achievement</Text>
              </View>
              <View style={{ width: 68 }} />
            </View>

            {/* Icon + hint */}
            <View style={styles.hdrBody}>
              <View style={styles.hdrIconWrap}>
                <Text style={{ fontSize: 32 }}>🎯</Text>
              </View>
              <Text style={styles.hdrHint}>What skill do you want to master?</Text>
            </View>
          </Animated.View>

          {/* ════ FORM CARD ════ */}
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: card, borderColor: cardBorder, ...cardSh },
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.cardHdr}>
              <Text style={[styles.cardTitle, { color: textPrimary }]}>Goal Details</Text>
              <View style={[styles.badge, { backgroundColor: ACCENT + "14" }]}>
                <Text style={{ fontSize: 10, color: ACCENT, fontWeight: "700" }}>New Goal</Text>
              </View>
            </View>

            <Text style={[styles.subtitle, { color: textSecondary }]}>
              Define what you want to achieve next
            </Text>

            {/* Input */}
            <Animated.View
              style={[
                styles.inputWrap,
                {
                  backgroundColor: inputBg,
                  borderColor: inputBorderColor,
                  ...(Platform.OS === "web" && focused
                    ? { boxShadow: `0 0 0 3px ${ACCENT}22` }
                    : {}),
                } as any,
              ]}
            >
              <Text style={[styles.inputIcon, { opacity: focused || hasText ? 1 : 0.4 }]}>🎯</Text>
              <TextInput
                value={goal}
                onChangeText={t => t.length <= charMax && setGoal(t)}
                placeholder="e.g. Learn Java"
                placeholderTextColor={textMuted}
                onFocus={onFocus}
                onBlur={onBlur}
                style={[styles.input, { color: textPrimary }]}
                returnKeyType="done"
                onSubmitEditing={onPressBtn}
              />
              {hasText && (
                <Pressable onPress={() => setGoal("")} style={styles.clearBtn}>
                  <Text style={{ color: textMuted, fontSize: 16 }}>✕</Text>
                </Pressable>
              )}
            </Animated.View>

            {/* Char counter */}
            <View style={styles.charRow}>
              <Text style={[styles.charHint, { color: textMuted }]}>
                {hasText ? `"${goal.trim()}"` : "Start typing your goal above"}
              </Text>
              <Text style={[styles.charCount, { color: charCount > charMax * 0.8 ? "#f97316" : textMuted }]}>
                {charCount}/{charMax}
              </Text>
            </View>

            {/* Save button */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <Pressable
                onPress={onPressBtn}
                disabled={!hasText}
                android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                style={[
                  styles.saveBtn,
                  {
                    backgroundColor: hasText ? ACCENT : dark ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.18)",
                    ...(Platform.OS === "web" && hasText
                      ? { boxShadow: "0 6px 20px rgba(99,102,241,0.45)" }
                      : {}),
                  } as any,
                ]}
              >
                <Text style={[styles.saveTx, { opacity: hasText ? 1 : 0.45 }]}>
                  {hasText ? "✓  Save Goal" : "Enter a goal name"}
                </Text>
              </Pressable>
            </Animated.View>
          </Animated.View>

          {/* ════ SUGGESTIONS CARD ════ */}
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: card, borderColor: cardBorder, ...cardSh },
              {
                opacity: fadeAnim,
                transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(14)) }],
              },
            ]}
          >
            <View style={[styles.cardHdr, { marginBottom: 14 }]}>
              <Text style={[styles.cardTitle, { color: textPrimary }]}>💡 Quick Ideas</Text>
              <Text style={[styles.cardSubtitle, { color: textMuted }]}>Tap to fill</Text>
            </View>

            <View style={styles.suggestGrid}>
              {SUGGESTIONS.map((s, i) => (
                <Pressable
                  key={i}
                  onPress={() => setGoal(s.label)}
                  style={({ pressed }) => [
                    styles.suggestChip,
                    {
                      backgroundColor: goal === s.label
                        ? ACCENT + "18"
                        : dark ? "rgba(255,255,255,0.05)" : "rgba(99,102,241,0.06)",
                      borderColor: goal === s.label ? ACCENT + "55" : cardBorder,
                    },
                    pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>{s.icon}</Text>
                  <Text style={[styles.suggestTx, {
                    color: goal === s.label ? ACCENT : textSecondary,
                    fontWeight: goal === s.label ? "700" : "500",
                  }]}>
                    {s.label}
                  </Text>
                  {goal === s.label && (
                    <Text style={{ color: ACCENT, fontSize: 12, fontWeight: "700" }}>✓</Text>
                  )}
                </Pressable>
              ))}
            </View>
          </Animated.View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ════════════════════════════════
   STYLES
════════════════════════════════ */
const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 52 : 14,
  },

  /* Header */
  header: {
    borderRadius: 20, paddingHorizontal: 18,
    paddingTop: 14, paddingBottom: 20,
    marginBottom: 14, overflow: "hidden", position: "relative",
    backgroundColor: HDR_FROM,
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

  hdrBody:    { alignItems: "center", zIndex: 1 },
  hdrIconWrap:{
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.22)",
  },
  hdrHint: {
    color: "rgba(255,255,255,0.72)", fontSize: 13,
    fontWeight: "600", textAlign: "center",
  },

  /* Cards */
  card: {
    borderRadius: 18, padding: 18,
    borderWidth: 1, marginBottom: 12,
  },
  cardHdr:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  cardTitle:    { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  cardSubtitle: { fontSize: 11, fontWeight: "500" },
  badge:        { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  subtitle:     { fontSize: 12, fontWeight: "500", marginBottom: 16, lineHeight: 18 },

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

  charRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  charHint: { fontSize: 11, fontWeight: "500", flex: 1, marginRight: 8 },
  charCount:{ fontSize: 10, fontWeight: "700" },

  /* Save button */
  saveBtn: {
    paddingVertical: 15, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
  },
  saveTx: { color: "white", fontWeight: "800", fontSize: 15, letterSpacing: 0.2 },

  /* Suggestions */
  suggestGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 } as any,
  suggestChip: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 13, paddingVertical: 9,
    borderRadius: 22, borderWidth: 1,
  },
  suggestTx: { fontSize: 13 },
});
