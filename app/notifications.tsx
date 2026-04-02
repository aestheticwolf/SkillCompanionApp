import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { useContext, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import SkillPathLogo from "../src/components/SkillPathLogo";
import { AuthContext } from "../src/context/AuthContext";
import { TaskContext } from "../src/context/TaskContext";
import { db } from "../src/services/firebase";
import { listenToNetwork } from "../src/services/network";
import { showComingSoon, showSuccess } from "../src/services/toast";
import { loadTheme, saveTheme } from "../src/services/uiPreferences";

/* ── Web CSS ── */
if (Platform.OS === "web" && typeof document !== "undefined") {
  const id = "sk-notif-page-css";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600:700:800&family=Outfit:wght@700:800:900&display=swap');
      @keyframes sk-np-fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
      @keyframes sk-np-pulse{0%,100%{opacity:1}50%{opacity:.3}}
      @keyframes sk-np-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
      @keyframes sk-np-glow{0%,100%{box-shadow:0 0 8px rgba(99,102,241,.3)}50%{box-shadow:0 0 22px rgba(99,102,241,.75)}}
      .sk-np-hov{transition:background .15s,transform .12s,box-shadow .15s}
      .sk-np-hov:hover{transform:translateX(3px);box-shadow:0 4px 20px rgba(0,0,0,0.1)}
      .sk-np-chip{transition:all .15s;cursor:pointer}
      .sk-np-chip:hover{transform:translateY(-1px)}
      .sk-np-del{transition:opacity .15s,transform .15s;cursor:pointer}
      .sk-np-del:hover{opacity:0.6;transform:scale(1.1)}
      .sk-np-sidebar-nav{transition:background .15s;cursor:pointer}
      .sk-np-sidebar-nav:hover{background:rgba(99,102,241,0.06)}
    `;
    document.head.appendChild(s);
  }
}

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
const SIDEBAR_W = 260;
const ACCENT = "#6366f1";

type NotifCategory = "all" | "task" | "streak" | "goal" | "system";
type NotifItem = {
  id: string;
  icon: string;
  title: string;
  body: string;
  time: string;
  color: string;
  category: Exclude<NotifCategory, "all">;
  read: boolean;
  dismissible: boolean; // ✅ NEW: Can be permanently dismissed
};

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
              {email || "No email"}
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

/* ════════════════════════════════
   SIDEBAR
════════════════════════════════ */
function NotifSidebar({
  dark,
  router,
  isSynced,
  displayName,
  unreadCount,
  userRole,
  overallPct,
  completedTasks,
  totalTasks,
}: any) {
  const bg = dark ? "#141720" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const txtPri = dark ? "#eef2ff" : "#0f172a";
  const txtMut = dark ? "rgba(238,242,255,0.45)" : "rgba(15,23,42,0.45)";
  const txtSec = dark ? "rgba(238,242,255,0.5)" : "rgba(15,23,42,0.5)";

  const NAV = [
    { icon: "🏠", label: "Dashboard", route: "/dashboard" },
    { icon: "📊", label: "Analytics", route: "/analytics" },
    {
      icon: "🔔",
      label: "Reminders",
      route: "/notifications",
      badge: unreadCount,
    },
    { icon: "⚙️", label: "Settings", route: "/settings" },
  ];

  const initials = displayName.charAt(0).toUpperCase();

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
          <Text style={[sbSt.logoSub, { color: txtMut }]}>
            Learning Companion
          </Text>
        </View>
      </View>

      <Text style={[sbSt.navLabel, { color: txtMut }]}>NAVIGATION</Text>

      {NAV.map((n, i) => {
        const active = n.route === "/notifications";
        return (
          <Pressable
            key={i}
            className={Platform.OS === "web" ? "sk-np-sidebar-nav" : undefined}
            onPress={() => {
              if (n.route) router.push(n.route);
            }}
            style={({ pressed }) => [
              sbSt.navItem,
              active && {
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
                  color: active ? ACCENT : txtPri,
                  fontWeight: active ? "700" : "500",
                },
              ]}
            >
              {n.label}
            </Text>
            {active && <View style={sbSt.activeBar} />}
          </Pressable>
        );
      })}

      <View style={{ flex: 1 }} />

      {/* ✅ OVERALL PROGRESS CARD - MOVED HERE (before User row) */}
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
                    background: `conic-gradient(${ACCENT} ${overallPct * 3.6}deg, ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"} 0deg)`,
                  } as any)
                : { borderWidth: 5, borderColor: ACCENT },
            ]}
          >
            <View
              style={[
                sbSt.progRingInner,
                { backgroundColor: dark ? "#0a0f20" : "#f5f7ff" },
              ]}
            >
              <Text style={[sbSt.progPercent, { color: ACCENT }]}>
                {overallPct}%
              </Text>
            </View>
          </View>
          <View style={sbSt.progStats}>
            <Text style={[sbSt.progTasks, { color: txtPri }]}>
  {completedTasks}
  <Text style={{ fontSize: 13, fontWeight: "500", color: txtSec }}>
    /{totalTasks}
  </Text>
</Text>
            <Text style={[sbSt.progLabelSmall, { color: txtSec }]}>
              tasks done
            </Text>
          </View>
        </View>
        <View
          style={{
            height: 6,
            borderRadius: 99,
            backgroundColor: dark
              ? "rgba(255,255,255,0.07)"
              : "rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${overallPct}%`,
              borderRadius: 99,
              backgroundColor: ACCENT,
            }}
          />
        </View>
      </View>

      {/* ✅ USER ROW - MOVED HERE (after Overall Progress) */}
      <View style={[sbSt.userRow, { borderColor: border }]}>
        <View
          style={[
            sbSt.avatar,
            Platform.OS === "web"
              ? ({
                  background: "linear-gradient(135deg,#f97316,#ef4444)",
                } as any)
              : { backgroundColor: "#f97316" },
          ]}
        >
          <Text style={sbSt.avatarTx}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[sbSt.userName, { color: txtPri }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[sbSt.userSub, { color: txtMut }]}>
            {userRole || "Software Developer"}
          </Text>
        </View>
        <View
          style={[
            sbSt.dot,
            { backgroundColor: isSynced ? "#34d399" : "#f87171" },
            Platform.OS === "web"
              ? ({ animation: "sk-np-pulse 2s infinite" } as any)
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
      ? ({ filter: "drop-shadow(0 4px 12px rgba(99,102,241,0.35))" } as any)
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
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f97316",
  },
  avatarTx: { color: "white", fontWeight: "800", fontSize: 15 },
  userName: { fontSize: 13, fontWeight: "700" },
  userSub: { fontSize: 11, fontWeight: "500" },
  dot: { width: 8, height: 8, borderRadius: 4 },

  /* ✅ ADD THESE MISSING PROGRESS CARD STYLES */
  progCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  progLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
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
  alignItems: "center",        // ✅ FIX
  justifyContent: "center",    // ✅ FIX
},
progRingInner: {
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: "center",
  justifyContent: "center",
},

progPercent: {
  fontSize: 11,
  fontWeight: "800",
},
  progStats: {
    flex: 1,
  },
 
progTasks: {
  fontSize: 20,
  fontWeight: "900",
},

  progLabelSmall: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
});

/* ════════════════════════════════
   MAIN PAGE
════════════════════════════════ */
export default function NotificationsPage() {
  const router = useRouter();
  const authCtx = useContext(AuthContext);
  const taskCtx = useContext(TaskContext);

  if (!authCtx || !authCtx.user || !taskCtx) return null;

  const { user, userData } = authCtx;
  const { goals, getOverallProgress } = taskCtx;

  const [darkMode, setDarkMode] = useState<boolean | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [streak, setStreak] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeFilter, setActiveFilter] = useState<NotifCategory>("all");
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isLoadingDismissed, setIsLoadingDismissed] = useState(true);

  /* SYNC DOT */
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  /* Setup */
  useEffect(() => {
    loadTheme().then(setDarkMode);
    const unsub = listenToNetwork(setIsSynced);
    return () => unsub();
  }, []);

 useEffect(() => {
  if (!user) return;

  const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
    if (snap.exists()) setStreak(snap.data().streak || 0);
  });

  return unsub;
}, [user]);

  /* Load dismissed notifications from storage */
  useEffect(() => {
      if (!user) return;

    const loadDismissed = async () => {
      try {
        const storage =
          Platform.OS === "web"
            ? {
                getItem: (key: string) =>
                  Promise.resolve(localStorage.getItem(key)),
                setItem: (key: string, value: string) =>
                  Promise.resolve(localStorage.setItem(key, value)),
              }
            : AsyncStorage;

        const stored = await storage.getItem(`dismissed_notifs_${user.uid}`);
        if (stored) {
          const ids = JSON.parse(stored) as string[];
          setDismissedIds(new Set(ids));
        }
      } catch (e) {
        console.log("Failed to load dismissed notifications");
      } finally {
        setIsLoadingDismissed(false);
      }
    };
    loadDismissed();
  }, [user.uid]);

  /* Save dismissed notifications to storage */
  const saveDismissed = async (ids: Set<string>) => {
    try {
      const storage =
        Platform.OS === "web"
          ? {
              getItem: (key: string) =>
                Promise.resolve(localStorage.getItem(key)),
              setItem: (key: string, value: string) =>
                Promise.resolve(localStorage.setItem(key, value)),
            }
          : AsyncStorage;

      await storage.setItem(
        `dismissed_notifs_${user.uid}`,
        JSON.stringify([...ids]),
      );
    } catch (e) {
      console.log("Failed to save dismissed notifications");
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }),
    ]).start();

    /* PULSE ANIMATION */
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

  /* Build notifications from real data - ONLY dynamic ones */
  useEffect(() => {
    const notifs: NotifItem[] = [];

    // ✅ TASK notifications - Always show when pending (can't be dismissed permanently)
    goals.forEach((g: any, gi: number) => {
      g.tasks.forEach((t: any) => {
        if (
          t &&
          t.title &&
          t.title.trim() !== "" &&
          !(
            t.completed === true ||
            t.completed === "true" ||
            t.completed === 1 ||
            t.isCompleted === true
          )
        ) {
          notifs.push({
            id: `task-${g.id}-${t.id}`,
            icon: "📌",
            title: "Pending Task",
            body: `"${t.title}" in ${g.name}`,
            time: "Today",
            color: GOAL_COLORS[gi % GOAL_COLORS.length],
            category: "task",
            read: false,
            dismissible: false, // ✅ Can't permanently dismiss task notifications
          });
        }
      });
    });

    // ✅ STREAK notification - Only show when streak > 0 (can be dismissed)
    if (streak > 0 && !dismissedIds.has("streak-info")) {
      notifs.unshift({
        id: "streak-info",
        icon: "🔥",
        title: `${streak} Day Streak!`,
        body:
          streak >= 7
            ? "Incredible consistency! You've maintained a full week streak."
            : "Complete tasks daily to keep your streak alive.",
        time: "Today",
        color: "#f97316",
        category: "streak",
        read: notifs.length === 0,
        dismissible: true, // ✅ Can be dismissed
      });
    }

    // ✅ GOAL completion notifications - Only show when goal completed AND not dismissed
    goals.forEach((g: any, gi: number) => {
      const done = g.tasks.filter((t: any) => t.completed).length;
      const total = g.tasks.length;
      const goalNotifId = `goal-done-${g.id}`;

      if (total > 0 && done === total && !dismissedIds.has(goalNotifId)) {
        notifs.unshift({
          id: goalNotifId,
          icon: "🏆",
          title: "Goal Completed!",
          body: `All tasks in "${g.name}" are done. Excellent work!`,
          time: "Recently",
          color: GOAL_COLORS[gi % GOAL_COLORS.length],
          category: "goal",
          read: true,
          dismissible: true, // ✅ Can be dismissed
        });
      }
    });

    // ✅ SYSTEM welcome notification - Can be dismissed
    const sysNotifId = "sys-welcome";
    if (!dismissedIds.has(sysNotifId)) {
      notifs.push({
        id: sysNotifId,
        icon: "🚀",
        title: "Welcome to SkillPath",
        body: "Track your learning goals and stay consistent every day.",
        time: "Earlier",
        color: "#6366f1",
        category: "system",
        read: true,
        dismissible: true, // ✅ Can be dismissed
      });
    }

    setNotifications(notifs);
  }, [goals, streak, dismissedIds]);

  /* Derived */
  const dark = !!darkMode;
  const { width: screenW } = useWindowDimensions();
  const isWide = Platform.OS === "web" && screenW >= 960;

  const bg = dark ? "#0D0F14" : "#eef1f8";
  const cardBg = dark ? "#0d1424" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const txtPri = dark ? "#eef2ff" : "#0f172a";
  const txtSec = dark ? "rgba(238,242,255,0.5)" : "rgba(15,23,42,0.5)";

  const totalTasks = goals.reduce((a: number, g: any) => a + g.tasks.length, 0);
  const completedTasks = goals.reduce(
    (a: number, g: any) => a + g.tasks.filter((t: any) => t.completed).length,
    0,
  );

  const skillScore = Math.min(9999, completedTasks * 50 + goals.length * 120 + streak * 15);

  /* Use userData from AuthContext */
 const displayName =
  userData?.displayName || user?.displayName || user?.email || "User";
  const userEmail = user?.email || "";

  const unreadCount = notifications.filter((n) => !n.read).length;

  const pendingTaskCount = goals.reduce((acc: number, goal: any) => {
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

  const toggleDark = async () => {
    const next = !darkMode;
    setDarkMode(next);
    await saveTheme(next);
  };

  const FILTERS: { key: NotifCategory; label: string; icon: string }[] = [
    { key: "all", label: "All", icon: "🔔" },
    { key: "task", label: "Tasks", icon: "📌" },
    { key: "streak", label: "Streak", icon: "🔥" },
    { key: "goal", label: "Goals", icon: "🏆" },
    { key: "system", label: "System", icon: "⚙️" },
  ];

  const filtered =
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => n.category === activeFilter);

  const markAllRead = () =>
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setNotifications((p) =>
      p.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

  /* ✅ Dismiss notification permanently */
  const dismissNotif = async (id: string) => {
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(id);
    setDismissedIds(newDismissed);
    await saveDismissed(newDismissed);
  };

  /* Clear all dismissible notifications */
  const clearAll = async () => {
    const newDismissed = new Set(dismissedIds);
    const count = notifications.filter((n) => n.dismissible).length;
    notifications
      .filter((n) => n.dismissible)
      .forEach((n) => newDismissed.add(n.id));
    setDismissedIds(newDismissed);
    await saveDismissed(newDismissed);
    showSuccess(`Cleared ${count} notification${count > 1 ? "s" : ""}`);
  };

  /* ── Notification card ── */
  const NotifCard = ({ item, index }: { item: NotifItem; index: number }) => (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: Animated.add(
                slideAnim,
                new Animated.Value(index * 3),
              ),
            },
          ],
        },
        Platform.OS === "web"
          ? ({
              animation: `sk-np-fadeUp .3s ease ${Math.min(index * 0.04, 0.3)}s both`,
            } as any)
          : {},
      ]}
    >
      <Pressable
        className={Platform.OS === "web" ? "sk-np-hov" : undefined}
        onPress={() => markRead(item.id)}
        style={[
          nSt.card,
          {
            backgroundColor: item.read
              ? cardBg
              : dark
                ? "rgba(99,102,241,0.07)"
                : "rgba(99,102,241,0.04)",
            borderColor: item.read ? border : "rgba(99,102,241,0.22)",
            borderLeftColor: item.color,
          },
          Platform.OS === "web"
            ? ({
                boxShadow: dark
                  ? "0 2px 14px rgba(0,0,0,0.35)"
                  : "0 2px 10px rgba(0,0,0,0.06)",
              } as any)
            : {},
        ]}
      >
        {/* Icon */}
        <View style={[nSt.cardIcon, { backgroundColor: item.color + "18" }]}>
          <Text style={{ fontSize: 22 }}>{item.icon}</Text>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Text style={[nSt.cardTitle, { color: txtPri }]}>{item.title}</Text>
            <Text style={[nSt.cardTime, { color: txtSec }]}>{item.time}</Text>
          </View>
          <Text style={[nSt.cardBody, { color: txtSec }]} numberOfLines={2}>
            {item.body}
          </Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
            <View
              style={[
                nSt.catTag,
                {
                  backgroundColor: item.color + "18",
                  borderColor: item.color + "33",
                },
              ]}
            >
              <Text style={[nSt.catTagTx, { color: item.color }]}>
                {
                  {
                    task: "Task",
                    streak: "Streak",
                    goal: "Goal",
                    system: "System",
                  }[item.category]
                }
              </Text>
            </View>
            {!item.read && (
              <View
                style={[
                  nSt.catTag,
                  {
                    backgroundColor: "rgba(99,102,241,0.1)",
                    borderColor: "rgba(99,102,241,0.22)",
                  },
                ]}
              >
                <Text style={[nSt.catTagTx, { color: "#6366f1" }]}>New</Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={{ alignItems: "center", gap: 10, flexShrink: 0 }}>
          {!item.read && (
            <View style={[nSt.unreadDot, { backgroundColor: item.color }]} />
          )}
          {item.dismissible && (
            <Pressable
              className={Platform.OS === "web" ? "sk-np-del" : undefined}
              onPress={() => dismissNotif(item.id)}
              style={({ pressed }) => [nSt.delBtn, pressed && { opacity: 0.5 }]}
            >
              <Text style={{ color: txtSec, fontSize: 13 }}>✕</Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );

  /* ── Filter chips ── */
  const FilterRow = ({ horizontal }: { horizontal?: boolean }) => {
    const chips = FILTERS.map((f) => {
      const count =
        f.key === "all"
          ? notifications.length
          : notifications.filter((n) => n.category === f.key).length;
      const active = activeFilter === f.key;
      return (
        <Pressable
          key={f.key}
          className={Platform.OS === "web" ? "sk-np-chip" : undefined}
          onPress={() => setActiveFilter(f.key)}
          style={[
            nSt.chip,
            active
              ? { backgroundColor: "#6366f1", borderColor: "#6366f1" }
              : {
                  backgroundColor: dark
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.04)",
                  borderColor: border,
                },
            Platform.OS === "web" && active
              ? ({ boxShadow: "0 4px 14px rgba(99,102,241,0.35)" } as any)
              : {},
          ]}
        >
          <Text style={{ fontSize: 14 }}>{f.icon}</Text>
          <Text style={[nSt.chipTx, { color: active ? "white" : txtSec }]}>
            {f.label}
          </Text>
          <View
            style={[
              nSt.chipCount,
              {
                backgroundColor: active
                  ? "rgba(255,255,255,0.22)"
                  : dark
                    ? "rgba(255,255,255,0.09)"
                    : "rgba(0,0,0,0.07)",
              },
            ]}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "800",
                color: active ? "white" : txtSec,
              }}
            >
              {count}
            </Text>
          </View>
        </Pressable>
      );
    });
    if (horizontal) return <>{chips}</>;
    return <View style={nSt.filterRow}>{chips}</View>;
  };

  /* ── Top bar (wide)  ════ */
  const WideTopBar = () => {
    const [showDrop, setShowDrop] = useState(false);
    const [showNotif2, setShowNotif2] = useState(false);
    const bellAnim = useRef(new Animated.Value(1)).current;
    const [time, setTime] = useState(() =>
      new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
    const [seconds, setSeconds] = useState(() => new Date().getSeconds());

    useEffect(() => {
      const tm = setInterval(() => {
        const now = new Date();
        setTime(
          now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
        setSeconds(now.getSeconds());
      }, 1000);
      return () => clearInterval(tm);
    }, []);

    return (
      <View
        style={[
          nSt.topBar,
          {
            backgroundColor: dark ? "#0a0f20" : "#ffffff",
            borderBottomColor: border,
          },
          Platform.OS === "web"
            ? ({ position: "sticky", top: 0, zIndex: 200 } as any)
            : {},
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Pressable
            onPress={() => setSidebarOpen((s) => !s)}
            style={[
              nSt.hambBtn,
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
                    nSt.hambLine,
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
            <Text style={[nSt.pageTitle, { color: txtPri }]}>
              Notifications
            </Text>
            <Text style={[nSt.pageSub, { color: txtSec }]}>
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up 🎉"}
            </Text>
          </View>
        </View>
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
            style={
              {
                width: 44,
                height: 26,
                borderRadius: 99,
                backgroundColor: dark ? ACCENT : "rgba(0,0,0,0.1)",
                justifyContent: "center",
                position: "relative",
                ...(Platform.OS === "web"
                  ? ({ cursor: "pointer" } as any)
                  : {}),
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

          {/* Bell with sync dot*/}
          <Pressable
            style={
              {
                width: 40,
                height: 40,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              } as any
            }
            onPress={() => setShowNotif2((s) => !s)}
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

            {pendingTaskCount > 0 && (
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
                <Text
                  style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}
                >
                  {pendingTaskCount}
                </Text>
              </View>
            )}
            {showNotif2 && (
              <NotifDropdown
                dark={dark}
                notifications={[]}
                pendingTasks={pendingTaskCount}
                streak={streak}
                onClose={() => setShowNotif2(false)}
                onViewAll={() => setShowNotif2(false)}
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
                email={userEmail}
                overallPct={getOverallProgress()}
                streak={streak}
                skillScore={skillScore}
                userRole={userData?.role || "Learner"}
                onClose={() => setShowDrop(false)}
                onToggleDark={toggleDark}
                onShowV2={() => showComingSoon()}
                router={router}
                onLogoutReset={() => {}}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  /* ── Stat cards ── */
  const StatsRow = () => (
    <View style={nSt.statsRow}>
      {[
        {
          icon: "🔔",
          val: notifications.length,
          lbl: "Total",
          color: "#6366f1",
        },
        { icon: "📬", val: unreadCount, lbl: "Unread", color: "#ef4444" },
        {
          icon: "📌",
          val: notifications.filter((n) => n.category === "task").length,
          lbl: "Tasks",
          color: "#f97316",
        },
        {
          icon: "🏆",
          val: notifications.filter((n) => n.category === "goal").length,
          lbl: "Goals",
          color: "#34d399",
        },
      ].map((s, i) => (
        <View
          key={i}
          style={[
            nSt.statCard,
            {
              backgroundColor: cardBg,
              borderColor: border,
              borderTopColor: s.color,
              borderTopWidth: 2,
            },
            Platform.OS === "web"
              ? ({
                  boxShadow: dark
                    ? "0 4px 20px rgba(0,0,0,0.3)"
                    : `0 4px 16px ${s.color}18`,
                } as any)
              : {},
          ]}
        >
          <Text style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</Text>
          <Text style={[nSt.statVal, { color: txtPri }]}>{s.val}</Text>
          <Text style={[nSt.statLbl, { color: txtSec }]}>{s.lbl}</Text>
        </View>
      ))}
    </View>
  );

  /* ── Overall Progress Card ── */
  const OverallProgressCard = () => {
    const overallPct = getOverallProgress();
    const totalTasks = goals.reduce(
      (a: number, g: any) => a + g.tasks.length,
      0,
    );
    const completedTasks = goals.reduce(
      (a: number, g: any) => a + g.tasks.filter((t: any) => t.completed).length,
      0,
    );

    return (
  <View
    style={[
      nSt.progressCard,
      {
        backgroundColor: cardBg,
        borderColor: border,
      },
      Platform.OS === "web"
        ? ({
            boxShadow: dark
              ? "0 4px 20px rgba(0,0,0,0.3)"
              : "0 4px 16px rgba(99,102,241,0.12)",
          } as any)
        : {},
    ]}
  >
    <Text style={[nSt.progressTitle, { color: ACCENT }]}>
      OVERALL PROGRESS
    </Text>

    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
      {/* RING */}
      <View
        style={[
          nSt.progressRing,
          Platform.OS === "web"
            ? ({
                background: `conic-gradient(${ACCENT} ${
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
            nSt.progressRingInner,
            { backgroundColor: dark ? "#0a0f20" : "#f5f7ff" },
          ]}
        >
          <Text style={{ fontSize: 11, fontWeight: "800", color: ACCENT }}>
            {overallPct}%
          </Text>
        </View>
      </View>

      {/* TEXT */}
      <View>
        <Text style={{ fontSize: 20, fontWeight: "900", color: txtPri }}>
          {completedTasks}
          <Text style={{ fontSize: 13, fontWeight: "500", color: txtSec }}>
            /{totalTasks}
          </Text>
        </Text>

        <Text style={{ fontSize: 11, fontWeight: "500", color: txtSec }}>
          tasks done
        </Text>
      </View>
    </View>

    {/* BAR */}
    <View
      style={{
        height: 5,
        borderRadius: 99,
        backgroundColor: dark
          ? "rgba(255,255,255,0.07)"
          : "rgba(0,0,0,0.07)",
        overflow: "hidden",
        marginTop: 10,
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${overallPct}%`,
          backgroundColor: ACCENT,
          borderRadius: 99,
        }}
      />
    </View>
  </View>
);
  };

  /* ── Empty state ── */
  const EmptyState = () => (
    <View
      style={[nSt.emptyBox, { backgroundColor: cardBg, borderColor: border }]}
    >
      <Text style={{ fontSize: 40, marginBottom: 12 }}>🎉</Text>
      <Text
        style={{
          fontSize: 17,
          fontWeight: "800",
          color: txtPri,
          marginBottom: 6,
        }}
      >
        All clear!
      </Text>
      <Text style={{ fontSize: 13, color: txtSec }}>
        No notifications in this category
      </Text>
    </View>
  );

  /* ════════════ RENDER ════════════ */
  return (
    <View style={[nSt.screen, { backgroundColor: bg }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />

      {isWide ? (
        /* ── Desktop ── */
        <View style={nSt.wideRoot}>
          <View
            style={[
              { overflow: "hidden" },
              Platform.OS === "web"
                ? ({
                    width: sidebarOpen ? SIDEBAR_W : 0,
                    minWidth: sidebarOpen ? SIDEBAR_W : 0,
                    transition:
                      "width .28s cubic-bezier(.4,0,.2,1),min-width .28s",
                  } as any)
                : { width: sidebarOpen ? SIDEBAR_W : 0 },
            ]}
          >
            <NotifSidebar
              dark={dark}
              router={router}
              isSynced={isSynced}
              displayName={displayName}
              unreadCount={unreadCount}
              userRole={userData?.role || "Software Developer"}
              overallPct={getOverallProgress()}
              completedTasks={completedTasks}
              totalTasks={totalTasks}
            />
          </View>

          <View style={nSt.wideCenter}>
            <WideTopBar />
            <ScrollView
              style={{ flex: 1, paddingHorizontal: 28, paddingTop: 28 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              <Animated.View
                style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }}
              >
                <StatsRow />
                <FilterRow />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <Text style={[nSt.listHeading, { color: txtPri }]}>
                    {activeFilter === "all"
                      ? "All Notifications"
                      : `${FILTERS.find((f) => f.key === activeFilter)?.label} Notifications`}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    {filtered.length > 0 && (
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "500",
                          color: txtSec,
                        }}
                      >
                        {filtered.length} item{filtered.length !== 1 ? "s" : ""}
                      </Text>
                    )}
                    {/*  CLEAR ALL BUTTON */}
                    {filtered.some(
                      (n) => n.dismissible && !dismissedIds.has(n.id),
                    ) && (
                      <Pressable
                        onPress={clearAll}
                        style={({ pressed }) => ({
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: pressed
                            ? dark
                              ? "rgba(239,68,68,0.2)"
                              : "rgba(239,68,68,0.1)"
                            : "transparent",
                          borderWidth: 1,
                          borderColor: dark
                            ? "rgba(239,68,68,0.3)"
                            : "rgba(239,68,68,0.2)",
                        })}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: "#ef4444",
                          }}
                        >
                          Clear All
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
                {filtered.length === 0 ? (
                  <EmptyState />
                ) : (
                  <View style={{ gap: 10 }}>
                    {filtered.map((item, i) => (
                      <NotifCard key={item.id} item={item} index={i} />
                    ))}
                  </View>
                )}
              </Animated.View>
            </ScrollView>
          </View>
        </View>
      ) : (
        /* ── Mobile / Tablet ── */
        <View style={{ flex: 1 }}>
          <View
            style={[
              nSt.mobileHeader,
              {
                backgroundColor: dark ? "#0a0f20" : "#ffffff",
                borderBottomColor: border,
              },
            ]}
          >
            <Pressable onPress={() => router.back()} style={nSt.backArrow}>
              <Text style={{ fontSize: 20, color: "#6366f1" }}>←</Text>
            </Pressable>
            <Text style={[nSt.pageTitle, { color: txtPri }]}>
              Notifications
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              {unreadCount > 0 && (
                <>
                  <View style={nSt.unreadBadge}>
                    <Text
                      style={{
                        color: "white",
                        fontSize: 11,
                        fontWeight: "800",
                      }}
                    >
                      {unreadCount}
                    </Text>
                  </View>
                  <Pressable onPress={markAllRead}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: "#6366f1",
                      }}
                    >
                      Mark all read
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              maxHeight: 58,
              flexGrow: 0,
            }}
            contentContainerStyle={{
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
            }}
          >
            <FilterRow horizontal />
          </ScrollView>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 10 }}
          >
            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              filtered.map((item, i) => (
                <NotifCard key={item.id} item={item} index={i} />
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

/* ════════════════════════════════
   STYLES
════════════════════════════════ */
const nSt = StyleSheet.create({
  screen: { flex: 1 },
  wideRoot: { flex: 1, flexDirection: "row" } as any,
  wideCenter: { flex: 1, flexDirection: "column", minWidth: 0 } as any,

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    height: 70,
    borderBottomWidth: 1,
    flexShrink: 0,
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
  pageTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
    ...(Platform.OS === "web"
      ? ({ fontFamily: "Outfit,sans-serif" } as any)
      : {}),
  },
  pageSub: { fontSize: 12, fontWeight: "500", marginTop: 1 },
  backBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  markAllBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(99,102,241,0.1)",
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  markAllTx: { fontSize: 13, fontWeight: "700", color: "#6366f1" },

  mobileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backArrow: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  statsRow: { flexDirection: "row", gap: 14, marginBottom: 24 } as any,
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    alignItems: "center",
  },
  statVal: {
    fontSize: 28,
    fontWeight: "900",
    ...(Platform.OS === "web"
      ? ({ fontFamily: "Outfit,sans-serif" } as any)
      : {}),
  },
  statLbl: { fontSize: 12, fontWeight: "500", marginTop: 2 },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap" as const,
    gap: 8,
    marginBottom: 20,
  } as any,
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 99,
    borderWidth: 1,
  },
  chipTx: { fontSize: 13, fontWeight: "700" },
  chipCount: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99,
    minWidth: 20,
    alignItems: "center",
  },

  listHeading: {
    fontSize: 16,
    fontWeight: "800",
    ...(Platform.OS === "web"
      ? ({ fontFamily: "Outfit,sans-serif" } as any)
      : {}),
  },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardTitle: { fontSize: 14, fontWeight: "800" },
  cardTime: { fontSize: 11, fontWeight: "500" },
  cardBody: { fontSize: 13, fontWeight: "500", lineHeight: 19 },
  catTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  catTagTx: { fontSize: 10, fontWeight: "700" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  unreadBadge: {
    backgroundColor: "#ef4444",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  delBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },

  emptyBox: {
    borderRadius: 20,
    padding: 48,
    alignItems: "center",
    borderWidth: 1,
    marginTop: 8,
  },

 progressCard: {
  borderRadius: 16,   
  padding: 16,        
  borderWidth: 1,
  marginBottom: 20,  
},
  progressTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: "uppercase" as const,
  },
progressContent: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,            // was 16 ❗
  marginBottom: 10,   // was 16 ❗
},
  progressRingContainer: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
  },
  progressRing: {
  width: 52,          
  height: 52,
  borderRadius: 26,
},
  progressRingInner: {
  width: 40,          // was 54 ❗
  height: 40,
  borderRadius: 20,
},
  progressPercent: {
  fontSize: 11,       // was 14 ❗
  fontWeight: "800",
},
  progressStats: {
    flex: 1,
  },
  progressTasks: {
  fontSize: 20,       // was 24 ❗
  fontWeight: "900",
},
 progressLabel: {
  fontSize: 11,       // was 12 ❗
  marginTop: 1,
},
});
