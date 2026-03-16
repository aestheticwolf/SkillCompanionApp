import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Switch,
  Platform,
  StatusBar,
} from "react-native";

import { useRouter } from "expo-router";
import { AuthContext } from "../src/context/AuthContext";
import { useContext, useEffect, useRef, useState, useCallback } from "react";
import { useWindowDimensions } from "react-native";
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

/* ════════════════════════════════
   WEB CSS ANIMATIONS (injected once)
════════════════════════════════ */
if (Platform.OS === "web" && typeof document !== "undefined") {
  const id = "sk-dash-css";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@700;800;900&display=swap');
      @keyframes sk-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
      @keyframes sk-pulse{0%,100%{opacity:1}50%{opacity:.3}}
      @keyframes sk-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
      @keyframes sk-glow{0%,100%{box-shadow:0 0 8px rgba(99,102,241,.3)}50%{box-shadow:0 0 22px rgba(99,102,241,.75)}}
      @keyframes sk-shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
      @keyframes sk-particle{0%{transform:translateY(0) scale(1);opacity:.8}100%{transform:translateY(-60px) scale(0);opacity:0}}
      @keyframes sk-fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes sk-slideR{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
      .sk-breathe{animation:sk-breathe 3s ease-in-out infinite}
      .sk-pulse{animation:sk-pulse 1.5s infinite}
      .sk-glow{animation:sk-glow 3s ease-in-out infinite}
      .sk-float{animation:sk-float 4s ease-in-out infinite}
      .sk-hov{transition:transform .2s,box-shadow .2s}
      .sk-hov:hover{transform:translateY(-2px)}
      .sk-btn-hov{transition:transform .15s,opacity .15s}
      .sk-btn-hov:hover{transform:translateY(-1px);opacity:.9}
      .sk-sidebar{transition:width .28s cubic-bezier(.4,0,.2,1),min-width .28s;overflow:hidden}
      .sk-hamb{transition:background .15s}
      .sk-hamb:hover{background:rgba(99,102,241,0.08)!important}
    `;
    document.head.appendChild(s);
  }
}

/* ─── Constants ─── */
const GOAL_COLORS = ["#6366f1","#f97316","#06b6d4","#a78bfa","#fbbf24","#34d399","#3b82f6","#ec4899"];
const GOAL_EMOJIS = ["☕","🦋","⚛️","🔥","🎨","🚀","📚","🎯"];
const SIDEBAR_W   = 260;
const RIGHT_W     = 340;

/* ════════════════════════════════
   SHIMMER BAR
════════════════════════════════ */
function ShimmerBar({ pct, color, h = 6 }: { pct: number; color: string; h?: number }) {
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

/* ════════════════════════════════
   COUNT-UP HOOK
════════════════════════════════ */
function useCountUp(target: number, dur = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      setV(Math.round(p * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, dur]);
  return v;
}

/* ════════════════════════════════
   PARTICLES (web hero only)
════════════════════════════════ */
function Particles() {
  const [pts, setPts] = useState<{ id: number; x: number }[]>([]);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const id = setInterval(() => {
      setPts(p => [...p.slice(-12), { id: Date.now(), x: Math.random() * 80 + 10 }]);
    }, 500);
    return () => clearInterval(id);
  }, []);
  if (Platform.OS !== "web") return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: "hidden", borderRadius: "inherit" } as any]}>
      {pts.map(p => (
        <View key={p.id} style={{
          position: "absolute", bottom: 0, left: `${p.x}%` as any,
          width: 5, height: 5, borderRadius: 3,
          backgroundColor: "rgba(255,255,255,0.55)",
          animation: "sk-particle 1.5s ease-out forwards",
        } as any} />
      ))}
    </View>
  );
}
function Sidebar({
  dark, router, activeRoute, overallPct, displayName, isSynced,
  goals, completedTasks, totalTasks,
}: any) {
  const bg       = dark ? "#0a0f20" : "#ffffff";
  const border   = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const txtPrim  = dark ? "#eef2ff" : "#0f172a";
  const txtMute  = dark ? "rgba(238,242,255,0.45)" : "rgba(15,23,42,0.45)";

  const NAV = [
    { icon: "🏠", label: "Dashboard", route: "/dashboard" },
    { icon: "📊", label: "Analytics",  route: "/analytics" },
    { icon: "🎯", label: "Goals",      route: "/add-goal"  },
    { icon: "🔔", label: "Reminders",  badge: 3            },
    { icon: "⚙️", label: "Settings",   route: null         },
  ];

  const initials = displayName.charAt(0).toUpperCase();

  return (
    <View style={[sidebarSt.wrap, { backgroundColor: bg, borderRightColor: border }]}>
      {/* Logo */}
      <View style={sidebarSt.logoRow}>
        <View style={[sidebarSt.logoIcon, Platform.OS === "web" ? { animation: "sk-glow 3s ease-in-out infinite" } as any : {}]}>
          <Text style={{ fontSize: 18 }}>⚡</Text>
        </View>
        <View>
          <Text style={[sidebarSt.logoName, { color: txtPrim }]}>SkillPath</Text>
          <Text style={[sidebarSt.logoSub,  { color: txtMute }]}>Learning Companion</Text>
        </View>
      </View>

      {/* Nav */}
      <Text style={[sidebarSt.navLabel, { color: txtMute }]}>NAVIGATION</Text>
      {NAV.map((n, i) => {
        const active = n.route === "/dashboard";
        return (
          <Pressable
            key={i}
            onPress={() => n.route && router.push(n.route)}
            style={({ pressed }) => [
              sidebarSt.navItem,
              active && { backgroundColor: dark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)" },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text style={{ fontSize: 16 }}>{n.icon}</Text>
            <Text style={[sidebarSt.navTx, {
              color: active ? "#6366f1" : txtPrim,
              fontWeight: active ? "700" : "500",
            }]}>{n.label}</Text>
            {active && <View style={sidebarSt.activeBar} />}
            {!!n.badge && (
              <View style={sidebarSt.badge}><Text style={sidebarSt.badgeTx}>{n.badge}</Text></View>
            )}
          </Pressable>
        );
      })}

      <View style={{ flex: 1 }} />

      {/* Overall progress */}
      <View style={[sidebarSt.progCard, { backgroundColor: dark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.06)", borderColor: border }]}>
        <Text style={[sidebarSt.progLabel, { color: txtMute }]}>OVERALL PROGRESS</Text>
        <View style={sidebarSt.progRingRow}>
          <View style={[
            sidebarSt.progRing,
            Platform.OS === "web"
              ? { background: `conic-gradient(#6366f1 ${overallPct * 3.6}deg, ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"} 0deg)` } as any
              : { borderWidth: 5, borderColor: "#6366f1" },
          ]}>
            <View style={[sidebarSt.progRingIn, { backgroundColor: dark ? "#0a0f20" : "#f5f7ff" }]}>
              <Text style={[sidebarSt.progPct, { color: "#6366f1" }]}>{overallPct}%</Text>
            </View>
          </View>
          <View>
            <Text style={[sidebarSt.progDone, { color: txtPrim }]}>
              {completedTasks}/{totalTasks}
            </Text>
            <Text style={[sidebarSt.progSub, { color: txtMute }]}>tasks done</Text>
          </View>
        </View>
        <ShimmerBar pct={overallPct} color="#6366f1" h={5} />
      </View>

      {/* User */}
      <View style={[sidebarSt.userRow, { borderTopColor: border }]}>
        <View style={[sidebarSt.userAvatar, { backgroundColor: "#6366f1" }]}>
          <Text style={sidebarSt.userInitial}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[sidebarSt.userName,  { color: txtPrim }]} numberOfLines={1}>{displayName}</Text>
          <Text style={[sidebarSt.userRole,  { color: txtMute }]}>Intern Developer</Text>
        </View>
        <View style={[sidebarSt.onlineDot, { backgroundColor: isSynced ? "#34d399" : "#f87171" },
          Platform.OS === "web" ? { animation: "sk-pulse 2s infinite" } as any : {}
        ]} />
      </View>
    </View>
  );
}

const sidebarSt = StyleSheet.create({
  wrap: {
    width: SIDEBAR_W, height: "100%" as any,
    paddingVertical: 24, paddingHorizontal: 16,
    borderRightWidth: 1, flexShrink: 0,
  },
  logoRow:    { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 36, paddingHorizontal: 8 },
  logoIcon:   { width: 38, height: 38, borderRadius: 12, backgroundColor: "#6366f1", alignItems: "center", justifyContent: "center",
    ...(Platform.OS === "web" ? { background: "linear-gradient(135deg,#6366f1,#a78bfa)", animation: "sk-glow 3s ease-in-out infinite", fontSize: 20 } as any : {}),
  },
  logoName:   { fontSize: 16, fontWeight: "900", letterSpacing: -0.5,
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
  },
  logoSub:    { fontSize: 11, fontWeight: "500" },
  navLabel:   { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10, paddingLeft: 8, textTransform: "uppercase" as const },
  navItem:    { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4, position: "relative",
    ...(Platform.OS === "web" ? { cursor: "pointer", transition: "background .15s" } as any : {}),
  },
  navTx:      { fontSize: 14, flex: 1 },
  activeBar:  { width: 4, height: 20, backgroundColor: "#6366f1", borderRadius: 99,
    ...(Platform.OS === "web" ? { boxShadow: "0 0 8px rgba(99,102,241,0.5)" } as any : {}),
  },
  badge:      { backgroundColor: "#ef4444", borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  badgeTx:    { color: "white", fontSize: 10, fontWeight: "800" },

  progCard:   { borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1 },
  progLabel:  { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10, color: "#6366f1", textTransform: "uppercase" as const },
  progRingRow:{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  progRing:   { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  progRingIn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  progPct:    { fontSize: 11, fontWeight: "800" },
  progDone:   { fontSize: 20, fontWeight: "900",
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
  },
  progSub:    { fontSize: 11, fontWeight: "500" },

  userRow:    { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 0, borderTopWidth: 0, padding: 12, borderRadius: 14, borderWidth: 1 },
  userAvatar: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center",
    ...(Platform.OS === "web" ? { background: "linear-gradient(135deg,#f97316,#ef4444)" } as any : {}),
    backgroundColor: "#f97316",
  },
  userInitial:{ color: "white", fontWeight: "800", fontSize: 15 },
  userName:   { fontSize: 13, fontWeight: "700" },
  userRole:   { fontSize: 11, fontWeight: "500" },
  onlineDot:  { width: 8, height: 8, borderRadius: 4,
    ...(Platform.OS === "web" ? { animation: "sk-pulse 2s infinite" } as any : {}),
  },
});

/* ════════════════════════════════
   PROFILE DROPDOWN
════════════════════════════════ */
function ProfileDrop({ dark, displayName, overallPct, streak, onClose, onToggleDark, router }: any) {
  const t = {
    bg:    dark ? "#111827" : "#ffffff",
    bdr:   dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)",
    text:  dark ? "#eef2ff" : "#0f172a",
    sub:   dark ? "rgba(238,242,255,0.45)" : "rgba(15,23,42,0.5)",
    muted: dark ? "rgba(238,242,255,0.2)" : "rgba(15,23,42,0.2)",
    inp:   dark ? "rgba(255,255,255,0.07)" : "#f5f7ff",
    card:  dark ? "rgba(255,255,255,0.04)" : "#ffffff",
    sh:    dark ? "0 8px 40px rgba(0,0,0,.7)" : "0 8px 40px rgba(0,0,0,.15)",
    ov:    dark ? "rgba(0,0,0,.72)" : "rgba(0,0,0,.38)",
  };
  const initials = displayName.charAt(0).toUpperCase();

  const items = [
    { icon: "👤", label: "My Profile",    sub: `${displayName} • Intern Developer`, fn: () => { router.push("/profile"); onClose(); } },
    { icon: "📊", label: "My Analytics",  sub: "View detailed progress",    fn: () => { router.push("/analytics"); onClose(); } },
    { icon: "🎯", label: "Learning Path", sub: "Roadmap & milestones",       fn: () => {} },
    { icon: "🔔", label: "Notifications", sub: "3 pending reminders",        fn: () => {}, badge: "3" },
    { icon: "⚙️", label: "Settings",      sub: "Preferences & account",      fn: () => {} },
    { icon: dark ? "☀️" : "🌙", label: dark ? "Light Mode" : "Dark Mode",
      sub: dark ? "Switch to light" : "Switch to dark", fn: () => { onToggleDark(); onClose(); }, toggle: true },
    { icon: "📤", label: "Share App",     sub: "Invite a colleague",         fn: () => {} },
    { icon: "🚪", label: "Log Out",       sub: "Sign out of account",        fn: () => { router.replace("/login"); onClose(); }, danger: true },
  ];

  /* Close on outside click — web only */
  const dropRef = useRef<any>(null);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handler = (e: any) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const dropStyle: any = Platform.OS === "web" ? {
    position: "absolute" as any, top: "calc(100% + 10px)", right: 0,
    width: 280, zIndex: 9999,
    background: t.bg, border: `1px solid ${t.bdr}`,
    borderRadius: 22, padding: 8,
    boxShadow: t.sh,
    animation: "sk-fadeUp .2s ease both",
  } : {};

  return (
    <View ref={dropRef} style={Platform.OS === "web" ? dropStyle as any : { position: "absolute", right: 0, top: 50, width: 280, backgroundColor: dark ? "#111827" : "#fff", borderRadius: 22, padding: 8, zIndex: 9999 }}>

      {/* User card */}
      <View style={{ padding: 14, borderRadius: 16, backgroundColor: "rgba(99,102,241,0.07)", borderWidth: 1, borderColor: "rgba(99,102,241,0.14)", marginBottom: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <View style={{ width: 50, height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center", flexShrink: 0,
            ...(Platform.OS === "web" ? { background: "linear-gradient(135deg,#f97316,#ef4444)", boxShadow: "0 4px 16px rgba(239,68,68,0.35)" } as any : { backgroundColor: "#f97316" }),
          }}>
            <Text style={{ color: "white", fontWeight: "900", fontSize: 20 }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: t.text,
              ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
            }}>{displayName}</Text>
            <Text style={{ fontSize: 12, color: t.sub, marginTop: 1 }}>richard@intern.dev</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#34d399",
                ...(Platform.OS === "web" ? { animation: "sk-pulse 1.5s infinite" } as any : {}),
              }} />
              <Text style={{ fontSize: 11, color: "#34d399", fontWeight: "700" }}>Active learner</Text>
            </View>
          </View>
        </View>
        {/* Stats row */}
        <View style={{ flexDirection: "row", gap: 6 }}>
          {[
            { v: `${streak}🔥`, l: "Streak" },
            { v: `${overallPct}%`,  l: "Progress" },
            { v: "842⭐", l: "Score"  },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", borderRadius: 10, padding: 8, alignItems: "center", borderWidth: 1, borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
              <Text style={{ fontSize: 12, fontWeight: "800", color: t.text,
                ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
              }}>{s.v}</Text>
              <Text style={{ fontSize: 10, color: t.sub, marginTop: 1, fontWeight: "500" }}>{s.l}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Menu items */}
      {items.map((item, i) => (
        <Pressable
          key={i}
          onPress={item.fn}
          style={({ pressed }) => [
            { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, paddingHorizontal: 12, borderRadius: 12,
              backgroundColor: pressed ? (item.danger ? "rgba(239,68,68,0.09)" : dark ? "rgba(255,255,255,0.07)" : "rgba(99,102,241,0.06)") : "transparent",
              borderTopWidth: i === items.length - 1 ? 1 : 0,
              borderTopColor: t.bdr,
              marginTop: i === items.length - 1 ? 4 : 0,
            },
          ]}
        >
          <Text style={{ fontSize: 16, width: 24, textAlign: "center" }}>{item.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: item.danger ? "#ef4444" : t.text }}>{item.label}</Text>
            <Text style={{ fontSize: 11, color: item.danger ? "rgba(239,68,68,0.5)" : t.sub, marginTop: 1, fontWeight: "500" }}>{item.sub}</Text>
          </View>
          {item.badge && (
            <View style={{ backgroundColor: "#ef4444", borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, fontWeight: "800", color: "white" }}>{item.badge}</Text>
            </View>
          )}
          {item.toggle && (
            <View style={{ width: 36, height: 20, borderRadius: 99, backgroundColor: dark ? "#6366f1" : "#cbd5e1", position: "relative" }}>
              <View style={{ position: "absolute", top: 3, left: dark ? 17 : 3, width: 14, height: 14, borderRadius: 7, backgroundColor: "white",
                ...(Platform.OS === "web" ? { transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" } as any : {}),
              }} />
            </View>
          )}
          {!item.toggle && !item.badge && (
            <Text style={{ fontSize: 14, color: t.muted }}>›</Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

/* ════════════════════════════════
   TOP BAR (web wide)
════════════════════════════════ */
function TopBar({ dark, router, displayName, darkMode, setDarkMode, isSynced, pulseAnim, overallPct, streak, sidebarOpen, setSidebarOpen }: any) {
  const bg     = dark ? "#0a0f20" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const txtPri = dark ? "#eef2ff" : "#0f172a";
  const txtSec = dark ? "rgba(238,242,255,0.5)" : "rgba(15,23,42,0.5)";

  const [time, setTime] = useState(() => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
  useEffect(() => {
    const tm = setInterval(() => setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })), 1000);
    return () => clearInterval(tm);
  }, []);

  const hour  = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const initials = displayName.charAt(0).toUpperCase();
  const [showDrop, setShowDrop] = useState(false);

  return (
    <View style={[topBarSt.wrap, { backgroundColor: bg, borderBottomColor: border }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        {/* Sidebar hamburger toggle */}
        <Pressable
          className={Platform.OS === "web" ? "sk-hamb" : undefined}
          onPress={() => setSidebarOpen((s: boolean) => !s)}
          style={[topBarSt.hambBtn, {
            backgroundColor: sidebarOpen
              ? (dark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)")
              : "transparent",
            borderColor: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
          }]}
        >
          <View style={{ gap: 4 }}>
            <View style={[topBarSt.hambLine, { backgroundColor: sidebarOpen ? "#6366f1" : (dark ? "rgba(238,242,255,0.6)" : "rgba(15,23,42,0.5)"), width: sidebarOpen ? 14 : 18 }]} />
            <View style={[topBarSt.hambLine, { backgroundColor: sidebarOpen ? "#6366f1" : (dark ? "rgba(238,242,255,0.6)" : "rgba(15,23,42,0.5)"), width: 14 }]} />
            <View style={[topBarSt.hambLine, { backgroundColor: sidebarOpen ? "#6366f1" : (dark ? "rgba(238,242,255,0.6)" : "rgba(15,23,42,0.5)"), width: sidebarOpen ? 18 : 10 }]} />
          </View>
        </Pressable>
        <View>
          <Text style={[topBarSt.title, { color: txtPri }]}>Dashboard</Text>
          <Text style={[topBarSt.sub,   { color: txtSec }]}>{greet} 🌟 {displayName}</Text>
        </View>
      </View>
      <View style={topBarSt.right}>
        <Text style={[topBarSt.time, { color: txtSec }]}>{time}</Text>
        {/* Dark mode toggle pill */}
        {Platform.OS === "web" ? (
          <Pressable onPress={async () => { setDarkMode(!dark); await saveTheme(!dark); }}
            style={{ width: 44, height: 26, borderRadius: 99, backgroundColor: dark ? "#6366f1" : "rgba(0,0,0,0.1)", justifyContent: "center", position: "relative" } as any}
          >
            <View style={{ position: "absolute", top: 3, left: dark ? 21 : 3, width: 20, height: 20, borderRadius: 10, backgroundColor: "white", alignItems: "center", justifyContent: "center",
              ...(Platform.OS === "web" ? { transition: "left .25s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" } as any : {}),
            }}>
              <Text style={{ fontSize: 11 }}>{dark ? "🌙" : "☀️"}</Text>
            </View>
          </Pressable>
        ) : (
          <View style={topBarSt.toggleWrap}>
            <Text style={{ fontSize: 12 }}>{dark ? "🌙" : "☀️"}</Text>
            <Switch value={dark} onValueChange={async v => { setDarkMode(v); await saveTheme(v); }}
              trackColor={{ false: "rgba(0,0,0,0.12)", true: "#6366f1" }} thumbColor="#ffffff"
              style={{ transform: [{ scaleX: 0.78 }, { scaleY: 0.78 }] }} />
          </View>
        )}
        {/* Bell */}
        <Pressable style={topBarSt.notifBtn}>
          <Text style={{ fontSize: 18 }}>🔔</Text>
          <Animated.View style={[topBarSt.notifDot, {
            backgroundColor: isSynced ? "#34d399" : "#f87171",
            transform: [{ scale: pulseAnim }],
          }]} />
        </Pressable>
        {/* Avatar + dropdown */}
        <View style={{ position: "relative" }}>
          <Pressable
            onPress={() => setShowDrop(s => !s)}
            style={({ pressed }) => [
              topBarSt.avatar,
              { backgroundColor: "#f97316" },
              pressed && { opacity: 0.85 },
              Platform.OS === "web" ? {
                background: "linear-gradient(135deg,#f97316,#ef4444)",
                boxShadow: "0 3px 14px rgba(239,68,68,0.35)",
                outline: showDrop ? "3px solid #6366f1" : "3px solid transparent",
                transform: [{ scale: showDrop ? 1.1 : 1 }],
              } as any : {},
            ]}
          >
            <Text style={topBarSt.avatarTx}>{initials}</Text>
          </Pressable>
          {showDrop && (
            <ProfileDrop
              dark={dark}
              displayName={displayName}
              overallPct={overallPct}
              streak={streak}
              onClose={() => setShowDrop(false)}
              onToggleDark={async () => { setDarkMode(!dark); await saveTheme(!dark); }}
              router={router}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const topBarSt = StyleSheet.create({
  wrap:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 0, paddingHorizontal: 28, height: 70, borderBottomWidth: 1, flexShrink: 0,
    ...(Platform.OS === "web" ? { position: "sticky", top: 0, zIndex: 200 } as any : {}),
  },
  title:      { fontSize: 20, fontWeight: "900", letterSpacing: -0.4,
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
  },
  sub:        { fontSize: 12, fontWeight: "500", marginTop: 1 },
  right:      { flexDirection: "row", alignItems: "center", gap: 10 },
  time:       { fontSize: 13, fontWeight: "600",
    ...(Platform.OS === "web" ? { padding: "7px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.07)", background: "transparent" } as any : {}),
  },
  toggleWrap: { flexDirection: "row", alignItems: "center", gap: 3 },
  notifBtn:   { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", position: "relative",
    ...(Platform.OS === "web" ? { cursor: "pointer" } as any : {}),
  },
  notifDot:   { position: "absolute", top: 7, right: 7, width: 8, height: 8, borderRadius: 4 },
  avatar:     { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center",
    ...(Platform.OS === "web" ? { cursor: "pointer" } as any : {}),
  },
  avatarTx:   { color: "white", fontWeight: "900", fontSize: 15 },
  hambBtn:    { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1,
    ...(Platform.OS === "web" ? { cursor: "pointer" } as any : {}),
  },
  hambLine:   { height: 2, borderRadius: 99 },
});

/* ════════════════════════════════
   HERO BANNER (web wide)
════════════════════════════════ */
function HeroBanner({ dark, displayName, overallPct, isSynced, fadeAnim, slideAnim }: any) {
  /* Blinking dot animation */
  const blinkAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.15, duration: 600, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        herSt.wrap,
        Platform.OS === "web"
          ? { boxShadow: "0 8px 32px rgba(99,102,241,0.22)" }
          : { elevation: 8 },
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {Platform.OS === "web" && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, {
          borderRadius: 18,
          background: "linear-gradient(135deg,#3730a3 0%,#6d28d9 55%,#9333ea 100%)",
        } as any]} />
      )}
      {Platform.OS !== "web" && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#1e3a8a", borderRadius: 18 }]} />
      )}
      <View pointerEvents="none" style={[herSt.orb, { width: 220, height: 220, top: -60, right: -40 },
        Platform.OS === "web" ? { animation: "sk-float 4s ease-in-out infinite" } as any : {}
      ]} />
      <View pointerEvents="none" style={[herSt.orb, { width: 120, height: 120, bottom: -40, right: 180 },
        Platform.OS === "web" ? { animation: "sk-float 5s ease-in-out infinite reverse" } as any : {}
      ]} />

      <View style={herSt.inner}>
        <Particles />
        {/* Blinking badge */}
        <View style={herSt.badge}>
          <Animated.View style={[herSt.badgeDot, {
            backgroundColor: isSynced ? "#34d399" : "#f87171",
            opacity: blinkAnim,
          }]} />
          <Text style={[herSt.badgeTx, { color: isSynced ? "rgba(255,255,255,0.85)" : "#fca5a5" }]}>
            {isSynced ? "SYNCED & ACTIVE" : "OFFLINE"}
          </Text>
        </View>
        <Text style={herSt.title}>Welcome back, {displayName}!</Text>
        <Text style={herSt.sub}>
          You're {overallPct}% through your learning goals. Keep pushing —{"\n"}consistency is your superpower.
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={{ height: 8, width: 260, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 99, overflow: "hidden" } as any}>
            {Platform.OS === "web" ? (
              <View style={{
                height: "100%", width: `${overallPct}%`, borderRadius: 99,
                background: "linear-gradient(90deg,#34d399,#a7f3d0)",
                boxShadow: "0 0 10px rgba(52,211,153,0.55)",
                transition: "width 1.2s",
              } as any} />
            ) : (
              <View style={{ height: "100%", width: `${overallPct}%` as any, backgroundColor: "#34d399", borderRadius: 99 }} />
            )}
          </View>
          <Text style={herSt.pctTx}>{overallPct}% complete</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const herSt = StyleSheet.create({
  wrap:    { borderRadius: 24, padding: 28, paddingVertical: 32, marginBottom: 28, overflow: "hidden", position: "relative" },
  orb:     { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.07)" } as any,
  inner:   { zIndex: 1 },
  badge:   { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  badgeDot:{ width: 8, height: 8, borderRadius: 4 },
  badgeTx: { fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" as const },
  title:   { color: "white", fontSize: 28, fontWeight: "900", letterSpacing: -0.6, marginBottom: 6,
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif", fontSize: "clamp(22px,3vw,34px)" } as any : {}),
  },
  sub:     { color: "rgba(255,255,255,0.72)", fontSize: 15, fontWeight: "500", lineHeight: 22, maxWidth: 480, marginBottom: 20 },
  pctTx:   { color: "rgba(255,255,255,0.85)", fontSize: 15, fontWeight: "900", marginTop: 0,
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
  },
});

/* ════════════════════════════════
   STAT CARDS ROW (web wide)
════════════════════════════════ */
function StatCards({ dark, goals, completedTasks, streak, fadeAnim, slideAnim }: any) {
  const bg     = dark ? "#0d1424" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const txtPri = dark ? "#eef2ff" : "#0f172a";
  const txtSec = dark ? "rgba(238,242,255,0.5)" : "rgba(15,23,42,0.5)";

  const CARDS = [
    { icon: "🎯", val: goals.length,     lbl: "Active Goals",     sub: "All on track",   color: "#6366f1", bg2: "rgba(99,102,241,0.08)"  },
    { icon: "✅", val: completedTasks,   lbl: "Tasks Completed",  sub: "+2 today",       color: "#34d399", bg2: "rgba(52,211,153,0.08)"  },
    { icon: "🔥", val: `${streak}`,      lbl: "Day Streak",       sub: "Personal best",  color: "#f97316", bg2: "rgba(249,115,22,0.08)"  },
    { icon: "⭐", val: "842",            lbl: "Skill Score",      sub: "+28 this week",  color: "#fbbf24", bg2: "rgba(251,191,36,0.08)"  },
  ];

  /* ── Single stat card with count-up ── */
  function StatCard({ icon, val, lbl, sub, color, bg2, i }: any) {
    const isNum  = typeof val === "number";
    const counted = useCountUp(isNum ? val : 0);
    const display = isNum ? counted : val;
    return (
      <Animated.View
        className={Platform.OS === "web" ? "sk-hov" : undefined}
        style={[
          stSt.card,
          { backgroundColor: bg, borderColor: border },
          Platform.OS === "web"
            ? { boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 16px rgba(99,102,241,0.08)" }
            : { elevation: 3 },
          {
            opacity: fadeAnim,
            transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(i * 6)) }],
          },
        ]}
      >
        {Platform.OS === "web" && (
          <View pointerEvents="none" style={{
            position: "absolute", top: -12, right: -12, width: 70, height: 70,
            borderRadius: 35, backgroundColor: color,
            filter: "blur(20px)", opacity: 0.15,
          } as any} />
        )}
        <View style={[stSt.iconWrap, { backgroundColor: bg2 },
          Platform.OS === "web" ? { animation: "sk-breathe 3s ease-in-out infinite" } as any : {}
        ]}>
          <Text style={{ fontSize: 22 }}>{icon}</Text>
        </View>
        <Text style={[stSt.val, { color: txtPri },
          Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}
        ]}>{display}</Text>
        <Text style={[stSt.lbl, { color: txtSec }]}>{lbl}</Text>
        <View style={stSt.subRow}>
          <Text style={{ color, fontSize: 10, fontWeight: "700" }}>↑ {sub}</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={stSt.row}>
      {CARDS.map((c, i) => <StatCard key={i} {...c} i={i} />)}
    </View>
  );
}

const stSt = StyleSheet.create({
  row:     { flexDirection: "row", gap: 14, marginBottom: 28 } as any,
  card:    { flex: 1, borderRadius: 20, padding: 22, borderWidth: 1, overflow: "hidden", position: "relative" },
  iconWrap:{ width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  val:     { fontSize: 32, fontWeight: "900", letterSpacing: -0.6, marginBottom: 3, lineHeight: 36,
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
  },
  lbl:     { fontSize: 13, fontWeight: "500", marginBottom: 4 },
  subRow:  { flexDirection: "row", alignItems: "center" },
});

/* ════════════════════════════════
   RIGHT PANEL (web wide)
════════════════════════════════ */
function RightPanel({ dark, goals, getGoalProgress, getRecommendation, fadeAnim }: any) {
  const bg     = dark ? "#0a0f20" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const txtPri = dark ? "#eef2ff" : "#0f172a";
  const txtSec = dark ? "rgba(238,242,255,0.5)" : "rgba(15,23,42,0.5)";
  const recBg  = dark ? "rgba(99,102,241,0.1)" : "#eff6ff";

  return (
    <Animated.View style={[rpSt.wrap, { opacity: fadeAnim }]}>

      {/* AI Recommendation */}
      <View style={[rpSt.card, {
        borderColor: "rgba(99,102,241,0.2)",
        ...(Platform.OS === "web"
          ? { background: "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(167,139,250,0.06))" }
          : { backgroundColor: recBg }),
      } as any]}>
        <View style={rpSt.recHdr}>
          <View style={[rpSt.recIcon,
            Platform.OS === "web" ? { background: "linear-gradient(135deg,#6366f1,#a78bfa)", animation: "sk-breathe 3s ease-in-out infinite" } as any : {}
          ]}>
            <Text style={{ fontSize: 20 }}>🚀</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[rpSt.recTitle, { color: txtPri }]}>AI Recommendation</Text>
            <Text style={[rpSt.recSub]}>Personalized for you</Text>
          </View>
        </View>
        <Text style={[rpSt.recBody, { color: txtSec }]}>{getRecommendation()}</Text>
        {goals.length > 0 && (
          <Pressable style={rpSt.recBtn}>
            <Text style={rpSt.recBtnTx}>Start {goals[0].name} Tasks →</Text>
          </Pressable>
        )}
      </View>

      {/* Quick Progress */}
      <View style={[rpSt.card, { backgroundColor: bg, borderColor: border }]}>
        <Text style={[rpSt.secTitle, { color: txtPri }]}>Quick Progress</Text>
        {goals.length === 0 && (
          <Text style={[rpSt.recSub, { color: txtSec }]}>No goals yet</Text>
        )}
        {goals.slice(0, 5).map((g: any, i: number) => {
          const pct    = getGoalProgress(g.id);
          const accent = GOAL_COLORS[i % GOAL_COLORS.length];
          return (
            <View key={g.id} style={rpSt.qpRow}>
              <View style={[rpSt.qpDot, { backgroundColor: accent + "28" }]}>
                <Text style={{ fontSize: 14 }}>{GOAL_EMOJIS[i % GOAL_EMOJIS.length]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={rpSt.qpTop}>
                  <Text style={[rpSt.qpName, { color: txtPri }]} numberOfLines={1}>{g.name}</Text>
                  <Text style={[rpSt.qpPct, { color: accent }]}>{pct}%</Text>
                </View>
                <ShimmerBar pct={pct} color={accent} h={5} />
              </View>
            </View>
          );
        })}
      </View>

      {/* Today's Plan */}
      {goals.length > 0 && (() => {
        const pending: { title: string; goalName: string; accent: string }[] = [];
        goals.forEach((g: any, gi: number) => {
          g.tasks.forEach((t: any) => {
            if (!t.completed && pending.length < 3) {
              pending.push({ title: t.title, goalName: g.name, accent: GOAL_COLORS[gi % GOAL_COLORS.length] });
            }
          });
        });
        if (pending.length === 0) return null;
        return (
          <View style={[rpSt.card, { backgroundColor: bg, borderColor: border }]}>
            <View style={rpSt.planHdr}>
              <Text style={[rpSt.secTitle, { color: txtPri, marginBottom: 0 }]}>Today's Plan</Text>
              <View style={rpSt.planBadge}>
                <Text style={rpSt.planBadgeTx}>{pending.length} due</Text>
              </View>
            </View>
            <View style={{ height: 1, backgroundColor: border, marginVertical: 10 }} />
            {pending.map((item, idx) => (
              <View key={idx} style={[rpSt.planRow, {
                backgroundColor: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                borderWidth: 1, borderColor: border,
                borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6,
              }]}>
                <View style={[rpSt.planDot, { backgroundColor: item.accent },
                  Platform.OS === "web" ? { animation: "sk-pulse 2s infinite" } as any : {}
                ]} />
                <View style={{ flex: 1 }}>
                  <Text style={[rpSt.planTask, { color: txtPri }]} numberOfLines={1}>{item.title}</Text>
                  <Text style={[rpSt.planGoal, { color: txtSec }]}>{item.goalName}</Text>
                </View>
                <View style={{ backgroundColor: item.accent + "22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
                  <Text style={[rpSt.planDue, { color: item.accent }]}>Due</Text>
                </View>
              </View>
            ))}
          </View>
        );
      })()}

    </Animated.View>
  );
}

const rpSt = StyleSheet.create({
  wrap:        { width: RIGHT_W, flexShrink: 0, gap: 14 },
  card:        { borderRadius: 20, padding: 20, borderWidth: 1 },
  recHdr:      { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  recIcon:     { width: 38, height: 38, borderRadius: 12, backgroundColor: "#6366f1", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  recTitle:    { fontSize: 14, fontWeight: "800",
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
  },
  recSub:      { fontSize: 11, fontWeight: "600", color: "#a78bfa" },
  recBody:     { fontSize: 13, fontWeight: "500", lineHeight: 20, marginBottom: 14 },
  recBtn:      { borderRadius: 12, paddingVertical: 11, alignItems: "center",
    backgroundColor: "#6366f1",
    ...(Platform.OS === "web" ? { background: "linear-gradient(135deg,#6366f1,#a78bfa)", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" } as any : {}),
  },
  recBtnTx:    { color: "white", fontWeight: "700", fontSize: 13 },
  secTitle:    { fontSize: 15, fontWeight: "800", marginBottom: 14,
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
  },
  qpRow:       { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  qpDot:       { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  qpTop:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  qpName:      { fontSize: 12, fontWeight: "700", flex: 1 },
  qpPct:       { fontSize: 12, fontWeight: "700", marginLeft: 4 },
  /* Today's Plan */
  planHdr:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  planBadge:   { backgroundColor: "#ef444418", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  planBadgeTx: { color: "#ef4444", fontSize: 10, fontWeight: "700" },
  planRow:     { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  planDot:     { width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginTop: 2 },
  planTask:    { fontSize: 12, fontWeight: "600", marginBottom: 1 },
  planGoal:    { fontSize: 10, fontWeight: "500" },
  planDue:     { fontSize: 10, fontWeight: "700", color: "#ef4444" },
});

/* ════════════════════════════════
   MAIN DASHBOARD
════════════════════════════════ */
export default function Dashboard() {
  const router  = useRouter();
  const taskCtx = useContext(TaskContext);
  const authCtx = useContext(AuthContext);

  if (!taskCtx || !authCtx || !authCtx.user) return null;

  const user = authCtx.user;

  const [darkMode,     setDarkMode]     = useState<boolean | null>(null);
  const [isSynced,     setIsSynced]     = useState(false);
  const [showPicker,   setShowPicker]   = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [hoveredTask,  setHoveredTask]  = useState<string | null>(null);
  const [streak,       setStreak]       = useState(0);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);

  /* Animations */
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(36)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const hdrScale   = useRef(new Animated.Value(0.97)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 10 }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(hdrScale,  { toValue: 1, useNativeDriver: true, tension: 80, friction: 9 }),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.6, duration: 750, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,   duration: 750, useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => { loadTheme().then(setDarkMode); }, []);
  useEffect(() => { const u = listenToNetwork(setIsSynced); return () => u(); }, []);

  /* Streak from Firestore — original logic */
  useEffect(() => {
    const userRef = doc(db, "users", user.uid);
    const unsub   = onSnapshot(userRef, (snap) => {
      if (snap.exists()) setStreak(snap.data().streak || 0);
    });
    return unsub;
  }, []);

  const {
    goals, toggleTask, getOverallProgress, getGoalProgress,
    getRecommendation, hasPendingTasks,
  } = taskCtx;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: getOverallProgress(), duration: 800, useNativeDriver: false,
    }).start();
  }, [goals]);

  /* Logout */
  const handleLogout = async () => {
    await signOut(auth);
    showSuccess("Logged out successfully");
    router.replace("/login");
  };

  /* Theme */
  const dark          = !!darkMode;
  const bg            = dark ? "#080d18" : "#eef1f8";
  const card          = dark ? "#0d1424" : "#FFFFFF";
  const textPrimary   = dark ? "#FFFFFF"  : "#0F172A";
  const textSecondary = dark ? "#CBD5F5"  : "#475569";
  const textMuted     = dark ? "rgba(238,242,255,0.28)" : "rgba(15,23,42,0.28)";
  const headerBg      = dark ? "#020617"  : "#1e3a8a";
  const recBg         = dark ? "#020617"  : "#EFF6FF";
  const recBorder     = dark ? "#38BDF8"  : COLORS.primary;
  const recText       = dark ? "#CBD5F5"  : "#334155";
  const cardBorder    = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";

  const overallPct    = getOverallProgress();
  const displayName   = user.displayName || user.email || "User";
  const initials      = displayName.charAt(0).toUpperCase();
  const completedTasks = goals.reduce((a: number, g: any) => a + g.tasks.filter((t: any) => t.completed).length, 0);
  const totalTasks    = goals.reduce((a: number, g: any) => a + g.tasks.length, 0);

  /* ── Responsive breakpoints (CSS-style media queries via useWindowDimensions) ── */
  const { width: screenW } = useWindowDimensions();
  // xs  < 600   → mobile: compact header, single col, bottom bar
  // sm  600–959 → tablet: no sidebar, 2-col goals, no right panel
  // md  960+    → desktop: sidebar + hero + stat cards + right panel
  const isMobile = screenW < 600;
  const isTablet = !isMobile && screenW < 960 && Platform.OS === "web";
  const isWide   = Platform.OS === "web" && screenW >= 960;

  const cardShadow = Platform.OS === "web"
    ? { boxShadow: dark ? "0 2px 12px rgba(0,0,0,0.4)" : "0 2px 12px rgba(0,0,0,0.05)" }
    : { elevation: 3 };

  /* ── Mobile header (compact) ── */
  const MobileHeader = () => (
    <Animated.View
      style={[
        styles.mHdr, { backgroundColor: headerBg },
        Platform.OS === "web" ? { boxShadow: "0 14px 44px rgba(0,0,0,0.26)" } : { elevation: 12 },
        { transform: [{ scale: hdrScale }], opacity: fadeAnim },
      ]}
    >
      {Platform.OS === "web" && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, {
          borderRadius: 20,
          background: dark
            ? "linear-gradient(135deg,#020617 0%,#0f2060 60%,#1a1060 100%)"
            : "linear-gradient(135deg,#1e3a8a 0%,#2563eb 60%,#6d28d9 100%)",
        } as any]} />
      )}
      <View pointerEvents="none" style={[styles.orb, { width: 180, height: 180, top: -60, right: -40 }]} />
      <View pointerEvents="none" style={[styles.orb, { width: 100, height: 100, bottom: -35, right: 120 }]} />

      <View style={styles.mHdrRow1}>
        <View style={styles.syncBadge}>
          <Animated.View style={[styles.syncDot, { backgroundColor: isSynced ? "#22C55E" : "#EF4444", transform: [{ scale: pulseAnim }] }]} />
          <Text style={[styles.syncTx, { color: isSynced ? "#22C55E" : "#EF4444" }]}>{isSynced ? "Synced" : "Offline"}</Text>
        </View>
        <View style={styles.mHdrControls}>
          <View style={styles.toggleRow}>
            <Text style={{ fontSize: 12 }}>{dark ? "🌙" : "☀️"}</Text>
            <Switch value={dark} onValueChange={async v => { setDarkMode(v); await saveTheme(v); }}
              trackColor={{ false: "rgba(255,255,255,0.22)", true: "#6366f1" }} thumbColor="#fff"
              style={{ transform: [{ scaleX: 0.78 }, { scaleY: 0.78 }] }} />
          </View>
          <Pressable style={styles.mAvatar} onPress={() => router.push("/profile")}>
            <Text style={styles.mAvatarTx}>{initials}</Text>
          </Pressable>
          <Pressable onPress={handleLogout} style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.logoutTx}>Logout</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.mHdrRow2}>
        <View>
          <Text style={styles.welcomeTx}>Welcome 👋</Text>
          <Text style={styles.nameTx}>{displayName}</Text>
          <Text style={styles.roleTx}>Intern Developer</Text>
        </View>
        <View style={[styles.ringOuter, Platform.OS === "web"
          ? { background: `conic-gradient(rgba(255,255,255,0.9) ${overallPct * 3.6}deg, rgba(255,255,255,0.13) 0deg)` } as any
          : { borderWidth: 4, borderColor: "rgba(255,255,255,0.3)" }
        ]}>
          <View style={[styles.ringInner, { backgroundColor: headerBg }]}>
            <Text style={styles.ringPct}>{overallPct}%</Text>
            <Text style={styles.ringDone}>done</Text>
          </View>
        </View>
      </View>

      <View style={styles.statRow}>
        {[
          { icon: "🎯", val: String(goals.length), lbl: "Goals" },
          { icon: "✅", val: String(completedTasks), lbl: "Done" },
          { icon: "🔥", val: `${streak}d`, lbl: "Streak" },
          { icon: "⭐", val: "842", lbl: "Score" },
        ].map((s, i) => (
          <Animated.View key={i} style={[styles.chip, {
            opacity: fadeAnim,
            transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(i * 5)) }],
          }]}>
            <Text style={styles.chipIcon}>{s.icon}</Text>
            <Text style={styles.chipVal}>{s.val}</Text>
            <Text style={styles.chipLbl}>{s.lbl}</Text>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );

  /* ── Goal list shared ── */
  /* Goal cards always expanded — no collapse toggle */

  const GoalList = () => (
    <>
      {goals.length === 0 && (
        <Animated.View style={[styles.emptyCard, { backgroundColor: dark ? "rgba(255,255,255,0.05)" : "rgba(99,102,241,0.04)", borderColor: cardBorder, ...cardShadow }, { opacity: fadeAnim }]}>
          <Text style={styles.emptyEmoji}>🚀</Text>
          <Text style={[styles.emptyTitle, { color: textPrimary }]}>No goals yet</Text>
          <Text style={styles.emptySub}>Create your first learning goal to get started</Text>
          <Pressable onPress={() => router.push("/add-goal")} disabled={!isSynced}
            style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.8 }]}>
            <Text style={styles.emptyBtnTx}>Create Goal →</Text>
          </Pressable>
        </Animated.View>
      )}

      {goals.length > 0 && (
        <View style={(isWide || isTablet) ? styles.gridWide : styles.gridNarrow}>
          {goals.map((g: any, index: number) => {
            const accent  = GOAL_COLORS[index % GOAL_COLORS.length];
            const goalPct = getGoalProgress(g.id);
            const doneCnt = g.tasks.filter((t: any) => t.completed).length;

            return (
              <Animated.View
                key={g.id}
                className={Platform.OS === "web" ? "sk-hov" : undefined}
                style={[
                  styles.goalBox,
                  (isWide || isTablet) ? styles.goalBoxWide : styles.goalBoxFull,
                  { backgroundColor: card, borderColor: cardBorder, borderLeftColor: accent, ...cardShadow },
                  { opacity: fadeAnim, transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(index * 7)) }] },
                ]}
              >
                <View style={styles.goalHeader}>
                  <View style={[styles.goalIconWrap, { backgroundColor: accent + "1c" }]}>
                    <Text style={{ fontSize: 20 }}>{GOAL_EMOJIS[index % GOAL_EMOJIS.length]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.goalTitle, { color: textPrimary }]} numberOfLines={1}>{g.name}</Text>
                    <View style={styles.goalMeta}>
                      <Text style={[styles.goalMetaTx, { color: textSecondary }]}>{doneCnt}/{g.tasks.length} tasks</Text>
                      <View style={[styles.goalMetaDot, { backgroundColor: textSecondary }]} />
                      <Text style={[styles.goalMetaTx, { color: accent, fontWeight: "700" as const }]}>{goalPct}%</Text>
                    </View>
                  </View>
                  <View style={[styles.miniRing, Platform.OS === "web"
                    ? { background: `conic-gradient(${accent} ${goalPct * 3.6}deg, ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"} 0deg)` } as any
                    : { borderWidth: 2.5, borderColor: accent + "55" }
                  ]}>
                    <View style={[styles.miniRingIn, { backgroundColor: card }]}>
                      <Text style={[styles.miniRingTx, { color: accent }]}>{goalPct}%</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => taskCtx.deleteGoal(g.id)} style={({ pressed }) => [styles.delGoalBtn, pressed && { opacity: 0.55 }]}>
                    <Text style={styles.delTx}>🗑</Text>
                  </Pressable>

                </View>

                {/* Progress bar */}
                <View style={{ marginBottom: 10, marginTop: 2 }}>
                  {Platform.OS === "web" ? (
                    <View style={{ height: 5, backgroundColor: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", borderRadius: 99, overflow: "hidden" } as any}>
                      <View style={{
                        height: "100%", width: `${goalPct}%`,
                        background: `linear-gradient(90deg,${accent},${accent}99)`,
                        borderRadius: 99,
                        boxShadow: `0 0 10px ${accent}66`,
                        transition: "width 1s cubic-bezier(.4,0,.2,1)",
                      } as any} />
                    </View>
                  ) : (
                    <ShimmerBar pct={goalPct} color={accent} h={5} />
                  )}
                </View>

                {/* Tasks */}
                {g.tasks.map((t: any) => (
                  <Pressable
                    key={t.id}
                    onHoverIn={() => Platform.OS === "web" && setHoveredTask(t.id)}
                    onHoverOut={() => Platform.OS === "web" && setHoveredTask(null)}
                    style={[styles.taskRow, {
                      backgroundColor: t.completed ? accent + "0d" : dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.025)",
                      borderColor: t.completed ? accent + "28" : cardBorder,
                    },
                    Platform.OS === "web" && hoveredTask === t.id && { backgroundColor: accent + "14" } as any,
                    !isSynced && { opacity: 0.5 }]}
                    onPress={async () => {
                      if (!isSynced) { showError("You are offline. Changes will sync later."); return; }
                      toggleTask(g.id, t.id);
                      if (!t.completed) await updateStreak(user.uid);
                      showSuccess(t.completed ? "Task marked incomplete" : "Task completed 🎉");
                    }}
                  >
                    <View style={styles.taskContent}>
                      <View style={[styles.cb, t.completed ? { backgroundColor: accent, borderColor: accent } : { backgroundColor: "transparent", borderColor: dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)" }]}>
                        {t.completed && <Text style={styles.tick}>✓</Text>}
                      </View>
                      <Text style={[styles.taskTx, {
                        color: t.completed ? (dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)") : textSecondary,
                        textDecorationLine: t.completed ? "line-through" : "none",
                      }]} numberOfLines={1}>{t.title}</Text>
                      <Pressable onPress={() => taskCtx.deleteTask(g.id, t.id)}>
                        <Text style={styles.delTx}>✕</Text>
                      </Pressable>
                    </View>
                  </Pressable>
                ))}

                {/* Add Task button */}
                <Pressable
                  style={[styles.addTaskBtn, { borderColor: accent + "44" }, !isSynced && { opacity: 0.5 }]}
                  disabled={!isSynced}
                  onPress={() => router.push({ pathname: "/add-task", params: { goalId: g.id } })}
                >
                  <Text style={[styles.addTaskTx, { color: accent }]}>+ Add Task</Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      )}
    </>
  );

  /* ════════════════ RENDER ════════════════ */
  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={headerBg} />

      {/* Offline banner */}
      {!isSynced && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineTx}>⚡ You are offline. Changes will sync when online.</Text>
        </View>
      )}

      {isWide ? (
        /* ══ DESKTOP LAYOUT (960px+) ══ */
        <View style={styles.wideRoot}>

          {/* Sidebar — collapsible on desktop */}
          {Platform.OS === "web" ? (
            <View className="sk-sidebar" style={{
              width: sidebarOpen ? 260 : 0,
              minWidth: sidebarOpen ? 260 : 0,
              overflow: "hidden",
            } as any}>
              <Sidebar
                dark={dark} router={router} isSynced={isSynced}
                overallPct={overallPct} displayName={displayName}
                goals={goals} completedTasks={completedTasks} totalTasks={totalTasks}
              />
            </View>
          ) : (
            <Sidebar
              dark={dark} router={router} isSynced={isSynced}
              overallPct={overallPct} displayName={displayName}
              goals={goals} completedTasks={completedTasks} totalTasks={totalTasks}
            />
          )}

          {/* Center + Right */}
          <View style={styles.wideCenter}>

            {/* Top bar */}
            <TopBar
              dark={dark} router={router} displayName={displayName}
              darkMode={dark} setDarkMode={setDarkMode} isSynced={isSynced}
              pulseAnim={pulseAnim} overallPct={overallPct} streak={streak}
              sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
            />

            <ScrollView
              style={styles.widePadded}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
            >
              {/* Hero */}
              <HeroBanner dark={dark} displayName={displayName} overallPct={overallPct} isSynced={isSynced} fadeAnim={fadeAnim} slideAnim={slideAnim} />

              {/* Stat cards */}
              <StatCards dark={dark} goals={goals} completedTasks={completedTasks} streak={streak} fadeAnim={fadeAnim} slideAnim={slideAnim} />

              {/* Goals header — full width above both columns */}
              <Animated.View style={[styles.goalsHdr, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <Text style={[styles.secTitle, { color: dark ? "#E5E7EB" : "#334155" }]}>Your Goals</Text>
                <Pressable
                  onPress={() => router.push("/add-goal")}
                  disabled={!isSynced}
                  style={({ pressed }) => [styles.addGoalBtn, !isSynced && { opacity: 0.5 }, pressed && { opacity: 0.8 }]}
                >
                  <Text style={styles.addGoalTx}>+ Add Goal</Text>
                </Pressable>
              </Animated.View>

              {/* Goals + Right panel row */}
              <View style={styles.wideContentRow}>

                {/* Goals col */}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <GoalList />
                </View>

                {/* Right panel */}
                <RightPanel dark={dark} goals={goals} getGoalProgress={getGoalProgress} getRecommendation={getRecommendation} fadeAnim={fadeAnim} />
              </View>
            </ScrollView>
          </View>
        </View>

      ) : isTablet ? (
        /* ══ TABLET LAYOUT (600–959px) ══ */
        <View style={[styles.wrapper, { paddingTop: Platform.OS === "ios" ? 52 : 10 }]}>
          {/* Compact top row */}
          <View style={styles.tabletTopRow}>
            <View>
              <Text style={[styles.secTitle, { color: dark ? "#eef2ff" : "#0f172a", fontSize: 20 }]}>Dashboard</Text>
              <Text style={{ color: dark ? "rgba(238,242,255,0.45)" : "rgba(15,23,42,0.45)", fontSize: 11, fontWeight: "500" }}>
                {displayName}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Text style={{ fontSize: 12 }}>{dark ? "🌙" : "☀️"}</Text>
                <Switch value={dark} onValueChange={async v => { setDarkMode(v); await saveTheme(v); }}
                  trackColor={{ false: "rgba(0,0,0,0.12)", true: "#6366f1" }} thumbColor="#fff"
                  style={{ transform: [{ scaleX: 0.78 }, { scaleY: 0.78 }] }} />
              </View>
              <Pressable onPress={() => router.push("/profile")} style={[styles.mAvatar, { backgroundColor: "#6366f1" }]}>
                <Text style={[styles.mAvatarTx, { color: "white" }]}>{initials}</Text>
              </Pressable>
              <Pressable onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: dark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }]}>
                <Text style={[styles.logoutTx, { color: "#ef4444" }]}>Logout</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
            {/* Hero compact */}
            <HeroBanner dark={dark} displayName={displayName} overallPct={overallPct} isSynced={isSynced} fadeAnim={fadeAnim} slideAnim={slideAnim} />

            {/* Goals header + 2-col grid */}
            <Animated.View style={[styles.goalsHdr, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <Text style={[styles.secTitle, { color: dark ? "#E5E7EB" : "#334155" }]}>Your Goals</Text>
              <Pressable onPress={() => router.push("/add-goal")} disabled={!isSynced}
                style={({ pressed }) => [styles.addGoalBtn, !isSynced && { opacity: 0.5 }, pressed && { opacity: 0.8 }]}>
                <Text style={styles.addGoalTx}>+ Add Goal</Text>
              </Pressable>
            </Animated.View>
            <GoalList />
          </ScrollView>
        </View>

      ) : (
        /* ══ MOBILE / NARROW LAYOUT ══ */
        <View style={styles.wrapper}>
          <MobileHeader />

          {/* Rec card */}
          <Animated.View style={[styles.recCard, { backgroundColor: recBg, borderLeftColor: recBorder, ...cardShadow }, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.recRow}>
              <View style={styles.recIconWrap}><Text style={{ fontSize: 20 }}>🚀</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.recTitle, { color: dark ? "#FFFFFF" : COLORS.secondary }]}>📌 Your Recommendation</Text>
                <Text style={[styles.recBody, { color: recText }]}>{getRecommendation()}</Text>
              </View>
            </View>
            <View style={styles.recProgRow}>
              <Text style={[styles.progTx, { color: recText }]}>Overall progress</Text>
              <Text style={[styles.progTx, { color: dark ? "#a78bfa" : COLORS.primary, fontWeight: "800" as const }]}>{overallPct}%</Text>
            </View>
            <ShimmerBar pct={overallPct} color={dark ? "#6366f1" : COLORS.primary} h={7} />
          </Animated.View>

          {/* Goals header */}
          <Animated.View style={[styles.goalsHdr, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={[styles.secTitle, { color: dark ? "#E5E7EB" : "#334155" }]}>Your Goals</Text>
            <Pressable onPress={() => router.push("/add-goal")} disabled={!isSynced}
              style={({ pressed }) => [styles.addGoalBtn, !isSynced && { opacity: 0.5 }, pressed && { opacity: 0.8 }]}>
              <Text style={styles.addGoalTx}>＋ Add Goal</Text>
            </Pressable>
          </Animated.View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 108 }}>
            <GoalList />
          </ScrollView>

          {/* Bottom bar */}
          <View style={[styles.bottomBar, { backgroundColor: dark ? "rgba(2,6,23,0.96)" : "rgba(240,244,255,0.96)", borderTopColor: cardBorder }]}>
            <Pressable
              style={[styles.bbBtn, styles.reminderBtn]}
              onPress={() => {
                if (Platform.OS === "web") { showError("Smart reminders work only on mobile app"); return; }
                setShowPicker(true);
              }}
            >
              <Text style={styles.bbTx}>🔔 Smart Reminder</Text>
            </Pressable>
            <Pressable style={[styles.bbBtn, styles.analyticsBtn]} onPress={() => router.push("/analytics")}>
              <Text style={styles.bbTx}>📊 Analytics</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* DateTimePicker */}
      {showPicker && Platform.OS !== "web" && (
        <DateTimePicker
          value={reminderTime} mode="time" is24Hour display="default"
          onChange={async (_, sel) => {
            setShowPicker(false);
            if (!sel) return;
            setReminderTime(sel);
            const h = sel.getHours(), m = sel.getMinutes();
            const granted = await requestNotificationPermission();
            if (!granted) { showError("Notification permission denied"); return; }
            if (!hasPendingTasks()) { showSuccess("No pending tasks. You're all caught up 🎉"); return; }
            await scheduleDailyReminder(h, m);
            showSuccess(`Reminder set for ${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`);
          }}
        />
      )}
    </View>
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

  /* Wide layout */
  wideRoot:       { flex: 1, flexDirection: "row" } as any,
  wideCenter:     { flex: 1, flexDirection: "column", minWidth: 0 } as any,
  widePadded:     { flex: 1, paddingHorizontal: 28, paddingTop: 28 },
  wideContentRow: { flexDirection: "row", gap: 16, alignItems: "flex-start" } as any,

  /* Tablet */
  tabletTopRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },

  /* Offline */
  offlineBanner: { backgroundColor: "#FEF3C7", borderLeftWidth: 4, borderLeftColor: "#F59E0B", borderRadius: 12, paddingVertical: 9, paddingHorizontal: 14, marginHorizontal: 18, marginTop: 8, marginBottom: 4 },
  offlineTx:     { color: "#92400E", fontSize: 12, fontWeight: "600", textAlign: "center" },

  /* Mobile header */
  mHdr:        { borderRadius: 20, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16, marginBottom: 12, overflow: "hidden", position: "relative" },
  orb:         { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)" } as any,
  mHdrRow1:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14, zIndex: 1 },
  mHdrRow2:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, zIndex: 1 },
  mHdrControls:{ flexDirection: "row", alignItems: "center", gap: 9 },
  syncBadge:   { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  syncDot:     { width: 7, height: 7, borderRadius: 4 },
  syncTx:      { fontSize: 11, fontWeight: "700" },
  toggleRow:   { flexDirection: "row", alignItems: "center", gap: 3 },
  mAvatar:     { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.45)" },
  mAvatarTx:   { fontWeight: "800", fontSize: 14, color: "#1e3a8a" },
  logoutBtn:   { backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  logoutTx:    { color: "white", fontWeight: "700", fontSize: 12 },
  welcomeTx:   { color: "rgba(255,255,255,0.62)", fontSize: 12, fontWeight: "500", marginBottom: 2 },
  nameTx:      { color: "white", fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  roleTx:      { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "500", marginTop: 2 },
  ringOuter:   { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center" },
  ringInner:   { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  ringPct:     { color: "white", fontSize: 13, fontWeight: "900" },
  ringDone:    { color: "rgba(255,255,255,0.55)", fontSize: 9, fontWeight: "500" },
  statRow:     { flexDirection: "row", gap: 7, zIndex: 1 },
  chip:        { flex: 1, backgroundColor: "rgba(255,255,255,0.11)", borderRadius: 13, paddingVertical: 10, paddingHorizontal: 5, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" },
  chipIcon:    { fontSize: 15, marginBottom: 3 },
  chipVal:     { color: "white", fontSize: 14, fontWeight: "900" },
  chipLbl:     { color: "rgba(255,255,255,0.55)", fontSize: 9, fontWeight: "500", marginTop: 1 },

  /* Rec card (mobile) */
  recCard:    { borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
  recRow:     { flexDirection: "row", alignItems: "flex-start", gap: 11, marginBottom: 10 },
  recIconWrap:{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(99,102,241,0.14)", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  recTitle:   { fontWeight: "800", fontSize: 15, marginBottom: 3 },
  recBody:    { fontSize: 13, fontWeight: "500", lineHeight: 18 },
  recProgRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 7 },
  progTx:     { fontSize: 11, fontWeight: "500" },

  /* Goals */
  goalsHdr:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingVertical: 0 },
  secTitle:   { fontSize: 18, fontWeight: "800", letterSpacing: -0.4,
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
  },
  addGoalBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, flexDirection: "row", alignItems: "center",
    backgroundColor: "#6366f1",
    ...(Platform.OS === "web" ? {
      background: "linear-gradient(135deg,#6366f1,#a78bfa)",
      boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
    } as any : { elevation: 5 }),
  },
  addGoalTx:  { color: "white", fontWeight: "700", fontSize: 14 },

  gridNarrow: { width: "100%" },
  gridWide:   { flexDirection: "row", flexWrap: "wrap" } as any,

  goalBox:     { borderRadius: 20, padding: 22, marginBottom: 14, borderWidth: 1, borderLeftWidth: 4 },
  goalBoxFull: { width: "100%" },
  goalBoxWide: { width: "49%", marginHorizontal: "0.5%" },

  goalHeader:  { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 14 },
  goalIconWrap:{ width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  goalTitle:   { fontSize: 17, fontWeight: "800", letterSpacing: -0.4, marginBottom: 3,
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
  },
  goalMeta:    { flexDirection: "row", alignItems: "center", gap: 8 },
  goalMetaTx:  { fontSize: 12, fontWeight: "500" },
  goalMetaDot: { width: 4, height: 4, borderRadius: 2 },
  miniRing:    { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  miniRingIn:  { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  miniRingTx:  { fontSize: 10, fontWeight: "800" },
  delGoalBtn:  { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center",
    ...(Platform.OS === "web" ? { transition: "all .15s" } as any : {}),
  },
  delTx:       { color: "#EF4444", fontSize: 15 },

  chevBtn:     { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center",
    ...(Platform.OS === "web" ? { transition: "transform .2s" } as any : {}),
  },
  chevTx:      { fontSize: 16, lineHeight: 18 },

  taskRow:     { marginBottom: 6, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1,
    ...(Platform.OS === "web" ? { transition: "background .15s", cursor: "pointer" } as any : {}),
  },
  taskContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  cb:          { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  tick:        { color: "white", fontSize: 11, fontWeight: "800" },
  taskTx:      { fontSize: 14, fontWeight: "500", flex: 1 },
  addTaskBtn:  { marginTop: 8, paddingVertical: 11, alignItems: "center", borderWidth: 1.5, borderStyle: "dashed", borderRadius: 12,
    ...(Platform.OS === "web" ? { transition: "all .15s", cursor: "pointer" } as any : {}),
  },
  addTaskTx:   { fontWeight: "700", fontSize: 13 },

  emptyCard:   { borderRadius: 20, padding: 36, alignItems: "center", borderWidth: 1, marginTop: 6 },
  emptyEmoji:  { fontSize: 42, marginBottom: 12 },
  emptyTitle:  { fontSize: 17, fontWeight: "800", marginBottom: 6 },
  emptySub:    { fontSize: 12, fontWeight: "500", textAlign: "center", lineHeight: 19, color: "#64748B" },
  emptyBtn:    { marginTop: 20, backgroundColor: "#6366f1", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnTx:  { color: "white", fontWeight: "700", fontSize: 13 },

  bottomBar:   { flexDirection: "row", gap: 12, paddingVertical: 11, paddingHorizontal: 2, borderTopWidth: 1 },
  bbBtn:       { flex: 1, paddingVertical: 15, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  reminderBtn: { backgroundColor: "#f97316", ...(Platform.OS === "web" ? { boxShadow: "0 4px 16px rgba(249,115,22,0.42)" } : { elevation: 5 }) },
  analyticsBtn:{ backgroundColor: "#6366f1", ...(Platform.OS === "web" ? { boxShadow: "0 4px 16px rgba(99,102,241,0.42)" } : { elevation: 5 }) },
  bbTx:        { color: "white", fontWeight: "700", fontSize: 14 },
});
