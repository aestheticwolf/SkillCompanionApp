import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from "react-native";

import { useContext } from "react";
import { useRouter } from "expo-router";

import { AuthContext } from "../src/context/AuthContext";
import { COLORS } from "../src/constants/theme";

import {
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

import { auth } from "../src/services/firebase";

export default function Profile() {
  const router = useRouter();
  const authCtx = useContext(AuthContext);

  const user = authCtx?.user;

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Reset password
  const resetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email!);

      Alert.alert("Success", "Reset link sent");
    } catch {
      Alert.alert("Error", "Try again later");
    }
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  return (
    <View style={styles.container}>

      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user.email?.[0].toUpperCase()}
        </Text>
      </View>

      {/* Email */}
      <Text style={styles.email}>
        {user.email}
      </Text>

      {/* Buttons */}
      <Pressable style={styles.btn} onPress={resetPassword}>
        <Text style={styles.btnText}>Reset Password</Text>
      </Pressable>

      <Pressable
        style={[styles.btn, styles.logout]}
        onPress={logout}
      >
        <Text style={styles.btnText}>Logout</Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  avatar: {
    backgroundColor: COLORS.primary,
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  avatarText: {
    color: "white",
    fontSize: 36,
    fontWeight: "800",
  },

  email: {
    fontSize: 16,
    marginBottom: 30,
    color: COLORS.secondary,
  },

  btn: {
    width: "100%",
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },

  logout: {
    backgroundColor: "#DC2626",
  },

  btnText: {
    color: "white",
    fontWeight: "600",
  },
});
