import {
  Animated, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View, useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useContext, useEffect, useRef, useState } from "react";
import SkillPathLogo from "../src/components/SkillPathLogo";
import { AuthContext } from "../src/context/AuthContext";
import { TaskContext } from "../src/context/TaskContext";
import { db } from "../src/services/firebase";
import { loadTheme, saveTheme } from "../src/services/uiPreferences";
import { showDelete, showSuccess, showError } from "../src/services/toast";

/* ══ CSS ══ */
if (Platform.OS === "web" && typeof document !== "undefined") {
  const id = "sk-goals3-css";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@700;800;900&display=swap');
      @keyframes g3-up{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
      @keyframes g3-in{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}
      @keyframes g3-slide{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
      @keyframes g3-pulse{0%,100%{opacity:1}50%{opacity:.3}}
      @keyframes g3-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
      @keyframes g3-glow{0%,100%{box-shadow:0 0 8px rgba(99,102,241,.3)}50%{box-shadow:0 0 24px rgba(99,102,241,.75)}}
      @keyframes g3-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
      .g3-card{transition:transform .22s,box-shadow .22s,border-color .22s}
      .g3-card:hover{transform:translateY(-5px)!important}
      .g3-chip{transition:all .15s;cursor:pointer}
      .g3-chip:hover{transform:translateY(-1px)}
      .g3-del{transition:all .15s;cursor:pointer}
      .g3-del:hover{transform:scale(1.15);background:rgba(239,68,68,0.22)!important}
      .g3-task{transition:background .12s,transform .08s}
      .g3-task:hover{background:rgba(99,102,241,0.05)!important;transform:translateX(3px)}
      .g3-nav{transition:background .15s;cursor:pointer}
      .g3-sidebar{transition:width .28s cubic-bezier(.4,0,.2,1),min-width .28s;overflow:hidden;flex-shrink:0}
      .g3-hamb:hover{background:rgba(99,102,241,0.08)!important}
      .g3-btn{transition:all .15s;cursor:pointer}
      .g3-btn:hover{opacity:.82}
      *{box-sizing:border-box}
      ::-webkit-scrollbar{width:4px}
      ::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.28);border-radius:99px}
    `;
    document.head.appendChild(s);
  }
}

const AC = "#6366f1";
const SW = 260;
const GC = ["#6366f1","#f97316","#06b6d4","#a78bfa","#fbbf24","#34d399","#3b82f6","#ec4899"];
const GE = ["☕","🦋","⚛️","🔥","🎨","🚀","📚","🎯"];
type FT = "all"|"in-progress"|"pending"|"completed";

/* ══ SHIMMER ══ */
function Shimmer({pct,color,h=6}:{pct:number;color:string;h?:number}) {
  const x=useRef(new Animated.Value(-1)).current;
  useEffect(()=>{Animated.loop(Animated.timing(x,{toValue:2,duration:1800,useNativeDriver:true})).start();},[]);
  if(Platform.OS!=="web") return(
    <View style={{height:h,borderRadius:99,backgroundColor:"rgba(0,0,0,0.07)",overflow:"hidden"}}>
      <View style={{height:"100%",width:`${pct}%` as any,backgroundColor:color,borderRadius:99}}/>
    </View>
  );
  return(
    <View style={{height:h,borderRadius:99,backgroundColor:"rgba(0,0,0,0.07)",overflow:"hidden"} as any}>
      <View style={{height:"100%",width:`${pct}%`,backgroundColor:color,borderRadius:99,overflow:"hidden"} as any}>
        <Animated.View style={{position:"absolute",top:0,bottom:0,width:"45%",
          background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)",
          transform:[{translateX:x.interpolate({inputRange:[-1,2],outputRange:["-100%","280%"]})}],
        } as any}/>
      </View>
    </View>
  );
}

/* ══ RING ══ */
function Ring({pct,color,size=80}:{pct:number;color:string;size?:number}) {
  const r=(size/2)-7,circ=2*Math.PI*r;
  const [v,setV]=useState(0);
  useEffect(()=>{
    let f:any,s:number|null=null;
    const tick=(ts:number)=>{if(!s)s=ts;const p=Math.min((ts-s)/900,1);setV(Math.round(p*pct));if(p<1)f=requestAnimationFrame(tick);};
    f=requestAnimationFrame(tick);return()=>cancelAnimationFrame(f);
  },[pct]);
  const cx=size/2,cy=size/2,dash=(v/100)*circ;
  if(Platform.OS!=="web") return(
    <View style={{width:size,height:size,borderRadius:size/2,borderWidth:6,borderColor:color,alignItems:"center",justifyContent:"center"}}>
      <Text style={{fontSize:size*0.22,fontWeight:"900",color}}>{pct}%</Text>
    </View>
  );
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="6"/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
        style={{transition:"stroke-dasharray .9s ease"} as any}/>
      <text x={cx} y={cy+5} textAnchor="middle" fontSize={size*0.17} fontWeight="900" fill={color}>{v}%</text>
    </svg>
  );
}

/* ══ SIDEBAR ══ */
function Sidebar({dark,router,overallPct,done,total,name,role,synced}:any) {
  const bg=dark?"#0a0f20":"#fff",bdr=dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)";
  const tp=dark?"#eef2ff":"#0f172a",mu=dark?"rgba(238,242,255,0.45)":"rgba(15,23,42,0.45)";
  const NAV=[
    {i:"🏠",l:"Dashboard",r:"/dashboard"},
    {i:"📊",l:"Analytics",r:"/analytics"},
    {i:"🎯",l:"Goals",r:"/goals",a:true},
    {i:"🔔",l:"Reminders",r:"/notifications"},
    {i:"⚙️",l:"Settings",r:"/settings"},
  ];
  return(
    <View style={{width:SW,height:"100%" as any,paddingVertical:24,paddingHorizontal:16,borderRightWidth:1,borderRightColor:bdr,backgroundColor:bg,flexShrink:0}}>
      <View style={{flexDirection:"row",alignItems:"center",gap:12,marginBottom:36,paddingHorizontal:8}}>
        <View style={{width:56,height:56,borderRadius:28,alignItems:"center",justifyContent:"center",
          ...(Platform.OS==="web"?{filter:"drop-shadow(0 4px 12px rgba(99,102,241,0.35))",animation:"g3-glow 3s ease-in-out infinite"} as any:{})}}>
          <SkillPathLogo size={48}/>
        </View>
        <View>
          <Text style={{fontSize:16,fontWeight:"900",letterSpacing:-.5,
            ...(Platform.OS==="web"?({background:"linear-gradient(90deg,#FF5C5C,#FFCA3A,#14D9C5)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"} as any):{color:"#FF5C5C"})}}>SkillPath</Text>
          <Text style={{fontSize:11,fontWeight:"500",color:mu}}>Learning Companion</Text>
        </View>
      </View>
      <Text style={{fontSize:11,fontWeight:"700",letterSpacing:1,color:mu,marginBottom:10,paddingLeft:8,textTransform:"uppercase" as const}}>NAVIGATION</Text>
      {NAV.map((n,i)=>(
        <Pressable key={i} className={Platform.OS==="web"?"g3-nav":undefined} onPress={()=>router.push(n.r)}
          style={({pressed})=>({flexDirection:"row",alignItems:"center",gap:12,paddingVertical:12,paddingHorizontal:12,borderRadius:12,marginBottom:4,position:"relative",
            backgroundColor:n.a?(dark?"rgba(99,102,241,0.14)":"rgba(99,102,241,0.08)"):"transparent",opacity:pressed?.75:1})}>
          <Text style={{fontSize:16}}>{n.i}</Text>
          <Text style={{fontSize:14,flex:1,fontWeight:n.a?"700":"500",color:n.a?AC:tp}}>{n.l}</Text>
          {n.a&&<View style={{width:4,height:20,backgroundColor:AC,borderRadius:99,...(Platform.OS==="web"?{boxShadow:"0 0 8px rgba(99,102,241,0.5)"} as any:{})}}/>}
        </Pressable>
      ))}
      <View style={{flex:1}}/>
      <View style={{borderRadius:16,padding:16,marginBottom:14,borderWidth:1,borderColor:bdr,backgroundColor:dark?"rgba(99,102,241,0.08)":"rgba(99,102,241,0.06)"}}>
        <Text style={{fontSize:11,fontWeight:"700",letterSpacing:1,color:AC,marginBottom:10,textTransform:"uppercase" as const}}>OVERALL PROGRESS</Text>
        <View style={{flexDirection:"row",alignItems:"center",gap:12,marginBottom:10}}>
          <View style={{width:52,height:52,borderRadius:26,alignItems:"center",justifyContent:"center",
            ...(Platform.OS==="web"?{background:`conic-gradient(#6366f1 ${overallPct*3.6}deg,${dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"} 0deg)`} as any:{borderWidth:5,borderColor:AC})}}>
            <View style={{width:40,height:40,borderRadius:20,alignItems:"center",justifyContent:"center",backgroundColor:dark?"#0a0f20":"#f5f7ff"}}>
              <Text style={{fontSize:11,fontWeight:"800",color:AC}}>{overallPct}%</Text>
            </View>
          </View>
          <View>
            <Text style={{fontSize:20,fontWeight:"900",color:tp,...(Platform.OS==="web"?{fontFamily:"Outfit,sans-serif"} as any:{})}}>{done}<Text style={{fontSize:13,fontWeight:"500",color:mu}}>/{total}</Text></Text>
            <Text style={{fontSize:11,fontWeight:"500",color:mu}}>tasks done</Text>
          </View>
        </View>
        <Shimmer pct={overallPct} color={AC} h={5}/>
      </View>
      <View style={{flexDirection:"row",alignItems:"center",gap:10,padding:12,borderRadius:14,borderWidth:1,borderColor:bdr,backgroundColor:dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"}}>
        <View style={{width:36,height:36,borderRadius:12,alignItems:"center",justifyContent:"center",
          ...(Platform.OS==="web"?{background:"linear-gradient(135deg,#f97316,#ef4444)"} as any:{backgroundColor:"#f97316"})}}>
          <Text style={{color:"white",fontWeight:"800",fontSize:15}}>{(name||"U").charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{flex:1}}>
          <Text style={{fontSize:13,fontWeight:"700",color:tp}} numberOfLines={1}>{name||"User"}</Text>
          <Text style={{fontSize:11,fontWeight:"500",color:mu}}>{role||"Learner"}</Text>
        </View>
        <View style={{width:8,height:8,borderRadius:4,backgroundColor:synced?"#34d399":"#f87171",...(Platform.OS==="web"?{animation:"g3-pulse 2s infinite"} as any:{})}}/>
      </View>
    </View>
  );
}

/* ══ TOPBAR ══ */
function TopBar({dark,open,setOpen,toggleDark,router,name,pending}:any) {
  const bg=dark?"#0a0f20":"#fff",bdr=dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)";
  const tp=dark?"#eef2ff":"#0f172a",mu=dark?"rgba(238,242,255,0.5)":"rgba(15,23,42,0.5)";
  const [time,setTime]=useState(()=>new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}));
  const [sec,setSec]=useState(()=>new Date().getSeconds());
  useEffect(()=>{
    const t=setInterval(()=>{const n=new Date();setTime(n.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}));setSec(n.getSeconds());},1000);
    return()=>clearInterval(t);
  },[]);
  return(
    <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:28,height:70,borderBottomWidth:1,borderBottomColor:bdr,backgroundColor:bg,flexShrink:0,...(Platform.OS==="web"?{position:"sticky",top:0,zIndex:200} as any:{})}}>
      <View style={{flexDirection:"row",alignItems:"center",gap:14}}>
        <Pressable className={Platform.OS==="web"?"g3-hamb":undefined} onPress={()=>setOpen((s:boolean)=>!s)}
          style={{width:36,height:36,borderRadius:10,alignItems:"center",justifyContent:"center",borderWidth:1,
            backgroundColor:open?(dark?"rgba(99,102,241,0.14)":"rgba(99,102,241,0.08)"):"transparent",
            borderColor:dark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)"}}>
          <View style={{gap:4}}>
            {[{w:open?14:18},{w:14},{w:open?18:10}].map((l,i)=>(
              <View key={i} style={{height:2,borderRadius:99,width:l.w,backgroundColor:open?AC:(dark?"rgba(238,242,255,0.6)":"rgba(15,23,42,0.5)")}}/>
            ))}
          </View>
        </Pressable>
        <View>
          <Text style={{fontSize:20,fontWeight:"900",letterSpacing:-.4,color:tp,...(Platform.OS==="web"?{fontFamily:"Outfit,sans-serif"} as any:{})}}>Goals</Text>
          <Text style={{fontSize:12,fontWeight:"500",marginTop:1,color:mu}}>Dashboard  ›  Goal Tracker</Text>
        </View>
      </View>
      {Platform.OS==="web"&&(
        <View style={{flexDirection:"row",alignItems:"center",gap:10}}>
          <View style={{flexDirection:"row",alignItems:"center",gap:10,paddingHorizontal:14,paddingVertical:9,borderRadius:14,borderWidth:1,borderColor:bdr,backgroundColor:dark?"rgba(255,255,255,0.03)":"rgba(99,102,241,0.03)"}}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <circle cx={12} cy={12} r={10} fill="none" stroke={dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)"} strokeWidth="2"/>
              <circle cx={12} cy={12} r={10} fill="none" stroke="#6366f1" strokeWidth="2"
                strokeDasharray={`${(sec/60)*62.8} 62.8`} strokeLinecap="round" transform="rotate(-90 12 12)"
                style={{transition:"stroke-dasharray 0.5s linear"} as any}/>
              <circle cx={12} cy={12} r={2} fill="#6366f1"/>
            </svg>
            <View>
              <Text style={{fontSize:13,fontWeight:"800",color:tp,letterSpacing:-.3}}>{time}</Text>
              <Text style={{fontSize:10,fontWeight:"500",color:mu}}>{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</Text>
            </View>
          </View>
          <Pressable onPress={toggleDark} style={{width:44,height:26,borderRadius:99,backgroundColor:dark?AC:"rgba(0,0,0,0.1)",justifyContent:"center",position:"relative",cursor:"pointer"} as any}>
            <View style={{position:"absolute",top:3,left:dark?21:3,width:20,height:20,borderRadius:10,backgroundColor:"white",alignItems:"center",justifyContent:"center",...(Platform.OS==="web"?{transition:"left .25s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"} as any:{})}}>
              <Text style={{fontSize:11}}>{dark?"🌙":"☀️"}</Text>
            </View>
          </Pressable>
          {pending>0&&(
            <Pressable onPress={()=>router.push("/notifications")}
              style={{flexDirection:"row",alignItems:"center",gap:6,paddingHorizontal:12,paddingVertical:7,borderRadius:12,backgroundColor:"rgba(239,68,68,0.1)",borderWidth:1,borderColor:"rgba(239,68,68,0.2)",cursor:"pointer"} as any}>
              <View style={{width:6,height:6,borderRadius:3,backgroundColor:"#ef4444",...(Platform.OS==="web"?{animation:"g3-pulse 1.5s infinite"} as any:{})}}/>
              <Text style={{fontSize:12,fontWeight:"700",color:"#ef4444"}}>{pending} pending</Text>
            </Pressable>
          )}
          <Pressable onPress={()=>router.push("/profile")}
            style={[{width:40,height:40,borderRadius:20,alignItems:"center",justifyContent:"center"},
              Platform.OS==="web"?({background:"linear-gradient(135deg,#f97316,#ef4444)",boxShadow:"0 3px 14px rgba(239,68,68,0.35)",cursor:"pointer"} as any):{backgroundColor:"#f97316"}]}>
            <Text style={{color:"white",fontWeight:"900",fontSize:15}}>{(name||"U").charAt(0).toUpperCase()}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}


/* ════════════════════════════════
   CONFIRM DELETE MODAL
════════════════════════════════ */
function ConfirmDeleteModal({
  dark,
  title,
  subtitle,
  itemName,
  itemIcon,
  onConfirm,
  onCancel,
}: {
  dark: boolean;
  title: string;
  subtitle: string;
  itemName: string;
  itemIcon: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {

   const { width } = useWindowDimensions(); 
  const isMobile = Platform.OS !== "web" || width < 480; 
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const btnScale1 = useRef(new Animated.Value(1)).current;
  const btnScale2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 75, friction: 10 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 75, friction: 10 }),
    ]).start();
    setTimeout(() => {
      Animated.spring(iconScale, { toValue: 1, useNativeDriver: true, tension: 140, friction: 7 }).start();
    }, 160);
  }, []);

  const dismiss = (cb: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 170, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 18, duration: 170, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 170, useNativeDriver: true }),
    ]).start(() => cb());
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const tapBtn = (anim: Animated.Value, cb: () => void) => {
    Animated.sequence([
      Animated.spring(anim, { toValue: 0.95, useNativeDriver: true, tension: 300, friction: 5 }),
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 5 }),
    ]).start(() => dismiss(cb));
  };

  const card = dark ? "#0d1424" : "#ffffff";
  const txtPri = dark ? "#eef2ff" : "#0f172a";
  const txtSec = dark ? "rgba(238,242,255,0.55)" : "#475569";
  const border = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

return (
  <View style={[
    StyleSheet.absoluteFill, 
    { 
      zIndex: 99999,
      position: Platform.OS === "web" ? "fixed" as any : "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    }
  ] as any}>
    {/* Blurred backdrop */}
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: dark ? "rgba(0,0,0,0.75)" : "rgba(15,23,42,0.45)",
          opacity: fadeAnim,
          ...(Platform.OS === "web"
            ? ({ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" } as any)
            : {}),
        },
      ]}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={() => { shake(); }} />
    </Animated.View>

      <View
  style={{ 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center", 
    padding: isMobile ? 20 : 24,
  }}
  pointerEvents="box-none"
>
  <Animated.View
    style={[
      {
        width: isMobile ? "92%" : 420,
        maxWidth: isMobile ? 420 : 420,
        backgroundColor: card,
        borderRadius: isMobile ? 22 : 26,
        padding: isMobile ? 22 : 28,
              borderWidth: 1,
              borderColor: "rgba(239,68,68,0.2)",
              borderTopColor: "#ef4444",
              borderTopWidth: 3,
              ...(Platform.OS === "web"
                ? ({
                    boxShadow: dark
                      ? "0 28px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(239,68,68,0.1)"
                      : "0 28px 60px rgba(0,0,0,0.14), 0 0 0 1px rgba(239,68,68,0.08)",
                  } as any)
                : { elevation: 28 }),
            },
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
                { translateX: shakeAnim },
              ],
            },
          ]}
        >
          {/* Icon */}
          <Animated.View style={{ alignSelf: "center", marginBottom: 20, transform: [{ scale: iconScale }] }}>
           <View
  style={{
    width: isMobile ? 64 : 76,
    height: isMobile ? 64 : 76,
    borderRadius: isMobile ? 20 : 24,
                alignItems: "center", justifyContent: "center",
                backgroundColor: "rgba(239,68,68,0.1)",
                borderWidth: 1.5, borderColor: "rgba(239,68,68,0.25)",
                ...(Platform.OS === "web"
                  ? ({ boxShadow: "0 0 0 10px rgba(239,68,68,0.06), 0 8px 24px rgba(239,68,68,0.2)" } as any)
                  : {}),
              }}
            >
              <Text style={{ fontSize: isMobile ? 28 : 34 }}>🗑️</Text>
            </View>
          </Animated.View>

          {/* Text */}
          <Text
  style={{
    fontSize: isMobile ? 18 : 21, fontWeight: "800", color: txtPri,
              textAlign: "center", marginBottom: 8, letterSpacing: -0.4,
              ...(Platform.OS === "web" ? ({ fontFamily: "Outfit,sans-serif" } as any) : {}),
            }}
          >
            {title}
          </Text>
       <Text
  style={{
    fontSize: isMobile ? 12 : 13,
    lineHeight: isMobile ? 17 : 19, fontWeight: "500", color: txtSec,
              textAlign: "center",marginBottom: 18,
            }}
          >
            {subtitle}
          </Text>

          {/* Item pill */}
         <View
  style={{
    backgroundColor: "rgba(239,68,68,0.07)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    borderRadius: isMobile ? 12 : 14,
    paddingHorizontal: isMobile ? 14 : 18,
    paddingVertical: isMobile ? 11 : 13,
              marginBottom: 20, flexDirection: "row", alignItems: "center", gap: 10,
            }}
          >
            <Text style={{ fontSize: isMobile ? 18 : 20 }}>{itemIcon}</Text>
<Text
  style={{ 
    fontSize: isMobile ? 13 : 14,  fontWeight: "700", color: "#ef4444", flex: 1 }}
              numberOfLines={2}
            >
              {itemName}
            </Text>
            <View
              style={{
                backgroundColor: "rgba(239,68,68,0.12)",
                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
              }}
            >
              <Text style={{ fontSize: 10, color: "#ef4444", fontWeight: "700" }}>Delete</Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: border, marginBottom: 18 }} />

          {/* Buttons */}
          <View style={{ gap: 10 }}>
            <Animated.View style={{ transform: [{ scale: btnScale1 }] }}>
              <Pressable
  onPress={() => tapBtn(btnScale1, onConfirm)}
  style={({ pressed }) => ({
    paddingVertical: isMobile ? 13 : 15,
    borderRadius: isMobile ? 12 : 14, alignItems: "center",
                  backgroundColor: "#ef4444", opacity: pressed ? 0.88 : 1,
                  ...(Platform.OS === "web"
                    ? ({
                        background: "linear-gradient(135deg,#ef4444,#dc2626)",
                        boxShadow: "0 6px 20px rgba(239,68,68,0.4)",
                        cursor: "pointer", transition: "all .15s",
                      } as any)
                    : {}),
                })}
              >
                <Text style={{
  color: "white",
  fontWeight: "800",
  fontSize: isMobile ? 14 : 15,  
  letterSpacing: 0.1,
  ...(Platform.OS === "web" ? ({ fontFamily: "Outfit,sans-serif" } as any) : {}),
}}>
  🗑️  Yes, Delete
</Text>
              </Pressable>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: btnScale2 }] }}>
              <Pressable
                onPress={() => tapBtn(btnScale2, onCancel)}
                style={({ pressed }) => ({
                  paddingVertical: 13, borderRadius: 14, alignItems: "center",
                  backgroundColor: pressed
                    ? dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)"
                    : dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  borderWidth: 1, borderColor: border,
                  ...(Platform.OS === "web" ? ({ cursor: "pointer", transition: "all .15s" } as any) : {}),
                })}
              >
               <Text style={{ 
  color: txtSec, 
  fontWeight: "600", 
  fontSize: isMobile ? 13 : 14  
}}>
  Cancel, Keep It
</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

/* ══ GOAL MODAL ══ */
function GoalModal({
  goal, accent, gIdx, dark, onClose, onDelGoal, onDelTask,
  onEditGoal, onEditTask, router,
  setConfirmDeleteGoal,  
  setConfirmDeleteTask, 
}: {
  goal: any; accent: string; gIdx: number; dark: boolean;
  onClose: () => void;
  onDelGoal: () => void;
  onDelTask: (goalId: string, taskId: string, taskTitle: string, goalName: string) => void;
  onEditGoal: (goalId: string, newName: string) => Promise<void>;
  onEditTask: (goalId: string, taskId: string, newTitle: string) => Promise<void>;
  router: any;
  setConfirmDeleteGoal: (v: any) => void;  
  setConfirmDeleteTask: (v: any) => void;  
}) {
  const [editName,setEditName]=useState(false);
  const [nameDraft,setNameDraft]=useState(goal.name);
  const [editTaskId,setEditTaskId]=useState<string|null>(null);


  const [taskDraft,setTaskDraft]=useState("");
  const [saving,setSaving]=useState(false);
  const fa=useRef(new Animated.Value(0)).current;
  const sa=useRef(new Animated.Value(0.9)).current;

  const card=dark?"#0d1424":"#fff";
  const tp=dark?"#eef2ff":"#0f172a";
  const ts=dark?"rgba(238,242,255,0.55)":"#475569";
  const tm=dark?"rgba(238,242,255,0.28)":"rgba(15,23,42,0.3)";
  const bdr=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)";

  const done=goal.tasks.filter((t:any)=>t.completed).length;
  const total=goal.tasks.length;
  const pct=total>0?Math.round((done/total)*100):0;
  const pTasks=goal.tasks.filter((t:any)=>!t.completed);
  const cTasks=goal.tasks.filter((t:any)=>t.completed);

  useEffect(()=>{
    Animated.parallel([
      Animated.timing(fa,{toValue:1,duration:220,useNativeDriver:true}),
      Animated.spring(sa,{toValue:1,useNativeDriver:true,tension:75,friction:10}),
    ]).start();
  },[]);

  const dismiss=(cb?:()=>void)=>{
    Animated.parallel([
      Animated.timing(fa,{toValue:0,duration:170,useNativeDriver:true}),
      Animated.timing(sa,{toValue:0.9,duration:170,useNativeDriver:true}),
    ]).start(()=>{ onClose(); cb&&cb(); });
  };

  const saveGoalName=async()=>{
    if(!nameDraft.trim()){showError("Name cannot be empty");return;}
    setSaving(true);
    await onEditGoal(goal.id,nameDraft.trim());
    setSaving(false);
    setEditName(false);
  };

  const saveTask=async(taskId:string)=>{
    if(!taskDraft.trim()){showError("Task cannot be empty");return;}
    await onEditTask(goal.id,taskId,taskDraft.trim());
    setEditTaskId(null);
  };

  return(
    <View style={[StyleSheet.absoluteFill,{zIndex:3000}] as any}>
      <Animated.View style={[StyleSheet.absoluteFill,{
        backgroundColor:dark?"rgba(0,0,0,0.82)":"rgba(15,23,42,0.55)",opacity:fa,
        ...(Platform.OS==="web"?{backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)"} as any:{}),
      }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={()=>dismiss()}/>
      </Animated.View>
      <View style={{flex:1,alignItems:"center",justifyContent:"center",padding:20}} pointerEvents="box-none">
        <Animated.View style={{width:"100%",maxWidth:580,maxHeight:"88%",
          backgroundColor:card,borderRadius:24,borderWidth:1,borderColor:accent+"30",
          borderTopColor:accent,borderTopWidth:3,
          opacity:fa,transform:[{scale:sa}],
          ...(Platform.OS==="web"?{boxShadow:dark?"0 32px 80px rgba(0,0,0,0.75)":"0 32px 80px rgba(0,0,0,0.2)"} as any:{elevation:24}),
        }}>
          {/* Header */}
          <View style={{padding:22,borderBottomWidth:1,borderBottomColor:bdr}}>
            <View style={{flexDirection:"row",alignItems:"flex-start",gap:14}}>
              <View style={{width:52,height:52,borderRadius:16,backgroundColor:accent+"1c",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Text style={{fontSize:26}}>{goal.icon||GE[gIdx%GE.length]}</Text>
              </View>
              <View style={{flex:1}}>
                {editName?(
                  Platform.OS==="web"?(
                    <input value={nameDraft} onChange={(e:any)=>setNameDraft(e.target.value)}
                      onKeyDown={(e:any)=>{if(e.key==="Enter")saveGoalName();if(e.key==="Escape"){setEditName(false);setNameDraft(goal.name);}}}
                      autoFocus style={{fontSize:17,fontWeight:"700",fontFamily:"Outfit,sans-serif",border:"none",outline:"none",background:"transparent",color:dark?"#eef2ff":"#0f172a",width:"100%",borderBottom:`2px solid ${accent}`,paddingBottom:4} as any}/>
                  ):(
                    <TextInput value={nameDraft} onChangeText={setNameDraft} autoFocus
                      style={{fontSize:17,fontWeight:"700",color:tp,borderBottomWidth:2,borderBottomColor:accent,paddingVertical:4}}
                      onSubmitEditing={saveGoalName}/>
                  )
                ):(
                  <Text style={{fontSize:17,fontWeight:"800",color:tp,letterSpacing:-.3,...(Platform.OS==="web"?{fontFamily:"Outfit,sans-serif"} as any:{})}}>{nameDraft}</Text>
                )}
                <Text style={{fontSize:12,color:ts,marginTop:4,fontWeight:"500"}}>{done}/{total} tasks · {pct}% complete</Text>
              </View>
              <View style={{flexDirection:"row",gap:7,flexShrink:0}}>
                <Pressable onPress={()=>{if(editName)saveGoalName();else{setNameDraft(goal.name);setEditName(true);}}}
                  className={Platform.OS==="web"?"g3-btn":undefined}
                  style={({pressed})=>({width:34,height:34,borderRadius:10,backgroundColor:pressed?"rgba(99,102,241,0.2)":"rgba(99,102,241,0.1)",alignItems:"center",justifyContent:"center"})}>
                  <Text style={{fontSize:14}}>{editName?"✓":"✏️"}</Text>
                </Pressable>
                <Pressable 
  onPress={() => {
    dismiss(() => {
      setConfirmDeleteGoal({
        goalId: goal.id,
        goalName: goal.name,
        goalIcon: goal.icon || GE[gIdx % GE.length],
      });
    });
  }}
  className={Platform.OS === "web" ? "g3-del" : undefined}
  style={({ pressed }) => ({
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: pressed ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.1)",
    alignItems: "center",
    justifyContent: "center",
  })}
>
  <Text style={{ fontSize: 14 }}>🗑️</Text>
</Pressable>
                <Pressable onPress={()=>dismiss()}
                  style={({pressed})=>({width:34,height:34,borderRadius:10,backgroundColor:pressed?(dark?"rgba(255,255,255,0.14)":"rgba(0,0,0,0.09)"):(dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.04)"),alignItems:"center",justifyContent:"center"})}>
                  <Text style={{color:ts,fontSize:16,fontWeight:"700"}}>✕</Text>
                </Pressable>
              </View>
            </View>
            <View style={{marginTop:14}}><Shimmer pct={pct} color={accent} h={6}/></View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{flex:1}} contentContainerStyle={{padding:20}}>
            {/* Pending */}
            {pTasks.length>0&&(
              <View style={{marginBottom:20}}>
                <View style={{flexDirection:"row",alignItems:"center",gap:8,marginBottom:12}}>
                  <View style={{width:8,height:8,borderRadius:4,backgroundColor:"#f97316",...(Platform.OS==="web"?{animation:"g3-pulse 2s infinite"} as any:{})}}/>
                  <Text style={{fontSize:11,fontWeight:"700",color:"#f97316",letterSpacing:.5,textTransform:"uppercase" as const}}>Pending · {pTasks.length}</Text>
                </View>
                {pTasks.map((t:any,ti:number)=>(
                  <View key={t.id} className={Platform.OS==="web"?"g3-task":undefined}
                    style={{flexDirection:"row",alignItems:"center",gap:10,padding:13,borderRadius:12,marginBottom:7,
                      backgroundColor:dark?"rgba(249,115,22,0.06)":"rgba(249,115,22,0.04)",
                      borderWidth:1,borderColor:"rgba(249,115,22,0.2)",
                      ...(Platform.OS==="web"?{animation:`g3-slide .2s ease ${ti*.04}s both`} as any:{}),
                    }}>
                    <View style={{width:18,height:18,borderRadius:5,borderWidth:1.5,borderColor:"rgba(249,115,22,0.5)",flexShrink:0}}/>
                    <View style={{flex:1}}>
                      {editTaskId===t.id?(
                        Platform.OS==="web"?(
                          <input value={taskDraft} onChange={(e:any)=>setTaskDraft(e.target.value)}
                            onKeyDown={(e:any)=>{if(e.key==="Enter")saveTask(t.id);if(e.key==="Escape")setEditTaskId(null);}}
                            autoFocus style={{fontSize:13,fontWeight:"500",border:"none",outline:"none",background:"transparent",color:dark?"#eef2ff":"#0f172a",width:"100%",borderBottom:`1.5px solid ${accent}`} as any}/>
                        ):(
                          <TextInput value={taskDraft} onChangeText={setTaskDraft} autoFocus
                            style={{fontSize:13,fontWeight:"500",color:tp}}
                            onSubmitEditing={()=>saveTask(t.id)}/>
                        )
                      ):(
                        <Text style={{fontSize:13,fontWeight:"600",color:tp}} numberOfLines={2}>{t.title}</Text>
                      )}
                    </View>
                    <View style={{flexDirection:"row",gap:6,flexShrink:0}}>
                      <Pressable onPress={()=>{if(editTaskId===t.id){saveTask(t.id);}else{setTaskDraft(t.title);setEditTaskId(t.id);}}}
                        className={Platform.OS==="web"?"g3-btn":undefined}
                        style={({pressed})=>({width:28,height:28,borderRadius:8,backgroundColor:pressed?"rgba(99,102,241,0.2)":"rgba(99,102,241,0.1)",alignItems:"center",justifyContent:"center"})}>
                        <Text style={{fontSize:11}}>{editTaskId===t.id?"✓":"✏️"}</Text>
                      </Pressable>
                     <Pressable 
  onPress={() => {
    setConfirmDeleteTask({
      goalId: goal.id,
      taskId: t.id,
      taskTitle: t.title,
      goalName: goal.name,
    });
  }}
  className={Platform.OS === "web" ? "g3-del" : undefined}
  style={({ pressed }) => ({
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: pressed ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.08)",
    alignItems: "center",
    justifyContent: "center",
  })}
>
  <Text style={{ fontSize: 11, color: "#ef4444" }}>✕</Text>
</Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Completed */}
            {cTasks.length>0&&(
              <View style={{marginBottom:16}}>
                <View style={{flexDirection:"row",alignItems:"center",gap:8,marginBottom:12}}>
                  <View style={{width:8,height:8,borderRadius:4,backgroundColor:"#34d399"}}/>
                  <Text style={{fontSize:11,fontWeight:"700",color:"#34d399",letterSpacing:.5,textTransform:"uppercase" as const}}>Completed · {cTasks.length}</Text>
                </View>
                {cTasks.map((t:any,ti:number)=>(
            <View key={t.id} style={{flexDirection:"row",alignItems:"center",gap:10,padding:13,borderRadius:12,marginBottom:7,
  backgroundColor:"rgba(52,211,153,0.04)",borderWidth:1,borderColor:"rgba(52,211,153,0.15)",opacity:.75,
  ...(Platform.OS==="web"?{animation:`g3-slide .2s ease ${ti*.03}s both`} as any:{})}}>
  <View style={{width:18,height:18,borderRadius:5,backgroundColor:"#34d399",borderColor:"#34d399",borderWidth:1.5,alignItems:"center",justifyContent:"center",flexShrink:0}}>
    <Text style={{color:"white",fontSize:8,fontWeight:"800"}}>✓</Text>
  </View>
  <Text style={{flex:1,fontSize:13,fontWeight:"500",color:ts,textDecorationLine:"line-through"}} numberOfLines={1}>{t.title}</Text>
  
  {/* for delete */}
  <Pressable 
    onPress={() => {
      setConfirmDeleteTask({
        goalId: goal.id,
        taskId: t.id,
        taskTitle: t.title,
        goalName: goal.name,
      });
    }}
    className={Platform.OS === "web" ? "g3-del" : undefined}
    style={({ pressed }) => ({
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: pressed ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.08)",
      alignItems: "center",
      justifyContent: "center",
    })}
  >
    <Text style={{ fontSize: 11, color: "#ef4444" }}>✕</Text>
  </Pressable>
</View>
                ))}
              </View>
            )}

            {total===0&&(
              <View style={{alignItems:"center",paddingVertical:32}}>
                <Text style={{fontSize:32,marginBottom:10}}>📋</Text>
                <Text style={{fontSize:14,fontWeight:"700",color:ts}}>No tasks yet</Text>
                <Text style={{fontSize:12,color:tm,marginTop:4}}>Add tasks from the dashboard</Text>
              </View>
            )}

            <Pressable onPress={()=>dismiss(()=>router.push("/dashboard"))}
              style={({pressed})=>({marginTop:12,paddingVertical:12,borderRadius:12,borderWidth:1,alignItems:"center",
                backgroundColor:pressed?(dark?"rgba(99,102,241,0.15)":"rgba(99,102,241,0.1)"):(dark?"rgba(99,102,241,0.07)":"rgba(99,102,241,0.05)"),
                borderColor:dark?"rgba(99,102,241,0.2)":"rgba(99,102,241,0.14)"})}>
              <Text style={{fontSize:13,fontWeight:"700",color:AC}}>➕ Add Tasks on Dashboard →</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}

/* ════════════════════ MAIN PAGE ════════════════════ */
export default function GoalsPage() {
  const router=useRouter();
  const taskCtx=useContext(TaskContext);
  const authCtx=useContext(AuthContext);
  if(!taskCtx||!authCtx||!authCtx.user) return null;

  const {goals,getOverallProgress}=taskCtx;
  const user=authCtx.user;

  const [dark,setDark]=useState<boolean|null>(null);
  const [sidebarOpen,setSidebarOpen]=useState(true);
  const [streak,setStreak]=useState(0);
  const [role,setRole]=useState("Learner");
  const [synced]=useState(true);
  const [filter,setFilter]=useState<FT>("all");
  const [modalId,setModalId]=useState<string|null>(null);

  const [confirmDeleteGoal, setConfirmDeleteGoal] = useState<{
  goalId: string;
  goalName: string;
  goalIcon: string;
} | null>(null);

const [confirmDeleteTask, setConfirmDeleteTask] = useState<{
  goalId: string;
  taskId: string;
  taskTitle: string;
  goalName: string;
} | null>(null);

  const fa=useRef(new Animated.Value(0)).current;
  const sa=useRef(new Animated.Value(18)).current;

  useEffect(()=>{loadTheme().then(setDark);},[]);
  useEffect(()=>{
    if(!authCtx.user?.uid) return;
    const u=onSnapshot(doc(db,"users",authCtx.user.uid),(s)=>{
      if(s.exists()){setStreak(s.data().streak||0);setRole(s.data().role||"Learner");}
    });
    return u;
  },[authCtx.user?.uid]);
  useEffect(()=>{
    Animated.parallel([
      Animated.spring(sa,{toValue:0,useNativeDriver:true,tension:65,friction:10}),
      Animated.timing(fa,{toValue:1,duration:450,useNativeDriver:true}),
    ]).start();
  },[]);

  const toggleDark=async()=>{const n=!dark;setDark(n);await saveTheme(n);};

  /* ── Firestore edit helpers ── */
/* ── Firestore edit helpers ── */
const handleEditGoal = async (goalId: string, newName: string) => {
  try {
    // ✅ Use TaskContext method to ensure all components sync
    await taskCtx.updateGoal(goalId, { name: newName });
    showSuccess("Goal updated ✓");
  } catch {
    showError("Failed to update goal");
  }
};

const handleEditTask = async (goalId: string, taskId: string, newTitle: string) => {
  try {
    
    await taskCtx.updateTask(goalId, taskId, newTitle);
    showSuccess("Task updated ✓");
  } catch {
    showError("Failed to update task");
  }
};

const handleDelGoal = (id: string) => {
  if ((taskCtx as any).deleteGoal) (taskCtx as any).deleteGoal(id);
  showDelete("Goal removed");
  if (modalId === id) setModalId(null);
};

const handleDelTask = (goalId: string, taskId: string) => {
  if ((taskCtx as any).deleteTask) (taskCtx as any).deleteTask(goalId, taskId);
  showDelete("Task removed");
};

  /* ── Computed ── */
  const totalGoals=goals.length;
  const totalTasks=goals.reduce((a:number,g:any)=>a+g.tasks.length,0);
  const doneTasks=goals.reduce((a:number,g:any)=>a+g.tasks.filter((t:any)=>t.completed).length,0);
  const pendingTasks=totalTasks-doneTasks;
  const pct=getOverallProgress();
  const displayName=authCtx.userData?.displayName||user.displayName||user.email||"User";
  const isDark=!!dark;

  /* ── Filter ── */
  const fGoals=goals.filter((g:any)=>{
    const d=g.tasks.filter((t:any)=>t.completed).length,tot=g.tasks.length;
    const p=tot>0?(d/tot)*100:0;
    if(filter==="all") return true;
    if(filter==="completed") return p===100;
    if(filter==="pending") return d===0;
    if(filter==="in-progress") return p>0&&p<100;
    return true;
  });
  const fCount=(key:FT)=>goals.filter((g:any)=>{
    const d=g.tasks.filter((t:any)=>t.completed).length,tot=g.tasks.length;
    const p=tot>0?(d/tot)*100:0;
    if(key==="all") return true;
    if(key==="completed") return p===100;
    if(key==="pending") return d===0;
    if(key==="in-progress") return p>0&&p<100;
    return true;
  }).length;

  /* ── Theme ── */
  const bg=isDark?"#080d18":"#eef1f8";
  const card=isDark?"#0d1424":"#fff";
  const tp=isDark?"#eef2ff":"#0f172a";
  const ts=isDark?"rgba(238,242,255,0.55)":"#475569";
  const tm=isDark?"rgba(238,242,255,0.28)":"rgba(15,23,42,0.3)";
  const cb=isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)";
  const sh=Platform.OS==="web"?{boxShadow:isDark?"0 2px 18px rgba(0,0,0,0.4)":"0 2px 14px rgba(0,0,0,0.06)"}:{elevation:3};

  const {width:W}=useWindowDimensions();
  const isWide=Platform.OS==="web"&&W>=960;
  const is3=Platform.OS==="web"&&W>=1300;
  const is2=Platform.OS==="web"&&W>=700;

  const FILTERS=[
    {k:"all" as FT,l:"All Goals",i:"🎯",c:"#6366f1"},
    {k:"in-progress" as FT,l:"In Progress",i:"⚡",c:"#f97316"},
    {k:"pending" as FT,l:"Not Started",i:"📋",c:"#06b6d4"},
    {k:"completed" as FT,l:"Completed",i:"✅",c:"#34d399"},
  ];

  const mGoal=modalId?goals.find((g:any)=>g.id===modalId):null;
  const mIdx=modalId?goals.findIndex((g:any)=>g.id===modalId):0;

  const content=(
    <View style={{flex:1,backgroundColor:bg}}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:56}}>
        <View style={{paddingHorizontal:24,paddingTop:28}}>

          {/* ── HEADER ── */}
          <Animated.View style={{opacity:fa,transform:[{translateY:sa}],marginBottom:24}}>
            <View style={{flexDirection:"row",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap" as const,gap:16,marginBottom:20}}>
              <View>
                <Text style={{fontSize:30,fontWeight:"900",color:tp,letterSpacing:-.8,marginBottom:5,...(Platform.OS==="web"?{fontFamily:"Outfit,sans-serif"} as any:{})}}>Goal Tracker</Text>
                <Text style={{fontSize:14,color:ts,fontWeight:"500",lineHeight:21}}>
                  {pendingTasks>0?`${pendingTasks} task${pendingTasks!==1?"s":""} remaining · ${totalGoals} goal${totalGoals!==1?"s":""}`:pct===100?"🏆 All goals completed! Excellent work.":"You're all caught up!"}
                </Text>
              </View>
              {/* Stat pills */}
              <View style={{flexDirection:"row",gap:10,flexWrap:"wrap" as const}}>
                {[
                  {v:totalGoals,l:"Goals",c:"#6366f1",bg:"rgba(99,102,241,0.1)"},
                  {v:doneTasks,l:"Done",c:"#34d399",bg:"rgba(52,211,153,0.1)"},
                  {v:pendingTasks,l:"Pending",c:"#f97316",bg:"rgba(249,115,22,0.1)"},
                  {v:streak,l:"Streak 🔥",c:"#ef4444",bg:"rgba(239,68,68,0.08)"},
                ].map((s,i)=>(
                  <View key={i} style={{borderRadius:16,paddingVertical:11,paddingHorizontal:16,alignItems:"center",backgroundColor:s.bg,minWidth:74,
                    ...(Platform.OS==="web"?{animation:`g3-up .45s ease ${i*.1}s both`,boxShadow:`0 2px 12px ${s.c}20`} as any:{})}}>
                    <Text style={{fontSize:22,fontWeight:"900",color:s.c,...(Platform.OS==="web"?{fontFamily:"Outfit,sans-serif"} as any:{})}}>{s.v}</Text>
                    <Text style={{fontSize:10,color:s.c,fontWeight:"600",opacity:.8,marginTop:2}}>{s.l}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Progress bar card */}
            <View style={{backgroundColor:card,borderRadius:16,padding:18,borderWidth:1,borderColor:cb,...sh}}>
              <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <View style={{flexDirection:"row",alignItems:"center",gap:10}}>
                  <Text style={{fontSize:13,fontWeight:"700",color:tp}}>Overall Progress</Text>
                  <View style={{backgroundColor:AC+"14",borderRadius:99,paddingHorizontal:9,paddingVertical:3,borderWidth:1,borderColor:AC+"22"}}>
                    <Text style={{fontSize:10,fontWeight:"800",color:AC}}>{doneTasks}/{totalTasks} tasks</Text>
                  </View>
                </View>
                <Text style={{fontSize:26,fontWeight:"900",color:AC,...(Platform.OS==="web"?{fontFamily:"Outfit,sans-serif"} as any:{})}}>{pct}%</Text>
              </View>
              <Shimmer pct={pct} color={AC} h={8}/>
            </View>
          </Animated.View>

          {/* ── FILTERS ── */}
          <Animated.View style={{opacity:fa,flexDirection:"row",flexWrap:"wrap" as const,gap:10,marginBottom:28}}>
            {FILTERS.map((f)=>{
              const act=filter===f.k,cnt=fCount(f.k);
              return(
                <Pressable key={f.k} className={Platform.OS==="web"?"g3-chip":undefined}
                  onPress={()=>setFilter(f.k)}
                  style={[{flexDirection:"row",alignItems:"center",gap:7,paddingHorizontal:17,paddingVertical:10,borderRadius:99,borderWidth:1.5,
                    backgroundColor:act?f.c:(isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.04)"),
                    borderColor:act?f.c:cb,
                  },Platform.OS==="web"&&act?{boxShadow:`0 4px 18px ${f.c}44`} as any:{}]}>
                  <Text style={{fontSize:14}}>{f.i}</Text>
                  <Text style={{fontSize:13,fontWeight:"700",color:act?"white":ts}}>{f.l}</Text>
                  <View style={{paddingHorizontal:8,paddingVertical:2,borderRadius:99,minWidth:22,alignItems:"center",
                    backgroundColor:act?"rgba(255,255,255,0.22)":(isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)")}}>
                    <Text style={{fontSize:10,fontWeight:"800",color:act?"white":ts}}>{cnt}</Text>
                  </View>
                </Pressable>
              );
            })}
          </Animated.View>

          {/* ── CARDS ── */}
          {fGoals.length===0?(
            <Animated.View style={{opacity:fa,backgroundColor:card,borderRadius:22,padding:52,alignItems:"center",borderWidth:1,borderColor:cb,...sh}}>
              <Text style={{fontSize:46,marginBottom:14}}>🎯</Text>
              <Text style={{fontSize:18,fontWeight:"800",color:tp,marginBottom:8,...(Platform.OS==="web"?{fontFamily:"Outfit,sans-serif"} as any:{})}}>
                {filter==="all"?"No goals yet":`No ${filter.replace("-"," ")} goals`}
              </Text>
              <Text style={{fontSize:14,color:ts,textAlign:"center" as const,lineHeight:22}}>
                {filter==="all"?"Head to the dashboard to create your first goal":"Try a different filter"}
              </Text>
              {filter!=="all"&&(
                <Pressable onPress={()=>setFilter("all")} style={({pressed})=>({marginTop:22,backgroundColor:AC,paddingHorizontal:26,paddingVertical:13,borderRadius:13,opacity:pressed?.85:1,...(Platform.OS==="web"?{boxShadow:"0 4px 18px rgba(99,102,241,0.4)"} as any:{})})}>
                  <Text style={{color:"white",fontWeight:"700",fontSize:14}}>View All Goals</Text>
                </Pressable>
              )}
            </Animated.View>
          ):(
            <View style={is3?{flexDirection:"row",flexWrap:"wrap" as const,gap:18,alignItems:"flex-start"}:is2?{flexDirection:"row",flexWrap:"wrap" as const,gap:16,alignItems:"flex-start"}:{gap:16}}>
              {fGoals.map((g:any,idx:number)=>{
                const accent=GC[idx%GC.length];
                const d=g.tasks.filter((t:any)=>t.completed).length;
                const tot=g.tasks.length;
                const p=tot>0?Math.round((d/tot)*100):0;
                const pend=g.tasks.filter((t:any)=>!t.completed).length;
                const sl=p===100?"✓ Complete":d===0&&tot>0?"Not started":`${pend} pending`;
                const sc=p===100?"#34d399":d===0&&tot>0?"#f97316":AC;

                return(
                  <Animated.View key={g.id} className={Platform.OS==="web"?"g3-card":undefined}
                    style={[{backgroundColor:card,borderRadius:22,borderWidth:1,borderColor:cb,
                      borderTopColor:accent,borderTopWidth:3,position:"relative",overflow:"hidden",
                      ...(is3?{width:"calc(33.33% - 12px)"}:is2?{width:"calc(50% - 8px)"}:{width:"100%"}),
                    },sh,Platform.OS==="web"?{animation:`g3-up .4s ease ${idx*.07}s both`,
                      boxShadow:isDark?`0 4px 24px rgba(0,0,0,0.38)`:`0 4px 28px ${accent}12`} as any:{}]}>

                    {/* Glow bg */}
                    {Platform.OS==="web"&&(
                      <View pointerEvents="none" style={{position:"absolute",top:-24,right:-24,width:130,height:130,borderRadius:65,backgroundColor:accent,opacity:.04,filter:"blur(28px)"} as any}/>
                    )}

                   {/* Goal header action buttons*/}
<View style={{ 
  flexDirection: "row", 
  gap: 8, 
  alignItems: "center", 
  justifyContent: "flex-end",
  paddingHorizontal: 22,
  paddingTop: 16,
  paddingBottom: 8,
}}>
  <Pressable
    className={Platform.OS === "web" ? "g3-btn" : undefined}
    onPress={() => setModalId(g.id)}
    style={({ pressed }) => ({
      flexDirection: "row", 
      alignItems: "center", 
      gap: 6,
      paddingHorizontal: 12, 
      paddingVertical: 7, 
      borderRadius: 10,
      backgroundColor: pressed ? accent + "28" : accent + "18",
      borderWidth: 1, 
      borderColor: accent + "40",
      ...(Platform.OS === "web" ? { transition: "all .15s", cursor: "pointer" } as any : {}),
    })}
  >
    <Text style={{ fontSize: 12, color: accent }}>✏️</Text>
    <Text style={{ fontSize: 12, fontWeight: "700", color: accent }}>Edit</Text>
  </Pressable>

  <Pressable
    className={Platform.OS === "web" ? "g3-btn" : undefined}
    onPress={() => setConfirmDeleteGoal({
      goalId: g.id,
      goalName: g.name,
      goalIcon: g.icon || GE[idx % GE.length],
    })}
    style={({ pressed }) => ({
      flexDirection: "row", 
      alignItems: "center", 
      gap: 6,
      paddingHorizontal: 12, 
      paddingVertical: 7, 
      borderRadius: 10,
      backgroundColor: pressed ? "rgba(239,68,68,0.28)" : "rgba(239,68,68,0.15)",
      borderWidth: 1, 
      borderColor: "rgba(239,68,68,0.35)",
      ...(Platform.OS === "web" ? { transition: "all .15s", cursor: "pointer" } as any : {}),
    })}
  >
    <Text style={{ fontSize: 12, color: "#ef4444", fontWeight: "700" }}>🗑 Delete</Text>
  </Pressable>
</View>


                    <View style={{padding:22}}>
                      {/* Icon + name */}
                      <Pressable onPress={()=>setModalId(g.id)} style={{flexDirection:"row",alignItems:"center",gap:13,marginBottom:20,paddingRight:0}}>
                        <View style={{width:50,height:50,borderRadius:15,backgroundColor:accent+"1c",alignItems:"center",justifyContent:"center",flexShrink:0,
                          ...(Platform.OS==="web"?{boxShadow:`0 4px 14px ${accent}28`} as any:{})}}>
                          <Text style={{fontSize:24}}>{g.icon||GE[idx%GE.length]}</Text>
                        </View>
                        <View style={{flex:1}}>
                          <Text style={{fontSize:15,fontWeight:"800",color:tp,letterSpacing:-.3,marginBottom:5,...(Platform.OS==="web"?{fontFamily:"Outfit,sans-serif"} as any:{})}} numberOfLines={1}>{g.name}</Text>
                          <View style={{flexDirection:"row",alignItems:"center",gap:6}}>
                            <View style={{width:5,height:5,borderRadius:3,backgroundColor:sc,...(Platform.OS==="web"?{animation:"g3-pulse 2s infinite"} as any:{})}}/>
                            <Text style={{fontSize:11,fontWeight:"700",color:sc}}>{sl}</Text>
                          </View>
                        </View>
                      </Pressable>

                      {/* Ring + stats */}
                      <Pressable onPress={()=>setModalId(g.id)} style={{flexDirection:"row",alignItems:"center",gap:16,marginBottom:18}}>
                        <Ring pct={p} color={accent} size={78}/>
                        <View style={{flex:1,gap:7}}>
                          {[
                            {l:"Pending",v:pend,c:"#f97316",bg:"rgba(249,115,22,0.1)"},
                            {l:"Done",v:d,c:"#34d399",bg:"rgba(52,211,153,0.1)"},
                            {l:"Total",v:tot,c:accent,bg:accent+"12"},
                          ].map((s,i)=>(
                            <View key={i} style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",backgroundColor:s.bg,borderRadius:9,paddingHorizontal:11,paddingVertical:6}}>
                              <Text style={{fontSize:11,color:s.c,fontWeight:"600"}}>{s.l}</Text>
                              <Text style={{fontSize:14,fontWeight:"900",color:s.c,...(Platform.OS==="web"?{fontFamily:"Outfit,sans-serif"} as any:{})}}>{s.v}</Text>
                            </View>
                          ))}
                        </View>
                      </Pressable>

                      {/* Progress */}
                      <View style={{marginBottom:16}}><Shimmer pct={p} color={accent} h={5}/></View>

                      {/* Task preview */}
                      {pend>0&&(
                        <View style={{marginBottom:16,backgroundColor:isDark?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.025)",borderRadius:12,padding:12,borderWidth:1,borderColor:cb}}>
                          {g.tasks.filter((t:any)=>!t.completed).slice(0,3).map((t:any,ti:number)=>(
                            <View key={t.id} style={{flexDirection:"row",alignItems:"center",gap:8,marginBottom:ti<Math.min(pend,3)-1?8:0}}>
                              <View style={{width:13,height:13,borderRadius:3,borderWidth:1.5,borderColor:accent+"55",flexShrink:0}}/>
                              <Text style={{fontSize:11,color:ts,fontWeight:"500",flex:1}} numberOfLines={1}>{t.title}</Text>
                            </View>
                          ))}
                          {pend>3&&<Text style={{fontSize:10,color:tm,fontWeight:"600",marginTop:7}}>+{pend-3} more pending</Text>}
                        </View>
                      )}

                      {/* Action buttons */}
                     <View style={{ flexDirection: "row", gap: 9 }}>
  <Pressable onPress={() => setModalId(g.id)}
    className={Platform.OS === "web" ? "g3-chip" : undefined}
    style={({ pressed }) => ({
      flex: 1, paddingVertical: 11, borderRadius: 11, alignItems: "center",
      backgroundColor: pressed ? accent : accent + "18",
      borderWidth: 1.5, borderColor: accent + "40",
    })}>
    <Text style={{ fontSize: 12, fontWeight: "700", color: accent }}>👁 View Details</Text>
  </Pressable>
</View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          )}
          <View style={{height:32}}/>
        </View>
      </ScrollView>
    </View>
  );

if(isWide) return(
  <>
    <View style={{flex:1,flexDirection:"row",backgroundColor:bg} as any}>
      {Platform.OS==="web"?(
        <View className="g3-sidebar" style={{width:sidebarOpen?260:0,minWidth:sidebarOpen?260:0,overflow:"hidden"} as any}>
          <Sidebar dark={isDark} router={router} overallPct={pct} done={doneTasks} total={totalTasks} name={displayName} role={role} synced={synced}/>
        </View>
      ):(
        <Sidebar dark={isDark} router={router} overallPct={pct} done={doneTasks} total={totalTasks} name={displayName} role={role} synced={synced}/>
      )}
      <View style={{flex:1,flexDirection:"column",minWidth:0}}>
        <TopBar dark={isDark} open={sidebarOpen} setOpen={setSidebarOpen} toggleDark={toggleDark} router={router} name={displayName} pending={pendingTasks}/>
        {content}
      </View>
    </View>
    {/* Goal Modal at root level */}
    {mGoal && (
      <GoalModal
        goal={mGoal}
        accent={GC[mIdx % GC.length]}
        gIdx={mIdx}
        dark={isDark}
        onClose={() => setModalId(null)}
        onDelGoal={() => {
          setModalId(null);
          setConfirmDeleteGoal({
            goalId: mGoal.id,
            goalName: mGoal.name,
            goalIcon: mGoal.icon || GE[mIdx % GE.length],
          });
        }}
        onDelTask={(goalId, taskId, taskTitle, goalName) => {
          setConfirmDeleteTask({ goalId, taskId, taskTitle, goalName });
        }}
        onEditGoal={handleEditGoal}
        onEditTask={handleEditTask}
        router={router}
        setConfirmDeleteGoal={setConfirmDeleteGoal}
        setConfirmDeleteTask={setConfirmDeleteTask}
      />
    )}
    {/* Confirm Delete Goal Modal at root level */}
    {confirmDeleteGoal && (
      <ConfirmDeleteModal
        dark={isDark}
        title="Delete Goal?"
        subtitle="This will permanently remove the goal and all its tasks. This action cannot be undone."
        itemName={confirmDeleteGoal.goalName}
        itemIcon={confirmDeleteGoal.goalIcon}
        onConfirm={async () => {
          await taskCtx.deleteGoal(confirmDeleteGoal.goalId);
          setConfirmDeleteGoal(null);
          showDelete("Goal deleted");
        }}
        onCancel={() => setConfirmDeleteGoal(null)}
      />
    )}
    {/* Confirm Delete Task Modal at root level */}
    {confirmDeleteTask && (
      <ConfirmDeleteModal
        dark={isDark}
        title="Delete Task?"
        subtitle="This task will be permanently removed from your goal."
        itemName={confirmDeleteTask.taskTitle}
        itemIcon="📝"
        onConfirm={async () => {
          await taskCtx.deleteTask(confirmDeleteTask.goalId, confirmDeleteTask.taskId);
          setConfirmDeleteTask(null);
          showDelete("Task deleted");
        }}
        onCancel={() => setConfirmDeleteTask(null)}
      />
    )}
  </>
);

    return(
    <View style={{flex:1,backgroundColor:bg}}>
      <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",
        paddingHorizontal:18,paddingTop:Platform.OS==="ios"?52:16,paddingBottom:14,
        backgroundColor:isDark?"#0a0f20":"#fff",borderBottomWidth:1,
        borderBottomColor:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)"}}>
        <Pressable onPress={()=>router.back()}><Text style={{color:AC,fontWeight:"700",fontSize:15}}>← Back</Text></Pressable>
        <Text style={{fontSize:18,fontWeight:"900",color:isDark?"#eef2ff":"#0f172a",...(Platform.OS==="web"?{fontFamily:"Outfit,sans-serif"} as any:{})}}>Goals</Text>
        <View style={{width:60}}/>
      </View>
        {content}
      {mGoal && (
        <GoalModal
          goal={mGoal}
          accent={GC[mIdx % GC.length]}
          gIdx={mIdx}
          dark={isDark}
          onClose={() => setModalId(null)}
          onDelGoal={() => {
            setModalId(null);
            setConfirmDeleteGoal({
              goalId: mGoal.id,
              goalName: mGoal.name,
              goalIcon: mGoal.icon || GE[mIdx % GE.length],
            });
          }}
          onDelTask={(goalId, taskId, taskTitle, goalName) => {
            setConfirmDeleteTask({ goalId, taskId, taskTitle, goalName });
          }}
          onEditGoal={handleEditGoal}
          onEditTask={handleEditTask}
          router={router}
          setConfirmDeleteGoal={setConfirmDeleteGoal}
          setConfirmDeleteTask={setConfirmDeleteTask}
        />
      )}
      {/* Confirm Delete Goal Modal at root level */}
      {confirmDeleteGoal && (
        <ConfirmDeleteModal
          dark={isDark}
          title="Delete Goal?"
          subtitle="This will permanently remove the goal and all its tasks. This action cannot be undone."
          itemName={confirmDeleteGoal.goalName}
          itemIcon={confirmDeleteGoal.goalIcon}
          onConfirm={async () => {
            await taskCtx.deleteGoal(confirmDeleteGoal.goalId);
            setConfirmDeleteGoal(null);
            showDelete("Goal deleted");
          }}
          onCancel={() => setConfirmDeleteGoal(null)}
        />
      )}
      {/* Confirm Delete Task Modal at root level */}
      {confirmDeleteTask && (
        <ConfirmDeleteModal
          dark={isDark}
          title="Delete Task?"
          subtitle="This task will be permanently removed from your goal."
          itemName={confirmDeleteTask.taskTitle}
          itemIcon="📝"
          onConfirm={async () => {
            await taskCtx.deleteTask(confirmDeleteTask.goalId, confirmDeleteTask.taskId);
            setConfirmDeleteTask(null);
            showDelete("Task deleted");
          }}
          onCancel={() => setConfirmDeleteTask(null)}
        />
      )}
    </View>
  );
}