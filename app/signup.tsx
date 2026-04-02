import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
  Image,
} from "react-native";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import SkillPathLogo from "../src/components/SkillPathLogo";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/src/services/firebase";
import { doc, setDoc } from "firebase/firestore";
import Loader from "@/src/components/Loader";
import { showSuccess, showError } from "../src/services/toast";

const IS_WEB = (Platform.OS as string) === "web";

/* ════ WEB CSS ════ */
if (IS_WEB && typeof document !== "undefined") {
  const id = "sk-signup-css";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@700;800;900&display=swap');
      @keyframes sk-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
      @keyframes sk-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
      @keyframes sk-glow{0%,100%{box-shadow:0 0 20px rgba(99,102,241,.4)}50%{box-shadow:0 0 50px rgba(99,102,241,.8)}}
      @keyframes sk-particle{0%{transform:translateY(0) scale(1);opacity:.8}100%{transform:translateY(-80px) scale(0);opacity:0}}
      @keyframes sk-card-in{from{opacity:0;transform:translateY(32px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
      @keyframes sk-slideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
      input{font-family:'Plus Jakarta Sans',sans-serif!important;}
      input:focus{outline:none!important;}
      *{box-sizing:border-box;}
      ::-webkit-scrollbar{width:4px}
      ::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.3);border-radius:99px}
    `;
    document.head.appendChild(s);
  }
}

const ACCENT = "#6366f1";

const ROLE_SUGGESTIONS = [
  { label: "Student",           tag: "Popular" },
  { label: "Intern Developer",  tag: "Common"  },
  { label: "Software Engineer", tag: null      },
  { label: "Designer",          tag: null      },
  { label: "Product Manager",   tag: null      },
  { label: "Data Analyst",      tag: null      },
  { label: "DevOps Engineer",   tag: null      },
  { label: "Freelancer",        tag: null      },
];

/* ════ PARTICLES ════ */
function Particles() {
  const [pts, setPts] = useState<{id:number;x:number;size:number}[]>([]);
  useEffect(() => {
    if (!IS_WEB) return;
    const id = setInterval(() => {
      setPts(p => [...p.slice(-18), { id: Date.now(), x: Math.random() * 95 + 2, size: Math.random() * 4 + 2 }]);
    }, 400);
    return () => clearInterval(id);
  }, []);
  if (!IS_WEB) return null;
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

  const [name,         setName]         = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [role,         setRole]         = useState("");
  const [roleInput,    setRoleInput]    = useState("");
  const [roleOpen,     setRoleOpen]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [focusedField, setFocusedField] = useState<"name"|"email"|"password"|"role"|null>(null);
  const [showPassword, setShowPassword] = useState(false);
const eyeAnim = useRef(new Animated.Value(0)).current;


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

  useEffect(() => {
  const loop = Animated.loop(
    Animated.sequence([
      Animated.timing(eyeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(eyeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(9000),
    ])
  );

  loop.start();

  return () => loop.stop();
}, []);

  const filteredRoles = ROLE_SUGGESTIONS.filter(r =>
    r.label.toLowerCase().includes(roleInput.toLowerCase())
  );

  const handleSignup = async () => {
    if (!name || !email || !password) { showError("Please fill all fields"); return; }
    if (password.length < 6) { showError("Password must be at least 6 characters"); return; }
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true, tension: 200, friction: 5 }),
      Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 5 }),
    ]).start();
    try {
      setLoading(true);
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(res.user, { displayName: name });
      const finalRole = (role || roleInput).trim() || "Learner";
      await setDoc(doc(db, "users", res.user.uid), {
        displayName: name, role: finalRole, streak: 0, activityLog: {},
      }, { merge: true });
      showSuccess("Account created!");
      router.replace("/dashboard");
    } catch (e: any) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onFocus = (field: "name"|"email"|"password"|"role", scaleRef: Animated.Value) => {
    setFocusedField(field);
    Animated.spring(scaleRef, { toValue: 1.01, useNativeDriver: true, tension: 150, friction: 8 }).start();
  };
  const onBlur = (scaleRef: Animated.Value) => {
    setFocusedField(null);
    Animated.spring(scaleRef, { toValue: 1, useNativeDriver: true, tension: 150, friction: 8 }).start();
  };

  const selectRole = (label: string) => {
    setRole(label);
    setRoleInput(label);
    setRoleOpen(false);
    setFocusedField(null);
  };

  const clearRole = () => { setRole(""); setRoleInput(""); setRoleOpen(false); };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={IS_WEB ? undefined : "padding"}>
      <View style={styles.bg}>
        {IS_WEB ? (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, {
            background: "linear-gradient(135deg,#1e1b4b 0%,#3730a3 30%,#6d28d9 65%,#9333ea 100%)",
          } as any]} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#3730a3" }]} />
        )}

        {/* Orbs */}
        {[
          { w: 500, h: 500, t: -200, r: -200, op: 0.18, d: "6s" },
          { w: 300, h: 300, b: -100, l: -100, op: 0.12, d: "8s" },
        ].map((orb: any, i) => (
          <View key={i} pointerEvents="none" style={[styles.orb, {
            width: orb.w, height: orb.h, opacity: orb.op,
            ...(orb.t != null ? { top: orb.t } : {}),
            ...(orb.b != null ? { bottom: orb.b } : {}),
            ...(orb.r != null ? { right: orb.r } : {}),
            ...(orb.l != null ? { left: orb.l } : {}),
          }, IS_WEB ? { animation: `sk-float ${orb.d} ease-in-out infinite` } as any : {}]} />
        ))}

        <Particles />
        {loading && <Loader />}

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* HEADER */}
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
            <View style={[styles.logoGlow, IS_WEB ? { animation: "sk-glow 3s ease-in-out infinite" } as any : {}]}>
              <View style={styles.logoRing}>
                <View style={[styles.logoCircle, IS_WEB ? { animation: "sk-breathe 3s ease-in-out infinite" } as any : {}]}>
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
            <Text style={styles.tagline}>Start your learning journey</Text>
            <View style={styles.pillsRow}>
              {["🚀 Get Started", "🎯 Set Goals", "🔥 Build Streaks"].map((p, i) => (
                <View key={i} style={styles.pill}><Text style={styles.pillTx}>{p}</Text></View>
              ))}
            </View>
          </Animated.View>

          {/* CARD */}
          <Animated.View style={[
            styles.card,
            IS_WEB ? { animation: "sk-card-in .55s cubic-bezier(.34,1.56,.64,1) .2s both" } as any : {},
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}>
            <View style={styles.cardHdr}>
              <Text style={[styles.cardTitle, IS_WEB ? { fontFamily: "Outfit,sans-serif" } as any : {}]}>
                Create Account
              </Text>
              <Text style={styles.cardSub}>Join thousands of learners today 🌟</Text>
            </View>
            <View style={styles.divider} />

            {/* Name */}
            <Animated.View style={{ transform: [{ scale: nameScale }] }}>
              <View style={[styles.inputWrap,
                focusedField === "name" && styles.inputFocused,
                IS_WEB && focusedField === "name" ? { boxShadow: `0 0 0 3px ${ACCENT}22` } as any : {},
              ]}>
                <Text style={[styles.icon, { opacity: focusedField === "name" || name ? 1 : 0.45 }]}>👤</Text>
                <TextInput
                  style={[styles.inp, IS_WEB ? { outline: "none", fontFamily: "Plus Jakarta Sans,sans-serif" } as any : {}]}
                  placeholder="Full Name" placeholderTextColor="rgba(99,102,241,0.4)"
                  value={name} onChangeText={setName}
                  onFocus={() => onFocus("name", nameScale)} onBlur={() => onBlur(nameScale)}
                />
              </View>
            </Animated.View>

            {/* Email */}
            <Animated.View style={{ transform: [{ scale: emailScale }] }}>
              <View style={[styles.inputWrap,
                focusedField === "email" && styles.inputFocused,
                IS_WEB && focusedField === "email" ? { boxShadow: `0 0 0 3px ${ACCENT}22` } as any : {},
              ]}>
                <Text style={[styles.icon, { opacity: focusedField === "email" || email ? 1 : 0.45 }]}>✉️</Text>
                <TextInput
                  style={[styles.inp, IS_WEB ? { outline: "none", fontFamily: "Plus Jakarta Sans,sans-serif" } as any : {}]}
                  placeholder="Email address" placeholderTextColor="rgba(99,102,241,0.4)"
                  value={email} onChangeText={setEmail}
                  autoCapitalize="none" keyboardType="email-address"
                  onFocus={() => onFocus("email", emailScale)} onBlur={() => onBlur(emailScale)}
                />
              </View>
            </Animated.View>

            {/* Password
            <Animated.View style={{ transform: [{ scale: pwScale }] }}>
              <View style={[styles.inputWrap,
                focusedField === "password" && styles.inputFocused,
                IS_WEB && focusedField === "password" ? { boxShadow: `0 0 0 3px ${ACCENT}22` } as any : {},
              ]}>
                <Text style={[styles.icon, { opacity: focusedField === "password" || password ? 1 : 0.45 }]}>🔒</Text>
                <TextInput
                  style={[styles.inp, IS_WEB ? { outline: "none", fontFamily: "Plus Jakarta Sans,sans-serif" } as any : {}]}
                  placeholder="Password (min. 6 characters)" placeholderTextColor="rgba(99,102,241,0.4)"
                  secureTextEntry={!showPassword} value={password} onChangeText={setPassword}
                  onFocus={() => onFocus("password", pwScale)} onBlur={() => onBlur(pwScale)}
                  onSubmitEditing={handleSignup}
                /> */}

                {/* Password */}
<Animated.View style={{ transform: [{ scale: pwScale }] }}>
  <View style={[styles.inputWrap,
    focusedField === "password" && styles.inputFocused,
    IS_WEB && focusedField === "password"
      ? { boxShadow: `0 0 0 3px ${ACCENT}22` } as any
      : {},
  ]}>

    {/* Lock icon */}
    <Text style={[styles.icon, { opacity: focusedField === "password" || password ? 1 : 0.45 }]}>
      🔒
    </Text>

    {/* Input */}
    <TextInput
      style={[styles.inp, IS_WEB ? { outline: "none", fontFamily: "Plus Jakarta Sans,sans-serif" } as any : {}]}
      placeholder="Password (min. 6 characters)"
      placeholderTextColor="rgba(99,102,241,0.4)"
      secureTextEntry={!showPassword}  
      value={password}
      onChangeText={setPassword}
      onFocus={() => onFocus("password", pwScale)}
      onBlur={() => onBlur(pwScale)}
      onSubmitEditing={handleSignup}
    />

    <Pressable onPress={() => setShowPassword(!showPassword)}>
      <Animated.View
        style={{
          width: 22,
          height: 14,
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: "#6366f1",
          justifyContent: "center",
          alignItems: "center",
          transform: [
            {
              scale: eyeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.15],
              }),
            },
          ],
        }}
      >
        <View
          style={{
            width: showPassword ? 6 : 12,
            height: 2,
            backgroundColor: "#6366f1",
            transform: [{ rotate: showPassword ? "0deg" : "45deg" }],
          }}
        />
      </Animated.View>
    </Pressable>

  </View>
</Animated.View>

            {/* Password strength */}
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

            {/* ── ROLE SECTION ── */}
            <View style={styles.roleSection}>
              {/* Label row */}
              <View style={styles.roleLabelRow}>
                <Text style={styles.roleLabel}>Your Role</Text>
                <View style={styles.optionalBadge}><Text style={styles.optionalTx}>optional</Text></View>
              </View>

              {/* Role trigger button — NOT a text input, avoids overlap */}
              <Pressable
                onPress={() => setRoleOpen(o => !o)}
                style={[
                  styles.roleTrigger,
                  roleOpen && styles.roleTriggerOpen,
                  role && styles.roleTriggerSelected,
                ]}
              >
                <Text style={{ fontSize: 16 }}>🏷️</Text>
                <Text style={[
                  styles.roleTriggerTx,
                  !role && { color: "rgba(99,102,241,0.45)" },
                  role && { color: "#0f172a", fontWeight: "600" },
                ]}>
                  {role || "e.g. Student, Engineer, Designer..."}
                </Text>
                {role ? (
                  <Pressable onPress={(e) => { e.stopPropagation?.(); clearRole(); }}
                    style={{ padding: 4 }}>
                    <Text style={{ fontSize: 13, color: ACCENT, fontWeight: "800" }}>✕</Text>
                  </Pressable>
                ) : (
                  <Text style={[styles.chevron, roleOpen && styles.chevronUp]}>▼</Text>
                )}
              </Pressable>

              {/* ── INLINE DROPDOWN — part of normal flow, no absolute positioning ── */}
              {roleOpen && (
                <View style={[styles.roleList, IS_WEB ? { animation: "sk-slideDown .15s ease both" } as any : {}]}>
                  {/* Search within list */}
                  <View style={styles.roleSearch}>
                    <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
                    {IS_WEB ? (
                      <input
                        value={roleInput}
                        onChange={(e: any) => setRoleInput(e.target.value)}
                        placeholder="Search or type a role..."
                        autoFocus
                        style={{
                          flex: 1, fontSize: 13, fontFamily: "Plus Jakarta Sans,sans-serif",
                          border: "none", outline: "none", background: "transparent",
                          color: "#0f172a",
                        } as any}
                      />
                    ) : (
                      <TextInput
                        style={{ flex: 1, fontSize: 13, color: "#0f172a" }}
                        placeholder="Search or type a role..."
                        placeholderTextColor="rgba(99,102,241,0.4)"
                        value={roleInput}
                        onChangeText={setRoleInput}
                        autoFocus
                      />
                    )}
                    {roleInput.length > 0 && (
                      <Pressable onPress={() => setRoleInput("")}>
                        <Text style={{ fontSize: 11, color: "#94a3b8" }}>✕</Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Suggestions */}
                  {filteredRoles.map((r, i) => (
                    <Pressable key={i} onPress={() => selectRole(r.label)}
                      style={({ pressed }) => [
                        styles.roleItem,
                        pressed && { backgroundColor: ACCENT + "10" },
                        i === filteredRoles.length - 1 && { borderBottomWidth: 0 },
                      ]}>
                      <Text style={styles.roleItemTx}>{r.label}</Text>
                      {r.tag && (
                        <View style={styles.roleTagWrap}>
                          <Text style={styles.roleTagTx}>{r.tag}</Text>
                        </View>
                      )}
                    </Pressable>
                  ))}

                  {/* Custom role option */}
                  {roleInput.trim() !== "" && !ROLE_SUGGESTIONS.some(r => r.label.toLowerCase() === roleInput.trim().toLowerCase()) && (
                    <Pressable onPress={() => selectRole(roleInput.trim())}
                      style={({ pressed }) => [styles.roleItem, styles.roleItemCustom,
                        pressed && { backgroundColor: ACCENT + "10" }]}>
                      <Text style={{ fontSize: 13, color: ACCENT, fontWeight: "700" }}>
                        ✚  Use "{roleInput.trim()}"
                      </Text>
                    </Pressable>
                  )}

                  {filteredRoles.length === 0 && roleInput.trim() === "" && (
                    <View style={{ padding: 16, alignItems: "center" }}>
                      <Text style={{ fontSize: 12, color: "#94a3b8" }}>Type to search or create a custom role</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Quick pick chips — only when dropdown closed and no role set */}
              {!roleOpen && !role && (
                <View style={styles.quickPicks}>
                  {["Student", "Developer", "Designer"].map((r, i) => (
                    <Pressable key={i} onPress={() => selectRole(r)}
                      style={({ pressed }) => [styles.quickChip, pressed && { opacity: 0.7 }]}>
                      <Text style={styles.quickChipTx}>{r}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Confirm badge */}
              {role && !roleOpen && (
                <View style={styles.roleConfirm}>
                  <Text style={{ fontSize: 11, color: ACCENT, fontWeight: "700" }}>✓ Role set: {role}</Text>
                </View>
              )}
            </View>

            {/* Create Account button */}
            <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: 16 }}>
              <Pressable
                style={({ pressed }) => [
                  styles.btn, pressed && { opacity: 0.88 },
                  IS_WEB ? {
                    background: loading ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg,#6366f1,#a78bfa)",
                    boxShadow: loading ? "none" : "0 8px 24px rgba(99,102,241,0.45)",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all .2s",
                  } as any : { backgroundColor: loading ? "rgba(99,102,241,0.5)" : ACCENT },
                ]}
                onPress={handleSignup} disabled={loading}
              >
                <Text style={[styles.btnTx, IS_WEB ? { fontFamily: "Outfit,sans-serif" } as any : {}]}>
                  {loading ? "Creating account..." : "Create Account →"}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Sign in link */}
            <Pressable onPress={() => router.push("/login")}
              style={({ pressed }) => [styles.linkWrap, pressed && { opacity: 0.7 }]}>
              <Text style={styles.linkTx}>
                Already have an account?{" "}
                <Text style={[styles.linkAccent, IS_WEB ? { fontFamily: "Outfit,sans-serif" } as any : {}]}>Sign in</Text>
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <Text style={styles.footerTx}>SkillPath · Your personal learning tracker</Text>
          </Animated.View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bg:      { flex: 1, backgroundColor: "#3730a3", overflow: "hidden" as const },
  orb:     { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.9)" } as any,
  content: { flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 22, paddingVertical: 32 },

  header:     { alignItems: "center", marginBottom: 24 },
  logoGlow:   { marginBottom: 16 },
  logoRing:   { width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 2, borderColor: "rgba(255,255,255,0.45)", alignItems: "center", justifyContent: "center" },
  logoCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: "transparent", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  appName:    { fontSize: 34, fontWeight: "900", color: "white", letterSpacing: -0.8, marginBottom: 6 },
  tagline:    { fontSize: 14, color: "rgba(255,255,255,0.65)", fontWeight: "500", marginBottom: 16 },
  pillsRow:   { flexDirection: "row", gap: 8 } as any,
  pill:       { backgroundColor: "rgba(255,255,255,0.13)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.22)" },
  pillTx:     { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "700" },

  card:      { width: "100%", ...(IS_WEB ? { maxWidth: 440 } as any : {}), backgroundColor: "white", borderRadius: 24, padding: 28, ...(IS_WEB ? { boxShadow: "0 24px 80px rgba(0,0,0,0.3)" } as any : { elevation: 20 }) },
  cardHdr:   { alignItems: "center", marginBottom: 4 },
  cardTitle: { fontSize: 26, fontWeight: "900", color: "#0f172a", letterSpacing: -0.5 },
  cardSub:   { fontSize: 13, color: "#64748b", fontWeight: "500", marginTop: 4 },
  divider:   { height: 1, backgroundColor: "rgba(99,102,241,0.1)", marginVertical: 20 },

  inputWrap:   { flexDirection: "row", alignItems: "center", backgroundColor: "#f8faff", borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(99,102,241,0.18)", paddingHorizontal: 14, paddingVertical: 2, marginBottom: 12, gap: 10 },
  inputFocused:{ borderColor: "#6366f1" },
  icon:        { fontSize: 17 },
  inp:         { flex: 1, fontSize: 15, fontWeight: "500", color: "#0f172a", paddingVertical: 14 },

  strengthRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12, marginTop: -4 },
  strengthBar: { flex: 1, height: 3, borderRadius: 99 },
  strengthTx:  { fontSize: 11, fontWeight: "700", marginLeft: 4 },

  /* Role */
  roleSection:  { marginBottom: 4 },
  roleLabelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  roleLabel:    { fontSize: 12, fontWeight: "700", color: "#0f172a", textTransform: "uppercase" as const, letterSpacing: 0.6 },
  optionalBadge:{ backgroundColor: "#f1f5f9", borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  optionalTx:   { fontSize: 10, color: "#94a3b8", fontWeight: "600" },

  roleTrigger:        { flexDirection: "row", alignItems: "center", backgroundColor: "#f8faff", borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(99,102,241,0.18)", paddingHorizontal: 14, paddingVertical: 14, gap: 10, ...(IS_WEB ? { cursor: "pointer", transition: "border-color .2s" } as any : {}) },
  roleTriggerOpen:    { borderColor: ACCENT, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  roleTriggerSelected:{ borderColor: ACCENT + "55", backgroundColor: ACCENT + "06" },
  roleTriggerTx:      { flex: 1, fontSize: 15, fontWeight: "500", color: "#0f172a" },
  chevron:            { fontSize: 10, color: "rgba(99,102,241,0.4)", ...(IS_WEB ? { transition: "transform .2s" } as any : {}) },
  chevronUp:          { ...(IS_WEB ? { transform: "rotate(180deg)" } as any : {}) },

  roleList:       { borderWidth: 1.5, borderTopWidth: 0, borderColor: ACCENT, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, backgroundColor: "white", overflow: "hidden", marginBottom: 8 },
  roleSearch:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(99,102,241,0.08)", backgroundColor: "#fafbff" },
  roleItem:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "rgba(99,102,241,0.06)", ...(IS_WEB ? { cursor: "pointer", transition: "background .1s" } as any : {}) },
  roleItemTx:     { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  roleItemCustom: { backgroundColor: ACCENT + "06" },
  roleTagWrap:    { backgroundColor: ACCENT + "12", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  roleTagTx:      { fontSize: 10, fontWeight: "700", color: ACCENT },

  quickPicks:   { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" } as any,
  quickChip:    { backgroundColor: ACCENT + "0d", borderRadius: 20, borderWidth: 1, borderColor: ACCENT + "22", paddingHorizontal: 12, paddingVertical: 6, ...(IS_WEB ? { cursor: "pointer" } as any : {}) },
  quickChipTx:  { fontSize: 12, fontWeight: "700", color: ACCENT },
  roleConfirm:  { marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: ACCENT + "0d", borderRadius: 10, borderWidth: 1, borderColor: ACCENT + "22", alignSelf: "flex-start" as const },

  btn:       { backgroundColor: ACCENT, paddingVertical: 16, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  btnTx:     { color: "white", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
  linkWrap:  { alignItems: "center", paddingVertical: 10 },
  linkTx:    { fontSize: 13, color: "#64748b", fontWeight: "500" },
  linkAccent:{ color: "#6366f1", fontWeight: "700" },
  footer:    { marginTop: 20, alignItems: "center" },
  footerTx:  { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "500" },
});
