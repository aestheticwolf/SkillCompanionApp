import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/src/services/firebase";
import Loader from "@/src/components/Loader";
import { showSuccess, showError } from "../src/services/toast";

/* ════ WEB CSS — same as login & dashboard ════ */
if (Platform.OS === "web" && typeof document !== "undefined") {
  const id = "sk-signup-css";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@700;800;900&display=swap');
      @keyframes sk-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
      @keyframes sk-pulse{0%,100%{opacity:1}50%{opacity:.3}}
      @keyframes sk-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
      @keyframes sk-glow{0%,100%{box-shadow:0 0 20px rgba(99,102,241,.4)}50%{box-shadow:0 0 50px rgba(99,102,241,.8),0 0 80px rgba(167,139,250,.4)}}
      @keyframes sk-particle{0%{transform:translateY(0) scale(1);opacity:.8}100%{transform:translateY(-80px) scale(0);opacity:0}}
      @keyframes sk-card-in{from{opacity:0;transform:translateY(32px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
      input{font-family:'Plus Jakarta Sans',sans-serif!important;}
      input:focus{outline:none!important;}
      *{box-sizing:border-box;}
      html,body,#root{height:100%;overflow:hidden;}
      ::-webkit-scrollbar{display:none;}
    `;
    document.head.appendChild(s);
  }
}

const ACCENT = "#6366f1";

/* ════ PARTICLES ════ */
function Particles() {
  const [pts, setPts] = useState<{id:number;x:number;size:number}[]>([]);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const id = setInterval(() => {
      setPts(p => [...p.slice(-18), { id: Date.now(), x: Math.random() * 95 + 2, size: Math.random() * 4 + 2 }]);
    }, 400);
    return () => clearInterval(id);
  }, []);
  if (Platform.OS !== "web") return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}>
      {pts.map(p => (
        <View key={p.id} style={{
          position: "absolute", bottom: 0, left: `${p.x}%` as any,
          width: p.size, height: p.size, borderRadius: p.size / 2,
          backgroundColor: "rgba(255,255,255,0.45)",
          animation: "sk-particle 2s ease-out forwards",
        } as any} />
      ))}
    </View>
  );
}

/* ════ MAIN SIGNUP ════ */
export default function Signup() {
  const router = useRouter();

  /* ── State — original unchanged ── */
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [focusedField, setFocusedField] = useState<"name"|"email"|"password"|null>(null);

  /* ── Animations ── */
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(40)).current;
  const logoScale  = useRef(new Animated.Value(0.7)).current;
  const btnScale   = useRef(new Animated.Value(1)).current;
  const nameScale  = useRef(new Animated.Value(1)).current;
  const emailScale = useRef(new Animated.Value(1)).current;
  const pwScale    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 55, friction: 10 }),
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 65, friction: 7, delay: 150 }),
    ]).start();
  }, []);

  /* ── Handler — 100% original logic unchanged ── */
  const handleSignup = async () => {
    if (!email || !password) {
      showError("Please fill all fields");
      return;
    }
    if (password.length < 6) {
      showError("Password must be at least 6 characters");
      return;
    }
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true, tension: 200, friction: 5 }),
      Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 5 }),
    ]).start();
    try {
      setLoading(true);
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(res.user, { displayName: name });
      showSuccess("Account created!");
      router.replace("/dashboard");
    } catch (e: any) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onFocus = (field: "name"|"email"|"password", scaleRef: Animated.Value) => {
    setFocusedField(field);
    Animated.spring(scaleRef, { toValue: 1.01, useNativeDriver: true, tension: 150, friction: 8 }).start();
  };
  const onBlur = (scaleRef: Animated.Value) => {
    setFocusedField(null);
    Animated.spring(scaleRef, { toValue: 1, useNativeDriver: true, tension: 150, friction: 8 }).start();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Full-screen gradient bg — identical to login */}
      <View style={styles.bg}>
        {Platform.OS === "web" && (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, {
            background: "linear-gradient(135deg,#1e1b4b 0%,#3730a3 30%,#6d28d9 65%,#9333ea 100%)",
          } as any]} />
        )}
        {Platform.OS !== "web" && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#3730a3" }]} />
        )}

        {/* Floating orbs */}
        <View pointerEvents="none" style={[styles.orb, { width: 500, height: 500, top: -200, right: -200, opacity: 0.18 },
          Platform.OS === "web" ? { animation: "sk-float 6s ease-in-out infinite" } as any : {}]} />
        <View pointerEvents="none" style={[styles.orb, { width: 300, height: 300, bottom: -100, left: -100, opacity: 0.12 },
          Platform.OS === "web" ? { animation: "sk-float 8s ease-in-out infinite reverse" } as any : {}]} />
        <View pointerEvents="none" style={[styles.orb, { width: 180, height: 180, top: "25%" as any, left: "5%", opacity: 0.1 },
          Platform.OS === "web" ? { animation: "sk-float 5s ease-in-out infinite" } as any : {}]} />
        <View pointerEvents="none" style={[styles.orb, { width: 120, height: 120, top: "15%", right: "8%" as any, opacity: 0.09 },
          Platform.OS === "web" ? { animation: "sk-float 7s ease-in-out infinite reverse" } as any : {}]} />

        <Particles />
        {loading && <Loader />}

        {/* Content */}
        <View style={styles.content}>

          {/* ── LOGO + HEADER ── */}
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
            <View style={[styles.logoGlow,
              Platform.OS === "web" ? { animation: "sk-glow 3s ease-in-out infinite" } as any : {}]}>
              <View style={styles.logoRing}>
                <View style={[styles.logoCircle,
                  Platform.OS === "web" ? { background: "linear-gradient(135deg,#6366f1,#a78bfa)", animation: "sk-breathe 3s ease-in-out infinite" } as any : {}]}>
                  <Text style={{ fontSize: 32 }}>✨</Text>
                </View>
              </View>
            </View>
            <Text style={[styles.appName,
              Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}]}>
              SkillPath
            </Text>
            <Text style={styles.tagline}>Start your learning journey</Text>
            <View style={styles.pillsRow}>
              {["🚀 Get Started", "🎯 Set Goals", "🔥 Build Streaks"].map((p, i) => (
                <View key={i} style={styles.pill}>
                  <Text style={styles.pillTx}>{p}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── SIGNUP CARD ── */}
          <Animated.View
            style={[
              styles.card,
              Platform.OS === "web" ? { animation: "sk-card-in .55s cubic-bezier(.34,1.56,.64,1) .2s both" } as any : {},
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Card header */}
            <View style={styles.cardHdr}>
              <Text style={[styles.cardTitle,
                Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}]}>
                Create Account
              </Text>
              <Text style={styles.cardSub}>Join thousands of learners today 🌟</Text>
            </View>
            <View style={styles.divider} />

            {/* Full Name input */}
            <Animated.View style={{ transform: [{ scale: nameScale }] }}>
              <View style={[styles.inputWrap,
                focusedField === "name" && styles.inputWrapFocused,
                Platform.OS === "web" && focusedField === "name"
                  ? { boxShadow: `0 0 0 3px ${ACCENT}22`, transition: "box-shadow .2s,border-color .2s" } as any : {},
              ]}>
                <Text style={[styles.inputIcon, { opacity: focusedField === "name" || name ? 1 : 0.45 }]}>👤</Text>
                <TextInput
                  style={[styles.input,
                    Platform.OS === "web" ? { outline: "none", fontFamily: "Plus Jakarta Sans,sans-serif" } as any : {},
                  ]}
                  placeholder="Full Name"
                  placeholderTextColor="rgba(99,102,241,0.4)"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => onFocus("name", nameScale)}
                  onBlur={() => onBlur(nameScale)}
                />
              </View>
            </Animated.View>

            {/* Email input */}
            <Animated.View style={{ transform: [{ scale: emailScale }] }}>
              <View style={[styles.inputWrap,
                focusedField === "email" && styles.inputWrapFocused,
                Platform.OS === "web" && focusedField === "email"
                  ? { boxShadow: `0 0 0 3px ${ACCENT}22`, transition: "box-shadow .2s,border-color .2s" } as any : {},
              ]}>
                <Text style={[styles.inputIcon, { opacity: focusedField === "email" || email ? 1 : 0.45 }]}>✉️</Text>
                <TextInput
                  style={[styles.input,
                    Platform.OS === "web" ? { outline: "none", fontFamily: "Plus Jakarta Sans,sans-serif" } as any : {},
                  ]}
                  placeholder="Email address"
                  placeholderTextColor="rgba(99,102,241,0.4)"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onFocus={() => onFocus("email", emailScale)}
                  onBlur={() => onBlur(emailScale)}
                />
              </View>
            </Animated.View>

            {/* Password input */}
            <Animated.View style={{ transform: [{ scale: pwScale }] }}>
              <View style={[styles.inputWrap,
                focusedField === "password" && styles.inputWrapFocused,
                Platform.OS === "web" && focusedField === "password"
                  ? { boxShadow: `0 0 0 3px ${ACCENT}22`, transition: "box-shadow .2s,border-color .2s" } as any : {},
              ]}>
                <Text style={[styles.inputIcon, { opacity: focusedField === "password" || password ? 1 : 0.45 }]}>🔒</Text>
                <TextInput
                  style={[styles.input,
                    Platform.OS === "web" ? { outline: "none", fontFamily: "Plus Jakarta Sans,sans-serif" } as any : {},
                  ]}
                  placeholder="Password (min. 6 characters)"
                  placeholderTextColor="rgba(99,102,241,0.4)"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => onFocus("password", pwScale)}
                  onBlur={() => onBlur(pwScale)}
                  onSubmitEditing={handleSignup}
                />
              </View>
            </Animated.View>

            {/* Password strength hint */}
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                {[1,2,3,4].map(i => (
                  <View key={i} style={[styles.strengthBar, {
                    backgroundColor: password.length >= i * 2
                      ? (password.length >= 8 ? "#34d399" : password.length >= 6 ? ACCENT : "#f97316")
                      : "rgba(0,0,0,0.08)",
                  }]} />
                ))}
                <Text style={[styles.strengthTx, {
                  color: password.length >= 8 ? "#34d399" : password.length >= 6 ? ACCENT : "#f97316",
                }]}>
                  {password.length >= 8 ? "Strong" : password.length >= 6 ? "Good" : "Weak"}
                </Text>
              </View>
            )}

            {/* Sign Up button */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  pressed && { opacity: 0.88 },
                  Platform.OS === "web" ? {
                    background: loading
                      ? "rgba(99,102,241,0.5)"
                      : "linear-gradient(135deg,#6366f1,#a78bfa)",
                    boxShadow: loading ? "none" : "0 8px 24px rgba(99,102,241,0.45)",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all .2s",
                  } as any : {
                    backgroundColor: loading ? "rgba(99,102,241,0.5)" : ACCENT,
                  },
                ]}
                onPress={handleSignup}
                disabled={loading}
              >
                <Text style={[styles.btnText,
                  Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}]}>
                  {loading ? "Creating account..." : "Create Account →"}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Login link */}
            <Pressable onPress={() => router.push("/login")}
              style={({ pressed }) => [styles.linkWrap, pressed && { opacity: 0.7 }]}>
              <Text style={styles.linkTx}>
                Already have an account?{" "}
                <Text style={[styles.linkAccent,
                  Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}]}>
                  Sign in
                </Text>
              </Text>
            </Pressable>
          </Animated.View>

          {/* Footer */}
          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <Text style={styles.footerTx}>SkillPath · Your personal learning tracker</Text>
          </Animated.View>

        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ════════════════════════════════
   STYLES — matches login.tsx exactly
════════════════════════════════ */
const styles = StyleSheet.create({
  bg: {
    flex: 1, backgroundColor: "#3730a3",
    overflow: "hidden" as const,
  },
  orb: {
    position: "absolute", borderRadius: 999,
    backgroundColor: "rgba(255,255,255,1)",
  } as any,

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 32,
  },

  /* Header */
  header:    { alignItems: "center", marginBottom: 24 },
  logoGlow:  { marginBottom: 16 },
  logoRing:  {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  logoCircle: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: "#6366f1",
    alignItems: "center", justifyContent: "center",
  },
  appName: {
    fontSize: 34, fontWeight: "900", color: "white",
    letterSpacing: -0.8, marginBottom: 6,
  },
  tagline: {
    fontSize: 14, color: "rgba(255,255,255,0.65)",
    fontWeight: "500", marginBottom: 16,
  },
  pillsRow: { flexDirection: "row", gap: 8 } as any,
  pill: {
    backgroundColor: "rgba(255,255,255,0.13)",
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.22)",
  },
  pillTx: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "700" },

  /* Card */
  card: {
    width: "100%",
    ...(Platform.OS === "web" ? { maxWidth: 440 } as any : {}),
    backgroundColor: "white",
    borderRadius: 24, padding: 28,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 24px 80px rgba(0,0,0,0.3),0 0 0 1px rgba(255,255,255,0.06)" } as any
      : { elevation: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20 }),
  },
  cardHdr:   { alignItems: "center", marginBottom: 4 },
  cardTitle: { fontSize: 26, fontWeight: "900", color: "#0f172a", letterSpacing: -0.5 },
  cardSub:   { fontSize: 13, color: "#64748b", fontWeight: "500", marginTop: 4 },

  divider: {
    height: 1, backgroundColor: "rgba(99,102,241,0.1)",
    marginVertical: 20,
  },

  /* Inputs */
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#f8faff",
    borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(99,102,241,0.18)",
    paddingHorizontal: 14, paddingVertical: 2,
    marginBottom: 12, gap: 10,
    ...(Platform.OS === "web" ? { transition: "border-color .2s,box-shadow .2s" } as any : {}),
  },
  inputWrapFocused: { borderColor: "#6366f1" },
  inputIcon: { fontSize: 17 },
  input: {
    flex: 1, fontSize: 15, fontWeight: "500",
    color: "#0f172a", paddingVertical: 14,
  },

  /* Password strength */
  strengthRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12, marginTop: -4 },
  strengthBar: { flex: 1, height: 3, borderRadius: 99 },
  strengthTx:  { fontSize: 11, fontWeight: "700", marginLeft: 4 },

  /* Button */
  btn: {
    backgroundColor: "#6366f1",
    paddingVertical: 16, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    marginTop: 4, marginBottom: 6,
  },
  btnText: {
    color: "white", fontWeight: "800",
    fontSize: 16, letterSpacing: 0.3,
  },

  /* Link */
  linkWrap:   { alignItems: "center", paddingVertical: 10 },
  linkTx:     { fontSize: 13, color: "#64748b", fontWeight: "500" },
  linkAccent: { color: "#6366f1", fontWeight: "700" },

  /* Footer */
  footer:   { marginTop: 20, alignItems: "center" },
  footerTx: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "500" },
});
