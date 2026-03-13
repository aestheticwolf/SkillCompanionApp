import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Animated,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";

import { useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { AuthContext } from "../src/context/AuthContext";
import { TaskContext } from "../src/context/TaskContext";
import { COLORS } from "../src/constants/theme";
import { loadTheme } from "../src/services/uiPreferences";
import { sendPasswordResetEmail, signOut } from "firebase/auth";
import { auth } from "../src/services/firebase";

/* ─── accent colors (same as dashboard) ─── */
const ACCENT = "#6366f1";
const HDR_FROM = "#1e3a8a";
const HDR_TO   = "#6d28d9";

export default function Profile() {
  const router  = useRouter();
  const authCtx = useContext(AuthContext);
  const taskCtx = useContext(TaskContext);

  const [darkMode, setDarkMode] = useState<boolean | null>(null);
  useEffect(() => { loadTheme().then(setDarkMode); }, []);

  /* Animations */
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(40)).current;
  const scaleAvatar = useRef(new Animated.Value(0.7)).current;
  const hdrScale   = useRef(new Animated.Value(0.96)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim,   { toValue: 0, useNativeDriver: true, tension: 65, friction: 10 }),
      Animated.timing(fadeAnim,    { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.spring(hdrScale,    { toValue: 1, useNativeDriver: true, tension: 80, friction: 9 }),
      Animated.spring(scaleAvatar, { toValue: 1, useNativeDriver: true, tension: 70, friction: 8, delay: 120 }),
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.08, duration: 1600, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 1600, useNativeDriver: true }),
    ])).start();
  }, []);

  const user = authCtx?.user;
  if (!user) {
    return (
      <View style={[styles.loadWrap, { backgroundColor: darkMode ? "#020617" : "#F0F4FF" }]}>
        <Text style={{ color: darkMode ? "#fff" : "#0f172a", fontSize: 15 }}>Loading...</Text>
      </View>
    );
  }

  /* ── Handlers (100% original logic) ── */
  const resetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email!);
      Alert.alert("Success", "Reset link sent to " + user.email);
    } catch {
      Alert.alert("Error", "Try again later");
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  /* ── Derived data ── */
  const displayName = user.displayName || user.email || "User";
  const initials    = displayName.charAt(0).toUpperCase();
  const email       = user.email || "";

  const totalGoals     = taskCtx?.goals?.length ?? 0;
  const completedTasks = taskCtx?.goals?.reduce(
    (a: number, g: any) => a + g.tasks.filter((t: any) => t.completed).length, 0
  ) ?? 0;
  const totalTasks = taskCtx?.goals?.reduce(
    (a: number, g: any) => a + g.tasks.length, 0
  ) ?? 0;
  const overallPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  /* ── Theme ── */
  const dark          = !!darkMode;
  const bg            = dark ? "#020617" : "#F0F4FF";
  const card          = dark ? "#0d1424" : "#FFFFFF";
  const textPrimary   = dark ? "#FFFFFF" : "#0F172A";
  const textSecondary = dark ? "#CBD5F5" : "#475569";
  const textMuted     = dark ? "rgba(238,242,255,0.38)" : "rgba(15,23,42,0.38)";
  const cardBorder    = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const cardSh = Platform.OS === "web"
    ? { boxShadow: dark ? "0 4px 24px rgba(0,0,0,0.42)" : "0 4px 20px rgba(99,102,241,0.09)" }
    : { elevation: 4 };

  const STATS = [
    { icon: "🎯", val: totalGoals,     lbl: "Goals",     color: ACCENT     },
    { icon: "✅", val: completedTasks, lbl: "Done",      color: "#34d399"  },
    { icon: "🔥", val: "7",           lbl: "Day Streak", color: "#f97316"  },
    { icon: "⭐", val: "842",         lbl: "Score",     color: "#fbbf24"  },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={HDR_FROM} />

      <View style={styles.wrapper}>

        {/* ════ HEADER CARD ════ */}
        <Animated.View
          style={[
            styles.header,
            Platform.OS === "web"
              ? { boxShadow: "0 16px 48px rgba(0,0,0,0.28)" }
              : { elevation: 14 },
            { transform: [{ scale: hdrScale }], opacity: fadeAnim },
          ]}
        >
          {/* Gradient overlay */}
          {Platform.OS === "web" && (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, {
              borderRadius: 22,
              background: dark
                ? "linear-gradient(135deg,#020617 0%,#0f2060 60%,#1a1060 100%)"
                : `linear-gradient(135deg,${HDR_FROM} 0%,#2563eb 58%,${HDR_TO} 100%)`,
            } as any]} />
          )}
          {Platform.OS !== "web" && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: HDR_FROM, borderRadius: 22 }]} />
          )}

          {/* Decorative orbs */}
          <View pointerEvents="none" style={[styles.orb, styles.orb1]} />
          <View pointerEvents="none" style={[styles.orb, styles.orb2]} />

          {/* Back button */}
          <View style={styles.hdrTop}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.backTx}>← Back</Text>
            </Pressable>
            <Text style={styles.hdrLabel}>Profile</Text>
            <View style={{ width: 68 }} />
          </View>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarTx}>{initials}</Text>
              </View>
            </Animated.View>

            <Text style={styles.hdrName}>{displayName}</Text>
            <Text style={styles.hdrEmail}>{email}</Text>

            {/* Role badge */}
            <View style={styles.roleBadge}>
              <Text style={styles.roleTx}>👨‍💻 Intern Developer</Text>
            </View>
          </View>

          {/* Stat chips */}
          <View style={styles.statRow}>
            {STATS.map((s, i) => (
              <Animated.View
                key={i}
                style={[styles.chip, {
                  opacity: fadeAnim,
                  transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(i * 6)) }],
                }]}
              >
                <Text style={styles.chipIcon}>{s.icon}</Text>
                <Text style={styles.chipVal}>{s.val}</Text>
                <Text style={styles.chipLbl}>{s.lbl}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* ════ OVERALL PROGRESS ════ */}
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: card, borderColor: cardBorder, ...cardSh },
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={[styles.cardTitle, { color: textPrimary }]}>Overall Progress</Text>
            <View style={styles.progRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={[styles.subTx, { color: textSecondary }]}>
                    {completedTasks} of {totalTasks} tasks done
                  </Text>
                  <Text style={[styles.subTx, { color: ACCENT, fontWeight: "800" as const }]}>
                    {overallPct}%
                  </Text>
                </View>
                <View style={{ height: 10, borderRadius: 99, backgroundColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                  <Animated.View style={{
                    height: "100%",
                    width: `${overallPct}%` as any,
                    backgroundColor: ACCENT,
                    borderRadius: 99,
                    ...(Platform.OS === "web"
                      ? { background: `linear-gradient(90deg, ${ACCENT}, #a78bfa)` }
                      : {}),
                  } as any} />
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ════ ACCOUNT INFO ════ */}
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: card, borderColor: cardBorder, ...cardSh },
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={[styles.cardTitle, { color: textPrimary }]}>Account Info</Text>

            {[
              { icon: "👤", lbl: "Name",   val: displayName },
              { icon: "✉️", lbl: "Email",  val: email },
              { icon: "🏷️", lbl: "Role",   val: "Intern Developer" },
              { icon: "📅", lbl: "Member", val: "Since 2025" },
            ].map((row, i) => (
              <View
                key={i}
                style={[styles.infoRow, { borderColor: cardBorder }, i === 3 && { borderBottomWidth: 0 }]}
              >
                <View style={[styles.infoIconWrap, { backgroundColor: ACCENT + "14" }]}>
                  <Text style={{ fontSize: 16 }}>{row.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoLbl, { color: textMuted }]}>{row.lbl}</Text>
                  <Text style={[styles.infoVal, { color: textPrimary }]}>{row.val}</Text>
                </View>
              </View>
            ))}
          </Animated.View>

          {/* ════ ACTIONS ════ */}
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: card, borderColor: cardBorder, ...cardSh },
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={[styles.cardTitle, { color: textPrimary }]}>Account Actions</Text>

            {/* Reset Password */}
            <Pressable
              onPress={resetPassword}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: ACCENT,
                  ...(Platform.OS === "web"
                    ? { boxShadow: "0 6px 20px rgba(99,102,241,0.45)" }
                    : { elevation: 6 }),
                },
                pressed && { opacity: 0.82, transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={styles.actionBtnInner}>
                <Text style={styles.actionIcon}>🔑</Text>
                <View>
                  <Text style={styles.actionTitle}>Reset Password</Text>
                  <Text style={styles.actionSub}>Send a reset link to {email}</Text>
                </View>
              </View>
              <Text style={styles.actionArrow}>→</Text>
            </Pressable>

            {/* Logout */}
            <Pressable
              onPress={logout}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.logoutBtn,
                {
                  ...(Platform.OS === "web"
                    ? { boxShadow: "0 6px 20px rgba(239,68,68,0.38)" }
                    : { elevation: 6 }),
                },
                pressed && { opacity: 0.82, transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={styles.actionBtnInner}>
                <Text style={styles.actionIcon}>🚪</Text>
                <View>
                  <Text style={styles.actionTitle}>Logout</Text>
                  <Text style={styles.actionSub}>Sign out of your account</Text>
                </View>
              </View>
              <Text style={styles.actionArrow}>→</Text>
            </Pressable>
          </Animated.View>

          {/* ════ APP VERSION FOOTER ════ */}
          <Animated.View style={{ alignItems: "center", marginTop: 8, opacity: fadeAnim }}>
            <Text style={[styles.versionTx, { color: textMuted }]}>
              SkillCompanion v1.0.0 · Made with ❤️
            </Text>
          </Animated.View>

        </ScrollView>
      </View>
    </View>
  );
}

/* ════════════════════════════════
   STYLES
════════════════════════════════ */
const styles = StyleSheet.create({
  screen:   { flex: 1 },
  loadWrap: { flex: 1, alignItems: "center", justifyContent: "center" },

  wrapper: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 52 : 14,
  },

  /* Header */
  header: {
    borderRadius: 22, paddingHorizontal: 18,
    paddingTop: 14, paddingBottom: 20,
    marginBottom: 14, overflow: "hidden",
    position: "relative",
    backgroundColor: HDR_FROM,
  },
  orb:  { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)" } as any,
  orb1: { width: 200, height: 200, top: -70, right: -50 },
  orb2: { width: 110, height: 110, bottom: -40, left: 60 },

  hdrTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20, zIndex: 1 },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 13, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  backTx:   { color: "white", fontWeight: "700", fontSize: 13 },
  hdrLabel: { color: "white", fontSize: 17, fontWeight: "800" },

  avatarSection: { alignItems: "center", marginBottom: 20, zIndex: 1 },
  avatarRing: {
    width: 104, height: 104, borderRadius: 52,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 0 0 3px rgba(255,255,255,0.3), 0 8px 32px rgba(0,0,0,0.3)" }
      : { elevation: 8 }),
  },
  avatar: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: ACCENT,
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: "rgba(255,255,255,0.5)",
  },
  avatarTx:  { color: "white", fontSize: 38, fontWeight: "900" },
  hdrName:   { color: "white", fontSize: 24, fontWeight: "900", letterSpacing: -0.4, marginBottom: 4 },
  hdrEmail:  { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "500", marginBottom: 12 },

  roleBadge: {
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.22)",
  },
  roleTx: { color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: "700" },

  statRow: { flexDirection: "row", gap: 7, zIndex: 1 },
  chip: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.11)",
    borderRadius: 13, paddingVertical: 10, paddingHorizontal: 5,
    alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.16)",
  },
  chipIcon: { fontSize: 15, marginBottom: 3 },
  chipVal:  { color: "white", fontSize: 15, fontWeight: "900" },
  chipLbl:  { color: "rgba(255,255,255,0.55)", fontSize: 9, fontWeight: "500", marginTop: 1 },

  /* Generic card */
  card: {
    borderRadius: 18, padding: 18, borderWidth: 1, marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3, marginBottom: 14 },

  /* Progress */
  progRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  subTx:   { fontSize: 12, fontWeight: "500" },

  /* Info rows */
  infoRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, borderBottomWidth: 1, gap: 12,
  },
  infoIconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  infoLbl: { fontSize: 10, fontWeight: "600", marginBottom: 2, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  infoVal: { fontSize: 14, fontWeight: "700" },

  /* Action buttons */
  actionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 15, marginBottom: 10,
  },
  logoutBtn: { backgroundColor: "#dc2626" },
  actionBtnInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  actionIcon:  { fontSize: 22 },
  actionTitle: { color: "white", fontWeight: "800", fontSize: 14, marginBottom: 2 },
  actionSub:   { color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "500" },
  actionArrow: { color: "rgba(255,255,255,0.7)", fontSize: 18, fontWeight: "700" },

  versionTx: { fontSize: 11, fontWeight: "500" },
});
