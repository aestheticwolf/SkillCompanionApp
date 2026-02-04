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
        colors={["#2563EB", "#60A5FA"]}
        style={styles.container}
      >
        {loading && <Loader />}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>🚀</Text>

          <Text style={styles.appName}>Skill Companion</Text>

          <Text style={styles.subtitle}>
            Login to continue learning
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Login</Text>

          <TextInput
            style={styles.input}
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Pressable
            style={styles.btn}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },

  header: {
    alignItems: "center",
    marginBottom: 25,
  },

  icon: {
    fontSize: 60,
    marginBottom: 8,
  },

  appName: {
    fontSize: 32,
    fontWeight: "800",
    color: "white",
  },

  subtitle: {
    marginTop: 4,
    color: "#E0F2FE",
  },

  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: COLORS.secondary,
  },

  input: {
    backgroundColor: "#F8FAFC",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 15,
    fontSize: 15,
  },

  btn: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 5,
  },

  btnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  link: {
    textAlign: "center",
    marginTop: 20,
    color: COLORS.primary,
    fontWeight: "600",
  },
});
