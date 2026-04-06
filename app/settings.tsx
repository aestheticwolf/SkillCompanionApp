import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Platform,
  Switch,
} from "react-native";

import { useRouter } from "expo-router";
import SkillPathLogo from "../src/components/SkillPathLogo";
import { useContext, useEffect, useRef, useState } from "react";
import { useWindowDimensions } from "react-native";
import { TaskContext } from "../src/context/TaskContext";
import { AuthContext } from "../src/context/AuthContext";
import { loadTheme, saveTheme } from "../src/services/uiPreferences";
import { showComingSoon } from "../src/services/toast";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../src/services/firebase";

/* ════ WEB CSS ════ */
if (Platform.OS === "web" && typeof document !== "undefined") {
  const id = "sk-settings-css";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@700;800;900&display=swap');
      @keyframes sk-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
      @keyframes sk-pulse{0%,100%{opacity:1}50%{opacity:.3}}
      @keyframes sk-fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes sk-glow{0%,100%{box-shadow:0 0 8px rgba(99,102,241,.3)}50%{box-shadow:0 0 22px rgba(99,102,241,.75)}}
      .sk-hov{transition:transform .2s,box-shadow .2s}
      .sk-hov:hover{transform:translateY(-2px)}
      .sk-btn-hov{transition:transform .15s,opacity .15s}
      .sk-hamb{transition:background .15s}
      .sk-hamb:hover{background:rgba(99,102,241,0.08)!important}
    `;
    document.head.appendChild(s);
  }
}

const SIDEBAR_W = 260;
const ACCENT = "#6366f1";

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
  skillScore, 
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

/* ════ SHIMMER BAR ════ */
function ShimmerBar({
  pct,
  color,
  h = 7,
}: {
  pct: number;
  color: string;
  h?: number;
}) {
  const x = useRef(new Animated.Value(-1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(x, { toValue: 2, duration: 1800, useNativeDriver: true })
    ).start();
  }, []);
  if (Platform.OS !== "web") {
    return (
      <View
        style={{
          height: h,
          borderRadius: 99,
          backgroundColor: "rgba(0,0,0,0.07)",
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
      style={{
        height: h,
        borderRadius: 99,
        backgroundColor: "rgba(0,0,0,0.07)",
        overflow: "hidden",
      } as any}
    >
      <View
        style={{
          height: "100%",
          width: `${pct}%`,
          backgroundColor: color,
          borderRadius: 99,
          position: "relative",
          overflow: "hidden",
        } as any}
      >
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: "45%",
            background:
              "linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)",
            transform: [
              {
                translateX: x.interpolate({
                  inputRange: [-1, 2],
                  outputRange: ["-100%", "280%"],
                }),
              },
            ],
          } as any}
        />
      </View>
    </View>
  );
}

/* ════ ANIMATED TOGGLE ════ */
function AnimatedToggle({
  value,
  onValueChange,
  color = ACCENT,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  color?: string;
}) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      tension: 120,
      friction: 10,
    }).start();
  }, [value]);
  if (Platform.OS === "web") {
    return (
      <Pressable
        onPress={() => onValueChange(!value)}
        style={[
          stSt.toggleTrack,
          {
            backgroundColor: value ? color : "rgba(0,0,0,0.12)",
            ...(Platform.OS === "web"
              ? ({
                  transition: "background .25s",
                  cursor: "pointer",
                  boxShadow: value ? `0 0 10px ${color}55` : "none",
                } as any)
              : {}),
          },
        ]}
      >
        <Animated.View
          style={[
            stSt.toggleThumb,
            {
              transform: [
                {
                  translateX: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [2, 22],
                  }),
                },
              ],
              ...(Platform.OS === "web"
                ? ({ transition: "transform .2s" } as any)
                : {}),
            },
          ]}
        />
      </Pressable>
    );
  }
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: "rgba(0,0,0,0.12)", true: color }}
      thumbColor="white"
    />
  );
}

/* ════ SECTION HEADER ════ */
function SectionHeader({ icon, title, subtitle, color, delay = 0 }: any) {
  return (
    <View
      style={[
        stSt.sectionHdr,
        Platform.OS === "web"
          ? ({ animation: `sk-st-fadeUp .4s ease ${delay}s both` } as any)
          : {},
      ]}
    >
      <View style={[stSt.sectionIcon, { backgroundColor: color + "18" }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={stSt.sectionTitle}>{title}</Text>
        {subtitle && <Text style={stSt.sectionSub}>{subtitle}</Text>}
      </View>
    </View>
  );
}

/* ════ SETTING ROW ════ */
function SettingRow({
  icon,
  color,
  label,
  sub,
  right,
  onPress,
  last = false,
  dark,
  border,
}: any) {
  return (
    <Pressable
      className={Platform.OS === "web" ? "sk-st-row-hov" : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        stSt.settingRow,
        { borderBottomColor: border, borderBottomWidth: last ? 0 : 1 },
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={[stSt.settingIcon, { backgroundColor: color + "15" }]}>
        <Text style={{ fontSize: 17 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[stSt.settingLabel, { color: dark ? "#eef2ff" : "#0f172a" }]}
        >
          {label}
        </Text>
        {sub && (
          <Text
            style={[
              stSt.settingSub,
              { color: dark ? "rgba(238,242,255,0.45)" : "rgba(15,23,42,0.45)" },
            ]}
          >
            {sub}
          </Text>
        )}
      </View>
      {right}
    </Pressable>
  );
}

/* ════ SIDEBAR ════ */
function Sidebar({
  dark,
  router,
  overallPct,
  completedTasks,
  totalTasks,
  displayName,
  userRole,
}: any) {
  const bg = dark ? "#0a0f20" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const txtPri = dark ? "#eef2ff" : "#0f172a";
  const txtMut = dark ? "rgba(238,242,255,0.45)" : "rgba(15,23,42,0.45)";
  const NAV = [
    { icon: "🏠", label: "Dashboard", route: "/dashboard" },
    { icon: "📊", label: "Analytics", route: "/analytics" },
    { icon: "🎯", label: "Goals",       route: "/goals" },
    { icon: "🔔", label: "Reminders", route: "/notifications" },
    { icon: "⚙️", label: "Settings", route: "/settings", active: true },
  ];
  return (
    <View style={[sbSt.wrap, { backgroundColor: bg, borderRightColor: border }]}>
      <View style={sbSt.logoRow}>
        <View
          style={[
            sbSt.logoIcon,
            Platform.OS === "web"
              ? ({ animation: "sk-st-glow 3s ease-in-out infinite" } as any)
              : {},
          ]}
        >
         <SkillPathLogo size={48} dark={dark} />
        </View>
        <View>
          <Text
            style={[
              sbSt.logoName,
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
          <Text style={[sbSt.logoSub, { color: txtMut }]}>
            Learning Companion
          </Text>
        </View>
      </View>
      <Text style={[sbSt.navLabel, { color: txtMut }]}>NAVIGATION</Text>
      {NAV.map((n: any, i: number) => (
        <Pressable
          key={i}
          onPress={() => n.route && router.push(n.route)}
          style={({ pressed }) => [
            sbSt.navItem,
            n.active && {
              backgroundColor: dark
                ? "rgba(99,102,241,0.14)"
                : "rgba(99,102,241,0.08)",
            },
            pressed && { opacity: 0.75 },
          ]}
        >
          <Text style={{ fontSize: 16 }}>{n.icon}</Text>
          <Text
            style={[
              sbSt.navTx,
              {
                color: n.active ? ACCENT : txtPri,
                fontWeight: n.active ? "700" : "500",
              },
            ]}
          >
            {n.label}
          </Text>
          {n.active && <View style={sbSt.activeBar} />}
        </Pressable>
      ))}
      <View style={{ flex: 1 }} />
      <View
        style={[
          sbSt.progCard,
          {
            backgroundColor: dark
              ? "rgba(99,102,241,0.08)"
              : "rgba(99,102,241,0.06)",
            borderColor: border,
          },
        ]}
      >
        <Text style={[sbSt.progLabel, { color: ACCENT }]}>
          OVERALL PROGRESS
        </Text>
        <View style={sbSt.progRingRow}>
          <View
            style={[
              sbSt.progRing,
              Platform.OS === "web"
                ? ({
                    background: `conic-gradient(#6366f1 ${
                      overallPct * 3.6
                    }deg, ${
                      dark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.07)"
                    } 0deg)`,
                  } as any)
                : { borderWidth: 5, borderColor: ACCENT },
            ]}
          >
            <View
              style={[
                sbSt.progRingIn,
                { backgroundColor: dark ? "#0a0f20" : "#f5f7ff" },
              ]}
            >
              <Text
                style={{ fontSize: 11, fontWeight: "800", color: ACCENT }}
              >
                {overallPct}%
              </Text>
            </View>
          </View>
          <View>
            <Text style={[sbSt.progDone, { color: txtPri }]}>
              {completedTasks}
              <Text
                style={{ fontSize: 13, fontWeight: "500", color: txtMut }}
              >
                /{totalTasks}
              </Text>
            </Text>
            <Text style={{ fontSize: 11, fontWeight: "500", color: txtMut }}>
              tasks done
            </Text>
          </View>
        </View>
        <ShimmerBar pct={overallPct} color={ACCENT} h={5} />
      </View>
      <View
        style={[
          sbSt.userRow,
          {
            backgroundColor: dark
              ? "rgba(255,255,255,0.04)"
              : "rgba(0,0,0,0.03)",
            borderColor: border,
          },
        ]}
      >
        <View
          style={[
            sbSt.userAvatar,
            Platform.OS === "web"
              ? ({
                  background: "linear-gradient(135deg,#f97316,#ef4444)",
                } as any)
              : { backgroundColor: "#f97316" },
          ]}
        >
          <Text style={{ color: "white", fontWeight: "800", fontSize: 15 }}>
            {(displayName || "U").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 13, fontWeight: "700", color: txtPri }}
            numberOfLines={1}
          >
            {displayName || "User"}
          </Text>
          <Text style={{ fontSize: 11, fontWeight: "500", color: txtMut }}>
            {userRole || "Learner"}
          </Text>
        </View>
        <View
          style={[
            sbSt.onlineDot,
            { backgroundColor: "#34d399" },
            Platform.OS === "web"
              ? ({ animation: "sk-st-pulse 2s infinite" } as any)
              : {},
          ]}
        />
      </View>
    </View>
  );
}
const sbSt = StyleSheet.create({
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
          animation: "sk-st-breathe 3s ease-in-out infinite",
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
    backgroundColor: ACCENT,
    borderRadius: 99,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 0 8px rgba(99,102,241,0.5)" } as any)
      : {}),
  },
  progCard: { borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1 },
  progLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
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
  progDone: {
    fontSize: 20,
    fontWeight: "900",
    ...(Platform.OS === "web"
      ? ({ fontFamily: "Outfit,sans-serif" } as any)
      : {}),
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
});

/* ════ TOP BAR (Match Dashboard Exactly) ════ */
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
  skillScore,
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
          <Text style={[tbSt.title, { color: txtPri }]}>Settings</Text>
          <Text style={{ fontSize: 12, fontWeight: "500", marginTop: 1, color: txtSec }}>
            Dashboard › Preferences
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

{/* Bell */}
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
  
  {/* SYNC DOT  */}
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
                skillScore={skillScore}
                onClose={() => setShowDrop(false)}
                onToggleDark={toggleDark}
                onShowV2={() => showComingSoon()}
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
   MAIN SETTINGS
════════════════════════════════ */
export default function Settings() {
  const router = useRouter();
  const taskCtx = useContext(TaskContext);
  const authCtx = useContext(AuthContext);
  if (!taskCtx || !authCtx || !authCtx.user) return null;

  const { goals, getOverallProgress } = taskCtx;
  const { user, userData } = authCtx;

  /* State */
  const [darkMode, setDarkMode] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [streak, setStreak] = useState(0);
  const [userRole, setUserRole] = useState("Intern Developer");
  const roleFromContext = userData?.role || userRole;
  const [savedIndicator, setSavedIndicator] = useState<string | null>(null);


    const [isSynced, setIsSynced] = useState(true);
    const pulseAnim = useRef(new Animated.Value(1)).current;

  /* Setting toggles */
  const [notifTasks, setNotifTasks] = useState(true);
  const [notifStreak, setNotifStreak] = useState(true);
  const [notifGoals, setNotifGoals] = useState(true);
  const [notifSystem, setNotifSystem] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [selectedAccent, setSelectedAccent] = useState("#6366f1");

  /* Animations */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  const hdrScale = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    loadTheme().then(setDarkMode);
  }, []);

  useEffect(() => {
    if (!authCtx.user) return;
    const unsub = onSnapshot(doc(db, "users", authCtx.user.uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setStreak(d.streak || 0);
        setUserRole(d.role || "Intern Developer");
        if (d.settings) {
          const st = d.settings;
          if (st.notifTasks !== undefined) setNotifTasks(st.notifTasks);
          if (st.notifStreak !== undefined) setNotifStreak(st.notifStreak);
          if (st.notifGoals !== undefined) setNotifGoals(st.notifGoals);
          if (st.notifSystem !== undefined) setNotifSystem(st.notifSystem);
          if (st.compactView !== undefined) setCompactView(st.compactView);
          if (st.showHeatmap !== undefined) setShowHeatmap(st.showHeatmap);
          if (st.autoSave !== undefined) setAutoSave(st.autoSave);
          if (st.soundEffects !== undefined) setSoundEffects(st.soundEffects);
          if (st.weeklyDigest !== undefined) setWeeklyDigest(st.weeklyDigest);
          if (st.accent !== undefined) setSelectedAccent(st.accent);
        }
      }
    });
    return unsub;
  }, [authCtx.user]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(hdrScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 9,
      }),
    ]).start();
  }, []);
  


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



  /* Save to Firestore */
  const saveSetting = async (key: string, value: any) => {
    setSavedIndicator(key);
    setTimeout(() => setSavedIndicator(null), 1800);
    if (authCtx.user?.uid) {
      await setDoc(
        doc(db, "users", authCtx.user.uid),
        { settings: { [key]: value } },
        { merge: true }
      );
    }
  };

  const toggleDark = async () => {
    const next = !darkMode;
    setDarkMode(next);
    await saveTheme(next);
    saveSetting("darkMode", next);
  };

  /* Computed */
  const totalGoals = goals.length;
  const totalTasks = goals.reduce(
    (a: number, g: any) => a + g.tasks.length,
    0
  );
  const completedTasks = goals.reduce(
    (a: number, g: any) =>
      a + g.tasks.filter((t: any) => t.completed).length,
    0
  );
  const overallPct = getOverallProgress();

    const skillScore = Math.min(
    9999,
    completedTasks * 50 + totalGoals * 120 + streak * 15
  );

  /*  KEY FIX: Use userData from AuthContext like dashboard.tsx */
const displayName =
  userData?.displayName || user?.displayName || user?.email || "User";
  const userEmail = user?.email || "";

  /* Theme */
  const dark = !!darkMode;
  const bg = dark ? "#080d18" : "#eef1f8";
  const card = dark ? "#0d1424" : "#FFFFFF";
  const textPrimary = dark ? "#eef2ff" : "#0F172A";
  const textSecondary = dark ? "rgba(238,242,255,0.55)" : "#475569";
  const textMuted = dark ? "rgba(238,242,255,0.28)" : "rgba(15,23,42,0.3)";
  const cardBorder = dark
    ? "rgba(255,255,255,0.08)"
    : "rgba(0,0,0,0.06)";
  const cardSh =
    Platform.OS === "web"
      ? {
          boxShadow: dark
            ? "0 2px 16px rgba(0,0,0,0.4)"
            : "0 2px 12px rgba(0,0,0,0.05)",
        }
      : { elevation: 3 };

  const { width: screenW } = useWindowDimensions();
  const isWide = Platform.OS === "web" && screenW >= 960;

  /* Accent colors */
  const ACCENTS = [
    { color: "#6366f1", label: "Indigo" },
    { color: "#f97316", label: "Orange" },
    { color: "#06b6d4", label: "Cyan" },
    { color: "#ec4899", label: "Pink" },
    { color: "#34d399", label: "Green" },
    { color: "#fbbf24", label: "Amber" },
    { color: "#a78bfa", label: "Violet" },
    { color: "#3b82f6", label: "Blue" },
  ];

  /* Saved toast */
  const SavedBadge = ({ settingKey }: { settingKey: string }) => {
    if (savedIndicator !== settingKey) return null;
    return (
      <View
        style={[
          stSt.savedBadge,
          Platform.OS === "web"
            ? ({ animation: "sk-st-popIn .25s ease both" } as any)
            : {},
        ]}
      >
        <Text style={{ fontSize: 10, fontWeight: "800", color: "#34d399" }}>
          ✓ Saved
        </Text>
      </View>
    );
  };

  const mainContent = (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      <View style={[styles.wrapper, isWide ? { paddingTop: 20 } : {}]}>
        {/* ════ HERO HEADER ════ */}
        <Animated.View
          style={[
            styles.hero,
            { transform: [{ scale: hdrScale }], opacity: fadeAnim },
            Platform.OS === "web"
              ? ({ boxShadow: "0 10px 40px rgba(99,102,241,0.25)" } as any)
              : { elevation: 10 },
          ]}
        >
          {Platform.OS === "web" && (
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: isWide ? 24 : 0,
                  background: dark
                    ? "linear-gradient(135deg,#020617 0%,#1e1b4b 50%,#0f172a 100%)"
                    : "linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#9333ea 100%)",
                } as any,
              ]}
            />
          )}
          {Platform.OS !== "web" && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#4f46e5" }]} />
          )}

          {/* Decorative orbs */}
          <View
            pointerEvents="none"
            style={[styles.orb, styles.orb1,
              Platform.OS === "web"
                ? ({ animation: "sk-st-breathe 5s ease-in-out infinite" } as any)
                : {}
            ]}
          />
          <View pointerEvents="none" style={[styles.orb, styles.orb2]} />
          <View pointerEvents="none" style={[styles.orb, styles.orb3]} />

          {/* Animated gear icon */}
          <View style={{ alignItems: "center", marginBottom: 16, zIndex: 2 }}>
            <View
              style={[
                styles.gearWrap,
                Platform.OS === "web"
                  ? ({ animation: "sk-st-spin 12s linear infinite" } as any)
                  : {},
              ]}
            >
              <Text style={{ fontSize: 48 }}>⚙️</Text>
            </View>
          </View>

          <Text
            style={[
              styles.heroTitle,
              Platform.OS === "web"
                ? ({ fontFamily: "Outfit,sans-serif" } as any)
                : {},
            ]}
          >
            Settings
          </Text>
          <Text style={styles.heroSub}>Customize your SkillPath experience</Text>

          {/* Quick stats row */}
          <View style={styles.heroStats}>
            {[
              { icon: "🎯", val: totalGoals, lbl: "Goals" },
              { icon: "✅", val: completedTasks, lbl: "Done" },
              { icon: "🔥", val: streak, lbl: "Streak" },
              { icon: "📊", val: `${overallPct}%`, lbl: "Progress" },
            ].map((s, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.heroStatChip,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: Animated.add(
                          slideAnim,
                          new Animated.Value(i * 5)
                        ),
                      },
                    ],
                  },
                ]}
              >
                <Text style={{ fontSize: 14, marginBottom: 2 }}>{s.icon}</Text>
                <Text
                  style={[
                    styles.heroStatVal,
                    Platform.OS === "web"
                      ? ({ fontFamily: "Outfit,sans-serif" } as any)
                      : {},
                  ]}
                >
                  {s.val}
                </Text>
                <Text style={styles.heroStatLbl}>{s.lbl}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 0 }}
        >
          {/* ════ APPEARANCE ════ */}
          <Animated.View
            className={Platform.OS === "web" ? "sk-st-hov" : undefined}
            style={[
              styles.section,
              { backgroundColor: card, borderColor: cardBorder, ...cardSh },
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <SectionHeader
              icon="🎨"
              color="#a78bfa"
              title="Appearance"
              subtitle="Theme, colors & display"
              delay={0.05}
            />
            <View
              style={{ height: 1, backgroundColor: cardBorder, marginBottom: 4 }}
            />

            {/* Dark Mode */}
            <SettingRow
              icon="🌙"
              color="#6366f1"
              dark={dark}
              border={cardBorder}
              label="Dark Mode"
              sub={dark ? "Dark theme active" : "Switch to dark theme"}
              right={
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <SavedBadge settingKey="darkMode" />
                  <AnimatedToggle
                    value={dark}
                    onValueChange={toggleDark}
                    color="#6366f1"
                  />
                </View>
              }
              onPress={toggleDark}
            />

            {/* Accent Color */}
            {/* <View
              style={[
                stSt.settingRow,
                { borderBottomColor: cardBorder, borderBottomWidth: 1 },
              ]}
            >
              <View
                style={[stSt.settingIcon, { backgroundColor: selectedAccent + "20" }]}
              >
                <Text style={{ fontSize: 17 }}>🎨</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[stSt.settingLabel, { color: textPrimary }]}
                >
                  Accent Color
                </Text>
                <Text style={[stSt.settingSub, { color: textSecondary }]}>
                  {ACCENTS.find((a) => a.color === selectedAccent)?.label ||
                    "Indigo"}{" "}
                  selected
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                    marginTop: 12,
                    flexWrap: "wrap",
                  }}
                >
                  {ACCENTS.map((ac) => (
                    <Pressable
                      key={ac.color}
                      onPress={() => {
                        setSelectedAccent(ac.color);
                        saveSetting("accent", ac.color);
                      }}
                      style={[
                        stSt.accentDot,
                        { backgroundColor: ac.color },
                        selectedAccent === ac.color && {
                          transform: [{ scale: 1.2 }],
                          ...(Platform.OS === "web"
                            ? ({
                                boxShadow: `0 0 0 3px white, 0 0 0 5px ${ac.color}`,
                              } as any)
                            : {}),
                        },
                        Platform.OS === "web"
                          ? ({
                              cursor: "pointer",
                              transition: "transform .15s, box-shadow .15s",
                            } as any)
                          : {},
                      ]}
                    />
                  ))}
                </View>
              </View>
              <SavedBadge settingKey="accent" />
            </View> */}

            {/* Compact View */}
            {/* <SettingRow
              icon="📐"
              color="#06b6d4"
              dark={dark}
              border={cardBorder}
              label="Compact View"
              sub="Reduce padding for more content"
              right={
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <SavedBadge settingKey="compactView" />
                  <AnimatedToggle
                    value={compactView}
                    color="#06b6d4"
                    onValueChange={(v) => {
                      setCompactView(v);
                      saveSetting("compactView", v);
                    }}
                  />
                </View>
              }
              onPress={() => {
                setCompactView((v) => !v);
                saveSetting("compactView", !compactView);
              }}
            /> */}

            {/* Show Heatmap */}
            {/* <SettingRow
              icon="🗓️"
              color="#34d399"
              dark={dark}
              border={cardBorder}
              last
              label="Activity Heatmap"
              sub="Show heatmap on dashboard"
              right={
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <SavedBadge settingKey="showHeatmap" />
                  <AnimatedToggle
                    value={showHeatmap}
                    color="#34d399"
                    onValueChange={(v) => {
                      setShowHeatmap(v);
                      saveSetting("showHeatmap", v);
                    }}
                  />
                </View>
              }
              onPress={() => {
                setShowHeatmap((v) => !v);
                saveSetting("showHeatmap", !showHeatmap);
              }}
            /> */}
          </Animated.View>

          {/* ════ NOTIFICATIONS ════ */}
          {/* <Animated.View
            className={Platform.OS === "web" ? "sk-st-hov" : undefined}
            style={[
              styles.section,
              { backgroundColor: card, borderColor: cardBorder, ...cardSh },
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              Platform.OS === "web"
                ? ({ animation: "sk-st-fadeUp .4s ease .1s both" } as any)
                : {},
            ]}
          >
            <SectionHeader
              icon="🔔"
              color="#f97316"
              title="Notifications"
              subtitle="Manage your alerts"
              delay={0.1}
            />
            <View
              style={{ height: 1, backgroundColor: cardBorder, marginBottom: 4 }}
            />

            {[
              // {
              //   key: "notifTasks",
              //   icon: "📌",
              //   color: "#f97316",
              //   label: "Task Reminders",
              //   sub: "Get notified about pending tasks",
              //   val: notifTasks,
              //   set: setNotifTasks,
              // },
              {
                key: "notifStreak",
                icon: "🔥",
                color: "#ef4444",
                label: "Streak Alerts",
                sub: "Don't break your learning streak",
                val: notifStreak,
                set: setNotifStreak,
              },
              {
                key: "notifGoals",
                icon: "🏆",
                color: "#34d399",
                label: "Goal Updates",
                sub: "Celebrate completions & milestones",
                val: notifGoals,
                set: setNotifGoals,
              },
              {
                key: "notifSystem",
                icon: "⚙️",
                color: "#6366f1",
                label: "System Messages",
                sub: "App updates and announcements",
                val: notifSystem,
                set: setNotifSystem,
              },
              {
                key: "weeklyDigest",
                icon: "📊",
                color: "#fbbf24",
                label: "Weekly Digest",
                sub: "Sunday summary of your week's progress",
                val: weeklyDigest,
                set: setWeeklyDigest,
              },
            ].map((item, i, arr) => (
              <SettingRow
                key={item.key}
                icon={item.icon}
                color={item.color}
                dark={dark}
                border={cardBorder}
                last={i === arr.length - 1}
                label={item.label}
                sub={item.sub}
                right={
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                  >
                    <SavedBadge settingKey={item.key} />
                    <AnimatedToggle
                      value={item.val}
                      color={item.color}
                      onValueChange={(v) => {
                        item.set(v);
                        saveSetting(item.key, v);
                      }}
                    />
                  </View>
                }
                onPress={() => {
                  item.set((v: boolean) => !v);
                  saveSetting(item.key, !item.val);
                }}
              />
            ))}
          </Animated.View> */}

          {/* ════ EXPERIENCE ════ */}
          {/* <Animated.View
            className={Platform.OS === "web" ? "sk-st-hov" : undefined}
            style={[
              styles.section,
              { backgroundColor: card, borderColor: cardBorder, ...cardSh },
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              Platform.OS === "web"
                ? ({ animation: "sk-st-fadeUp .4s ease .15s both" } as any)
                : {},
            ]}
          >
            <SectionHeader
              icon="✨"
              color="#fbbf24"
              title="Experience"
              subtitle="Fine-tune app behaviour"
              delay={0.15}
            />
            <View
              style={{ height: 1, backgroundColor: cardBorder, marginBottom: 4 }}
            />

            <SettingRow
              icon="💾"
              color="#34d399"
              dark={dark}
              border={cardBorder}
              label="Auto-Save"
              sub="Automatically save task changes"
              right={
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <SavedBadge settingKey="autoSave" />
                  <AnimatedToggle
                    value={autoSave}
                    color="#34d399"
                    onValueChange={(v) => {
                      setAutoSave(v);
                      saveSetting("autoSave", v);
                    }}
                  />
                </View>
              }
              onPress={() => {
                setAutoSave((v) => !v);
                saveSetting("autoSave", !autoSave);
              }}
            />
            <SettingRow
              icon="🔊"
              color="#a78bfa"
              dark={dark}
              border={cardBorder}
              last
              label="Sound Effects"
              sub="Play sounds on task completion"
              right={
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <SavedBadge settingKey="soundEffects" />
                  <AnimatedToggle
                    value={soundEffects}
                    color="#a78bfa"
                    onValueChange={(v) => {
                      setSoundEffects(v);
                      saveSetting("soundEffects", v);
                    }}
                  />
                </View>
              }
              onPress={() => {
                setSoundEffects((v) => !v);
                saveSetting("soundEffects", !soundEffects);
              }}
            />
          </Animated.View> */}

          {/* ════ QUICK LINKS ════ */}
          <Animated.View
            className={Platform.OS === "web" ? "sk-st-hov" : undefined}
            style={[
              styles.section,
              { backgroundColor: card, borderColor: cardBorder, ...cardSh },
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              Platform.OS === "web"
                ? ({ animation: "sk-st-fadeUp .4s ease .2s both" } as any)
                : {},
            ]}
          >
            {/* <SectionHeader
              icon="🔗"
              color="#06b6d4"
              title="Quick Links"
              subtitle="Jump to key areas"
              delay={0.2}
            />
            <View
              style={{ height: 1, backgroundColor: cardBorder, marginBottom: 4 }}
            /> */}

            {[
              {
                icon: "👤",
                color: "#6366f1",
                label: "Edit Profile",
                sub: "Update name, role & avatar",
                action: () => router.push("/profile"),
              },
              {
                icon: "📊",
                color: "#06b6d4",
                label: "View Analytics",
                sub: "See detailed learning stats",
                action: () => router.push("/analytics"),
              },
              {
                icon: "🔔",
                color: "#f97316",
                label: "Notifications",
                sub: "Manage your notification centre",
                action: () => router.push("/notifications"),
              },
              {
                icon: "🔑",
                color: "#a78bfa",
                label: "Change Password",
                sub: "Update your account password",
                action: () => router.push("/profile"),
              },
              // {
              //   icon: "📤",
              //   color: "#34d399",
              //   label: "Export Data",
              //   sub: "Download your progress as CSV",
              //   action: showComingSoon,
              // },
              // {
              //   icon: "🗑️",
              //   color: "#ef4444",
              //   label: "Clear All Goals",
              //   sub: "Permanently remove all data",
              //   action: showComingSoon,
              // },
            ].map((item, i, arr) => (
              <SettingRow
                key={i}
                icon={item.icon}
                color={item.color}
                dark={dark}
                border={cardBorder}
                last={i === arr.length - 1}
                label={item.label}
                sub={item.sub}
                onPress={item.action}
                right={
                  <Text style={{ color: textMuted, fontSize: 16 }}>›</Text>
                }
              />
            ))}
          </Animated.View>

          {/* ════ ABOUT ════ */}
          <Animated.View
            style={[
              styles.aboutCard,
              {
                backgroundColor: dark
                  ? "rgba(99,102,241,0.07)"
                  : "rgba(99,102,241,0.04)",
                borderColor: dark
                  ? "rgba(99,102,241,0.2)"
                  : "rgba(99,102,241,0.12)",
                ...cardSh,
              },
              { opacity: fadeAnim },
              Platform.OS === "web"
                ? ({ animation: "sk-st-fadeUp .4s ease .25s both" } as any)
                : {},
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
                      ? "linear-gradient(135deg,rgba(99,102,241,0.08) 0%,rgba(139,92,246,0.05) 100%)"
                      : "linear-gradient(135deg,rgba(99,102,241,0.06) 0%,rgba(139,92,246,0.03) 100%)",
                  } as any,
                ]}
              />
            )}
            <View style={{ alignItems: "center", paddingVertical: 8, zIndex: 1 }}>
              <View
                style={[
                  styles.aboutLogo,
                  Platform.OS === "web"
                    ? ({ animation: "sk-st-glow 3s ease-in-out infinite" } as any)
                    : {},
                ]}
              >
                <SkillPathLogo size={52} />
              </View>
              <Text
                style={[
                  styles.aboutName,
                  Platform.OS === "web"
                    ? ({
                        background:
                          "linear-gradient(90deg,#6366f1,#a78bfa,#06b6d4)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        fontFamily: "Outfit,sans-serif",
                      } as any)
                    : { color: ACCENT },
                ]}
              >
                SkillPath
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: textSecondary,
                  fontWeight: "500",
                  marginBottom: 16,
                }}
              >
                Learning Companion • v1.0.0
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  flexWrap: "wrap" as const,
                  justifyContent: "center",
                }}
              >
                {[
                  {
                    lbl: "Goals",
                    val: totalGoals,
                    color: "#6366f1",
                  },
                  {
                    lbl: "Tasks",
                    val: totalTasks,
                    color: "#06b6d4",
                  },
                  {
                    lbl: "Streak",
                    val: `${streak}d`,
                    color: "#f97316",
                  },
                  {
                    lbl: "Score",
                    val: Math.min(
                      9999,
                      completedTasks * 50 + totalGoals * 120 + streak * 15
                    ),
                    color: "#fbbf24",
                  },
                ].map((s, i) => (
                  <View
                    key={i}
                    style={[
                      styles.aboutStat,
                      {
                        backgroundColor: s.color + "14",
                        borderColor: s.color + "30",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "900",
                        color: s.color,
                        ...(Platform.OS === "web"
                          ? ({ fontFamily: "Outfit,sans-serif" } as any)
                          : {}),
                      }}
                    >
                      {s.val}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "600",
                        color: textSecondary,
                      }}
                    >
                      {s.lbl}
                    </Text>
                  </View>
                ))}
              </View>

              {/* <Text
                style={{
                  fontSize: 11,
                  color: textMuted,
                  marginTop: 16,
                  textAlign: "center" as const,
                }}
              >
                Built with ❤️ · Firebase · Expo · React Native
              </Text> */}

              {/* Divider */}
<View
  style={{
    width: 40,
    height: 2,
    backgroundColor: dark ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.2)",
    borderRadius: 99,
    marginVertical: 12,
  }}
/>

{/* Developer name
<View style={{ alignItems: "center", paddingVertical: 8 }}>
  <Text
    style={{
      fontSize: 14,
      fontWeight: "800",
      ...(Platform.OS === "web"
        ? ({
            background: "linear-gradient(90deg,#6366f1,#a78bfa,#06b6d4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          } as any)
        : { color: dark ? "#eef2ff" : "#0f172a" }),
    }}
  >
    Richard D'souza
  </Text>
  <Text
    style={{
      fontSize: 10,
      color: dark ? "rgba(238,242,255,0.6)" : "rgba(15,23,42,0.6)",
      marginTop: 2,
    }}
  >
    Full Stack Developer
  </Text>
</View> */}

{/* Made with Love */}
<View style={{ alignItems: "center", marginVertical: 10 }}>
  <Text
    style={{
      fontSize: 11,
      color: dark ? "rgba(238,242,255,0.5)" : "rgba(15,23,42,0.5)",
      fontWeight: "500",
    }}
  >
    Made with <Text style={{ color: "#ef4444", fontSize: 12 }}>❤️</Text> for learners
  </Text>
</View>

{/* Tech stack */}
<View
  style={{
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap" as const,
    justifyContent: "center",
    marginTop: 8,
  }}
>
  {["Firebase", "Expo", "React Native", "TypeScript"].map((tech, i) => (
    <View
      key={i}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: dark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
        borderWidth: 1,
        borderColor: dark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.15)",
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: "600",
          color: dark ? "#a78bfa" : "#6366f1",
        }}
      >
        {tech}
      </Text>
    </View>
  ))}
</View>

{/* Copyright */}
<Text
  style={{
    fontSize: 10,
    color: dark ? "rgba(238,242,255,0.35)" : "rgba(15,23,42,0.35)",
    marginTop: 14,
    textAlign: "center" as const,
  }}
>
  © 2026 SkillPath · All rights reserved
</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </View>
  );

  if (isWide) {
    return (
      <View style={[wSt.root, { backgroundColor: bg }]}>
        {Platform.OS === "web" ? (
          <View
            className="sk-sidebar"
            style={{
              width: sidebarOpen ? 260 : 0,
              minWidth: sidebarOpen ? 260 : 0,
              overflow: "hidden",
            } as any}
          >
            <Sidebar
              dark={dark}
              router={router}
              overallPct={overallPct}
              completedTasks={completedTasks}
              totalTasks={totalTasks}
              displayName={displayName}
              userRole={userRole}
            />
          </View>
        ) : (
          <Sidebar
            dark={dark}
            router={router}
            overallPct={overallPct}
            completedTasks={completedTasks}
            totalTasks={totalTasks}
            displayName={displayName}
            userRole={userRole}
          />
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
            skillScore={skillScore}
          />
          {mainContent}
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Mobile header */}
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 18,
            paddingTop: Platform.OS === "ios" ? 52 : 16,
            paddingBottom: 14,
            backgroundColor: dark ? "#0a0f20" : "#ffffff",
            borderBottomWidth: 1,
            borderBottomColor: dark
              ? "rgba(255,255,255,0.07)"
              : "rgba(0,0,0,0.06)",
          },
        ]}
      >
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: ACCENT, fontWeight: "700", fontSize: 15 }}>
            ← Back
          </Text>
        </Pressable>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "900",
            color: dark ? "#eef2ff" : "#0f172a",
            ...(Platform.OS === "web"
              ? ({ fontFamily: "Outfit,sans-serif" } as any)
              : {}),
          }}
        >
          Settings
        </Text>
        <View style={{ width: 60 }} />
      </View>
      {mainContent}
    </View>
  );
}

const wSt = StyleSheet.create({
  root: { flex: 1, flexDirection: "row" } as any,
  center: { flex: 1, flexDirection: "column" as const, minWidth: 0 },
});

const stSt = StyleSheet.create({
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "white",
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 1px 4px rgba(0,0,0,0.2)" } as any)
      : { elevation: 2 }),
  },
  sectionHdr: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    ...(Platform.OS === "web"
      ? ({ fontFamily: "Outfit,sans-serif" } as any)
      : {}),
  },
  sectionSub: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(15,23,42,0.5)",
    marginTop: 1,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
    ...(Platform.OS === "web" ? ({ borderRadius: 10 } as any) : {}),
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  settingLabel: { fontSize: 14, fontWeight: "700" },
  settingSub: { fontSize: 12, fontWeight: "500", marginTop: 1 },
  accentDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    ...(Platform.OS === "web"
      ? ({ cursor: "pointer", transition: "transform .15s" } as any)
      : {}),
  },
  savedBadge: {
    backgroundColor: "rgba(52,211,153,0.12)",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.3)",
  },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  wrapper: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 18,
    paddingTop: 14,
  },

  /* Hero */
  hero: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    marginBottom: 18,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
  } as any,
  orb1: { width: 260, height: 260, top: -100, right: -80 },
  orb2: { width: 150, height: 150, bottom: -60, left: -40 },
  orb3: { width: 80, height: 80, top: 20, left: 30 },

  gearWrap: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web"
      ? ({ filter: "drop-shadow(0 0 16px rgba(255,255,255,0.3))" } as any)
      : {}),
  },
  heroTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 4,
    zIndex: 2,
  },
  heroSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 20,
    zIndex: 2,
  },

  heroStats: {
    flexDirection: "row",
    gap: 10,
    zIndex: 2,
    flexWrap: "wrap" as const,
    justifyContent: "center",
  },
  heroStatChip: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    minWidth: 64,
  },
  heroStatVal: { color: "white", fontSize: 16, fontWeight: "900" },
  heroStatLbl: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
  },

  /* Sections */
  section: { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 14 },

  /* About */
  aboutCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    marginBottom: 0,
    overflow: "hidden",
    position: "relative",
  },
  aboutLogo: { marginBottom: 12 },
  aboutName: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  aboutStat: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    borderWidth: 1,
    minWidth: 60,
  },
});