import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { useState } from "react";
import { useRouter } from "expo-router";

import { signInWithEmailAndPassword } from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";

import { auth } from "@/src/services/firebase";
import Loader from "@/src/components/Loader";
import { COLORS } from "@/src/constants/theme";

import { showSuccess, showError } from "../src/services/toast";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      showError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(auth, email, password);

      showSuccess("Welcome back!");
      router.replace("/dashboard");
    } catch {
      showError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={["#1E3A8A", "#3B82F6", "#60A5FA"]}
        style={styles.container}
      >
        {loading && <Loader />}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.icon}>🚀</Text>
          </View>

          <Text style={styles.appName}>Skill Companion</Text>

          <Text style={styles.subtitle}>
            Grow your skills every day
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Sign In</Text>

          <View style={styles.divider} />

          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Pressable
            style={({ pressed }) => [
              styles.btn,
              pressed && { opacity: 0.8 },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? "Signing in..." : "Login"}
            </Text>
          </Pressable>

          <Pressable onPress={() => router.push("/signup")}>
            <Text style={styles.link}>
              Don’t have an account? Sign up
            </Text>
          </Pressable>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

/* Styles */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 22,
  },

  /* Header */

  header: {
    alignItems: "center",
    marginBottom: 35,
  },

  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  icon: {
    fontSize: 36,
  },

  appName: {
    fontSize: 32,
    fontWeight: "900",
    color: "white",
    letterSpacing: 0.5,
  },

  subtitle: {
    marginTop: 4,
    color: "#DBEAFE",
    fontSize: 14,
  },

  /* Card */

  card: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 26,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    color: COLORS.secondary,
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 18,
  },

  input: {
    backgroundColor: "#F8FAFC",
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginBottom: 15,
    fontSize: 15,
    color: COLORS.text,
  },

  btn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },

  btnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.4,
  },

  link: {
    textAlign: "center",
    marginTop: 22,
    color: COLORS.primary,
    fontWeight: "600",
  },
});
