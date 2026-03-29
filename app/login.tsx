import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
} from "react-native";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import SkillPathLogo from "../src/components/SkillPathLogo";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/src/services/firebase";
import Loader from "@/src/components/Loader";
import { showSuccess, showError } from "../src/services/toast";

/* ════ WEB CSS — same as dashboard ════ */
if (Platform.OS === "web" && typeof document !== "undefined") {
  const id = "sk-login-css";
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
      @keyframes sk-fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
      @keyframes sk-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
      @keyframes sk-spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
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

const ACCENT  = "#6366f1";
const ACCENT2 = "#a78bfa";

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

/* ════ MAIN LOGIN ════ */
export default function Login() {
  const router = useRouter();

  /* ── State — original unchanged ── */
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [focusedField, setFocusedField] = useState<"email"|"password"|null>(null);

  /* ── Animations ── */
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const btnScale  = useRef(new Animated.Value(1)).current;
  const emailScale= useRef(new Animated.Value(1)).current;
  const pwScale   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 55, friction: 10 }),
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 65, friction: 7, delay: 150 }),
    ]).start();
  }, []);

  /* ── Handler — 100% original logic ── */
  const handleLogin = async () => {
    if (!email || !password) {
      showError("Please fill all fields");
      return;
    }
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true, tension: 200, friction: 5 }),
      Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 5 }),
    ]).start();
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

  const onFocus = (field: "email"|"password", scaleRef: Animated.Value) => {
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
      {/* Full-screen gradient bg — matches dashboard hero */}
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
        <View pointerEvents="none" style={[styles.orb, { width: 180, height: 180, top: "30%" as any, left: "5%", opacity: 0.1 },
          Platform.OS === "web" ? { animation: "sk-float 5s ease-in-out infinite" } as any : {}]} />
        <View pointerEvents="none" style={[styles.orb, { width: 120, height: 120, top: "20%", right: "8%" as any, opacity: 0.09 },
          Platform.OS === "web" ? { animation: "sk-float 7s ease-in-out infinite reverse" } as any : {}]} />

        <Particles />

        {loading && <Loader />}

        {/* Content */}
        <View style={styles.content}>

          {/* ── LOGO + HEADER ── */}
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
            {/* Glow ring */}
            <View style={[styles.logoGlow,
              Platform.OS === "web" ? { animation: "sk-glow 3s ease-in-out infinite" } as any : {}]}>
              <View style={styles.logoRing}>
                <View style={[styles.logoCircle,
                  Platform.OS === "web" ? { animation: "sk-breathe 3s ease-in-out infinite" } as any : {}]}>
                  <SkillPathLogo size={80} />
                </View>
              </View>
            </View>

           <Text style={[styles.appName,
  Platform.OS === "web"
    ? ({
        fontFamily: "Outfit,sans-serif",
        background: "linear-gradient(90deg,#FF5C5C,#FFCA3A,#14D9C5)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      } as any)
    : { color: "#FF5C5C" },
]}>
  SkillPath
</Text>
            <Text style={styles.tagline}>Your Learning Companion</Text>

            {/* Feature pills */}
            <View style={styles.pillsRow}>
              {["🎯 Track Goals", "📊 Analytics", "🔥 Streaks"].map((p, i) => (
                <View key={i} style={styles.pill}>
                  <Text style={styles.pillTx}>{p}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── LOGIN CARD ── */}
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
                Sign In
              </Text>
              <Text style={styles.cardSub}>Welcome back, keep learning 🚀</Text>
            </View>

            <View style={styles.divider} />

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
                  placeholder="Password"
                  placeholderTextColor="rgba(99,102,241,0.4)"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => onFocus("password", pwScale)}
                  onBlur={() => onBlur(pwScale)}
                  onSubmitEditing={handleLogin}
                />
              </View>
            </Animated.View>

            {/* Login button */}
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
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={[styles.btnText,
                  Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}]}>
                  {loading ? "Signing in..." : "Sign In →"}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Sign up link */}
            <Pressable onPress={() => router.push("/signup")}
              style={({ pressed }) => [styles.linkWrap, pressed && { opacity: 0.7 }]}>
              <Text style={styles.linkTx}>
                Don't have an account?{" "}
                <Text style={[styles.linkAccent,
                  Platform.OS === "web" ? { fontFamily: "Outfit,sans-serif" } as any : {}]}>
                  Sign up
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
   STYLES
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
  header:     { alignItems: "center", marginBottom: 28 },
  logoGlow:   { marginBottom: 16,
    ...(Platform.OS === "web" ? {} : {}),
  },
  logoRing:   {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.55)",
    alignItems: "center", justifyContent: "center",
  },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "transparent",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
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
  inputWrapFocused: {
    borderColor: "#6366f1",
  },
  inputIcon: { fontSize: 17 },
  input: {
    flex: 1, fontSize: 15, fontWeight: "500",
    color: "#0f172a", paddingVertical: 14,
  },

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
  linkWrap: { alignItems: "center", paddingVertical: 10 },
  linkTx:   { fontSize: 13, color: "#64748b", fontWeight: "500" },
  linkAccent: { color: "#6366f1", fontWeight: "700" },

  /* Footer */
  footer:   { marginTop: 20, alignItems: "center" },
  footerTx: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "500" },
});
