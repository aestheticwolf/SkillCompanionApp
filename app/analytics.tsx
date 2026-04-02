import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Platform,
  Image,
} from "react-native";

import { useRouter } from "expo-router";
import SkillPathLogo from "../src/components/SkillPathLogo";
import { useContext, useEffect, useRef, useState } from "react";
import { useWindowDimensions } from "react-native";
import { TaskContext } from "../src/context/TaskContext";
import { AuthContext } from "../src/context/AuthContext";
import { loadTheme, saveTheme } from "../src/services/uiPreferences";
import { showComingSoon } from "../src/services/toast";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../src/services/firebase";

/* ════ WEB CSS ════ */
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
      @keyframes sk-fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
      @keyframes sk-countIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
      .sk-breathe{animation:sk-breathe 3s ease-in-out infinite}
      .sk-glow{animation:sk-glow 3s ease-in-out infinite}
      .sk-hov{transition:transform .18s,box-shadow .18s}
      .sk-hov:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(99,102,241,.14)!important}
      .sk-sidebar{transition:width .28s cubic-bezier(.4,0,.2,1),min-width .28s;overflow:hidden;flex-shrink:0}
      .sk-hamb:hover{background:rgba(99,102,241,0.08)!important}
      *{box-sizing:border-box;}
      ::-webkit-scrollbar{width:4px}
      ::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.3);border-radius:99px}
    `;
    document.head.appendChild(s);
  }
}

const SIDEBAR_W   = 260;
const ACCENT      = "#6366f1";
const GOAL_COLORS = ["#6366f1","#f97316","#06b6d4","#a78bfa","#fbbf24","#34d399","#3b82f6","#ec4899"];
const GOAL_EMOJIS = ["☕","🦋","⚛️","🔥","🎨","🚀","📚","🎯"];

/* ════ SHIMMER BAR ════ */
function ShimmerBar({ pct, color, h = 7 }: { pct: number; color: string; h?: number }) {
  const x = useRef(new Animated.Value(-1)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(x, { toValue: 2, duration: 1800, useNativeDriver: true })).start();
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
          background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)",
          transform: [{ translateX: x.interpolate({ inputRange: [-1, 2], outputRange: ["-100%", "280%"] }) }],
        } as any} />
      </View>
    </View>
  );
}

/* ════ DONUT CHART ════ */
function DonutChart({ completed, total, color }: { completed: number; total: number; color: string }) {
  const pct  = total > 0 ? (completed / total) * 100 : 0;
  const r = 52, cx = 68, cy = 68;
  const circ = 2 * Math.PI * r;
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
            <Text style={{ fontSize: 22, fontWeight: "900", color }}>{Math.round(pct)}%</Text>
            <Text style={{ fontSize: 10, color: "rgba(100,116,139,0.8)", fontWeight: "600" }}>done</Text>
          </View>
        </View>
      </View>
    );
  }
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <svg width="136" height="136" viewBox="0 0 136 136">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="13"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f87171" strokeWidth="13"
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={0}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#34d399" strokeWidth="13"
          strokeDasharray={`${animDash} ${animGap}`} strokeDashoffset={0}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}/>
        <text x={cx} y={cy-6} textAnchor="middle" fontSize="20" fontWeight="900" fill={color}>{Math.round(animPct)}%</text>
        <text x={cx} y={cy+12} textAnchor="middle" fontSize="11" fontWeight="600" fill="rgba(100,116,139,0.9)">done</text>
      </svg>
    </View>
  );
}

/* ════ COUNT UP ════ */
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
      ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif", animation: "sk-countIn .4s ease both" } as any : {}),
    }}>{val}</Text>
  );
}

/* ════ SIDEBAR —  ════ */
function Sidebar({ dark, router, overallPct, completedTasks, totalTasks, userRole, displayName, userEmail }: any) {
  const bg     = dark ? "#0a0f20" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const txtPri = dark ? "#eef2ff" : "#0f172a";
  const txtMut = dark ? "rgba(238,242,255,0.45)" : "rgba(15,23,42,0.45)";
const NAV = [
  { icon: "🏠", label: "Dashboard", route: "/dashboard" },
  { icon: "📊", label: "Analytics",  route: "/analytics"   },
  { icon: "🔔", label: "Reminders",  route: "/notifications" },
  { icon: "⚙️", label: "Settings", route: "/settings" },
];
  return (
    <View style={[sbSt.wrap, { backgroundColor: bg, borderRightColor: border }]}>
      <View style={sbSt.logoRow}>
        <View style={[sbSt.logoIcon, Platform.OS === "web" ? { animation: "sk-glow 3s ease-in-out infinite" } as any : {}]}>
         <SkillPathLogo size={48} dark={dark} />
        </View>
        <View>
         <Text style={[sbSt.logoName,
  Platform.OS === "web"
    ? ({
        background: "linear-gradient(90deg,#FF5C5C,#FFCA3A,#14D9C5)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      } as any)
    : { color: "#FF5C5C" },
]}>SkillPath</Text>
          <Text style={[sbSt.logoSub, { color: txtMut }]}>Learning Companion</Text>
        </View>
      </View>
     <Text style={[sbSt.navLabel, { color: txtMut }]}>NAVIGATION</Text>

{NAV.map((n: any, i: number) => {
  const active = n.route === "/analytics"; // 👈 KEY FIX

  return (
    <Pressable
      key={i}
      onPress={() => {
        if (n.v2) {
          showComingSoon();
          return;
        }
        n.route && router.push(n.route);
      }}
      style={({ pressed }) => [
        sbSt.navItem,
        active && {
          backgroundColor: dark
            ? "rgba(99,102,241,0.14)"
            : "rgba(99,102,241,0.08)",
        },
        n.v2 && { opacity: 0.55 },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Text style={{ fontSize: 16 }}>{n.icon}</Text>

      <Text
        style={[
          sbSt.navTx,
          {
            color: active ? ACCENT : n.v2 ? txtMut : txtPri,
            fontWeight: active ? "700" : "500",
          },
        ]}
      >
        {n.label}
      </Text>

      {active && <View style={sbSt.activeBar} />}

      {n.v2 && (
        <View
          style={{
            backgroundColor: "rgba(99,102,241,0.12)",
            borderRadius: 99,
            paddingHorizontal: 6,
            paddingVertical: 2,
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: "700", color: ACCENT }}>
            v2
          </Text>
        </View>
      )}
    </Pressable>
  );
})}
      <View style={{ flex: 1 }} />
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
      <View style={[sbSt.userRow, { backgroundColor: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", borderColor: border }]}>
        <View style={[sbSt.userAvatar,
          Platform.OS === "web" ? { background: "linear-gradient(135deg,#f97316,#ef4444)" } as any : { backgroundColor: "#f97316" }]}>
          <Text style={{ color: "white", fontWeight: "800", fontSize: 15 }}>{(displayName || "User").charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: txtPri }} numberOfLines={1}>{displayName || "User"}</Text>
          <Text style={{ fontSize: 11, fontWeight: "500", color: txtMut }}>{userRole || "Intern Developer"}</Text>
        </View>
        <View style={[sbSt.onlineDot, { backgroundColor: "#34d399" },
          Platform.OS === "web" ? { animation: "sk-pulse 2s infinite" } as any : {}]} />
      </View>
    </View>
  );
}
const sbSt = StyleSheet.create({
  wrap:       { width: SIDEBAR_W, height: "100%" as any, paddingVertical: 24, paddingHorizontal: 16, borderRightWidth: 1, flexShrink: 0 },
  logoRow:    { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 36, paddingHorizontal: 8 },
  logoIcon:   { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center",
    ...(Platform.OS === "web" ? { filter: "drop-shadow(0 4px 12px rgba(99,102,241,0.35))", animation: "sk-breathe 3s ease-in-out infinite" } as any : {}),
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

/* ════════════════════════════════
   PROFILE DROPDOWN 
════════════════════════════════ */
function ProfileDrop({
  dark,
  displayName,
  email,
  overallPct,
  streak,
  userRole,
  onClose,
  onToggleDark,
  onShowV2,
  router,
  onLogoutReset,
  completedTasks,
  totalGoals,
}: any) {
  const t = {
    bg: dark ? "#111827" : "#ffffff",
    bdr: dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)",
    text: dark ? "#eef2ff" : "#0f172a",
    sub: dark ? "rgba(238,242,255,0.45)" : "rgba(15,23,42,0.5)",
    muted: dark ? "rgba(238,242,255,0.2)" : "rgba(15,23,42,0.2)",
    inp: dark ? "rgba(255,255,255,0.07)" : "#f5f7ff",
    card: dark ? "rgba(255,255,255,0.04)" : "#ffffff",
    sh: dark ? "0 8px 40px rgba(0,0,0,.7)" : "0 8px 40px rgba(0,0,0,.15)",
    ov: dark ? "rgba(0,0,0,.72)" : "rgba(0,0,0,.38)",
  };
  const initials = displayName.charAt(0).toUpperCase();

  const items: any[] = [
    {
      icon: "👤",
      label: "My Profile",
      sub: `${displayName} • ${userRole || "Intern Developer"}`,
      fn: () => {
        router.push("/profile");
        onClose();
      },
    },
    {
      icon: "📊",
      label: "My Analytics",
      sub: "View detailed progress",
      fn: () => {
        router.push("/analytics");
        onClose();
      },
    },
    {
      icon: "🎯",
      label: "Learning Path",
      sub: "Coming in v2 ✨",
      fn: () => {
        onShowV2();
      },
      v2: true,
    },
    {
      icon: "⚙️",
      label: "Settings",
      sub: "Customize your experience",
      fn: () => {
        router.push("/settings");
        onClose();
      },
    },
    {
      icon: dark ? "☀️" : "🌙",
      label: dark ? "Light Mode" : "Dark Mode",
      sub: dark ? "Switch to light" : "Switch to dark",
      fn: () => {
        onToggleDark();
      },
      toggle: true,
    },
    {
      icon: "📤",
      label: "Share App",
      sub: "Coming in v2 ✨",
      fn: () => {
        onShowV2();
      },
      v2: true,
    },
    {
      icon: "🚪",
      label: "Log Out",
      sub: "Sign out of account",
      fn: () => {
        onLogoutReset();
        router.replace("/login");
        onClose();
      },
      danger: true,
    },
  ];

  const dropRef = useRef<any>(null);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handler = (e: any) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const dropStyle: any =
    Platform.OS === "web"
      ? {
          position: "absolute" as any,
          top: "calc(100% + 10px)",
          right: 0,
          width: 280,
          zIndex: 9999,
          background: t.bg,
          border: `1px solid ${t.bdr}`,
          borderRadius: 22,
          padding: 8,
          boxShadow: t.sh,
          animation: "sk-fadeUp .2s ease both",
        }
      : {};

  return (
    <View
      ref={dropRef}
      style={
        Platform.OS === "web"
          ? (dropStyle as any)
          : {
              position: "absolute",
              right: 0,
              top: 50,
              width: 280,
              backgroundColor: dark ? "#111827" : "#fff",
              borderRadius: 22,
              padding: 8,
              zIndex: 9999,
            }
      }
    >
      {/* User card */}
      <View
        style={{
          padding: 14,
          borderRadius: 16,
          backgroundColor: "rgba(99,102,241,0.07)",
          borderWidth: 1,
          borderColor: "rgba(99,102,241,0.14)",
          marginBottom: 6,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              ...(Platform.OS === "web"
                ? ({
                    background: "linear-gradient(135deg,#f97316,#ef4444)",
                    boxShadow: "0 4px 16px rgba(239,68,68,0.35)",
                  } as any)
                : { backgroundColor: "#f97316" }),
            }}
          >
            <Text style={{ color: "white", fontWeight: "900", fontSize: 20 }}>
              {initials}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "800",
                color: t.text,
                ...(Platform.OS === "web"
                  ? ({ fontFamily: "Outfit,sans-serif" } as any)
                  : {}),
              }}
            >
              {displayName}
            </Text>
            <Text style={{ fontSize: 12, color: t.sub, marginTop: 1 }}>
              {email || "user@example.com"}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                marginTop: 4,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#34d399",
                  ...(Platform.OS === "web"
                    ? ({ animation: "sk-pulse 1.5s infinite" } as any)
                    : {}),
                }}
              />
              <Text
                style={{ fontSize: 11, color: "#34d399", fontWeight: "700" }}
              >
                Active learner
              </Text>
            </View>
          </View>
        </View>
               {/* Stats row */}
        <View style={{ flexDirection: "row", gap: 6 }}>
          {[
            { v: `${streak}🔥`, l: "Streak" },
            { v: `${overallPct}%`, l: "Progress" },
            { v: `${Math.min(9999, completedTasks * 50 + totalGoals * 120 + streak * 15)}⭐`, l: "Score" },
          ].map((s, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                backgroundColor: dark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.04)",
                borderRadius: 10,
                padding: 8,
                alignItems: "center",
                borderWidth: 1,
                borderColor: dark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.06)",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "800",
                  color: t.text,
                  ...(Platform.OS === "web"
                    ? ({ fontFamily: "Outfit,sans-serif" } as any)
                    : {}),
                }}
              >
                {s.v}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color: t.sub,
                  marginTop: 1,
                  fontWeight: "500",
                }}
              >
                {s.l}
              </Text>
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
            {
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              padding: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: pressed
                ? item.danger
                  ? "rgba(239,68,68,0.09)"
                  : dark
                  ? "rgba(255,255,255,0.07)"
                  : "rgba(99,102,241,0.06)"
                : "transparent",
              borderTopWidth: i === items.length - 1 ? 1 : 0,
              borderTopColor: t.bdr,
              marginTop: i === items.length - 1 ? 4 : 0,
            },
          ]}
        >
          <Text style={{ fontSize: 16, width: 24, textAlign: "center" }}>
            {item.icon}
          </Text>
          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: item.danger ? "#ef4444" : item.v2 ? t.sub : t.text,
                }}
              >
                {item.label}
              </Text>
              {item.v2 && (
                <View
                  style={{
                    backgroundColor: "rgba(99,102,241,0.12)",
                    borderRadius: 99,
                    paddingHorizontal: 5,
                    paddingVertical: 1,
                  }}
                >
                  <Text
                    style={{ fontSize: 9, fontWeight: "800", color: "#6366f1" }}
                  >
                    v2
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={{
                fontSize: 11,
                color: item.v2
                  ? "#a78bfa"
                  : item.danger
                  ? "rgba(239,68,68,0.5)"
                  : t.sub,
                marginTop: 1,
                fontWeight: "500",
              }}
            >
              {item.sub}
            </Text>
          </View>
          {item.badge && (
            <View
              style={{
                backgroundColor: "#ef4444",
                borderRadius: 20,
                paddingHorizontal: 7,
                paddingVertical: 2,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "800", color: "white" }}>
                {item.badge}
              </Text>
            </View>
          )}
          {item.toggle && (
            <View
              style={{
                width: 36,
                height: 20,
                borderRadius: 99,
                backgroundColor: dark ? "#6366f1" : "#cbd5e1",
                position: "relative",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  top: 3,
                  left: dark ? 17 : 3,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: "white",
                  ...(Platform.OS === "web"
                    ? ({
                        transition: "left .2s",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                      } as any)
                    : {}),
                }}
              />
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
   NOTIFICATION DROPDOWN
════════════════════════════════ */
function NotifDropdown({
  dark,
  notifications,
  pendingTasks,
  streak,
  onClose,
  onViewAll,
}: any) {
  const bg = dark ? "#111827" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)";
  const txtPri = dark ? "#eef2ff" : "#0f172a";
  const txtSec = dark ? "rgba(238,242,255,0.55)" : "rgba(15,23,42,0.5)";
  const dropRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handler = (e: any) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const NOTIF_ITEMS = [
    ...(pendingTasks > 0
      ? [
          {
            id: "pending",
            icon: "📌",
            title: "Pending Tasks",
            body: `You have ${pendingTasks} task${pendingTasks > 1 ? "s" : ""} waiting`,
            color: "#f97316",
            unread: true,
          },
        ]
      : []),
    ...(streak > 0
      ? [
          {
            id: "streak",
            icon: "🔥",
            title: `${streak} Day Streak!`,
            body: "Keep it up — don't break the chain",
            color: "#ef4444",
            unread: streak > 0 && pendingTasks === 0,
          },
        ]
      : []),
    {
      id: "sys",
      icon: "🚀",
      title: "SkillPath Active",
      body: "Your learning session is synced",
      color: "#6366f1",
      unread: false,
    },
  ];

  const unread = NOTIF_ITEMS.filter((n) => n.unread).length;

  return (
    <View
      ref={dropRef}
      style={
        Platform.OS === "web"
          ? ({
              position: "absolute",
              top: "calc(100% + 12px)",
              right: 0,
              width: 320,
              zIndex: 9999,
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: dark
                ? "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)"
                : "0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)",
              animation: "sk-fadeUp .18s ease both",
            } as any)
          : {
              position: "absolute",
              right: 0,
              top: 50,
              width: 300,
              backgroundColor: bg,
              borderRadius: 20,
              zIndex: 9999,
              overflow: "hidden",
            }
      }
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: border,
          ...(Platform.OS === "web"
            ? ({
                background: dark
                  ? "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(0,0,0,0))"
                  : "linear-gradient(135deg,rgba(99,102,241,0.06),rgba(0,0,0,0))",
              } as any)
            : {}),
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: "rgba(99,102,241,0.12)",
              alignItems: "center",
              justifyContent: "center",
              ...(Platform.OS === "web"
                ? ({ animation: "sk-breathe 3s ease-in-out infinite" } as any)
                : {}),
            }}
          >
            <Text style={{ fontSize: 16 }}>🔔</Text>
          </View>
          <View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "800",
                color: txtPri,
                ...(Platform.OS === "web"
                  ? ({ fontFamily: "Outfit,sans-serif" } as any)
                  : {}),
              }}
            >
              Notifications
            </Text>
            <Text style={{ fontSize: 11, fontWeight: "500", color: txtSec }}>
              {unread > 0 ? `${unread} unread` : "All caught up 🎉"}
            </Text>
          </View>
        </View>
        {unread > 0 && (
          <View
            style={{
              backgroundColor: "#ef4444",
              borderRadius: 99,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text style={{ color: "white", fontSize: 11, fontWeight: "800" }}>
              {unread}
            </Text>
          </View>
        )}
      </View>

      {/* Items */}
      <View style={{ paddingVertical: 8 }}>
        {NOTIF_ITEMS.map((item, i) => (
          <View
            key={item.id}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 12,
              paddingHorizontal: 14,
              paddingVertical: 11,
              marginHorizontal: 8,
              borderRadius: 12,
              marginBottom: 2,
              backgroundColor: item.unread
                ? dark
                  ? "rgba(99,102,241,0.07)"
                  : "rgba(99,102,241,0.04)"
                : "transparent",
              borderWidth: item.unread ? 1 : 0,
              borderColor: item.unread
                ? "rgba(99,102,241,0.14)"
                : "transparent",
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                backgroundColor: item.color + "18",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Text style={{ fontSize: 18 }}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: txtPri,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {item.unread && (
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: item.color,
                      flexShrink: 0,
                    }}
                  />
                )}
              </View>
              <Text
                style={{ fontSize: 11, fontWeight: "500", color: txtSec }}
                numberOfLines={1}
              >
                {item.body}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Footer */}
      <Pressable
        onPress={onViewAll}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingVertical: 13,
          borderTopWidth: 1,
          borderTopColor: border,
          backgroundColor: pressed
            ? dark
              ? "rgba(99,102,241,0.1)"
              : "rgba(99,102,241,0.06)"
            : "transparent",
          ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
        })}
      >
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#6366f1" }}>
          View all notifications
        </Text>
        <Text style={{ fontSize: 13, color: "#6366f1" }}>→</Text>
      </Pressable>
    </View>
  );
}

/* ════ TOP BAR ════ */
function TopBar({
  dark,
  sidebarOpen,
  setSidebarOpen,
  toggleDark,
  router,
  displayName,
  email,
  streak,
  overallPct,
  userRole,
  goals,
  isSynced,
  pulseAnim,
  completedTasks,
  totalGoals,
}: any) {
  const bg = dark ? "#0a0f20" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const txtPri = dark ? "#eef2ff" : "#0f172a";
  const txtSec = dark ? "rgba(238,242,255,0.5)" : "rgba(15,23,42,0.5)";
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
  const [seconds, setSeconds] = useState(() => new Date().getSeconds());

  const [showDrop, setShowDrop] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const bellAnim = useRef(new Animated.Value(1)).current;
  const hasNotified = useRef(false);

  const pendingTasks = (goals || []).reduce((acc: number, goal: any) => {
    return (
      acc +
      goal.tasks.filter(
        (t: any) =>
          t &&
          t.title &&
          t.title.trim() !== "" &&
          !(
            t.completed === true ||
            t.completed === "true" ||
            t.completed === 1 ||
            t.isCompleted === true
          )
      ).length
    );
  }, 0);

  const resetNotificationState = () => {
    hasNotified.current = false;
  };

  useEffect(() => {
    if (pendingTasks === 0) return;
    if (hasNotified.current) return;
    hasNotified.current = true;
    Animated.sequence([
      Animated.timing(bellAnim, {
        toValue: 1.35,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(bellAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(bellAnim, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(bellAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [pendingTasks]);

  useEffect(() => {
    const tm = setInterval(() => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      setSeconds(now.getSeconds());
    }, 1000);

    return () => clearInterval(tm);
  }, []);

  return (
    <View style={[tbSt.wrap, { backgroundColor: bg, borderBottomColor: border }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <Pressable
          className={Platform.OS === "web" ? "sk-hamb" : undefined}
          onPress={() => setSidebarOpen((s: boolean) => !s)}
          style={[
            tbSt.hambBtn,
            {
              backgroundColor: sidebarOpen
                ? dark
                  ? "rgba(99,102,241,0.14)"
                  : "rgba(99,102,241,0.08)"
                : "transparent",
              borderColor: dark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.08)",
            },
          ]}
        >
          <View style={{ gap: 4 }}>
            {[
              { w: sidebarOpen ? 14 : 18 },
              { w: 14 },
              { w: sidebarOpen ? 18 : 10 },
            ].map((line, i) => (
              <View
                key={i}
                style={[
                  tbSt.hambLine,
                  {
                    backgroundColor: sidebarOpen
                      ? ACCENT
                      : dark
                      ? "rgba(238,242,255,0.6)"
                      : "rgba(15,23,42,0.5)",
                    width: line.w,
                  },
                ]}
              />
            ))}
          </View>
        </Pressable>
        <View>
          <Text style={[tbSt.title, { color: txtPri }]}>Analytics</Text>
          <Text style={{ fontSize: 12, fontWeight: "500", marginTop: 1, color: txtSec }}>
            Dashboard › Learning Overview
          </Text>
        </View>
      </View>

      {Platform.OS === "web" && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {/* Clock — web only */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: border,
              backgroundColor: dark
                ? "rgba(255,255,255,0.03)"
                : "rgba(99,102,241,0.03)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <circle
                cx={12}
                cy={12}
                r={10}
                fill="none"
                stroke={dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}
                strokeWidth="2"
              />
              <circle
                cx={12}
                cy={12}
                r={10}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray={`${(seconds / 60) * 62.8} 62.8`}
                strokeLinecap="round"
                transform="rotate(-90 12 12)"
                style={{ transition: "stroke-dasharray 0.5s linear" } as any}
              />
              <circle cx={12} cy={12} r={2} fill="#6366f1" />
            </svg>
            <View>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "800",
                  color: txtPri,
                  letterSpacing: -0.3,
                }}
              >
                {time}
              </Text>
              <Text style={{ fontSize: 10, fontWeight: "500", color: txtSec }}>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>
          </View>

          {/* Dark mode toggle — web only */}
          <Pressable
            onPress={toggleDark}
            style={{
              width: 44,
              height: 26,
              borderRadius: 99,
              backgroundColor: dark ? ACCENT : "rgba(0,0,0,0.1)",
              justifyContent: "center",
              position: "relative",
              ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
            } as any}
          >
            <View
              style={{
                position: "absolute",
                top: 3,
                left: dark ? 21 : 3,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "white",
                alignItems: "center",
                justifyContent: "center",
                ...(Platform.OS === "web"
                  ? ({
                      transition: "left .25s",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                    } as any)
                  : {}),
              }}
            >
              <Text style={{ fontSize: 11 }}>{dark ? "🌙" : "☀️"}</Text>
            </View>
          </Pressable>

          {/* Bell with sync dot */}
          <Pressable
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            } as any}
            onPress={() => setShowNotif((s) => !s)}
          >
            <Animated.View style={{ transform: [{ scale: bellAnim }] }}>
              <Text style={{ fontSize: 18 }}>🔔</Text>
            </Animated.View>
            
            {/*  SYNC DOT */}
            <Animated.View
              style={[
                {
                  position: "absolute",
                  top: 7,
                  right: 7,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: isSynced ? "#34d399" : "#f87171",
                  transform: [{ scale: pulseAnim }],
                  ...(Platform.OS === "web"
                    ? ({ animation: "sk-pulse 2s infinite" } as any)
                    : {}),
                },
              ]}
            />
            
            {pendingTasks > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  backgroundColor: "#ef4444",
                  borderRadius: 10,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>
                  {pendingTasks}
                </Text>
              </View>
            )}
            {showNotif && (
              <NotifDropdown
                dark={dark}
                notifications={[]}
                pendingTasks={pendingTasks}
                streak={streak}
                onClose={() => setShowNotif(false)}
                onViewAll={() => {
                  setShowNotif(false);
                  router?.push("/notifications");
                }}
              />
            )}
          </Pressable>

          {/* Avatar + profile dropdown */}
          <View style={{ position: "relative" }}>
            <Pressable
              onPress={() => setShowDrop((s) => !s)}
              style={[
                {
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                },
                Platform.OS === "web"
                  ? ({
                      background: "linear-gradient(135deg,#f97316,#ef4444)",
                      boxShadow: "0 3px 14px rgba(239,68,68,0.35)",
                      cursor: "pointer",
                      outline: showDrop
                        ? "3px solid #6366f1"
                        : "3px solid transparent",
                      transform: [{ scale: showDrop ? 1.1 : 1 }],
                    } as any)
                  : { backgroundColor: "#f97316" },
              ]}
            >
              <Text style={{ color: "white", fontWeight: "900", fontSize: 15 }}>
                {(displayName || "U").charAt(0).toUpperCase()}
              </Text>
            </Pressable>
                       {showDrop && (
              <ProfileDrop
                dark={dark}
                displayName={displayName}
                email={email}
                overallPct={overallPct}
                streak={streak}
                userRole={userRole}
                onClose={() => setShowDrop(false)}
                onToggleDark={toggleDark}
                onShowV2={() => showComingSoon()}
                router={router}
                onLogoutReset={resetNotificationState}
                completedTasks={completedTasks}
                totalGoals={totalGoals}
              />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const tbSt = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    height: 70,
    borderBottomWidth: 1,
    flexShrink: 0,
    ...(Platform.OS === "web"
      ? ({ position: "sticky", top: 0, zIndex: 200 } as any)
      : {}),
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
    ...(Platform.OS === "web"
      ? ({ fontFamily: "Outfit,sans-serif" } as any)
      : {}),
  },
  hambBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  hambLine: { height: 2, borderRadius: 99 },
});

/* ════════════════════════════════
   MAIN ANALYTICS
════════════════════════════════ */
export default function Analytics() {
  const router = useRouter();
  const taskCtx = useContext(TaskContext);
  const authCtx = useContext(AuthContext);
  if (!taskCtx || !authCtx || !authCtx.user) return null;

  const { goals, getOverallProgress, getRecommendation } = taskCtx;
  const { user, userData } = authCtx;

  const [darkMode, setDarkMode] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState("Intern Developer");
  
  /* SYNC DOT */
  const [isSynced, setIsSynced] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadTheme().then(setDarkMode);
  }, []);

  /* Live Firestore — streak + role */
useEffect(() => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);

  const unsub = onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      setStreak(snap.data().streak || 0);
      setUserRole(snap.data().role || "Intern Developer");
    }
  });

  return unsub;
}, [user]);

  /*  PULSE ANIMATION */
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.6,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  /* Animations — original */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(36)).current;
  const hdrScale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 10 }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.spring(hdrScale,  { toValue: 1, useNativeDriver: true, tension: 80, friction: 9 }),
    ]).start();
  }, []);

  /* Computed stats */
  const totalGoals = goals.length;
  const totalTasks = goals.reduce((a: number, g: any) => a + g.tasks.length, 0);
  const completedTasks = goals.reduce((a: number, g: any) => a + g.tasks.filter((t: any) => t.completed).length, 0);
  const pendingTasks = totalTasks - completedTasks;
  const overallPct = getOverallProgress();
  const skillScore = Math.min(9999, completedTasks * 50 + totalGoals * 120 + streak * 15);

  /*  KEY FIX: Use userData from AuthContext like dashboard.tsx */
const displayName =
  userData?.displayName || user?.displayName || user?.email || "User";
  const userEmail = user?.email || "";

  /* Toggle dark mode */
  const toggleDark = async () => {
    const next = !darkMode;
    setDarkMode(next);
    await saveTheme(next);
  };

  /* Theme */
  const dark = !!darkMode;
  const bg = dark ? "#080d18" : "#eef1f8";
  const card = dark ? "#0d1424" : "#FFFFFF";
  const textPrimary = dark ? "#eef2ff" : "#0F172A";
  const textSecondary = dark ? "rgba(238,242,255,0.55)" : "#475569";
  const textMuted = dark ? "rgba(238,242,255,0.28)" : "rgba(15,23,42,0.3)";
  const cardBorder = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const cardSh = Platform.OS === "web"
    ? { boxShadow: dark ? "0 2px 16px rgba(0,0,0,0.4)" : "0 2px 12px rgba(0,0,0,0.05)" }
    : { elevation: 3 };

  const { width: screenW } = useWindowDimensions();
  const isWide = Platform.OS === "web" && screenW >= 960;
  const isWidish = Platform.OS === "web" && screenW >= 700;

  /* ── STAT CARDS data ── */
  const STATS = [
    { icon: "🎯", val: totalGoals, lbl: "Active Goals", sub: "All on track", color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
    { icon: "📋", val: totalTasks, lbl: "Total Tasks", sub: "Across goals", color: "#06b6d4", bg: "rgba(6,182,212,0.08)" },
    { icon: "✅", val: completedTasks, lbl: "Completed", sub: "+2 today", color: "#34d399", bg: "rgba(52,211,153,0.08)" },
    { icon: "⏳", val: pendingTasks, lbl: "Pending", sub: "Keep going!", color: "#f97316", bg: "rgba(249,115,22,0.08)" },
  ];

  /* ── INSIGHT SCORE ROWS ── */
  const SCORE_ROWS = [
    { lbl: "Tasks Done", val: `${totalTasks > 0 ? Math.round((completedTasks/totalTasks)*100) : 0}%`, pct: totalTasks > 0 ? (completedTasks/totalTasks)*100 : 0, color: "#34d399" },
    { lbl: "Goals Active", val: String(totalGoals), pct: Math.min(totalGoals * 20, 100), color: ACCENT },
    { lbl: "Streak", val: `${streak} day${streak !== 1 ? "s" : ""} 🔥`, pct: Math.min(streak * 10, 100), color: "#f97316" },
    { lbl: "Skill Score", val: String(skillScore), pct: Math.min(skillScore / 50, 100), color: "#fbbf24" },
  ];

  const mainContent = (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      <View style={[styles.wrapper, isWide ? { paddingTop: 20 } : {}]}>

        {/* Mobile/tablet header */}
        {!isWide && (
          <Animated.View style={[
            styles.header,
            Platform.OS === "web" ? { boxShadow: "0 14px 44px rgba(0,0,0,0.28)" } : { elevation: 12 },
            { transform: [{ scale: hdrScale }], opacity: fadeAnim },
          ]}>
            {Platform.OS === "web" && (
              <View pointerEvents="none" style={[StyleSheet.absoluteFill, {
                borderRadius: 20,
                background: "linear-gradient(135deg,#3730a3 0%,#6d28d9 55%,#9333ea 100%)",
              } as any]} />
            )}
            {Platform.OS !== "web" && (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: "#1e3a8a", borderRadius: 20 }]} />
            )}
            <View pointerEvents="none" style={[styles.orb, styles.orb1]} />
            <View pointerEvents="none" style={[styles.orb, styles.orb2]} />
            <View style={styles.hdrTop}>
              <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
                <Text style={styles.backTx}>← Back</Text>
              </Pressable>
              <View>
                <Text style={styles.hdrTitle}>Analytics</Text>
                <Text style={styles.hdrSub}>Your learning overview</Text>
              </View>
              <View style={{ width: 68 }} />
            </View>
            <View style={styles.hdrSummary}>
              {[
                { v: `${overallPct}%`, l: "Complete" },
                { v: String(completedTasks), l: "Tasks Done" },
                { v: String(totalGoals), l: "Active Goals" },
                { v: String(pendingTasks), l: "Remaining" },
              ].map((s, i) => (
                <View key={i} style={styles.hdrStat}>
                  <Text style={styles.hdrStatVal}>{s.v}</Text>
                  <Text style={styles.hdrStatLbl}>{s.l}</Text>
                </View>
              ))}
            </View>
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

          {/* ════ STAT CARDS — unified bordered container ════ */}
          <Animated.View style={[
            styles.statContainer,
            { backgroundColor: card, borderColor: cardBorder, ...cardSh },
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}>
            {STATS.map((s, i) => (
              <View key={i} style={[
                styles.statItem,
                i < STATS.length - 1 && { borderRightWidth: 1, borderRightColor: cardBorder },
              ]}>
                {/* Color accent line top */}
                {Platform.OS === "web" && (
                  <View style={{ position: "absolute", top: 0, left: 16, right: 16, height: 3, borderRadius: 99, backgroundColor: s.color, opacity: 0.7 } as any} />
                )}
                {/* Glow orb */}
                {Platform.OS === "web" && (
                  <View pointerEvents="none" style={{ position: "absolute", top: -8, right: -8, width: 50, height: 50, borderRadius: 25, backgroundColor: s.color, filter: "blur(16px)", opacity: 0.13 } as any} />
                )}
                <View style={[styles.statIconWrap, { backgroundColor: s.bg },
                  Platform.OS === "web" ? { animation: "sk-breathe 3s ease-in-out infinite" } as any : {}]}>
                  <Text style={{ fontSize: 20 }}>{s.icon}</Text>
                </View>
                <CountUp to={s.val} color={s.color} size={28} />
                <Text style={[styles.statLbl, { color: textSecondary }]}>{s.lbl}</Text>
                <Text style={{ fontSize: 10, color: s.color, fontWeight: "700", marginTop: 2 }}>↑ {s.sub}</Text>
              </View>
            ))}
          </Animated.View>

          {/* ════ DONUT + INSIGHT ROW ════ */}
          <View style={isWidish ? styles.midRowWide : styles.midRowNarrow}>

            {/* Task Distribution */}
            <Animated.View className={Platform.OS === "web" ? "sk-hov" : undefined}
              style={[styles.card, isWidish ? styles.cardHalf : styles.cardFull,
                { backgroundColor: card, borderColor: cardBorder, ...cardSh },
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.cardHdr}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(99,102,241,0.1)", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 16 }}>📊</Text>
                  </View>
                  <Text style={[styles.cardTitle, { color: textPrimary }]}>Task Distribution</Text>
                </View>
                <View style={[styles.cardBadge, { backgroundColor: "rgba(99,102,241,0.1)" }]}>
                  <Text style={{ fontSize: 10, color: ACCENT, fontWeight: "700" }}>{totalTasks} total</Text>
                </View>
              </View>
              <View style={[styles.donutRow, { marginTop: 8 }]}>
                <DonutChart completed={completedTasks} total={totalTasks} color={dark ? "#fff" : "#0f172a"} />
                <View style={styles.legend}>
                  {[
                    { lbl: "Completed", val: completedTasks, color: "#34d399" },
                    { lbl: "Pending", val: pendingTasks, color: "#f87171" },
                    { lbl: "Total", val: totalTasks, color: ACCENT },
                  ].map((item, i) => (
                    <Animated.View key={i} style={[styles.legendItem,
                      { opacity: fadeAnim, transform: [{ translateX: Animated.add(slideAnim, new Animated.Value(i * 4)) }] }]}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <View>
                        <Text style={[styles.legendVal, { color: textPrimary }]}>{item.val}</Text>
                        <Text style={[styles.legendLbl, { color: textSecondary }]}>{item.lbl}</Text>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </View>
            </Animated.View>

            {/* Insight */}
            <Animated.View className={Platform.OS === "web" ? "sk-hov" : undefined}
              style={[styles.card, isWidish ? styles.cardHalf : styles.cardFull,
                { backgroundColor: dark ? "rgba(99,102,241,0.08)" : "#EFF6FF",
                  borderColor: dark ? "rgba(99,102,241,0.22)" : "rgba(37,99,235,0.12)",
                  borderLeftColor: ACCENT, borderLeftWidth: 4, ...cardSh },
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={[styles.cardHdr, { marginBottom: 10 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(99,102,241,0.12)", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 16 }}>💡</Text>
                  </View>
                  <Text style={[styles.cardTitle, { color: textPrimary }]}>Insight</Text>
                </View>
              </View>

              <Text style={[styles.insightTx, { color: textSecondary, marginBottom: 16 }]}>{getRecommendation()}</Text>
              {/* Score rows — each label+value+bar as one unit */}
              {SCORE_ROWS.map((row, i) => (
                <View key={i} style={{ marginBottom: i < SCORE_ROWS.length - 1 ? 14 : 0 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <Text style={[styles.scoreLbl, { color: textSecondary }]}>{row.lbl}</Text>
                    <Text style={[styles.scoreVal, { color: row.color }]}>{row.val}</Text>
                  </View>
                  <ShimmerBar pct={row.pct} color={row.color} h={6} />
                </View>
              ))}
            </Animated.View>
          </View>

          {/* ════ GOAL BREAKDOWN ════ */}
          {goals.length > 0 && (
            <Animated.View className={Platform.OS === "web" ? "sk-hov" : undefined}
              style={[styles.card, styles.cardFull,
                { backgroundColor: card, borderColor: cardBorder, ...cardSh },
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={[styles.cardHdr, { marginBottom: 16 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(52,211,153,0.1)", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 16 }}>📈</Text>
                  </View>
                  <Text style={[styles.cardTitle, { color: textPrimary }]}>Goal Breakdown</Text>
                </View>
                <View style={[styles.cardBadge, { backgroundColor: "rgba(52,211,153,0.1)" }]}>
                  <Text style={{ fontSize: 10, color: "#34d399", fontWeight: "700" }}>{totalGoals} active</Text>
                </View>
              </View>
              {goals.map((g: any, i: number) => {
                const accent = GOAL_COLORS[i % GOAL_COLORS.length];
                const done = g.tasks.filter((t: any) => t.completed).length;
                const total = g.tasks.length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
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

          {/* Empty state */}
          {goals.length === 0 && (
            <Animated.View style={[styles.card, styles.cardFull,
              { backgroundColor: card, borderColor: cardBorder, alignItems: "center", paddingVertical: 40, ...cardSh },
              { opacity: fadeAnim }]}>
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

  if (isWide) {
    return (
      <View style={[wSt.root, { backgroundColor: bg }]}>
        {Platform.OS === "web" ? (
          <View className="sk-sidebar" style={{ width: sidebarOpen ? 260 : 0, minWidth: sidebarOpen ? 260 : 0, overflow: "hidden" } as any}>
            <Sidebar dark={dark} router={router} overallPct={overallPct} completedTasks={completedTasks} totalTasks={totalTasks} userRole={userRole} displayName={displayName} userEmail={userEmail} />
          </View>
        ) : (
          <Sidebar dark={dark} router={router} overallPct={overallPct} completedTasks={completedTasks} totalTasks={totalTasks} userRole={userRole} displayName={displayName} userEmail={userEmail} />
        )}
        <View style={wSt.center}>
          <TopBar
         dark={dark}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        toggleDark={toggleDark}
        router={router}
        displayName={displayName}
        email={userEmail}
        streak={streak}
        overallPct={overallPct}
        userRole={userRole}
        goals={goals}
        isSynced={isSynced}
        pulseAnim={pulseAnim}
        completedTasks={completedTasks}
        totalGoals={totalGoals}
        />
          {mainContent}
        </View>
      </View>
    );
  }
  return mainContent;
}

const wSt = StyleSheet.create({
  root: { flex: 1, flexDirection: "row" } as any,
  center: { flex: 1, flexDirection: "column" as const, minWidth: 0 },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  wrapper: { flex: 1, width: "100%", paddingHorizontal: 18, paddingTop: Platform.OS === "ios" ? 52 : 14 },

  header: { borderRadius: 24, paddingHorizontal: 22, paddingTop: Platform.OS === "ios" ? 56 : 18, paddingBottom: 22, marginBottom: 14, overflow: "hidden", position: "relative", backgroundColor: "#1e3a8a" },
  orb: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.07)" } as any,
  orb1: { width: 220, height: 220, top: -70, right: -50 },
  orb2: { width: 120, height: 120, bottom: -40, right: 120 },

  hdrTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18, zIndex: 1 },
  backBtn: { backgroundColor: "rgba(255,255,255,0.14)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.22)" },
  backTx: { color: "white", fontWeight: "700", fontSize: 13 },
  hdrTitle: { color: "white", fontSize: 20, fontWeight: "900", textAlign: "center", letterSpacing: -0.4, ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}) },
  hdrSub: { color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "500", textAlign: "center" },
  hdrSummary: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", zIndex: 1 },
  hdrStat: { alignItems: "center" },
  hdrStatVal: { color: "white", fontSize: 22, fontWeight: "900", ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}) },
  hdrStatLbl: { color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: "500", marginTop: 2 },
  hdrDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.2)" },
  hdrProgRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  hdrProgLbl: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "600" },
  hdrProgPct: { color: "white", fontSize: 12, fontWeight: "800" },

  /* ── Unified stat cards container ── */
  statContainer: {
    flexDirection: "row", borderRadius: 20, borderWidth: 1,
    marginBottom: 14, overflow: "hidden",
  },
  statItem: {
    flex: 1, paddingVertical: 22, paddingHorizontal: 12,
    alignItems: "center", gap: 6, position: "relative", overflow: "hidden",
  },
  statIconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  statLbl: { fontSize: 12, fontWeight: "600", textAlign: "center" as const },

  midRowWide: { flexDirection: "row", gap: 14, marginBottom: 12 } as any,
  midRowNarrow: { flexDirection: "column", marginBottom: 0 },

  card: { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 14 },
  cardFull: { width: "100%" },
  cardHalf: { flex: 1 },
  cardHdr: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3, ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}) },
  cardBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },

  donutRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  legend: { gap: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  legendDot: { width: 11, height: 11, borderRadius: 6 },
  legendVal: { fontSize: 16, fontWeight: "900", ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}) },
  legendLbl: { fontSize: 11, fontWeight: "500" },

  insightTx: { fontSize: 14, fontWeight: "500", lineHeight: 22 },
  scoreLbl: { fontSize: 12, fontWeight: "600" },
  scoreVal: { fontSize: 13, fontWeight: "800" },

  goalRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  goalEmoji: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  goalRowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goalName: { fontSize: 14, fontWeight: "700", flex: 1 },
  goalPct: { fontSize: 13, fontWeight: "800" },
  goalMeta: { fontSize: 11, fontWeight: "500" },
});