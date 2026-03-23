import { useRef, useEffect } from "react";
import { Animated, Platform, View } from "react-native";

/* Only inject the float keyframes — nothing else */
if (Platform.OS === "web" && typeof document !== "undefined") {
  const id = "sp-logo-css";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @keyframes sp-float {
        0%,100% { transform: translateY(0); }
        50%      { transform: translateY(-4px); }
      }
    `;
    document.head.appendChild(s);
  }
}

interface Props {
  size?: number;
  transparent?: boolean;
}

export default function SkillPathLogo({ size = 48, transparent = false }: Props) {
  /* Refs to animate DOM nodes directly — no CSS class timing issues */
  const pathRef = useRef<any>(null);
  const dot1Ref = useRef<any>(null);
  const dot2Ref = useRef<any>(null);
  const dot3Ref = useRef<any>(null);

  /* Native floating */
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  const a3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== "web") {
      /* Native float */
      const make = (val: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(val, { toValue: -4, duration: 1200, useNativeDriver: true }),
            Animated.timing(val, { toValue:  0, duration: 1200, useNativeDriver: true }),
          ])
        );
      make(a1, 0).start();
      make(a2, 300).start();
      make(a3, 600).start();
      return;
    }

    /* ── Web: drive everything with inline style transitions ── */
    const path = pathRef.current;
    const d1   = dot1Ref.current;
    const d2   = dot2Ref.current;
    const d3   = dot3Ref.current;
    if (!path || !d1 || !d2 || !d3) return;

    /* Reset first (no transition) — ensures hidden state even on navigation */
    path.style.transition = "none";
    path.style.strokeDashoffset = "220";

    /* Hide dots immediately */
    [d1, d2, d3].forEach((el) => {
      el.style.transition = "none";
      el.style.opacity = "0";
      el.style.transform = "scale(0)";
      el.style.transformOrigin = "center";
    });

    /* Wait for browser to paint the reset state, then animate */
    setTimeout(() => {
      /* Draw path */
      path.style.transition = "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)";
      path.style.strokeDashoffset = "0";

      /* Pop dots in with stagger */
      [d1, d2, d3].forEach((el, i) => {
        setTimeout(() => {
          el.style.transition = "opacity 0.3s ease, transform 0.4s cubic-bezier(.34,1.56,.64,1)";
          el.style.opacity = "1";
          el.style.transform = "scale(1)";

          /* Start continuous float after pop-in */
          setTimeout(() => {
            el.style.animation = `sp-float 2.4s ease-in-out infinite ${i * 0.3}s`;
          }, 400);
        }, 600 + i * 200);
      });
    }, 50);
  }, []);

  if (Platform.OS === "web") {
    return (
      <svg
        width={size} height={size}
        viewBox="0 0 100 100"
        fill="none"
        style={{ display: "block", flexShrink: 0, overflow: "visible" } as React.CSSProperties}
      >
        <defs>
          <linearGradient id="sp-grad" x1="12" y1="76" x2="88" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF5C5C" />
            <stop offset="0.5" stopColor="#FFCA3A" />
            <stop offset="1"   stopColor="#14D9C5" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        {!transparent && (
          <circle cx="50" cy="50" r="46" fill="white" stroke="rgba(0,0,0,0.07)" strokeWidth="1.5" />
        )}

        {/* Path — starts hidden via inline attrs, animated by useEffect ref */}
        <path
          ref={pathRef}
          d="M16 74 C 26 68, 34 56, 46 46 C 58 36, 66 26, 82 22"
          stroke="url(#sp-grad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="220"
          strokeDashoffset="220"
          fill="none"
        />

        {/* Dot 1 — coral */}
        <g ref={dot1Ref}>
          <circle cx="18" cy="74" r="9"  fill="#FF5C5C" />
          <circle cx="18" cy="74" r="4"  fill="white" opacity="0.65" />
        </g>

        {/* Dot 2 — gold */}
        <g ref={dot2Ref}>
          <circle cx="48" cy="46" r="10" fill="#FFCA3A" />
          <circle cx="48" cy="46" r="4.5" fill="white" opacity="0.65" />
        </g>

        {/* Dot 3 — teal */}
        <g ref={dot3Ref}>
          <circle cx="81" cy="22" r="12" fill="#14D9C5" />
          <circle cx="81" cy="22" r="5"  fill="white" opacity="0.65" />
        </g>
      </svg>
    );
  }

  /* ── Native ── */
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: "white",
      alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }}>
      <Animated.View style={{
        position: "absolute", bottom: size * 0.22, left: size * 0.14,
        width: size * 0.18, height: size * 0.18, borderRadius: size * 0.09,
        backgroundColor: "#FF5C5C",
        transform: [{ translateY: a1 }],
      }} />
      <Animated.View style={{
        position: "absolute", top: size * 0.41, left: size * 0.41,
        width: size * 0.2, height: size * 0.2, borderRadius: size * 0.1,
        backgroundColor: "#FFCA3A",
        transform: [{ translateY: a2 }],
      }} />
      <Animated.View style={{
        position: "absolute", top: size * 0.14, right: size * 0.12,
        width: size * 0.24, height: size * 0.24, borderRadius: size * 0.12,
        backgroundColor: "#14D9C5",
        transform: [{ translateY: a3 }],
      }} />
    </View>
  );
}
