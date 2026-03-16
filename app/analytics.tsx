import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Platform,
} from "react-native";

import { useRouter } from "expo-router";
import { useContext, useEffect, useRef, useState } from "react";
import { useWindowDimensions } from "react-native";
import { TaskContext } from "../src/context/TaskContext";
import { AuthContext } from "../src/context/AuthContext";
import { loadTheme } from "../src/services/uiPreferences";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../src/services/firebase";

/* ════ WEB CSS — same as dashboard ════ */
if (Platform.OS === "web" && typeof document !== "undefined") {
  const id = "sk-analytics-css";
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
      .sk-breathe{animation:sk-breathe 3s ease-in-out infinite}
      .sk-float{animation:sk-float 4s ease-in-out infinite}
      .sk-glow{animation:sk-glow 3s ease-in-out infinite}
      .sk-hov{transition:transform .18s,box-shadow .18s}
      .sk-hov:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(99,102,241,.14)!important}
      *{box-sizing:border-box;}
      ::-webkit-scrollbar{width:4px}
      ::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.3);border-radius:99px}
    `;
    document.head.appendChild(s);
  }
}

/* ─── Constants — same as dashboard ─── */
const SIDEBAR_W   = 260;
const ACCENT      = "#6366f1";
const GOAL_COLORS = ["#6366f1","#f97316","#06b6d4","#a78bfa","#fbbf24","#34d399","#3b82f6","#ec4899"];
const GOAL_EMOJIS = ["☕","🦋","⚛️","🔥","🎨","🚀","📚","🎯"];

/* ════ SHIMMER BAR — identical to original ════ */
function ShimmerBar({ pct, color, h = 7 }: { pct: number; color: string; h?: number }) {
  const x = useRef(new Animated.Value(-1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(x, { toValue: 2, duration: 1800, useNativeDriver: true })
    ).start();
  }, []);
  if (Platform.OS !== "web") {
    return (
      <View style={{ height: h, borderRadius: 99, backgroundColor: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <View style={{ height: "100%", width: `${pct}%` as any, backgroundColor: color, borderRadius: 99 }} />
      </View>
    );
  }
  return (
    <View style={{ height: h, borderRadius: 99, backgroundColor: "rgba(0,0,0,0.07)", overflow: "hidden" } as any}>
      <View style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: 99, position: "relative", overflow: "hidden" } as any}>
        <Animated.View style={{
          position: "absolute", top: 0, bottom: 0, width: "45%",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
          transform: [{ translateX: x.interpolate({ inputRange: [-1, 2], outputRange: ["-100%", "280%"] }) }],
        } as any} />
      </View>
    </View>
  );
}

/* ════ SVG DONUT CHART — identical to original ════ */
function DonutChart({ completed, total, color }: { completed: number; total: number; color: string }) {
  const pct     = total > 0 ? (completed / total) * 100 : 0;
  const r       = 52;
  const cx      = 68;
  const cy      = 68;
  const circ    = 2 * Math.PI * r;
  const dash    = (pct / 100) * circ;
  const gap     = circ - dash;
  const sweepAnim = useRef(new Animated.Value(0)).current;
  const [animPct, setAnimPct] = useState(0);
  useEffect(() => {
    sweepAnim.addListener(({ value }) => setAnimPct(value));
    Animated.timing(sweepAnim, { toValue: pct, duration: 1200, useNativeDriver: false }).start();
    return () => sweepAnim.removeAllListeners();
  }, [pct]);
  const animDash = (animPct / 100) * circ;
  const animGap  = circ - animDash;
  if (Platform.OS !== "web") {
    return (
      <View style={{ alignItems: "center", justifyContent: "center", width: 136, height: 136 }}>
        <View style={{ width: 136, height: 136, borderRadius: 68, borderWidth: 14, borderColor: "#34d399", alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: 108, height: 108, borderRadius: 54, borderWidth: 14, borderColor: "#f87171", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 22, fontWeight: "900", color: color }}>{Math.round(pct)}%</Text>
            <Text style={{ fontSize: 10, color: "rgba(100,116,139,0.8)", fontWeight: "600" }}>done</Text>
          </View>
        </View>
      </View>
    );
  }
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <svg width="136" height="136" viewBox="0 0 136 136">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="13" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f87171" strokeWidth="13"
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={0}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#34d399" strokeWidth="13"
          strokeDasharray={`${animDash} ${animGap}`} strokeDashoffset={0}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="900" fill={color}>{Math.round(animPct)}%</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fontWeight="600" fill="rgba(100,116,139,0.9)">done</text>
      </svg>
    </View>
  );
}

/* ════ COUNT UP — identical to original ════ */
function CountUp({ to, color, size = 28 }: { to: number; color: string; size?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [val, setVal] = useState(0);
  useEffect(() => {
    anim.addListener(({ value }) => setVal(Math.round(value)));
    Animated.timing(anim, { toValue: to, duration: 900, useNativeDriver: false }).start();
    return () => anim.removeAllListeners();
  }, [to]);
  return (
    <Text style={{ fontSize: size, fontWeight: "900", color, letterSpacing: -0.5,
      ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
    }}>{val}</Text>
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
    { icon: "📊", label: "Analytics",  route: "/analytics", active: true  },
    { icon: "🎯", label: "Goals",      route: "/add-goal",  active: false },
    { icon: "🔔", label: "Reminders",  route: null,         active: false, badge: 3 },
    { icon: "⚙️", label: "Settings",   route: null,         active: false },
  ];
  return (
    <View style={[sbSt.wrap, { backgroundColor: bg, borderRightColor: border }]}>
      <View style={sbSt.logoRow}>
        <View style={[sbSt.logoIcon,
          Platform.OS === "web" ? { animation: "sk-glow 3s ease-in-out infinite" } as any : {}]}>
          <Text style={{ fontSize: 18 }}>⚡</Text>
        </View>
        <View>
          <Text style={[sbSt.logoName, { color: txtPri }]}>SkillPath</Text>
          <Text style={[sbSt.logoSub,  { color: txtMut }]}>Learning Companion</Text>
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
              : { borderWidth: 5, borderColor: ACCENT }
          ]}>
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
      {/* User row */}
      <View style={[sbSt.userRow, { backgroundColor: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", borderColor: border }]}>
        <View style={[sbSt.userAvatar,
          Platform.OS === "web" ? { background: "linear-gradient(135deg,#f97316,#ef4444)" } as any : { backgroundColor: "#f97316" }]}>
          <Text style={{ color: "white", fontWeight: "800", fontSize: 15 }}>R</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: txtPri }}>Richard</Text>
          <Text style={{ fontSize: 11, fontWeight: "500", color: txtMut }}>Intern Developer</Text>
        </View>
        <View style={[sbSt.onlineDot, { backgroundColor: "#34d399" },
          Platform.OS === "web" ? { animation: "sk-pulse 2s infinite" } as any : {}]} />
      </View>
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
  userRow:    { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, borderWidth: 1 },
  userAvatar: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  onlineDot:  { width: 8, height: 8, borderRadius: 4 },
});

/* ════ TOP BAR — matches dashboard ════ */
function TopBar({ dark, router }: any) {
  const bg     = dark ? "#0a0f20" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const txtPri = dark ? "#eef2ff" : "#0f172a";
  const txtSec = dark ? "rgba(238,242,255,0.5)" : "rgba(15,23,42,0.5)";
  const [time, setTime] = useState(() => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
  useEffect(() => {
    const tm = setInterval(() => setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })), 1000);
    return () => clearInterval(tm);
  }, []);
  return (
    <View style={[tbSt.wrap, { backgroundColor: bg, borderBottomColor: border }]}>
      <View>
        <Text style={[tbSt.title, { color: txtPri }]}>Analytics</Text>
        <Text style={{ fontSize: 12, fontWeight: "500", marginTop: 1, color: txtSec }}>Dashboard  ›  Learning Overview</Text>
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
   MAIN ANALYTICS
════════════════════════════════ */
export default function Analytics() {
  const router  = useRouter();
  const taskCtx = useContext(TaskContext);
  const authCtx = useContext(AuthContext);

  if (!taskCtx || !authCtx || !authCtx.user) return null;

  const { goals, getOverallProgress } = taskCtx;

  const [darkMode, setDarkMode] = useState<boolean | null>(null);
  useEffect(() => { loadTheme().then(setDarkMode); }, []);

  /* ── Live streak from Firestore — same as dashboard ── */
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    const userRef = doc(db, "users", authCtx.user!.uid);
    const unsub   = onSnapshot(userRef, (snap) => {
      if (snap.exists()) setStreak(snap.data().streak || 0);
    });
    return unsub;
  }, []);

  /* ── Animations — ORIGINAL unchanged ── */
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(36)).current;
  const hdrScale  = useRef(new Animated.Value(0.96)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 10 }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.spring(hdrScale,  { toValue: 1, useNativeDriver: true, tension: 80, friction: 9 }),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.5, duration: 750, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,   duration: 750, useNativeDriver: true }),
    ])).start();
  }, []);

  /* ── Computed stats — ORIGINAL unchanged ── */
  const totalGoals     = goals.length;
  const totalTasks     = goals.reduce((a: number, g: any) => a + g.tasks.length, 0);
  const completedTasks = goals.reduce((a: number, g: any) => a + g.tasks.filter((t: any) => t.completed).length, 0);
  const pendingTasks   = totalTasks - completedTasks;
  const overallPct     = getOverallProgress();

  /* getInsight — ORIGINAL unchanged */
  const getInsight = () => {
    if (overallPct === 100) return "Perfect score! 🏆 You've completed everything. Start a new challenge!";
    if (overallPct >= 75)  return "Excellent progress! 🚀 You're almost there — finish strong!";
    if (overallPct >= 50)  return "Nice momentum. 🔥 Keep pushing forward, you're halfway done!";
    if (overallPct >= 25)  return "Good start! 💪 Consistency is your superpower — keep going.";
    return "Let's get moving! 🌱 Every task completed is a step forward.";
  };

  /* ── Theme — upgraded to match dashboard (same tokens) ── */
  const dark          = !!darkMode;
  const bg            = dark ? "#080d18" : "#eef1f8";
  const card          = dark ? "#0d1424" : "#FFFFFF";
  const textPrimary   = dark ? "#eef2ff"  : "#0F172A";
  const textSecondary = dark ? "rgba(238,242,255,0.55)" : "#475569";
  const textMuted     = dark ? "rgba(238,242,255,0.28)" : "rgba(15,23,42,0.3)";
  const cardBorder    = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const hdrFrom       = dark ? "#0c1540" : "#1e3a8a";

  const cardSh = Platform.OS === "web"
    ? { boxShadow: dark ? "0 2px 16px rgba(0,0,0,0.4)" : "0 2px 12px rgba(0,0,0,0.05)" }
    : { elevation: 3 };

  /* useWindowDimensions replaces Dimensions.get (hook-safe) */
  const { width: screenW } = useWindowDimensions();
  const isWide = Platform.OS === "web" && screenW >= 960;
  const isWidish = Platform.OS === "web" && screenW >= 700;

  const STATS = [
    { icon: "🎯", val: totalGoals,     lbl: "Goals",      color: "#6366f1", bg: "rgba(99,102,241,0.1)",  trend: "All on track"  },
    { icon: "📋", val: totalTasks,     lbl: "Tasks",      color: "#06b6d4", bg: "rgba(6,182,212,0.1)",   trend: "Across goals"  },
    { icon: "✅", val: completedTasks, lbl: "Completed",  color: "#34d399", bg: "rgba(52,211,153,0.1)",  trend: "+2 today"      },
    { icon: "⏳", val: pendingTasks,   lbl: "Pending",    color: "#f97316", bg: "rgba(249,115,22,0.1)",  trend: "Keep going!"   },
  ];

  /* ════ THE ORIGINAL RENDER TREE — unchanged structure ════ */
  const mainContent = (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      <View style={[styles.wrapper, isWide ? { paddingTop: 20 } : {}]}>

        {/* ════ HEADER — shown on mobile/tablet only; wide uses TopBar ════ */}
        {!isWide && (
          <Animated.View
            style={[
              styles.header,
              { backgroundColor: hdrFrom },
              Platform.OS === "web"
                ? { boxShadow: "0 14px 44px rgba(0,0,0,0.28)" }
                : { elevation: 12 },
              { transform: [{ scale: hdrScale }], opacity: fadeAnim },
            ]}
          >
            {Platform.OS === "web" && (
              <View pointerEvents="none" style={[StyleSheet.absoluteFill, {
                borderRadius: 20,
                background: "linear-gradient(135deg,#3730a3 0%,#6d28d9 55%,#9333ea 100%)",
              } as any]} />
            )}
            {Platform.OS !== "web" && (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: "#1e3a8a", borderRadius: 20 }]} />
            )}
            <View pointerEvents="none" style={[styles.orb, styles.orb1,
              Platform.OS === "web" ? { animation: "sk-float 5s ease-in-out infinite" } as any : {}]} />
            <View pointerEvents="none" style={[styles.orb, styles.orb2,
              Platform.OS === "web" ? { animation: "sk-float 6s ease-in-out infinite reverse" } as any : {}]} />

            {/* Nav row — ORIGINAL */}
            <View style={styles.hdrTop}>
              <Pressable onPress={() => router.back()}
                style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
                <Text style={styles.backTx}>← Back</Text>
              </Pressable>
              <View>
                <Text style={styles.hdrTitle}>Analytics</Text>
                <Text style={styles.hdrSub}>Your learning overview</Text>
              </View>
              <View style={{ width: 68 }} />
            </View>

            {/* Summary row — ORIGINAL */}
            <View style={styles.hdrSummary}>
              <View style={styles.hdrStat}>
                <Text style={styles.hdrStatVal}>{overallPct}%</Text>
                <Text style={styles.hdrStatLbl}>Complete</Text>
              </View>
              <View style={styles.hdrDivider} />
              <View style={styles.hdrStat}>
                <Text style={styles.hdrStatVal}>{completedTasks}</Text>
                <Text style={styles.hdrStatLbl}>Tasks Done</Text>
              </View>
              <View style={styles.hdrDivider} />
              <View style={styles.hdrStat}>
                <Text style={styles.hdrStatVal}>{totalGoals}</Text>
                <Text style={styles.hdrStatLbl}>Active Goals</Text>
              </View>
              <View style={styles.hdrDivider} />
              <View style={styles.hdrStat}>
                <Text style={styles.hdrStatVal}>{pendingTasks}</Text>
                <Text style={styles.hdrStatLbl}>Remaining</Text>
              </View>
            </View>

            {/* Progress bar — ORIGINAL */}
            <View style={{ marginTop: 14 }}>
              <View style={styles.hdrProgRow}>
                <Text style={styles.hdrProgLbl}>Overall Progress</Text>
                <Text style={styles.hdrProgPct}>{overallPct}%</Text>
              </View>
              <ShimmerBar pct={overallPct} color="rgba(255,255,255,0.9)" h={8} />
            </View>
          </Animated.View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* ════ STAT CARDS — 4-in-a-row on wide, 2x2 on narrow ════ */}
          <Animated.View style={[
            isWidish ? styles.statsGridWide : styles.statsGrid,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}>
            {STATS.map((s, i) => (
              <Animated.View key={i}
                className={Platform.OS === "web" ? "sk-hov" : undefined}
                style={[
                  isWidish ? styles.statCardWide : styles.statCard,
                  { backgroundColor: card, borderColor: cardBorder, ...cardSh },
                  { opacity: fadeAnim, transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(i * 7)) }] },
                ]}>
                {Platform.OS === "web" && (
                  <View pointerEvents="none" style={{ position: "absolute", top: -10, right: -10, width: 60, height: 60, borderRadius: 30, backgroundColor: s.color, filter: "blur(18px)", opacity: 0.12 } as any} />
                )}
                <View style={[styles.statIconWrap, { backgroundColor: s.bg },
                  Platform.OS === "web" ? { animation: "sk-breathe 3s ease-in-out infinite" } as any : {}]}>
                  <Text style={{ fontSize: 22 }}>{s.icon}</Text>
                </View>
                <CountUp to={s.val} color={s.color} size={30} />
                <Text style={[styles.statLbl, { color: textSecondary }]}>{s.lbl}</Text>
                <Text style={{ fontSize: 10, color: s.color, fontWeight: "700", marginTop: 2 }}>↑ {s.trend}</Text>
              </Animated.View>
            ))}
          </Animated.View>

          {/* ════ DONUT + INSIGHT ROW — ORIGINAL structure ════ */}
          <View style={isWidish ? styles.midRowWide : styles.midRowNarrow}>

            {/* Task Distribution */}
            <Animated.View
              className={Platform.OS === "web" ? "sk-hov" : undefined}
              style={[
                styles.card,
                isWidish ? styles.cardHalf : styles.cardFull,
                { backgroundColor: card, borderColor: cardBorder, ...cardSh },
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}>
              <View style={styles.cardHdr}>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>Task Distribution</Text>
                <View style={[styles.cardBadge, { backgroundColor: "rgba(99,102,241,0.1)" }]}>
                  <Text style={{ fontSize: 10, color: "#6366f1", fontWeight: "700" }}>{totalTasks} total</Text>
                </View>
              </View>
              <View style={styles.donutRow}>
                <DonutChart completed={completedTasks} total={totalTasks} color={dark ? "#fff" : "#0f172a"} />
                <View style={styles.legend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: "#34d399" }]} />
                    <View>
                      <Text style={[styles.legendVal, { color: textPrimary }]}>{completedTasks}</Text>
                      <Text style={[styles.legendLbl, { color: textSecondary }]}>Completed</Text>
                    </View>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: "#f87171" }]} />
                    <View>
                      <Text style={[styles.legendVal, { color: textPrimary }]}>{pendingTasks}</Text>
                      <Text style={[styles.legendLbl, { color: textSecondary }]}>Pending</Text>
                    </View>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: "#6366f1" }]} />
                    <View>
                      <Text style={[styles.legendVal, { color: textPrimary }]}>{totalTasks}</Text>
                      <Text style={[styles.legendLbl, { color: textSecondary }]}>Total</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Insight */}
            <Animated.View
              className={Platform.OS === "web" ? "sk-hov" : undefined}
              style={[
                styles.card,
                isWidish ? styles.cardHalf : styles.cardFull,
                {
                  backgroundColor: dark ? "rgba(99,102,241,0.08)" : "#EFF6FF",
                  borderColor: dark ? "rgba(99,102,241,0.22)" : "rgba(37,99,235,0.12)",
                  borderLeftColor: "#6366f1",
                  borderLeftWidth: 4,
                  ...cardSh,
                },
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}>
              <View style={styles.cardHdr}>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>💡 Insight</Text>
              </View>
              <Text style={[styles.insightTx, { color: textSecondary }]}>{getInsight()}</Text>
              <View style={styles.scoreBars}>
                <View style={styles.scoreRow}>
                  <Text style={[styles.scoreLbl, { color: textSecondary }]}>Tasks Done</Text>
                  <Text style={[styles.scoreVal, { color: "#34d399" }]}>
                    {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                  </Text>
                </View>
                <ShimmerBar pct={totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0} color="#34d399" h={6} />
                <View style={[styles.scoreRow, { marginTop: 14 }]}>
                  <Text style={[styles.scoreLbl, { color: textSecondary }]}>Goals Active</Text>
                  <Text style={[styles.scoreVal, { color: "#6366f1" }]}>{totalGoals}</Text>
                </View>
                <ShimmerBar pct={Math.min(totalGoals * 20, 100)} color="#6366f1" h={6} />
                <View style={[styles.scoreRow, { marginTop: 14 }]}>
                  <Text style={[styles.scoreLbl, { color: textSecondary }]}>Streak</Text>
                  <Text style={[styles.scoreVal, { color: "#f97316" }]}>{streak} day{streak !== 1 ? "s" : ""} 🔥</Text>
                </View>
                <ShimmerBar pct={Math.min(streak * 10, 100)} color="#f97316" h={6} />
              </View>
            </Animated.View>
          </View>

          {/* ════ PER-GOAL BREAKDOWN — ORIGINAL ════ */}
          {goals.length > 0 && (
            <Animated.View
              className={Platform.OS === "web" ? "sk-hov" : undefined}
              style={[
                styles.card, styles.cardFull,
                { backgroundColor: card, borderColor: cardBorder, ...cardSh },
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}>
              <View style={[styles.cardHdr, { marginBottom: 16 }]}>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>Goal Breakdown</Text>
                <View style={[styles.cardBadge, { backgroundColor: "rgba(52,211,153,0.1)" }]}>
                  <Text style={{ fontSize: 10, color: "#34d399", fontWeight: "700" }}>{totalGoals} active</Text>
                </View>
              </View>
              {goals.map((g: any, i: number) => {
                const accent = GOAL_COLORS[i % GOAL_COLORS.length];
                const done   = g.tasks.filter((t: any) => t.completed).length;
                const total  = g.tasks.length;
                const pct    = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <Animated.View key={g.id} style={[
                    styles.goalRow, { borderColor: cardBorder },
                    { opacity: fadeAnim, transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(i * 6)) }] },
                  ]}>
                    <View style={[styles.goalEmoji, { backgroundColor: accent + "1c" }]}>
                      <Text style={{ fontSize: 18 }}>{GOAL_EMOJIS[i % GOAL_EMOJIS.length]}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={styles.goalRowTop}>
                        <Text style={[styles.goalName, { color: textPrimary }]} numberOfLines={1}>{g.name}</Text>
                        <Text style={[styles.goalPct, { color: accent }]}>{pct}%</Text>
                      </View>
                      <ShimmerBar pct={pct} color={accent} h={6} />
                      <Text style={[styles.goalMeta, { color: textMuted }]}>{done}/{total} tasks completed</Text>
                    </View>
                  </Animated.View>
                );
              })}
            </Animated.View>
          )}

          {/* Empty state — ORIGINAL */}
          {goals.length === 0 && (
            <Animated.View style={[
              styles.card, styles.cardFull,
              { backgroundColor: card, borderColor: cardBorder, alignItems: "center", ...cardSh },
              { opacity: fadeAnim },
            ]}>
              <Text style={{ fontSize: 42, marginBottom: 12 }}>📊</Text>
              <Text style={[styles.cardTitle, { color: textPrimary, marginBottom: 6 }]}>No data yet</Text>
              <Text style={[styles.insightTx, { color: textSecondary, textAlign: "center" }]}>
                Create goals and complete tasks to see your analytics here.
              </Text>
            </Animated.View>
          )}

        </ScrollView>
      </View>
    </View>
  );

  /* ════ RENDER — wrap with sidebar on wide ════ */
  if (isWide) {
    return (
      <View style={[wSt.root, { backgroundColor: bg }]}>
        <Sidebar dark={dark} router={router} overallPct={overallPct}
          completedTasks={completedTasks} totalTasks={totalTasks} />
        <View style={wSt.center}>
          <TopBar dark={dark} router={router} />
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
   STYLES — all original names kept exactly
════════════════════════════════ */
const styles = StyleSheet.create({
  screen:  { flex: 1 },
  wrapper: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 52 : 14,
  },

  /* Header */
  header: {
    borderRadius: 24, paddingHorizontal: 22,
    paddingTop: Platform.OS === "ios" ? 56 : 18, paddingBottom: 22,
    marginBottom: 14, overflow: "hidden", position: "relative",
  },
  orb:  { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.07)" } as any,
  orb1: { width: 220, height: 220, top: -70, right: -50 },
  orb2: { width: 120, height: 120, bottom: -40, right: 120 },

  hdrTop:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18, zIndex: 1 },
  backBtn:    { backgroundColor: "rgba(255,255,255,0.14)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.22)" },
  backTx:     { color: "white", fontWeight: "700", fontSize: 13 },
  hdrTitle:   { color: "white", fontSize: 20, fontWeight: "900", textAlign: "center", letterSpacing: -0.4,
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
  },
  hdrSub:     { color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "500", textAlign: "center" },

  hdrSummary: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", zIndex: 1 },
  hdrStat:    { alignItems: "center" },
  hdrStatVal: { color: "white", fontSize: 22, fontWeight: "900",
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
  },
  hdrStatLbl: { color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: "500", marginTop: 2 },
  hdrDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.2)" },

  hdrProgRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  hdrProgLbl: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "600" },
  hdrProgPct: { color: "white", fontSize: 12, fontWeight: "800" },

  /* Stat cards 2×2 — ORIGINAL names */
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 0, marginBottom: 12 } as any,
  statsGridWide: { flexDirection: "row", gap: 14, marginBottom: 14 } as any,
  statCard: {
    width: "48.5%", marginHorizontal: "0.75%", marginBottom: 12,
    borderRadius: 20, borderWidth: 1, padding: 20,
    alignItems: "center", gap: 8, overflow: "hidden", position: "relative",
  },
  statCardWide: {
    flex: 1, borderRadius: 20, borderWidth: 1, padding: 20,
    alignItems: "center", gap: 8, overflow: "hidden", position: "relative",
  },
  statIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  statLbl:      { fontSize: 12, fontWeight: "600" },

  /* Layout rows — ORIGINAL names */
  midRowWide:   { flexDirection: "row", gap: 14, marginBottom: 12 } as any,
  midRowNarrow: { flexDirection: "column", marginBottom: 0 },

  /* Generic card — ORIGINAL names */
  card:     { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 12 },
  cardFull: { width: "100%" },
  cardHalf: { flex: 1 },
  cardHdr:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  cardTitle:{ fontSize: 16, fontWeight: "800", letterSpacing: -0.3,
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
  },
  cardBadge:{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },

  /* Donut — ORIGINAL names */
  donutRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  legend:     { gap: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  legendDot:  { width: 11, height: 11, borderRadius: 6 },
  legendVal:  { fontSize: 16, fontWeight: "900",
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
  },
  legendLbl:  { fontSize: 11, fontWeight: "500" },

  /* Insight — ORIGINAL names */
  insightTx: { fontSize: 14, fontWeight: "500", lineHeight: 22 },
  scoreBars: { marginTop: 16, gap: 0 },
  scoreRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  scoreLbl:  { fontSize: 12, fontWeight: "500" },
  scoreVal:  { fontSize: 12, fontWeight: "800" },

  /* Goal breakdown — ORIGINAL names */
  goalRow:    { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  goalEmoji:  { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  goalRowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goalName:   { fontSize: 14, fontWeight: "700", flex: 1 },
  goalPct:    { fontSize: 13, fontWeight: "800" },
  goalMeta:   { fontSize: 11, fontWeight: "500" },
});
