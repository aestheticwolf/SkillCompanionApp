import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
} from "react-native";

import { useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";

import { TaskContext } from "../src/context/TaskContext";
import { COLORS } from "../src/constants/theme";
import { loadTheme } from "../src/services/uiPreferences";

export default function Analytics() {
  const router = useRouter();
  const ctx = useContext(TaskContext);
  if (!ctx) return null;

  const { getStats } = ctx;
  const stats = getStats();

  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    loadTheme().then(setDarkMode);
  }, []);

  const percent =
    stats.totalTasks === 0
      ? 0
      : Math.round(
          (stats.completedTasks / stats.totalTasks) * 100
        );

  /* Animation */
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: percent,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percent]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  /* Theme colors */
  const bg = darkMode ? "#020617" : "#F8FAFC";
  const card = darkMode ? "#020617" : "#FFFFFF";
  const textPrimary = darkMode ? "#FFFFFF" : "#0F172A";
  const textSecondary = darkMode ? "#CBD5F5" : "#475569";
  const border = darkMode ? "#1E293B" : "#E5E7EB";

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]}>
  <View style={styles.wrapper}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border }]}>
  <Pressable
  onPress={() => router.back()}
  style={({ pressed }) => [
    styles.backBtn,
    {
      backgroundColor: darkMode ? "#1E293B" : "#E5E7EB",
      opacity: pressed ? 0.7 : 1,
    },
  ]}
>
  <Text
    style={[
      styles.backIcon,
      { color: darkMode ? "#E5E7EB" : COLORS.primary },
    ]}
  >
    ←
  </Text>
</Pressable>

        <Text style={[styles.title, { color: textPrimary }]}>
          Analytics
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {/* Stats Grid */}
      <View style={styles.grid}>

        <View style={[styles.statCard, { backgroundColor: card }]}>
          <Text style={styles.statValue}>{stats.totalGoals}</Text>
          <Text style={[styles.statLabel, { color: textSecondary }]}>
            Goals
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: card }]}>
          <Text style={styles.statValue}>{stats.totalTasks}</Text>
          <Text style={[styles.statLabel, { color: textSecondary }]}>
            Tasks
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: card }]}>
          <Text style={styles.statValue}>{stats.completedTasks}</Text>
          <Text style={[styles.statLabel, { color: textSecondary }]}>
            Completed
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: card }]}>
          <Text style={styles.statValue}>{stats.pendingTasks}</Text>
          <Text style={[styles.statLabel, { color: textSecondary }]}>
            Pending
          </Text>
        </View>

      </View>

      {/* Progress */}
      <View style={[styles.card, { backgroundColor: card }]}>
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>
          Overall Progress
        </Text>

        <View style={styles.progressBg}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: progressWidth },
            ]}
          />
        </View>

        <Text style={[styles.progressText, { color: textSecondary }]}>
          {percent}% completed
        </Text>
      </View>

      {/* Insight */}
      <View style={[styles.card, { backgroundColor: card }]}>
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>
          Insight
        </Text>

        <Text style={[styles.insightText, { color: textSecondary }]}>
          {percent === 0 &&
            "Start small. One task today makes progress real."}

          {percent > 0 && percent < 40 &&
            "Good start. Consistency matters more than speed."}

          {percent >= 40 && percent < 70 &&
            "Nice momentum. Keep pushing forward."}

          {percent >= 70 && percent < 100 &&
            "Strong discipline. Finish what you started."}

          {percent === 100 &&
            "Excellent work. Time to level up 🚀"}
        </Text>
      </View>

      </View>
    </ScrollView>
  );
}

/* Styles */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

header: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingBottom: 14,
  marginBottom: 24,
  borderBottomWidth: 1,
},

  back: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.primary,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },

statCard: {
  width: "48%",
  paddingVertical: 18,
  paddingHorizontal: 12,
  borderRadius: 16,
  alignItems: "center",
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 6,
  elevation: 2,
},

 statValue: {
  fontSize: 24,
  fontWeight: "800",
  color: COLORS.primary,
},

  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },

  card: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },

  progressBg: {
    height: 12,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },

  progressText: {
    marginTop: 8,
    fontSize: 13,
  },

  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },

wrapper: {
  width: "100%",
  maxWidth: 900,
  alignSelf: "center",
  padding: 16,
},

backBtn: {
  width: 40,
  height: 40,
  borderRadius: 20,
  justifyContent: "center",
  alignItems: "center",
},

backIcon: {
  fontSize: 18,
  fontWeight: "700",
  color: COLORS.primary,
},


  
});
