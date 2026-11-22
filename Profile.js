// XP / level / achievements / strength ranks / muscle map / share card.
// Everything is derived from workout history, so it is retroactive and cheap to keep in sync.
import React, { useState, useMemo } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, Platform, Share, Animated, Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, G, Circle, Ellipse, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { THEME, THEMES, getActiveThemeKey, withAlpha } from './theme';

// ---------- small helpers ----------
const sessionsOf = (history, dateStr) => {
  const e = history?.[dateStr];
  if (!e) return [];
  return Array.isArray(e) ? e : [e];
};
const performedSets = (sets) =>
  (sets || []).filter((s) => (parseFloat(s.weight) > 0) || (parseInt(s.reps, 10) > 0));
const e1rmOf = (w, r) => {
  const wt = parseFloat(w) || 0;
  const rp = parseInt(r, 10) || 0;
  if (wt <= 0 || rp <= 0) return 0;
  return rp === 1 ? wt : wt * (1 + rp / 30);
};
const mondayKey = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const dow = dt.getDay();
  dt.setDate(dt.getDate() - (dow === 0 ? 6 : dow - 1));
  return `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`;
};
const dayNum = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Math.round(Date.UTC(y, (m || 1) - 1, d || 1) / 86400000);
};
const fmtNum = (n) => {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e4) return `${Math.round(n / 1000)}k`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return `${Math.round(n)}`;
};
export const fmtKg = (n) => `${Math.round(n * 10) / 10}`;

// ---------- levels ----------
export const xpForLevel = (level) => 100 * (level - 1) * (level - 1); // total XP to reach level
export const levelFromXp = (xp) => Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
const TITLES = [
  [1, 'Rookie'], [3, 'Grinder'], [6, 'Lifter'], [10, 'Beast'], [15, 'Titan'], [22, 'Legend'], [30, 'Mythic']
];
export const titleForLevel = (level) => {
  let t = TITLES[0][1];
  TITLES.forEach(([lv, name]) => { if (level >= lv) t = name; });
  return t;
};

// ---------- strength ranks ----------
export const RANK_TIERS = [
  { name: 'Bronze', color: '#CD7F32' },
  { name: 'Silver', color: '#C0C7D1' },
  { name: 'Gold', color: '#FACC15' },
  { name: 'Platinum', color: '#5EEAD4' },
  { name: 'Diamond', color: '#60A5FA' },
  { name: 'Mythic', color: '#F472B6' }
];
// e1RM / bodyweight needed for each tier
export const LIFTS = [
  { id: 'bench', label: 'Bench Press', icon: 'barbell', std: [0.5, 0.75, 1.0, 1.25, 1.5, 2.0],
    match: (n) => /bench press/.test(n) && !/incline|decline|dumbbell|machine|close|smith/.test(n) },
  { id: 'squat', label: 'Squat', icon: 'body', std: [0.75, 1.25, 1.5, 2.0, 2.5, 3.0],
    match: (n) => /\bsquat/.test(n) && !/split|bulgarian|hack|front|goblet|overhead|machine/.test(n) },
  { id: 'deadlift', label: 'Deadlift', icon: 'download', std: [1.0, 1.5, 2.0, 2.5, 3.0, 3.5],
    match: (n) => /deadlift/.test(n) && !/romanian|stiff|rdl|trap|single/.test(n) },
  { id: 'ohp', label: 'Overhead Press', icon: 'arrow-up-circle', std: [0.35, 0.55, 0.75, 0.95, 1.15, 1.4],
    match: (n) => (/overhead press|military press/.test(n) || /^shoulder press$/.test(n)) && !/tricep|dumbbell/.test(n) }
];

// ---------- main computation ----------
export function computeProfile(history, extras = {}) {
  const dates = Object.keys(history || {}).sort();
  const records = {}; // exercise -> { maxWeight, e1rm }
  const liftBest = {}; // lift id -> best e1rm
  let sessions = 0; let sets = 0; let volume = 0; let prs = 0;
  let earlyBird = false; let nightOwl = false;
  const gymDays = [];
  const weekDays = {};

  dates.forEach((dateStr) => {
    const daySessions = sessionsOf(history, dateStr);
    let dayHadWork = false;
    daySessions.forEach((session) => {
      const exs = (session.exercises || []).filter((ex) => performedSets(ex.sets).length > 0);
      if (!exs.length) return;
      dayHadWork = true;
      sessions += 1;
      const started = session.startedAt || session.timestamp;
      if (started && (session.durationSeconds || 0) > 0) {
        const h = new Date(started).getHours();
        if (h < 7) earlyBird = true;
        if (h >= 22) nightOwl = true;
      }
      const sessionRecs = {};
      exs.forEach((ex) => {
        const key = (ex.name || '').toLowerCase();
        const prior = records[key];
        let beat = false;
        performedSets(ex.sets).forEach((s) => {
          sets += 1;
          const w = parseFloat(s.weight) || 0;
          const r = parseInt(s.reps, 10) || 0;
          volume += w * r;
          const e = e1rmOf(w, r);
          if (prior && w > 0 && r > 0 && (w > prior.maxWeight || e > prior.e1rm + 0.01)) beat = true;
          const cur = sessionRecs[key] || { maxWeight: 0, e1rm: 0 };
          sessionRecs[key] = { maxWeight: Math.max(cur.maxWeight, w), e1rm: Math.max(cur.e1rm, e) };
          LIFTS.forEach((l) => { if (l.match(key)) liftBest[l.id] = Math.max(liftBest[l.id] || 0, e); });
        });
        if (beat) prs += 1;
      });
      Object.keys(sessionRecs).forEach((k) => {
        const p = records[k] || { maxWeight: 0, e1rm: 0 };
        records[k] = { maxWeight: Math.max(p.maxWeight, sessionRecs[k].maxWeight), e1rm: Math.max(p.e1rm, sessionRecs[k].e1rm) };
      });
    });
    if (dayHadWork) {
      gymDays.push(dayNum(dateStr));
      const wk = mondayKey(dateStr);
      weekDays[wk] = (weekDays[wk] || 0) + 1;
    }
  });

  let bestStreak = 0; let run = 0; let prev = null;
  gymDays.sort((a, b) => a - b).forEach((d) => {
    run = prev !== null && d === prev + 1 ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    prev = d;
  });
  const bestWeekDays = Math.max(0, ...Object.values(weekDays));

  const habitDays = (extras.addictions || []).reduce((n, a) => n + Object.keys(a.history || {}).length, 0);
  const logDays = ['sleepLog', 'weightLog', 'proteinLog'].reduce((n, k) => n + Object.keys(extras[k] || {}).length, 0);

  const xpBreakdown = {
    sets: sets * 10,
    workouts: sessions * 50,
    prs: prs * 100,
    volume: Math.floor(volume / 100),
    habits: habitDays * 5 + logDays * 5
  };
  const xp = Object.values(xpBreakdown).reduce((a, b) => a + b, 0);
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);

  const bw = extras.bodyWeight || null;
  const ranks = LIFTS.map((l) => {
    const best = liftBest[l.id] || 0;
    const ratio = bw && best ? best / bw : 0;
    let tier = -1;
    l.std.forEach((r, i) => { if (ratio >= r) tier = i; });
    const nextStd = tier + 1 < l.std.length ? l.std[tier + 1] : null;
    return {
      ...l, best, ratio, tier,
      tierInfo: tier >= 0 ? RANK_TIERS[tier] : null,
      nextTier: nextStd != null ? RANK_TIERS[tier + 1] : null,
      nextTarget: nextStd != null && bw ? nextStd * bw : null,
      progress: nextStd != null && bw ? Math.min(1, ratio / nextStd) : 1
    };
  });
  const topTier = Math.max(-1, ...ranks.map((r) => r.tier));

  const A = (id, icon, title, desc, value, target) => ({ id, icon, title, desc, value, target, unlocked: value >= target });
  const achievements = [
    A('first', 'flag', 'First Blood', 'Log your first workout', sessions, 1),
    A('w10', 'barbell', 'Getting Serious', '10 workouts logged', sessions, 10),
    A('w50', 'medal', 'Iron Regular', '50 workouts logged', sessions, 50),
    A('w100', 'trophy', 'Centurion', '100 workouts logged', sessions, 100),
    A('v10k', 'cube', '10k Club', 'Lift 10,000 kg total', volume, 10000),
    A('v100k', 'planet', '100k Club', 'Lift 100,000 kg total', volume, 100000),
    A('v1m', 'rocket', 'Million Kilo', 'Lift 1,000,000 kg total', volume, 1000000),
    A('pr1', 'ribbon', 'Record Breaker', 'Set your first PR', prs, 1),
    A('pr10', 'star', 'PR Machine', 'Set 10 PRs', prs, 10),
    A('pr50', 'sparkles', 'Unstoppable', 'Set 50 PRs', prs, 50),
    A('s7', 'flame', 'On Fire', '7-day gym streak', bestStreak, 7),
    A('s30', 'bonfire', 'Unbreakable', '30-day gym streak', bestStreak, 30),
    A('wk5', 'calendar', 'Iron Week', '5 gym days in one week', bestWeekDays, 5),
    A('early', 'sunny', 'Early Bird', 'Train before 7am', earlyBird ? 1 : 0, 1),
    A('night', 'moon', 'Night Owl', 'Train after 10pm', nightOwl ? 1 : 0, 1),
    A('gold', 'shield-checkmark', 'Gold Standard', 'Reach Gold rank on any lift', topTier + 1, 3),
    A('diamond', 'diamond', 'Diamond Hands', 'Reach Diamond rank on any lift', topTier + 1, 5)
  ];

  return {
    xp, level, xpInto: xp - base, xpSpan: next - base, title: titleForLevel(level), xpBreakdown,
    stats: { sessions, sets, volume, prs, bestStreak, bestWeekDays },
    achievements, ranks, bodyWeight: bw
  };
}

// ---------- styles ----------
const SHADOW = Platform.select({
  web: { boxShadow: '0 8px 24px rgba(0,0,0,0.35)' },
  default: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 6 }
});

const buildStyles = () => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(5,5,12,0.85)', justifyContent: 'center', padding: 12 },
  sheet: { backgroundColor: THEME.background, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', maxHeight: '94%', overflow: 'hidden', ...SHADOW },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  sheetTitle: { color: THEME.text, fontSize: 22, fontWeight: '800' },
  card: { backgroundColor: THEME.surface, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardTitle: { color: THEME.text, fontSize: 16, fontWeight: '800' },
  muted: { color: THEME.textMuted, fontSize: 12 },
  label: { color: THEME.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  // pill in header
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.accentMuted, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, marginLeft: 10 },
  pillText: { color: THEME.accent, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  pillBar: { width: 34, height: 5, borderRadius: 3, backgroundColor: THEME.surfaceRaised, marginLeft: 8, overflow: 'hidden' },
  pillBarFill: { height: '100%', backgroundColor: THEME.accent, borderRadius: 3 },
  // level hero
  hero: { alignItems: 'center', paddingVertical: 20 },
  levelBadge: { width: 96, height: 96, borderRadius: 48, backgroundColor: THEME.accentMuted, borderWidth: 3, borderColor: THEME.accent, alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { boxShadow: `0 0 30px ${withAlpha(THEME.accent, 0.55)}` }, default: { shadowColor: THEME.accent, shadowOpacity: 0.6, shadowRadius: 18, elevation: 8 } }) },
  levelNum: { color: THEME.text, fontSize: 38, fontWeight: '900' },
  levelWord: { color: THEME.accent, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginTop: -4 },
  heroTitle: { color: THEME.text, fontSize: 24, fontWeight: '900', marginTop: 12, letterSpacing: 0.5 },
  xpTrack: { height: 12, borderRadius: 6, backgroundColor: THEME.surfaceRaised, overflow: 'hidden', width: '100%', marginTop: 14 },
  xpFill: { height: '100%', borderRadius: 6, backgroundColor: THEME.accent },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 },
  statCell: { width: '33.33%', marginBottom: 10 },
  statVal: { color: THEME.text, fontSize: 18, fontWeight: '900' },
  // muscle map
  mapWrap: { alignItems: 'center', marginTop: 12 },
  mapToggle: { flexDirection: 'row', backgroundColor: THEME.surfaceLight, borderRadius: 12, padding: 3 },
  mapToggleBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 10 },
  mapToggleActive: { backgroundColor: THEME.accent },
  mapToggleText: { color: THEME.textMuted, fontSize: 12, fontWeight: '800' },
  mapStage: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 24, backgroundColor: '#0E0E18', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, borderWidth: 1, borderColor: THEME.border, paddingVertical: 5, paddingHorizontal: 10, margin: 3 },
  chipText: { color: THEME.textMuted, fontSize: 11, fontWeight: '700' },
  mapInfo: { width: '100%', backgroundColor: THEME.surfaceLight, borderRadius: 16, padding: 14, marginTop: 12, minHeight: 64, justifyContent: 'center' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
  // ranks
  rankRow: { marginTop: 14 },
  rankBadge: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rankName: { color: THEME.text, fontWeight: '800', fontSize: 14 },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: THEME.surfaceRaised, overflow: 'hidden', marginTop: 6 },
  barFill: { height: '100%', borderRadius: 3 },
  // achievements
  achGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginTop: 10 },
  achCell: { width: '33.33%', padding: 4 },
  achBox: { backgroundColor: THEME.surfaceLight, borderRadius: 16, padding: 10, alignItems: 'center', minHeight: 112, borderWidth: 1, borderColor: 'transparent' },
  achBoxOn: { borderColor: THEME.accent, backgroundColor: THEME.accentMuted },
  achTitle: { color: THEME.text, fontSize: 11, fontWeight: '800', textAlign: 'center', marginTop: 6 },
  achDesc: { color: THEME.textMuted, fontSize: 9, textAlign: 'center', marginTop: 2 },
  // themes
  themeRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, marginHorizontal: -4 },
  themeBtn: { width: '50%', padding: 4 },
  themeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.surfaceLight, borderRadius: 14, padding: 12, borderWidth: 2, borderColor: 'transparent' },
  themeSwatch: { width: 22, height: 22, borderRadius: 11 },
  // share card
  shareCard: { backgroundColor: '#0E0E1A', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: THEME.accent, overflow: 'hidden' },
  shareBrand: { color: THEME.accent, fontSize: 13, fontWeight: '900', letterSpacing: 3 },
  shareTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 6 },
  shareDate: { color: THEME.textMuted, fontSize: 12, marginTop: 2 },
  shareDivider: { borderTopWidth: 1, borderTopColor: THEME.border, borderStyle: 'dashed', marginVertical: 14 },
  shareStatRow: { flexDirection: 'row' },
  shareStat: { flex: 1 },
  shareStatVal: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  shareExRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  shareExName: { color: '#E5E5F0', fontSize: 13, fontWeight: '600', flex: 1, marginRight: 8 },
  shareExVal: { color: THEME.accentAlt, fontSize: 13, fontWeight: '800' },
  xpChip: { alignSelf: 'flex-start', backgroundColor: THEME.accentMuted, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12, marginTop: 6 },
  btn: { borderRadius: 16, paddingVertical: 14, alignItems: 'center', flex: 1 },
  btnText: { color: '#FFF', fontWeight: '800', fontSize: 14 }
});

const s = buildStyles();
export const rebuildProfileStyles = () => Object.assign(s, buildStyles());

// ---------- components ----------
export function LevelPill({ profile, onPress }) {
  return (
    <TouchableOpacity style={s.pill} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name="flash" size={12} color={THEME.accent} />
      <Text style={s.pillText}> LV {profile.level}</Text>
      <View style={s.pillBar}><View style={[s.pillBarFill, { width: `${Math.min(100, (profile.xpInto / profile.xpSpan) * 100)}%` }]} /></View>
    </TouchableOpacity>
  );
}

const statusLabel = { Ready: 'Ready to train', Recovering: 'Recovering', Fatigued: 'Fatigued' };

// ---- Anatomical muscle map (SVG). Left half is drawn, right half is mirrored. ----
const MAP = {
  base: {
    head: null,
    neutral: [
      'M 54 150 C 48 168 46 186 46 204 C 50 210 58 210 60 204 C 62 186 64 168 62 152 Z', // forearm
      'M 98 168 L 80 166 C 76 172 74 178 76 186 L 98 186 Z', // hips
      'M 76 262 C 74 286 74 316 78 352 L 90 352 C 94 316 96 286 94 262 Z' // shin
    ]
  },
  front: [
    { cat: 'Shoulders', d: 'M 72 64 C 58 64 48 72 46 86 C 45 96 48 102 54 104 L 68 96 C 74 88 76 74 72 64 Z' },
    { cat: 'Chest', d: 'M 98 70 L 76 68 C 72 76 70 90 76 100 C 84 108 94 106 98 102 Z' },
    { cat: 'Core', d: 'M 98 108 L 84 110 C 82 130 84 150 88 166 L 98 170 Z', abs: true },
    { cat: 'Core', d: 'M 82 112 C 76 128 76 150 82 166 L 86 164 C 82 150 82 130 84 112 Z' },
    { cat: 'Biceps', d: 'M 54 106 C 46 112 42 128 44 146 C 46 152 54 152 58 148 C 62 132 62 116 58 106 Z' },
    { cat: 'Legs', d: 'M 98 188 L 78 186 C 72 210 72 236 76 258 C 82 266 92 266 96 258 C 98 236 100 210 98 188 Z' }
  ],
  back: [
    { cat: 'Back', d: 'M 98 50 L 82 62 C 78 68 84 76 98 84 Z' },
    { cat: 'Shoulders', d: 'M 72 64 C 58 64 48 72 46 86 C 45 96 48 102 54 104 L 68 96 C 74 88 76 74 72 64 Z' },
    { cat: 'Back', d: 'M 98 86 L 82 74 C 72 84 72 108 78 130 C 84 142 92 148 98 150 Z' },
    { cat: 'Back', d: 'M 98 152 L 84 150 C 82 158 84 164 88 168 L 98 170 Z' },
    { cat: 'Triceps', d: 'M 54 106 C 46 112 42 128 44 146 C 46 152 54 152 58 148 C 62 132 62 116 58 106 Z' },
    { cat: 'Legs', d: 'M 98 170 L 80 168 C 74 178 76 192 84 198 C 92 202 98 198 98 196 Z' },
    { cat: 'Legs', d: 'M 96 200 L 78 198 C 74 222 74 244 78 258 C 86 264 94 262 96 254 Z' },
    { cat: 'Legs', d: 'M 78 262 C 72 282 74 306 82 338 L 90 338 C 96 306 98 282 94 262 Z' }
  ]
};

const parseHex = (c) => (typeof c === 'string' && c[0] === '#' ? c : '#4B4B63');

export function MuscleMap({ recovery }) {
  const [side, setSide] = useState('front');
  const [picked, setPicked] = useState(null);
  const by = {};
  (recovery || []).forEach((r) => { by[r.category] = r; });
  const parts = side === 'front' ? MAP.front : MAP.back;
  const info = picked ? by[picked] : null;

  const renderHalf = (mirror) => (
    <G transform={mirror ? 'translate(200,0) scale(-1,1)' : undefined} key={mirror ? 'r' : 'l'}>
      {MAP.base.neutral.map((d, i) => (
        <Path key={`n${i}`} d={d} fill="#1E1E2E" stroke="#2D2D44" strokeWidth="1" />
      ))}
      {/* hand + foot */}
      <Ellipse cx="53" cy="214" rx="6" ry="9" fill="#1E1E2E" stroke="#2D2D44" strokeWidth="1" />
      <Ellipse cx="83" cy="358" rx="10" ry="6" fill="#1E1E2E" stroke="#2D2D44" strokeWidth="1" />
      {parts.map((p, i) => {
        const color = parseHex(by[p.cat]?.color);
        const active = picked === p.cat;
        const dim = picked && !active;
        return (
          <G key={i} opacity={dim ? 0.45 : 1}>
            {/* soft glow underlay */}
            <Path d={p.d} fill="none" stroke={color} strokeWidth={active ? 9 : 6} strokeOpacity={active ? 0.5 : 0.28} strokeLinejoin="round" />
            <Path
              d={p.d}
              fill={color}
              fillOpacity={0.88}
              stroke={active ? '#FFFFFF' : 'rgba(255,255,255,0.35)'}
              strokeWidth={active ? 2 : 0.8}
              strokeLinejoin="round"
              onPress={() => setPicked(active ? null : p.cat)}
            />
            {p.abs ? [122, 136, 150].map((y) => (
              <Line key={y} x1="86" y1={y} x2="98" y2={y} stroke="#0B0B14" strokeOpacity="0.55" strokeWidth="1.6" />
            )) : null}
          </G>
        );
      })}
    </G>
  );

  return (
    <View style={s.mapWrap}>
      <View style={s.mapToggle}>
        {['front', 'back'].map((k) => (
          <TouchableOpacity key={k} style={[s.mapToggleBtn, side === k && s.mapToggleActive]} onPress={() => { setSide(k); setPicked(null); }}>
            <Text style={[s.mapToggleText, side === k && { color: '#FFF' }]}>{k === 'front' ? 'FRONT' : 'BACK'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.mapStage}>
        <Svg width={230} height={368} viewBox="0 0 200 372">
          <Defs>
            <LinearGradient id="headg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#2A2A40" />
              <Stop offset="1" stopColor="#1E1E2E" />
            </LinearGradient>
          </Defs>
          {/* head + neck */}
          <Circle cx="100" cy="28" r="20" fill="url(#headg)" stroke="#2D2D44" strokeWidth="1" />
          <Path d="M 92 46 L 108 46 L 110 60 L 90 60 Z" fill="#1E1E2E" stroke="#2D2D44" strokeWidth="1" />
          {/* torso base so gaps between muscles aren't empty */}
          <Path d="M 100 60 L 72 62 C 66 70 66 100 74 130 C 78 150 78 164 82 186 L 100 188 Z" fill="#171724" />
          <Path d="M 100 60 L 128 62 C 134 70 134 100 126 130 C 122 150 122 164 118 186 L 100 188 Z" fill="#171724" />
          {renderHalf(false)}
          {renderHalf(true)}
        </Svg>
      </View>

      <View style={s.chipRow}>
        {RECOVERY_ORDER.map((cat) => {
          const r = by[cat];
          if (!r) return null;
          const on = picked === cat;
          return (
            <TouchableOpacity key={cat} onPress={() => { setPicked(on ? null : cat); }} activeOpacity={0.8}
              style={[s.chip, on && { borderColor: parseHex(r.color), backgroundColor: withAlpha(parseHex(r.color), 0.15) }]}>
              <View style={[s.legendDot, { backgroundColor: parseHex(r.color) }]} />
              <Text style={[s.chipText, on && { color: THEME.text }]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={s.mapInfo}>
        {info ? (
          <>
            <Text style={{ color: THEME.text, fontWeight: '900', fontSize: 15 }}>{picked}</Text>
            <Text style={{ color: parseHex(info.color), fontWeight: '800', fontSize: 13, marginTop: 2 }}>{statusLabel[info.status]}</Text>
            <View style={[s.barTrack, { width: '100%', marginTop: 8 }]}>
              <View style={[s.barFill, { width: `${Math.round((info.progress || 0) * 100)}%`, backgroundColor: parseHex(info.color) }]} />
            </View>
            <Text style={[s.muted, { marginTop: 6 }]}>
              {info.hoursLeft > 0 ? `${Math.ceil(info.hoursLeft)}h until fully recovered (${info.targetHours}h window)` : 'Fully recovered, go hit it'}
            </Text>
          </>
        ) : (
          <Text style={[s.muted, { textAlign: 'center' }]}>Tap a muscle on the body or a chip to see its recovery</Text>
        )}
      </View>
    </View>
  );
}

const RECOVERY_ORDER = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core'];

export function ProfileModal({ visible, onClose, profile, recovery, onThemeChange }) {
  const [themeMsg, setThemeMsg] = useState('');
  if (!profile) return null;
  const unlocked = profile.achievements.filter((a) => a.unlocked).length;
  const pick = (key) => { onThemeChange && onThemeChange(key); setThemeMsg(''); };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.sheetHead}>
            <Text style={s.sheetTitle}>Profile</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 6 }}><Ionicons name="close" size={24} color={THEME.text} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4 }} showsVerticalScrollIndicator={false}>
            <View style={s.card}>
              <View style={s.hero}>
                <View style={s.levelBadge}>
                  <Text style={s.levelNum}>{profile.level}</Text>
                  <Text style={s.levelWord}>LEVEL</Text>
                </View>
                <Text style={s.heroTitle}>{profile.title.toUpperCase()}</Text>
                <View style={s.xpTrack}><View style={[s.xpFill, { width: `${Math.min(100, (profile.xpInto / profile.xpSpan) * 100)}%` }]} /></View>
                <View style={[s.between, { width: '100%', marginTop: 6 }]}>
                  <Text style={s.muted}>{profile.xpInto} / {profile.xpSpan} XP</Text>
                  <Text style={s.muted}>{profile.xp.toLocaleString()} total XP</Text>
                </View>
              </View>
              <View style={s.statGrid}>
                {[['Workouts', profile.stats.sessions], ['Sets', profile.stats.sets], ['kg lifted', fmtNum(profile.stats.volume)],
                  ['PRs', profile.stats.prs], ['Best streak', `${profile.stats.bestStreak}d`], ['Badges', `${unlocked}/${profile.achievements.length}`]].map(([l, v]) => (
                  <View key={l} style={s.statCell}><Text style={s.statVal}>{v}</Text><Text style={s.muted}>{l}</Text></View>
                ))}
              </View>
              <Text style={[s.muted, { marginTop: 2 }]}>
                Earn XP: 10 per set · 50 per workout · 100 per PR · 1 per 100 kg · 5 per habit / log day
              </Text>
            </View>

            <View style={s.card}>
              <Text style={s.cardTitle}>Muscle Map</Text>
              <Text style={s.muted}>Live recovery status of every muscle group</Text>
              <MuscleMap recovery={recovery} />
            </View>

            <View style={s.card}>
              <View style={s.between}>
                <Text style={s.cardTitle}>Strength Ranks</Text>
                <Text style={s.muted}>{profile.bodyWeight ? `at ${fmtKg(profile.bodyWeight)} kg bodyweight` : ''}</Text>
              </View>
              {!profile.bodyWeight ? (
                <Text style={[s.muted, { marginTop: 8 }]}>Log your body weight in the Habits tab to unlock ranks.</Text>
              ) : null}
              {profile.ranks.map((r) => {
                const color = r.tierInfo ? r.tierInfo.color : THEME.textMuted;
                return (
                  <View key={r.id} style={s.rankRow}>
                    <View style={s.row}>
                      <View style={[s.rankBadge, { backgroundColor: withAlpha(color.startsWith('#') ? color : '#8E8EA8', 0.18) }]}>
                        <Ionicons name={r.icon} size={20} color={color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={s.between}>
                          <Text style={s.rankName}>{r.label}</Text>
                          <Text style={{ color, fontWeight: '900', fontSize: 12, letterSpacing: 1 }}>
                            {r.tierInfo ? r.tierInfo.name.toUpperCase() : 'UNRANKED'}
                          </Text>
                        </View>
                        <Text style={s.muted}>
                          {r.best ? `Est. 1RM ${fmtKg(r.best)} kg` : 'Not logged yet'}
                          {r.nextTier && r.nextTarget ? ` · ${r.nextTier.name} at ${fmtKg(r.nextTarget)} kg` : ''}
                        </Text>
                        <View style={s.barTrack}><View style={[s.barFill, { width: `${(r.progress || 0) * 100}%`, backgroundColor: r.nextTier ? r.nextTier.color : color }]} /></View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={s.card}>
              <View style={s.between}>
                <Text style={s.cardTitle}>Achievements</Text>
                <Text style={s.muted}>{unlocked}/{profile.achievements.length} unlocked</Text>
              </View>
              <View style={s.achGrid}>
                {profile.achievements.map((a) => (
                  <View key={a.id} style={s.achCell}>
                    <View style={[s.achBox, a.unlocked && s.achBoxOn]}>
                      <Ionicons name={a.icon} size={26} color={a.unlocked ? THEME.accent : THEME.textMuted} style={{ opacity: a.unlocked ? 1 : 0.45 }} />
                      <Text style={[s.achTitle, !a.unlocked && { color: THEME.textMuted }]}>{a.title}</Text>
                      <Text style={s.achDesc}>{a.unlocked ? a.desc : `${fmtNum(Math.min(a.value, a.target))}/${fmtNum(a.target)}`}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={s.card}>
              <Text style={s.cardTitle}>Theme</Text>
              <Text style={s.muted}>Pick your glow</Text>
              <View style={s.themeRow}>
                {Object.keys(THEMES).map((k) => (
                  <View key={k} style={s.themeBtn}>
                    <TouchableOpacity
                      style={[s.themeBox, getActiveThemeKey() === k && { borderColor: THEMES[k].colors.accent }]}
                      onPress={() => pick(k)}
                    >
                      <View style={[s.themeSwatch, { backgroundColor: THEMES[k].colors.accent }]} />
                      <View style={[s.themeSwatch, { backgroundColor: THEMES[k].colors.accentAlt, marginLeft: -8 }]} />
                      <Text style={{ color: THEME.text, fontWeight: '700', fontSize: 12, marginLeft: 8, flex: 1 }}>{THEMES[k].name}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              {themeMsg ? <Text style={[s.muted, { marginTop: 8 }]}>{themeMsg}</Text> : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ---------- share card ----------
export function buildSessionSummary(session, dateStr, prCount) {
  const exercises = (session.exercises || []).map((ex) => {
    const ps = performedSets(ex.sets);
    let top = null;
    ps.forEach((st) => {
      const w = parseFloat(st.weight) || 0; const r = parseInt(st.reps, 10) || 0;
      if (!top || w > top.w || (w === top.w && r > top.r)) top = { w, r };
    });
    return { name: ex.name, sets: ps.length, top };
  }).filter((e) => e.sets > 0);
  let volume = 0; let sets = 0;
  (session.exercises || []).forEach((ex) => performedSets(ex.sets).forEach((st) => {
    sets += 1; volume += (parseFloat(st.weight) || 0) * (parseInt(st.reps, 10) || 0);
  }));
  const secs = session.durationSeconds || 0;
  const duration = secs >= 3600 ? `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m` : secs >= 60 ? `${Math.floor(secs / 60)} min` : '--';
  return { title: session.routineName || 'Workout', dateStr, exercises, volume, sets, duration, prCount };
}

const shareText = (d, extra) =>
  `${d.title} · ${d.dateStr}\n${d.sets} sets · ${fmtNum(d.volume)} kg · ${d.duration}${d.prCount ? ` · ${d.prCount} PR${d.prCount > 1 ? 's' : ''}` : ''}\n` +
  d.exercises.slice(0, 6).map((e) => `• ${e.name}: ${e.top ? `${fmtKg(e.top.w)}kg × ${e.top.r}` : `${e.sets} sets`}`).join('\n') +
  `\n${extra}\nTracked with KatTracker`;

// Draw the card on a canvas (web) and share / download it as a PNG
const exportCardImage = async (d, xpLine, levelLine) => {
  const W = 1080; const exRows = Math.min(d.exercises.length, 6);
  const H = 760 + exRows * 70 + 160;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0B0B14'); grad.addColorStop(1, THEME.bannerBg || '#1a1033');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  g.strokeStyle = THEME.accent; g.lineWidth = 6; g.strokeRect(30, 30, W - 60, H - 60);
  const font = (w, sz) => { g.font = `${w} ${sz}px -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`; };
  g.fillStyle = THEME.accent; font(900, 38); g.fillText('K A T T R A C K E R', 80, 120);
  g.fillStyle = '#FFF'; font(900, 96); g.fillText(d.title.slice(0, 18), 80, 240);
  g.fillStyle = THEME.textMuted; font(500, 36); g.fillText(d.dateStr, 80, 295);
  const stats = [[`${d.sets}`, 'SETS'], [fmtNum(d.volume), 'KG LIFTED'], [d.duration, 'TIME'], [`${d.prCount || 0}`, 'PRs']];
  stats.forEach(([v, l], i) => {
    const x = 80 + i * 240;
    g.fillStyle = '#FFF'; font(900, 64); g.fillText(v, x, 430);
    g.fillStyle = THEME.textMuted; font(700, 26); g.fillText(l, x, 475);
  });
  g.setLineDash([14, 12]); g.strokeStyle = THEME.border; g.lineWidth = 3;
  g.beginPath(); g.moveTo(80, 530); g.lineTo(W - 80, 530); g.stroke(); g.setLineDash([]);
  d.exercises.slice(0, 6).forEach((e, i) => {
    const y = 610 + i * 70;
    g.fillStyle = '#E5E5F0'; font(600, 38); g.fillText(e.name.slice(0, 28), 80, y);
    g.fillStyle = THEME.accentAlt; font(800, 38); g.textAlign = 'right';
    g.fillText(e.top ? `${fmtKg(e.top.w)} kg × ${e.top.r}` : `${e.sets} sets`, W - 80, y); g.textAlign = 'left';
  });
  const by = 610 + exRows * 70 + 40;
  g.fillStyle = THEME.accent; font(900, 48); g.fillText(xpLine, 80, by + 30);
  g.fillStyle = THEME.textMuted; font(600, 34); g.fillText(levelLine, 80, by + 85);
  const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
  const file = new File([blob], 'kattracker-workout.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text: 'Tracked with KatTracker' }); return; } catch (e) { /* cancelled */ }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'kattracker-workout.png'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

export function WorkoutCompleteModal({ data, onClose }) {
  const [busy, setBusy] = useState(false);
  if (!data) return null;
  const { summary, xpGained, leveledUp, level, title } = data;
  const xpLine = `+${xpGained} XP`;
  const levelLine = leveledUp ? `LEVEL UP! Now level ${level} · ${title}` : `Level ${level} · ${title}`;
  const doShare = async () => {
    setBusy(true);
    try {
      if (Platform.OS === 'web') await exportCardImage(summary, xpLine, levelLine);
      else await Share.share({ message: shareText(summary, `${xpLine} · ${levelLine}`) });
    } catch (e) { /* ignore */ }
    setBusy(false);
  };
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <ScrollView contentContainerStyle={{ justifyContent: 'center', flexGrow: 1 }}>
          <View style={s.shareCard}>
            <Text style={s.shareBrand}>KATTRACKER</Text>
            <Text style={s.shareTitle}>{summary.title}</Text>
            <Text style={s.shareDate}>{summary.dateStr}</Text>
            <View style={s.shareDivider} />
            <View style={s.shareStatRow}>
              {[[summary.sets, 'SETS'], [fmtNum(summary.volume), 'KG'], [summary.duration, 'TIME'], [summary.prCount || 0, 'PRs']].map(([v, l]) => (
                <View key={l} style={s.shareStat}><Text style={s.shareStatVal}>{v}</Text><Text style={s.label}>{l}</Text></View>
              ))}
            </View>
            <View style={s.shareDivider} />
            {summary.exercises.slice(0, 6).map((e) => (
              <View key={e.name} style={s.shareExRow}>
                <Text style={s.shareExName} numberOfLines={1}>{e.name}</Text>
                <Text style={s.shareExVal}>{e.top ? `${fmtKg(e.top.w)} kg × ${e.top.r}` : `${e.sets} sets`}</Text>
              </View>
            ))}
            <View style={s.shareDivider} />
            <Text style={{ color: THEME.accent, fontSize: 26, fontWeight: '900' }}>{xpLine}</Text>
            <Text style={{ color: leveledUp ? THEME.success : THEME.textMuted, fontWeight: '800', marginTop: 4 }}>{levelLine}</Text>
          </View>
          <View style={{ flexDirection: 'row', marginTop: 14 }}>
            <TouchableOpacity style={[s.btn, { backgroundColor: THEME.surfaceLight, marginRight: 10 }]} onPress={onClose}>
              <Text style={s.btnText}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, { backgroundColor: THEME.accent }]} onPress={doShare} disabled={busy}>
              <Text style={s.btnText}>{busy ? '...' : Platform.OS === 'web' ? 'Save / Share Image' : 'Share'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
