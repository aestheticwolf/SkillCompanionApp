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
  Image,
} from "react-native";

import { useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import SkillPathLogo from "../src/components/SkillPathLogo";
import { useWindowDimensions } from "react-native";
import { AuthContext } from "../src/context/AuthContext";
import { TaskContext } from "../src/context/TaskContext";
import { loadTheme, saveTheme } from "../src/services/uiPreferences";
import { listenToNetwork } from "../src/services/network";
import { showSuccess } from "../src/services/toast";
import { signOut, updateProfile, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { auth, db } from "../src/services/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

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
      .sk-sidebar{transition:width .28s cubic-bezier(.4,0,.2,1),min-width .28s;overflow:hidden;flex-shrink:0}
      .sk-hamb:hover{background:rgba(99,102,241,0.08)!important}
      @keyframes sk-fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
      .sk-fadeUp{animation:sk-fadeUp .3s ease both}
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

/* ════════════════════════════════
   PROFILE DROPDOWN (Match Dashboard)
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
            { v: `${Math.min(9999, 0)}⭐`, l: "Score" },
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
   NOTIFICATION DROPDOWN (Match Dashboard)
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

/* ════ SIDEBAR — same as dashboard ════ */
function Sidebar({ dark, router, overallPct, completedTasks, totalTasks }: any) {
  const bg     = dark ? "#0a0f20" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const txtPri = dark ? "#eef2ff" : "#0f172a";
  const txtMut = dark ? "rgba(238,242,255,0.45)" : "rgba(15,23,42,0.45)";
  const NAV = [
  { icon: "🏠", label: "Dashboard", route: "/dashboard", active: false },
  { icon: "📊", label: "Analytics",  route: "/analytics", active: false },
  { icon: "🔔", label: "Reminders",  route: "/notifications", active: false },
  { icon: "⚙️", label: "Settings",   route: "/settings", active: false },
];
  return (
    <View style={[sbSt.wrap, { backgroundColor: bg, borderRightColor: border }]}>
      <View style={sbSt.logoRow}>
        <View style={[sbSt.logoIcon, Platform.OS === "web" ? { animation: "sk-glow 3s ease-in-out infinite" } as any : {}]}>
          <SkillPathLogo size={48} />
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
      {NAV.map((n: any, i: number) => (
        <Pressable key={i} onPress={() => {
          if (n.v2) { showSuccess("🚀 Coming in v2 — stay tuned!"); return; }
          n.route && router.push(n.route);
        }}
          style={({ pressed }) => [sbSt.navItem,
            n.active && { backgroundColor: dark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)" },
            n.v2 && { opacity: 0.55 },
            pressed && { opacity: 0.75 }]}>
          <Text style={{ fontSize: 16 }}>{n.icon}</Text>
          <Text style={[sbSt.navTx, { color: n.active ? ACCENT : n.v2 ? txtMut : txtPri, fontWeight: n.active ? "700" : "500" }]}>{n.label}</Text>
          {n.active && <View style={sbSt.activeBar} />}
          {n.v2 && (
            <View style={{ backgroundColor: "rgba(99,102,241,0.12)", borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ fontSize: 9, fontWeight: "700", color: ACCENT }}>v2</Text>
            </View>
          )}
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
      <View style={[sbSt.userRow, { backgroundColor: dark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.06)", borderColor: ACCENT + "33" }]}>
        <View style={[sbSt.userAvatar,
          Platform.OS === "web" ? { background: "linear-gradient(135deg,#f97316,#ef4444)" } as any : { backgroundColor: "#f97316" }]}>
          <Text style={{ color: "white", fontWeight: "800", fontSize: 15 }}>R</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: txtPri }}>My Profile</Text>
          <Text style={{ fontSize: 11, fontWeight: "500", color: ACCENT }}>Active ✓</Text>
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
  userRow:    { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, borderWidth: 1,
    ...(Platform.OS === "web" ? { cursor: "pointer", transition: "opacity .15s" } as any : {}),
  },
  userAvatar: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  onlineDot:  { width: 8, height: 8, borderRadius: 4 },
});

/* ════ TOP BAR — Match Dashboard Exactly ════ */
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
              borderColor: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
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
          <Text style={[tbSt.title, { color: txtPri }]}>Profile</Text>
          <Text style={{ fontSize: 12, fontWeight: "500", marginTop: 1, color: txtSec }}>
            Dashboard › My Profile
          </Text>
        </View>
      </View>

      {Platform.OS === "web" && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {/* Clock — web only (Match Dashboard) */}
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

          {/* Dark mode toggle — web only (Match Dashboard) */}
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

          {/* Bell with sync dot (Match Dashboard) */}
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
            
            {/* ✅ SYNC DOT (matches dashboard.tsx) */}
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

          {/* Avatar + profile dropdown (Match Dashboard) */}
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
                onShowV2={() => showSuccess("🚀 Coming in v2 — stay tuned!")}
                router={router}
                onLogoutReset={resetNotificationState}
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
   MAIN PROFILE
════════════════════════════════ */
export default function Profile() {
  const router  = useRouter();
  const authCtx = useContext(AuthContext);
  const taskCtx = useContext(TaskContext);

  if (!authCtx || !authCtx.user || !taskCtx) return null;

  const { user, userData } = authCtx;
  const { goals, getOverallProgress } = taskCtx;

  const [darkMode,    setDarkMode]    = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [role,        setRole]        = useState("Intern Developer");
  const [editingRole,  setEditingRole]  = useState(false);
  const [roleInput,    setRoleInput]    = useState("Intern Developer");
  const [editingName,  setEditingName]  = useState(false);
  const [nameInput,    setNameInput]    = useState("");
  const [savingName,   setSavingName]   = useState(false);
  const [showPwdForm,  setShowPwdForm]  = useState(false);
  const [currentPwd,   setCurrentPwd]   = useState("");
  const [newPwd,       setNewPwd]       = useState("");
  const [confirmPwd,   setConfirmPwd]   = useState("");
  const [pwdError,     setPwdError]     = useState("");
  const [pwdSuccess,   setPwdSuccess]   = useState(false);
  const [savingPwd,    setSavingPwd]    = useState(false);
  
  /* ✅ ADD THESE FOR SYNC DOT (Match Dashboard) */
  const [isSynced, setIsSynced] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  /* Live streak from Firestore — same as dashboard */
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    loadTheme().then(setDarkMode);
    const unsub = listenToNetwork(setIsSynced);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authCtx?.user?.uid) return;
    const userRef = doc(db, "users", authCtx.user.uid);
    const unsub   = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setStreak(snap.data().streak || 0);
        const r = snap.data().role || "Intern Developer";
        setRole(r);
        setRoleInput(r);
      }
    });
    return unsub;
  }, [authCtx?.user?.uid]);

  /* ✅ ADD PULSE ANIMATION (Match Dashboard) */
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

  /* Sync nameInput whenever Firebase Auth displayName changes */
  useEffect(() => {
    const dn =
  authCtx?.userData?.displayName ||
  authCtx?.user?.displayName ||
  authCtx?.user?.email ||
  "";
    if (dn && dn !== authCtx?.user?.email) {
      setNameInput(dn);
    }
  }, [authCtx?.user?.displayName]);

  /* ── Animations — original preserved ── */
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(40)).current;
  const scaleAvatar = useRef(new Animated.Value(0.7)).current;
  const hdrScale    = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim,   { toValue: 0, useNativeDriver: true, tension: 65, friction: 10 }),
      Animated.timing(fadeAnim,    { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.spring(hdrScale,    { toValue: 1, useNativeDriver: true, tension: 80, friction: 9 }),
      Animated.spring(scaleAvatar, { toValue: 1, useNativeDriver: true, tension: 70, friction: 8, delay: 120 }),
    ]).start();
  }, []);

  /* ── ALL hooks must be before any conditional return ── */
  const { width: screenW } = useWindowDimensions();
  const isWide = Platform.OS === "web" && screenW >= 960;

  /* ── Handlers — 100% original logic unchanged ── */
  const changePassword = async () => {
    setPwdError("");
    if (!currentPwd) { setPwdError("Please enter your current password."); return; }
    if (newPwd.length < 6) { setPwdError("New password must be at least 6 characters."); return; }
    if (newPwd !== confirmPwd) { setPwdError("Passwords do not match."); return; }
    setSavingPwd(true);
    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPwd);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPwd);
      setPwdSuccess(true);
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      setTimeout(() => { setPwdSuccess(false); setShowPwdForm(false); }, 3000);
    } catch (err: any) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setPwdError("Current password is incorrect.");
      } else {
        setPwdError("Failed to update password. Please try again.");
      }
    } finally {
      setSavingPwd(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const saveRole = async () => {
    const trimmed = roleInput.trim() || "Intern Developer";
    setRole(trimmed);
    setEditingRole(false);
    if (authCtx?.user?.uid) {
      await setDoc(doc(db, "users", authCtx.user.uid), { role: trimmed }, { merge: true });
    }
  };

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) { setEditingName(false); return; }
    setSavingName(true);
    try {
      await updateProfile(user, { displayName: trimmed });
      /* Also persist to Firestore so it syncs across screens */
      if (authCtx?.user?.uid) {
        await setDoc(doc(db, "users", authCtx.user.uid), { displayName: trimmed }, { merge: true });
      }
    } catch (e) {
      Alert.alert("Error", "Could not update name.");
    } finally {
      setSavingName(false);
      setEditingName(false);
    }
  };

  /* ── Derived data — original unchanged ── */
  /* ✅ KEY FIX: Use userData from AuthContext like dashboard.tsx */
  const displayName = userData?.displayName || user?.displayName || user?.email || "User";
  const initials    = displayName.charAt(0).toUpperCase();
  const email       = user?.email || "";

  const totalGoals     = goals?.length ?? 0;
  const completedTasks = goals?.reduce(
    (a: number, g: any) => a + g.tasks.filter((t: any) => t.completed).length, 0
  ) ?? 0;
  const totalTasks = goals?.reduce(
    (a: number, g: any) => a + g.tasks.length, 0
  ) ?? 0;
  const overallPct = getOverallProgress();

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

  /* Toggle dark mode */
  const toggleDark = async () => {
    const next = !darkMode;
    setDarkMode(next);
    await saveTheme(next);
  };

  /* STATS — streak now live */
  const STATS = [
    { icon: "🎯", val: totalGoals,     lbl: "Goals",      color: ACCENT    },
    { icon: "✅", val: completedTasks, lbl: "Done",       color: "#34d399" },
    { icon: "🔥", val: streak,         lbl: "Day Streak", color: "#f97316" },
    { icon: "⭐", val: Math.min(9999, completedTasks * 50 + totalGoals * 120 + streak * 15), lbl: "Score", color: "#fbbf24" },
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
              <Text style={styles.roleTx}>👨‍💻 {role}</Text>
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
              { icon: "👤", lbl: "Name",   val: displayName, color: ACCENT, editable: "name" },
              { icon: "✉️", lbl: "Email",  val: email,       color: "#06b6d4" },
              { icon: "🏷️", lbl: "Role",   val: role,        color: "#a78bfa", editable: "role" },
              { icon: "📅", lbl: "Member", val: `Since ${new Date(user.metadata?.creationTime || "2025").getFullYear()}`, color: "#34d399" },
            ].map((row: any, i: number) => (
              <View key={i} style={[styles.infoRow, { borderColor: cardBorder },
                i === 3 && { borderBottomWidth: 0 }]}>
                <View style={[styles.infoIconWrap, { backgroundColor: row.color + "14" }]}>
                  <Text style={{ fontSize: 16 }}>{row.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoLbl, { color: textMuted }]}>{row.lbl}</Text>
                  {row.editable === "name" && editingName ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
                      {Platform.OS === "web" ? (
                        <input
                          value={nameInput}
                          onChange={(e: any) => setNameInput(e.target.value)}
                          onKeyDown={(e: any) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                          autoFocus
                          style={{
                            flex: 1, fontSize: 14, fontWeight: "700", fontFamily: "inherit",
                            border: "none", borderBottom: `2px solid ${ACCENT}`, outline: "none",
                            background: "transparent", color: dark ? "#eef2ff" : "#0f172a",
                            padding: "2px 0",
                          } as any}
                        />
                      ) : (
                        <Text style={[styles.infoVal, { color: textPrimary }]}>{nameInput}</Text>
                      )}
                      <Pressable onPress={saveName} disabled={savingName}
                        style={{ backgroundColor: ACCENT, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, opacity: savingName ? 0.6 : 1 }}>
                        <Text style={{ color: "white", fontSize: 11, fontWeight: "800" }}>{savingName ? "..." : "Save"}</Text>
                      </Pressable>
                      <Pressable onPress={() => { setEditingName(false); setNameInput(displayName); }}>
                        <Text style={{ color: textMuted, fontSize: 11, fontWeight: "600" }}>Cancel</Text>
                      </Pressable>
                    </View>
                  ) : row.editable === "role" && editingRole ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
                      {Platform.OS === "web" ? (
                        <input
                          value={roleInput}
                          onChange={(e: any) => setRoleInput(e.target.value)}
                          onKeyDown={(e: any) => { if (e.key === "Enter") saveRole(); if (e.key === "Escape") setEditingRole(false); }}
                          autoFocus
                          style={{
                            flex: 1, fontSize: 14, fontWeight: "700", fontFamily: "inherit",
                            border: "none", borderBottom: `2px solid #a78bfa`, outline: "none",
                            background: "transparent", color: dark ? "#eef2ff" : "#0f172a",
                            padding: "2px 0",
                          } as any}
                        />
                      ) : (
                        <Text style={[styles.infoVal, { color: textPrimary }]}>{roleInput}</Text>
                      )}
                      <Pressable onPress={saveRole} style={{ backgroundColor: "#a78bfa", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ color: "white", fontSize: 11, fontWeight: "800" }}>Save</Text>
                      </Pressable>
                      <Pressable onPress={() => { setEditingRole(false); setRoleInput(role); }}>
                        <Text style={{ color: textMuted, fontSize: 11, fontWeight: "600" }}>Cancel</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={[styles.infoVal, { color: textPrimary }]}>{row.val}</Text>
                  )}
                </View>
                {row.editable ? (
                  <Pressable onPress={() => {
                    if (row.editable === "name") { setEditingName(true); setNameInput(displayName); }
                    else { setEditingRole(true); setRoleInput(role); }
                  }} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                    <Text style={{ fontSize: 12, color: row.editable === "name" ? ACCENT : "#a78bfa", fontWeight: "700",
                      ...(Platform.OS === "web" ? { cursor: "pointer" } as any : {}),
                    }}>✏️ Edit</Text>
                  </Pressable>
                ) : (
                  <Text style={{ fontSize: 13, color: textMuted }}>›</Text>
                )}
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

            {/* Change Password button */}
            <Pressable
              className={Platform.OS === "web" ? "sk-btn-hov" : undefined}
              onPress={() => { setShowPwdForm(f => !f); setPwdError(""); setPwdSuccess(false); }}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: showPwdForm ? (dark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)") : ACCENT,
                  borderWidth: showPwdForm ? 1 : 0,
                  borderColor: ACCENT + "44",
                  ...(Platform.OS === "web" && !showPwdForm
                    ? { background: "linear-gradient(135deg,#6366f1,#a78bfa)", boxShadow: "0 6px 20px rgba(99,102,241,0.4)" }
                    : {}),
                },
                pressed && { opacity: 0.82 },
              ]}
            >
              <View style={styles.actionBtnInner}>
                <Text style={styles.actionIcon}>🔑</Text>
                <View>
                  <Text style={[styles.actionTitle, showPwdForm && { color: ACCENT }]}>Change Password</Text>
                  <Text style={[styles.actionSub, showPwdForm && { color: dark ? "rgba(99,102,241,0.6)" : "rgba(99,102,241,0.5)" }]}>
                    {showPwdForm ? "Enter details below" : "Update your account password"}
                  </Text>
                </View>
              </View>
              <Text style={[styles.actionArrow, showPwdForm && { color: ACCENT }]}>{showPwdForm ? "✕" : "→"}</Text>
            </Pressable>

            {/* Inline change password form */}
            {showPwdForm && (
              <View style={{
                borderRadius: 16, borderWidth: 1,
                borderColor: ACCENT + "22",
                backgroundColor: dark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.04)",
                padding: 16, marginBottom: 10,
                ...(Platform.OS === "web" ? { animation: "sk-fadeUp .2s ease both" } as any : {}),
              }}>
                {pwdSuccess ? (
                  <View style={{ alignItems: "center", paddingVertical: 12 }}>
                    <Text style={{ fontSize: 28, marginBottom: 8 }}>✅</Text>
                    <Text style={{ fontSize: 15, fontWeight: "800", color: "#34d399", marginBottom: 4 }}>Password Updated!</Text>
                    <Text style={{ fontSize: 12, color: dark ? "rgba(52,211,153,0.7)" : "rgba(5,150,105,0.8)" }}>Your password has been changed successfully.</Text>
                  </View>
                ) : (
                  <>
                    {/* Error message */}
                    {!!pwdError && (
                      <View style={{ backgroundColor: "#ef444418", borderRadius: 10, borderWidth: 1, borderColor: "#ef444433", padding: 10, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{ fontSize: 14 }}>⚠️</Text>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: "#ef4444", flex: 1 }}>{pwdError}</Text>
                      </View>
                    )}
                    {/* Current password */}
                    <Text style={{ fontSize: 11, fontWeight: "700", color: textMuted, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 6 }}>Current Password</Text>
                    {Platform.OS === "web" ? (
                      <input type="password" value={currentPwd} onChange={(e: any) => setCurrentPwd(e.target.value)} placeholder="Enter current password"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, background: dark ? "rgba(255,255,255,0.05)" : "#f8faff", color: dark ? "#eef2ff" : "#0f172a", fontSize: 14, marginBottom: 12, outline: "none", fontFamily: "inherit" } as any} />
                    ) : (
                      <View style={{ backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#f8faff", borderRadius: 10, borderWidth: 1, borderColor: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)", paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 }}>
                        <Text style={{ color: textSecondary, fontSize: 14 }}>{currentPwd ? "••••••••" : "Enter current password"}</Text>
                      </View>
                    )}
                    {/* New password */}
                    <Text style={{ fontSize: 11, fontWeight: "700", color: textMuted, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 6 }}>New Password</Text>
                    {Platform.OS === "web" ? (
                      <input type="password" value={newPwd} onChange={(e: any) => setNewPwd(e.target.value)} placeholder="Min 6 characters"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, background: dark ? "rgba(255,255,255,0.05)" : "#f8faff", color: dark ? "#eef2ff" : "#0f172a", fontSize: 14, marginBottom: 12, outline: "none", fontFamily: "inherit" } as any} />
                    ) : (
                      <View style={{ backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#f8faff", borderRadius: 10, borderWidth: 1, borderColor: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)", paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 }}>
                        <Text style={{ color: textSecondary, fontSize: 14 }}>{newPwd ? "••••••••" : "Min 6 characters"}</Text>
                      </View>
                    )}
                    {/* Confirm password */}
                    <Text style={{ fontSize: 11, fontWeight: "700", color: textMuted, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 6 }}>Confirm New Password</Text>
                    {Platform.OS === "web" ? (
                      <input type="password" value={confirmPwd} onChange={(e: any) => setConfirmPwd(e.target.value)}
                        onKeyDown={(e: any) => { if (e.key === "Enter") changePassword(); }}
                        placeholder="Repeat new password"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, background: dark ? "rgba(255,255,255,0.05)" : "#f8faff", color: dark ? "#eef2ff" : "#0f172a", fontSize: 14, marginBottom: 16, outline: "none", fontFamily: "inherit" } as any} />
                    ) : (
                      <View style={{ backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#f8faff", borderRadius: 10, borderWidth: 1, borderColor: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)", paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 }}>
                        <Text style={{ color: textSecondary, fontSize: 14 }}>{confirmPwd ? "••••••••" : "Repeat new password"}</Text>
                      </View>
                    )}
                    {/* Strength indicator */}
                    {newPwd.length > 0 && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
                        {[1,2,3,4].map(lvl => (
                          <View key={lvl} style={{ flex: 1, height: 4, borderRadius: 99, backgroundColor:
                            newPwd.length >= lvl * 3
                              ? (lvl <= 1 ? "#ef4444" : lvl <= 2 ? "#f97316" : lvl <= 3 ? "#fbbf24" : "#34d399")
                              : (dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)") }} />
                        ))}
                        <Text style={{ fontSize: 11, fontWeight: "700", color:
                          newPwd.length < 4 ? "#ef4444" : newPwd.length < 7 ? "#f97316" : newPwd.length < 10 ? "#fbbf24" : "#34d399" }}>
                          {newPwd.length < 4 ? "Weak" : newPwd.length < 7 ? "Fair" : newPwd.length < 10 ? "Good" : "Strong"}
                        </Text>
                      </View>
                    )}
                    {/* Action buttons */}
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <Pressable onPress={changePassword} disabled={savingPwd}
                        style={({ pressed }) => ({
                          flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: "center",
                          backgroundColor: ACCENT, opacity: (savingPwd || pressed) ? 0.75 : 1,
                          ...(Platform.OS === "web" ? { background: "linear-gradient(135deg,#6366f1,#a78bfa)", boxShadow: "0 4px 16px rgba(99,102,241,0.4)", cursor: "pointer" } as any : {}),
                        })}>
                        <Text style={{ color: "white", fontWeight: "800", fontSize: 14 }}>{savingPwd ? "Saving..." : "Update Password"}</Text>
                      </Pressable>
                      <Pressable onPress={() => { setShowPwdForm(false); setCurrentPwd(""); setNewPwd(""); setConfirmPwd(""); setPwdError(""); }}
                        style={({ pressed }) => ({
                          paddingHorizontal: 18, paddingVertical: 13, borderRadius: 12, borderWidth: 1,
                          borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
                          backgroundColor: pressed ? (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)") : "transparent",
                        })}>
                        <Text style={{ color: textSecondary, fontWeight: "700", fontSize: 14 }}>Cancel</Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            )}

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
        {Platform.OS === "web" ? (
          <View className="sk-sidebar" style={{ width: sidebarOpen ? 260 : 0, minWidth: sidebarOpen ? 260 : 0, overflow: "hidden" } as any}>
            <Sidebar dark={dark} router={router} overallPct={overallPct}
              completedTasks={completedTasks} totalTasks={totalTasks} />
          </View>
        ) : (
          <Sidebar dark={dark} router={router} overallPct={overallPct}
            completedTasks={completedTasks} totalTasks={totalTasks} />
        )}
        <View style={wSt.center}>
          <TopBar
            dark={dark}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            toggleDark={toggleDark}
            router={router}
            displayName={displayName}
            email={email}
            streak={streak}
            overallPct={overallPct}
            userRole={userData?.role || role}
            goals={goals}
            isSynced={isSynced}
            pulseAnim={pulseAnim}
          />
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