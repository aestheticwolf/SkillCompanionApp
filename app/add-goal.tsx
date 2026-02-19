import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Animated,
} from "react-native";

import { useState, useContext, useEffect, useRef } from "react";
import { useRouter } from "expo-router";

import { TaskContext } from "../src/context/TaskContext";
import { COLORS } from "../src/constants/theme";
import { loadTheme } from "../src/services/uiPreferences";
import { showSuccess, showError } from "../src/services/toast";

export default function AddGoal() {
  const router = useRouter();
  const ctx = useContext(TaskContext);
  if (!ctx) return null;

  const { addGoal } = ctx;

  const [goal, setGoal] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  /* Animation */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
const inputFocusAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  loadTheme().then(setDarkMode);

  Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }),
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 450,
      useNativeDriver: true,
    }),
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }),
  ]).start();
}, []);

const handleSave = async () => {
  if (!goal.trim()) {
    showError("Goal name cannot be empty");
    return;
  }

  try {
    await addGoal(goal.trim());
    showSuccess("Goal added");
    router.back();
  } catch {
    showError("Something went wrong");
  }
};

  /* Theme colors */
  const bg = darkMode ? "#020617" : "#F8FAFC";
  const card = darkMode ? "#020617" : "#FFFFFF";
  const textPrimary = darkMode ? "#FFFFFF" : "#0F172A";
  const textSecondary = darkMode ? "#CBD5F5" : "#475569";
  const border = darkMode ? "#1E293B" : "#E5E7EB";

  return (
    <ScrollView
  style={[styles.container, { backgroundColor: bg }]}
  keyboardShouldPersistTaps="handled"
>
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
            Add Goal
          </Text>

          <View style={{ width: 40 }} />
        </View>

        {/* Card */}
    <Animated.View
  style={[
    styles.card,
    {
      backgroundColor: card,
      borderColor: darkMode
        ? "rgba(255,255,255,0.08)"
        : "rgba(0,0,0,0.06)",
      opacity: fadeAnim,
      transform: [
        { translateY: slideAnim },
        { scale: scaleAnim },
      ],
    },
  ]}
>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>
            Add Learning Goal
          </Text>

          <Text style={[styles.subtitle, { color: textSecondary }]}>
            Define what you want to achieve next
          </Text>

         <Animated.View
  style={{
    borderRadius: 12,
    borderWidth: 1,
    borderColor: inputFocusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [border, COLORS.primary],
    }),
    marginBottom: 18,
  }}
>
  <TextInput
    value={goal}
    onChangeText={setGoal}
    placeholder="e.g. Learn Java"
    placeholderTextColor={textSecondary}
    onFocus={() =>
      Animated.timing(inputFocusAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start()
    }
    onBlur={() =>
      Animated.timing(inputFocusAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start()
    }
    style={[
      styles.input,
      { color: textPrimary },
    ]}
  />
</Animated.View>

<Pressable
  onPress={handleSave}
  disabled={!goal.trim()}
  android_ripple={{ color: "rgba(255,255,255,0.2)" }}
  style={({ pressed }) => [
    styles.btn,
    {
      backgroundColor: goal.trim()
        ? COLORS.primary
        : darkMode
        ? "#334155"
        : "#CBD5E1",
      opacity: pressed ? 0.9 : 1,
      transform: [{ scale: pressed ? 0.97 : 1 }],
      shadowOpacity: goal.trim() ? 0.25 : 0,
    },
  ]}
>
  <Text style={styles.btnText}>Save Goal</Text>
</Pressable>
        </Animated.View>

      </View>
    </ScrollView>
  );
}

/* Styles */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  wrapper: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    padding: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    marginBottom: 24,
    borderBottomWidth: 1,
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
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
  },

card: {
  padding: 24,
  borderRadius: 20,
  borderWidth: 1,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 6,
},

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 13,
    marginBottom: 20,
  },

input: {
  paddingVertical: 14,
  paddingHorizontal: 16,
  fontSize: 15,
  borderRadius: 12,
},

btn: {
  paddingVertical: 16,
  borderRadius: 16,
  alignItems: "center",
  shadowColor: COLORS.primary,
  shadowOffset: { width: 0, height: 8 },
  shadowRadius: 16,
  elevation: 5,
},

  btnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },

//   subtitle: {
//   fontSize: 13,
//   marginBottom: 22,
//   lineHeight: 18,
// },
});
