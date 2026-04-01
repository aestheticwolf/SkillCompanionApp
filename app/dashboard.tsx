import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  doc,
  increment as fsIncrement,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { useContext, useEffect, useRef, useState } from "react";
import { useWindowDimensions } from "react-native";
import SkillPathLogo from "../src/components/SkillPathLogo";
import { COLORS } from "../src/constants/theme";
import { AuthContext } from "../src/context/AuthContext";
import { TaskContext } from "../src/context/TaskContext";
import { auth, db } from "../src/services/firebase";
import { listenToNetwork } from "../src/services/network";
import {
  requestNotificationPermission,
  requestWebNotificationPermission,
  scheduleDailyReminder,
  sendWebTestNotification,
} from "../src/services/notifications";
import { updateStreak } from "../src/services/streak";
import {
  showComingSoon,
  showDelete,
  showError,
  showSuccess,
} from "../src/services/toast";
import { loadTheme, saveTheme } from "../src/services/uiPreferences";

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
@keyframes sk-glow-today {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 3px 1px rgba(239,68,68,0.3),
                0 0 6px 1px rgba(239,68,68,0.12);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 0 5px 2px rgba(239,68,68,0.5),
                0 0 10px 3px rgba(239,68,68,0.22);
  }
}

@keyframes sk-legend-today {
  0%,100% { box-shadow: 0 0 2px 1px rgba(239,68,68,0.3); }
  50%      { box-shadow: 0 0 4px 2px rgba(239,68,68,0.55), 0 0 8px 3px rgba(239,68,68,0.2); }
}
.sk-legend-today-dot {
  animation: sk-legend-today 1.8s cubic-bezier(0.215,0.61,0.355,1) infinite;
}
  
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
      .sk-cell:hover{transform:scale(1.4)!important;z-index:2;border-radius:4px}
      @keyframes sk-heatIn{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
      .sk-cell{transition:transform .12s,box-shadow .12s;animation:sk-heatIn .15s ease both}
      .sk-cell:hover{transform:scale(1.5)!important;z-index:10!important;border-radius:4px!important;box-shadow:0 2px 8px rgba(99,102,241,0.4)!important}
     .sk-cell-today {
  animation: sk-glow-today 0.9s ease-in-out infinite;
  will-change: transform, box-shadow;
  transform-origin: center;
   transform: translateZ(0);
   display: inline-block;
}

      /* ── Professional dark mode surface refinements ── */
      .sk-dark-screen {
        background-image:
          radial-gradient(ellipse 70% 45% at 15% 0%, rgba(99,102,241,0.045) 0%, transparent 65%),
          radial-gradient(ellipse 55% 35% at 85% 100%, rgba(99,102,241,0.03) 0%, transparent 65%);
      }
      .sk-dark-sidebar {
        background-image: linear-gradient(180deg, rgba(99,102,241,0.04) 0%, transparent 35%);
      }
      .sk-dark-topbar {
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
      }
      .sk-dark-card {
        background-image: linear-gradient(145deg, rgba(255,255,255,0.02) 0%, transparent 55%);
      }
      .sk-dark-hero {
        background-image:
          radial-gradient(ellipse 60% 80% at 90% 50%, rgba(99,102,241,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 40% 60% at 10% 20%, rgba(79,70,229,0.08) 0%, transparent 50%);
      }
    `;
    document.head.appendChild(s);
  }
}

/* ─── Constants ─── */
const GOAL_COLORS = [
  "#6366f1",
  "#f97316",
  "#06b6d4",
  "#a78bfa",
  "#fbbf24",
  "#34d399",
  "#3b82f6",
  "#ec4899",
];
const GOAL_EMOJIS = ["☕", "🦋", "⚛️", "🔥", "🎨", "🚀", "📚", "🎯"];
const SIDEBAR_W = 260;
const RIGHT_W = 340;

/* ════════════════════════════════
   SHIMMER BAR
════════════════════════════════ */
function ShimmerBar({
  pct,
  color,
  h = 6,
}: {
  pct: number;
  color: string;
  h?: number;
}) {
  const x = useRef(new Animated.Value(-1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(x, { toValue: 2, duration: 1800, useNativeDriver: true }),
    ).start();
  }, []);

  if (Platform.OS !== "web") {
    return (
      <View
        style={{
          height: h,
          borderRadius: 99,
          backgroundColor: "rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${pct}%` as any,
            backgroundColor: color,
            borderRadius: 99,
          }}
        />
      </View>
    );
  }
  return (
    <View
      style={
        {
          height: h,
          borderRadius: 99,
          backgroundColor: "rgba(0,0,0,0.07)",
          overflow: "hidden",
        } as any
      }
    >
      <View
        style={
          {
            height: "100%",
            width: `${pct}%`,
            backgroundColor: color,
            borderRadius: 99,
            position: "relative",
            overflow: "hidden",
          } as any
        }
      >
        <Animated.View
          style={
            {
              position: "absolute",
              top: 0,
              bottom: 0,
              width: "45%",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
              transform: [
                {
                  translateX: x.interpolate({
                    inputRange: [-1, 2],
                    outputRange: ["-100%", "280%"],
                  }),
                },
              ],
            } as any
          }
        />
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
      setPts((p) => [
        ...p.slice(-12),
        { id: Date.now(), x: Math.random() * 80 + 10 },
      ]);
    }, 500);
    return () => clearInterval(id);
  }, []);
  if (Platform.OS !== "web") return null;
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { overflow: "hidden", borderRadius: "inherit" } as any,
      ]}
    >
      {pts.map((p) => (
        <View
          key={p.id}
          style={
            {
              position: "absolute",
              bottom: 0,
              left: `${p.x}%` as any,
              width: 5,
              height: 5,
              borderRadius: 3,
              backgroundColor: "rgba(255,255,255,0.55)",
              animation: "sk-particle 1.5s ease-out forwards",
            } as any
          }
        />
      ))}
    </View>
  );
}
function Sidebar({
  dark,
  router,
  activeRoute,
  overallPct,
  displayName,
  isSynced,
  goals,
  completedTasks,
  totalTasks,
  userRole,
}: any) {
  const bg = dark ? "#141720" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const txtPrim = dark ? "#eef2ff" : "#0f172a";
  const txtMute = dark ? "rgba(238,242,255,0.45)" : "rgba(15,23,42,0.45)";

  const pendingCount = goals.reduce((acc: number, goal: any) => {
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
          ),
      ).length
    );
  }, 0);

  const NAV = [
    { icon: "🏠", label: "Dashboard", route: "/dashboard" },
    { icon: "📊", label: "Analytics", route: "/analytics" },
    {
      icon: "🔔",
      label: "Reminders",
      route: "/notifications",
      badge: pendingCount,
    },
    { icon: "⚙️", label: "Settings", route: "/settings" },
  ];

  const initials = displayName.charAt(0).toUpperCase();

  return (
    <View
      style={[
        sidebarSt.wrap,
        { backgroundColor: bg, borderRightColor: border },
      ]}
    >
      {/* Logo */}
      <View style={sidebarSt.logoRow}>
        <View
          style={[
            sidebarSt.logoIcon,
            Platform.OS === "web"
              ? ({ animation: "sk-glow 3s ease-in-out infinite" } as any)
              : {},
          ]}
        >
          <SkillPathLogo size={48} />
        </View>
        <View>
          <Text
            style={[
              sidebarSt.logoName,
              Platform.OS === "web"
                ? ({
                    background:
                      "linear-gradient(90deg,#FF5C5C,#FFCA3A,#14D9C5)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  } as any)
                : { color: "#FF5C5C" },
            ]}
          >
            SkillPath
          </Text>
          <Text style={[sidebarSt.logoSub, { color: txtMute }]}>
            Learning Companion
          </Text>
        </View>
      </View>

      {/* Nav */}
      <Text style={[sidebarSt.navLabel, { color: txtMute }]}>NAVIGATION</Text>
      {NAV.map((n, i) => {
        const active = n.route === "/dashboard";
        return (
          <Pressable
            key={i}
            onPress={() => {
              // if (n.v2) {
              //   showComingSoon();
              //   return;
              // }
              n.route && router.push(n.route);
            }}
            style={({ pressed }) => [
              sidebarSt.navItem,
              active && {
                backgroundColor: dark
                  ? "rgba(99,102,241,0.14)"
                  : "rgba(99,102,241,0.08)",
              },
              // n.v2 && { opacity: 0.55 },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text style={{ fontSize: 16 }}>{n.icon}</Text>
            <Text
  style={[
    sidebarSt.navTx,
    {
      color: active ? "#6366f1" : txtPrim,   // 👈 FIX
      fontWeight: active ? "700" : "500",
    },
  ]}
>
  {n.label}
</Text>
            {active && <View style={sidebarSt.activeBar} />}
            {/* {n.v2 && (
              <View
                style={{
                  backgroundColor: "rgba(99,102,241,0.12)",
                  borderRadius: 99,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{ fontSize: 9, fontWeight: "700", color: "#6366f1" }}
                >
                  v2
                </Text>
              </View>
            )} */}
            {/* {!n.v2 && !!n.badge && (
              <View style={sidebarSt.badge}>
                <Text style={sidebarSt.badgeTx}>{n.badge}</Text>
              </View>
            )} */}
          </Pressable>
        );
      })}

      <View style={{ flex: 1 }} />

      {/* Overall progress */}
      <View
        style={[
          sidebarSt.progCard,
          {
            backgroundColor: dark
              ? "rgba(99,102,241,0.08)"
              : "rgba(99,102,241,0.06)",
            borderColor: border,
          },
        ]}
      >
        <Text style={[sidebarSt.progLabel, { color: txtMute }]}>
          OVERALL PROGRESS
        </Text>
        <View style={sidebarSt.progRingRow}>
          <View
            style={[
              sidebarSt.progRing,
              Platform.OS === "web"
                ? ({
                    background: `conic-gradient(#6366f1 ${overallPct * 3.6}deg, ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"} 0deg)`,
                  } as any)
                : { borderWidth: 5, borderColor: "#6366f1" },
            ]}
          >
            <View
              style={[
                sidebarSt.progRingIn,
                { backgroundColor: dark ? "#0a0f20" : "#f5f7ff" },
              ]}
            >
              <Text style={[sidebarSt.progPct, { color: "#6366f1" }]}>
                {overallPct}%
              </Text>
            </View>
          </View>
          <View>
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
  <Text style={[sidebarSt.progDone, { color: txtPrim }]}>
    {completedTasks}
  </Text>

  <Text
  style={{
    fontSize: 13,
    fontWeight: "500",       
    color: txtPrim,           
    opacity: 0.9,             
    marginLeft: 2,
  }}
>
  /{totalTasks}
</Text>
</View>
            <Text style={[sidebarSt.progSub, { color: txtMute }]}>
              tasks done
            </Text>
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
          <Text
            style={[sidebarSt.userName, { color: txtPrim }]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text style={[sidebarSt.userRole, { color: txtMute }]}>
            {userRole || "Intern Developer"}
          </Text>
        </View>
        <View
          style={[
            sidebarSt.onlineDot,
            { backgroundColor: isSynced ? "#34d399" : "#f87171" },
            Platform.OS === "web"
              ? ({ animation: "sk-pulse 2s infinite" } as any)
              : {},
          ]}
        />
      </View>
    </View>
  );
}

const sidebarSt = StyleSheet.create({
  wrap: {
    width: SIDEBAR_W,
    height: "100%" as any,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    flexShrink: 0,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web"
      ? ({
          filter: "drop-shadow(0 4px 12px rgba(99,102,241,0.35))",
          animation: "sk-breathe 3s ease-in-out infinite",
        } as any)
      : {}),
  },
  logoName: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.5,
    ...(Platform.OS === "web"
      ? ({ fontFamily: "Outfit,sans-serif" } as any)
      : {}),
  },
  logoSub: { fontSize: 11, fontWeight: "500" },
  navLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
    paddingLeft: 8,
    textTransform: "uppercase" as const,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    position: "relative",
    ...(Platform.OS === "web"
      ? ({ cursor: "pointer", transition: "background .15s" } as any)
      : {}),
  },
  navTx: { fontSize: 14, flex: 1 },
  activeBar: {
    width: 4,
    height: 20,
    backgroundColor: "#6366f1",
    borderRadius: 99,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 0 8px rgba(99,102,241,0.5)" } as any)
      : {}),
  },
  badge: {
    backgroundColor: "#ef4444",
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeTx: { color: "white", fontSize: 10, fontWeight: "800" },

  progCard: { borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1 },
  progLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
    color: "#6366f1",
    textTransform: "uppercase" as const,
  },
  progRingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  progRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  progRingIn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  progPct: { fontSize: 11, fontWeight: "800" },
  progDone: {
    fontSize: 20,
    fontWeight: "800",
    ...(Platform.OS === "web"
      ? ({ fontFamily: "Outfit,sans-serif" } as any)
      : {}),
  },
  progLight: {
  fontSize: 13,
  fontWeight: "500",
  opacity: 0.7,
},
  progSub: { fontSize: 11, fontWeight: "500" },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 0,
    borderTopWidth: 0,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web"
      ? ({ background: "linear-gradient(135deg,#f97316,#ef4444)" } as any)
      : {}),
    backgroundColor: "#f97316",
  },
  userInitial: { color: "white", fontWeight: "800", fontSize: 15 },
  userName: { fontSize: 13, fontWeight: "700" },
  userRole: { fontSize: 11, fontWeight: "500" },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    ...(Platform.OS === "web"
      ? ({ animation: "sk-pulse 2s infinite" } as any)
      : {}),
  },
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
  skillScore,
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
        //
        router.push("/settings");
        onClose();
      },
      // v2: true,
    },
    {
      icon: dark ? "☀️" : "🌙",
      label: dark ? "Light Mode" : "Dark Mode",
      sub: dark ? "Switch to light" : "Switch to dark",
      fn: () => {
        onToggleDark(); /* no onClose */
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
              {email || "richard@intern.dev"}
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
            { v: `${skillScore || 0}⭐`, l: "Score" },
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
   NOTIFICATION DROPDOWN (TopBar)
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

  /* close on outside click */
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

/* ════════════════════════════════
   TOP BAR (web wide)
════════════════════════════════ */
function TopBar({
  dark,
  router,
  displayName,
  email,
  darkMode,
  setDarkMode,
  isSynced,
  pulseAnim,
  overallPct,
  streak,
  sidebarOpen,
  setSidebarOpen,
  userRole,
  onShowV2,
  totalTasks,
  completedTasks,
  goals,
  skillScore,
}: any) {
  const bg = dark ? "#0a0f20" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const txtPri = dark ? "#eef2ff" : "#0f172a";
  const txtSec = dark ? "rgba(238,242,255,0.5)" : "rgba(15,23,42,0.5)";

  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { user } = useContext(AuthContext);
  const hasNotified = useRef(false);
  const bellAnim = useRef(new Animated.Value(1)).current;


const resetNotificationState = () => {
  hasNotified.current = false;
};

  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );

  const [seconds, setSeconds] = useState(() => new Date().getSeconds());

  const [showDrop, setShowDrop] = useState(false);

  const pendingTasks = goals.reduce((acc: number, goal: any) => {
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
          ),
      ).length
    );
  }, 0);

  useEffect(() => {
    const pending = pendingTasks;

    const newNotifs: any[] = [];

    if (pending === 0 && totalTasks > 0) {
      // don't add notification → keeps badge = 0
    } else {
      if (pending > 0) {
        newNotifs.push({
          id: "pending",
          text: `${pending} tasks pending`,
          icon: "📌",
        });
      }

      if (streak > 0) {
        newNotifs.push({
          id: "streak",
          text: `${streak} day streak`,
          icon: "🔥",
        });
      }
    }

    setNotifications(newNotifs);
  }, [pendingTasks, streak, totalTasks]);

useEffect(() => {
  if (!user) return;

  // ✅ only notify if actual pending work
  if (pendingTasks === 0) return;

  // ✅ only once per session
  if (hasNotified.current) return;

  hasNotified.current = true;

  Animated.sequence([
    Animated.timing(bellAnim, {
      toValue: 1.3,
      duration: 200,
      useNativeDriver: true,
    }),
    Animated.timing(bellAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }),
  ]).start();

  const triggerNotification = async () => {
    if (Platform.OS === "web") {
      const granted = await requestWebNotificationPermission();
      if (granted) {
        sendWebTestNotification(pendingTasks, streak);
      }
    } else {
      const granted = await requestNotificationPermission();
      if (granted) {
        await scheduleDailyReminder(9, 0);
      }
    }
  };

    triggerNotification();
  }, [pendingTasks, user]);

  useEffect(() => {
    const tm = setInterval(() => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      );
      setSeconds(now.getSeconds());
    }, 1000);

    return () => clearInterval(tm);
  }, []);

  const hour = new Date().getHours();
  const greet =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <View
      style={[
        topBarSt.wrap,
        { backgroundColor: bg, borderBottomColor: border },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        {/* Sidebar hamburger toggle */}
        <Pressable
          className={Platform.OS === "web" ? "sk-hamb" : undefined}
          onPress={() => setSidebarOpen((s: boolean) => !s)}
          style={[
            topBarSt.hambBtn,
            {
              backgroundColor: sidebarOpen
                ? dark
                  ? "rgba(99,102,241,0.14)"
                  : "rgba(99,102,241,0.08)"
                : "transparent",
              borderColor: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
            },
          ]}
        >
          <View style={{ gap: 4 }}>
            <View
              style={[
                topBarSt.hambLine,
                {
                  backgroundColor: sidebarOpen
                    ? "#6366f1"
                    : dark
                      ? "rgba(238,242,255,0.6)"
                      : "rgba(15,23,42,0.5)",
                  width: sidebarOpen ? 14 : 18,
                },
              ]}
            />
            <View
              style={[
                topBarSt.hambLine,
                {
                  backgroundColor: sidebarOpen
                    ? "#6366f1"
                    : dark
                      ? "rgba(238,242,255,0.6)"
                      : "rgba(15,23,42,0.5)",
                  width: 14,
                },
              ]}
            />
            <View
              style={[
                topBarSt.hambLine,
                {
                  backgroundColor: sidebarOpen
                    ? "#6366f1"
                    : dark
                      ? "rgba(238,242,255,0.6)"
                      : "rgba(15,23,42,0.5)",
                  width: sidebarOpen ? 18 : 10,
                },
              ]}
            />
          </View>
        </Pressable>
        <View>
          <Text style={[topBarSt.title, { color: txtPri }]}>Dashboard</Text>
          <Text style={[topBarSt.sub, { color: txtSec }]}>
            {greet} 🌟 {displayName}
          </Text>
        </View>
      </View>
      <View style={topBarSt.right}>
        {Platform.OS === "web" ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: border,
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
                  ...(Platform.OS === "web"
                    ? ({ fontFamily: "Outfit,sans-serif" } as any)
                    : {}),
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
        ) : (
          <Text style={[topBarSt.time, { color: txtSec }]}>{time}</Text>
        )}
        {/* Dark mode toggle pill */}
        {Platform.OS === "web" ? (
          <Pressable
            onPress={async () => {
              setDarkMode(!dark);
              await saveTheme(!dark);
            }}
            style={
              {
                width: 44,
                height: 26,
                borderRadius: 99,
                backgroundColor: dark ? "#6366f1" : "rgba(0,0,0,0.1)",
                justifyContent: "center",
                position: "relative",
              } as any
            }
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
        ) : (
          <View style={topBarSt.toggleWrap}>
            <Text style={{ fontSize: 12 }}>{dark ? "🌙" : "☀️"}</Text>
            <Switch
              value={dark}
              onValueChange={async (v) => {
                setDarkMode(v);
                await saveTheme(v);
              }}
              trackColor={{ false: "rgba(0,0,0,0.12)", true: "#6366f1" }}
              thumbColor="#ffffff"
              style={{ transform: [{ scaleX: 0.78 }, { scaleY: 0.78 }] }}
            />
          </View>
        )}

        {/* Bell */}
        <Pressable
          style={topBarSt.notifBtn}
          onPress={() => setShowNotif((s) => !s)}
        >
          <Animated.View style={{ transform: [{ scale: bellAnim }] }}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
          </Animated.View>
          <Animated.View
            style={[
              topBarSt.notifDot,
              {
                backgroundColor: isSynced ? "#34d399" : "#f87171",
                transform: [{ scale: pulseAnim }],
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
                ...(Platform.OS === "web"
                  ? ({ animation: "sk-pulse 2s infinite" } as any)
                  : {}),
              }}
            >
              <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>
                {pendingTasks}
              </Text>
            </View>
          )}
        </Pressable>

        {showNotif && (
          <NotifDropdown
            dark={dark}
            notifications={notifications}
            pendingTasks={pendingTasks}
            streak={streak}
            onClose={() => setShowNotif(false)}
            onViewAll={() => {
              setShowNotif(false);
              router.push("/notifications");
            }}
          />
        )}

        {/* Avatar + dropdown */}
        <View style={{ position: "relative" }}>
          <Pressable
            onPress={() => setShowDrop((s) => !s)}
            style={({ pressed }) => [
              topBarSt.avatar,
              { backgroundColor: "#f97316" },
              pressed && { opacity: 0.85 },
              Platform.OS === "web"
                ? ({
                    background: "linear-gradient(135deg,#f97316,#ef4444)",
                    boxShadow: "0 3px 14px rgba(239,68,68,0.35)",
                    outline: showDrop
                      ? "3px solid #6366f1"
                      : "3px solid transparent",
                    transform: [{ scale: showDrop ? 1.1 : 1 }],
                  } as any)
                : {},
            ]}
          >
            <Text style={topBarSt.avatarTx}>{initials}</Text>
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
              onToggleDark={async () => {
                setDarkMode(!dark);
                await saveTheme(!dark);
              }}
              onShowV2={onShowV2}
              router={router}
              onLogoutReset={resetNotificationState}
              skillScore={skillScore} 
            />
          )}
        </View>
      </View>
    </View>
  );
}

const topBarSt = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 0,
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
  sub: { fontSize: 12, fontWeight: "500", marginTop: 1 },
  right: { flexDirection: "row", alignItems: "center", gap: 10 },
  time: {
    fontSize: 13,
    fontWeight: "700",
    ...(Platform.OS === "web"
      ? ({
          padding: "6px 14px",
          borderRadius: 99,
          border: "1.5px solid rgba(99,102,241,0.18)",
          background:
            "linear-gradient(135deg,rgba(99,102,241,0.07),rgba(167,139,250,0.05))",
          color: "#6366f1",
          letterSpacing: "0.02em",
          fontFamily: "Outfit,sans-serif",
        } as any)
      : {}),
  },
  toggleWrap: { flexDirection: "row", alignItems: "center", gap: 3 },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  notifDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  avatarTx: { color: "white", fontWeight: "900", fontSize: 15 },
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
   HERO BANNER (web wide)
════════════════════════════════ */
function HeroBanner({
  dark,
  displayName,
  overallPct,
  isSynced,
  fadeAnim,
  slideAnim,
}: any) {
  /* Blinking dot animation */
  const blinkAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const getDynamicMessage = () => {
    if (overallPct === 100)
      return "Perfect score! 🏆 You've completed everything.";
    if (overallPct >= 75) return "Excellent progress! 🚀 You're almost there.";
    if (overallPct >= 50) return "Nice momentum. 🔥 Keep pushing forward.";
    if (overallPct >= 25) return "Good start! 💪 Stay consistent.";
    return "Let’s get moving! 🌱 Start small and build momentum.";
  };

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
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 18,
              background:
                "linear-gradient(135deg,#3730a3 0%,#6d28d9 55%,#9333ea 100%)",
            } as any,
          ]}
        />
      )}
      {Platform.OS !== "web" && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "#1e3a8a", borderRadius: 18 },
          ]}
        />
      )}
      <View
        pointerEvents="none"
        style={[
          herSt.orb,
          { width: 220, height: 220, top: -60, right: -40 },
          Platform.OS === "web"
            ? ({ animation: "sk-float 4s ease-in-out infinite" } as any)
            : {},
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          herSt.orb,
          { width: 120, height: 120, bottom: -40, right: 180 },
          Platform.OS === "web"
            ? ({ animation: "sk-float 5s ease-in-out infinite reverse" } as any)
            : {},
        ]}
      />

      <View style={herSt.inner}>
        <Particles />
        {/* Blinking badge */}
        <View style={herSt.badge}>
          <Animated.View
            style={[
              herSt.badgeDot,
              {
                backgroundColor: isSynced ? "#34d399" : "#f87171",
                opacity: blinkAnim,
              },
            ]}
          />
          <Text
            style={[
              herSt.badgeTx,
              { color: isSynced ? "rgba(255,255,255,0.85)" : "#fca5a5" },
            ]}
          >
            {isSynced ? "SYNCED & ACTIVE" : "OFFLINE"}
          </Text>
        </View>
        <Text style={herSt.title}>Welcome back, {displayName}!</Text>
        {/* <Text style={herSt.sub}>
          You're {overallPct}% through your learning goals. Keep pushing —{"\n"}
          consistency is your superpower.
        </Text> */}

        <Text style={herSt.sub}>
          You're {overallPct}% through your learning goals. Keep pushing —{"\n"}
          {getDynamicMessage()}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View
            style={
              {
                height: 8,
                width: 260,
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 99,
                overflow: "hidden",
              } as any
            }
          >
            {Platform.OS === "web" ? (
              <View
                style={
                  {
                    height: "100%",
                    width: `${overallPct}%`,
                    borderRadius: 99,
                    background: "linear-gradient(90deg,#34d399,#a7f3d0)",
                    boxShadow: "0 0 10px rgba(52,211,153,0.55)",
                    transition: "width 1.2s",
                  } as any
                }
              />
            ) : (
              <View
                style={{
                  height: "100%",
                  width: `${overallPct}%` as any,
                  backgroundColor: "#34d399",
                  borderRadius: 99,
                }}
              />
            )}
          </View>
          <Text style={herSt.pctTx}>{overallPct}% complete</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const herSt = StyleSheet.create({
  wrap: {
    borderRadius: 24,
    padding: 28,
    paddingVertical: 32,
    marginBottom: 28,
    overflow: "hidden",
    position: "relative",
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
  } as any,
  inner: { zIndex: 1 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  badgeTx: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginBottom: 6,
    ...(Platform.OS === "web"
      ? ({
          fontFamily: "Outfit,sans-serif",
          fontSize: "clamp(22px,3vw,34px)",
        } as any)
      : {}),
  },
  sub: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
    maxWidth: 480,
    marginBottom: 20,
  },
  pctTx: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 0,
    ...(Platform.OS === "web"
      ? ({ fontFamily: "Outfit,sans-serif" } as any)
      : {}),
  },
});

/* ════════════════════════════════
   STREAK TIMER — Snapchat‑style expiry ring
════════════════════════════════ */
function StreakTimer({
  streak,
  activityToday,
  dark,
}: {
  streak: number;
  activityToday: boolean;
  dark: boolean;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const msLeft = midnight.getTime() - now.getTime();
  const hoursLeft = msLeft / 3600000;
  const pct = msLeft / 86400000; // fraction of day remaining
  const urgent = hoursLeft < 3 && streak > 0 && !activityToday;
  const warning = hoursLeft < 8 && streak > 0 && !activityToday;

  if (streak === 0 || Platform.OS !== "web") return null;

  const r = 22,
    cx = 26,
    cy = 26,
    circ = 2 * Math.PI * r;
  const dash = pct * circ;

  const ringColor = urgent ? "#ef4444" : warning ? "#f97316" : "#34d399";
  const glowColor = urgent
    ? "rgba(239,68,68,0.6)"
    : warning
      ? "rgba(249,115,22,0.5)"
      : "rgba(52,211,153,0.4)";

  return (
    <View
      style={{ position: "absolute", top: -8, right: -8, zIndex: 10 } as any}
    >
      <View
        style={
          {
            ...(urgent
              ? { animation: "sk-pulse 1s infinite" }
              : warning
                ? { animation: "sk-breathe 2s ease-in-out infinite" }
                : {}),
          } as any
        }
      >
        <svg width="52" height="52" viewBox="0 0 52 52">
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}
            strokeWidth="3.5"
          />
          {/* Progress arc */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={ringColor}
            strokeWidth="3.5"
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={
              {
                filter: `drop-shadow(0 0 4px ${glowColor})`,
                transition: "stroke-dasharray 60s linear",
              } as any
            }
          />
        </svg>
      </View>
      {urgent && (
        <View
          style={
            {
              position: "absolute",
              bottom: -4,
              left: "50%",
              backgroundColor: "#ef4444",
              borderRadius: 99,
              paddingHorizontal: 4,
              paddingVertical: 1,
              transform: "translateX(-50%)",
            } as any
          }
        >
          <Text style={{ color: "white", fontSize: 8, fontWeight: "800" }}>
            {Math.ceil(hoursLeft)}h left
          </Text>
        </View>
      )}
    </View>
  );
}

/* ════════════════════════════════
   GITHUB‑STYLE HEAT MAP (web only)
════════════════════════════════ */
function HeatMap({
  activityLog,
  dark,
}: {
  activityLog: Record<string, number>;
  dark: boolean;
}) {
  if (Platform.OS !== "web") return null;

  const WEEKS = 52;
  const today = new Date();
  const currentYear = today.getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  today.setHours(0, 0, 0, 0);

  /* Build grid: WEEKS cols × 7 rows, starting from Sunday */
  // const startDay = new Date(today);
  // /* rewind to last Sunday WEEKS weeks ago */
  // const dayOfWeek = today.getDay();
  // startDay.setDate(today.getDate() - dayOfWeek - (WEEKS - 1) * 7);

  const startDay = new Date(selectedYear, 0, 1);
  const firstDay = startDay.getDay();
  startDay.setDate(startDay.getDate() - firstDay);

  const cells: Array<{
    date: string;
    count: number;
    month: number;
    isToday: boolean;
  }> = [];
  const months: { label: string; col: number }[] = [];
  let lastMonth = -1;

  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const dt = new Date(startDay);
      dt.setDate(startDay.getDate() + w * 7 + d);
      const key = dt.toLocaleDateString("en-CA");
      const year = new Date(key).getFullYear();

      const rawCount =
        year === selectedYear ? Number(activityLog?.[key] || 0) : 0;

      const value = rawCount;

      // const count =
      //   rawCount === 0
      //     ? 0
      //     : rawCount <= 2
      //       ? 1
      //       : rawCount <= 5
      //         ? 2
      //         : rawCount <= 10
      //           ? 3
      //           : rawCount <= 20
      //             ? 4
      //             : rawCount <= 30
      //               ? 5
      //               : 6;

      const todayStr = today.toLocaleDateString("en-CA");

      const isToday = key === todayStr;
      cells.push({ date: key, count: value, month: dt.getMonth(), isToday });
      if (dt.getMonth() !== lastMonth && d === 0) {
        months.push({
          label: dt.toLocaleString("default", { month: "short" }),
          col: w,
        });
        lastMonth = dt.getMonth();
      }
    }
  }

  const maxCount = Math.max(1, ...Object.values(activityLog));

  const getColor = (count: number, isToday?: boolean) => {
    if (isToday) {
      if (count === 0) return "#fee2e2";
      if (count <= 3) return "#fca5a5";
      if (count <= 8) return "#ef4444";
      if (count <= 15) return "#dc2626";
      return "#b91c1c";
    }
    if (count === 0)
      return dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    if (count <= 3)
      return dark ? "rgba(99,102,241,0.20)" : "rgba(99,102,241,0.15)";
    if (count <= 8)
      return dark ? "rgba(99,102,241,0.42)" : "rgba(99,102,241,0.35)";
    if (count <= 15)
      return dark ? "rgba(99,102,241,0.68)" : "rgba(99,102,241,0.58)";
    return "#6366f1";
  };

  const CELL = 10,
    GAP = 3;

  return (
    <View
      style={{
        borderRadius: 20,
        padding: 20,
        overflow: "visible",
        marginBottom: 28,
        width: "100%",
        maxWidth: 900,
        alignSelf: "center",
        borderWidth: 1,
        borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        backgroundColor: dark ? "#0d1424" : "#ffffff",
        ...(Platform.OS === "web"
          ? ({ animation: "sk-fadeUp .4s ease both" } as any)
          : {}),
        ...(Platform.OS === "web"
          ? ({
              boxShadow: dark
                ? "0 2px 16px rgba(0,0,0,0.4)"
                : "0 2px 12px rgba(0,0,0,0.05)",
            } as any)
          : {}),
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: "rgba(99,102,241,0.1)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 16 }}>📅</Text>
          </View>
          <View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "800",
                color: dark ? "#ffffff" : "#0f172a",

                ...(Platform.OS === "web"
                  ? ({
                      fontFamily: "Outfit,sans-serif",
                      textShadow: dark
                        ? "0 0 10px rgba(99,102,241,0.3)"
                        : "none",
                    } as any)
                  : {}),
              }}
            >
              Activity Heatmap
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: dark ? "rgba(255,255,255,0.65)" : "rgba(15,23,42,0.45)",
                marginTop: 1,
              }}
            >
              {Object.entries(activityLog)
                .filter(
                  ([date]) => new Date(date).getFullYear() === selectedYear,
                )
                .reduce((sum, [, val]) => sum + val, 0)}{" "}
              tasks ·{" "}
              {
                Object.keys(activityLog).filter(
                  (date) => new Date(date).getFullYear() === selectedYear,
                ).length
              }{" "}
              active days
            </Text>
          </View>
        </View>
        {/* Legend */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text
            style={{
              fontSize: 10,
              color: dark ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.4)",
              marginRight: 4,
              fontWeight: "500",
            }}
          >
            Less
          </Text>
          {[0, 2, 5, 12, 20].map((v, i) => (
            <View
              key={i}
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                backgroundColor: getColor(v),
              }}
            />
          ))}
          <Text
            style={{
              fontSize: 10,
              color: dark ? "rgba(238,242,255,0.4)" : "rgba(15,23,42,0.4)",
              marginLeft: 4,
              fontWeight: "500",
            }}
          >
            More
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              marginLeft: 14,
              paddingLeft: 14,
              borderLeftWidth: 1,
              borderLeftColor: dark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.08)",
            }}
          >
            <Text
              style={{
                fontSize: 10,
                color: dark ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.4)",
                marginRight: 4,
                fontWeight: "500",
              }}
            >
              Today
            </Text>
            {["#fee2e2", "#fca5a5", "#ef4444", "#dc2626", "#b91c1c"].map(
              (color, i) => (
                <View
                  key={i}
                  className={
                    Platform.OS === "web" && i === 4
                      ? "sk-legend-today-dot"
                      : undefined
                  }
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    backgroundColor: color,
                  }}
                />
              ),
            )}
          </View>

          <View style={{ alignItems: "flex-end", marginLeft: 10 }}>
            <Pressable onPress={() => setSelectedYear(currentYear)}>
              <View
                style={{
                  backgroundColor:
                    selectedYear === currentYear
                      ? "#3b82f6"
                      : "rgba(0,0,0,0.1)",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  marginBottom: 2,
                }}
              >
                <Text
                  style={{
                    color:
                      selectedYear === currentYear
                        ? "#ffffff"
                        : dark
                          ? "rgba(255,255,255,0.6)"
                          : "#94a3b8",
                    fontSize: 10,
                    fontWeight: "700",
                  }}
                >
                  {currentYear}
                </Text>
              </View>
            </Pressable>

            <Pressable onPress={() => setSelectedYear(currentYear - 1)}>
              <Text
                style={{
                  fontSize: 9,
                  color:
                    selectedYear === currentYear - 1
                      ? "#3b82f6"
                      : dark
                        ? "rgba(238,242,255,0.4)"
                        : "rgba(15,23,42,0.4)",
                  fontWeight: "700",
                }}
              >
                {currentYear - 1}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Month labels */}
      <View style={{ flexDirection: "row", marginBottom: 8, paddingLeft: 4 }}>
        {months.map((m, i) => (
          <View
            key={i}
            style={{ position: "absolute", left: m.col * (CELL + GAP) } as any}
          >
            <Text
              style={{
                fontSize: 9,
                color: dark ? "rgba(255,255,255,0.55)" : "rgba(15,23,42,0.4)",
                fontWeight: "600",
              }}
            >
              {m.label}
            </Text>
          </View>
        ))}
        <View style={{ height: 14 }} />
      </View>

      {/* Grid */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          display: "flex",
          flexDirection: "row",
          gap: GAP,
          width: WEEKS * (CELL + GAP),
          overflow: "visible" as any,
        }}
        contentContainerStyle={{
          flexDirection: "row",
          gap: GAP,
          paddingRight: 20,
          paddingTop: 8,
          paddingBottom: 8,
          overflow: "visible",
        }}
      >
        {Array.from({ length: WEEKS }, (_, w) => (
          <View
            key={w}
            style={{
              flexDirection: "column",
              gap: GAP,
              width: CELL,
              minWidth: CELL,
              alignItems: "center",
              overflow: "visible" as any,
            }}
          >
            {Array.from({ length: 7 }, (_, d) => {
              const cell: any = cells[w * 7 + d] || {
                count: 0,
                isToday: false,
              };

              if (!cell) {
                return (
                  <View
                    key={d}
                    className={
                      Platform.OS === "web"
                        ? `sk-cell ${cell.isToday ? "sk-cell-today" : ""}`
                        : undefined
                    }
                    style={{
                      width: CELL,
                      height: CELL,
                    }}
                  />
                );
              }
              return (
                <View
                  key={d}
                  className={Platform.OS === "web" ? "sk-cell" : undefined}
                  style={
                    {
                      width: CELL,
                      height: CELL,
                      borderRadius: 3,
                      backgroundColor: getColor(cell.count, cell.isToday),
                      transform: cell.isToday ? [{ translateY: -1 }] : [],
                      zIndex: cell.isToday ? 5 : 1,
                      // marginVertical: cell.isToday ? 2 : 0,
                      alignItems: "center",
                      overflow: "visible",

                      ...(cell.isToday
                        ? {
                            outline: "none",
                            borderRadius: 4,
                            background: `linear-gradient(145deg, ${getColor(cell.count, true)}ff, ${getColor(cell.count, true)}cc)`,
                            animation:
                              "sk-glow-today 1.8s cubic-bezier(0.215,0.61,0.355,1) infinite",
                            zIndex: 10,
                            perspective: "200px",
                            transformStyle: "preserve-3d",
                            willChange: "transform, box-shadow",
                          }
                        : {}),

                      ...(cell.count > 0 &&
                        !cell.isToday && {
                          boxShadow: `0 0 4px ${getColor(cell.count, false)}66`,
                        }),
                      cursor: "default",
                      transition: "transform .12s, box-shadow .12s",
                    } as any
                  }
                />
              );
            })}
          </View>
        ))}
      </ScrollView>
      <View
        style={{
          marginTop: 10,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontSize: 12,
            opacity: dark ? 0.7 : 0.6,
            color: dark ? "#fff" : undefined,
          }}
        >
          Keep it going 🔥
        </Text>

        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            opacity: dark ? 0.7 : 0.6,
            color: dark ? "#fff" : undefined,
          }}
        >
          {selectedYear}
        </Text>
      </View>
    </View>
  );
}

/* ════ STREAK TIMER INLINE — fits inside card ════ */
function StreakTimerInline({
  streak,
  activityToday,
  dark,
}: {
  streak: number;
  activityToday: boolean;
  dark: boolean;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  if (streak === 0 || Platform.OS !== "web") return null;
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const msLeft = midnight.getTime() - now.getTime();
  const hoursLeft = msLeft / 3600000;
  const pct = msLeft / 86400000;
  const urgent = hoursLeft < 3 && !activityToday;
  const warning = hoursLeft < 8 && !activityToday;
  const ringColor = urgent ? "#ef4444" : warning ? "#f97316" : "#34d399";
  const glowColor = urgent
    ? "rgba(239,68,68,0.5)"
    : warning
      ? "rgba(249,115,22,0.4)"
      : "rgba(52,211,153,0.4)";
  const r = 16,
    cx = 20,
    cy = 20,
    circ = 2 * Math.PI * r;
  const dash = pct * circ;
  return (
    <View style={{ position: "absolute", top: 8, right: 8 } as any}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        style={
          {
            ...(urgent
              ? { animation: "sk-pulse 1s infinite" }
              : warning
                ? { animation: "sk-breathe 2s ease-in-out infinite" }
                : {}),
          } as any
        }
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}
          strokeWidth="3"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={
            {
              filter: `drop-shadow(0 0 3px ${glowColor})`,
              transition: "stroke-dasharray 60s linear",
            } as any
          }
        />
        {!activityToday && urgent && (
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fontSize="9"
            fontWeight="800"
            fill={ringColor}
          >
            !
          </text>
        )}
        {activityToday && (
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fontSize="10"
            fill={ringColor}
          >
            ✓
          </text>
        )}
      </svg>
      {urgent && !activityToday && (
        <View
          style={
            {
              position: "absolute",
              top: 36,
              left: "50%",
              backgroundColor: "#ef4444",
              borderRadius: 99,
              paddingHorizontal: 5,
              paddingVertical: 2,
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
            } as any
          }
        >
          <Text style={{ color: "white", fontSize: 8, fontWeight: "800" }}>
            {Math.ceil(hoursLeft)}h left
          </Text>
        </View>
      )}
    </View>
  );
}

/* ════════════════════════════════
   STAT CARDS ROW (web wide)
════════════════════════════════ */
function StatCards({
  dark,
  goals,
  completedTasks,
  streak,
  activityToday,
  fadeAnim,
  slideAnim,
}: any) {
  const bg = dark ? "#0d1424" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const txtPri = dark ? "#eef2ff" : "#0f172a";
  const txtSec = dark ? "rgba(238,242,255,0.5)" : "rgba(15,23,42,0.5)";

  const CARDS = [
    {
      icon: "🎯",
      val: goals.length,
      lbl: "Active Goals",
      sub: "All on track",
      color: "#6366f1",
      bg2: "rgba(99,102,241,0.08)",
    },
    {
      icon: "✅",
      val: completedTasks,
      lbl: "Tasks Completed",
      sub: "+2 today",
      color: "#34d399",
      bg2: "rgba(52,211,153,0.08)",
    },
    {
      icon: "🔥",
      val: `${streak}`,
      lbl: "Day Streak",
      sub: "Personal best",
      color: "#f97316",
      bg2: "rgba(249,115,22,0.08)",
    },
    {
      icon: "⭐",
      val: Math.min(
        9999,
        completedTasks * 50 + goals.length * 120 + Number(streak) * 15,
      ),
      lbl: "Skill Score",
      sub: "Based on activity",
      color: "#fbbf24",
      bg2: "rgba(251,191,36,0.08)",
    },
  ];

  /* ── Single stat card with count-up ── */
  function StatCard({
    icon,
    val,
    lbl,
    sub,
    color,
    bg2,
    i,
    streak,
    activityToday,
  }: any) {
    const isNum = typeof val === "number";
    const counted = useCountUp(isNum ? val : 0);
    const display = isNum ? counted : val;
    return (
      <Animated.View
        className={Platform.OS === "web" ? "sk-hov" : undefined}
        style={[
          stSt.card,
          { backgroundColor: bg, borderColor: border },
          Platform.OS === "web"
            ? {
                boxShadow: dark
                  ? "0 4px 20px rgba(0,0,0,0.3)"
                  : `0 4px 16px ${color}18`,
                borderTopColor: color,
                borderTopWidth: 2,
              }
            : { elevation: 3 },
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: Animated.add(slideAnim, new Animated.Value(i * 6)),
              },
            ],
          },
        ]}
      >
        {Platform.OS === "web" && (
          <View
            pointerEvents="none"
            style={
              {
                position: "absolute",
                top: -12,
                right: -12,
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: color,
                filter: "blur(20px)",
                opacity: 0.15,
              } as any
            }
          />
        )}
        <View
          style={[
            stSt.iconWrap,
            { backgroundColor: bg2 },
            Platform.OS === "web"
              ? ({ animation: "sk-breathe 3s ease-in-out infinite" } as any)
              : {},
          ]}
        >
          <Text style={{ fontSize: 22 }}>{icon}</Text>
        </View>
        <Text
          style={[
            stSt.val,
            { color: txtPri },
            Platform.OS === "web"
              ? ({ fontFamily: "Outfit,sans-serif" } as any)
              : {},
          ]}
        >
          {display}
        </Text>
        <Text style={[stSt.lbl, { color: txtSec }]}>{lbl}</Text>
        <View style={stSt.subRow}>
          <Text style={{ color, fontSize: 10, fontWeight: "700" }}>
            ↑ {sub}
          </Text>
        </View>
        {/* StreakTimer inside card to avoid overflow clipping */}
        {i === 2 && (
          <StreakTimerInline
            streak={streak}
            activityToday={activityToday}
            dark={dark}
          />
        )}
      </Animated.View>
    );
  }

  return (
    <View style={stSt.row}>
      {CARDS.map((card, i) => (
        <StatCard
          key={i}
          {...card}
          i={i}
          streak={streak}
          activityToday={activityToday}
        />
      ))}
    </View>
  );
}

const stSt = StyleSheet.create({
  row: { flexDirection: "row", gap: 14, marginBottom: 28 } as any,
  card: {
    flex: 1,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    position: "relative",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  val: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginBottom: 3,
    lineHeight: 36,
    ...(Platform.OS === "web"
      ? ({ fontFamily: "Outfit,sans-serif" } as any)
      : {}),
  },
  lbl: { fontSize: 13, fontWeight: "500", marginBottom: 4 },
  subRow: { flexDirection: "row", alignItems: "center" },
});

/* ════ TODAY'S PLAN — scrollable, shows all pending ════ */
function TodaysPlan({ dark, goals, bg, border, txtPri, txtSec }: any) {
  const [expanded, setExpanded] = useState(false);
  const SHOW = 4;

  const allPending: { title: string; goalName: string; accent: string }[] = [];
  goals.forEach((g: any, gi: number) => {
    g.tasks.forEach((t: any) => {
      if (!t.completed) {
        allPending.push({
          title: t.title,
          goalName: g.name,
          accent: GOAL_COLORS[gi % GOAL_COLORS.length],
        });
      }
    });
  });

  if (allPending.length === 0) return null;
  const shown = expanded ? allPending : allPending.slice(0, SHOW);
  const hidden = allPending.length - SHOW;

  return (
    <View style={[rpSt.card, { backgroundColor: bg, borderColor: border }]}>
      <View style={rpSt.planHdr}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[rpSt.secTitle, { color: txtPri, marginBottom: 0 }]}>
            Today's Plan
          </Text>
          <View style={[rpSt.planBadge, { backgroundColor: "#6366f114" }]}>
            <Text style={[rpSt.planBadgeTx, { color: "#6366f1" }]}>
              {allPending.length} pending
            </Text>
          </View>
        </View>
        {allPending.every((_, i) => false) ? null : (
          <Pressable
            onPress={() => setExpanded((e) => !e)}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: "#6366f1",
                ...(Platform.OS === "web"
                  ? ({ cursor: "pointer" } as any)
                  : {}),
              }}
            >
              {expanded ? "Show less" : "View all"}
            </Text>
          </Pressable>
        )}
      </View>
      <View
        style={{ height: 1, backgroundColor: border, marginVertical: 10 }}
      />
      {shown.map((item, idx) => (
        <View
          key={idx}
          style={[
            rpSt.planRow,
            {
              backgroundColor: dark
                ? "rgba(255,255,255,0.03)"
                : "rgba(0,0,0,0.02)",
              borderWidth: 1,
              borderColor: border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              marginBottom: 6,
            },
          ]}
        >
          <View
            style={[
              rpSt.planDot,
              { backgroundColor: item.accent },
              Platform.OS === "web"
                ? ({ animation: "sk-pulse 2s infinite" } as any)
                : {},
            ]}
          />
          <View style={{ flex: 1 }}>
            <Text style={[rpSt.planTask, { color: txtPri }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[rpSt.planGoal, { color: txtSec }]}>
              {item.goalName}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: item.accent + "22",
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 20,
            }}
          >
            <Text style={[rpSt.planDue, { color: item.accent }]}>Due</Text>
          </View>
        </View>
      ))}
      {/* Expand / collapse button */}
      {allPending.length > SHOW && (
        <Pressable
          onPress={() => setExpanded((e) => !e)}
          style={({ pressed }) => [
            rpSt.viewMoreBtn,
            {
              backgroundColor: pressed
                ? dark
                  ? "rgba(99,102,241,0.18)"
                  : "rgba(99,102,241,0.1)"
                : dark
                  ? "rgba(99,102,241,0.08)"
                  : "rgba(99,102,241,0.06)",
              borderColor: dark
                ? "rgba(99,102,241,0.2)"
                : "rgba(99,102,241,0.15)",
            },
          ]}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#6366f1" }}>
            {expanded
              ? "⌃  Show fewer"
              : `⌄  View ${hidden} more task${hidden > 1 ? "s" : ""}`}
          </Text>
        </Pressable>
      )}
      {/* All-done state */}
      {allPending.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: 12 }}>
          <Text style={{ fontSize: 20, marginBottom: 6 }}>🎉</Text>
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#34d399" }}>
            All caught up!
          </Text>
          <Text style={{ fontSize: 11, color: txtSec, marginTop: 2 }}>
            No pending tasks today
          </Text>
        </View>
      )}
    </View>
  );
}

/* ════════════════════════════════
   RIGHT PANEL (web wide)
════════════════════════════════ */
function RightPanel({
  dark,
  goals,
  getGoalProgress,
  getRecommendation,
  fadeAnim,
}: any) {
  const bg = dark ? "#0a0f20" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const txtPri = dark ? "#eef2ff" : "#0f172a";
  const txtSec = dark ? "rgba(238,242,255,0.5)" : "rgba(15,23,42,0.5)";
  const recBg = dark ? "rgba(99,102,241,0.1)" : "#eff6ff";

  return (
    <Animated.View style={[rpSt.wrap, { opacity: fadeAnim }]}>
      {/* AI Recommendation */}
      <View
        style={[
          rpSt.card,
          {
            borderColor: "rgba(99,102,241,0.2)",
            opacity: 0.55,
            ...(Platform.OS === "web"
              ? {
                  background:
                    "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(167,139,250,0.06))",
                }
              : { backgroundColor: recBg }),
          } as any,
        ]}
      >
        <View style={rpSt.recHdr}>
          <View
            style={[
              rpSt.recIcon,
              Platform.OS === "web"
                ? ({
                    background: "linear-gradient(135deg,#6366f1,#a78bfa)",
                    animation: "sk-breathe 3s ease-in-out infinite",
                  } as any)
                : {},
            ]}
          >
            <Text style={{ fontSize: 20 }}>🚀</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[rpSt.recTitle, { color: txtPri }]}>
              AI Recommendation
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text style={[rpSt.recSub]}>Personalized for you</Text>
              <View
                style={{
                  backgroundColor: "rgba(99,102,241,0.12)",
                  borderRadius: 99,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{ fontSize: 9, fontWeight: "700", color: "#6366f1" }}
                >
                  v2
                </Text>
              </View>
            </View>
          </View>
        </View>
        <Text style={[rpSt.recBody, { color: txtSec }]}>
          {getRecommendation()}
        </Text>
        {goals.length > 0 && (
          <Pressable
            style={rpSt.recBtn}
            onPress={() =>
              showComingSoon("AI task recommendations arrive in v2")
            }
          >
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
          const pct = getGoalProgress(g.id);
          const accent = GOAL_COLORS[i % GOAL_COLORS.length];
          return (
            <View key={g.id} style={rpSt.qpRow}>
              <View style={[rpSt.qpDot, { backgroundColor: accent + "28" }]}>
                <Text style={{ fontSize: 14 }}>
                  {GOAL_EMOJIS[i % GOAL_EMOJIS.length]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={rpSt.qpTop}>
                  <Text
                    style={[rpSt.qpName, { color: txtPri }]}
                    numberOfLines={1}
                  >
                    {g.name}
                  </Text>
                  <Text style={[rpSt.qpPct, { color: accent }]}>{pct}%</Text>
                </View>
                <ShimmerBar pct={pct} color={accent} h={5} />
              </View>
            </View>
          );
        })}
      </View>

      {/* Today's Plan — all pending, scrollable with collapse */}
      <TodaysPlan
        dark={dark}
        goals={goals}
        bg={bg}
        border={border}
        txtPri={txtPri}
        txtSec={txtSec}
      />
    </Animated.View>
  );
}

const rpSt = StyleSheet.create({
  wrap: { width: RIGHT_W, flexShrink: 0, gap: 14 },
  card: { borderRadius: 20, padding: 20, borderWidth: 1 },
  recHdr: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  recIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: "800",
    ...(Platform.OS === "web"
      ? ({ fontFamily: "Outfit,sans-serif" } as any)
      : {}),
  },
  recSub: { fontSize: 11, fontWeight: "600", color: "#a78bfa" },
  recBody: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 20,
    marginBottom: 14,
  },
  recBtn: {
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: "#6366f1",
    ...(Platform.OS === "web"
      ? ({
          background: "linear-gradient(135deg,#6366f1,#a78bfa)",
          boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
        } as any)
      : {}),
  },
  recBtnTx: { color: "white", fontWeight: "700", fontSize: 13 },
  secTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 14,
    ...(Platform.OS === "web"
      ? ({ fontFamily: "Outfit,sans-serif" } as any)
      : {}),
  },
  qpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  qpDot: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  qpTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  qpName: { fontSize: 12, fontWeight: "700", flex: 1 },
  qpPct: { fontSize: 12, fontWeight: "700", marginLeft: 4 },
  /* Today's Plan */
  planHdr: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planBadge: {
    backgroundColor: "#ef444418",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  planBadgeTx: { color: "#ef4444", fontSize: 10, fontWeight: "700" },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  planDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
    marginTop: 2,
  },
  planTask: { fontSize: 12, fontWeight: "600", marginBottom: 1 },
  planGoal: { fontSize: 10, fontWeight: "500" },
  planDue: { fontSize: 10, fontWeight: "700", color: "#ef4444" },
  viewMoreBtn: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web"
      ? ({ cursor: "pointer", transition: "background .15s" } as any)
      : {}),
  },
});

/* ════════════════════════════════
   ADD GOAL MODAL — inline on dashboard
════════════════════════════════ */

const ICON_CATEGORIES = [
  {
    label: "Coding",
    emoji: "💻",
    icons: [
      "⚛️",
      "🐍",
      "☕",
      "🔧",
      "🖥️",
      "💻",
      "🛠️",
      "⚙️",
      "🐞",
      "🔌",
      "📱",
      "🌐",
      "🔐",
      "🗄️",
      "🖱️",
      "⌨️",
    ],
  },
  {
    label: "Study",
    emoji: "📚",
    icons: [
      "📚",
      "📖",
      "🎓",
      "📝",
      "✏️",
      "📓",
      "🗒️",
      "📄",
      "🔬",
      "🧪",
      "🏫",
      "🔭",
      "📐",
      "📏",
      "🗺️",
      "🧩",
    ],
  },
  {
    label: "Design",
    emoji: "🎨",
    icons: [
      "🎨",
      "🖌️",
      "🖼️",
      "💎",
      "🎭",
      "🌈",
      "✨",
      "🎯",
      "📐",
      "🎪",
      "💅",
      "🖍️",
      "🎬",
      "📸",
      "🎞️",
      "🎵",
    ],
  },
  {
    label: "Projects",
    emoji: "🚀",
    icons: [
      "🚀",
      "🏗️",
      "🔨",
      "⚡",
      "🌟",
      "💡",
      "🔥",
      "⭐",
      "🏆",
      "🎯",
      "🏅",
      "🌱",
      "💪",
      "🛸",
      "🌌",
      "🎪",
    ],
  },
  {
    label: "Data",
    emoji: "📊",
    icons: [
      "📊",
      "📈",
      "📉",
      "🗃️",
      "💾",
      "🔢",
      "📋",
      "🗂️",
      "📌",
      "🔍",
      "🧮",
      "🔑",
      "🏷️",
      "📍",
      "🗝️",
      "📡",
    ],
  },
  {
    label: "AI/ML",
    emoji: "🤖",
    icons: [
      "🤖",
      "🧠",
      "💡",
      "🔮",
      "⚡",
      "🔬",
      "🧬",
      "🛸",
      "🌐",
      "🎲",
      "♟️",
      "🎰",
      "🔐",
      "🌡️",
      "⚗️",
      "🧲",
    ],
  },
];

const SUGGESTION_ICON_MAP: Record<string, string> = {
  "Learn Java": "☕",
  "React Native": "⚛️",
  Firebase: "🔥",
  Flutter: "🦋",
  "Node.js": "🚀",
  "UI Design": "🎨",
  Python: "🐍",
  "Machine Learning": "🤖",
};

function AddGoalModal({
  dark,
  onClose,
  addGoalFn,
}: {
  dark: boolean;
  onClose: () => void;
  addGoalFn: (name: string, icon: string) => any;
}) {
  const [goal, setGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState("🎯");
  const [activeTab, setActiveTab] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(44)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const pickerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 68,
        friction: 10,
      }),
    ]).start();
  }, []);

  const togglePicker = () => {
    const next = !showPicker;
    setShowPicker(next);
    Animated.spring(pickerAnim, {
      toValue: next ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  const SUGGESTIONS = [
    "Learn Java",
    "React Native",
    "Firebase",
    "Flutter",
    "Node.js",
    "UI Design",
    "Python",
    "Machine Learning",
  ];

  const card = dark ? "#0d1424" : "#ffffff";
  const txtPri = dark ? "#eef2ff" : "#0f172a";
  const txtSec = dark ? "rgba(238,242,255,0.55)" : "#475569";
  const txtMute = dark ? "rgba(238,242,255,0.28)" : "rgba(15,23,42,0.3)";
  const border = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const inputBg = dark ? "rgba(255,255,255,0.04)" : "#f8faff";
  const iBorder = focused
    ? "#6366f1"
    : dark
      ? "rgba(255,255,255,0.14)"
      : "rgba(99,102,241,0.22)";
  const hasText = goal.trim().length > 0;

  const handleSave = async () => {
    if (!goal.trim()) {
      showError("Goal name cannot be empty");
      return;
    }
    setSaving(true);
    Animated.sequence([
      Animated.spring(btnScale, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 200,
        friction: 5,
      }),
      Animated.spring(btnScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 5,
      }),
    ]).start(async () => {
      try {
        await addGoalFn(goal.trim(), selectedIcon);
        showSuccess("Goal created 🎯");
        onClose();
      } catch {
        showError("Something went wrong");
        setSaving(false);
      }
    });
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }] as any}>
      {/* Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: dark ? "rgba(0,0,0,0.78)" : "rgba(0,0,0,0.48)",
            opacity: fadeAnim,
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            {
              width: "100%",
              maxWidth: 520,
              backgroundColor: card,
              borderRadius: 24,
              padding: 26,
              borderWidth: 1,
              borderColor: border,
            },
            Platform.OS === "web"
              ? ({
                  boxShadow: dark
                    ? "0 24px 80px rgba(0,0,0,0.7)"
                    : "0 24px 80px rgba(0,0,0,0.18)",
                  animation: "sk-fadeUp .22s ease both",
                } as any)
              : { elevation: 24 },
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* ── Header ── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  ...(Platform.OS === "web"
                    ? ({
                        background:
                          "linear-gradient(135deg,rgba(99,102,241,0.18),rgba(167,139,250,0.12))",
                        boxShadow: "0 0 0 1px rgba(99,102,241,0.22)",
                      } as any)
                    : { backgroundColor: "rgba(99,102,241,0.12)" }),
                }}
              >
                <Text style={{ fontSize: 24 }}>🎯</Text>
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: txtPri,
                    ...(Platform.OS === "web"
                      ? ({ fontFamily: "Outfit,sans-serif" } as any)
                      : {}),
                  }}
                >
                  New Goal
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: txtSec,
                    marginTop: 2,
                    fontWeight: "500",
                  }}
                >
                  Pick an icon · name your goal
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                width: 34,
                height: 34,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: pressed
                  ? dark
                    ? "rgba(255,255,255,0.14)"
                    : "rgba(0,0,0,0.1)"
                  : dark
                    ? "rgba(255,255,255,0.07)"
                    : "rgba(0,0,0,0.05)",
                ...(Platform.OS === "web"
                  ? ({
                      cursor: "pointer",
                      transition: "background .15s",
                    } as any)
                  : {}),
              })}
            >
              <Text style={{ color: txtSec, fontSize: 16, fontWeight: "700" }}>
                ✕
              </Text>
            </Pressable>
          </View>

          <View
            style={{ height: 1, backgroundColor: border, marginBottom: 18 }}
          />

          {/* ── Icon Selector Row ── */}
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: txtSec,
              letterSpacing: 0.5,
              textTransform: "uppercase" as const,
              marginBottom: 10,
            }}
          >
            Goal Icon
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            {/* Selected icon big button */}
            <Pressable
              onPress={togglePicker}
              style={({ pressed }) => ({
                width: 64,
                height: 64,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: showPicker
                  ? "#6366f1"
                  : dark
                    ? "rgba(255,255,255,0.14)"
                    : "rgba(99,102,241,0.3)",
                backgroundColor: showPicker
                  ? "rgba(99,102,241,0.12)"
                  : dark
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(99,102,241,0.06)",
                opacity: pressed ? 0.8 : 1,
                ...(Platform.OS === "web"
                  ? ({
                      boxShadow: showPicker
                        ? "0 0 0 3px rgba(99,102,241,0.2)"
                        : "none",
                      transition: "all .2s",
                      cursor: "pointer",
                    } as any)
                  : {}),
              })}
            >
              <Text style={{ fontSize: 30 }}>{selectedIcon}</Text>
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: txtPri,
                  marginBottom: 4,
                }}
              >
                {showPicker
                  ? "Choose from categories below ↓"
                  : "Tap icon to change"}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: "500", color: txtSec }}>
                Icon appears on your goal card
              </Text>
            </View>

            {/* Quick popular icons */}
            <View style={{ flexDirection: "row", gap: 6 }}>
              {["🎯", "💻", "📚", "🚀", "🎨"].map((ic) => (
                <Pressable
                  key={ic}
                  onPress={() => {
                    setSelectedIcon(ic);
                    setShowPicker(false);
                  }}
                  style={({ pressed }) => ({
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      selectedIcon === ic
                        ? "rgba(99,102,241,0.14)"
                        : pressed
                          ? "rgba(99,102,241,0.08)"
                          : dark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.04)",
                    borderWidth: 1,
                    borderColor:
                      selectedIcon === ic ? "rgba(99,102,241,0.45)" : border,
                    ...(Platform.OS === "web"
                      ? ({ cursor: "pointer", transition: "all .14s" } as any)
                      : {}),
                  })}
                >
                  <Text style={{ fontSize: 18 }}>{ic}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── Expandable Icon Picker ── */}
          {showPicker && (
            <Animated.View
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "rgba(99,102,241,0.2)",
                backgroundColor: dark
                  ? "rgba(99,102,241,0.06)"
                  : "rgba(99,102,241,0.03)",
                marginBottom: 16,
                overflow: "hidden",
                ...(Platform.OS === "web"
                  ? ({ animation: "sk-fadeUp .18s ease both" } as any)
                  : {}),
              }}
            >
              {/* Category Tabs */}
              <View
                style={{
                  flexDirection: "row",
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(99,102,241,0.15)",
                  paddingHorizontal: 8,
                  paddingTop: 8,
                }}
              >
                {ICON_CATEGORIES.map((cat, ci) => (
                  <Pressable
                    key={ci}
                    onPress={() => setActiveTab(ci)}
                    style={({ pressed }) => ({
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                      borderRadius: 10,
                      marginRight: 4,
                      marginBottom: 8,
                      backgroundColor:
                        activeTab === ci
                          ? "rgba(99,102,241,0.15)"
                          : pressed
                            ? "rgba(99,102,241,0.08)"
                            : "transparent",
                      borderWidth: activeTab === ci ? 1 : 0,
                      borderColor: "rgba(99,102,241,0.3)",
                      ...(Platform.OS === "web"
                        ? ({ cursor: "pointer", transition: "all .14s" } as any)
                        : {}),
                    })}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: activeTab === ci ? "700" : "500",
                        color: activeTab === ci ? "#6366f1" : txtSec,
                      }}
                    >
                      {cat.emoji} {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Icon Grid */}
              <View
                style={
                  {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    padding: 12,
                    gap: 8,
                  } as any
                }
              >
                {ICON_CATEGORIES[activeTab].icons.map((ic, ii) => (
                  <Pressable
                    key={ii}
                    onPress={() => {
                      setSelectedIcon(ic);
                      setShowPicker(false);
                    }}
                    style={({ pressed }) => ({
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor:
                        selectedIcon === ic
                          ? "rgba(99,102,241,0.18)"
                          : pressed
                            ? "rgba(99,102,241,0.1)"
                            : dark
                              ? "rgba(255,255,255,0.05)"
                              : "rgba(0,0,0,0.04)",
                      borderWidth: selectedIcon === ic ? 2 : 1,
                      borderColor:
                        selectedIcon === ic
                          ? "#6366f1"
                          : dark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.07)",
                      ...(Platform.OS === "web"
                        ? ({
                            cursor: "pointer",
                            transition: "all .12s",
                            boxShadow:
                              selectedIcon === ic
                                ? "0 0 0 3px rgba(99,102,241,0.2)"
                                : "none",
                          } as any)
                        : {}),
                    })}
                  >
                    <Text style={{ fontSize: 20 }}>{ic}</Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          )}

          {/* ── Goal Name Input ── */}
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: txtSec,
              letterSpacing: 0.5,
              textTransform: "uppercase" as const,
              marginBottom: 8,
            }}
          >
            Goal Name
          </Text>
          <View
            style={
              {
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: inputBg,
                borderColor: iBorder,
                borderWidth: 1.5,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 4,
                gap: 10,
                marginBottom: 12,
                ...(Platform.OS === "web" && focused
                  ? ({ boxShadow: "0 0 0 3px rgba(99,102,241,0.16)" } as any)
                  : {}),
                ...(Platform.OS === "web"
                  ? ({ transition: "border-color .2s, box-shadow .2s" } as any)
                  : {}),
              } as any
            }
          >
            <Text
              style={{ fontSize: 18, opacity: focused || hasText ? 1 : 0.4 }}
            >
              {selectedIcon}
            </Text>
            {Platform.OS === "web" ? (
              <input
                value={goal}
                onChange={(e: any) =>
                  e.target.value.length <= 60 && setGoal(e.target.value)
                }
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e: any) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") onClose();
                }}
                autoFocus
                placeholder="e.g. Master React Native..."
                style={
                  {
                    flex: 1,
                    fontSize: 15,
                    fontWeight: "500",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: dark ? "#eef2ff" : "#0f172a",
                    fontFamily: "Plus Jakarta Sans,sans-serif",
                    padding: "12px 0",
                  } as any
                }
              />
            ) : (
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: "500",
                  color: txtPri,
                  paddingVertical: 13,
                }}
                placeholder="e.g. Master React Native..."
                placeholderTextColor={txtMute}
                value={goal}
                onChangeText={(t) => t.length <= 60 && setGoal(t)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            )}
            {hasText && (
              <Pressable
                onPress={() => setGoal("")}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.5 : 1,
                  padding: 4,
                })}
              >
                <Text style={{ color: txtMute, fontSize: 14 }}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* ── Suggestion Chips — also set icon ── */}
          <View
            style={
              {
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 7,
                marginBottom: 16,
              } as any
            }
          >
            {SUGGESTIONS.map((s, i) => {
              const sugIcon = SUGGESTION_ICON_MAP[s] || "🎯";
              return (
                <Pressable
                  key={i}
                  onPress={() => {
                    setGoal(s);
                    setSelectedIcon(sugIcon);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 20,
                    borderWidth: 1,
                    backgroundColor:
                      goal === s
                        ? "rgba(99,102,241,0.12)"
                        : pressed
                          ? "rgba(99,102,241,0.07)"
                          : dark
                            ? "rgba(255,255,255,0.04)"
                            : "rgba(99,102,241,0.04)",
                    borderColor: goal === s ? "rgba(99,102,241,0.4)" : border,
                    ...(Platform.OS === "web"
                      ? ({ cursor: "pointer", transition: "all .14s" } as any)
                      : {}),
                  })}
                >
                  <Text style={{ fontSize: 13 }}>{sugIcon}</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: goal === s ? "700" : "500",
                      color: goal === s ? "#6366f1" : txtSec,
                    }}
                  >
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Typing progress bar */}
          {Platform.OS === "web" && (
            <View
              style={
                {
                  height: 3,
                  backgroundColor: dark
                    ? "rgba(255,255,255,0.07)"
                    : "rgba(0,0,0,0.05)",
                  borderRadius: 99,
                  marginBottom: 16,
                  overflow: "hidden",
                } as any
              }
            >
              <View
                style={
                  {
                    height: "100%",
                    width: `${(goal.length / 60) * 100}%`,
                    borderRadius: 99,
                    background: "linear-gradient(90deg,#6366f1,#a78bfa)",
                    transition: "width .3s",
                  } as any
                }
              />
            </View>
          )}

          {/* Preview pill */}
          {hasText && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                marginBottom: 14,
                borderColor: "rgba(99,102,241,0.22)",
                backgroundColor: dark
                  ? "rgba(99,102,241,0.07)"
                  : "rgba(99,102,241,0.04)",
              }}
            >
              <Text style={{ fontSize: 20 }}>{selectedIcon}</Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#6366f1",
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {goal.trim()}
              </Text>
              <View
                style={{
                  backgroundColor: "rgba(99,102,241,0.18)",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 20,
                }}
              >
                <Text
                  style={{ fontSize: 10, color: "#6366f1", fontWeight: "700" }}
                >
                  Preview
                </Text>
              </View>
            </View>
          )}

          {/* Save */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => ({
                paddingVertical: 15,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: "#6366f1",
                opacity: pressed || saving ? 0.85 : 1,
                ...(Platform.OS === "web"
                  ? ({
                      background: hasText
                        ? "linear-gradient(135deg,#6366f1,#a78bfa)"
                        : dark
                          ? "rgba(99,102,241,0.22)"
                          : "rgba(99,102,241,0.14)",
                      boxShadow: hasText
                        ? "0 6px 20px rgba(99,102,241,0.42)"
                        : "none",
                      cursor: hasText ? "pointer" : "not-allowed",
                      transition: "all .2s",
                    } as any)
                  : {}),
              })}
            >
              <Text
                style={{
                  color: "white",
                  fontWeight: "800",
                  fontSize: 15,
                  opacity: hasText ? 1 : 0.5,
                  ...(Platform.OS === "web"
                    ? ({ fontFamily: "Outfit,sans-serif" } as any)
                    : {}),
                }}
              >
                {saving
                  ? "Creating..."
                  : hasText
                    ? `${selectedIcon}  Create Goal`
                    : "Enter a goal name"}
              </Text>
            </Pressable>
          </Animated.View>
          <Pressable
            onPress={onClose}
            style={{ alignItems: "center", paddingTop: 12 }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: txtMute }}>
              Cancel
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

/* ════════════════════════════════
   ADD TASK MODAL — inline on dashboard
════════════════════════════════ */
function AddTaskModal({
  dark,
  goalId,
  onClose,
  addTaskFn,
}: {
  dark: boolean;
  goalId: string;
  onClose: () => void;
  addTaskFn: (goalId: string, title: string) => void;
}) {
  const [task, setTask] = useState("");
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(44)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 68,
        friction: 10,
      }),
    ]).start();
  }, []);

  const EXAMPLES = [
    "Complete Chapter 3 exercises",
    "Watch 2 tutorial videos on the topic",
    "Build a small prototype feature",
    "Review notes and summarize key points",
  ];

  const card = dark ? "#0d1424" : "#ffffff";
  const txtPri = dark ? "#eef2ff" : "#0f172a";
  const txtSec = dark ? "rgba(238,242,255,0.55)" : "#475569";
  const txtMute = dark ? "rgba(238,242,255,0.28)" : "rgba(15,23,42,0.3)";
  const border = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const inputBg = dark ? "rgba(255,255,255,0.04)" : "#f8faff";
  const iBorder = focused
    ? "#6366f1"
    : dark
      ? "rgba(255,255,255,0.14)"
      : "rgba(99,102,241,0.22)";
  const hasText = task.trim().length > 0;

  const handleAdd = () => {
    if (!task.trim()) {
      showError("Task name cannot be empty");
      return;
    }
    setSaving(true);
    Animated.sequence([
      Animated.spring(btnScale, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 200,
        friction: 5,
      }),
      Animated.spring(btnScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 5,
      }),
    ]).start(() => {
      try {
        addTaskFn(goalId, task.trim());
        showSuccess("Task added 🎉");
        if (Platform.OS === "web") {
          requestWebNotificationPermission().then((ok) => {
            if (ok)
              new Notification("SkillPath", { body: "New task added 📝" });
          });
        }
        onClose();
      } catch {
        showError("Something went wrong");
        setSaving(false);
      }
    });
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }] as any}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: dark ? "rgba(0,0,0,0.78)" : "rgba(0,0,0,0.48)",
            opacity: fadeAnim,
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            {
              width: "100%",
              maxWidth: 480,
              backgroundColor: card,
              borderRadius: 24,
              padding: 28,
              borderWidth: 1,
              borderColor: border,
            },
            Platform.OS === "web"
              ? ({
                  boxShadow: dark
                    ? "0 24px 80px rgba(0,0,0,0.7)"
                    : "0 24px 80px rgba(0,0,0,0.2)",
                  animation: "sk-fadeUp .22s ease both",
                } as any)
              : { elevation: 24 },
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  ...(Platform.OS === "web"
                    ? ({
                        background:
                          "linear-gradient(135deg,rgba(99,102,241,0.16),rgba(167,139,250,0.1))",
                        boxShadow: "0 0 0 1px rgba(99,102,241,0.2)",
                      } as any)
                    : { backgroundColor: "rgba(99,102,241,0.12)" }),
                }}
              >
                <Text style={{ fontSize: 24 }}>📝</Text>
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: txtPri,
                    ...(Platform.OS === "web"
                      ? ({ fontFamily: "Outfit,sans-serif" } as any)
                      : {}),
                  }}
                >
                  Add Task
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: txtSec,
                    marginTop: 2,
                    fontWeight: "500",
                  }}
                >
                  Break your goal into steps
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                width: 34,
                height: 34,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: pressed
                  ? dark
                    ? "rgba(255,255,255,0.14)"
                    : "rgba(0,0,0,0.1)"
                  : dark
                    ? "rgba(255,255,255,0.07)"
                    : "rgba(0,0,0,0.05)",
                ...(Platform.OS === "web"
                  ? ({
                      cursor: "pointer",
                      transition: "background .15s",
                    } as any)
                  : {}),
              })}
            >
              <Text style={{ color: txtSec, fontSize: 16, fontWeight: "700" }}>
                ✕
              </Text>
            </Pressable>
          </View>

          <View
            style={{ height: 1, backgroundColor: border, marginBottom: 18 }}
          />

          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: txtSec,
              letterSpacing: 0.5,
              textTransform: "uppercase" as const,
              marginBottom: 8,
            }}
          >
            Task Name
          </Text>

          {/* Input */}
          <View
            style={
              {
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: inputBg,
                borderColor: iBorder,
                borderWidth: 1.5,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 4,
                gap: 10,
                marginBottom: 14,
                ...(Platform.OS === "web" && focused
                  ? ({ boxShadow: "0 0 0 3px rgba(99,102,241,0.16)" } as any)
                  : {}),
                ...(Platform.OS === "web"
                  ? ({ transition: "border-color .2s, box-shadow .2s" } as any)
                  : {}),
              } as any
            }
          >
            <Text
              style={{ fontSize: 16, opacity: focused || hasText ? 1 : 0.4 }}
            >
              ✏️
            </Text>
            {Platform.OS === "web" ? (
              <input
                value={task}
                onChange={(e: any) =>
                  e.target.value.length <= 80 && setTask(e.target.value)
                }
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e: any) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") onClose();
                }}
                autoFocus
                placeholder="e.g. Complete Chapter 3 exercises"
                style={
                  {
                    flex: 1,
                    fontSize: 15,
                    fontWeight: "500",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: dark ? "#eef2ff" : "#0f172a",
                    fontFamily: "Plus Jakarta Sans,sans-serif",
                    padding: "12px 0",
                  } as any
                }
              />
            ) : (
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: "500",
                  color: txtPri,
                  paddingVertical: 13,
                }}
                placeholder="e.g. Complete Chapter 3 exercises"
                placeholderTextColor={txtMute}
                value={task}
                onChangeText={(t) => t.length <= 80 && setTask(t)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAdd}
              />
            )}
            {hasText && (
              <Pressable
                onPress={() => setTask("")}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.5 : 1,
                  padding: 4,
                })}
              >
                <Text style={{ color: txtMute, fontSize: 14 }}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* Quick examples */}
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: txtSec,
              letterSpacing: 0.5,
              textTransform: "uppercase" as const,
              marginBottom: 8,
            }}
          >
            Quick Examples
          </Text>
          <View style={{ gap: 6, marginBottom: 18 }}>
            {EXAMPLES.map((ex, i) => (
              <Pressable
                key={i}
                onPress={() => setTask(ex)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  backgroundColor: pressed
                    ? "rgba(99,102,241,0.09)"
                    : dark
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(0,0,0,0.02)",
                  borderColor: pressed ? "rgba(99,102,241,0.35)" : border,
                  ...(Platform.OS === "web"
                    ? ({
                        cursor: "pointer",
                        transition: "background .14s, border-color .14s",
                      } as any)
                    : {}),
                })}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "rgba(99,102,241,0.45)",
                  }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: txtSec,
                    flex: 1,
                  }}
                >
                  {ex}
                </Text>
                <Text style={{ fontSize: 11, color: "rgba(99,102,241,0.5)" }}>
                  ↗
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Typing progress bar */}
          {Platform.OS === "web" && task.length > 0 && (
            <View
              style={
                {
                  height: 3,
                  backgroundColor: dark
                    ? "rgba(255,255,255,0.07)"
                    : "rgba(0,0,0,0.05)",
                  borderRadius: 99,
                  marginBottom: 18,
                  overflow: "hidden",
                } as any
              }
            >
              <View
                style={
                  {
                    height: "100%",
                    width: `${(task.length / 80) * 100}%`,
                    borderRadius: 99,
                    background: "linear-gradient(90deg,#6366f1,#a78bfa)",
                    transition: "width .3s",
                  } as any
                }
              />
            </View>
          )}

          {/* Save */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <Pressable
              onPress={handleAdd}
              disabled={saving}
              style={({ pressed }) => ({
                paddingVertical: 15,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: "#6366f1",
                opacity: pressed || saving ? 0.85 : 1,
                ...(Platform.OS === "web"
                  ? ({
                      background: hasText
                        ? "linear-gradient(135deg,#6366f1,#a78bfa)"
                        : dark
                          ? "rgba(99,102,241,0.22)"
                          : "rgba(99,102,241,0.14)",
                      boxShadow: hasText
                        ? "0 6px 20px rgba(99,102,241,0.42)"
                        : "none",
                      cursor: hasText ? "pointer" : "not-allowed",
                      transition: "all .2s",
                    } as any)
                  : {}),
              })}
            >
              <Text
                style={{
                  color: "white",
                  fontWeight: "800",
                  fontSize: 15,
                  opacity: hasText ? 1 : 0.5,
                  ...(Platform.OS === "web"
                    ? ({ fontFamily: "Outfit,sans-serif" } as any)
                    : {}),
                }}
              >
                {saving
                  ? "Saving..."
                  : hasText
                    ? "✓  Save Task"
                    : "Enter a task name"}
              </Text>
            </Pressable>
          </Animated.View>
          <Pressable
            onPress={onClose}
            style={{ alignItems: "center", paddingTop: 12 }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: txtMute }}>
              Cancel
            </Text>
          </Pressable>
        </Animated.View>
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

  if (!taskCtx || !authCtx || !authCtx.user) return null;

  const { user, userData } = authCtx;

  const getActivityForDate = (dateStr: string) => {
    return activityLog[dateStr] || 0;
  };

  const getColor = (value: number) => {
    if (value === 0) return "#e5e7eb";
    if (value < 5) return "#c7d2fe";
    if (value < 10) return "#818cf8";
    if (value < 20) return "#6366f1";
    return "#4f46e5";
  };

  const displayName =
    userData?.displayName || user?.displayName || user?.email || "User";

  const generateDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = 90; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);

      const formatted = d.toISOString().split("T")[0];
      dates.push(formatted);
    }

    return dates;
  };

  const heatmapDates = generateDates();

  const [darkMode, setDarkMode] = useState<boolean | null>(null);
  const intervalRef = useRef<any>(null);
  const [isSynced, setIsSynced] = useState(false);
  // const displayNameFinal = userData?.displayName || "User";
  const initials = displayName.charAt(0).toUpperCase();
  const [showPicker, setShowPicker] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  // const [streak, setStreak] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [streak, setStreak] = useState(0);
  const [activityLog, setActivityLog] = useState<Record<string, number>>({});
  const [userRole, setUserRole] = useState("Intern Developer");
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddTaskGoalId, setShowAddTaskGoalId] = useState<string | null>(
    null,
  );

  /* Animations */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(36)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const hdrScale = useRef(new Animated.Value(0.97)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(hdrScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 9,
      }),
    ]).start();
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

  useEffect(() => {
    loadTheme().then(setDarkMode);
  }, []);
  useEffect(() => {
    const u = listenToNetwork(setIsSynced);
    return () => u();
  }, []);

  /* Streak + activityLog from Firestore */
  useEffect(() => {
    const userRef = doc(db, "users", user.uid);

    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();

        setStreak(data.streak || 0);

        setActivityLog({ ...(data.activityLog || {}) });

        setUserRole(data.role || "Intern Developer");
      }
    });

    return unsub;
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

  /* Theme */
  const dark = !!darkMode;
  const bg = dark ? "#0D0F14" : "#eef1f8";
  const card = dark ? "#1C1F2E" : "#FFFFFF";
  const textPrimary = dark ? "#E8ECFF" : "#0F172A";
  const textSecondary = dark ? "rgba(180,188,220,0.75)" : "#475569";
  const textMuted = dark ? "rgba(238,242,255,0.28)" : "rgba(15,23,42,0.28)";
  const headerBg = dark ? "#0D0F14" : "#1e3a8a";
  const recBg = dark ? "#141720" : "#EFF6FF";
  const recBorder = dark ? "#38BDF8" : COLORS.primary;
  const recText = dark ? "#CBD5F5" : "#334155";
  const cardBorder = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
const overallPct = getOverallProgress();


const totalGoals = goals.length;
const completedTasks = goals.reduce(
  (a: number, g: any) => a + g.tasks.filter((t: any) => t.completed).length,
  0,
);
const totalTasks = goals.reduce((a: number, g: any) => a + g.tasks.length, 0);

const skillScore = Math.min(9999, completedTasks * 50 + totalGoals * 120 + streak * 15);
  
  const getInsight = () => {
    if (overallPct === 100)
      return "Perfect score! 🏆 You've completed everything. Start a new challenge!";
    if (overallPct >= 75)
      return "Excellent progress! 🚀 You're almost there — finish strong!";
    if (overallPct >= 50)
      return "Nice momentum. 🔥 Keep pushing forward, you're halfway done!";
    if (overallPct >= 25)
      return "Good start! 💪 Consistency is your superpower — keep going.";
    return "Let's get moving! 🌱 Every task completed is a step forward.";
  };

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const granted = await requestNotificationPermission();

        if (granted && Platform.OS !== "web") {
          await scheduleDailyReminder(20, 0);
        }

        if (Platform.OS === "web") {
          const granted = await requestWebNotificationPermission();

          if (granted) {
            if (!intervalRef.current) {
              intervalRef.current = setInterval(() => {
                if (hasPendingTasks()) {
                  sendWebTestNotification();
                }
              }, 30 * 1000);
            }
          }
        }
      } catch (e) {
        console.log("Notification error", e);
      }
    };

    setupNotifications();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const userEmail = user.email || "";
  // const initials = displayName.charAt(0).toUpperCase();
  const todayKey = new Date().toISOString().split("T")[0];
  const activityToday = (activityLog[todayKey] || 0) > 0;

  /* ── Responsive breakpoints (CSS-style media queries via useWindowDimensions) ── */
  const { width: screenW } = useWindowDimensions();
  // xs  < 600   → mobile: compact header, single col, bottom bar
  // sm  600–959 → tablet: no sidebar, 2-col goals, no right panel
  // md  960+    → desktop: sidebar + hero + stat cards + right panel
  const isMobile = screenW < 600;
  const isTablet = !isMobile && screenW < 960 && Platform.OS === "web";
  const isWide = Platform.OS === "web" && screenW >= 960;
  const isTwoCol = Platform.OS === "web" && screenW >= 1200; // goal cards 2-col only at 1200+

  const cardShadow =
    Platform.OS === "web"
      ? {
          boxShadow: dark
            ? "0 2px 12px rgba(0,0,0,0.4)"
            : "0 2px 12px rgba(0,0,0,0.05)",
        }
      : { elevation: 3 };

  /* ── Mobile header (compact) ── */
  const MobileHeader = ({ 
  dark, 
  darkMode, 
  setDarkMode, 
  displayName, 
  overallPct, 
  completedTasks, 
  totalGoals, 
  streak,
  skillScore,
}: any) => (
    <Animated.View
      style={[
        styles.mHdr,
        { backgroundColor: headerBg },
        Platform.OS === "web"
          ? { boxShadow: "0 14px 44px rgba(0,0,0,0.26)" }
          : { elevation: 12 },
        { transform: [{ scale: hdrScale }], opacity: fadeAnim },
      ]}
    >
      {Platform.OS === "web" && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 20,
              background: dark
                ? "linear-gradient(135deg,#020617 0%,#0f2060 60%,#1a1060 100%)"
                : "linear-gradient(135deg,#1e3a8a 0%,#2563eb 60%,#6d28d9 100%)",
            } as any,
          ]}
        />
      )}
      <View
        pointerEvents="none"
        style={[styles.orb, { width: 180, height: 180, top: -60, right: -40 }]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.orb,
          { width: 100, height: 100, bottom: -35, right: 120 },
        ]}
      />

      <View style={styles.mHdrRow1}>
        <View style={styles.syncBadge}>
          <Animated.View
            style={[
              styles.syncDot,
              {
                backgroundColor: isSynced ? "#22C55E" : "#EF4444",
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <Text
            style={[styles.syncTx, { color: isSynced ? "#22C55E" : "#EF4444" }]}
          >
            {isSynced ? "Synced" : "Offline"}
          </Text>
        </View>
        <View style={styles.mHdrControls}>
          <View style={styles.toggleRow}>
            <Text style={{ fontSize: 12 }}>{dark ? "🌙" : "☀️"}</Text>
            <Switch
              value={dark}
              onValueChange={async (v) => {
                setDarkMode(v);
                await saveTheme(v);
              }}
              trackColor={{ false: "rgba(255,255,255,0.22)", true: "#6366f1" }}
              thumbColor="#fff"
              style={{ transform: [{ scaleX: 0.78 }, { scaleY: 0.78 }] }}
            />
          </View>
          <Pressable
            style={styles.mAvatar}
            onPress={() => router.push("/profile")}
          >
            <Text style={styles.mAvatarTx}>{initials}</Text>
          </Pressable>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.logoutTx}>Logout</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.mHdrRow2}>
        <View>
          <Text style={styles.welcomeTx}>Welcome 👋</Text>
          <Text style={styles.nameTx}>{displayName}</Text>
          <Text style={styles.roleTx}>{userRole || "Intern Developer"}</Text>
        </View>
        <View
          style={[
            styles.ringOuter,
            Platform.OS === "web"
              ? ({
                  background: `conic-gradient(rgba(255,255,255,0.9) ${overallPct * 3.6}deg, rgba(255,255,255,0.13) 0deg)`,
                } as any)
              : { borderWidth: 4, borderColor: "rgba(255,255,255,0.3)" },
          ]}
        >
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
          {
            icon: "⭐",
            val: String(
              Math.min(
                9999,
                completedTasks * 50 + goals.length * 120 + streak * 15,
              ),
            ),
            lbl: "Score",
          },
        ].map((s, i) => (
          <Animated.View
            key={i}
            style={[
              styles.chip,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: Animated.add(
                      slideAnim,
                      new Animated.Value(i * 5),
                    ),
                  },
                ],
              },
            ]}
          >
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
        <Animated.View
          style={[
            styles.emptyCard,
            {
              backgroundColor: dark
                ? "rgba(255,255,255,0.05)"
                : "rgba(99,102,241,0.04)",
              borderColor: cardBorder,
              ...cardShadow,
            },
            { opacity: fadeAnim },
          ]}
        >
          <Text style={styles.emptyEmoji}>🚀</Text>
          <Text style={[styles.emptyTitle, { color: textPrimary }]}>
            No goals yet
          </Text>
          <Text style={styles.emptySub}>
            Create your first learning goal to get started
          </Text>
          <Pressable
            onPress={() => setShowAddGoal(true)}
            disabled={!isSynced}
            style={({ pressed }) => [
              styles.emptyBtn,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.emptyBtnTx}>Create Goal →</Text>
          </Pressable>
        </Animated.View>
      )}

      {goals.length > 0 && (
        <View style={isTwoCol ? styles.gridWide : styles.gridNarrow}>
          {goals.map((g: any, index: number) => {
            const accent = GOAL_COLORS[index % GOAL_COLORS.length];
            const goalPct = getGoalProgress(g.id);
            const doneCnt = g.tasks.filter((t: any) => t.completed).length;

            return (
              <Animated.View
                key={g.id}
                className={Platform.OS === "web" ? "sk-hov" : undefined}
                style={[
                  styles.goalBox,
                  isTwoCol ? styles.goalBoxWide : styles.goalBoxFull,
                  {
                    backgroundColor: card,
                    borderColor: cardBorder,
                    borderLeftColor: accent,
                    ...cardShadow,
                  },
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: Animated.add(
                          slideAnim,
                          new Animated.Value(index * 7),
                        ),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.goalHeader}>
                  <View
                    style={[
                      styles.goalIconWrap,
                      { backgroundColor: accent + "1c" },
                    ]}
                  >
                    <Text style={{ fontSize: 20 }}>
                      {(g as any).icon ||
                        GOAL_EMOJIS[index % GOAL_EMOJIS.length]}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.goalTitle, { color: textPrimary }]}
                      numberOfLines={1}
                    >
                      {g.name}
                    </Text>
                    <View style={styles.goalMeta}>
                      <Text
                        style={[styles.goalMetaTx, { color: textSecondary }]}
                      >
                        {doneCnt}/{g.tasks.length} tasks
                      </Text>
                      <View
                        style={[
                          styles.goalMetaDot,
                          { backgroundColor: textSecondary },
                        ]}
                      />
                      <Text
                        style={[
                          styles.goalMetaTx,
                          { color: accent, fontWeight: "700" as const },
                        ]}
                      >
                        {goalPct}%
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.miniRing,
                      Platform.OS === "web"
                        ? ({
                            background: `conic-gradient(${accent} ${goalPct * 3.6}deg, ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"} 0deg)`,
                          } as any)
                        : { borderWidth: 2.5, borderColor: accent + "55" },
                    ]}
                  >
                    <View
                      style={[styles.miniRingIn, { backgroundColor: card }]}
                    >
                      <Text style={[styles.miniRingTx, { color: accent }]}>
                        {goalPct}%
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => {
                      taskCtx.deleteGoal(g.id);
                      showDelete("Goal removed successfully");
                      if (Platform.OS === "web") {
                        requestWebNotificationPermission().then((ok) => {
                          if (ok)
                            new Notification("SkillPath", {
                              body: `Goal "${g.name}" deleted 🗑`,
                            });
                        });
                      }
                    }}
                    style={({ pressed }) => [
                      styles.delGoalBtn,
                      pressed && { opacity: 0.55 },
                    ]}
                  >
                    <Text style={styles.delTx}>🗑</Text>
                  </Pressable>
                </View>

                {/* Progress bar */}
                <View style={{ marginBottom: 10, marginTop: 2 }}>
                  {Platform.OS === "web" ? (
                    <View
                      style={
                        {
                          height: 5,
                          backgroundColor: dark
                            ? "rgba(255,255,255,0.07)"
                            : "rgba(0,0,0,0.06)",
                          borderRadius: 99,
                          overflow: "hidden",
                        } as any
                      }
                    >
                      <View
                        style={
                          {
                            height: "100%",
                            width: `${goalPct}%`,
                            background: `linear-gradient(90deg,${accent},${accent}99)`,
                            borderRadius: 99,
                            boxShadow: `0 0 10px ${accent}66`,
                            transition: "width 1s cubic-bezier(.4,0,.2,1)",
                          } as any
                        }
                      />
                    </View>
                  ) : (
                    <ShimmerBar pct={goalPct} color={accent} h={5} />
                  )}
                </View>

                {/* Tasks */}
                {g.tasks.map((t: any) => (
                  <Pressable
                    key={t.id}
                    onHoverIn={() =>
                      Platform.OS === "web" && setHoveredTask(t.id)
                    }
                    onHoverOut={() =>
                      Platform.OS === "web" && setHoveredTask(null)
                    }
                    style={[
                      styles.taskRow,
                      {
                        backgroundColor: t.completed
                          ? accent + "0d"
                          : dark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.025)",
                        borderColor: t.completed ? accent + "28" : cardBorder,
                      },
                      Platform.OS === "web" &&
                        hoveredTask === t.id &&
                        ({ backgroundColor: accent + "14" } as any),
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
                        const today = new Date().toISOString().split("T")[0];
                        await setDoc(
                          doc(db, "users", user.uid),
                          { activityLog: { [today]: fsIncrement(1) } },
                          { merge: true },
                        );
                      }
                      const msg = t.completed
                        ? "Task marked incomplete"
                        : "Task completed 🎉";
                      showSuccess(msg);
                      if (Platform.OS === "web") {
                        requestWebNotificationPermission().then((ok) => {
                          if (ok) new Notification("SkillPath", { body: msg });
                        });
                      }
                    }}
                  >
                    <View style={styles.taskContent}>
                      <View
                        style={[
                          styles.cb,
                          t.completed
                            ? { backgroundColor: accent, borderColor: accent }
                            : {
                                backgroundColor: "transparent",
                                borderColor: dark
                                  ? "rgba(255,255,255,0.25)"
                                  : "rgba(0,0,0,0.2)",
                              },
                        ]}
                      >
                        {t.completed && <Text style={styles.tick}>✓</Text>}
                      </View>
                      <Text
                        style={[
                          styles.taskTx,
                          {
                            color: t.completed
                              ? dark
                                ? "rgba(255,255,255,0.35)"
                                : "rgba(0,0,0,0.3)"
                              : textSecondary,
                            textDecorationLine: t.completed
                              ? "line-through"
                              : "none",
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {t.title}
                      </Text>
                      <Pressable
                        onPress={() => {
                          taskCtx.deleteTask(g.id, t.id);
                          showDelete("Task removed");
                          if (Platform.OS === "web") {
                            requestWebNotificationPermission().then((ok) => {
                              if (ok)
                                new Notification("SkillPath", {
                                  body: "Task removed 🗑",
                                });
                            });
                          }
                        }}
                      >
                        <Text style={styles.delTx}>✕</Text>
                      </Pressable>
                    </View>
                  </Pressable>
                ))}

                {/* Add Task button */}
                <Pressable
                  style={[
                    styles.addTaskBtn,
                    { borderColor: accent + "44" },
                    !isSynced && { opacity: 0.5 },
                  ]}
                  disabled={!isSynced}
                  onPress={() => setShowAddTaskGoalId(g.id)}
                >
                  <Text style={[styles.addTaskTx, { color: accent }]}>
                    + Add Task
                  </Text>
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
    <View
      className={dark && Platform.OS === "web" ? "sk-dark-screen" : undefined}
      style={[styles.screen, { backgroundColor: bg }]}
    >
      <StatusBar barStyle="light-content" backgroundColor={headerBg} />

      {/* Offline banner */}
      {!isSynced && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineTx}>
            ⚡ You are offline. Changes will sync when online.
          </Text>
        </View>
      )}

      {isWide ? (
        /* ══ DESKTOP LAYOUT (960px+) ══ */
        <View style={styles.wideRoot}>
          {/* Sidebar — collapsible on desktop */}
          {Platform.OS === "web" && (
  <View
    className="sk-sidebar"
    style={
      {
        width: sidebarOpen ? 260 : 0,
        minWidth: sidebarOpen ? 260 : 0,
        overflow: "hidden",
      } as any
    }
  >
    <Sidebar
      dark={dark}
      router={router}
      isSynced={isSynced}
      overallPct={overallPct}
      displayName={userData?.displayName || "User"}
      goals={goals}
      completedTasks={completedTasks}
      totalTasks={totalTasks}
      userRole={userData?.role || "Learner"}
    />
  </View>
)}
{Platform.OS !== "web" && (
  <Sidebar
    dark={dark}
    router={router}
    isSynced={isSynced}
    overallPct={overallPct}
    displayName={userData?.displayName || "User"}
    goals={goals}
    completedTasks={completedTasks}
    totalTasks={totalTasks}
    userRole={userData?.role || "Learner"}
  />
)}

          {/* Center + Right */}
          <View style={styles.wideCenter}>
            {/* Top bar */}
            <TopBar
              dark={dark}
              router={router}
              displayName={userData?.displayName || "User"}
              email={userEmail}
              darkMode={dark}
              setDarkMode={setDarkMode}
              isSynced={isSynced}
              pulseAnim={pulseAnim}
              overallPct={overallPct}
              streak={userData?.streak || 0}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              userRole={userData?.role || "Learner"}
              onShowV2={() => showComingSoon()}
              totalTasks={totalTasks}
              completedTasks={completedTasks}
              goals={goals}
              skillScore={skillScore} 
            />

            <ScrollView
              style={styles.widePadded}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
            >
              {/* Hero */}
              <HeroBanner
                dark={dark}
                displayName={userData?.displayName || "User"}
                overallPct={overallPct}
                isSynced={isSynced}
                fadeAnim={fadeAnim}
                slideAnim={slideAnim}
              />

              {/* Stat cards */}
              <StatCards
                dark={dark}
                goals={goals}
                completedTasks={completedTasks}
                streak={userData?.streak || 0}
                activityToday={activityToday}
                fadeAnim={fadeAnim}
                slideAnim={slideAnim}
              />

              {/* Activity HeatMap */}
              <Animated.View
                style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }}
              >
                <HeatMap activityLog={activityLog} dark={dark} />
              </Animated.View>

              {/* Goals + Right panel row */}
              <View style={styles.wideContentRow}>
                {/* Goals col */}
                <View style={{ flex: 1, minWidth: 0 }}>
                  {/* Goals header — inside goals column so it aligns with the cards */}
                  <Animated.View
                    style={[
                      styles.goalsHdr,
                      {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.secTitle,
                        { color: dark ? "#E5E7EB" : "#334155" },
                      ]}
                    >
                      Your Goals
                    </Text>
                    <Pressable
                      onPress={() => setShowAddGoal(true)}
                      disabled={!isSynced}
                      style={({ pressed }) => [
                        styles.addGoalBtn,
                        !isSynced && { opacity: 0.5 },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <Text style={styles.addGoalTx}>+ Add Goal</Text>
                    </Pressable>
                  </Animated.View>
                  <GoalList />
                </View>

                {/* Right panel */}
                <RightPanel
                  dark={dark}
                  goals={goals}
                  getGoalProgress={getGoalProgress}
                  // getRecommendation={getRecommendation}
                  getRecommendation={getInsight}
                  fadeAnim={fadeAnim}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      ) : isTablet ? (
        /* ══ TABLET LAYOUT (600–959px) ══ */
        <View
          style={[
            styles.wrapper,
            { paddingTop: Platform.OS === "ios" ? 52 : 10 },
          ]}
        >
          {/* Compact top row */}
          <View style={styles.tabletTopRow}>
            <View>
              <Text
                style={[
                  styles.secTitle,
                  { color: dark ? "#eef2ff" : "#0f172a", fontSize: 20 },
                ]}
              >
                Dashboard
              </Text>
              <Text
                style={{
                  color: dark
                    ? "rgba(238,242,255,0.45)"
                    : "rgba(15,23,42,0.45)",
                  fontSize: 11,
                  fontWeight: "500",
                }}
              >
                {displayName}
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
              >
                <Text style={{ fontSize: 12 }}>{dark ? "🌙" : "☀️"}</Text>
                <Switch
                  value={dark}
                  onValueChange={async (v) => {
                    setDarkMode(v);
                    await saveTheme(v);
                  }}
                  trackColor={{ false: "rgba(0,0,0,0.12)", true: "#6366f1" }}
                  thumbColor="#fff"
                  style={{ transform: [{ scaleX: 0.78 }, { scaleY: 0.78 }] }}
                />
              </View>
              <Pressable
                onPress={() => router.push("/profile")}
                style={[styles.mAvatar, { backgroundColor: "#6366f1" }]}
              >
                <Text style={[styles.mAvatarTx, { color: "white" }]}>
                  {initials}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleLogout}
                style={[
                  styles.logoutBtn,
                  {
                    backgroundColor: dark
                      ? "rgba(239,68,68,0.12)"
                      : "rgba(239,68,68,0.08)",
                    borderColor: "rgba(239,68,68,0.2)",
                  },
                ]}
              >
                <Text style={[styles.logoutTx, { color: "#ef4444" }]}>
                  Logout
                </Text>
              </Pressable>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {/* Hero compact */}
            <HeroBanner
              dark={dark}
              displayName={displayName}
              overallPct={overallPct}
              isSynced={isSynced}
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
            />

            {/* Goals header + 2-col grid */}
            <Animated.View
              style={[
                styles.goalsHdr,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <Text
                style={[
                  styles.secTitle,
                  { color: dark ? "#E5E7EB" : "#334155" },
                ]}
              >
                Your Goals
              </Text>
              <Pressable
                onPress={() => setShowAddGoal(true)}
                disabled={!isSynced}
                style={({ pressed }) => [
                  styles.addGoalBtn,
                  !isSynced && { opacity: 0.5 },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.addGoalTx}>+ Add Goal</Text>
              </Pressable>
            </Animated.View>
            <GoalList />
          </ScrollView>
        </View>
      ) : (
        /* ══ MOBILE / NARROW LAYOUT ══ */
        <View style={styles.wrapper}>
          <MobileHeader 
  dark={dark}
  darkMode={darkMode}
  setDarkMode={setDarkMode}
  displayName={displayName}
  overallPct={overallPct}
  completedTasks={completedTasks}
  totalGoals={goals.length}
  streak={streak}
  skillScore={skillScore} 
/>

          {/* Rec card */}
          <Animated.View
            style={[
              styles.recCard,
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
                <Text
                  style={[
                    styles.recTitle,
                    { color: dark ? "#FFFFFF" : COLORS.secondary },
                  ]}
                >
                  📌 Your Recommendation
                </Text>
                <Text style={[styles.recBody, { color: recText }]}>
                  {getRecommendation()}
                </Text>
              </View>
            </View>
            <View style={styles.recProgRow}>
              <Text style={[styles.progTx, { color: recText }]}>
                Overall progress
              </Text>
              <Text
                style={[
                  styles.progTx,
                  {
                    color: dark ? "#a78bfa" : COLORS.primary,
                    fontWeight: "800" as const,
                  },
                ]}
              >
                {overallPct}%
              </Text>
            </View>
            <ShimmerBar
              pct={overallPct}
              color={dark ? "#6366f1" : COLORS.primary}
              h={7}
            />
          </Animated.View>

          {/* Goals header */}
          <Animated.View
            style={[
              styles.goalsHdr,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text
              style={[styles.secTitle, { color: dark ? "#E5E7EB" : "#334155" }]}
            >
              Your Goals
            </Text>
            <Pressable
              onPress={() => setShowAddGoal(true)}
              disabled={!isSynced}
              style={({ pressed }) => [
                styles.addGoalBtn,
                !isSynced && { opacity: 0.5 },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.addGoalTx}>＋ Add Goal</Text>
            </Pressable>
          </Animated.View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 108 }}
          >
            <GoalList />
          </ScrollView>

          {/* Bottom bar */}
          <View
            style={[
              styles.bottomBar,
              {
                backgroundColor: dark
                  ? "rgba(2,6,23,0.96)"
                  : "rgba(240,244,255,0.96)",
                borderTopColor: cardBorder,
              },
            ]}
          >
            <Pressable
              style={[styles.bbBtn, styles.reminderBtn]}
              onPress={() => {
                if (Platform.OS === "web") {
                  showError("Smart reminders work only on mobile app");
                  return;
                }
                setShowPicker(true);
              }}
            >
              <Text style={styles.bbTx}>🔔 Smart Reminder</Text>
            </Pressable>
            <Pressable
              style={[styles.bbBtn, styles.analyticsBtn]}
              onPress={() => router.push("/analytics")}
            >
              <Text style={styles.bbTx}>📊 Analytics</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Inline Goal Modal ── */}
      {showAddGoal && (
        <AddGoalModal
          dark={dark}
          onClose={() => setShowAddGoal(false)}
          addGoalFn={(name: string, icon: string) =>
            taskCtx.addGoal(name, icon)
          }
        />
      )}
      {/* ── Inline Task Modal ── */}
      {showAddTaskGoalId && (
        <AddTaskModal
          dark={dark}
          goalId={showAddTaskGoalId}
          onClose={() => setShowAddTaskGoalId(null)}
          addTaskFn={(gId: string, title: string) =>
            taskCtx.addTask(gId, title)
          }
        />
      )}

      {/* DateTimePicker */}
      {showPicker && Platform.OS !== "web" && (
        <DateTimePicker
          value={reminderTime}
          mode="time"
          is24Hour
          display="default"
          onChange={async (_, sel) => {
            setShowPicker(false);
            if (!sel) return;
            setReminderTime(sel);
            const h = sel.getHours(),
              m = sel.getMinutes();
            const granted = await requestNotificationPermission();
            if (!granted) {
              showError("Notification permission denied");
              return;
            }
            if (!hasPendingTasks()) {
              showSuccess("No pending tasks. You're all caught up 🎉");
              return;
            }
            await scheduleDailyReminder(h, m);
            showSuccess(
              `Reminder set for ${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`,
            );
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
  screen: { flex: 1 },
  wrapper: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 52 : 14,
  },

  /* Wide layout */
  wideRoot: { flex: 1, flexDirection: "row" } as any,
  wideCenter: { flex: 1, flexDirection: "column", minWidth: 0 } as any,
  widePadded: { flex: 1, paddingHorizontal: 28, paddingTop: 28 },
  wideContentRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  } as any,

  /* Tablet */
  tabletTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  /* Offline */
  offlineBanner: {
    backgroundColor: "#FEF3C7",
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 4,
  },
  offlineTx: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  /* Mobile header */
  mHdr: {
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
  } as any,
  mHdrRow1: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    zIndex: 1,
  },
  mHdrRow2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
    zIndex: 1,
  },
  mHdrControls: { flexDirection: "row", alignItems: "center", gap: 9 },
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
  syncTx: { fontSize: 11, fontWeight: "700" },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  mAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.45)",
  },
  mAvatarTx: { fontWeight: "800", fontSize: 14, color: "#1e3a8a" },
  logoutBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  logoutTx: { color: "white", fontWeight: "700", fontSize: 12 },
  welcomeTx: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  nameTx: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  roleTx: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  ringOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  ringPct: { color: "white", fontSize: 13, fontWeight: "900" },
  ringDone: { color: "rgba(255,255,255,0.55)", fontSize: 9, fontWeight: "500" },
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
  chipIcon: { fontSize: 15, marginBottom: 3 },
  chipVal: { color: "white", fontSize: 14, fontWeight: "900" },
  chipLbl: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 9,
    fontWeight: "500",
    marginTop: 1,
  },

  /* Rec card (mobile) */
  recCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  recRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    marginBottom: 10,
  },
  recIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(99,102,241,0.14)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  recTitle: { fontWeight: "800", fontSize: 15, marginBottom: 3 },
  recBody: { fontSize: 13, fontWeight: "500", lineHeight: 18 },
  recProgRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },
  progTx: { fontSize: 11, fontWeight: "500" },

  /* Goals */
  goalsHdr: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingVertical: 0,
  },
  secTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
    ...(Platform.OS === "web"
      ? ({ fontFamily: "Outfit,sans-serif" } as any)
      : {}),
  },
  addGoalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1",
    ...(Platform.OS === "web"
      ? ({
          background: "linear-gradient(135deg,#6366f1,#a78bfa)",
          boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
        } as any)
      : { elevation: 5 }),
  },
  addGoalTx: { color: "white", fontWeight: "700", fontSize: 14 },

  gridNarrow: { width: "100%" },
  gridWide: { flexDirection: "row", flexWrap: "wrap" } as any,

  goalBox: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  goalBoxFull: { width: "100%" },
  goalBoxWide: { width: "49%", marginHorizontal: "0.5%" },

  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 14,
  },
  goalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  goalTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 3,
    ...(Platform.OS === "web"
      ? ({ fontFamily: "Outfit,sans-serif" } as any)
      : {}),
  },
  goalMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  goalMetaTx: { fontSize: 12, fontWeight: "500" },
  goalMetaDot: { width: 4, height: 4, borderRadius: 2 },
  miniRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  miniRingIn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  miniRingTx: { fontSize: 10, fontWeight: "800" },
  delGoalBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web" ? ({ transition: "all .15s" } as any) : {}),
  },
  delTx: { color: "#EF4444", fontSize: 15 },

  chevBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web" ? ({ transition: "transform .2s" } as any) : {}),
  },
  chevTx: { fontSize: 16, lineHeight: 18 },

  taskRow: {
    marginBottom: 6,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    ...(Platform.OS === "web"
      ? ({ transition: "background .15s", cursor: "pointer" } as any)
      : {}),
  },
  taskContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  cb: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tick: { color: "white", fontSize: 11, fontWeight: "800" },
  taskTx: { fontSize: 14, fontWeight: "500", flex: 1 },
  addTaskBtn: {
    marginTop: 8,
    paddingVertical: 11,
    alignItems: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 12,
    ...(Platform.OS === "web"
      ? ({ transition: "all .15s", cursor: "pointer" } as any)
      : {}),
  },
  addTaskTx: { fontWeight: "700", fontSize: 13 },

  emptyCard: {
    borderRadius: 20,
    padding: 36,
    alignItems: "center",
    borderWidth: 1,
    marginTop: 6,
  },
  emptyEmoji: { fontSize: 42, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "800", marginBottom: 6 },
  emptySub: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 19,
    color: "#64748B",
  },
  emptyBtn: {
    marginTop: 20,
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnTx: { color: "white", fontWeight: "700", fontSize: 13 },

  bottomBar: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 2,
    borderTopWidth: 1,
  },
  bbBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderBtn: {
    backgroundColor: "#f97316",
    ...(Platform.OS === "web"
      ? { boxShadow: "0 4px 16px rgba(249,115,22,0.42)" }
      : { elevation: 5 }),
  },
  analyticsBtn: {
    backgroundColor: "#6366f1",
    ...(Platform.OS === "web"
      ? { boxShadow: "0 4px 16px rgba(99,102,241,0.42)" }
      : { elevation: 5 }),
  },
  bbTx: { color: "white", fontWeight: "700", fontSize: 14 },
});
