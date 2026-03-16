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
import { useWindowDimensions } from "react-native";
import { AuthContext } from "../src/context/AuthContext";
import { TaskContext } from "../src/context/TaskContext";
import { loadTheme } from "../src/services/uiPreferences";
import { sendPasswordResetEmail, signOut } from "firebase/auth";
import { auth, db } from "../src/services/firebase";
import { doc, onSnapshot } from "firebase/firestore";

/* ════ WEB CSS — same as dashboard ════ */
if (Platform.OS === "web" && typeof document !== "undefined") {
  const id = "sk-profile-css";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@700;800;900&display=swap');
      @keyframes sk-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
      @keyframes sk-pulse{0%,100%{opacity:1}50%{opacity:.3}}
      @keyframes sk-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
      @keyframes sk-glow{0%,100%{box-shadow:0 0 8px rgba(99,102,241,.3)}50%{box-shadow:0 0 24px rgba(99,102,241,.8)}}
      @keyframes sk-particle{0%{transform:translateY(0) scale(1);opacity:.8}100%{transform:translateY(-70px) scale(0);opacity:0}}
      @keyframes sk-ring-pulse{0%,100%{box-shadow:0 0 0 3px rgba(255,255,255,0.3),0 8px 32px rgba(0,0,0,0.3)}50%{box-shadow:0 0 0 6px rgba(255,255,255,0.18),0 8px 40px rgba(99,102,241,0.5)}}
      .sk-breathe{animation:sk-breathe 3s ease-in-out infinite}
      .sk-float{animation:sk-float 4s ease-in-out infinite}
      .sk-glow{animation:sk-glow 3s ease-in-out infinite}
      .sk-ring-pulse{animation:sk-ring-pulse 2s ease-in-out infinite}
      .sk-hov{transition:transform .18s,box-shadow .18s}
      .sk-hov:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(99,102,241,.14)!important}
      .sk-btn-hov{transition:transform .15s,opacity .15s,box-shadow .15s}
      .sk-btn-hov:hover{transform:translateY(-1px);opacity:.93}
      *{box-sizing:border-box;}
      ::-webkit-scrollbar{width:4px}
      ::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.3);border-radius:99px}
    `;
    document.head.appendChild(s);
  }
}

/* ─── Constants — same as dashboard ─── */
const SIDEBAR_W = 260;
const ACCENT    = "#6366f1";
const HDR_FROM  = "#1e3a8a";
const HDR_TO    = "#6d28d9";

/* ════ SHIMMER BAR ════ */
function ShimmerBar({ pct, color, h = 8 }: { pct: number; color: string; h?: number }) {
  const x = useRef(new Animated.Value(-1)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(x, { toValue: 2, duration: 1800, useNativeDriver: true })).start();
  }, []);
  if (Platform.OS !== "web") {
    return (
      <View style={{ height: h, borderRadius: 99, backgroundColor: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <View style={{ height: "100%", width: `${pct}%` as any, backgroundColor: color, borderRadius: 99 }} />
      </View>
    );
  }
  return (
    <View style={{ height: h, borderRadius: 99, overflow: "hidden",
      backgroundColor: "rgba(0,0,0,0.07)" } as any}>
      <View style={{ height: "100%", width: `${pct}%`, borderRadius: 99, position: "relative", overflow: "hidden",
        background: `linear-gradient(90deg,${color},${color}bb)`,
        boxShadow: `0 0 10px ${color}55`,
      } as any}>
        <Animated.View style={{
          position: "absolute", top: 0, bottom: 0, width: "45%",
          background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)",
          transform: [{ translateX: x.interpolate({ inputRange: [-1, 2], outputRange: ["-100%", "280%"] }) }],
        } as any} />
      </View>
    </View>
  );
}

/* ════ PARTICLES ════ */
function Particles() {
  const [pts, setPts] = useState<{id:number;x:number}[]>([]);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const id = setInterval(() => {
      setPts(p => [...p.slice(-12), { id: Date.now(), x: Math.random() * 90 + 5 }]);
    }, 500);
    return () => clearInterval(id);
  }, []);
  if (Platform.OS !== "web") return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: "hidden", borderRadius: "inherit" } as any]}>
      {pts.map(p => (
        <View key={p.id} style={{
          position: "absolute", bottom: 0, left: `${p.x}%` as any,
          width: 4, height: 4, borderRadius: 2,
          backgroundColor: "rgba(255,255,255,0.5)",
          animation: "sk-particle 1.5s ease-out forwards",
        } as any} />
      ))}
    </View>
  );
}

/* ════ SIDEBAR — same as dashboard ════ */
function Sidebar({ dark, router, overallPct, completedTasks, totalTasks }: any) {
  const bg     = dark ? "#0a0f20" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const txtPri = dark ? "#eef2ff" : "#0f172a";
  const txtMut = dark ? "rgba(238,242,255,0.45)" : "rgba(15,23,42,0.45)";
  const NAV = [
    { icon: "🏠", label: "Dashboard", route: "/dashboard", active: false },
    { icon: "📊", label: "Analytics",  route: "/analytics", active: false },
    { icon: "🎯", label: "Goals",      route: "/add-goal",  active: false },
    { icon: "🔔", label: "Reminders",  route: null,         active: false, badge: 3 },
    { icon: "⚙️", label: "Settings",   route: null,         active: false },
  ];
  return (
    <View style={[sbSt.wrap, { backgroundColor: bg, borderRightColor: border }]}>
      <View style={sbSt.logoRow}>
        <View style={[sbSt.logoIcon, Platform.OS === "web" ? { animation: "sk-glow 3s ease-in-out infinite" } as any : {}]}>
          <Text style={{ fontSize: 18 }}>⚡</Text>
        </View>
        <View>
          <Text style={[sbSt.logoName, { color: txtPri }]}>SkillPath</Text>
          <Text style={[sbSt.logoSub, { color: txtMut }]}>Learning Companion</Text>
        </View>
      </View>
      <Text style={[sbSt.navLabel, { color: txtMut }]}>NAVIGATION</Text>
      {NAV.map((n, i) => (
        <Pressable key={i} onPress={() => n.route && router.push(n.route)}
          style={({ pressed }) => [sbSt.navItem,
            n.active && { backgroundColor: dark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)" },
            pressed && { opacity: 0.75 }]}>
          <Text style={{ fontSize: 16 }}>{n.icon}</Text>
          <Text style={[sbSt.navTx, { color: n.active ? ACCENT : txtPri, fontWeight: n.active ? "700" : "500" }]}>{n.label}</Text>
          {n.active && <View style={sbSt.activeBar} />}
          {!!n.badge && <View style={sbSt.badge}><Text style={sbSt.badgeTx}>{n.badge}</Text></View>}
        </Pressable>
      ))}
      <View style={{ flex: 1 }} />
      {/* Progress card */}
      <View style={[sbSt.progCard, { backgroundColor: dark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.06)", borderColor: border }]}>
        <Text style={[sbSt.progLabel, { color: ACCENT }]}>OVERALL PROGRESS</Text>
        <View style={sbSt.progRingRow}>
          <View style={[sbSt.progRing,
            Platform.OS === "web"
              ? { background: `conic-gradient(#6366f1 ${overallPct * 3.6}deg, ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"} 0deg)` } as any
              : { borderWidth: 5, borderColor: ACCENT }]}>
            <View style={[sbSt.progRingIn, { backgroundColor: dark ? "#0a0f20" : "#f5f7ff" }]}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: ACCENT }}>{overallPct}%</Text>
            </View>
          </View>
          <View>
            <Text style={[sbSt.progDone, { color: txtPri }]}>
              {completedTasks}<Text style={{ fontSize: 13, fontWeight: "500", color: txtMut }}>/{totalTasks}</Text>
            </Text>
            <Text style={{ fontSize: 11, fontWeight: "500", color: txtMut }}>tasks done</Text>
          </View>
        </View>
        <ShimmerBar pct={overallPct} color={ACCENT} h={5} />
      </View>
      {/* User row — active on profile */}
      <Pressable onPress={() => router.push("/profile")}
        style={[sbSt.userRow, { backgroundColor: dark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.06)", borderColor: ACCENT + "33" }]}>
        <View style={[sbSt.userAvatar,
          Platform.OS === "web" ? { background: "linear-gradient(135deg,#f97316,#ef4444)" } as any : { backgroundColor: "#f97316" }]}>
          <Text style={{ color: "white", fontWeight: "800", fontSize: 15 }}>R</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: txtPri }}>Richard</Text>
          <Text style={{ fontSize: 11, fontWeight: "500", color: ACCENT }}>View Profile →</Text>
        </View>
        <View style={[sbSt.onlineDot, { backgroundColor: "#34d399" },
          Platform.OS === "web" ? { animation: "sk-pulse 2s infinite" } as any : {}]} />
      </Pressable>
    </View>
  );
}

const sbSt = StyleSheet.create({
  wrap:       { width: SIDEBAR_W, height: "100%" as any, paddingVertical: 24, paddingHorizontal: 16, borderRightWidth: 1, flexShrink: 0 },
  logoRow:    { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 36, paddingHorizontal: 8 },
  logoIcon:   { width: 38, height: 38, borderRadius: 12, backgroundColor: ACCENT, alignItems: "center", justifyContent: "center",
    ...(Platform.OS === "web" ? { background: "linear-gradient(135deg,#6366f1,#a78bfa)" } as any : {}),
  },
  logoName:   { fontSize: 16, fontWeight: "900", letterSpacing: -0.5, ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}) },
  logoSub:    { fontSize: 11, fontWeight: "500" },
  navLabel:   { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10, paddingLeft: 8, textTransform: "uppercase" as const },
  navItem:    { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4, position: "relative",
    ...(Platform.OS === "web" ? { cursor: "pointer", transition: "background .15s" } as any : {}),
  },
  navTx:      { fontSize: 14, flex: 1 },
  activeBar:  { width: 4, height: 20, backgroundColor: ACCENT, borderRadius: 99, ...(Platform.OS === "web" ? { boxShadow: "0 0 8px rgba(99,102,241,0.5)" } as any : {}) },
  badge:      { backgroundColor: "#ef4444", borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  badgeTx:    { color: "white", fontSize: 10, fontWeight: "800" },
  progCard:   { borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1 },
  progLabel:  { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" as const },
  progRingRow:{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  progRing:   { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  progRingIn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  progDone:   { fontSize: 20, fontWeight: "900", ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}) },
  userRow:    { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, borderWidth: 1,
    ...(Platform.OS === "web" ? { cursor: "pointer", transition: "opacity .15s" } as any : {}),
  },
  userAvatar: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  onlineDot:  { width: 8, height: 8, borderRadius: 4 },
});

/* ════ TOP BAR — matches dashboard ════ */
function TopBar({ dark, router, displayName }: any) {
  const bg     = dark ? "#0a0f20" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const txtPri = dark ? "#eef2ff" : "#0f172a";
  const txtSec = dark ? "rgba(238,242,255,0.5)" : "rgba(15,23,42,0.5)";
  const [time, setTime] = useState(() => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
  useEffect(() => {
    const tm = setInterval(() => setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })), 1000);
    return () => clearInterval(tm);
  }, []);
  const initials = displayName.charAt(0).toUpperCase();
  return (
    <View style={[tbSt.wrap, { backgroundColor: bg, borderBottomColor: border }]}>
      <View>
        <Text style={[tbSt.title, { color: txtPri }]}>Profile</Text>
        <Text style={{ fontSize: 12, fontWeight: "500", marginTop: 1, color: txtSec }}>Dashboard  ›  My Profile</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: txtSec }}>{time}</Text>
        <Pressable onPress={() => router.push("/dashboard")}
          style={({ pressed }) => [tbSt.backBtn, {
            backgroundColor: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            borderColor: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            opacity: pressed ? 0.7 : 1,
          }]}>
          <Text style={{ color: txtPri, fontWeight: "600", fontSize: 13 }}>← Back to Dashboard</Text>
        </Pressable>
      </View>
    </View>
  );
}
const tbSt = StyleSheet.create({
  wrap:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 28, height: 70, borderBottomWidth: 1, flexShrink: 0,
    ...(Platform.OS === "web" ? { position: "sticky", top: 0, zIndex: 200 } as any : {}),
  },
  title:   { fontSize: 20, fontWeight: "900", letterSpacing: -0.4, ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}) },
  backBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12, borderWidth: 1, ...(Platform.OS === "web" ? { cursor: "pointer", transition: "opacity .15s" } as any : {}) },
});

/* ════════════════════════════════
   MAIN PROFILE
════════════════════════════════ */
export default function Profile() {
  const router  = useRouter();
  const authCtx = useContext(AuthContext);
  const taskCtx = useContext(TaskContext);

  const [darkMode, setDarkMode] = useState<boolean | null>(null);
  useEffect(() => { loadTheme().then(setDarkMode); }, []);

  /* Live streak from Firestore — same as dashboard */
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    if (!authCtx?.user?.uid) return;
    const userRef = doc(db, "users", authCtx.user.uid);
    const unsub   = onSnapshot(userRef, (snap) => {
      if (snap.exists()) setStreak(snap.data().streak || 0);
    });
    return unsub;
  }, [authCtx?.user?.uid]);

  /* ── Animations — original preserved ── */
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(40)).current;
  const scaleAvatar = useRef(new Animated.Value(0.7)).current;
  const hdrScale    = useRef(new Animated.Value(0.96)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;

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
      <View style={[styles.loadWrap, { backgroundColor: darkMode ? "#080d18" : "#eef1f8" }]}>
        <Text style={{ color: darkMode ? "#fff" : "#0f172a", fontSize: 15 }}>Loading...</Text>
      </View>
    );
  }

  /* ── Handlers — 100% original logic unchanged ── */
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

  /* ── Derived data — original unchanged ── */
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

  /* ── Theme — upgraded to match dashboard ── */
  const dark          = !!darkMode;
  const bg            = dark ? "#080d18" : "#eef1f8";
  const card          = dark ? "#0d1424" : "#FFFFFF";
  const textPrimary   = dark ? "#eef2ff"  : "#0F172A";
  const textSecondary = dark ? "rgba(238,242,255,0.55)" : "#475569";
  const textMuted     = dark ? "rgba(238,242,255,0.28)" : "rgba(15,23,42,0.3)";
  const cardBorder    = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const cardSh = Platform.OS === "web"
    ? { boxShadow: dark ? "0 2px 16px rgba(0,0,0,0.4)" : "0 2px 12px rgba(0,0,0,0.05)" }
    : { elevation: 3 };

  const { width: screenW } = useWindowDimensions();
  const isWide = Platform.OS === "web" && screenW >= 960;

  /* STATS — streak now live */
  const STATS = [
    { icon: "🎯", val: totalGoals,     lbl: "Goals",      color: ACCENT    },
    { icon: "✅", val: completedTasks, lbl: "Done",       color: "#34d399" },
    { icon: "🔥", val: streak,         lbl: "Day Streak", color: "#f97316" },
    { icon: "⭐", val: "842",          lbl: "Score",      color: "#fbbf24" },
  ];

  const mainContent = (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={HDR_FROM} />
      <View style={[styles.wrapper, isWide ? { paddingTop: 20 } : {}]}>

        {/* ════ HERO HEADER — full-bleed on mobile/tablet, matches add-task style ════ */}
        <Animated.View style={[
          styles.header,
          Platform.OS === "web" ? { boxShadow: "0 8px 40px rgba(99,102,241,0.28)" } as any : { elevation: 14 },
          { transform: [{ scale: hdrScale }], opacity: fadeAnim },
        ]}>
          {/* Gradient */}
          {Platform.OS === "web" && (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, {
              borderRadius: isWide ? 24 : 0,
              background: dark
                ? "linear-gradient(135deg,#020617 0%,#0f2060 60%,#1a1060 100%)"
                : "linear-gradient(135deg,#3730a3 0%,#6d28d9 55%,#9333ea 100%)",
            } as any]} />
          )}
          {Platform.OS !== "web" && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: HDR_FROM, borderRadius: isWide ? 24 : 0 }]} />
          )}

          {/* Orbs */}
          <View pointerEvents="none" style={[styles.orb, styles.orb1,
            Platform.OS === "web" ? { animation: "sk-float 5s ease-in-out infinite" } as any : {}]} />
          <View pointerEvents="none" style={[styles.orb, styles.orb2,
            Platform.OS === "web" ? { animation: "sk-float 6s ease-in-out infinite reverse" } as any : {}]} />
          <Particles />

          {/* Back button (mobile only) */}
          {!isWide && (
            <View style={styles.hdrTop}>
              <Pressable onPress={() => router.back()}
                style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
                <Text style={styles.backTx}>← Back</Text>
              </Pressable>
              <Text style={styles.hdrLabel}>Profile</Text>
              <View style={{ width: 68 }} />
            </View>
          )}

          {/* Avatar section */}
          <View style={styles.avatarSection}>
            <Animated.View style={[styles.avatarRing,
              { transform: [{ scale: scaleAvatar }] },
              Platform.OS === "web" ? { animation: "sk-ring-pulse 2s ease-in-out infinite" } as any : {},
            ]}>
              <View style={[styles.avatar,
                Platform.OS === "web" ? { background: "linear-gradient(135deg,#6366f1,#a78bfa)", boxShadow: "0 4px 20px rgba(99,102,241,0.5)" } as any : {}]}>
                <Text style={styles.avatarTx}>{initials}</Text>
              </View>
            </Animated.View>
            <Text style={[styles.hdrName,
              Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}]}>
              {displayName}
            </Text>
            <Text style={styles.hdrEmail}>{email}</Text>
            <View style={styles.roleBadge}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#34d399",
                ...(Platform.OS === "web" ? { animation: "sk-pulse 1.5s infinite" } as any : {}),
              }} />
              <Text style={styles.roleTx}>👨‍💻 Intern Developer</Text>
            </View>
          </View>

          {/* Stat chips — streak now live */}
          <View style={styles.statRow}>
            {STATS.map((s, i) => (
              <Animated.View key={i} style={[styles.chip, {
                opacity: fadeAnim,
                transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(i * 6)) }],
              }]}>
                <Text style={styles.chipIcon}>{s.icon}</Text>
                <Text style={[styles.chipVal,
                  Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}]}>
                  {s.val}
                </Text>
                <Text style={styles.chipLbl}>{s.lbl}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* ════ OVERALL PROGRESS ════ */}
          <Animated.View className={Platform.OS === "web" ? "sk-hov" : undefined}
            style={[styles.card, { backgroundColor: card, borderColor: cardBorder, ...cardSh },
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.cardHdr}>
              <View style={[styles.cardIconWrap, { backgroundColor: ACCENT + "14" }]}>
                <Text style={{ fontSize: 18 }}>📈</Text>
              </View>
              <Text style={[styles.cardTitle, { color: textPrimary }]}>Overall Progress</Text>
            </View>
            <View style={{ height: 1, backgroundColor: cardBorder, marginBottom: 16 }} />
            <View style={styles.progRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                  <Text style={[styles.subTx, { color: textSecondary }]}>
                    {completedTasks} of {totalTasks} tasks done
                  </Text>
                  <Text style={[styles.subTx, { color: ACCENT, fontWeight: "800" as const }]}>
                    {overallPct}%
                  </Text>
                </View>
                <ShimmerBar pct={overallPct} color={ACCENT} h={10} />
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                  <Text style={{ fontSize: 11, color: "#34d399", fontWeight: "700" }}>✅ {completedTasks} done</Text>
                  <Text style={{ fontSize: 11, color: "#f97316", fontWeight: "700" }}>⏳ {totalTasks - completedTasks} pending</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ════ ACCOUNT INFO ════ */}
          <Animated.View className={Platform.OS === "web" ? "sk-hov" : undefined}
            style={[styles.card, { backgroundColor: card, borderColor: cardBorder, ...cardSh },
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.cardHdr}>
              <View style={[styles.cardIconWrap, { backgroundColor: "#34d39914" }]}>
                <Text style={{ fontSize: 18 }}>👤</Text>
              </View>
              <Text style={[styles.cardTitle, { color: textPrimary }]}>Account Info</Text>
            </View>
            <View style={{ height: 1, backgroundColor: cardBorder, marginBottom: 4 }} />

            {[
              { icon: "👤", lbl: "Name",   val: displayName, color: ACCENT    },
              { icon: "✉️", lbl: "Email",  val: email,       color: "#06b6d4" },
              { icon: "🏷️", lbl: "Role",   val: "Intern Developer", color: "#a78bfa" },
              { icon: "📅", lbl: "Member", val: "Since 2025", color: "#34d399" },
            ].map((row, i) => (
              <View key={i} style={[styles.infoRow, { borderColor: cardBorder },
                i === 3 && { borderBottomWidth: 0 }]}>
                <View style={[styles.infoIconWrap, { backgroundColor: row.color + "14" }]}>
                  <Text style={{ fontSize: 16 }}>{row.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoLbl, { color: textMuted }]}>{row.lbl}</Text>
                  <Text style={[styles.infoVal, { color: textPrimary }]}>{row.val}</Text>
                </View>
                <Text style={{ fontSize: 13, color: textMuted }}>›</Text>
              </View>
            ))}
          </Animated.View>

          {/* ════ STREAK CARD — new, live from Firestore ════ */}
          <Animated.View className={Platform.OS === "web" ? "sk-hov" : undefined}
            style={[styles.card, {
              backgroundColor: dark ? "rgba(249,115,22,0.08)" : "#fff7ed",
              borderColor: dark ? "rgba(249,115,22,0.2)" : "rgba(249,115,22,0.15)",
              borderLeftColor: "#f97316", borderLeftWidth: 4,
              ...cardSh,
            },
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.cardHdr}>
              <View style={[styles.cardIconWrap, { backgroundColor: "#f9731614" }]}>
                <Text style={{ fontSize: 18 }}>🔥</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: textPrimary, marginBottom: 0 }]}>Daily Streak</Text>
                <Text style={{ fontSize: 12, fontWeight: "500", color: textSecondary }}>Keep learning every day</Text>
              </View>
              <Text style={{ fontSize: 28, fontWeight: "900", color: "#f97316",
                ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
              }}>{streak}</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#f97316", marginLeft: 4 }}>days</Text>
            </View>
            <View style={{ height: 1, backgroundColor: "rgba(249,115,22,0.15)", marginBottom: 14 }} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: "500", color: textSecondary }}>Current streak</Text>
              <Text style={{ fontSize: 12, fontWeight: "800", color: "#f97316" }}>{streak} days 🔥</Text>
            </View>
            <ShimmerBar pct={Math.min(streak * 10, 100)} color="#f97316" h={8} />
            <Text style={{ fontSize: 11, color: textMuted, marginTop: 8, textAlign: "center" as const }}>
              {streak >= 7 ? "🏆 Amazing! 7+ day streak!" : streak >= 3 ? "💪 Great momentum!" : "🌱 Keep going — every day counts!"}
            </Text>
          </Animated.View>

          {/* ════ ACCOUNT ACTIONS ════ */}
          <Animated.View className={Platform.OS === "web" ? "sk-hov" : undefined}
            style={[styles.card, { backgroundColor: card, borderColor: cardBorder, ...cardSh },
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.cardHdr}>
              <View style={[styles.cardIconWrap, { backgroundColor: "#ef444414" }]}>
                <Text style={{ fontSize: 18 }}>⚙️</Text>
              </View>
              <Text style={[styles.cardTitle, { color: textPrimary }]}>Account Actions</Text>
            </View>
            <View style={{ height: 1, backgroundColor: cardBorder, marginBottom: 14 }} />

            {/* Reset Password */}
            <Pressable
              className={Platform.OS === "web" ? "sk-btn-hov" : undefined}
              onPress={resetPassword}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: ACCENT,
                  ...(Platform.OS === "web"
                    ? { background: "linear-gradient(135deg,#6366f1,#a78bfa)", boxShadow: "0 6px 20px rgba(99,102,241,0.4)" }
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
              className={Platform.OS === "web" ? "sk-btn-hov" : undefined}
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

          {/* ════ VERSION FOOTER ════ */}
          <Animated.View style={{ alignItems: "center", marginTop: 8, opacity: fadeAnim }}>
            <Text style={[styles.versionTx, { color: textMuted }]}>
              SkillCompanion v1.0.0 · Made with ❤️
            </Text>
          </Animated.View>

        </ScrollView>
      </View>
    </View>
  );

  /* ════ RENDER ════ */
  if (isWide) {
    return (
      <View style={[wSt.root, { backgroundColor: bg }]}>
        <Sidebar dark={dark} router={router} overallPct={overallPct}
          completedTasks={completedTasks} totalTasks={totalTasks} />
        <View style={wSt.center}>
          <TopBar dark={dark} router={router} displayName={displayName} />
          {mainContent}
        </View>
      </View>
    );
  }
  return mainContent;
}

const wSt = StyleSheet.create({
  root:   { flex: 1, flexDirection: "row" } as any,
  center: { flex: 1, flexDirection: "column" as const, minWidth: 0 },
});

/* ════════════════════════════════
   STYLES — all original names kept
════════════════════════════════ */
const styles = StyleSheet.create({
  screen:   { flex: 1 },
  loadWrap: { flex: 1, alignItems: "center", justifyContent: "center" },

  wrapper: {
    flex: 1, width: "100%",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 52 : 14,
  },

  /* Hero header — full-bleed on mobile, rounded on wide */
  header: {
    paddingHorizontal: 22,
    paddingTop: Platform.OS === "ios" ? 56 : 18,
    paddingBottom: 24,
    marginBottom: 14, overflow: "hidden", position: "relative",
    backgroundColor: HDR_FROM,
  },
  orb:  { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.07)" } as any,
  orb1: { width: 240, height: 240, top: -80, right: -60 },
  orb2: { width: 130, height: 130, bottom: -40, left: 60 },

  hdrTop:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20, zIndex: 1 },
  backBtn:  { backgroundColor: "rgba(255,255,255,0.14)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.22)" },
  backTx:   { color: "white", fontWeight: "700", fontSize: 13 },
  hdrLabel: { color: "white", fontSize: 17, fontWeight: "900",
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
  },

  avatarSection: { alignItems: "center", marginBottom: 20, zIndex: 1 },
  avatarRing: {
    width: 108, height: 108, borderRadius: 54,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 0 0 3px rgba(255,255,255,0.3), 0 8px 32px rgba(0,0,0,0.3)" }
      : { elevation: 8 }),
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: ACCENT,
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: "rgba(255,255,255,0.5)",
  },
  avatarTx: { color: "white", fontSize: 38, fontWeight: "900",
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
  },
  hdrName:  { color: "white", fontSize: 26, fontWeight: "900", letterSpacing: -0.5, marginBottom: 4 },
  hdrEmail: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "500", marginBottom: 14 },

  roleBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.22)",
  },
  roleTx: { color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: "700" },

  statRow: { flexDirection: "row", gap: 8, zIndex: 1, marginTop: 16 } as any,
  chip: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.11)",
    borderRadius: 14, paddingVertical: 10, paddingHorizontal: 5,
    alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)",
  },
  chipIcon: { fontSize: 15, marginBottom: 3 },
  chipVal:  { color: "white", fontSize: 15, fontWeight: "900" },
  chipLbl:  { color: "rgba(255,255,255,0.55)", fontSize: 9, fontWeight: "500", marginTop: 1 },

  /* Cards */
  card:        { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 14 },
  cardHdr:     { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  cardIconWrap:{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardTitle:   { fontSize: 16, fontWeight: "800", letterSpacing: -0.3, flex: 1,
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
  },

  /* Progress */
  progRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  subTx:   { fontSize: 12, fontWeight: "500" },

  /* Info rows */
  infoRow:     { flexDirection: "row", alignItems: "center", paddingVertical: 13, borderBottomWidth: 1, gap: 12 },
  infoIconWrap:{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  infoLbl:     { fontSize: 10, fontWeight: "600", marginBottom: 2, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  infoVal:     { fontSize: 14, fontWeight: "700" },

  /* Action buttons */
  actionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 15, marginBottom: 10,
  },
  logoutBtn:      { backgroundColor: "#dc2626" },
  actionBtnInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  actionIcon:     { fontSize: 22 },
  actionTitle:    { color: "white", fontWeight: "800", fontSize: 14, marginBottom: 2 },
  actionSub:      { color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "500" },
  actionArrow:    { color: "rgba(255,255,255,0.7)", fontSize: 18, fontWeight: "700" },

  versionTx: { fontSize: 11, fontWeight: "500" },
});
