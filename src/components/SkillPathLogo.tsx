import { useRef, useEffect, useState } from "react";
import { Animated, Platform, View } from "react-native";

/* ── Unique ID counter so multiple logos on the same page
      never share the same SVG gradient id ── */
let _logoCounter = 0;

if (Platform.OS === "web" && typeof document !== "undefined") {
  const id = "sp-logo-css";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      /* ── Draw the path in on mount ── */
      @keyframes sp-path-draw {
        from { stroke-dashoffset: 200; }
        to   { stroke-dashoffset: 0;   }
      }

      /* ── Gentle float for dots ── */
      @keyframes sp-float {
        0%,100% { transform: translateY(0px);  }
        50%     { transform: translateY(-4px); }
      }

      /* ── Entry pop for dots ── */
      @keyframes sp-pop {
        0%   { transform: scale(0); opacity: 0; }
        70%  { transform: scale(1.15); }
        100% { transform: scale(1);  opacity: 1; }
      }

      /* ── Shimmer streak flowing along the path ── */
      @keyframes sp-shimmer {
        0%   { stroke-dashoffset:  210; opacity: 0;   }
        8%   { opacity: 1; }
        92%  { opacity: 1; }
        100% { stroke-dashoffset: -210; opacity: 0;   }
      }

      /* ── Soft glow breathe on track ── */
      @keyframes sp-glow {
        0%,100% { filter: drop-shadow(0 0 1.5px rgba(255,202,58,0.3)); }
        50%     { filter: drop-shadow(0 0 5px  rgba(20,217,197,0.65))
                          drop-shadow(0 0 10px rgba(255,92,92,0.3)); }
      }

      /* ── Ripple ring on each dot ── */
      @keyframes sp-ripple-sm { 0% { r:9;  opacity:.5; } 100% { r:17; opacity:0; } }
      @keyframes sp-ripple-md { 0% { r:11; opacity:.5; } 100% { r:19; opacity:0; } }
      @keyframes sp-ripple-lg { 0% { r:13; opacity:.5; } 100% { r:21; opacity:0; } }

      /* ── Dot classes: pop-in then float forever ── */
      .sp-d0 {
        transform-origin: 18px 74px;
        animation:
          sp-pop   0.45s cubic-bezier(.34,1.56,.64,1) 0.5s  both,
          sp-float 2.4s  ease-in-out                  0.95s infinite;
      }
      .sp-d1 {
        transform-origin: 48px 46px;
        animation:
          sp-pop   0.45s cubic-bezier(.34,1.56,.64,1) 0.65s both,
          sp-float 2.4s  ease-in-out                  1.25s infinite;
      }
      .sp-d2 {
        transform-origin: 81px 22px;
        animation:
          sp-pop   0.45s cubic-bezier(.34,1.56,.64,1) 0.80s both,
          sp-float 2.4s  ease-in-out                  1.55s infinite;
      }

      /* ── Path draw-in ── */
      .sp-path {
        stroke-dasharray: 200;
        stroke-dashoffset: 200;
        animation: sp-path-draw 1.2s ease-out 0.1s forwards;
      }

      /* ── Glow breathe after draw ── */
      .sp-path-glow {
        animation: sp-glow 3s ease-in-out 1.5s infinite;
      }

      /* ── Shimmer ── */
      .sp-shimmer {
        stroke-dasharray: 44 166;
        stroke-dashoffset: 210;
        animation: sp-shimmer 2.6s cubic-bezier(.45,0,.55,1) 1.8s infinite;
      }

      /* ── Ripple rings ── */
      .sp-rp-0 { opacity:0; animation: sp-ripple-sm 2.2s ease-out 1.1s infinite; }
      .sp-rp-1 { opacity:0; animation: sp-ripple-md 2.2s ease-out 1.4s infinite; }
      .sp-rp-2 { opacity:0; animation: sp-ripple-lg 2.2s ease-out 1.7s infinite; }

      /* ── Star pop (top dot) ── */
      @keyframes sp-star {
        0%   { transform: scale(0) rotate(-20deg); opacity:0; }
        60%  { transform: scale(1.2) rotate(5deg); }
        100% { transform: scale(1)  rotate(0deg);  opacity:.55; }
      }
      .sp-star {
        transform-origin: 81px 20px;
        opacity: 0;
        animation: sp-star 0.5s cubic-bezier(.34,1.56,.64,1) 1.4s both;
      }
    `;
    document.head.appendChild(s);
  }
}

interface Props {
  size?: number;
  transparent?: boolean;
  dark?: boolean;
}

export default function SkillPathLogo({ size = 48, transparent = false, dark = false }: Props) {
  /* Stable unique IDs per instance — prevents gradient ID collisions */
  const uid  = useRef(`sp${++_logoCounter}`).current;
  const pgId = `${uid}-pg`;
  const d1Id = `${uid}-d1`;
  const d2Id = `${uid}-d2`;
  const d3Id = `${uid}-d3`;
  const shId = `${uid}-sh`;
  const fxId = `${uid}-fx`;

  /* mountKey — new value on every mount so CSS animations always restart
     (React reuses DOM nodes on navigation; this forces a brand-new SVG element) */
  const [mountKey] = useState(() => Math.random());

  /* Native animated values */
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  const a3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === "web") return;
    const make = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: -4, duration: 1200, useNativeDriver: true }),
          Animated.timing(val, { toValue:  0, duration: 1200, useNativeDriver: true }),
        ])
      );
    const l1 = make(a1, 0);
    const l2 = make(a2, 300);
    const l3 = make(a3, 600);
    l1.start(); l2.start(); l3.start();
    return () => { l1.stop(); l2.stop(); l3.stop(); };
  }, []);

  if (Platform.OS === "web") {
    const ring = transparent
      ? (dark ? "#0a0f20" : "#2e1a47")
      : (dark ? "#0d1424" : "white");

    const PATH = "M16 74 C 26 68, 34 56, 46 46 C 58 36, 66 26, 82 22";

    return (
      <svg
        key={mountKey}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        style={{ display: "block", flexShrink: 0, overflow: "visible" } as React.CSSProperties}
      >
        <defs>
          {/* Main path gradient: coral → gold → teal → sky */}
          <linearGradient id={pgId} x1="12" y1="76" x2="88" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#FF5C5C"/>
            <stop offset="40%"  stopColor="#FFCA3A"/>
            <stop offset="75%"  stopColor="#14D9C5"/>
            <stop offset="100%" stopColor="#38BDF8"/>
          </linearGradient>

          {/* Dot 1: coral → orange */}
          <linearGradient id={d1Id} x1="12" y1="70" x2="30" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF5C5C"/>
            <stop offset="1" stopColor="#FF8B3D"/>
          </linearGradient>
          {/* Dot 2: gold → lime */}
          <linearGradient id={d2Id} x1="35" y1="55" x2="58" y2="35" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFCA3A"/>
            <stop offset="1" stopColor="#72EF36"/>
          </linearGradient>
          {/* Dot 3: teal → sky */}
          <linearGradient id={d3Id} x1="62" y1="38" x2="84" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#14D9C5"/>
            <stop offset="1" stopColor="#38BDF8"/>
          </linearGradient>

          {/* Shimmer highlight */}
          <linearGradient id={shId} x1="12" y1="76" x2="88" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="rgba(255,255,255,0)"/>
            <stop offset="45%"  stopColor="rgba(255,255,255,0)"/>
            <stop offset="50%"  stopColor="rgba(255,255,255,0.92)"/>
            <stop offset="55%"  stopColor="rgba(255,255,255,0)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </linearGradient>

          {!transparent && (
            <filter id={fxId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="8"
                floodColor={dark ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.12)"}/>
            </filter>
          )}
        </defs>

        {/* Container circle */}
        {!transparent && (
          <circle
            cx="50" cy="50" r="46"
            fill={dark ? "#0d1424" : "white"}
            stroke={dark ? "rgba(255,255,255,0.09)" : "#eee"}
            strokeWidth="1.5"
            filter={`url(#${fxId})`}
          />
        )}

        {/* Ghost track underlay */}
        <path
          d={PATH}
          stroke={dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Colored path — draws in, then glows */}
        <path
          className="sp-path sp-path-glow"
          d={PATH}
          stroke={`url(#${pgId})`}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="200"
          strokeDashoffset="200"
          fill="none"
        />

        {/* Shimmer streak */}
        <path
          className="sp-shimmer"
          d={PATH}
          stroke={`url(#${shId})`}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* DOT 0 · coral→orange · bottom-left */}
        <g className="sp-d0">
          <circle className="sp-rp-0" cx="18" cy="74" r="9" fill="none" stroke="#FF5C5C" strokeWidth="1"/>
          <circle cx="18" cy="74" r="11" fill={ring}/>
          <circle cx="18" cy="74" r="9"  fill={`url(#${d1Id})`}/>
          <circle cx="18" cy="74" r="4"  fill="white" opacity="0.6"/>
          <circle cx="15.5" cy="71.5" r="1.3" fill="white" opacity="0.45"/>
        </g>

        {/* DOT 1 · gold→lime · middle */}
        <g className="sp-d1">
          <circle className="sp-rp-1" cx="48" cy="46" r="11" fill="none" stroke="#FFCA3A" strokeWidth="1"/>
          <circle cx="48" cy="46" r="12.5" fill={ring}/>
          <circle cx="48" cy="46" r="10"   fill={`url(#${d2Id})`}/>
          <circle cx="48" cy="46" r="4.5"  fill="white" opacity="0.6"/>
          <circle cx="45"  cy="43.5" r="1.5" fill="white" opacity="0.45"/>
        </g>

        {/* DOT 2 · teal→sky · top-right */}
        <g className="sp-d2">
          <circle className="sp-rp-2" cx="81" cy="22" r="13" fill="none" stroke="#14D9C5" strokeWidth="1"/>
          <circle cx="81" cy="22" r="14.5" fill={ring}/>
          <circle cx="81" cy="22" r="12"   fill={`url(#${d3Id})`}/>
          <circle cx="81" cy="22" r="5"    fill="white" opacity="0.6"/>
          <circle cx="78"  cy="19.5" r="1.8" fill="white" opacity="0.45"/>
          <path
            className="sp-star"
            d="M81 14 L82.2 18 L86 18.8 L82.8 21.4 L84 25.4 L81 23.2 L78 25.4 L79.2 21.4 L76 18.8 L79.8 18Z"
            fill="white"
            opacity="0.55"
          />
        </g>
      </svg>
    );
  }

  /* ── Native fallback ── */
  const nativeBg = dark ? "#0d1424" : "white";
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: nativeBg,
      alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }}>
      <Animated.View style={{
        position: "absolute", bottom: size * 0.20, left: size * 0.10,
        width: size * 0.19, height: size * 0.19, borderRadius: size * 0.095,
        backgroundColor: "#FF5C5C",
        transform: [{ translateY: a1 }],
      }} />
      <Animated.View style={{
        position: "absolute", top: size * 0.40, left: size * 0.40,
        width: size * 0.22, height: size * 0.22, borderRadius: size * 0.11,
        backgroundColor: "#FFCA3A",
        transform: [{ translateY: a2 }],
      }} />
      <Animated.View style={{
        position: "absolute", top: size * 0.12, right: size * 0.09,
        width: size * 0.26, height: size * 0.26, borderRadius: size * 0.13,
        backgroundColor: "#14D9C5",
        transform: [{ translateY: a3 }],
      }} />
    </View>
  );
}
