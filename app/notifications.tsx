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
import { useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { useContext, useEffect, useRef, useState } from "react";
import SkillPathLogo from "../src/components/SkillPathLogo";
import { AuthContext } from "../src/context/AuthContext";
import { TaskContext } from "../src/context/TaskContext";
import { db } from "../src/services/firebase";
import { listenToNetwork } from "../src/services/network";
import { loadTheme } from "../src/services/uiPreferences";
import { showComingSoon } from "../src/services/toast";

/* ── Web CSS ── */
if (Platform.OS === "web" && typeof document !== "undefined") {
  const id = "sk-notif-page-css";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@700;800;900&display=swap');
      @keyframes sk-np-fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
      @keyframes sk-np-pulse{0%,100%{opacity:1}50%{opacity:.3}}
      @keyframes sk-np-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
      @keyframes sk-np-glow{0%,100%{box-shadow:0 0 8px rgba(99,102,241,.3)}50%{box-shadow:0 0 22px rgba(99,102,241,.75)}}
      .sk-np-hov{transition:background .15s,transform .12s,box-shadow .15s}
      .sk-np-hov:hover{transform:translateX(3px);box-shadow:0 4px 20px rgba(0,0,0,0.1)}
      .sk-np-chip{transition:all .15s;cursor:pointer}
      .sk-np-chip:hover{transform:translateY(-1px)}
      .sk-np-del{transition:opacity .15s;cursor:pointer}
      .sk-np-del:hover{opacity:0.6}
      .sk-np-sidebar-nav{transition:background .15s;cursor:pointer}
      .sk-np-sidebar-nav:hover{background:rgba(99,102,241,0.06)}
    `;
    document.head.appendChild(s);
  }
}

const GOAL_COLORS = [
  "#6366f1","#f97316","#06b6d4","#a78bfa",
  "#fbbf24","#34d399","#3b82f6","#ec4899",
];
const SIDEBAR_W = 260;

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
};

/* ════════════════════════════════
   SIDEBAR (matches dashboard style)
════════════════════════════════ */
function NotifSidebar({
  dark, router, isSynced, displayName, unreadCount,
}: any) {
  const bg     = dark ? "#141720" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const txtPri = dark ? "#eef2ff" : "#0f172a";
  const txtMut = dark ? "rgba(238,242,255,0.45)" : "rgba(15,23,42,0.45)";

  const NAV = [
    { icon: "🏠", label: "Dashboard",     route: "/dashboard" },
    { icon: "📊", label: "Analytics",     route: "/analytics" },
    { icon: "🔔", label: "Reminders",     route: "/notifications", badge: unreadCount },
    { icon: "⚙️", label: "Settings",      route: null, v2: true },
  ];

  const initials = displayName.charAt(0).toUpperCase();

  return (
    <View style={[sbSt.wrap, { backgroundColor: bg, borderRightColor: border }]}>
      {/* Logo */}
      <View style={sbSt.logoRow}>
        <View style={[sbSt.logoIcon, Platform.OS === "web" ? ({ animation: "sk-np-breathe 3s ease-in-out infinite" } as any) : {}]}>
          <SkillPathLogo size={48} />
        </View>
        <View>
          <Text style={[sbSt.logoName, { color: "#a78bfa" }]}>SkillPath</Text>
          <Text style={[sbSt.logoSub,  { color: txtMut }]}>Learning Companion</Text>
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
              if (n.v2) { showComingSoon(); return; }
              if (n.route) router.push(n.route);
            }}
            style={({ pressed }) => [
              sbSt.navItem,
              active && { backgroundColor: dark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)" },
              n.v2  && { opacity: 0.55 },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text style={{ fontSize: 16 }}>{n.icon}</Text>
            <Text style={[sbSt.navTx, {
              color: active ? "#6366f1" : n.v2 ? txtMut : txtPri,
              fontWeight: active ? "700" : "500",
            }]}>
              {n.label}
            </Text>
            {active && <View style={sbSt.activeBar} />}
            {n.v2 && (
              <View style={sbSt.v2pill}>
                <Text style={{ fontSize: 9, fontWeight: "700", color: "#6366f1" }}>v2</Text>
              </View>
            )}
            {!n.v2 && !!n.badge && n.badge > 0 && (
              <View style={sbSt.badge}>
                <Text style={sbSt.badgeTx}>{n.badge}</Text>
              </View>
            )}
          </Pressable>
        );
      })}

      <View style={{ flex: 1 }} />

      {/* User row */}
      <View style={[sbSt.userRow, { borderColor: border }]}>
        <View style={[sbSt.avatar, Platform.OS === "web"
          ? ({ background: "linear-gradient(135deg,#f97316,#ef4444)" } as any)
          : { backgroundColor: "#f97316" }]}>
          <Text style={sbSt.avatarTx}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[sbSt.userName, { color: txtPri }]} numberOfLines={1}>{displayName}</Text>
          <Text style={[sbSt.userSub,  { color: txtMut }]}>Active learner</Text>
        </View>
        <View style={[sbSt.dot, { backgroundColor: isSynced ? "#34d399" : "#f87171" },
          Platform.OS === "web" ? ({ animation: "sk-np-pulse 2s infinite" } as any) : {}]} />
      </View>
    </View>
  );
}

const sbSt = StyleSheet.create({
  wrap: { width: SIDEBAR_W, height: "100%" as any, paddingVertical: 24, paddingHorizontal: 16, borderRightWidth: 1, flexShrink: 0 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 36, paddingHorizontal: 8 },
  logoIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center",
    ...(Platform.OS === "web" ? ({ filter: "drop-shadow(0 4px 12px rgba(99,102,241,0.35))" } as any) : {}) },
  logoName: { fontSize: 16, fontWeight: "900", letterSpacing: -0.5, ...(Platform.OS === "web" ? ({ fontFamily: "Outfit,sans-serif" } as any) : {}) },
  logoSub:  { fontSize: 11, fontWeight: "500" },
  navLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10, paddingLeft: 8, textTransform: "uppercase" as const },
  navItem:  { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4, position: "relative" },
  navTx:    { fontSize: 14, flex: 1 },
  activeBar:{ width: 4, height: 20, backgroundColor: "#6366f1", borderRadius: 99, ...(Platform.OS === "web" ? ({ boxShadow: "0 0 8px rgba(99,102,241,0.5)" } as any) : {}) },
  v2pill:   { backgroundColor: "rgba(99,102,241,0.12)", borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2 },
  badge:    { backgroundColor: "#ef4444", borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 },
  badgeTx:  { color: "white", fontSize: 10, fontWeight: "800" },
  userRow:  { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, borderWidth: 1 },
  avatar:   { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#f97316" },
  avatarTx: { color: "white", fontWeight: "800", fontSize: 15 },
  userName: { fontSize: 13, fontWeight: "700" },
  userSub:  { fontSize: 11, fontWeight: "500" },
  dot:      { width: 8, height: 8, borderRadius: 4 },
});

/* ── Live Clock for TopBar ── */
function LiveClock({ dark }: { dark: boolean }) {
  const txtSec = dark ? "rgba(238,242,255,0.5)" : "rgba(15,23,42,0.5)";
  const border = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";

  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
  const [date, setDate] = useState(() =>
    new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  );
  const [seconds, setSeconds] = useState(() => new Date().getSeconds());

  useEffect(() => {
    const tm = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
      setDate(now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
      setSeconds(now.getSeconds());
    }, 1000);
    return () => clearInterval(tm);
  }, []);

  const pct = seconds / 60;
  const r = 10, cx = 12, cy = 12;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingHorizontal: 14,
          paddingVertical: 9,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: border,
        },
        Platform.OS === "web"
          ? ({
              background: dark
                ? "rgba(255,255,255,0.03)"
                : "rgba(99,102,241,0.03)",
            } as any)
          : {},
      ]}
    >
      {Platform.OS === "web" && (
        <svg width="24" height="24" viewBox="0 0 24 24">
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}
            strokeWidth="2"
          />
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: "stroke-dasharray 0.5s linear" } as any}
          />
          <circle cx={cx} cy={cy} r={2} fill="#6366f1" />
        </svg>
      )}
      <View>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "800",
            color: dark ? "#eef2ff" : "#0f172a",
            letterSpacing: -0.3,
            ...(Platform.OS === "web"
              ? ({ fontFamily: "Outfit,sans-serif" } as any)
              : {}),
          }}
        >
          {time}
        </Text>
        <Text style={{ fontSize: 10, fontWeight: "500", color: txtSec }}>
          {date}
        </Text>
      </View>
    </View>
  );
}

/* ════════════════════════════════
   MAIN PAGE
════════════════════════════════ */
export default function NotificationsPage() {
  const router  = useRouter();
  const authCtx = useContext(AuthContext);
  const taskCtx = useContext(TaskContext);

  if (!authCtx || !authCtx.user || !taskCtx) return null;

  const user  = authCtx.user;
  const { goals } = taskCtx;

  const [darkMode,     setDarkMode]     = useState<boolean | null>(null);
  const [isSynced,     setIsSynced]     = useState(false);
  const [streak,       setStreak]       = useState(0);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [activeFilter, setActiveFilter] = useState<NotifCategory>("all");
  const [notifications, setNotifications] = useState<NotifItem[]>([]);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  /* Setup */
  useEffect(() => {
    loadTheme().then(setDarkMode);
    const unsub = listenToNetwork(setIsSynced);
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) setStreak(snap.data().streak || 0);
    });
    return unsub;
  }, [user.uid]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 10 }),
    ]).start();
  }, []);

  /* Build notifications from real data */
  useEffect(() => {
    const notifs: NotifItem[] = [];

    // Pending tasks → unread
    goals.forEach((g: any, gi: number) => {
      g.tasks.forEach((t: any) => {
        if (
          t && t.title && t.title.trim() !== "" &&
          !(t.completed === true || t.completed === "true" || t.completed === 1 || t.isCompleted === true)
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
          });
        }
      });
    });

    // Streak
    if (streak > 0) {
      notifs.unshift({
        id: "streak-info",
        icon: "🔥",
        title: `${streak} Day Streak!`,
        body: streak >= 7
          ? "Incredible consistency! You've maintained a full week streak."
          : "Complete tasks daily to keep your streak alive.",
        time: "Today",
        color: "#f97316",
        category: "streak",
        read: notifs.length === 0,
      });
    }

    // Goal completions → read
    goals.forEach((g: any, gi: number) => {
      const done  = g.tasks.filter((t: any) => t.completed).length;
      const total = g.tasks.length;
      if (total > 0 && done === total) {
        notifs.unshift({
          id: `goal-done-${g.id}`,
          icon: "🏆",
          title: "Goal Completed!",
          body: `All tasks in "${g.name}" are done. Excellent work!`,
          time: "Recently",
          color: GOAL_COLORS[gi % GOAL_COLORS.length],
          category: "goal",
          read: true,
        });
      }
    });

    // System
    notifs.push({
      id: "sys-welcome",
      icon: "🚀",
      title: "Welcome to SkillPath",
      body: "Track your learning goals and stay consistent every day.",
      time: "Earlier",
      color: "#6366f1",
      category: "system",
      read: true,
    });

    setNotifications(notifs);
  }, [goals, streak]);

  /* Derived */
  const dark = !!darkMode;
  const { width: screenW } = useWindowDimensions();
  const isWide = Platform.OS === "web" && screenW >= 960;

  const bg      = dark ? "#0D0F14" : "#eef1f8";
  const cardBg  = dark ? "#0d1424" : "#ffffff";
  const border  = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const txtPri  = dark ? "#eef2ff" : "#0f172a";
  const txtSec  = dark ? "rgba(238,242,255,0.5)" : "rgba(15,23,42,0.5)";

  const displayName  = user.displayName || user.email || "User";
  const unreadCount  = notifications.filter(n => !n.read).length;

  const FILTERS: { key: NotifCategory; label: string; icon: string }[] = [
    { key: "all",    label: "All",    icon: "🔔" },
    { key: "task",   label: "Tasks",  icon: "📌" },
    { key: "streak", label: "Streak", icon: "🔥" },
    { key: "goal",   label: "Goals",  icon: "🏆" },
    { key: "system", label: "System", icon: "⚙️" },
  ];

  const filtered = activeFilter === "all"
    ? notifications
    : notifications.filter(n => n.category === activeFilter);

  const markAllRead  = () => setNotifications(p => p.map(n => ({ ...n, read: true })));
  const markRead     = (id: string) => setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  const deleteNotif  = (id: string) => setNotifications(p => p.filter(n => n.id !== id));

  /* ── Notification card ── */
  const NotifCard = ({ item, index }: { item: NotifItem; index: number }) => (
    <Animated.View
      style={[
        { opacity: fadeAnim, transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(index * 3)) }] },
        Platform.OS === "web"
          ? ({ animation: `sk-np-fadeUp .3s ease ${Math.min(index * 0.04, 0.3)}s both` } as any)
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
              : dark ? "rgba(99,102,241,0.07)" : "rgba(99,102,241,0.04)",
            borderColor:     item.read ? border : "rgba(99,102,241,0.22)",
            borderLeftColor: item.color,
          },
          Platform.OS === "web"
            ? ({ boxShadow: dark ? "0 2px 14px rgba(0,0,0,0.35)" : "0 2px 10px rgba(0,0,0,0.06)" } as any)
            : {},
        ]}
      >
        {/* Icon */}
        <View style={[nSt.cardIcon, { backgroundColor: item.color + "18" }]}>
          <Text style={{ fontSize: 22 }}>{item.icon}</Text>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <Text style={[nSt.cardTitle, { color: txtPri }]}>{item.title}</Text>
            <Text style={[nSt.cardTime,  { color: txtSec }]}>{item.time}</Text>
          </View>
          <Text style={[nSt.cardBody, { color: txtSec }]} numberOfLines={2}>{item.body}</Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
            <View style={[nSt.catTag, { backgroundColor: item.color + "18", borderColor: item.color + "33" }]}>
              <Text style={[nSt.catTagTx, { color: item.color }]}>
                {{ task: "Task", streak: "Streak", goal: "Goal", system: "System" }[item.category]}
              </Text>
            </View>
            {!item.read && (
              <View style={[nSt.catTag, { backgroundColor: "rgba(99,102,241,0.1)", borderColor: "rgba(99,102,241,0.22)" }]}>
                <Text style={[nSt.catTagTx, { color: "#6366f1" }]}>New</Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={{ alignItems: "center", gap: 10, flexShrink: 0 }}>
          {!item.read && <View style={[nSt.unreadDot, { backgroundColor: item.color }]} />}
          <Pressable
            className={Platform.OS === "web" ? "sk-np-del" : undefined}
            onPress={() => deleteNotif(item.id)}
            style={({ pressed }) => [nSt.delBtn, pressed && { opacity: 0.5 }]}
          >
            <Text style={{ color: txtSec, fontSize: 13 }}>✕</Text>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );

  /* ── Filter chips ── */
  const FilterRow = ({ horizontal }: { horizontal?: boolean }) => {
    const chips = FILTERS.map(f => {
      const count  = f.key === "all" ? notifications.length : notifications.filter(n => n.category === f.key).length;
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
              : { backgroundColor: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", borderColor: border },
            Platform.OS === "web" && active
              ? ({ boxShadow: "0 4px 14px rgba(99,102,241,0.35)" } as any)
              : {},
          ]}
        >
          <Text style={{ fontSize: 14 }}>{f.icon}</Text>
          <Text style={[nSt.chipTx, { color: active ? "white" : txtSec }]}>{f.label}</Text>
          <View style={[nSt.chipCount, { backgroundColor: active ? "rgba(255,255,255,0.22)" : dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)" }]}>
            <Text style={{ fontSize: 10, fontWeight: "800", color: active ? "white" : txtSec }}>{count}</Text>
          </View>
        </Pressable>
      );
    });
    if (horizontal) return <>{chips}</>;
    return <View style={nSt.filterRow}>{chips}</View>;
  };

  /* ── Top bar (wide) ── */
  const WideTopBar = () => (
    <View style={[
      nSt.topBar,
      { backgroundColor: dark ? "#0a0f20" : "#ffffff", borderBottomColor: border },
      Platform.OS === "web" ? ({ position: "sticky", top: 0, zIndex: 200 } as any) : {},
    ]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <Pressable
          onPress={() => setSidebarOpen(s => !s)}
          style={[nSt.hambBtn, {
            backgroundColor: sidebarOpen
              ? dark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)"
              : "transparent",
            borderColor: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
          }]}
        >
          <View style={{ gap: 4 }}>
            {([18, 14, 10] as number[]).map((w, i) => (
              <View key={i} style={{ height: 2, width: w, borderRadius: 99,
                backgroundColor: dark ? "rgba(238,242,255,0.6)" : "rgba(15,23,42,0.5)" }} />
            ))}
          </View>
        </Pressable>
        <View>
          <Text style={[nSt.pageTitle, { color: txtPri }]}>Notifications</Text>
          <Text style={[nSt.pageSub, { color: txtSec }]}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up 🎉"}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
  <LiveClock dark={dark} />
  {unreadCount > 0 && (
    <Pressable onPress={markAllRead} style={nSt.markAllBtn}>
      <Text style={nSt.markAllTx}>Mark all read</Text>
    </Pressable>
  )}
</View>
    </View>
  );

  /* ── Stat cards ── */
  const StatsRow = () => (
    <View style={nSt.statsRow}>
      {[
        { icon: "🔔", val: notifications.length, lbl: "Total",   color: "#6366f1" },
        { icon: "📬", val: unreadCount,           lbl: "Unread",  color: "#ef4444" },
        { icon: "📌", val: notifications.filter(n => n.category === "task").length,   lbl: "Tasks",  color: "#f97316" },
        { icon: "🏆", val: notifications.filter(n => n.category === "goal").length,   lbl: "Goals",  color: "#34d399" },
      ].map((s, i) => (
        <View key={i} style={[
          nSt.statCard,
          { backgroundColor: cardBg, borderColor: border, borderTopColor: s.color, borderTopWidth: 2 },
          Platform.OS === "web"
            ? ({ boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.3)" : `0 4px 16px ${s.color}18` } as any)
            : {},
        ]}>
          <Text style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</Text>
          <Text style={[nSt.statVal, { color: txtPri }]}>{s.val}</Text>
          <Text style={[nSt.statLbl, { color: txtSec }]}>{s.lbl}</Text>
        </View>
      ))}
    </View>
  );

  /* ── Empty state ── */
  const EmptyState = () => (
    <View style={[nSt.emptyBox, { backgroundColor: cardBg, borderColor: border }]}>
      <Text style={{ fontSize: 40, marginBottom: 12 }}>🎉</Text>
      <Text style={{ fontSize: 17, fontWeight: "800", color: txtPri, marginBottom: 6 }}>All clear!</Text>
      <Text style={{ fontSize: 13, color: txtSec }}>No notifications in this category</Text>
    </View>
  );

  /* ════════════ RENDER ════════════ */
  return (
    <View style={[nSt.screen, { backgroundColor: bg }]}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} />

      {isWide ? (
        /* ── Desktop ── */
        <View style={nSt.wideRoot}>
          <View style={[
            { overflow: "hidden" },
            Platform.OS === "web"
              ? ({ width: sidebarOpen ? SIDEBAR_W : 0, minWidth: sidebarOpen ? SIDEBAR_W : 0,
                   transition: "width .28s cubic-bezier(.4,0,.2,1),min-width .28s" } as any)
              : { width: sidebarOpen ? SIDEBAR_W : 0 },
          ]}>
            <NotifSidebar
              dark={dark} router={router} isSynced={isSynced}
              displayName={displayName} unreadCount={unreadCount}
            />
          </View>

          <View style={nSt.wideCenter}>
            <WideTopBar />
            <ScrollView
              style={{ flex: 1, paddingHorizontal: 28, paddingTop: 28 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <StatsRow />
                <FilterRow />
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <Text style={[nSt.listHeading, { color: txtPri }]}>
                    {activeFilter === "all" ? "All Notifications" : `${FILTERS.find(f => f.key === activeFilter)?.label} Notifications`}
                  </Text>
                  {filtered.length > 0 && (
                    <Text style={{ fontSize: 12, fontWeight: "500", color: txtSec }}>
                      {filtered.length} item{filtered.length !== 1 ? "s" : ""}
                    </Text>
                  )}
                </View>
                {filtered.length === 0
                  ? <EmptyState />
                  : <View style={{ gap: 10 }}>
                      {filtered.map((item, i) => <NotifCard key={item.id} item={item} index={i} />)}
                    </View>
                }
              </Animated.View>
            </ScrollView>
          </View>
        </View>
      ) : (
        /* ── Mobile / Tablet ── */
        <View style={{ flex: 1 }}>
          <View style={[nSt.mobileHeader, { backgroundColor: dark ? "#0a0f20" : "#ffffff", borderBottomColor: border }]}>
            <Pressable onPress={() => router.back()} style={nSt.backArrow}>
              <Text style={{ fontSize: 20, color: "#6366f1" }}>←</Text>
            </Pressable>
            <Text style={[nSt.pageTitle, { color: txtPri }]}>Notifications</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {unreadCount > 0 && (
                <>
                  <View style={nSt.unreadBadge}>
                    <Text style={{ color: "white", fontSize: 11, fontWeight: "800" }}>{unreadCount}</Text>
                  </View>
                  <Pressable onPress={markAllRead}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#6366f1" }}>Mark all read</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>

          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            style={{ paddingHorizontal: 16, paddingVertical: 10, maxHeight: 58, flexGrow: 0 }}
            contentContainerStyle={{ flexDirection: "row", gap: 8, alignItems: "center" }}
          >
            <FilterRow horizontal />
          </ScrollView>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 10 }}
          >
            {filtered.length === 0
              ? <EmptyState />
              : filtered.map((item, i) => <NotifCard key={item.id} item={item} index={i} />)
            }
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
  screen:     { flex: 1 },
  wideRoot:   { flex: 1, flexDirection: "row" } as any,
  wideCenter: { flex: 1, flexDirection: "column", minWidth: 0 } as any,

  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 28, height: 70, borderBottomWidth: 1, flexShrink: 0,
  },
  hambBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}) },
  pageTitle: { fontSize: 20, fontWeight: "900", letterSpacing: -0.4,
    ...(Platform.OS === "web" ? ({ fontFamily: "Outfit,sans-serif" } as any) : {}) },
  pageSub:   { fontSize: 12, fontWeight: "500", marginTop: 1 },
  backBtn:   { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}) },
  markAllBtn:{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: "rgba(99,102,241,0.1)",
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}) },
  markAllTx: { fontSize: 13, fontWeight: "700", color: "#6366f1" },

  mobileHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backArrow:    { width: 36, height: 36, alignItems: "center", justifyContent: "center" },

  statsRow: { flexDirection: "row", gap: 14, marginBottom: 24 } as any,
  statCard: { flex: 1, borderRadius: 18, padding: 18, borderWidth: 1, alignItems: "center" },
  statVal:  { fontSize: 28, fontWeight: "900", ...(Platform.OS === "web" ? ({ fontFamily: "Outfit,sans-serif" } as any) : {}) },
  statLbl:  { fontSize: 12, fontWeight: "500", marginTop: 2 },

  filterRow: { flexDirection: "row", flexWrap: "wrap" as const, gap: 8, marginBottom: 20 } as any,
  chip:      { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, borderWidth: 1 },
  chipTx:    { fontSize: 13, fontWeight: "700" },
  chipCount: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, minWidth: 20, alignItems: "center" },

  listHeading: { fontSize: 16, fontWeight: "800", ...(Platform.OS === "web" ? ({ fontFamily: "Outfit,sans-serif" } as any) : {}) },

  card: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    padding: 16, borderRadius: 16, borderWidth: 1, borderLeftWidth: 4,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  cardIcon:  { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardTitle: { fontSize: 14, fontWeight: "800" },
  cardTime:  { fontSize: 11, fontWeight: "500" },
  cardBody:  { fontSize: 13, fontWeight: "500", lineHeight: 19 },
  catTag:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  catTagTx:  { fontSize: 10, fontWeight: "700" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  unreadBadge:{ backgroundColor: "#ef4444", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  delBtn:    { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 8 },

  emptyBox: { borderRadius: 20, padding: 48, alignItems: "center", borderWidth: 1, marginTop: 8 },
});