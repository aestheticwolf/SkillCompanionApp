import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";

import { useState } from "react";
import { useRouter } from "expo-router";

import {
  createUserWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "@/src/services/firebase";
import { COLORS } from "../src/constants/theme";

export default function Signup() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");

  const handleSignup = async () => {
    if (!email || !password) {
      alert("Fill all fields");
      return;
    }

    try {
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      alert("Account created");
      router.replace("/dashboard");
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Create Account
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
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
        onPress={handleSignup}
      >
        <Text style={styles.btnText}>
          Sign Up
        </Text>
      </Pressable>

      <Pressable
        onPress={() =>
          router.push("/login")
        }
      >
        <Text style={styles.link}>
          Already have account? Login
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    justifyContent: "center",
  },

  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 20,
  },

  input: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 15,
  },

  btn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  btnText: {
    color: "white",
    fontWeight: "600",
  },

  link: {
    textAlign: "center",
    marginTop: 15,
    color: COLORS.primary,
  },
});
