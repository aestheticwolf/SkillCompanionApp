import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Platform,
  Dimensions,
} from "react-native";

import { useRouter } from "expo-router";
import { useContext, useEffect, useRef, useState } from "react";
import { TaskContext } from "../src/context/TaskContext";
import { AuthContext } from "../src/context/AuthContext";
import { COLORS } from "../src/constants/theme";
import { loadTheme } from "../src/services/uiPreferences";

/* ─── accent palette (same as dashboard) ─── */
const GOAL_COLORS = [
  "#6366f1","#f97316","#06b6d4","#a78bfa",
  "#fbbf24","#34d399","#3b82f6","#ec4899",
];
const GOAL_EMOJIS = ["☕","🦋","⚛️","🔥","🎨","🚀","📚","🎯"];

/* ════════════════════════════════
   SHIMMER BAR (same as dashboard)
════════════════════════════════ */
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

/* ════════════════════════════════
   SVG DONUT CHART (web)
════════════════════════════════ */
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
    // Native fallback — simple concentric rings
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
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="13" />
        {/* Pending arc */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#f87171"
          strokeWidth="13"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        {/* Completed arc (animated) */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#34d399"
          strokeWidth="13"
          strokeDasharray={`${animDash} ${animGap}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        {/* Center text */}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="900" fill={color}>{Math.round(animPct)}%</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fontWeight="600" fill="rgba(100,116,139,0.9)">done</text>
      </svg>
    </View>
  );
}

/* ════════════════════════════════
   ANIMATED COUNT-UP NUMBER
════════════════════════════════ */
function CountUp({ to, color, size = 28 }: { to: number; color: string; size?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [val, setVal] = useState(0);
  useEffect(() => {
    anim.addListener(({ value }) => setVal(Math.round(value)));
    Animated.timing(anim, { toValue: to, duration: 900, useNativeDriver: false }).start();
    return () => anim.removeAllListeners();
  }, [to]);
  return <Text style={{ fontSize: size, fontWeight: "900", color, letterSpacing: -0.5 }}>{val}</Text>;
}

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

  /* Animations */
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

  /* ── Computed stats ── */
  const totalGoals     = goals.length;
  const totalTasks     = goals.reduce((a: number, g: any) => a + g.tasks.length, 0);
  const completedTasks = goals.reduce((a: number, g: any) => a + g.tasks.filter((t: any) => t.completed).length, 0);
  const pendingTasks   = totalTasks - completedTasks;
  const overallPct     = getOverallProgress();

  const getInsight = () => {
    if (overallPct === 100) return "Perfect score! 🏆 You've completed everything. Start a new challenge!";
    if (overallPct >= 75)  return "Excellent progress! 🚀 You're almost there — finish strong!";
    if (overallPct >= 50)  return "Nice momentum. 🔥 Keep pushing forward, you're halfway done!";
    if (overallPct >= 25)  return "Good start! 💪 Consistency is your superpower — keep going.";
    return "Let's get moving! 🌱 Every task completed is a step forward.";
  };

  /* ── Theme (same tokens as dashboard) ── */
  const dark           = !!darkMode;
  const bg             = dark ? "#020617" : "#F0F4FF";
  const card           = dark ? "#0d1424" : "#FFFFFF";
  const textPrimary    = dark ? "#FFFFFF"  : "#0F172A";
  const textSecondary  = dark ? "#CBD5F5"  : "#475569";
  const textMuted      = dark ? "rgba(238,242,255,0.35)" : "rgba(15,23,42,0.35)";
  const cardBorder     = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
  const hdrFrom        = dark ? "#0c1540" : "#1e3a8a";
  const hdrTo          = dark ? "#1e3580" : "#2563eb";

  const cardSh = Platform.OS === "web"
    ? { boxShadow: dark ? "0 4px 24px rgba(0,0,0,0.42)" : "0 4px 20px rgba(99,102,241,0.09)" }
    : { elevation: 4 };

  const isWide = Platform.OS === "web" && Dimensions.get("window").width > 700;

  const STATS = [
    { icon: "🎯", val: totalGoals,     lbl: "Goals",      color: "#6366f1", bg: "rgba(99,102,241,0.1)"  },
    { icon: "📋", val: totalTasks,     lbl: "Tasks",      color: "#06b6d4", bg: "rgba(6,182,212,0.1)"   },
    { icon: "✅", val: completedTasks, lbl: "Completed",  color: "#34d399", bg: "rgba(52,211,153,0.1)"  },
    { icon: "⏳", val: pendingTasks,   lbl: "Pending",    color: "#f97316", bg: "rgba(249,115,22,0.1)"  },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>

      <View style={styles.wrapper}>

        {/* ════ HEADER ════ */}
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
          {/* Gradient */}
          {Platform.OS === "web" && (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, {
              borderRadius: 20,
              background: dark
                ? "linear-gradient(135deg,#020617 0%,#0f2060 60%,#1a1060 100%)"
                : "linear-gradient(135deg,#1e3a8a 0%,#2563eb 58%,#6d28d9 100%)",
            } as any]} />
          )}

          {/* Orbs */}
          <View pointerEvents="none" style={[styles.orb, styles.orb1]} />
          <View pointerEvents="none" style={[styles.orb, styles.orb2]} />

          {/* Nav row */}
          <View style={styles.hdrTop}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.backTx}>← Back</Text>
            </Pressable>
            <View>
              <Text style={styles.hdrTitle}>Analytics</Text>
              <Text style={styles.hdrSub}>Your learning overview</Text>
            </View>
            <View style={{ width: 68 }} />
          </View>

          {/* Summary row inside header */}
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

          {/* Overall progress bar in header */}
          <View style={{ marginTop: 14 }}>
            <View style={styles.hdrProgRow}>
              <Text style={styles.hdrProgLbl}>Overall Progress</Text>
              <Text style={styles.hdrProgPct}>{overallPct}%</Text>
            </View>
            <ShimmerBar pct={overallPct} color="rgba(255,255,255,0.9)" h={8} />
          </View>
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* ════ STAT CARDS (2×2) ════ */}
          <Animated.View
            style={[styles.statsGrid, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            {STATS.map((s, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.statCard,
                  { backgroundColor: card, borderColor: cardBorder, ...cardSh },
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(i * 7)) }],
                  },
                ]}
              >
                <View style={[styles.statIconWrap, { backgroundColor: s.bg }]}>
                  <Text style={{ fontSize: 22 }}>{s.icon}</Text>
                </View>
                <CountUp to={s.val} color={s.color} size={30} />
                <Text style={[styles.statLbl, { color: textSecondary }]}>{s.lbl}</Text>
              </Animated.View>
            ))}
          </Animated.View>

          {/* ════ DONUT + INSIGHT ROW ════ */}
          <View style={isWide ? styles.midRowWide : styles.midRowNarrow}>

            {/* Task Distribution */}
            <Animated.View
              style={[
                styles.card,
                isWide ? styles.cardHalf : styles.cardFull,
                { backgroundColor: card, borderColor: cardBorder, ...cardSh },
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View style={styles.cardHdr}>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>Task Distribution</Text>
                <View style={[styles.cardBadge, { backgroundColor: "rgba(99,102,241,0.1)" }]}>
                  <Text style={{ fontSize: 10, color: "#6366f1", fontWeight: "700" }}>
                    {totalTasks} total
                  </Text>
                </View>
              </View>

              <View style={styles.donutRow}>
                <DonutChart completed={completedTasks} total={totalTasks} color={dark ? "#fff" : "#0f172a"} />

                {/* Legend */}
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
              style={[
                styles.card,
                isWide ? styles.cardHalf : styles.cardFull,
                {
                  backgroundColor: dark ? "rgba(99,102,241,0.08)" : "#EFF6FF",
                  borderColor: dark ? "rgba(99,102,241,0.22)" : "rgba(37,99,235,0.12)",
                  borderLeftColor: "#6366f1",
                  borderLeftWidth: 4,
                  ...cardSh,
                },
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View style={styles.cardHdr}>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>💡 Insight</Text>
              </View>
              <Text style={[styles.insightTx, { color: textSecondary }]}>{getInsight()}</Text>

              {/* Mini score bars */}
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
                  <Text style={[styles.scoreVal, { color: "#f97316" }]}>7 days 🔥</Text>
                </View>
                <ShimmerBar pct={70} color="#f97316" h={6} />
              </View>
            </Animated.View>
          </View>

          {/* ════ PER-GOAL BREAKDOWN ════ */}
          {goals.length > 0 && (
            <Animated.View
              style={[
                styles.card, styles.cardFull,
                { backgroundColor: card, borderColor: cardBorder, ...cardSh },
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View style={[styles.cardHdr, { marginBottom: 16 }]}>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>Goal Breakdown</Text>
                <View style={[styles.cardBadge, { backgroundColor: "rgba(52,211,153,0.1)" }]}>
                  <Text style={{ fontSize: 10, color: "#34d399", fontWeight: "700" }}>{totalGoals} active</Text>
                </View>
              </View>

              {goals.map((g: any, i: number) => {
                const accent    = GOAL_COLORS[i % GOAL_COLORS.length];
                const done      = g.tasks.filter((t: any) => t.completed).length;
                const total     = g.tasks.length;
                const pct       = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <Animated.View
                    key={g.id}
                    style={[
                      styles.goalRow,
                      { borderColor: cardBorder },
                      { opacity: fadeAnim, transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(i * 6)) }] },
                    ]}
                  >
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
            <Animated.View
              style={[
                styles.card, styles.cardFull,
                { backgroundColor: card, borderColor: cardBorder, alignItems: "center", ...cardSh },
                { opacity: fadeAnim },
              ]}
            >
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
}

/* ════════════════════════════════
   STYLES
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
    borderRadius: 20, paddingHorizontal: 18,
    paddingTop: 14, paddingBottom: 18,
    marginBottom: 14, overflow: "hidden", position: "relative",
  },
  orb:  { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)" } as any,
  orb1: { width: 200, height: 200, top: -70, right: -50 },
  orb2: { width: 110, height: 110, bottom: -40, right: 120 },

  hdrTop:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18, zIndex: 1 },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 13, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  backTx:    { color: "white", fontWeight: "700", fontSize: 13 },
  hdrTitle:  { color: "white", fontSize: 20, fontWeight: "900", textAlign: "center", letterSpacing: -0.4 },
  hdrSub:    { color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "500", textAlign: "center" },

  hdrSummary: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", zIndex: 1 },
  hdrStat:    { alignItems: "center" },
  hdrStatVal: { color: "white", fontSize: 22, fontWeight: "900" },
  hdrStatLbl: { color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: "500", marginTop: 2 },
  hdrDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.2)" },

  hdrProgRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  hdrProgLbl: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "600" },
  hdrProgPct: { color: "white", fontSize: 12, fontWeight: "800" },

  /* Stat cards 2×2 */
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 0, marginBottom: 12 } as any,
  statCard: {
    width: "48.5%",
    marginHorizontal: "0.75%",
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    alignItems: "center",
    gap: 8,
  },
  statIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  statLbl:      { fontSize: 12, fontWeight: "600" },

  /* Layout rows */
  midRowWide:   { flexDirection: "row", gap: 14, marginBottom: 12 } as any,
  midRowNarrow: { flexDirection: "column", marginBottom: 0 },

  /* Generic card */
  card: {
    borderRadius: 18, padding: 18, borderWidth: 1, marginBottom: 12,
  },
  cardFull: { width: "100%" },
  cardHalf: { flex: 1 },
  cardHdr:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  cardTitle:{ fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  cardBadge:{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },

  /* Donut */
  donutRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  legend:     { gap: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  legendDot:  { width: 11, height: 11, borderRadius: 6 },
  legendVal:  { fontSize: 16, fontWeight: "900" },
  legendLbl:  { fontSize: 11, fontWeight: "500" },

  /* Insight */
  insightTx: { fontSize: 14, fontWeight: "500", lineHeight: 22 },
  scoreBars: { marginTop: 16, gap: 0 },
  scoreRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  scoreLbl:  { fontSize: 12, fontWeight: "500" },
  scoreVal:  { fontSize: 12, fontWeight: "800" },

  /* Goal breakdown */
  goalRow: {
    flexDirection: "row", alignItems: "center",
    gap: 12, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  goalEmoji:  { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  goalRowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goalName:   { fontSize: 14, fontWeight: "700", flex: 1 },
  goalPct:    { fontSize: 13, fontWeight: "800" },
  goalMeta:   { fontSize: 11, fontWeight: "500" },
});
