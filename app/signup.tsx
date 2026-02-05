import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import { useState } from "react";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";

import Loader from "@/src/components/Loader";
import { COLORS } from "@/src/constants/theme";
import { auth } from "@/src/services/firebase";

import { showError, showSuccess } from "../src/services/toast";

import { updateProfile } from "firebase/auth";


export default function Signup() {
  const router = useRouter();

 const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      showError("Please fill all fields");
      return;
    }

    if (password.length < 6) {
      showError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const res = await createUserWithEmailAndPassword(
  auth,
  email,
  password
);

await updateProfile(res.user, {
  displayName: name,
});
      showSuccess("Account created!");
      router.replace("/dashboard");
    } catch (e: any) {
      showError(e.message);
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
            <Text style={styles.icon}>✨</Text>
          </View>

          <Text style={styles.appName}>Skill Companion</Text>

          <Text style={styles.subtitle}>
            Start your learning journey
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>

          <View style={styles.divider} />


    <TextInput
  style={styles.input}
  placeholder="Full Name"
  value={name}
  onChangeText={setName}
/>


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
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? "Creating..." : "Sign Up"}
            </Text>
          </Pressable>

          <Pressable onPress={() => router.push("/login")}>
            <Text style={styles.link}>
              Already have an account? Login
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
