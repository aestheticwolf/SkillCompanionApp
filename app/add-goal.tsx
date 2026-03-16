import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  ScrollView,
} from "react-native";

import { useState, useContext, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { useWindowDimensions } from "react-native";
import { TaskContext } from "../src/context/TaskContext";
import { loadTheme } from "../src/services/uiPreferences";
import { showSuccess, showError } from "../src/services/toast";

/* ════ WEB CSS — matches add-task.tsx & dashboard ════ */
if (Platform.OS === "web" && typeof document !== "undefined") {
  const id = "sk-addgoal-css";
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
      @keyframes sk-fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
      .sk-breathe{animation:sk-breathe 3s ease-in-out infinite}
      .sk-float{animation:sk-float 4s ease-in-out infinite}
      .sk-hov{transition:transform .18s,box-shadow .18s}
      .sk-hov:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(99,102,241,.14)!important}
      .sk-tip-hov{transition:background .15s,border-color .15s,transform .15s}
      .sk-tip-hov:hover{transform:translateY(-1px)}
      input:focus{outline:none!important;}
      *{box-sizing:border-box;}
      ::-webkit-scrollbar{width:4px}
      ::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.3);border-radius:99px}
    `;
    document.head.appendChild(s);
  }
}

/* ─── Constants ─── */
const ACCENT  = "#6366f1";
const ACCENT2 = "#a78bfa";

const SUGGESTIONS = [
  { icon: "☕", label: "Learn Java",       color: "#f97316" },
  { icon: "⚛️", label: "React Native",    color: "#a78bfa" },
  { icon: "🔥", label: "Firebase",         color: "#fbbf24" },
  { icon: "🎨", label: "UI Design",        color: "#34d399" },
  { icon: "🦋", label: "Flutter",          color: "#06b6d4" },
  { icon: "🚀", label: "Node.js",          color: "#6366f1" },
  { icon: "🐍", label: "Python",           color: "#3b82f6" },
  { icon: "🤖", label: "Machine Learning", color: "#ec4899" },
];

const GOAL_TYPES = [
  { icon: "💻", label: "Technical Skill", desc: "Programming, tools & frameworks", color: "#6366f1" },
  { icon: "📚", label: "Study Topic",     desc: "Courses, books & certifications",  color: "#f97316" },
  { icon: "🎯", label: "Project Goal",    desc: "Build something from scratch",     color: "#34d399" },
  { icon: "💡", label: "Soft Skill",      desc: "Communication, leadership & more", color: "#a78bfa" },
];

const TIPS = [
  { icon: "🎯", label: "Be outcome-focused",  sub: "e.g. Learn React, not study stuff" },
  { icon: "📏", label: "Make it measurable",  sub: "Know exactly when you are done"    },
  { icon: "⏱️", label: "Keep scope realistic", sub: "2-8 weeks is the sweet spot"      },
  { icon: "🔥", label: "Connect to ambition",  sub: "Goals you care about stick longer" },
];

/* ─── Particles ─── */
function Particles() {
  const [pts, setPts] = useState<{id:number;x:number}[]>([]);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const id = setInterval(() => {
      setPts(p => [...p.slice(-14), { id: Date.now(), x: Math.random() * 90 + 5 }]);
    }, 450);
    return () => clearInterval(id);
  }, []);
  if (Platform.OS !== "web") return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: "hidden", borderRadius: "inherit" } as any]}>
      {pts.map(p => (
        <View key={p.id} style={{
          position: "absolute", bottom: 0, left: `${p.x}%` as any,
          width: 5, height: 5, borderRadius: 3,
          backgroundColor: "rgba(255,255,255,0.5)",
          animation: "sk-particle 1.6s ease-out forwards",
        } as any} />
      ))}
    </View>
  );
}

/* ════════════════════════════════
   MAIN COMPONENT
════════════════════════════════ */
export default function AddGoal() {
  const router = useRouter();
  const ctx    = useContext(TaskContext);
  if (!ctx) return null;
  const { addGoal } = ctx;

  /* ── State (ALL original logic preserved) ── */
  const [goal,         setGoal]         = useState("");
  const [darkMode,     setDarkMode]     = useState<boolean | null>(null);
  const [focused,      setFocused]      = useState(false);
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [hoveredSug,   setHoveredSug]   = useState<number | null>(null);
  const [saving,       setSaving]       = useState(false);

  /* ── Animations — same pattern as add-task.tsx ── */
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(28)).current;
  const slide2Anim = useRef(new Animated.Value(40)).current;
  const hdrScale   = useRef(new Animated.Value(0.97)).current;
  const btnScale   = useRef(new Animated.Value(1)).current;
  const inputScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadTheme().then(setDarkMode);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
      Animated.spring(hdrScale,  { toValue: 1, useNativeDriver: true, tension: 75, friction: 9 }),
    ]).start(() => {
      Animated.spring(slide2Anim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }).start();
    });
  }, []);

  const onFocusInput = () => {
    setFocused(true);
    Animated.spring(inputScale, { toValue: 1.01, useNativeDriver: true, tension: 150, friction: 8 }).start();
  };
  const onBlurInput = () => {
    setFocused(false);
    Animated.spring(inputScale, { toValue: 1, useNativeDriver: true, tension: 150, friction: 8 }).start();
  };

  /* ── Handler — ORIGINAL logic untouched ── */
  const handleSave = async () => {
    if (!goal.trim()) { showError("Goal name cannot be empty"); return; }
    setSaving(true);
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true, tension: 200, friction: 5 }),
      Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 5 }),
    ]).start(async () => {
      try {
        await addGoal(goal.trim());
        showSuccess("Goal added 🎯");
        router.back();
      } catch {
        showError("Something went wrong");
        setSaving(false);
      }
    });
  };

  const onPressBtn = () => {
    if (!goal.trim()) { showError("Goal name cannot be empty"); return; }
    handleSave();
  };

  /* ── Theme — exact same tokens as dashboard & add-task ── */
  const dark       = !!darkMode;
  const bg         = dark ? "#080d18" : "#eef1f8";
  const card       = dark ? "#0d1424" : "#ffffff";
  const cardBorder = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const txtPri     = dark ? "#eef2ff" : "#0f172a";
  const txtSec     = dark ? "rgba(238,242,255,0.55)" : "#475569";
  const txtMute    = dark ? "rgba(238,242,255,0.28)" : "rgba(15,23,42,0.3)";
  const inputBg    = dark ? "rgba(255,255,255,0.04)" : "#f8faff";
  const inputBorder = focused ? ACCENT : dark ? "rgba(255,255,255,0.14)" : "rgba(99,102,241,0.22)";
  const cardSh     = Platform.OS === "web"
    ? { boxShadow: dark ? "0 2px 16px rgba(0,0,0,0.4)" : "0 2px 12px rgba(0,0,0,0.05)" }
    : { elevation: 3 };

  const hasText = goal.trim().length > 0;
  const charMax = 60;
  const nearMax = goal.length > charMax * 0.8;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* ══════════ HERO BANNER — full-bleed like add-task ══════════ */}
        <Animated.View style={[
          heroSt.wrap,
          Platform.OS === "web" ? { boxShadow: "0 8px 40px rgba(99,102,241,0.28)" } as any : { elevation: 10 },
          { transform: [{ scale: hdrScale }], opacity: fadeAnim },
        ]}>
          {/* Gradient bg */}
          {Platform.OS === "web" ? (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, {
              background: "linear-gradient(135deg,#3730a3 0%,#6d28d9 55%,#9333ea 100%)",
            } as any]} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#3730a3" }]} />
          )}

          {/* Floating orbs */}
          <View pointerEvents="none" style={[heroSt.orb, { width: 280, height: 280, top: -80, right: -60 },
            Platform.OS === "web" ? { animation: "sk-float 5s ease-in-out infinite" } as any : {}
          ]} />
          <View pointerEvents="none" style={[heroSt.orb, { width: 160, height: 160, bottom: -50, left: 80 },
            Platform.OS === "web" ? { animation: "sk-float 6s ease-in-out infinite reverse" } as any : {}
          ]} />
          <View pointerEvents="none" style={[heroSt.orb, { width: 100, height: 100, top: 20, left: -20, opacity: 0.08 },
            Platform.OS === "web" ? { animation: "sk-float 4s ease-in-out infinite" } as any : {}
          ]} />

          <Particles />

          {/* Top nav row */}
          <View style={heroSt.navRow}>
            <Pressable onPress={() => router.back()}
              style={({ pressed }) => [heroSt.backBtn, pressed && { opacity: 0.7 }]}>
              <Text style={heroSt.backTx}>← Back</Text>
            </Pressable>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={heroSt.navTitle}>Create Goal</Text>
              <Text style={heroSt.navSub}>Define your next achievement</Text>
            </View>
            <View style={{ width: 80 }} />
          </View>

          {/* Hero content */}
          <View style={heroSt.content}>
            <View style={[heroSt.iconRing,
              Platform.OS === "web" ? { animation: "sk-breathe 3s ease-in-out infinite" } as any : {}
            ]}>
              <View style={heroSt.iconInner}>
                <Text style={{ fontSize: 36 }}>🎯</Text>
              </View>
            </View>

            <Text style={heroSt.heroTitle}>What skill will you master?</Text>
            <Text style={heroSt.heroSub}>
              Every expert started with a single goal.{"\n"}Set yours and start building momentum.
            </Text>

            {/* Status chips */}
            <View style={heroSt.chipsRow}>
              {["🎯 Goal Tracking", "⚡ Instant Sync", "📊 Progress Charts"].map((chip, i) => (
                <View key={i} style={heroSt.chip}>
                  <Text style={heroSt.chipTx}>{chip}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ══════════ CONTENT AREA ══════════ */}
        <View style={[cSt.container, Platform.OS === "web" ? cSt.containerWide : {}]}>

          {/* ── GOAL CATEGORY CARD ── */}
          <Animated.View
            className={Platform.OS === "web" ? "sk-hov" : undefined}
            style={[
              formSt.card,
              { backgroundColor: card, borderColor: cardBorder, ...cardSh },
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={formSt.cardHdr}>
              <View style={formSt.cardHdrLeft}>
                <View style={[formSt.cardIconWrap, { backgroundColor: "#a78bfa14" }]}>
                  <Text style={{ fontSize: 18 }}>🗂️</Text>
                </View>
                <View>
                  <Text style={[formSt.cardTitle, { color: txtPri }]}>Goal Category</Text>
                  <Text style={[formSt.cardSub, { color: txtSec }]}>Optional — helps organize learning</Text>
                </View>
              </View>
            </View>
            <View style={[formSt.divider, { backgroundColor: cardBorder }]} />

            <View style={formSt.typeGrid}>
              {GOAL_TYPES.map((t, i) => (
                <Pressable
                  key={i}
                  className={Platform.OS === "web" ? "sk-tip-hov" : undefined}
                  onPress={() => setSelectedType(selectedType === i ? null : i)}
                  style={({ pressed }) => [formSt.typeCard, {
                    backgroundColor: selectedType === i
                      ? t.color + "14"
                      : dark ? "rgba(255,255,255,0.04)" : "rgba(99,102,241,0.03)",
                    borderColor: selectedType === i ? t.color + "55" : cardBorder,
                    opacity: pressed ? 0.8 : 1,
                  },
                  Platform.OS === "web" ? { cursor: "pointer" } as any : {}]}
                >
                  <View style={[formSt.typeIconWrap, { backgroundColor: t.color + "14" }]}>
                    <Text style={{ fontSize: 20 }}>{t.icon}</Text>
                  </View>
                  <Text style={[formSt.typeLabel, { color: selectedType === i ? t.color : txtPri }]}>{t.label}</Text>
                  <Text style={[formSt.typeDesc, { color: txtSec }]}>{t.desc}</Text>
                  {selectedType === i && (
                    <View style={[formSt.typeCheck, { backgroundColor: t.color }]}>
                      <Text style={{ color: "white", fontSize: 10, fontWeight: "800" }}>✓</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* ── MAIN FORM CARD ── */}
          <Animated.View
            className={Platform.OS === "web" ? "sk-hov" : undefined}
            style={[
              formSt.card,
              { backgroundColor: card, borderColor: cardBorder, ...cardSh },
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Card header */}
            <View style={formSt.cardHdr}>
              <View style={formSt.cardHdrLeft}>
                <View style={[formSt.cardIconWrap, { backgroundColor: ACCENT + "14" }]}>
                  <Text style={{ fontSize: 18 }}>🎯</Text>
                </View>
                <View>
                  <Text style={[formSt.cardTitle, { color: txtPri }]}>Goal Details</Text>
                  <Text style={[formSt.cardSub, { color: txtSec }]}>Give your goal a clear, memorable name</Text>
                </View>
              </View>
              <View style={formSt.newBadge}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT,
                  ...(Platform.OS === "web" ? { animation: "sk-pulse 1.5s infinite" } as any : {}),
                }} />
                <Text style={[formSt.newBadgeTx, { color: ACCENT }]}>New Goal</Text>
              </View>
            </View>

            <View style={[formSt.divider, { backgroundColor: cardBorder }]} />
            <Text style={[formSt.fieldLabel, { color: txtSec }]}>Goal Name</Text>

            {/* Input */}
            <Animated.View style={[
              formSt.inputOuter,
              {
                backgroundColor: inputBg,
                borderColor: inputBorder,
                ...(Platform.OS === "web" && focused ? {
                  boxShadow: `0 0 0 3px ${ACCENT}22`,
                } : {}),
              } as any,
              { transform: [{ scale: inputScale }] },
            ]}>
              <Text style={[formSt.inputEmoji, { opacity: focused || hasText ? 1 : 0.45 }]}>🎯</Text>
              <TextInput
                style={[formSt.input, { color: txtPri },
                  Platform.OS === "web" ? { outline: "none" } as any : {},
                ]}
                placeholder="e.g. Master Flutter Development..."
                placeholderTextColor={txtMute}
                value={goal}
                onChangeText={t => t.length <= charMax && setGoal(t)}
                onFocus={onFocusInput}
                onBlur={onBlurInput}
                returnKeyType="done"
                onSubmitEditing={onPressBtn}
              />
              {hasText && (
                <Pressable onPress={() => setGoal("")} style={formSt.clearBtn}>
                  <Text style={{ color: txtMute, fontSize: 15 }}>✕</Text>
                </Pressable>
              )}
            </Animated.View>

            {/* Meta row + preview */}
            <View style={formSt.metaRow}>
              <Text style={[formSt.preview, { color: hasText ? txtSec : txtMute }]} numberOfLines={1}>
                {hasText ? `"${goal.trim()}"` : "Your goal will appear here..."}
              </Text>
              <Text style={[formSt.counter, { color: nearMax ? "#f97316" : txtMute }]}>
                {goal.length}/{charMax}
              </Text>
            </View>

            {/* Typing progress bar */}
            {Platform.OS === "web" && (
              <View style={{ height: 3, backgroundColor: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", borderRadius: 99, marginBottom: 20, overflow: "hidden" } as any}>
                <View style={{
                  height: "100%",
                  width: `${(goal.length / charMax) * 100}%`,
                  borderRadius: 99,
                  background: nearMax
                    ? "linear-gradient(90deg,#f97316,#ef4444)"
                    : `linear-gradient(90deg,${ACCENT},${ACCENT2})`,
                  transition: "width .3s, background .3s",
                } as any} />
              </View>
            )}

            {/* Preview pill when typing */}
            {hasText && (
              <View style={[formSt.previewPill, { backgroundColor: ACCENT + "0d", borderColor: ACCENT + "22" }]}>
                <Text style={{ fontSize: 14 }}>🎯</Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: ACCENT, flex: 1 }} numberOfLines={1}>
                  {goal.trim()}
                </Text>
                <View style={{ backgroundColor: ACCENT + "22", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 }}>
                  <Text style={{ fontSize: 10, color: ACCENT, fontWeight: "700" }}>Preview</Text>
                </View>
              </View>
            )}

            {/* Save button */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <Pressable
                onPress={onPressBtn}
                disabled={saving}
                style={({ pressed }) => [
                  formSt.saveBtn,
                  {
                    opacity: pressed ? 0.88 : 1,
                    ...(Platform.OS === "web" ? {
                      background: hasText
                        ? "linear-gradient(135deg,#6366f1,#a78bfa)"
                        : dark ? "rgba(99,102,241,0.22)" : "rgba(99,102,241,0.14)",
                      boxShadow: hasText ? "0 6px 22px rgba(99,102,241,0.42)" : "none",
                      cursor: hasText ? "pointer" : "not-allowed",
                      transition: "all .2s",
                    } as any : {
                      backgroundColor: hasText ? ACCENT : "rgba(99,102,241,0.25)",
                    }),
                  },
                ]}
              >
                <Text style={[formSt.saveTx, { opacity: hasText ? 1 : 0.5 }]}>
                  {saving ? "Creating..." : hasText ? "🎯  Create Goal" : "Enter a goal name"}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Cancel */}
            <Pressable onPress={() => router.back()} style={formSt.cancelBtn}>
              <Text style={[formSt.cancelTx, { color: txtMute }]}>Cancel</Text>
            </Pressable>
          </Animated.View>

          {/* ── SUGGESTIONS + TIPS (staggered) ── */}
          <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ translateY: slide2Anim }],
          }}>
            {/* Quick Ideas card */}
            <View
              className={Platform.OS === "web" ? "sk-hov" : undefined}
              style={[tipsSt.card, { backgroundColor: card, borderColor: cardBorder, ...cardSh }]}
            >
              <View style={tipsSt.hdr}>
                <View style={[tipsSt.hdrIcon, { backgroundColor: "#f9731614" }]}>
                  <Text style={{ fontSize: 16 }}>💡</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[tipsSt.title, { color: txtPri }]}>Quick Ideas</Text>
                  <Text style={{ fontSize: 12, color: txtSec, fontWeight: "500", marginTop: 1 }}>Popular goals — tap to use</Text>
                </View>
              </View>
              <View style={[tipsSt.suggestGrid]}>
                {SUGGESTIONS.map((s, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setGoal(s.label)}
                    onHoverIn={() => Platform.OS === "web" && setHoveredSug(i)}
                    onHoverOut={() => Platform.OS === "web" && setHoveredSug(null)}
                    style={({ pressed }) => [tipsSt.suggestChip, {
                      backgroundColor: goal === s.label
                        ? s.color + "14"
                        : pressed || hoveredSug === i
                          ? dark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)"
                          : dark ? "rgba(255,255,255,0.04)" : "rgba(99,102,241,0.05)",
                      borderColor: goal === s.label ? s.color + "55" : cardBorder,
                    },
                    Platform.OS === "web" ? { transition: "all .15s", cursor: "pointer" } as any : {}]}
                  >
                    <View style={[tipsSt.suggestIconWrap, { backgroundColor: s.color + "14" }]}>
                      <Text style={{ fontSize: 15 }}>{s.icon}</Text>
                    </View>
                    <Text style={[tipsSt.suggestTx, {
                      color: goal === s.label ? s.color : txtSec,
                      fontWeight: goal === s.label ? "700" : "500",
                    }]}>{s.label}</Text>
                    {goal === s.label && (
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: s.color }} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Tips card */}
            <View
              className={Platform.OS === "web" ? "sk-hov" : undefined}
              style={[tipsSt.card, { backgroundColor: card, borderColor: cardBorder, ...cardSh, marginTop: 12 }]}
            >
              <View style={tipsSt.hdr}>
                <View style={[tipsSt.hdrIcon, { backgroundColor: "#34d39914" }]}>
                  <Text style={{ fontSize: 16 }}>🌟</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[tipsSt.title, { color: txtPri }]}>What makes a great goal?</Text>
                  <Text style={{ fontSize: 12, color: txtSec, fontWeight: "500", marginTop: 1 }}>Tips for goals that stick</Text>
                </View>
              </View>
              <View style={tipsSt.tipsGrid}>
                {TIPS.map((tip, i) => (
                  <View
                    key={i}
                    className={Platform.OS === "web" ? "sk-tip-hov" : undefined}
                    style={[tipsSt.tipCard, {
                      backgroundColor: dark ? "rgba(99,102,241,0.07)" : "rgba(99,102,241,0.04)",
                      borderColor: ACCENT + "22",
                    }]}
                  >
                    <View style={[tipsSt.tipIcon, { backgroundColor: ACCENT + "14" }]}>
                      <Text style={{ fontSize: 16 }}>{tip.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[tipsSt.tipLabel, { color: txtPri }]}>{tip.label}</Text>
                      <Text style={[tipsSt.tipSub, { color: txtSec }]}>{tip.sub}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ════════════════════════════════
   STYLES
════════════════════════════════ */

/* Hero — full-bleed, matches add-task */
const heroSt = StyleSheet.create({
  wrap: {
    overflow: "hidden", position: "relative",
    paddingBottom: 36, marginBottom: 0,
  },
  orb: {
    position: "absolute", borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
  } as any,
  navRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 24, paddingTop: Platform.OS === "ios" ? 56 : 18,
    paddingBottom: 12, zIndex: 1,
  },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.22)",
    ...(Platform.OS === "web" ? { cursor: "pointer", transition: "background .15s" } as any : {}),
  },
  backTx:   { color: "white", fontWeight: "700", fontSize: 13 },
  navTitle: { color: "white", fontSize: 18, fontWeight: "900",
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
  },
  navSub:   { color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "500", marginTop: 2 },
  content:  { alignItems: "center", paddingHorizontal: 24, paddingTop: 12, zIndex: 1 },
  iconRing: {
    width: 90, height: 90, borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  iconInner: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  heroTitle: {
    color: "white", fontSize: 28, fontWeight: "900",
    letterSpacing: -0.6, marginBottom: 8, textAlign: "center",
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif", fontSize: "clamp(22px,3vw,32px)" } as any : {}),
  },
  heroSub: {
    color: "rgba(255,255,255,0.68)", fontSize: 14, fontWeight: "500",
    textAlign: "center", lineHeight: 21, marginBottom: 20, maxWidth: 400,
  },
  chipsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" } as any,
  chip: {
    backgroundColor: "rgba(255,255,255,0.13)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  chipTx: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "700" },
});

/* Content container */
const cSt = StyleSheet.create({
  container: { paddingHorizontal: 18, paddingTop: 20, width: "100%" },
  containerWide: {
    maxWidth: 760, width: "100%",
    ...(Platform.OS === "web" ? { alignSelf: "center" } as any : {}),
  },
});

/* Form cards */
const formSt = StyleSheet.create({
  card:        { borderRadius: 20, padding: 24, borderWidth: 1, marginBottom: 12 },
  cardHdr:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  cardHdrLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIconWrap:{ width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  cardTitle:   { fontSize: 17, fontWeight: "800", letterSpacing: -0.3,
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
  },
  cardSub:     { fontSize: 12, fontWeight: "500", marginTop: 1 },
  newBadge:    { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(99,102,241,0.1)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: "rgba(99,102,241,0.2)" },
  newBadgeTx:  { fontSize: 11, fontWeight: "700" },
  divider:     { height: 1, marginBottom: 18 },
  typeGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 10 } as any,
  typeCard:    { width: "48%", padding: 14, borderRadius: 16, borderWidth: 1, position: "relative" },
  typeIconWrap:{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  typeLabel:   { fontSize: 13, fontWeight: "700", marginBottom: 4,
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
  },
  typeDesc:    { fontSize: 11, fontWeight: "500", lineHeight: 16 },
  typeCheck:   { position: "absolute", top: 10, right: 10, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  fieldLabel:  { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" as const },
  inputOuter:  {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 4,
    marginBottom: 10, gap: 10,
    ...(Platform.OS === "web" ? { transition: "border-color .2s, box-shadow .2s" } as any : {}),
  },
  inputEmoji:  { fontSize: 17 },
  input: {
    flex: 1, fontSize: 15, fontWeight: "500", paddingVertical: 13,
  },
  clearBtn:    { padding: 5 },
  metaRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  preview:     { fontSize: 12, fontWeight: "500", flex: 1, marginRight: 8, fontStyle: "italic" },
  counter:     { fontSize: 11, fontWeight: "700" },
  previewPill: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  saveBtn: {
    paddingVertical: 16, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    marginBottom: 10,
    ...(Platform.OS === "web" ? { cursor: "pointer" } as any : {}),
  },
  saveTx:      { color: "white", fontWeight: "800", fontSize: 15, letterSpacing: 0.3,
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
  },
  cancelBtn:   { alignItems: "center", paddingVertical: 8 },
  cancelTx:    { fontSize: 13, fontWeight: "600" },
});

/* Tips / suggestions cards */
const tipsSt = StyleSheet.create({
  card:    { borderRadius: 20, padding: 20, borderWidth: 1 },
  hdr:     { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  hdrIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  title:   { fontSize: 15, fontWeight: "800",
    ...(Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}),
  },
  suggestGrid:     { flexDirection: "row", flexWrap: "wrap", gap: 8 } as any,
  suggestChip:     { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  suggestIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  suggestTx:       { fontSize: 13 },
  tipsGrid:  { flexDirection: "row", flexWrap: "wrap", gap: 10 } as any,
  tipCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, borderRadius: 14, borderWidth: 1,
    flex: 1, minWidth: 140,
    ...(Platform.OS === "web" ? { cursor: "default" } as any : {}),
  },
  tipIcon:  { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  tipLabel: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  tipSub:   { fontSize: 11, fontWeight: "500" },
});
