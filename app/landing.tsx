import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

/* ─────────────────────────────────────────────
   CSS  (injected once into <head> on web)
───────────────────────────────────────────── */
const LANDING_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

:root {
  --bg:#080d18;--bg2:#0d1424;--bg3:#111827;--card:#0d1424;--card2:#111827;
  --border:rgba(255,255,255,0.08);--border2:rgba(255,255,255,0.14);
  --txt:#eef2ff;--txt2:rgba(238,242,255,0.65);--txt3:rgba(238,242,255,0.38);
  --accent:#6366f1;--accent2:#818cf8;--accent3:rgba(99,102,241,0.15);
  --orange:#f97316;--green:#34d399;--pink:#ec4899;--cyan:#06b6d4;
  --orb1:rgba(99,102,241,0.18);--orb2:rgba(139,92,246,0.12);--orb3:rgba(6,182,212,0.08);
  --nav-bg:rgba(8,13,24,0.85);
  --sh:0 8px 40px rgba(0,0,0,0.5);--sh2:0 2px 16px rgba(0,0,0,0.4);
  --transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
}
[data-theme="light"] {
  --bg:#f0f2f8;--bg2:#e8eaf3;--bg3:#dde0ef;--card:#ffffff;--card2:#f5f7ff;
  --border:rgba(0,0,0,0.07);--border2:rgba(99,102,241,0.2);
  --txt:#0f172a;--txt2:#475569;--txt3:rgba(15,23,42,0.4);
  --accent:#6366f1;--accent2:#4f46e5;--accent3:rgba(99,102,241,0.08);
  --orb1:rgba(99,102,241,0.1);--orb2:rgba(139,92,246,0.07);--orb3:rgba(6,182,212,0.05);
  --nav-bg:rgba(240,242,248,0.9);
  --sh:0 8px 40px rgba(99,102,241,0.12);--sh2:0 2px 12px rgba(0,0,0,0.06);
}
*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:'Plus Jakarta Sans',sans-serif;background:var(--bg);color:var(--txt);overflow-x:hidden;transition:background .4s,color .4s;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.35);border-radius:99px;}

/* NAV */
nav{position:fixed;top:0;left:0;right:0;z-index:999;display:flex;align-items:center;justify-content:space-between;padding:0 5%;height:70px;background:var(--nav-bg);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border);transition:var(--transition);}
.nav-logo{display:flex;align-items:center;gap:14px;}
.nav-logo-icon{width:58px;height:58px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative;background:linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02));border:1px solid rgba(255,255,255,0.12);box-shadow:0 8px 25px rgba(0,0,0,0.25),inset 0 2px 6px rgba(255,255,255,0.15);}
.nav-logo-icon:hover{transform:scale(1.05);transition:.3s;}
.nav-logo-icon svg{width:38px;height:38px;position:relative;z-index:2;transform:translate(-1px,1px);}
.nav-logo-name{font-family:'Outfit',sans-serif;font-weight:900;font-size:18px;background:linear-gradient(90deg,#ff5c5c,#ffca3a,#14d9c5);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.nav-links{display:flex;align-items:center;gap:8px;}
.nav-links a{text-decoration:none;font-size:14px;font-weight:600;padding:8px 16px;border-radius:10px;color:var(--txt2);transition:var(--transition);cursor:pointer;}
.nav-links a:hover{background:var(--accent3);color:var(--accent);}
.btn-signin{border:1px solid var(--border2)!important;color:var(--txt)!important;}
.btn-signup{background:linear-gradient(135deg,#6366f1,#8b5cf6)!important;color:white!important;box-shadow:0 4px 20px rgba(99,102,241,0.4)!important;}
.btn-signup:hover{transform:translateY(-1px);box-shadow:0 6px 28px rgba(99,102,241,0.55)!important;}
.theme-btn{width:42px;height:42px;border-radius:12px;border:1px solid var(--border);background:var(--card);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;transition:var(--transition);margin-right:8px;}
.theme-btn:hover{background:var(--accent3);border-color:var(--accent);}

/* HERO */
.hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:120px 5% 80px;position:relative;overflow:hidden;}
[data-theme="dark"] .hero{background:radial-gradient(ellipse 80% 60% at 50% -10%,rgba(99,102,241,0.35) 0%,transparent 70%),radial-gradient(ellipse 60% 50% at 80% 50%,rgba(139,92,246,0.2) 0%,transparent 60%),radial-gradient(ellipse 50% 60% at 10% 80%,rgba(6,182,212,0.15) 0%,transparent 60%),var(--bg);}
[data-theme="light"] .hero{background:radial-gradient(ellipse 80% 60% at 50% -10%,rgba(99,102,241,0.2) 0%,transparent 70%),radial-gradient(ellipse 60% 50% at 80% 50%,rgba(139,92,246,0.12) 0%,transparent 60%),var(--bg);}
.orb{position:absolute;border-radius:50%;pointer-events:none;animation:float 8s ease-in-out infinite;}
.orb1{width:500px;height:500px;top:-200px;right:-150px;background:radial-gradient(circle,var(--orb1),transparent 70%);animation-delay:0s;}
.orb2{width:400px;height:400px;bottom:-100px;left:-100px;background:radial-gradient(circle,var(--orb2),transparent 70%);animation-delay:-3s;}
.orb3{width:300px;height:300px;top:30%;left:60%;background:radial-gradient(circle,var(--orb3),transparent 70%);animation-delay:-6s;}
@keyframes float{0%,100%{transform:translateY(0) scale(1);}50%{transform:translateY(-30px) scale(1.05);}}
.hero-badge{display:inline-flex;align-items:center;gap:6px;background:var(--accent3);border:1px solid rgba(99,102,241,0.25);border-radius:99px;padding:6px 16px;margin-bottom:28px;font-size:13px;font-weight:600;color:var(--accent2);animation:fadeUp .6s ease both;}
.badge-dot{width:6px;height:6px;border-radius:50%;background:#34d399;animation:pulse 1.5s infinite;}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(.8);}}
.hero-title{font-family:'Outfit',sans-serif;font-size:clamp(44px,7vw,88px);font-weight:900;line-height:1.05;letter-spacing:-2px;margin-bottom:24px;animation:fadeUp .6s ease .1s both;}
.hero-title span{background:linear-gradient(135deg,#6366f1 0%,#a78bfa 40%,#06b6d4 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.hero-sub{font-size:clamp(16px,2.5vw,20px);color:var(--txt2);max-width:560px;line-height:1.7;margin-bottom:44px;font-weight:500;animation:fadeUp .6s ease .2s both;}
.hero-cta{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;animation:fadeUp .6s ease .3s both;}
.cta-primary{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;text-decoration:none;padding:16px 32px;border-radius:14px;font-size:16px;font-weight:700;box-shadow:0 8px 32px rgba(99,102,241,0.5);transition:var(--transition);font-family:'Outfit',sans-serif;cursor:pointer;border:none;}
.cta-primary:hover{transform:translateY(-3px);box-shadow:0 14px 40px rgba(99,102,241,0.65);}
.cta-secondary{display:inline-flex;align-items:center;gap:8px;background:var(--card);color:var(--txt);text-decoration:none;padding:16px 32px;border-radius:14px;font-size:16px;font-weight:700;border:1px solid var(--border2);transition:var(--transition);font-family:'Outfit',sans-serif;cursor:pointer;}
.cta-secondary:hover{transform:translateY(-3px);background:var(--accent3);border-color:var(--accent);}
.hero-stats{display:flex;gap:32px;justify-content:center;margin-top:56px;flex-wrap:wrap;animation:fadeUp .6s ease .4s both;}
.hero-stat{text-align:center;}
.hero-stat-val{font-family:'Outfit',sans-serif;font-size:32px;font-weight:900;background:linear-gradient(135deg,var(--accent),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.hero-stat-lbl{font-size:13px;color:var(--txt3);font-weight:500;margin-top:2px;}
.hero-divider{width:1px;height:40px;background:var(--border);align-self:center;}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}

/* DEMO WINDOW */
.demo-section{padding:80px 5%;display:flex;justify-content:center;}
.demo-window{width:100%;max-width:900px;background:var(--card);border:1px solid var(--border);border-radius:24px;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.4);animation:fadeUp .8s ease .5s both;position:relative;}
[data-theme="light"] .demo-window{box-shadow:0 32px 80px rgba(99,102,241,0.15);}
.demo-titlebar{display:flex;align-items:center;gap:8px;padding:14px 18px;border-bottom:1px solid var(--border);background:var(--bg3);}
.dot-red{width:12px;height:12px;border-radius:50%;background:#ef4444;}
.dot-amber{width:12px;height:12px;border-radius:50%;background:#fbbf24;}
.dot-green{width:12px;height:12px;border-radius:50%;background:#34d399;}
.demo-url{flex:1;margin-left:8px;background:var(--bg2);border-radius:6px;padding:5px 12px;font-size:12px;color:var(--txt3);font-weight:500;}
.demo-body{display:flex;height:480px;}
.demo-sidebar{width:200px;border-right:1px solid var(--border);padding:20px 14px;flex-shrink:0;background:var(--bg2);}
.demo-logo-row{display:flex;align-items:center;gap:8px;margin-bottom:24px;}
.demo-logo-name{font-family:'Outfit',sans-serif;font-weight:900;font-size:14px;background:linear-gradient(90deg,#ff5c5c,#ffca3a,#14d9c5);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.demo-nav-item{display:flex;align-items:center;gap:8px;padding:9px 10px;border-radius:9px;margin-bottom:3px;font-size:12px;font-weight:500;color:var(--txt2);}
.demo-nav-item.active{background:rgba(99,102,241,0.12);color:var(--accent);font-weight:700;}
.demo-nav-item span{font-size:13px;}
.demo-main{flex:1;overflow:hidden;padding:20px;position:relative;}
.demo-header{font-family:'Outfit',sans-serif;font-size:18px;font-weight:900;color:var(--txt);margin-bottom:4px;}
.demo-sub{font-size:11px;color:var(--txt3);margin-bottom:16px;}
.demo-goals{display:flex;flex-direction:column;gap:10px;overflow:hidden;position:relative;}
.demo-goal{background:var(--card2);border:1px solid var(--border);border-radius:12px;padding:12px;animation:slideInGoal .4s ease both;}
@keyframes slideInGoal{from{opacity:0;transform:translateX(-10px);}to{opacity:1;transform:translateX(0);}}
.demo-goal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
.demo-goal-name{font-size:12px;font-weight:700;color:var(--txt);}
.demo-goal-pct{font-family:'Outfit',sans-serif;font-size:13px;font-weight:900;}
.demo-goal-bar{height:5px;border-radius:99px;background:var(--border);overflow:hidden;margin-bottom:8px;}
.demo-goal-fill{height:100%;border-radius:99px;}
.demo-task{display:flex;align-items:center;gap:7px;padding:5px 0;font-size:11px;color:var(--txt2);}
.demo-check{width:15px;height:15px;border-radius:4px;border:1.5px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:8px;}
.demo-check.done{color:white;border-color:transparent;}
.demo-task-feed{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,var(--card) 60%,transparent);padding:8px 20px 14px;display:flex;align-items:center;gap:8px;border-top:1px solid var(--border);}
.demo-task-feed input{flex:1;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:7px 12px;font-size:11px;color:var(--txt);font-family:'Plus Jakarta Sans',sans-serif;outline:none;}
.demo-task-feed button{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;border-radius:8px;padding:7px 12px;font-size:11px;font-weight:700;cursor:pointer;}

/* FEATURES */
.section{padding:100px 5%;}
.section-badge{display:inline-flex;align-items:center;gap:6px;background:var(--accent3);border:1px solid rgba(99,102,241,0.2);border-radius:99px;padding:5px 14px;font-size:12px;font-weight:700;color:var(--accent2);margin-bottom:16px;}
.section-title{font-family:'Outfit',sans-serif;font-size:clamp(28px,4vw,48px);font-weight:900;line-height:1.1;letter-spacing:-1px;margin-bottom:16px;}
.section-sub{font-size:16px;color:var(--txt2);max-width:520px;line-height:1.7;}
.features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-top:60px;}
.feature-card{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:28px;transition:var(--transition);position:relative;overflow:hidden;}
.feature-card::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--c1),var(--c2));opacity:0;transition:var(--transition);}
.feature-card:hover{transform:translateY(-4px);border-color:var(--border2);box-shadow:var(--sh);}
.feature-card:hover::before{opacity:1;}
.feature-icon{width:50px;height:50px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:18px;}
.feature-title{font-family:'Outfit',sans-serif;font-size:18px;font-weight:800;margin-bottom:8px;}
.feature-desc{font-size:14px;color:var(--txt2);line-height:1.65;}

/* TASK DEMO */
.task-demo-section{padding:80px 5%;background:var(--bg2);border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
.task-demo-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;}
.task-demo-widget{background:var(--card);border:1px solid var(--border);border-radius:20px;overflow:hidden;box-shadow:var(--sh2);}
.task-widget-header{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
.task-widget-title{font-family:'Outfit',sans-serif;font-size:15px;font-weight:800;color:var(--txt);}
.task-widget-badge{background:rgba(99,102,241,0.12);border-radius:99px;padding:3px 10px;font-size:11px;font-weight:700;color:var(--accent);}
.task-list{padding:12px;display:flex;flex-direction:column;gap:6px;min-height:280px;}
.task-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:var(--bg2);font-size:13px;font-weight:500;color:var(--txt);transition:all .3s;}
.task-item.new-task{animation:taskSlideIn .4s ease both;border-color:rgba(99,102,241,0.3);background:rgba(99,102,241,0.06);}
@keyframes taskSlideIn{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}
.task-check{width:18px;height:18px;border-radius:5px;border:1.5px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;cursor:pointer;transition:all .3s;}
.task-check.done{background:var(--green);border-color:var(--green);color:white;}
.task-check.doing{border-color:var(--accent);background:transparent;}
.task-chip{margin-left:auto;font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;flex-shrink:0;}
.task-add-bar{padding:12px;border-top:1px solid var(--border);display:flex;gap:8px;}
.task-add-input{flex:1;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:13px;color:var(--txt);font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:border-color .2s;}
.task-add-input:focus{border-color:var(--accent);}
.task-add-btn{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;transition:var(--transition);white-space:nowrap;}
.task-add-btn:hover{transform:scale(1.03);box-shadow:0 4px 16px rgba(99,102,241,0.4);}

/* STATS */
.stats-section{padding:100px 5%;}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-top:60px;max-width:900px;margin-left:auto;margin-right:auto;}
.stat-card{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:32px 24px;text-align:center;transition:var(--transition);}
.stat-card:hover{transform:translateY(-4px);box-shadow:var(--sh);}
.stat-val{font-family:'Outfit',sans-serif;font-size:44px;font-weight:900;background:linear-gradient(135deg,var(--c1),var(--c2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;display:block;}
.stat-lbl{font-size:14px;color:var(--txt2);font-weight:600;margin-top:4px;}

/* REVIEWS */
.reviews-section{padding:80px 5%;overflow:hidden;}
.reviews-track{display:flex;gap:20px;animation:scrollReviews 24s linear infinite;width:max-content;}
.reviews-track:hover{animation-play-state:paused;}
@keyframes scrollReviews{from{transform:translateX(0);}to{transform:translateX(-50%);}}
.review-card{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:24px;width:280px;flex-shrink:0;}
.review-stars{color:#fbbf24;font-size:12px;margin-bottom:10px;letter-spacing:2px;}
.review-text{font-size:13px;color:var(--txt2);line-height:1.6;margin-bottom:14px;}
.review-author{display:flex;align-items:center;gap:10px;}
.review-avatar{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:white;}
.review-name{font-size:13px;font-weight:700;color:var(--txt);}
.review-role{font-size:11px;color:var(--txt3);}

/* CTA */
.cta-section{padding:120px 5%;text-align:center;position:relative;overflow:hidden;}
[data-theme="dark"] .cta-section{background:radial-gradient(ellipse 70% 60% at 50% 50%,rgba(99,102,241,0.2) 0%,transparent 70%),var(--bg);}
[data-theme="light"] .cta-section{background:radial-gradient(ellipse 70% 60% at 50% 50%,rgba(99,102,241,0.1) 0%,transparent 70%),var(--bg);}
.cta-card{max-width:700px;margin:0 auto;background:linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08));border:1px solid rgba(99,102,241,0.25);border-radius:28px;padding:64px 48px;}
[data-theme="light"] .cta-card{background:linear-gradient(135deg,rgba(99,102,241,0.06),rgba(139,92,246,0.04));}
.cta-title{font-family:'Outfit',sans-serif;font-size:clamp(28px,4vw,48px);font-weight:900;line-height:1.1;letter-spacing:-1px;margin-bottom:16px;}
.cta-sub{font-size:16px;color:var(--txt2);line-height:1.7;margin-bottom:40px;}
.cta-buttons{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;}

/* FOOTER */
footer{padding:32px 5%;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
.footer-logo{font-family:'Outfit',sans-serif;font-weight:900;font-size:16px;background:linear-gradient(90deg,#ff5c5c,#ffca3a,#14d9c5);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.footer-copy{font-size:12px;color:var(--txt3);}

/* REVEAL */
.reveal{opacity:0;transform:translateY(24px);transition:opacity .7s ease,transform .7s ease;}
.reveal.visible{opacity:1;transform:translateY(0);}

/* LOGO ANIMATIONS */
@keyframes drawLine{to{stroke-dashoffset:0;}}
.logo-path{animation:drawLine 1.2s ease-out forwards;}
.d1{animation:floatDot 2.5s ease-in-out infinite;}
.d2{animation:floatDot 2.5s ease-in-out infinite .3s;}
.d3{animation:floatDot 2.5s ease-in-out infinite .6s;}
@keyframes floatDot{0%,100%{transform:translateY(0);}50%{transform:translateY(-3px);}}

/* RESPONSIVE */
@media(max-width:768px){
  nav{padding:0 4%;}
  .nav-links a:not(.btn-signin):not(.btn-signup){display:none;}
  .task-demo-inner{grid-template-columns:1fr;}
  .task-demo-text{text-align:center;}
  .hero-stats{gap:16px;}
  .hero-divider{display:none;}
  .cta-card{padding:40px 24px;}
  footer{flex-direction:column;text-align:center;}
}
@media(max-width:480px){
  .features-grid{grid-template-columns:1fr;}
  .stats-grid{grid-template-columns:1fr 1fr;}
}

/* Footer links */
.footer-link{font-size:12px;color:var(--txt3);text-decoration:none;transition:color .2s;}
.footer-link:hover{color:var(--accent);}
`;

/* ─────────────────────────────────────────────
   Data
───────────────────────────────────────────── */
const REVIEWS = [
  { stars: '★★★★★', text: '"SkillPath completely changed how I approach learning. The streak system keeps me coming back every day."', name: 'Sarah K.', role: 'Software Engineer', color: '#6366f1' },
  { stars: '★★★★★', text: '"I went from 0 to finishing 3 courses in a month. The analytics alone are worth it."', name: 'James R.', role: 'Data Scientist', color: '#f97316' },
  { stars: '★★★★★', text: '"Finally an app that actually tracks progress in a way that motivates me."', name: 'Priya M.', role: 'UX Designer', color: '#06b6d4' },
  { stars: '★★★★★', text: '"The goal breakdown + heatmap combo is insanely good for visualizing your learning journey."', name: 'Marcus T.', role: 'Product Manager', color: '#a78bfa' },
  { stars: '★★★★★', text: '"Built a 102 day streak and learned React Native from scratch. This app works."', name: 'Chen L.', role: 'Frontend Dev', color: '#34d399' },
  { stars: '★★★★★', text: `"Clean UI, smart AI recommendations, syncs everywhere. It's the Notion of learning trackers."`, name: 'Aisha B.', role: 'ML Engineer', color: '#fbbf24' },
];

const DEMO_GOALS = [
  { name: 'Learn Java', emoji: '☕', color: '#6366f1', pct: 75, tasks: [{ t: 'Chapter 3 exercises', done: true }, { t: 'Watch tutorial videos', done: false }, { t: 'Build a simple app', done: false }] },
  { name: 'Machine Learning', emoji: '🤖', color: '#f97316', pct: 40, tasks: [{ t: 'Linear regression', done: false }, { t: 'Data preprocessing', done: false }] },
];

const INITIAL_LIVE_TASKS = [
  { id: '1', text: 'Read Chapter 1', done: true },
  { id: '2', text: 'Watch intro video', done: true },
  { id: '3', text: 'Complete exercises', done: false },
  { id: '4', text: 'Build hello world app', done: false },
  { id: '5', text: 'Study OOP basics', done: false },
  { id: '6', text: 'Practice with arrays', done: false },
];

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function runCountUp(target: number, cb: (v: string) => void, dur = 1800) {
  let start: number | null = null;
  const fmt = (n: number) => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K' : String(n);
  const tick = (ts: number) => {
    if (!start) start = ts;
    const p = Math.min((ts - start) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 4);
    cb(fmt(Math.round(ease * target)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ─────────────────────────────────────────────
   Default export — routes correctly
───────────────────────────────────────────── */
export default function Landing() {
  const router = useRouter();

  /* Mobile native fallback */
  if (Platform.OS !== 'web') {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: '#080d18' }}
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 }}
      >
        <Text style={{ color: '#eef2ff', fontSize: 38, fontWeight: '900', marginBottom: 10, textAlign: 'center', letterSpacing: -1 }}>SkillPath</Text>
        <Text style={{ color: 'rgba(238,242,255,0.6)', fontSize: 16, textAlign: 'center', marginBottom: 48, lineHeight: 24 }}>
          Your personal learning companion — set goals, complete tasks, build streaks.
        </Text>
        <Pressable onPress={() => router.push('/signup')} style={{ backgroundColor: '#6366f1', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 14, marginBottom: 12, width: '100%', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>Start Learning Free</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/login')} style={{ paddingHorizontal: 32, paddingVertical: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 14, width: '100%', alignItems: 'center' }}>
          <Text style={{ color: 'rgba(238,242,255,0.8)', fontWeight: '700', fontSize: 16 }}>Sign In →</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return <WebLanding router={router} />;
}

/* ─────────────────────────────────────────────
   Web landing — full feature-parity with HTML
───────────────────────────────────────────── */
function WebLanding({ router }: { router: ReturnType<typeof useRouter> }) {
  const [isDark, setIsDark] = useState(true);
  const [stat1, setStat1] = useState('0');
  const [stat2, setStat2] = useState('0');
  const [stat3, setStat3] = useState('0');
  const [stat4, setStat4] = useState('0');
  const [demoInput, setDemoInput] = useState('');
  const [liveTasks, setLiveTasks] = useState(INITIAL_LIVE_TASKS.map(t => ({ ...t })));
  const [liveInputVal, setLiveInputVal] = useState('');

  const dpIdx = useRef(0);
  const dcIdx = useRef(0);
  const dTyping = useRef(true);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Inject CSS once ── */
  useEffect(() => {
    const id = 'skillpath-landing-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id;
      s.textContent = LANDING_CSS;
      document.head.appendChild(s);
    }
  }, []);

  /* ── Theme init ── */
  useEffect(() => {
    const saved = localStorage.getItem('sp-theme');
    const dark = saved ? saved === 'dark' : true;
    setIsDark(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, []);

  /* ── Counter animation (delayed 400 ms) ── */
  useEffect(() => {
    const t = setTimeout(() => {
      runCountUp(10427, setStat1);
      runCountUp(524839, setStat2);
      runCountUp(8194, setStat3);
      runCountUp(47, setStat4);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  /* ── Demo input typing effect ── */
  useEffect(() => {
    const phrases = ['Practice data types...', 'Solve algorithm challenge...', 'Review design patterns...', 'Study Big O notation...'];
    const type = () => {
      const phrase = phrases[dpIdx.current % phrases.length];
      if (dTyping.current) {
        setDemoInput(phrase.slice(0, dcIdx.current + 1));
        dcIdx.current++;
        if (dcIdx.current >= phrase.length) {
          dTyping.current = false;
          typingTimer.current = setTimeout(type, 1400);
          return;
        }
      } else {
        setDemoInput(phrase.slice(0, dcIdx.current - 1));
        dcIdx.current--;
        if (dcIdx.current <= 0) {
          dTyping.current = true;
          dpIdx.current++;
          typingTimer.current = setTimeout(type, 400);
          return;
        }
      }
      typingTimer.current = setTimeout(type, dTyping.current ? 60 : 30);
    };
    typingTimer.current = setTimeout(type, 1000);
    return () => { if (typingTimer.current) clearTimeout(typingTimer.current); };
  }, []);

  /* ── Auto-complete live tasks ── */
  useEffect(() => {
    const iv = setInterval(() => {
      setLiveTasks(prev => {
        const undone = prev.filter(t => !t.done);
        if (undone.length === 0) {
          setTimeout(() => setLiveTasks(INITIAL_LIVE_TASKS.map(t => ({ ...t }))), 1000);
          return prev;
        }
        const pick = undone[Math.floor(Math.random() * undone.length)];
        return prev.map(t => t.id === pick.id ? { ...t, done: true } : t);
      });
    }, 3200);
    return () => clearInterval(iv);
  }, []);

  /* ── Scroll reveal ── */
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.12 },
    );
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* ── Theme toggle ── */
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('sp-theme', next ? 'dark' : 'light');
  };

  const navigateTo = (path: string) => router.push(path as any);

  /* Live task helpers */
  const doneCnt = liveTasks.filter(t => t.done).length;
  const livePct = Math.round((doneCnt / liveTasks.length) * 100);

  const addLiveTask = () => {
    if (!liveInputVal.trim()) return;
    setLiveTasks(prev => [...prev, { id: String(Date.now()), text: liveInputVal.trim(), done: false }]);
    setLiveInputVal('');
  };

  const toggleLiveTask = (id: string) => {
    setLiveTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  /* ── Render ── */
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: 'var(--bg)', color: 'var(--txt)', overflowX: 'hidden' } as React.CSSProperties}>

      {/* ── NAV ── */}
      <nav>
        <div className="nav-logo">
          <div className="nav-logo-icon">
            <svg viewBox="0 0 100 100">
              <defs>
                <linearGradient id="logo-g" x1="16" y1="74" x2="82" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FF6B6B" />
                  <stop offset="40%" stopColor="#FACC15" />
                  <stop offset="75%" stopColor="#4ADE80" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
              </defs>
              <path d="M16 74 C 26 68, 34 56, 46 46 C 58 36, 66 26, 82 22" stroke="url(#logo-g)" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray="200" strokeDashoffset="200" className="logo-path" />
              <circle cx="18" cy="74" r="6" fill="#FF6B6B" className="dot d1" />
              <circle cx="48" cy="46" r="7" fill="#A3E635" className="dot d2" />
              <circle cx="82" cy="22" r="8" fill="#38BDF8" className="dot d3" />
            </svg>
          </div>
          <span className="nav-logo-name">SkillPath</span>
        </div>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">{isDark ? '🌙' : '☀️'}</button>
          <a className="btn-signin" onClick={() => navigateTo('/login')} style={{ cursor: 'pointer' }}>Sign In</a>
          <a className="btn-signup" onClick={() => navigateTo('/signup')} style={{ cursor: 'pointer' }}>Get Started →</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="orb orb3" />

        <div className="hero-badge">
          <div className="badge-dot" />
          Now live — Track your learning every day
        </div>

        <h1 className="hero-title">
          Master Skills.<br />
          <span>Track Progress.</span><br />
          Stay Consistent.
        </h1>

        <p className="hero-sub">
          SkillPath is your personal learning companion — set goals, complete tasks, build streaks, and watch your skills compound over time.
        </p>

        <div className="hero-cta">
          <button className="cta-primary" onClick={() => navigateTo('/signup')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            Start Learning Free
          </button>
          <button className="cta-secondary" onClick={() => navigateTo('/login')}>Sign In →</button>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-val" id="stat1">{stat1}</div>
            <div className="hero-stat-lbl">Active Learners</div>
          </div>
          <div className="hero-divider" />
          <div className="hero-stat">
            <div className="hero-stat-val" id="stat2">{stat2}</div>
            <div className="hero-stat-lbl">Tasks Completed</div>
          </div>
          <div className="hero-divider" />
          <div className="hero-stat">
            <div className="hero-stat-val" id="stat3">{stat3}</div>
            <div className="hero-stat-lbl">Learning Streaks</div>
          </div>
          <div className="hero-divider" />
          <div className="hero-stat">
            <div className="hero-stat-val" id="stat4">{stat4}</div>
            <div className="hero-stat-lbl">Skills Unlocked</div>
          </div>
        </div>
      </section>

      {/* ── MINI APP DEMO ── */}
      <section className="demo-section reveal">
        <div className="demo-window">
          <div className="demo-titlebar">
            <div className="dot-red" />
            <div className="dot-amber" />
            <div className="dot-green" />
            <div className="demo-url">localhost:8081/dashboard</div>
          </div>
          <div className="demo-body">
            {/* Sidebar */}
            <div className="demo-sidebar">
              <div className="demo-logo-row">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="5" cy="19" r="2.5" fill="#ef4444" />
                  <circle cx="12" cy="10" r="2.5" fill="#fbbf24" />
                  <circle cx="19" cy="5" r="2.5" fill="#06b6d4" />
                  <path d="M5 19 L12 10 L19 5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="demo-logo-name">SkillPath</span>
              </div>
              <div className="demo-nav-item active"><span>🏠</span> Dashboard</div>
              <div className="demo-nav-item"><span>📊</span> Analytics</div>
              <div className="demo-nav-item"><span>🔔</span> Reminders</div>
              <div className="demo-nav-item"><span>⚙️</span> Settings</div>
              <div style={{ marginTop: 'auto', paddingTop: 20 }}>
                <div style={{ background: 'rgba(99,102,241,0.1)', borderRadius: 12, padding: 12, border: '1px solid rgba(99,102,241,0.2)' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#6366f1', letterSpacing: 1, marginBottom: 8 }}>OVERALL PROGRESS</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'conic-gradient(#6366f1 270deg,rgba(255,255,255,0.1) 0deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#6366f1' }}>75%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 900, fontFamily: 'Outfit,sans-serif', color: 'var(--txt)' }}>9<span style={{ fontSize: 10, color: 'var(--txt3)' }}>/12</span></div>
                      <div style={{ fontSize: 9, color: 'var(--txt3)' }}>tasks done</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main */}
            <div className="demo-main" style={{ paddingBottom: 56 }}>
              <div className="demo-header">Dashboard</div>
              <div className="demo-sub">Good morning ☀️ Test Richard</div>
              <div className="demo-goals">
                {DEMO_GOALS.map((g, gi) => (
                  <div key={gi} className="demo-goal" style={{ animationDelay: `${gi * 0.15}s` }}>
                    <div className="demo-goal-header">
                      <div className="demo-goal-name">{g.emoji} {g.name}</div>
                      <div className="demo-goal-pct" style={{ color: g.color }}>{g.pct}%</div>
                    </div>
                    <div className="demo-goal-bar">
                      <div className="demo-goal-fill" style={{ width: `${g.pct}%`, background: g.color }} />
                    </div>
                    {g.tasks.map((t, ti) => (
                      <div key={ti} className="demo-task">
                        <div className={`demo-check${ti === 0 ? ' done' : ''}`} style={{ borderColor: g.color, background: ti === 0 ? g.color : 'transparent' }}>
                          {ti === 0 ? '✓' : ''}
                        </div>
                        <span style={ti === 0 ? { textDecoration: 'line-through', color: 'var(--txt3)' } : {}}>{t.t}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="demo-task-feed">
                <input type="text" value={demoInput} readOnly placeholder="Add a new task..." onChange={() => {}} />
                <button>+ Add</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="section" id="features">
        <div style={{ textAlign: 'center', marginBottom: 0 }} className="reveal">
          <div className="section-badge">✨ Everything you need</div>
          <h2 className="section-title">Built for serious learners</h2>
          <p className="section-sub" style={{ margin: '0 auto' }}>Every feature designed to keep you consistent, accountable, and growing.</p>
        </div>
        <div className="features-grid reveal">
          {[
            { c1: '#6366f1', c2: '#8b5cf6', ibg: 'rgba(99,102,241,0.12)', icon: '🎯', title: 'Goal Tracking', desc: 'Create structured learning goals with sub-tasks. Visualize your progress with beautiful charts and completion rings.' },
            { c1: '#f97316', c2: '#ef4444', ibg: 'rgba(249,115,22,0.12)', icon: '🔥', title: 'Daily Streaks', desc: "Build unstoppable momentum with streak tracking. Don't break the chain — every day counts toward mastery." },
            { c1: '#06b6d4', c2: '#6366f1', ibg: 'rgba(6,182,212,0.12)', icon: '📊', title: 'Deep Analytics', desc: 'Donut charts, progress bars, heatmaps, and insights. Understand exactly where your time goes and what\'s working.' },
            { c1: '#34d399', c2: '#06b6d4', ibg: 'rgba(52,211,153,0.12)', icon: '🗓️', title: 'Activity Heatmap', desc: 'See your entire year at a glance. GitHub-style heatmap shows your learning density across every single day.' },
            { c1: '#a78bfa', c2: '#ec4899', ibg: 'rgba(167,139,250,0.12)', icon: '🤖', title: 'AI Recommendations', desc: 'Smart suggestions based on your progress patterns. Know exactly what to tackle next to keep growing.' },
            { c1: '#fbbf24', c2: '#f97316', ibg: 'rgba(251,191,36,0.12)', icon: '⭐', title: 'Skill Score', desc: 'A dynamic score that reflects your goals, completions, and streaks. Level up your score as you level up your skills.' },
          ].map((f, i) => (
            <div key={i} className="feature-card" style={{ '--c1': f.c1, '--c2': f.c2 } as React.CSSProperties}>
              <div className="feature-icon" style={{ background: f.ibg }}>{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LIVE TASK DEMO ── */}
      <section className="task-demo-section" id="how">
        <div className="task-demo-inner">
          {/* Text */}
          <div className="task-demo-text reveal">
            <div className="section-badge">🚀 See it in action</div>
            <h2 className="section-title">Add tasks,<br />track progress</h2>
            <p style={{ fontSize: 16, color: 'var(--txt2)', lineHeight: 1.7, marginBottom: 28 }}>
              Tasks stream in as you learn. Check them off, watch the ring fill up. It's as satisfying as it sounds.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { bg: 'rgba(99,102,241,0.12)', txt: 'Real-time sync across all devices' },
                { bg: 'rgba(52,211,153,0.12)', txt: 'Auto-save as you work' },
                { bg: 'rgba(249,115,22,0.12)', txt: 'Organized by goal with progress bars' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</div>
                  <div style={{ fontSize: 14, color: 'var(--txt2)' }}>{item.txt}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Widget */}
          <div className="reveal">
            <div className="task-demo-widget">
              <div className="task-widget-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15 }}>☕</span>
                  <div className="task-widget-title">Learn Java</div>
                </div>
                <div className="task-widget-badge">{doneCnt}/{liveTasks.length} tasks</div>
              </div>
              <div style={{ padding: '12px 16px 0' }}>
                <div style={{ height: 5, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', width: `${livePct}%`, transition: 'width .8s ease' }} />
                </div>
                <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--txt3)', marginTop: 4, fontFamily: 'Outfit,sans-serif', fontWeight: 700 }}>{livePct}%</div>
              </div>
              <div className="task-list">
                {liveTasks.map(t => (
                  <div key={t.id} className="task-item">
                    <div className={`task-check ${t.done ? 'done' : 'doing'}`} style={{ borderColor: t.done ? 'transparent' : '#6366f1', background: t.done ? '#34d399' : 'transparent' }} onClick={() => toggleLiveTask(t.id)}>
                      {t.done ? '✓' : ''}
                    </div>
                    <span style={t.done ? { textDecoration: 'line-through', color: 'var(--txt3)' } : { color: 'var(--txt)' }}>{t.text}</span>
                    {t.done
                      ? <span className="task-chip" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>Done</span>
                      : <span className="task-chip" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>Todo</span>
                    }
                  </div>
                ))}
              </div>
              <div className="task-add-bar">
                <input
                  className="task-add-input"
                  value={liveInputVal}
                  onChange={e => setLiveInputVal((e.target as HTMLInputElement).value)}
                  onKeyDown={e => { if (e.key === 'Enter') addLiveTask(); }}
                  placeholder="Type a new task..."
                />
                <button className="task-add-btn" onClick={addLiveTask}>+ Add Task</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="stats-section" style={{ textAlign: 'center' }}>
        <div className="reveal">
          <div className="section-badge">📈 Growing fast</div>
          <h2 className="section-title">Numbers that speak</h2>
        </div>
        <div className="stats-grid reveal">
          {[
            { val: '10K+', lbl: 'Active Learners', c1: '#6366f1', c2: '#a78bfa' },
            { val: '500K+', lbl: 'Tasks Completed', c1: '#34d399', c2: '#06b6d4' },
            { val: '98%', lbl: 'User Satisfaction', c1: '#f97316', c2: '#ef4444' },
            { val: '365+', lbl: 'Max Streak Days', c1: '#fbbf24', c2: '#f97316' },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ '--c1': s.c1, '--c2': s.c2 } as React.CSSProperties}>
              <span className="stat-val">{s.val}</span>
              <div className="stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="reviews-section reveal">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="section-badge">💬 Loved by learners</div>
          <h2 className="section-title" style={{ fontSize: 'clamp(24px,3vw,36px)' }}>What people are saying</h2>
        </div>
        <div style={{ overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to right,var(--bg),transparent)', zIndex: 1, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to left,var(--bg),transparent)', zIndex: 1, pointerEvents: 'none' }} />
          <div className="reviews-track">
            {[...REVIEWS, ...REVIEWS].map((r, i) => (
              <div key={i} className="review-card">
                <div className="review-stars">{r.stars}</div>
                <div className="review-text">{r.text}</div>
                <div className="review-author">
                  <div className="review-avatar" style={{ backgroundColor: r.color }}>{r.name[0]}</div>
                  <div>
                    <div className="review-name">{r.name}</div>
                    <div className="review-role">{r.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section reveal">
        <div className="cta-card">
          <h2 className="cta-title">
            Ready to start your<br />
            <span style={{ background: 'linear-gradient(135deg,#6366f1,#a78bfa,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' } as React.CSSProperties}>
              learning journey?
            </span>
          </h2>
          <p className="cta-sub">
            Join thousands of learners who use SkillPath to build skills<br />
            that actually stick. Free to start, no credit card needed.
          </p>
          <div className="cta-buttons">
            <button className="cta-primary" onClick={() => navigateTo('/signup')}>Create Free Account →</button>
            <button className="cta-secondary" onClick={() => navigateTo('/login')}>Already have an account</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div>
          <span className="footer-logo">SkillPath</span>
        </div>
        <div className="footer-copy">© 2026 SkillPath · Your personal learning tracker</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <a className="footer-link" onClick={() => navigateTo('/login')} style={{ cursor: 'pointer' }}>Sign In</a>
          <a className="footer-link" onClick={() => navigateTo('/signup')} style={{ cursor: 'pointer' }}>Sign Up</a>
        </div>
      </footer>

    </div>
  );
}
