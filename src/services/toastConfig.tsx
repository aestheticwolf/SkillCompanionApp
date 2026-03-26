import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

/* ─── Inject web CSS once ─── */
if (Platform.OS === "web" && typeof document !== "undefined") {
  const id = "sk-toast-css";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @keyframes sk-toast-in{from{opacity:0;transform:translateY(24px) scale(.94)}to{opacity:1;transform:translateY(0) scale(1)}}
      @keyframes sk-toast-out{from{opacity:1;transform:translateY(0) scale(1)}to{opacity:0;transform:translateY(16px) scale(.94)}}
      @keyframes sk-toast-shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
      @keyframes sk-toast-pulse{0%,100%{opacity:1}50%{opacity:.5}}
      .sk-toast-wrap{animation:sk-toast-in .32s cubic-bezier(.34,1.56,.64,1) both}
    `;
    document.head.appendChild(s);
  }
}

/* ─── Detect dark mode ───────────────────────────────────────────
   Priority:
   1. data-sk-theme on <html>  — written by uiPreferences.ts saveTheme()
   2. localStorage "theme"     — Expo AsyncStorage key on web
   3. Common AsyncStorage prefixed variants
   4. .sk-dark-screen DOM class — fallback
─────────────────────────────────────────────────────────────── */
function getIsDark(): boolean {
  if (Platform.OS !== "web" || typeof document === "undefined") return false;

  // 1. Canonical data attribute set by saveTheme (most reliable)
  const attr = document.documentElement.dataset.skTheme;
  if (attr === "dark") return true;
  if (attr === "light") return false;

  // 2. localStorage — try all key variants Expo AsyncStorage uses on web
  try {
    const keys = [
      "theme",
      "@theme",
      "darkMode",
      "dark_mode",
      "@AsyncStorage:theme",
      "RNCAsyncStorage:theme",
    ];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v === "dark" || v === "true" || v === "1") return true;
      if (v === "light" || v === "false" || v === "0") return false;
    }
  } catch (_) {
    // localStorage blocked in this context
  }

  // 3. CSS class fallback
  return document.querySelector(".sk-dark-screen") !== null;
}

/* ══ Custom Toast Component ══ */
function SkToast({
  type,
  text1,
  text2,
  onPress,
  hide,
}: {
  type: "success" | "error" | "info" | "delete";
  text1?: string;
  text2?: string;
  onPress?: () => void;
  hide?: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  /* Detect theme once at mount */
  const isDark = getIsDark();

  /* ── Theme tokens ── */
  const theme = isDark
    ? {
        /* Dark: original look */
        bg: "rgba(0, 3, 10, 0.97)",
        border: "rgba(255,255,255,0.08)",
        titleColor: "#eef2ff",
        subColor: "rgba(238,242,255,0.5)",
        dismissBg: "rgba(255,255,255,0.07)",
        dismissHov: "rgba(255,255,255,0.14)",
        dismissColor: "rgba(238,242,255,0.5)",
        timerTrack: "rgba(255,255,255,0.06)",
        shadow: "0 8px 40px rgba(0,0,0,0.55)",
        nativeBg: "#0d1424",
      }
    : {
        /* Light: clean white card */
        bg: "rgba(255,255,255,0.98)",
        border: "rgba(0,0,0,0.08)",
        titleColor: "#0f172a",
        subColor: "rgba(15,23,42,0.5)",
        dismissBg: "rgba(0,0,0,0.05)",
        dismissHov: "rgba(0,0,0,0.10)",
        dismissColor: "rgba(15,23,42,0.45)",
        timerTrack: "rgba(0,0,0,0.06)",
        shadow: "0 8px 32px rgba(0,0,0,0.12)",
        nativeBg: "#ffffff",
      };

  const cfg = {
    success: {
      icon: "✓",
      iconBg: isDark ? "rgba(52,211,153,0.15)" : "rgba(52,211,153,0.12)",
      iconColor: "#34d399",
      accent: "#34d399",
      barGrad: "linear-gradient(90deg,#34d399,#6ee7b7)",
      glow: isDark ? "rgba(52,211,153,0.25)" : "rgba(52,211,153,0.18)",
      label: text1 || "Success",
    },
    error: {
      icon: "✕",
      iconBg: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.10)",
      iconColor: "#ef4444",
      accent: "#ef4444",
      barGrad: "linear-gradient(90deg,#ef4444,#f87171)",
      glow: isDark ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.15)",
      label: text1 || "Error",
    },
    info: {
      icon: "i",
      iconBg: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.10)",
      iconColor: "#6366f1",
      accent: "#6366f1",
      barGrad: "linear-gradient(90deg,#6366f1,#a78bfa)",
      glow: isDark ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.18)",
      label: text1 || "Info",
    },
    delete: {
      icon: "🗑",
      iconBg: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.10)",
      iconColor: "#ef4444",
      accent: "#ef4444",
      barGrad: "linear-gradient(90deg,#ef4444,#f87171)",
      glow: isDark ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.15)",
      label: text1 || "Deleted",
    },
  }[type as string] as any;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 9,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 9,
      }),
    ]).start();
    Animated.timing(barAnim, {
      toValue: 1,
      duration: 3800,
      useNativeDriver: false,
    }).start();
  }, []);

  /* ── Web render ── */
  if (Platform.OS === "web") {
    return (
      <div
        className="sk-toast-wrap"
        style={
          {
            width: "100%",
            zIndex: 9999,
            minWidth: 320,
            maxWidth: 420,
            background: theme.bg,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 18,
            border: `1px solid ${isDark ? cfg.accent + "33" : cfg.accent + "28"}`,
            boxShadow: `${theme.shadow}, 0 0 0 1px ${cfg.accent}18, 0 4px 20px ${cfg.glow}`,
            overflow: "hidden",
            cursor: "pointer",
            fontFamily: "Plus Jakarta Sans,sans-serif",
          } as React.CSSProperties
        }
        onClick={onPress || hide}
      >
        {/* Top accent bar */}
        <div
          style={{
            height: 3,
            background: cfg.barGrad,
            boxShadow: `0 0 12px ${cfg.glow}`,
          }}
        />

        {/* Body */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 16px",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: cfg.iconBg,
              border: `1.5px solid ${cfg.accent}44`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: `0 0 16px ${cfg.glow}`,
              fontSize: 18,
              fontWeight: "900",
              color: cfg.iconColor,
            }}
          >
            {cfg.icon}
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: theme.titleColor,
                marginBottom: text2 ? 3 : 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {cfg.label}
            </div>
            {text2 && (
              <div
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  color: theme.subColor,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {text2}
              </div>
            )}
          </div>

          {/* Dismiss X */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              hide?.();
            }}
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              border: "none",
              background: theme.dismissBg,
              color: theme.dismissColor,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background .15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = theme.dismissHov)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = theme.dismissBg)
            }
          >
            ✕
          </button>
        </div>

        {/* Timer progress bar */}
        <div
          style={{
            height: 2,
            background: theme.timerTrack,
            margin: "0 16px 12px",
            borderRadius: 99,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              background: cfg.barGrad,
              borderRadius: 99,
              width: "100%",
              animation: "sk-toast-shimmer 3.8s linear forwards",
              backgroundSize: "200% auto",
            }}
          />
        </div>
      </div>
    );
  }

  /* ── Native (iOS / Android) — unchanged ── */
  const nativeBg = isDark ? "#0d1424" : "#ffffff";
  const nativeBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const nativeTitle = isDark ? "#eef2ff" : "#0f172a";
  const nativeSub = isDark ? "rgba(238,242,255,0.5)" : "rgba(15,23,42,0.5)";
  const nativeTrack = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

  return (
    <Animated.View
      style={[
        nSt.wrap,
        {
          backgroundColor: nativeBg,
          borderColor: cfg.accent + "44",
          shadowColor: isDark ? "#000" : cfg.accent,
        },
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      {/* Top accent line */}
      <View style={[nSt.topBar, { backgroundColor: cfg.accent }]} />

      <Pressable onPress={onPress || hide} style={nSt.body}>
        {/* Icon */}
        <View
          style={[
            nSt.iconWrap,
            { backgroundColor: cfg.iconBg, borderColor: cfg.accent + "44" },
          ]}
        >
          <Text style={[nSt.iconTx, { color: cfg.iconColor }]}>{cfg.icon}</Text>
        </View>

        {/* Text */}
        <View style={{ flex: 1 }}>
          <Text style={[nSt.title, { color: nativeTitle }]} numberOfLines={1}>
            {cfg.label}
          </Text>
          {!!text2 && (
            <Text style={[nSt.sub, { color: nativeSub }]} numberOfLines={1}>
              {text2}
            </Text>
          )}
        </View>
      </Pressable>

      {/* Timer bar */}
      <View style={[nSt.timerTrack, { backgroundColor: nativeTrack }]}>
        <Animated.View
          style={[
            nSt.timerBar,
            {
              backgroundColor: cfg.accent,
              width: barAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["100%", "0%"],
              }) as any,
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

/* ── Native styles ── */
const nSt = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    minWidth: 280,
  },
  topBar: { height: 3 },
  body: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    paddingBottom: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    flexShrink: 0,
  },
  iconTx: { fontSize: 16, fontWeight: "900" },
  title: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  sub: { fontSize: 12, fontWeight: "500" },
  timerTrack: {
    height: 2,
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: 99,
    overflow: "hidden",
  },
  timerBar: { height: "100%" as any, borderRadius: 99 },
});

/* ══ Export toastConfig — all 4 types, nothing changed ══ */
export const toastConfig = {
  success: ({ text1, text2, onPress, hide }: any) => (
    <SkToast
      type="success"
      text1={text1}
      text2={text2}
      onPress={onPress}
      hide={hide}
    />
  ),
  error: ({ text1, text2, onPress, hide }: any) => (
    <SkToast
      type="error"
      text1={text1}
      text2={text2}
      onPress={onPress}
      hide={hide}
    />
  ),
  info: ({ text1, text2, onPress, hide }: any) => (
    <SkToast
      type="info"
      text1={text1}
      text2={text2}
      onPress={onPress}
      hide={hide}
    />
  ),
  delete: ({ text1, text2, onPress, hide }: any) => (
    <SkToast
      type="delete"
      text1={text1}
      text2={text2}
      onPress={onPress}
      hide={hide}
    />
  ),
};
