import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StatusBar,
  Platform,
  Vibration,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Prefer Expo/community safe-area insets — RN SafeAreaView often draws a white top hairline on iOS
let useSafeAreaInsets = () => ({
  top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 47,
  bottom: Platform.OS === 'ios' ? 20 : 0,
  left: 0,
  right: 0
});
try {
  const safeAreaMod = require('react-native-safe-area-context');
  if (safeAreaMod?.useSafeAreaInsets) {
    useSafeAreaInsets = safeAreaMod.useSafeAreaInsets;
  }
} catch (e) {
  // fallback insets above
}

let ImagePicker = null;
try {
  ImagePicker = require('expo-image-picker');
} catch (e) {
  ImagePicker = null;
}

let FileSystem = null;
try {
  FileSystem = require('expo-file-system/legacy');
} catch (e) {
  try {
    FileSystem = require('expo-file-system');
  } catch (e2) {
    FileSystem = null;
  }
}

// --- CONSTANTS & CONFIG ---
const THEME = {
  background: '#121212',
  surface: '#1E1E1E',
  surfaceLight: '#2A2A2A',
  accent: '#6366F1',
  accentMuted: 'rgba(99, 102, 241, 0.2)',
  text: '#FFFFFF',
  textMuted: '#A0A0A0',
  border: '#2E2E2E',
  success: '#10B981',
  successMuted: 'rgba(16, 185, 129, 0.15)',
};

const ROUTINE_COLORS = {
  Blue: '#3B82F6',
  Red: '#EF4444',
  Green: '#10B981',
  Purple: '#8B5CF6',
  Yellow: '#F59E0B',
  Gray: '#6B7280',
};

const TIMER_PRESETS = [60, 90, 120, 180, 240];
const DEFAULT_SETS = 2;
const RECOVERY_CATEGORIES = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core'];
const DEFAULT_RECOVERY_HOURS = RECOVERY_CATEGORIES.reduce((acc, item) => {
  acc[item] = 36;
  return acc;
}, {});

// Suggestion pool for supplement name autocomplete (ideas only — list starts empty)
const SUPPLEMENT_DICTIONARY = [
  { name: 'Omega-3 Fish Oil', doseMg: 1000 },
  { name: 'Ashwagandha', doseMg: 600 },
  { name: 'Zinc Picolinate', doseMg: 15 },
  { name: 'Magnesium Citrate', doseMg: 400 },
  { name: 'Caffeine (Anhydrous)', doseMg: 200 },
  { name: 'Creatine Monohydrate', doseMg: 5000 },
  { name: 'Vitamin D3', doseMg: 0.05 }, // 50µg
  { name: 'Vitamin C', doseMg: 1000 },
  { name: 'Multivitamin', doseMg: 1 },
  { name: 'Whey Protein', doseMg: 25000 },
  { name: 'Casein Protein', doseMg: 25000 },
  { name: 'Beta-Alanine', doseMg: 3200 },
  { name: 'Citrulline Malate', doseMg: 6000 },
  { name: 'BCAAs', doseMg: 5000 },
  { name: 'L-Carnitine', doseMg: 1000 },
  { name: 'Fish Oil', doseMg: 1000 },
  { name: 'Collagen Peptides', doseMg: 10000 },
  { name: 'Electrolytes', doseMg: 1000 },
  { name: 'Iron', doseMg: 18 },
  { name: 'Calcium', doseMg: 500 },
  { name: 'Potassium', doseMg: 300 },
  { name: 'Vitamin B12', doseMg: 1 },
  { name: 'Vitamin B Complex', doseMg: 1 },
  { name: 'Probiotics', doseMg: 1 },
  { name: 'Turmeric / Curcumin', doseMg: 500 },
  { name: 'Melatonin', doseMg: 3 },
  { name: 'Glutamine', doseMg: 5000 },
  { name: 'Pre-Workout', doseMg: 1 },
  { name: 'NAC', doseMg: 600 },
  { name: 'CoQ10', doseMg: 100 },
];

const EXERCISE_DICTIONARY = [
  // CHEST
  { name: 'Chin-ups (Bodyweight / Weighted)', category: 'Back' },
  { name: 'Dips (Chest Focus)', category: 'Chest' },
  { name: 'Dips (Triceps Focus)', category: 'Triceps' },
  { name: 'Flat Bench Press (Barbell)', category: 'Chest' },
  { name: 'Incline Dumbbell Press', category: 'Chest' },
  { name: 'Decline Barbell Press', category: 'Chest' },
  { name: 'Dumbbell Chest Flys', category: 'Chest' },
  { name: 'Cable Crossover Flys', category: 'Chest' },
  { name: 'Push-ups (Standard / Deficit)', category: 'Chest' },
  { name: 'Machine Chest Press', category: 'Chest' },
  { name: 'Pec Deck Flys', category: 'Chest' },
  { name: 'Incline Barbell Press', category: 'Chest' },
  { name: 'Hammer Strength Chest Press', category: 'Chest' },
  // BACK
  { name: 'Lat Pulldown (Wide Grip)', category: 'Back' },
  { name: 'Lat Pullovers', category: 'Back' },
  { name: 'Barbell Rows', category: 'Back' },
  { name: 'One-Arm Dumbbell Rows', category: 'Back' },
  { name: 'Seated Cable Rows (Close Grip)', category: 'Back' },
  { name: 'High-to-Low Cable Row', category: 'Back' },
  { name: 'T-Bar Rows', category: 'Back' },
  { name: 'Conventional Deadlift', category: 'Back' },
  { name: 'Hyperextensions (Back Extensions)', category: 'Back' },
  { name: 'Rack Pulls', category: 'Back' },
  { name: 'Straight-Arm Cable Pulldowns', category: 'Back' },
  { name: 'Seated Row (Wide Grip)', category: 'Back' },
  { name: 'Machine Row Flared elbows', category: 'Back' },
  { name: 'Seated Machine Row Close Grip', category: 'Back' },
  { name: 'Pull-ups (Bodyweight / Weighted)', category: 'Back' },
  // SHOULDERS
  { name: 'Overhead Press (Barbell)', category: 'Shoulders' },
  { name: 'Seated Dumbbell Shoulder Press', category: 'Shoulders' },
  { name: 'Lateral Raises (Dumbbell)', category: 'Shoulders' },
  { name: 'Lateral Raises (Cable)', category: 'Shoulders' },
  { name: 'Front Raises (Dumbbell / Cable)', category: 'Shoulders' },
  { name: 'Rear Delt Flys (Pec Deck)', category: 'Shoulders' },
  { name: 'Arnold Press', category: 'Shoulders' },
  { name: 'Dumbbell Shrugs', category: 'Shoulders' },
  { name: 'Upright Rows (Barbell / Cable)', category: 'Shoulders' },
  { name: 'Face Pulls (Rope)', category: 'Shoulders' },
  { name: 'Push Press', category: 'Shoulders' },
  // BICEPS
  { name: 'Barbell Curls', category: 'Biceps' },
  { name: 'Dumbbell Alternating Curls', category: 'Biceps' },
  { name: 'Hammer Curls', category: 'Biceps' },
  { name: 'Preacher Curls (EZ Bar)', category: 'Biceps' },
  { name: 'Concentration Curls', category: 'Biceps' },
  { name: 'Incline Dumbbell Curls', category: 'Biceps' },
  { name: 'Cable Curls (Rope / Straight Bar)', category: 'Biceps' },
  { name: 'Spider Curls', category: 'Biceps' },
  { name: 'Bayesian Curls', category: 'Biceps' },
  { name: 'Zottman Curls', category: 'Biceps' },
  { name: 'Preacher Curls', category: 'Biceps' },
  // TRICEPS
  { name: 'Overhead Tricep Extension (Dumbbell)', category: 'Triceps' },
  { name: 'Tricep Rope Pushdowns', category: 'Triceps' },
  { name: 'Single arm Tricep pushdowns', category: 'Triceps' },
  { name: 'Skull Crushers (EZ Bar)', category: 'Triceps' },
  { name: 'Close-Grip Bench Press', category: 'Triceps' },
  { name: 'Diamond Push-ups', category: 'Triceps' },
  { name: 'Cable V-Bar Pushdowns', category: 'Triceps' },
  { name: 'Tricep Dumbbell Kickbacks', category: 'Triceps' },
  { name: 'Bench Dips', category: 'Triceps' },
  { name: 'Machine Tricep Pressdown', category: 'Triceps' },
  { name: 'Machine Dips', category: 'Triceps' },
  // LEGS
  { name: 'Back Squat (Barbell)', category: 'Legs' },
  { name: 'Leg Press', category: 'Legs' },
  { name: 'Romanian Deadlift (Barbell / Dumbbell)', category: 'Legs' },
  { name: 'Leg Extensions (Machine)', category: 'Legs' },
  { name: 'Seated Leg Curl', category: 'Legs' },
  { name: 'Lying Leg Curl', category: 'Legs' },
  { name: 'Walking Lunges', category: 'Legs' },
  { name: 'Bulgarian Split Squats', category: 'Legs' },
  { name: 'Standing Calf Raises', category: 'Legs' },
  { name: 'Hip Thrusts (Barbell)', category: 'Legs' },
  // ABS / CORE
  { name: 'Plank (Standard / Weighted)', category: 'Core' },
  { name: 'Abdominal Crunches', category: 'Core' },
  { name: 'Hanging Leg Raises', category: 'Core' },
  { name: 'Russian Twists', category: 'Core' },
  { name: 'Ab Wheel Rollouts', category: 'Core' },
  { name: 'Reverse Crunches', category: 'Core' },
  { name: 'Cable Woodchoppers', category: 'Core' },
  { name: 'Hanging Knee Raises', category: 'Core' },
  { name: 'Bicycle Crunches', category: 'Core' },
  { name: 'Bird Dog', category: 'Core' },

  // --- User routine variants / aliases (pics) ---
  { name: 'Incline press', category: 'Chest' },
  { name: 'Incline Press', category: 'Chest' },
  { name: 'Chest Press (Machine)', category: 'Chest' },
  { name: 'Lateral Raises (Machine)', category: 'Shoulders' },
  { name: 'Reverse Flys', category: 'Shoulders' },
  { name: 'Seated Machine Row (close Grip)', category: 'Back' },
  { name: 'Seated Machine Rows (Close Grip)', category: 'Back' },
  { name: 'Machine Row Flared elbow', category: 'Back' },
  { name: 'Single arm Tricep pushdown', category: 'Triceps' },
  { name: 'Precher Curls', category: 'Biceps' },
  { name: 'Dumbbell Curls', category: 'Biceps' },
  { name: 'Reverse Easybar Curl', category: 'Biceps' },
  { name: 'UWU Curls', category: 'Biceps' },
  { name: 'Single arm UWU curl', category: 'Biceps' },
  { name: 'Leg Extentions', category: 'Legs' },
  { name: 'Leg Curl', category: 'Legs' },
  { name: 'Calf Raises', category: 'Legs' },
  { name: 'Squat', category: 'Legs' },
  { name: 'Ab chrunches', category: 'Core' },
  { name: 'Ab crunches', category: 'Core' }
];

const normalizeExerciseKey = (name = '') =>
  String(name).toLowerCase().replace(/[^a-z0-9]/g, '');

const resolveExerciseCategory = (exerciseName) => {
  if (!exerciseName) return null;
  const exact = EXERCISE_DICTIONARY.find(
    d => d.name.toLowerCase() === exerciseName.toLowerCase()
  );
  if (exact) return exact.category;

  const key = normalizeExerciseKey(exerciseName);
  const fuzzy = EXERCISE_DICTIONARY.find(d => normalizeExerciseKey(d.name) === key);
  if (fuzzy) return fuzzy.category;

  // Extra loose aliases for common typos / short names
  const ALIASES = {
    inclinepress: 'Chest',
    machinechestpress: 'Chest',
    chestpressmachine: 'Chest',
    pecdeckflys: 'Chest',
    latpulldownwidegrip: 'Back',
    latpullovers: 'Back',
    tbarrows: 'Back',
    seatedmachinerowclosegrip: 'Back',
    seatedmachinerowsclosegrip: 'Back',
    machinerowflaredelbow: 'Back',
    machinerowflaredelbows: 'Back',
    reverseflys: 'Shoulders',
    lateralraisesmachine: 'Shoulders',
    lateralraisescable: 'Shoulders',
    seateddumbbellshoulderpress: 'Shoulders',
    prechercurls: 'Biceps',
    preachercurls: 'Biceps',
    dumbbellcurls: 'Biceps',
    hammercurls: 'Biceps',
    reverseeasybarcurl: 'Biceps',
    uwucurls: 'Biceps',
    singlearmuwucurl: 'Biceps',
    cablecurlsropestraightbar: 'Biceps',
    singlearmtriceppushdown: 'Triceps',
    singlearmtriceppushdowns: 'Triceps',
    machinetriceppressdown: 'Triceps',
    machinedips: 'Triceps',
    legextensionsmachine: 'Legs',
    legextentions: 'Legs',
    seatedlegcurl: 'Legs',
    legcurl: 'Legs',
    legpress: 'Legs',
    standingcalfraises: 'Legs',
    calfraises: 'Legs',
    squat: 'Legs',
    abchrunches: 'Core',
    abcrunches: 'Core',
    abdominalcrunches: 'Core'
  };

  return ALIASES[key] || null;
};

const getWeekStartDate = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setDate(d.getDate() - daysToMonday);
  return d;
};

const BASE_EXERCISE_POOL = EXERCISE_DICTIONARY.map(e => e.name);
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const STORAGE_KEYS = {
  ROUTINES: '@kat_tracker_routines_v3',
  SCHEDULE: '@kat_tracker_schedule_v3',
  HISTORY: '@kat_tracker_history_v3',
  CUSTOM_EX_POOL: '@kat_tracker_custom_pool_v3',
  ADDICTIONS: '@kat_tracker_addictions_v3',
  PRS: '@kat_tracker_prs_v3',
  RECOVERY_WINDOWS: '@kat_tracker_recovery_windows_v1',
  SUPPLEMENTS: '@kat_tracker_supplements_v1',
  SUPPLEMENT_LOG: '@kat_tracker_supplement_log_v1',
  SLEEP_LOG: '@kat_tracker_sleep_log_v1',
  WEIGHT_LOG: '@kat_tracker_weight_log_v1',
  PROTEIN_GOAL: '@kat_tracker_protein_goal_v1',
  PROTEIN_LOG: '@kat_tracker_protein_log_v1',
  MONTHLY_PHOTOS: '@kat_tracker_monthly_photos_v1',
  PHOTO_PROMPT_MONTH: '@kat_tracker_photo_prompt_month_v1'
};

const SLEEP_TARGET_HOURS = 8;
const DEFAULT_PROTEIN_GOAL = 150;
const MAX_MONTHLY_PHOTOS = 4;
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getMonthKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const getPreviousMonthKey = (monthKey) => {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return getMonthKey(d);
};

const formatMonthLabel = (monthKey) => {
  if (!monthKey) return '';
  const [y, m] = monthKey.split('-').map(Number);
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${names[(m || 1) - 1]} ${y}`;
};

// --- UTILITY FUNCTIONS ---
const getLocalDateString = (date = new Date()) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

const getTodayDayName = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

const parseTimeToMinutes = (raw) => {
  if (!raw || !String(raw).trim()) return null;
  const cleaned = String(raw).trim().replace('.', ':').replace(',', ':');
  const match = cleaned.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (Number.isNaN(h) || Number.isNaN(m) || h > 23 || m > 59) return null;
  return h * 60 + m;
};

const formatMinutesAsTime = (totalMins) => {
  if (totalMins == null || Number.isNaN(totalMins)) return '--:--';
  let mins = Math.round(totalMins) % (24 * 60);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const formatDurationHours = (hours) => {
  if (hours == null || Number.isNaN(hours)) return '--';
  const totalMins = Math.round(hours * 60);
  const h = Math.floor(totalMins / 60);
  const m = Math.abs(totalMins % 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
};

const calcSleepHours = (bedMin, wakeMin) => {
  if (bedMin == null || wakeMin == null) return null;
  let diff = wakeMin - bedMin;
  if (diff <= 0) diff += 24 * 60;
  return diff / 60;
};

const getLastNDateStrings = (n = 7) => {
  const dates = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  for (let i = n - 1; i >= 0; i -= 1) {
    const copy = new Date(d);
    copy.setDate(d.getDate() - i);
    dates.push(getLocalDateString(copy));
  }
  return dates;
};

const sleepBarColor = (hours) => {
  if (hours == null) return '#2C2C38';
  if (hours >= SLEEP_TARGET_HOURS) return '#F59E0B';
  if (hours >= 6) return '#F97316';
  return '#EF4444';
};

const generateHeatmapDates = () => {
  const weeks = [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - daysToMonday);

  const startDate = new Date(currentMonday);
  startDate.setDate(currentMonday.getDate() - 14 * 7);

  let runnerDate = new Date(startDate);
  for (let w = 0; w < 15; w++) {
    const weekDays = [];
    for (let d = 0; d < 7; d++) {
      weekDays.push(getLocalDateString(runnerDate));
      runnerDate.setDate(runnerDate.getDate() + 1);
    }
    weeks.push(weekDays);
  }
  return weeks;
};

const getHabitStreak = (historyObj = {}) => {
  const cursor = new Date();
  const todayStr = getLocalDateString(cursor);
  if (!historyObj[todayStr]) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (historyObj[getLocalDateString(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const getGymDayStreak = (historyObj = {}) => {
  const hasWorkout = (dateStr) => dayHasLoggedWorkout(historyObj, dateStr);
  const cursor = new Date();
  const todayStr = getLocalDateString(cursor);
  if (!hasWorkout(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  // Cap lookback so empty history doesn't loop forever conceptually
  for (let i = 0; i < 400; i += 1) {
    const key = getLocalDateString(cursor);
    if (!hasWorkout(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const getBestGymWeek = (historyObj = {}) => {
  let best = { count: 0, start: null, end: null };
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let weeksAgo = 0; weeksAgo < 12; weeksAgo += 1) {
    const end = new Date(today);
    end.setDate(today.getDate() - weeksAgo * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    let count = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = getLocalDateString(d);
      if (dayHasLoggedWorkout(historyObj, key)) count += 1;
    }
    if (count > best.count) {
      best = {
        count,
        start: getLocalDateString(start),
        end: getLocalDateString(end)
      };
    }
  }
  return best;
};

const emptySet = (weight = '', reps = '') => ({ weight, reps, done: false });

const buildEmptySets = (count) =>
  Array.from({ length: Math.max(1, count || 1) }, () => emptySet());

// A set only "counts" if the user actually logged weight and/or reps.
// Empty placeholders (and 0×0 leftovers) are ignored for recovery, weekly stats, etc.
const isSetLogged = (set) => {
  if (!set) return false;
  const weight = parseFloat(set.weight);
  const reps = parseInt(set.reps, 10);
  return (Number.isFinite(weight) && weight > 0) || (Number.isFinite(reps) && reps > 0);
};

const getLoggedSets = (sets) => (Array.isArray(sets) ? sets.filter(isSetLogged) : []);

const exerciseHasLoggedWork = (ex) => getLoggedSets(ex?.sets).length > 0;

const sessionHasLoggedWork = (session) =>
  Array.isArray(session?.exercises) && session.exercises.some(exerciseHasLoggedWork);

const formatTimerString = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const formatWorkoutClock = (totalSeconds) => {
  const secs = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const rem = secs % 60;
  if (hours > 0) {
    return `${hours}:${mins < 10 ? '0' : ''}${mins}:${rem < 10 ? '0' : ''}${rem}`;
  }
  return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
};

const formatWorkoutDurationLabel = (totalSeconds) => {
  if (totalSeconds == null || Number.isNaN(Number(totalSeconds))) return null;
  const secs = Math.max(0, Math.floor(Number(totalSeconds)));
  if (secs <= 0) return null;
  const hours = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  if (mins > 0) return `${mins} min`;
  return `${secs}s`;
};

const getSessionsForDate = (historyObj, dateStr) => {
  const dayEntry = historyObj?.[dateStr];
  if (!dayEntry) return [];
  return Array.isArray(dayEntry) ? dayEntry : [dayEntry];
};

const dayHasLoggedWorkout = (historyObj, dateStr) =>
  getSessionsForDate(historyObj, dateStr).some(sessionHasLoggedWork);

const getBestSetFromSets = (sets) => {
  const logged = getLoggedSets(sets);
  if (logged.length === 0) return null;
  let best = null;
  logged.forEach((set) => {
    const weight = parseFloat(set.weight) || 0;
    const reps = parseInt(set.reps, 10) || 0;
    if (!best) {
      best = { weight, reps };
      return;
    }
    if (weight > best.weight || (weight === best.weight && reps > best.reps)) {
      best = { weight, reps };
    }
  });
  return best;
};

const buildExerciseProgressSeries = (historyObj, exerciseName, limit = 12) => {
  if (!exerciseName) return [];
  const key = exerciseName.toLowerCase();
  const points = [];

  Object.keys(historyObj || {})
    .sort((a, b) => (a < b ? -1 : 1))
    .forEach((dateStr) => {
      getSessionsForDate(historyObj, dateStr).forEach((session, sessionIdx) => {
        const match = (session.exercises || []).find(
          (ex) => (ex.name || '').toLowerCase() === key
        );
        if (!match) return;
        const loggedSets = getLoggedSets(match.sets);
        const best = getBestSetFromSets(loggedSets);
        if (!best) return;
        const volume = loggedSets.reduce(
          (sum, s) => sum + ((parseFloat(s.weight) || 0) * (parseInt(s.reps, 10) || 0)),
          0
        );
        points.push({
          id: `${dateStr}-${sessionIdx}`,
          dateStr,
          sessionIdx,
          routineName: session.routineName || 'Workout',
          maxWeight: best.weight,
          bestReps: best.reps,
          volume,
          setCount: loggedSets.length
        });
      });
    });

  return points.slice(-Math.max(1, limit));
};

// Shared set logger (same look as before, used by scheduled + spontaneous)
function ExerciseSetLogger({
  exercise,
  sets,
  pastSets,
  onUpdateCell,
  onToggleDone,
  onAddSet,
  onRemoveSet,
  onTriggerTimer
}) {
  const rowCount = sets?.length || 0;

  return (
    <View style={styles.exerciseLogBlock}>
      <View style={styles.rowBetween}>
        <Text style={[styles.exerciseLogName, { flex: 1, marginBottom: 0 }]}>{exercise.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={styles.setAdjustBtn} onPress={() => onRemoveSet(exercise.id)}>
            <Ionicons name="remove" size={14} color={THEME.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.setAdjustBtn, { marginLeft: 6 }]} onPress={() => onAddSet(exercise.id)}>
            <Ionicons name="add" size={14} color={THEME.text} />
          </TouchableOpacity>
        </View>
      </View>

      {pastSets ? (
        <Text style={styles.prevHint}>
          Last session:{' '}
          {pastSets.map((s, i) => `${s.weight || 0}×${s.reps || 0}`).join(' · ')}
        </Text>
      ) : (
        <Text style={styles.prevHint}>No previous log for this exercise</Text>
      )}

      <View style={[styles.logMetricsRowHeader, { marginBottom: 4, marginTop: 8 }]}>
        <Text style={[styles.columnLabel, { width: 35, textAlign: 'left' }]}>Set</Text>
        <Text style={[styles.columnLabel, { flex: 1, marginRight: 8 }]}>KG Weight</Text>
        <Text style={[styles.columnLabel, { flex: 1, marginRight: 8 }]}>Reps Done</Text>
        <Text style={[styles.columnLabel, { width: 35 }]}>Timer</Text>
      </View>

      {Array.from({ length: rowCount }).map((_, setIndex) => {
        const isSetDone = sets?.[setIndex]?.done || false;
        const past = pastSets?.[setIndex];
        return (
          <View key={setIndex}>
            <View style={[styles.logMetricsRowHeader, { marginBottom: 4 }, isSetDone && styles.rowCompletedHighlight]}>
              <TouchableOpacity
                style={[styles.setCheckBtn, isSetDone && styles.setCheckBtnActive]}
                onPress={() => onToggleDone(exercise.id, setIndex)}
              >
                {isSetDone ? (
                  <Ionicons name="checkmark-sharp" size={14} color={THEME.text} />
                ) : (
                  <Text style={styles.setCheckText}>{setIndex + 1}</Text>
                )}
              </TouchableOpacity>
              <View style={{ flex: 1, marginRight: 8 }}>
                <TextInput
                  style={[styles.logInputCompact, isSetDone && styles.logInputDisabled]}
                  placeholder="0.0"
                  placeholderTextColor="#555"
                  keyboardType="decimal-pad"
                  editable={!isSetDone}
                  value={sets?.[setIndex]?.weight || ''}
                  onChangeText={(val) => onUpdateCell(exercise.id, setIndex, 'weight', val)}
                />
              </View>
              <View style={{ flex: 1, marginRight: 8 }}>
                <TextInput
                  style={[styles.logInputCompact, isSetDone && styles.logInputDisabled]}
                  placeholder="0"
                  placeholderTextColor="#555"
                  keyboardType="numeric"
                  editable={!isSetDone}
                  value={sets?.[setIndex]?.reps || ''}
                  onChangeText={(val) => onUpdateCell(exercise.id, setIndex, 'reps', val)}
                />
              </View>
              <TouchableOpacity style={styles.timerTriggerBtn} onPress={onTriggerTimer}>
                <Ionicons name="stopwatch-outline" size={16} color={THEME.accent} />
              </TouchableOpacity>
            </View>
            {past ? (
              <Text style={styles.prevSetLine}>
                Prev set {setIndex + 1}: {past.weight || 0} kg × {past.reps || 0}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export default function App() {
  const insets = useSafeAreaInsets();
  const [currentTab, setCurrentTab] = useState('today');
  const [todayPane, setTodayPane] = useState('workout'); // 'workout' | 'stats'
  const [historyPane, setHistoryPane] = useState('log'); // 'log' | 'prs'
  const [routines, setRoutines] = useState([]);
  const [schedule, setSchedule] = useState({
    Monday: null, Tuesday: null, Wednesday: null, Thursday: null, Friday: null, Saturday: null, Sunday: null
  });
  const [history, setHistory] = useState({});
  const [customExercisePool, setCustomExercisePool] = useState([]);
  const [addictions, setAddictions] = useState([]);
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerDuration, setTimerDuration] = useState(180);

  const [isGymDayChecked, setIsGymDayChecked] = useState(false);
  const [activeWorkoutLogs, setActiveWorkoutLogs] = useState({});
  const [impromptuRoutine, setImpromptuRoutine] = useState(null);
  const [isEditingSavedWorkout, setIsEditingSavedWorkout] = useState(false);
  const [editingSessionIndex, setEditingSessionIndex] = useState(null);
  const [editingHistoryDate, setEditingHistoryDate] = useState(null);
  const [workoutNote, setWorkoutNote] = useState('');
  const [sessionExtraExercises, setSessionExtraExercises] = useState([]);
  const [workoutStartedAt, setWorkoutStartedAt] = useState(null);
  const [workoutElapsedSeconds, setWorkoutElapsedSeconds] = useState(0);

  const [isSpontaneousMode, setIsSpontaneousMode] = useState(false);
  const [spontaneousExercises, setSpontaneousExercises] = useState([]);
  const [spontaneousExInput, setSpontaneousExInput] = useState('');
  const [spontaneousSetsInput, setSpontaneousSetsInput] = useState(String(DEFAULT_SETS));
  const [showSpontaneousSuggestions, setShowSpontaneousSuggestions] = useState(false);

  const [prModalVisible, setPrModalVisible] = useState(false);
  const [newPrExName, setNewPrExName] = useState('');
  const [newPrWeight, setNewPrWeight] = useState('');
  const [showPrSuggestions, setShowPrSuggestions] = useState(false);

  const [routineModalVisible, setRoutineModalVisible] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState(null);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineColor, setNewRoutineColor] = useState('Blue');
  const [newRoutineExercises, setNewRoutineExercises] = useState([]);

  const [exInput, setExInput] = useState('');
  const [exSetsInput, setExSetsInput] = useState(String(DEFAULT_SETS));
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [schedulerModalVisible, setSchedulerModalVisible] = useState(false);
  const [selectedScheduleDay, setSelectedScheduleDay] = useState(null);

  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);
  const [historyNoteEdits, setHistoryNoteEdits] = useState({});
  const [exerciseChartVisible, setExerciseChartVisible] = useState(false);
  const [selectedExerciseChartName, setSelectedExerciseChartName] = useState(null);

  const [addictionModalVisible, setAddictionModalVisible] = useState(false);
  const [newAddictionName, setNewAddictionName] = useState('');
  const [newAddictionColor, setNewAddictionColor] = useState('Red');
  const [recoveryWindows, setRecoveryWindows] = useState(DEFAULT_RECOVERY_HOURS);
  const [recoverySettingsVisible, setRecoverySettingsVisible] = useState(false);

  const [supplements, setSupplements] = useState([]); // empty by default
  const [supplementLog, setSupplementLog] = useState({}); // { date: { suppId: true } }
  const [suppModalVisible, setSuppModalVisible] = useState(false);
  const [editingSuppId, setEditingSuppId] = useState(null);
  const [suppNameInput, setSuppNameInput] = useState('');
  const [suppDoseInput, setSuppDoseInput] = useState('');
  const [showSuppSuggestions, setShowSuppSuggestions] = useState(false);

  const [sleepLog, setSleepLog] = useState({}); // { date: { bed: '23:30', wake: '07:00' } }
  const [weightLog, setWeightLog] = useState({}); // { date: number }
  const [sleepBedInput, setSleepBedInput] = useState('');
  const [sleepWakeInput, setSleepWakeInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [proteinGoal, setProteinGoal] = useState(DEFAULT_PROTEIN_GOAL);
  const [proteinLog, setProteinLog] = useState({}); // { date: grams }
  const [proteinInput, setProteinInput] = useState('');

  const [monthlyPhotos, setMonthlyPhotos] = useState({}); // { 'YYYY-MM': { photos: [{id, uri}], savedAt } }
  const [photoPromptMonth, setPhotoPromptMonth] = useState(null);
  const [monthlyCompareVisible, setMonthlyCompareVisible] = useState(false);
  const [monthlyCaptureVisible, setMonthlyCaptureVisible] = useState(false);
  const [weeklyReportVisible, setWeeklyReportVisible] = useState(false);
  const [albumVisible, setAlbumVisible] = useState(false);
  const [compareMonthKey, setCompareMonthKey] = useState(null); // previous month being compared
  const [captureMonthKey, setCaptureMonthKey] = useState(null);
  const [photoPicking, setPhotoPicking] = useState(false);

  // Rest timer
  useEffect(() => {
    if (!timerActive) return undefined;

    if (timerSeconds <= 0) {
      setTimerActive(false);
      try {
        if (Platform.OS !== 'web') {
          Vibration.vibrate([0, 400, 200, 400]);
        }
      } catch (e) {
        // ignore vibration failures
      }
      Alert.alert('Rest over', 'Time for your next set.');
      return undefined;
    }

    const id = setTimeout(() => {
      setTimerSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(id);
  }, [timerActive, timerSeconds]);

  useEffect(() => {
    if (!workoutStartedAt) return undefined;
    const tick = () => {
      setWorkoutElapsedSeconds(Math.max(0, Math.floor((Date.now() - workoutStartedAt) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [workoutStartedAt]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedRoutines = await AsyncStorage.getItem(STORAGE_KEYS.ROUTINES);
      const storedSchedule = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULE);
      const storedHistory = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
      const storedCustomEx = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_EX_POOL);
      const storedAddictions = await AsyncStorage.getItem(STORAGE_KEYS.ADDICTIONS);
      const storedPrs = await AsyncStorage.getItem(STORAGE_KEYS.PRS);
      const storedRecoveryWindows = await AsyncStorage.getItem(STORAGE_KEYS.RECOVERY_WINDOWS);
      const storedSupplements = await AsyncStorage.getItem(STORAGE_KEYS.SUPPLEMENTS);
      const storedSupplementLog = await AsyncStorage.getItem(STORAGE_KEYS.SUPPLEMENT_LOG);
      const storedSleepLog = await AsyncStorage.getItem(STORAGE_KEYS.SLEEP_LOG);
      const storedWeightLog = await AsyncStorage.getItem(STORAGE_KEYS.WEIGHT_LOG);
      const storedProteinGoal = await AsyncStorage.getItem(STORAGE_KEYS.PROTEIN_GOAL);
      const storedProteinLog = await AsyncStorage.getItem(STORAGE_KEYS.PROTEIN_LOG);
      const storedMonthlyPhotos = await AsyncStorage.getItem(STORAGE_KEYS.MONTHLY_PHOTOS);
      const storedPhotoPromptMonth = await AsyncStorage.getItem(STORAGE_KEYS.PHOTO_PROMPT_MONTH);

      if (storedRoutines) setRoutines(JSON.parse(storedRoutines));
      if (storedSchedule) setSchedule(JSON.parse(storedSchedule));
      if (storedHistory) setHistory(JSON.parse(storedHistory));
      if (storedCustomEx) setCustomExercisePool(JSON.parse(storedCustomEx));
      if (storedAddictions) setAddictions(JSON.parse(storedAddictions));
      if (storedPrs) setPrs(JSON.parse(storedPrs));
      if (storedRecoveryWindows) {
        setRecoveryWindows({ ...DEFAULT_RECOVERY_HOURS, ...JSON.parse(storedRecoveryWindows) });
      }
      if (storedSupplements) setSupplements(JSON.parse(storedSupplements));
      if (storedSupplementLog) setSupplementLog(JSON.parse(storedSupplementLog));
      if (storedSleepLog) {
        const parsedSleep = JSON.parse(storedSleepLog);
        setSleepLog(parsedSleep);
        const todaySleep = parsedSleep[getLocalDateString()];
        if (todaySleep) {
          setSleepBedInput(todaySleep.bed || '');
          setSleepWakeInput(todaySleep.wake || '');
        }
      }
      if (storedWeightLog) {
        const parsedWeight = JSON.parse(storedWeightLog);
        setWeightLog(parsedWeight);
        const todayWeight = parsedWeight[getLocalDateString()];
        if (todayWeight != null) setWeightInput(String(todayWeight).replace('.', ','));
      }
      if (storedProteinGoal) {
        const g = parseInt(JSON.parse(storedProteinGoal), 10);
        if (!Number.isNaN(g) && g > 0) setProteinGoal(g);
      }
      if (storedProteinLog) {
        const parsedProtein = JSON.parse(storedProteinLog);
        setProteinLog(parsedProtein);
        const todayProtein = parsedProtein[getLocalDateString()];
        if (todayProtein != null) setProteinInput(String(todayProtein));
      }
      if (storedMonthlyPhotos) setMonthlyPhotos(JSON.parse(storedMonthlyPhotos));
      if (storedPhotoPromptMonth) setPhotoPromptMonth(JSON.parse(storedPhotoPromptMonth));
    } catch (e) {
      Alert.alert('Error', 'Could not load your saved data.');
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      Alert.alert('Save Error', 'Could not save. Please try again.');
    }
  };

  const combinedExercisePool = useMemo(() => {
    return [...new Set([...BASE_EXERCISE_POOL, ...customExercisePool])];
  }, [customExercisePool]);

  const todayStr = getLocalDateString();
  const todayHistorySessions = useMemo(() => getSessionsForDate(history, todayStr), [history, todayStr]);
  const todayHistoryEntry = todayHistorySessions[todayHistorySessions.length - 1] || null;

  const isTodayCompleted = useMemo(() => {
    return todayHistorySessions.length > 0 && !isEditingSavedWorkout;
  }, [todayHistorySessions, isEditingSavedWorkout]);

  const gymStreak = useMemo(() => getGymDayStreak(history), [history]);
  const bestGymWeek = useMemo(() => getBestGymWeek(history), [history]);
  const todayProtein = proteinLog[todayStr] != null ? Number(proteinLog[todayStr]) : 0;
  const proteinProgress = Math.max(0, Math.min(1, todayProtein / Math.max(1, proteinGoal)));

  const recoveryMatrix = useMemo(() => {
    const now = Date.now();
    const latestCategoryTimestamp = RECOVERY_CATEGORIES.reduce((acc, item) => {
      acc[item] = null;
      return acc;
    }, {});

    Object.values(history).forEach((dayEntry) => {
      const daySessions = Array.isArray(dayEntry) ? dayEntry : [dayEntry];
      daySessions.forEach((entry) => {
        const sessionTimestamp = entry.timestamp || 0;
        (entry.exercises || []).forEach((ex) => {
          if (!exerciseHasLoggedWork(ex)) return;
          const category = resolveExerciseCategory(ex.name);
          if (!category || !RECOVERY_CATEGORIES.includes(category)) return;
          const current = latestCategoryTimestamp[category];
          if (!current || sessionTimestamp > current) {
            latestCategoryTimestamp[category] = sessionTimestamp;
          }
        });
      });
    });

    return RECOVERY_CATEGORIES.map((category) => {
      const targetHours = Math.max(1, parseInt(recoveryWindows[category], 10) || 36);
      const lastHitTimestamp = latestCategoryTimestamp[category];
      const hoursSince = lastHitTimestamp ? (now - lastHitTimestamp) / (1000 * 60 * 60) : Number.POSITIVE_INFINITY;
      const hoursLeft = Math.max(0, targetHours - hoursSince);
      const progress = Math.max(0, Math.min(1, hoursSince / targetHours));

      let status = 'Ready';
      let color = '#22C55E';
      if (hoursLeft > 0 && progress < 0.5) {
        status = 'Fatigued';
        color = '#EF4444';
      } else if (hoursLeft > 0) {
        status = 'Recovering';
        color = '#F59E0B';
      }

      return {
        category,
        status,
        color,
        progress,
        hoursLeft,
        targetHours,
      };
    });
  }, [history, recoveryWindows]);

  const weeklySetsMatrix = useMemo(() => {
    const weekStart = getWeekStartDate();
    const weekStartStr = getLocalDateString(weekStart);
    const counts = RECOVERY_CATEGORIES.reduce((acc, item) => {
      acc[item] = 0;
      return acc;
    }, {});

    Object.keys(history).forEach((dateStr) => {
      if (dateStr < weekStartStr) return;
      const sessions = getSessionsForDate(history, dateStr);
      sessions.forEach((entry) => {
        (entry.exercises || []).forEach((ex) => {
          const category = resolveExerciseCategory(ex.name);
          if (!category || !Object.prototype.hasOwnProperty.call(counts, category)) return;
          counts[category] += getLoggedSets(ex.sets).length;
        });
      });
    });

    const maxCount = Math.max(1, ...Object.values(counts));

    return RECOVERY_CATEGORIES.map((category) => {
      const count = counts[category] || 0;
      const ratio = count / maxCount;
      let color = '#2C2C38';
      if (count > 0 && ratio < 0.35) color = '#F59E0B';
      else if (count > 0) color = '#22C55E';

      return {
        category,
        count,
        barWidth: Math.max(count > 0 ? 0.08 : 0, ratio),
        color
      };
    });
  }, [history]);

  const sleepStats = useMemo(() => {
    const dates = getLastNDateStrings(7);
    const nights = dates.map((dateStr) => {
      const entry = sleepLog[dateStr];
      const bedMin = entry ? parseTimeToMinutes(entry.bed) : null;
      const wakeMin = entry ? parseTimeToMinutes(entry.wake) : null;
      const hours = calcSleepHours(bedMin, wakeMin);
      const day = new Date(`${dateStr}T12:00:00`);
      return {
        dateStr,
        label: DAY_SHORT[day.getDay()],
        bedMin,
        wakeMin,
        hours,
        color: sleepBarColor(hours)
      };
    });

    const logged = nights.filter(n => n.hours != null);
    const avgHours = logged.length
      ? logged.reduce((sum, n) => sum + n.hours, 0) / logged.length
      : null;
    const avgBed = logged.length
      ? logged.reduce((sum, n) => sum + n.bedMin, 0) / logged.length
      : null;
    const avgWake = logged.length
      ? logged.reduce((sum, n) => sum + n.wakeMin, 0) / logged.length
      : null;
    const onTarget = logged.filter(n => n.hours >= SLEEP_TARGET_HOURS).length;
    const sleepDebtHours = logged.reduce((sum, n) => sum + (n.hours - SLEEP_TARGET_HOURS), 0);
    const longest = logged.length ? Math.max(...logged.map(n => n.hours)) : null;
    const lastLogged = [...nights].reverse().find(n => n.hours != null) || null;

    return {
      nights,
      avgHours,
      avgBed,
      avgWake,
      onTarget,
      loggedCount: logged.length,
      sleepDebtHours,
      longest,
      lastLogged
    };
  }, [sleepLog]);

  const weightStats = useMemo(() => {
    const dates = getLastNDateStrings(7);
    const points = dates.map((dateStr) => {
      const value = weightLog[dateStr];
      const day = new Date(`${dateStr}T12:00:00`);
      return {
        dateStr,
        label: DAY_SHORT[day.getDay()],
        value: value != null ? Number(value) : null
      };
    });
    const logged = points.filter(p => p.value != null);
    const latest = logged.length ? logged[logged.length - 1].value : null;
    const first = logged.length ? logged[0].value : null;
    const delta = latest != null && first != null ? latest - first : null;
    const maxVal = logged.length ? Math.max(...logged.map(p => p.value)) : 1;
    const minVal = logged.length ? Math.min(...logged.map(p => p.value)) : 0;
    const range = Math.max(1, maxVal - minVal);

    return { points, logged, latest, first, delta, maxVal, minVal, range };
  }, [weightLog]);

  const weeklyReport = useMemo(() => {
    const weekStart = getWeekStartDate();
    const weekStartStr = getLocalDateString(weekStart);
    const dates = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      dates.push(getLocalDateString(d));
    }

    const setsByMuscle = RECOVERY_CATEGORIES.reduce((acc, c) => {
      acc[c] = 0;
      return acc;
    }, {});
    let workoutDays = 0;
    let totalSessions = 0;
    let totalExercises = 0;
    let totalWorkoutSeconds = 0;

    dates.forEach((dateStr) => {
      const sessions = getSessionsForDate(history, dateStr);
      const loggedSessions = sessions.filter(sessionHasLoggedWork);
      if (loggedSessions.length > 0) workoutDays += 1;
      totalSessions += loggedSessions.length;
      loggedSessions.forEach((session) => {
        totalWorkoutSeconds += Math.max(0, parseInt(session.durationSeconds, 10) || 0);
        (session.exercises || []).forEach((ex) => {
          const loggedSets = getLoggedSets(ex.sets);
          if (loggedSets.length === 0) return;
          totalExercises += 1;
          const category = resolveExerciseCategory(ex.name);
          if (category && Object.prototype.hasOwnProperty.call(setsByMuscle, category)) {
            setsByMuscle[category] += loggedSets.length;
          }
        });
      });
    });

    const totalSets = Object.values(setsByMuscle).reduce((a, b) => a + b, 0);

    const sleepHours = dates.map((dateStr) => {
      const entry = sleepLog[dateStr];
      if (!entry) return null;
      return calcSleepHours(parseTimeToMinutes(entry.bed), parseTimeToMinutes(entry.wake));
    }).filter((h) => h != null);
    const avgSleep = sleepHours.length
      ? sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length
      : null;

    const proteinDays = dates
      .map((d) => (proteinLog[d] != null ? Number(proteinLog[d]) : null))
      .filter((v) => v != null);
    const avgProtein = proteinDays.length
      ? proteinDays.reduce((a, b) => a + b, 0) / proteinDays.length
      : null;
    const proteinGoalHits = proteinDays.filter((v) => v >= proteinGoal).length;

    const weights = dates
      .map((d) => (weightLog[d] != null ? Number(weightLog[d]) : null))
      .filter((v) => v != null);
    const weightDelta = weights.length >= 2 ? weights[weights.length - 1] - weights[0] : null;

    const weekEnd = dates[dates.length - 1];

    return {
      weekStartStr,
      weekEnd,
      workoutDays,
      totalSessions,
      totalExercises,
      totalSets,
      totalWorkoutSeconds,
      setsByMuscle,
      avgSleep,
      sleepNights: sleepHours.length,
      avgProtein,
      proteinGoalHits,
      proteinDays: proteinDays.length,
      weightDelta,
      weightLogs: weights.length
    };
  }, [history, sleepLog, proteinLog, proteinGoal, weightLog]);

  const getPreviousPerformance = useCallback((exerciseName, currentDateStr) => {
    const sortedDates = Object.keys(history)
      .filter(d => d < currentDateStr)
      .sort((a, b) => (a < b ? 1 : -1));

    for (const d of sortedDates) {
      const sessions = getSessionsForDate(history, d);
      for (let i = sessions.length - 1; i >= 0; i -= 1) {
        const pastEntry = sessions[i];
        const foundEx = pastEntry.exercises?.find(
          e => e.name.toLowerCase() === exerciseName.toLowerCase()
        );
        if (foundEx && exerciseHasLoggedWork(foundEx)) {
          return getLoggedSets(foundEx.sets);
        }
      }
    }
    return null;
  }, [history]);

  const handleMoveExerciseInCreator = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newRoutineExercises.length) return;
    const updated = [...newRoutineExercises];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedItem);
    setNewRoutineExercises(updated);
  };

  const handleUpdateExerciseSetsInCreator = (index, newSets) => {
    const setsVal = parseInt(newSets, 10) || 1;
    const updated = [...newRoutineExercises];
    updated[index].defaultSets = setsVal;
    setNewRoutineExercises(updated);
  };

  const handleCreateOrUpdateRoutine = () => {
    if (!newRoutineName.trim()) return Alert.alert('Invalid Input', 'Please enter a routine name.');

    let updatedRoutines;
    if (editingRoutineId) {
      updatedRoutines = routines.map(r => r.id === editingRoutineId ? {
        ...r,
        name: newRoutineName,
        color: ROUTINE_COLORS[newRoutineColor],
        colorName: newRoutineColor,
        exercises: newRoutineExercises
      } : r);
    } else {
      const newRoutine = {
        id: Date.now().toString(),
        name: newRoutineName,
        color: ROUTINE_COLORS[newRoutineColor],
        colorName: newRoutineColor,
        exercises: newRoutineExercises
      };
      updatedRoutines = [...routines, newRoutine];
    }

    setRoutines(updatedRoutines);
    saveData(STORAGE_KEYS.ROUTINES, updatedRoutines);
    handleCloseRoutineModal();
  };

  const handleStartEditRoutine = (routine) => {
    setEditingRoutineId(routine.id);
    setNewRoutineName(routine.name);
    setNewRoutineColor(routine.colorName || 'Blue');
    setNewRoutineExercises(routine.exercises);
    setRoutineModalVisible(true);
  };

  const handleCloseRoutineModal = () => {
    setNewRoutineName('');
    setNewRoutineColor('Blue');
    setNewRoutineExercises([]);
    setEditingRoutineId(null);
    setExInput('');
    setExSetsInput(String(DEFAULT_SETS));
    setRoutineModalVisible(false);
  };

  const handleDeleteRoutine = (id) => {
    const performDelete = () => {
      const updatedRoutines = routines.filter(r => r.id !== id);
      setRoutines(updatedRoutines);
      saveData(STORAGE_KEYS.ROUTINES, updatedRoutines);

      const updatedSchedule = { ...schedule };
      DAYS_OF_WEEK.forEach(day => {
        if (updatedSchedule[day] === id) updatedSchedule[day] = null;
      });
      setSchedule(updatedSchedule);
      saveData(STORAGE_KEYS.SCHEDULE, updatedSchedule);
      if (impromptuRoutine?.id === id) setImpromptuRoutine(null);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Delete this routine?')) performDelete();
    } else {
      Alert.alert('Delete Routine', 'This will also remove it from your weekly schedule.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete }
      ]);
    }
  };

  const handleAddExerciseToCreator = () => {
    const exerciseName = exInput.trim();
    if (!exerciseName) return;

    const setsCount = parseInt(exSetsInput, 10) || DEFAULT_SETS;
    const newEx = {
      id: Date.now().toString() + Math.random().toString(),
      name: exerciseName,
      defaultSets: setsCount
    };

    const itemExists = combinedExercisePool.some(item => item.toLowerCase() === exerciseName.toLowerCase());
    if (!itemExists) {
      const updatedCustomPool = [...customExercisePool, exerciseName];
      setCustomExercisePool(updatedCustomPool);
      saveData(STORAGE_KEYS.CUSTOM_EX_POOL, updatedCustomPool);
    }

    setNewRoutineExercises([...newRoutineExercises, newEx]);
    setExInput('');
    setExSetsInput(String(DEFAULT_SETS));
    setShowSuggestions(false);
  };

  const beginWorkoutClock = (resumeFrom = 0) => {
    const base = Math.max(0, Math.floor(Number(resumeFrom) || 0));
    setWorkoutElapsedSeconds(base);
    setWorkoutStartedAt(Date.now() - (base * 1000));
  };

  const haltWorkoutClock = (reset = true) => {
    setWorkoutStartedAt(null);
    if (reset) setWorkoutElapsedSeconds(0);
  };

  const resetLiveSessionExtras = () => {
    setSessionExtraExercises([]);
    setSpontaneousExInput('');
    setSpontaneousSetsInput(String(DEFAULT_SETS));
    setShowSpontaneousSuggestions(false);
  };

  const handleStartSpontaneousSession = () => {
    setIsEditingSavedWorkout(false);
    setEditingSessionIndex(null);
    setEditingHistoryDate(null);
    setImpromptuRoutine(null);
    setIsSpontaneousMode(true);
    setSpontaneousExercises([]);
    setActiveWorkoutLogs({});
    setWorkoutNote('');
    resetLiveSessionExtras();
    setIsGymDayChecked(true);
    beginWorkoutClock(0);
    setCurrentTab('today');
    setTodayPane('workout');
  };

  const handleStartExtraRoutine = (routine) => {
    setIsEditingSavedWorkout(false);
    setEditingSessionIndex(null);
    setEditingHistoryDate(null);
    setIsSpontaneousMode(false);
    setSpontaneousExercises([]);
    setWorkoutNote('');
    setActiveWorkoutLogs({});
    resetLiveSessionExtras();
    setImpromptuRoutine(routine);
    setIsGymDayChecked(true);
    beginWorkoutClock(0);
    setTodayPane('workout');
    setCurrentTab('today');
  };

  const handleAddExerciseToActiveWorkout = (nameOverride) => {
    const exName = (typeof nameOverride === 'string' ? nameOverride : spontaneousExInput).trim();
    if (!exName) return;

    const setsCount = parseInt(spontaneousSetsInput, 10) || DEFAULT_SETS;
    const newExId = Date.now().toString() + Math.random().toString();
    const newEx = {
      id: newExId,
      name: exName,
      defaultSets: setsCount
    };

    const itemExists = combinedExercisePool.some(item => item.toLowerCase() === exName.toLowerCase());
    if (!itemExists) {
      const updatedCustomPool = [...customExercisePool, exName];
      setCustomExercisePool(updatedCustomPool);
      saveData(STORAGE_KEYS.CUSTOM_EX_POOL, updatedCustomPool);
    }

    if (isSpontaneousMode) {
      setSpontaneousExercises(prev => [...prev, newEx]);
    } else {
      setSessionExtraExercises(prev => [...prev, newEx]);
    }

    setActiveWorkoutLogs(prev => ({
      ...prev,
      [newExId]: buildEmptySets(setsCount)
    }));

    setSpontaneousExInput('');
    setSpontaneousSetsInput(String(DEFAULT_SETS));
    setShowSpontaneousSuggestions(false);
  };

  const persistWorkoutToHistory = (routineName, color, exercisesList) => {
    const structuredExercises = exercisesList
      .map(ex => {
        const setsFilled = activeWorkoutLogs[ex.id] || [];
        const loggedSets = setsFilled
          .filter(isSetLogged)
          .map(s => ({
            weight: parseFloat(s.weight) || 0,
            reps: parseInt(s.reps, 10) || 0,
            done: !!s.done
          }));
        return {
          name: ex.name,
          sets: loggedSets
        };
      })
      .filter(ex => ex.sets.length > 0);

    if (structuredExercises.length === 0) {
      return Alert.alert(
        'Nothing Logged',
        'Enter weight or reps for at least one set before saving. Empty exercises are not saved.'
      );
    }

    const targetDate = (isEditingSavedWorkout && editingHistoryDate) ? editingHistoryDate : todayStr;
    const existingSessions = getSessionsForDate(history, targetDate);
    const existingForEdit = (isEditingSavedWorkout && editingSessionIndex !== null)
      ? existingSessions[editingSessionIndex]
      : null;

    const newSession = {
      routineName,
      color,
      exercises: structuredExercises,
      timestamp: Date.now(),
      note: workoutNote.trim(),
      durationSeconds: isEditingSavedWorkout
        ? (existingForEdit?.durationSeconds ?? workoutElapsedSeconds)
        : workoutElapsedSeconds,
      startedAt: isEditingSavedWorkout
        ? existingForEdit?.startedAt
        : (workoutStartedAt || (Date.now() - (workoutElapsedSeconds * 1000)))
    };

    let nextSessions;
    if (isEditingSavedWorkout && editingSessionIndex !== null && existingSessions[editingSessionIndex]) {
      nextSessions = existingSessions.map((session, idx) => (
        idx === editingSessionIndex
          ? { ...session, ...newSession, timestamp: session.timestamp || newSession.timestamp }
          : session
      ));
    } else {
      nextSessions = [...existingSessions, newSession];
    }

    const updatedHistory = {
      ...history,
      [targetDate]: nextSessions
    };

    setHistory(updatedHistory);
    saveData(STORAGE_KEYS.HISTORY, updatedHistory);
    setIsEditingSavedWorkout(false);
    setEditingSessionIndex(null);
    setEditingHistoryDate(null);
    setIsGymDayChecked(false);
    setImpromptuRoutine(null);
    setIsSpontaneousMode(false);
    setSpontaneousExercises([]);
    setActiveWorkoutLogs({});
    setWorkoutNote('');
    resetLiveSessionExtras();
    haltWorkoutClock(true);
    setTimerSeconds(0);
    setTimerActive(false);
    Alert.alert('Saved', 'Workout saved to history.');
    setCurrentTab('history');
    setHistoryPane('log');
  };

  const handleSaveSpontaneousSession = () => {
    if (spontaneousExercises.length === 0) {
      return Alert.alert('Empty Session', 'Add at least one exercise before saving.');
    }

    const targetDate = editingHistoryDate || todayStr;
    const sessions = getSessionsForDate(history, targetDate);
    const editingEntry = (isEditingSavedWorkout && editingSessionIndex !== null)
      ? sessions[editingSessionIndex]
      : null;

    persistWorkoutToHistory(
      editingEntry?.routineName || 'Spontaneous Session',
      editingEntry?.color || THEME.accent,
      spontaneousExercises
    );
  };

  const handleEditSavedWorkout = (dateStr, sessionIdx) => {
    const sessions = getSessionsForDate(history, dateStr);
    const entry = sessions[sessionIdx];
    if (!entry) return;

    const exercises = (entry.exercises || []).map((ex, i) => ({
      id: `edit-${Date.now()}-${i}`,
      name: ex.name,
      defaultSets: ex.sets?.length || DEFAULT_SETS
    }));

    const logs = {};
    exercises.forEach((ex, i) => {
      const savedSets = entry.exercises[i]?.sets || [];
      logs[ex.id] = savedSets.length
        ? savedSets.map(s => ({
          weight: s.weight != null ? String(s.weight) : '',
          reps: s.reps != null ? String(s.reps) : '',
          done: !!s.done
        }))
        : [emptySet()];
    });

    setSpontaneousExercises(exercises);
    setActiveWorkoutLogs(logs);
    setWorkoutNote(entry.note || '');
    setIsSpontaneousMode(true);
    setIsEditingSavedWorkout(true);
    setEditingHistoryDate(dateStr);
    setEditingSessionIndex(sessionIdx);
    setIsGymDayChecked(true);
    resetLiveSessionExtras();
    haltWorkoutClock(true);
    setWorkoutElapsedSeconds(parseInt(entry.durationSeconds, 10) || 0);
    setHistoryModalVisible(false);
    setTodayPane('workout');
    setCurrentTab('today');
  };

  const handleEditTodayWorkout = () => {
    if (!todayHistorySessions.length) return;
    handleEditSavedWorkout(todayStr, todayHistorySessions.length - 1);
  };

  const cancelEditingSession = () => {
    setIsSpontaneousMode(false);
    setIsEditingSavedWorkout(false);
    setEditingSessionIndex(null);
    setEditingHistoryDate(null);
    setSpontaneousExercises([]);
    setActiveWorkoutLogs({});
    setWorkoutNote('');
    resetLiveSessionExtras();
    haltWorkoutClock(true);
  };

  const openHistoryDay = (dateKey) => {
    const sessions = getSessionsForDate(history, dateKey);
    const drafts = {};
    sessions.forEach((s, i) => {
      drafts[i] = s.note || '';
    });
    setHistoryNoteEdits(drafts);
    setSelectedHistoryDate(dateKey);
    setHistoryModalVisible(true);
  };

  const openExerciseChart = (exerciseName) => {
    if (!exerciseName) return;
    setSelectedExerciseChartName(exerciseName);
    setExerciseChartVisible(true);
  };

  const exerciseProgressSeries = useMemo(
    () => buildExerciseProgressSeries(history, selectedExerciseChartName, 12),
    [history, selectedExerciseChartName]
  );

  const exerciseProgressStats = useMemo(() => {
    if (!exerciseProgressSeries.length) {
      return { maxWeight: null, latest: null, first: null, delta: null, maxVolume: 1 };
    }
    const weights = exerciseProgressSeries.map((p) => p.maxWeight);
    const maxWeight = Math.max(...weights);
    const latest = exerciseProgressSeries[exerciseProgressSeries.length - 1];
    const first = exerciseProgressSeries[0];
    const delta = latest.maxWeight - first.maxWeight;
    const maxVolume = Math.max(1, ...exerciseProgressSeries.map((p) => p.volume || 0));
    return { maxWeight, latest, first, delta, maxVolume };
  }, [exerciseProgressSeries]);

  const handleSaveHistoryNote = (sessionIdx) => {
    if (!selectedHistoryDate) return;
    const sessions = getSessionsForDate(history, selectedHistoryDate);
    if (!sessions[sessionIdx]) return;

    const noteText = (historyNoteEdits[sessionIdx] || '').trim();
    const updatedSessions = sessions.map((session, idx) => (
      idx === sessionIdx ? { ...session, note: noteText } : session
    ));

    const updatedHistory = {
      ...history,
      [selectedHistoryDate]: updatedSessions
    };
    setHistory(updatedHistory);
    saveData(STORAGE_KEYS.HISTORY, updatedHistory);
    Alert.alert('Saved', noteText ? 'Note saved.' : 'Note cleared.');
  };

  const handleSavePR = () => {
    if (!newPrExName.trim() || !newPrWeight.trim()) {
      return Alert.alert('Invalid Input', 'Enter an exercise name and weight.');
    }

    const newPr = {
      id: Date.now().toString(),
      exercise: newPrExName.trim(),
      weight: parseFloat(newPrWeight) || 0,
      date: getLocalDateString()
    };

    const updated = [newPr, ...prs];
    setPrs(updated);
    saveData(STORAGE_KEYS.PRS, updated);

    setNewPrExName('');
    setNewPrWeight('');
    Alert.alert('PR Saved', 'Personal record saved.');
  };

  const handleDeletePR = (id) => {
    const updated = prs.filter(p => p.id !== id);
    setPrs(updated);
    saveData(STORAGE_KEYS.PRS, updated);
  };

  const handleAssignSchedule = (routineId) => {
    if (!selectedScheduleDay) return;
    const updated = { ...schedule, [selectedScheduleDay]: routineId };
    setSchedule(updated);
    saveData(STORAGE_KEYS.SCHEDULE, updated);
    setSchedulerModalVisible(false);
    setSelectedScheduleDay(null);
  };

  const currentActiveRoutine = useMemo(() => {
    const day = getTodayDayName();
    const scheduledId = schedule[day];
    const foundScheduled = routines.find(r => r.id === scheduledId);
    // Prefer on-the-fly / extra session picks over the weekly schedule
    return impromptuRoutine || foundScheduled;
  }, [schedule, routines, impromptuRoutine]);

  // Init logs for scheduled/impromptu routine without wiping in-progress sets
  useEffect(() => {
    if (!currentActiveRoutine || isSpontaneousMode || isEditingSavedWorkout) return;

    setSessionExtraExercises([]);
    setActiveWorkoutLogs((prev) => {
      const next = {};
      currentActiveRoutine.exercises.forEach((ex) => {
        if (prev[ex.id]?.length) {
          next[ex.id] = prev[ex.id];
        } else {
          next[ex.id] = buildEmptySets(ex.defaultSets || DEFAULT_SETS);
        }
      });
      return next;
    });
  }, [currentActiveRoutine?.id, isSpontaneousMode, isEditingSavedWorkout]);

  const handleUpdateLogCell = (exId, setIndex, field, value) => {
    setActiveWorkoutLogs((prev) => {
      const updated = { ...prev };
      const row = [...(updated[exId] || [])];
      if (!row[setIndex]) row[setIndex] = emptySet();
      row[setIndex] = { ...row[setIndex], [field]: value };
      updated[exId] = row;
      return updated;
    });
  };

  const handleToggleSetComplete = (exId, setIndex) => {
    setActiveWorkoutLogs((prev) => {
      const updated = { ...prev };
      const row = [...(updated[exId] || [])];
      if (!row[setIndex]) row[setIndex] = emptySet();
      row[setIndex] = { ...row[setIndex], done: !row[setIndex].done };
      updated[exId] = row;
      return updated;
    });
  };

  const handleAddSet = (exId) => {
    setActiveWorkoutLogs((prev) => ({
      ...prev,
      [exId]: [...(prev[exId] || []), emptySet()]
    }));
  };

  const handleRemoveSet = (exId) => {
    setActiveWorkoutLogs((prev) => {
      const row = [...(prev[exId] || [])];
      if (row.length <= 1) return prev;
      row.pop();
      return { ...prev, [exId]: row };
    });
  };

  const handleTriggerTimer = () => {
    setTimerSeconds(timerDuration);
    setTimerActive(true);
  };

  const handleSaveWorkoutSession = () => {
    if (!currentActiveRoutine) return;
    persistWorkoutToHistory(
      currentActiveRoutine.name,
      currentActiveRoutine.color,
      [...currentActiveRoutine.exercises, ...sessionExtraExercises]
    );
  };

  const handleCreateAddiction = () => {
    if (!newAddictionName.trim()) return Alert.alert('Invalid Input', 'Enter a habit name.');

    const newTracker = {
      id: Date.now().toString(),
      name: newAddictionName.trim(),
      color: ROUTINE_COLORS[newAddictionColor],
      colorName: newAddictionColor,
      history: {}
    };

    const updated = [...addictions, newTracker];
    setAddictions(updated);
    saveData(STORAGE_KEYS.ADDICTIONS, updated);

    setNewAddictionName('');
    setNewAddictionColor('Red');
    setAddictionModalVisible(false);
  };

  const handleToggleCleanDay = (trackerId) => {
    const updated = addictions.map(item => {
      if (item.id === trackerId) {
        const historyCopy = { ...item.history };
        if (historyCopy[todayStr]) {
          delete historyCopy[todayStr];
        } else {
          historyCopy[todayStr] = true;
        }
        return { ...item, history: historyCopy };
      }
      return item;
    });

    setAddictions(updated);
    saveData(STORAGE_KEYS.ADDICTIONS, updated);
  };

  const handleDeleteAddiction = (trackerId) => {
    const confirmWipe = () => {
      const updated = addictions.filter(a => a.id !== trackerId);
      setAddictions(updated);
      saveData(STORAGE_KEYS.ADDICTIONS, updated);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Delete this habit tracker?')) confirmWipe();
    } else {
      Alert.alert('Remove Tracker', 'This deletes the habit and its history.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmWipe }
      ]);
    }
  };

  const handleUpdateRecoveryWindow = (category, nextHoursRaw) => {
    const parsed = parseInt(nextHoursRaw, 10);
    const safeHours = Number.isNaN(parsed) ? 36 : Math.max(1, parsed);
    const updated = { ...recoveryWindows, [category]: safeHours };
    setRecoveryWindows(updated);
    saveData(STORAGE_KEYS.RECOVERY_WINDOWS, updated);
  };

  const filteredSuppSuggestions = useMemo(() => {
    if (!suppNameInput.trim()) return [];
    const q = suppNameInput.toLowerCase();
    return SUPPLEMENT_DICTIONARY.filter(item => item.name.toLowerCase().includes(q)).slice(0, 8);
  }, [suppNameInput]);

  const openAddSupplementModal = () => {
    setEditingSuppId(null);
    setSuppNameInput('');
    setSuppDoseInput('');
    setShowSuppSuggestions(false);
    setSuppModalVisible(true);
  };

  const openEditSupplementModal = (supp) => {
    setEditingSuppId(supp.id);
    setSuppNameInput(supp.name);
    setSuppDoseInput(String(supp.doseMg ?? ''));
    setShowSuppSuggestions(false);
    setSuppModalVisible(true);
  };

  const closeSuppModal = () => {
    setSuppModalVisible(false);
    setEditingSuppId(null);
    setSuppNameInput('');
    setSuppDoseInput('');
    setShowSuppSuggestions(false);
  };

  const parseDoseMg = (raw) => {
    if (raw == null) return NaN;
    const normalized = String(raw).trim().replace(/\s/g, '').replace(',', '.');
    if (!normalized) return NaN;
    return parseFloat(normalized);
  };

  const handleSaveSupplement = () => {
    const name = suppNameInput.trim();
    if (!name) return Alert.alert('Invalid Input', 'Enter a supplement name.');

    const doseMg = parseDoseMg(suppDoseInput);
    if (Number.isNaN(doseMg) || doseMg < 0) {
      return Alert.alert('Invalid Input', 'Enter a dose in mg (e.g. 0,025 or 0.025).');
    }

    let updated;
    if (editingSuppId) {
      updated = supplements.map(s => s.id === editingSuppId ? { ...s, name, doseMg } : s);
    } else {
      updated = [
        ...supplements,
        { id: Date.now().toString() + Math.random().toString(), name, doseMg }
      ];
    }

    setSupplements(updated);
    saveData(STORAGE_KEYS.SUPPLEMENTS, updated);
    closeSuppModal();
  };

  const handleDeleteSupplement = (id) => {
    const performDelete = () => {
      const updated = supplements.filter(s => s.id !== id);
      setSupplements(updated);
      saveData(STORAGE_KEYS.SUPPLEMENTS, updated);

      const logCopy = { ...supplementLog };
      Object.keys(logCopy).forEach((dateKey) => {
        if (logCopy[dateKey]?.[id]) {
          const day = { ...logCopy[dateKey] };
          delete day[id];
          logCopy[dateKey] = day;
        }
      });
      setSupplementLog(logCopy);
      saveData(STORAGE_KEYS.SUPPLEMENT_LOG, logCopy);
      closeSuppModal();
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Delete this supplement?')) performDelete();
    } else {
      Alert.alert('Delete Supplement', 'Remove this supplement from your list?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete }
      ]);
    }
  };

  const handleToggleSupplementTaken = (id) => {
    const dayLog = { ...(supplementLog[todayStr] || {}) };
    if (dayLog[id]) {
      delete dayLog[id];
    } else {
      dayLog[id] = true;
    }
    const updated = { ...supplementLog, [todayStr]: dayLog };
    setSupplementLog(updated);
    saveData(STORAGE_KEYS.SUPPLEMENT_LOG, updated);
  };

  const handleSaveSleepToday = () => {
    const bedMin = parseTimeToMinutes(sleepBedInput);
    const wakeMin = parseTimeToMinutes(sleepWakeInput);
    if (bedMin == null || wakeMin == null) {
      return Alert.alert('Invalid Time', 'Use times like 23:30 and 07:00.');
    }
    const updated = {
      ...sleepLog,
      [todayStr]: {
        bed: formatMinutesAsTime(bedMin),
        wake: formatMinutesAsTime(wakeMin)
      }
    };
    setSleepLog(updated);
    setSleepBedInput(formatMinutesAsTime(bedMin));
    setSleepWakeInput(formatMinutesAsTime(wakeMin));
    saveData(STORAGE_KEYS.SLEEP_LOG, updated);
    Alert.alert('Saved', `Sleep logged: ${formatDurationHours(calcSleepHours(bedMin, wakeMin))}`);
  };

  const handleSaveWeightToday = () => {
    const parsed = parseFloat(String(weightInput).trim().replace(',', '.'));
    if (Number.isNaN(parsed) || parsed <= 0) {
      return Alert.alert('Invalid Weight', 'Enter a weight like 82,5.');
    }
    const updated = { ...weightLog, [todayStr]: parsed };
    setWeightLog(updated);
    setWeightInput(String(parsed).replace('.', ','));
    saveData(STORAGE_KEYS.WEIGHT_LOG, updated);
    Alert.alert('Saved', `Weight logged: ${parsed} kg`);
  };

  const handleAdjustProteinGoal = (delta) => {
    const next = Math.max(10, Math.min(400, (parseInt(proteinGoal, 10) || DEFAULT_PROTEIN_GOAL) + delta));
    setProteinGoal(next);
    saveData(STORAGE_KEYS.PROTEIN_GOAL, next);
  };

  const handleSetProteinGoal = (raw) => {
    const parsed = parseInt(String(raw).replace(/[^\d]/g, ''), 10);
    if (Number.isNaN(parsed)) {
      setProteinGoal(DEFAULT_PROTEIN_GOAL);
      return;
    }
    const next = Math.max(10, Math.min(400, parsed));
    setProteinGoal(next);
    saveData(STORAGE_KEYS.PROTEIN_GOAL, next);
  };

  const handleSaveProteinToday = () => {
    const parsed = parseFloat(String(proteinInput).trim().replace(',', '.'));
    if (Number.isNaN(parsed) || parsed < 0) {
      return Alert.alert('Invalid Protein', 'Enter grams like 140 or 35,5.');
    }
    const updated = { ...proteinLog, [todayStr]: parsed };
    setProteinLog(updated);
    setProteinInput(String(parsed).replace('.', ','));
    saveData(STORAGE_KEYS.PROTEIN_LOG, updated);
    Alert.alert('Saved', `Protein logged: ${parsed}g`);
  };

  const handleAddProteinQuick = (amount) => {
    const current = proteinLog[todayStr] != null ? Number(proteinLog[todayStr]) : 0;
    const next = Math.round((current + amount) * 10) / 10;
    const updated = { ...proteinLog, [todayStr]: next };
    setProteinLog(updated);
    setProteinInput(String(next).replace('.', ','));
    saveData(STORAGE_KEYS.PROTEIN_LOG, updated);
  };

  const markPhotoPromptSeen = async (monthKey) => {
    setPhotoPromptMonth(monthKey);
    saveData(STORAGE_KEYS.PHOTO_PROMPT_MONTH, monthKey);
  };

  const openMonthlyCapture = (monthKey = getMonthKey()) => {
    setCaptureMonthKey(monthKey);
    setMonthlyCaptureVisible(true);
  };

  const openMonthlyCompare = (prevKey) => {
    setCompareMonthKey(prevKey);
    setMonthlyCompareVisible(true);
  };

  const saveMonthlyPhotoAsset = async (monthKey, asset) => {
    let storedUri = asset.uri;

    if (Platform.OS !== 'web' && FileSystem?.documentDirectory && FileSystem?.copyAsync) {
      try {
        const dir = `${FileSystem.documentDirectory}kat_monthly_photos/`;
        const dirInfo = await FileSystem.getInfoAsync(dir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        }
        const dest = `${dir}${Date.now()}_${Math.floor(Math.random() * 100000)}.jpg`;
        await FileSystem.copyAsync({ from: asset.uri, to: dest });
        storedUri = dest;
      } catch (copyErr) {
        storedUri = asset.uri;
      }
    } else if (asset.base64) {
      storedUri = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
    }

    const photo = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      uri: storedUri
    };

    const existing = monthlyPhotos[monthKey]?.photos || [];
    if (existing.length >= MAX_MONTHLY_PHOTOS) {
      Alert.alert('Limit reached', `Max ${MAX_MONTHLY_PHOTOS} photos per month.`);
      return;
    }

    const updated = {
      ...monthlyPhotos,
      [monthKey]: {
        photos: [...existing, photo],
        savedAt: Date.now()
      }
    };

    setMonthlyPhotos(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MONTHLY_PHOTOS, JSON.stringify(updated));
    } catch (saveErr) {
      Alert.alert('Save failed', 'Could not save photo. Try a smaller image.');
    }
  };

  const pickMonthlyPhoto = async (fromCamera, monthKeyOverride) => {
    const monthKey = monthKeyOverride || captureMonthKey || getMonthKey();
    const existing = monthlyPhotos[monthKey]?.photos || [];
    if (existing.length >= MAX_MONTHLY_PHOTOS) {
      Alert.alert('Limit reached', `Max ${MAX_MONTHLY_PHOTOS} photos per month.`);
      return;
    }

    if (photoPicking) return;
    setPhotoPicking(true);
    const unlockTimer = setTimeout(() => setPhotoPicking(false), 20000);

    try {
      setMonthlyCaptureVisible(false);
      setAlbumVisible(false);
      setMonthlyCompareVisible(false);

      // Browser / Expo web: native ImagePicker is flaky — use a real file input
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const asset = await new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.style.display = 'none';
          let settled = false;
          const finish = (value) => {
            if (settled) return;
            settled = true;
            try { document.body.removeChild(input); } catch (e) {}
            resolve(value);
          };
          input.onchange = () => {
            const file = input.files && input.files[0];
            if (!file) return finish(null);
            const uri = URL.createObjectURL(file);
            const reader = new FileReader();
            reader.onload = () => {
              finish({
                uri,
                base64: typeof reader.result === 'string' ? reader.result.split(',')[1] : null,
                mimeType: file.type || 'image/jpeg'
              });
            };
            reader.onerror = () => finish({ uri, base64: null, mimeType: file.type || 'image/jpeg' });
            reader.readAsDataURL(file);
          };
          input.oncancel = () => finish(null);
          document.body.appendChild(input);
          input.click();
          // If user dismisses without oncancel support
          setTimeout(() => {
            if (!settled && (!input.files || input.files.length === 0)) {
              // don't auto-cancel too early; wait for change
            }
          }, 0);
        });

        if (!asset?.uri) return;
        await saveMonthlyPhotoAsset(monthKey, asset);
        return;
      }

      if (!ImagePicker?.launchImageLibraryAsync || !ImagePicker?.launchCameraAsync) {
        Alert.alert(
          'Photos unavailable',
          'expo-image-picker is missing.\n\nIn the Expo project folder run:\nnpx expo install expo-image-picker\n\nThen restart:\nnpx expo start -c\n\nUse Expo Go on your phone (camera/gallery need a real device).'
        );
        return;
      }

      if (fromCamera) {
        const camPerm = await ImagePicker.requestCameraPermissionsAsync();
        if (!camPerm.granted) {
          Alert.alert('Permission needed', 'Allow camera access in phone settings, then try again.');
          return;
        }
      } else if (Platform.OS === 'ios') {
        const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!libPerm.granted) {
          Alert.alert('Permission needed', 'Allow photo library access in phone settings, then try again.');
          return;
        }
      }

      const mediaTypes =
        ImagePicker.MediaTypeOptions?.Images ??
        ImagePicker.MediaType?.Images ??
        'images';

      const pickerOptions = {
        mediaTypes,
        quality: 0.7,
        allowsEditing: false,
        exif: false,
        base64: false,
      };

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync(pickerOptions)
        : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (result?.canceled) return;
      const asset = result?.assets?.[0];
      if (!asset?.uri) {
        Alert.alert('Error', 'No image was returned. Try Gallery again.');
        return;
      }

      await saveMonthlyPhotoAsset(monthKey, asset);
    } catch (e) {
      Alert.alert(
        'Photo error',
        e?.message || 'Could not open camera/gallery. Use Expo Go on your phone (not only a browser preview).'
      );
    } finally {
      clearTimeout(unlockTimer);
      setPhotoPicking(false);
    }
  };

  const promptAddMonthlyPhoto = (monthKey = getMonthKey()) => {
    setCaptureMonthKey(monthKey);
    if (photoPicking) return;

    if (Platform.OS === 'web') {
      // Keep user gesture for browser file picker
      pickMonthlyPhoto(false, monthKey);
      return;
    }

    Alert.alert(
      'Add progress photo',
      formatMonthLabel(monthKey),
      [
        { text: 'Camera', onPress: () => { pickMonthlyPhoto(true, monthKey); } },
        { text: 'Gallery', onPress: () => { pickMonthlyPhoto(false, monthKey); } },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const removeMonthlyPhoto = (monthKey, photoId) => {
    const entry = monthlyPhotos[monthKey];
    if (!entry) return;
    const photos = (entry.photos || []).filter(p => p.id !== photoId);
    const updated = { ...monthlyPhotos };
    if (photos.length === 0) {
      delete updated[monthKey];
    } else {
      updated[monthKey] = { ...entry, photos };
    }
    setMonthlyPhotos(updated);
    saveData(STORAGE_KEYS.MONTHLY_PHOTOS, updated);
  };

  const runFirstOfMonthPhotoFlow = () => {
    const now = new Date();
    if (now.getDate() !== 1) return;

    const thisMonth = getMonthKey(now);
    if (photoPromptMonth === thisMonth) return;

    const prevMonth = getPreviousMonthKey(thisMonth);
    const hasPrev = (monthlyPhotos[prevMonth]?.photos || []).length > 0;
    const hasThis = (monthlyPhotos[thisMonth]?.photos || []).length > 0;

    markPhotoPromptSeen(thisMonth);

    if (hasPrev) {
      openMonthlyCompare(prevMonth);
      Alert.alert(
        'Monthly check-in',
        hasThis
          ? 'Compare last month, or add more photos for this month.'
          : 'Compare last month, then take this month\'s progress photos.',
        [
          { text: 'Later', style: 'cancel' },
          ...(!hasThis ? [{ text: 'Take photos', onPress: () => promptAddMonthlyPhoto(thisMonth) }] : [])
        ]
      );
    } else if (!hasThis) {
      Alert.alert(
        'Monthly progress photos',
        'It\'s the 1st — take a few progress pics to compare next month.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Take photos', onPress: () => promptAddMonthlyPhoto(thisMonth) }
        ]
      );
    }
  };

  useEffect(() => {
    if (loading) return undefined;
    const t = setTimeout(() => runFirstOfMonthPhotoFlow(), 600);
    return () => clearTimeout(t);
  }, [loading, photoPromptMonth, monthlyPhotos]);

  const formatSuppDose = (doseMg) => {
    if (doseMg == null || Number.isNaN(doseMg)) return '';
    if (doseMg > 0 && doseMg < 1) {
      const ug = doseMg * 1000;
      const ugText = Number.isInteger(ug) ? String(ug) : String(Math.round(ug * 1000) / 1000);
      return `${ugText}µg`;
    }
    const n = Number(doseMg);
    const text = Number.isInteger(n) ? String(n) : String(n).replace('.', ',');
    return `${text}mg`;
  };

  const filteredSuggestions = useMemo(() => {
    if (!exInput.trim()) return [];
    return combinedExercisePool.filter(item =>
      item.toLowerCase().includes(exInput.toLowerCase()) &&
      !newRoutineExercises.some(e => e.name.toLowerCase() === item.toLowerCase())
    );
  }, [exInput, newRoutineExercises, combinedExercisePool]);

  const liveSessionExerciseNames = useMemo(() => {
    if (isSpontaneousMode) {
      return spontaneousExercises.map(e => e.name.toLowerCase());
    }
    const fromRoutine = currentActiveRoutine?.exercises?.map(e => e.name.toLowerCase()) || [];
    const extras = sessionExtraExercises.map(e => e.name.toLowerCase());
    return [...fromRoutine, ...extras];
  }, [isSpontaneousMode, spontaneousExercises, currentActiveRoutine, sessionExtraExercises]);

  const filteredSpontaneousSuggestions = useMemo(() => {
    if (!spontaneousExInput.trim()) return [];
    return combinedExercisePool.filter(item =>
      item.toLowerCase().includes(spontaneousExInput.toLowerCase()) &&
      !liveSessionExerciseNames.includes(item.toLowerCase())
    );
  }, [spontaneousExInput, combinedExercisePool, liveSessionExerciseNames]);

  const filteredPrSuggestions = useMemo(() => {
    if (!newPrExName.trim()) return [];
    return combinedExercisePool.filter(item =>
      item.toLowerCase().includes(newPrExName.toLowerCase())
    );
  }, [newPrExName, combinedExercisePool]);

  const renderWorkoutClock = () => {
    const isLive = !!workoutStartedAt;
    const durationLabel = formatWorkoutDurationLabel(workoutElapsedSeconds);
    return (
      <View style={styles.workoutClockCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Ionicons name="time-outline" size={20} color={THEME.accent} style={{ marginRight: 8 }} />
          <View>
            <Text style={styles.workoutClockLabel}>
              {isEditingSavedWorkout ? 'Saved duration' : 'Workout time'}
            </Text>
            <Text style={styles.workoutClockValue}>{formatWorkoutClock(workoutElapsedSeconds)}</Text>
          </View>
        </View>
        {isLive ? (
          <View style={styles.workoutLivePill}>
            <View style={styles.workoutLiveDot} />
            <Text style={styles.workoutLiveText}>LIVE</Text>
          </View>
        ) : durationLabel ? (
          <Text style={styles.workoutClockHint}>{durationLabel}</Text>
        ) : (
          <Text style={styles.workoutClockHint}>Starts with session</Text>
        )}
      </View>
    );
  };

  const renderSessionExerciseAdder = () => (
    <View style={styles.sessionAddBlock}>
      <Text style={styles.sessionAddLabel}>Add exercise</Text>
      <View style={styles.picAppendRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <TextInput
            style={styles.picSearchInput}
            placeholder="Search exercise..."
            placeholderTextColor="#666"
            value={spontaneousExInput}
            onChangeText={(val) => { setSpontaneousExInput(val); setShowSpontaneousSuggestions(true); }}
            onSubmitEditing={handleAddExerciseToActiveWorkout}
            returnKeyType="done"
          />
        </View>
        <TextInput
          style={styles.picSetsInput}
          placeholder="2"
          placeholderTextColor="#666"
          keyboardType="numeric"
          value={spontaneousSetsInput}
          onChangeText={setSpontaneousSetsInput}
        />
        <TouchableOpacity style={styles.picAddBtn} onPress={handleAddExerciseToActiveWorkout}>
          <Ionicons name="add" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {showSpontaneousSuggestions && filteredSpontaneousSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView style={{ maxHeight: 120 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {filteredSpontaneousSuggestions.map((item, idx) => (
              <TouchableOpacity
                key={`${item}-${idx}`}
                style={styles.suggestionItem}
                onPress={() => {
                  setSpontaneousExInput(item);
                  setShowSpontaneousSuggestions(false);
                }}
              >
                <Text style={{ color: THEME.text, fontSize: 13 }}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderTimerBanner = () => (
    <>
      <View style={styles.timerPresetRow}>
        {TIMER_PRESETS.map((sec) => (
          <TouchableOpacity
            key={sec}
            style={[
              styles.timerPresetBtn,
              timerDuration === sec && styles.timerPresetBtnActive
            ]}
            onPress={() => {
              setTimerDuration(sec);
              if (timerActive || timerSeconds > 0) {
                setTimerSeconds(sec);
                setTimerActive(true);
              }
            }}
          >
            <Text style={[
              styles.timerPresetText,
              timerDuration === sec && styles.timerPresetTextActive
            ]}>
              {sec < 60 ? `${sec}s` : `${sec / 60}m`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {timerSeconds > 0 && (
        <View style={styles.timerBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="stopwatch" size={18} color={THEME.accent} style={{ marginRight: 6 }} />
            <Text style={styles.timerBannerText}>
              Rest: <Text style={{ color: THEME.accent }}>{formatTimerString(timerSeconds)}</Text>
            </Text>
          </View>
          <TouchableOpacity style={styles.timerCancelBtn} onPress={() => { setTimerSeconds(0); setTimerActive(false); }}>
            <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 12 }}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  const loggerProps = {
    onUpdateCell: handleUpdateLogCell,
    onToggleDone: handleToggleSetComplete,
    onAddSet: handleAddSet,
    onRemoveSet: handleRemoveSet,
    onTriggerTimer: handleTriggerTimer
  };

  if (loading) {
    return (
      <View style={[styles.rootShell, styles.center]}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.background} translucent />
        <View style={[styles.statusBarFill, { height: Math.max(insets.top, 0) }]} />
        <Text style={{ color: THEME.text, fontSize: 18, fontWeight: '600' }}>Loading KatTracker...</Text>
      </View>
    );
  }

  return (
    <View style={styles.rootShell}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.background} translucent />
      {/* Solid fill behind status bar — covers the iOS white hairline SafeAreaView caused */}
      <View
        style={[
          styles.statusBarFill,
          {
            height: Math.max(insets.top, 0) + 2,
            marginBottom: -2
          }
        ]}
      />

      <View style={styles.container}>

      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="flash" size={26} color={THEME.accent} style={{ marginRight: 6 }} />
          <Text style={styles.headerTitle}>KatTracker</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.headerSubtitle}>{todayStr}</Text>
          {(workoutStartedAt || ((isSpontaneousMode || isGymDayChecked) && workoutElapsedSeconds > 0)) ? (
            <Text style={styles.headerWorkoutTime}>
              {workoutStartedAt ? '● ' : ''}{formatWorkoutClock(workoutElapsedSeconds)}
            </Text>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">

        {currentTab === 'today' && (
          <View>
            <Text style={styles.viewTitle}>Today's Workout</Text>

            <View style={styles.todayPaneRow}>
              <TouchableOpacity
                style={[styles.todayPaneBtn, todayPane === 'workout' && styles.todayPaneBtnActive]}
                onPress={() => setTodayPane('workout')}
              >
                <Text style={[styles.todayPaneBtnText, todayPane === 'workout' && styles.todayPaneBtnTextActive]}>Workout</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.todayPaneBtn, todayPane === 'stats' && styles.todayPaneBtnActive]}
                onPress={() => setTodayPane('stats')}
              >
                <Text style={[styles.todayPaneBtnText, todayPane === 'stats' && styles.todayPaneBtnTextActive]}>Stats</Text>
              </TouchableOpacity>
            </View>

            {todayPane === 'stats' ? (
              <>
                <View style={styles.motivationCard}>
                  <Text style={styles.motivationTitle}>Motivation</Text>
                  <View style={styles.motivationRow}>
                    <View style={styles.motivationPill}>
                      <Ionicons name="flame" size={18} color="#F59E0B" style={{ marginRight: 6 }} />
                      <View>
                        <Text style={styles.motivationPillLabel}>Gym streak</Text>
                        <Text style={styles.motivationPillValue}>
                          {gymStreak} day{gymStreak === 1 ? '' : 's'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.motivationPill}>
                      <Ionicons name="trophy" size={18} color={THEME.accent} style={{ marginRight: 6 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.motivationPillLabel}>Best week</Text>
                        <Text style={styles.motivationPillValue}>
                          {bestGymWeek.count > 0
                            ? `${bestGymWeek.count} gym day${bestGymWeek.count === 1 ? '' : 's'}`
                            : 'No badge yet'}
                        </Text>
                        {bestGymWeek.count > 0 ? (
                          <Text style={styles.motivationPillSub}>
                            {bestGymWeek.start} → {bestGymWeek.end}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.reportCard}>
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reportCardTitle}>Weekly Report</Text>
                      <Text style={styles.reportCardHint}>
                        {weeklyReport.weekStartStr} → {weeklyReport.weekEnd}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.smallAccentBtn} onPress={() => setWeeklyReportVisible(true)}>
                      <Text style={styles.smallAccentBtnText}>Open</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.reportPreviewLine}>
                    {weeklyReport.workoutDays} gym days · {weeklyReport.totalSets} sets · {formatWorkoutDurationLabel(weeklyReport.totalWorkoutSeconds) || '0 min'} gym time · sleep {weeklyReport.avgSleep != null ? formatDurationHours(weeklyReport.avgSleep) : '--'}
                  </Text>
                </View>

                <View style={styles.reportCard}>
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reportCardTitle}>Monthly Photos</Text>
                      <Text style={styles.reportCardHint}>
                        {formatMonthLabel(getMonthKey())}: {(monthlyPhotos[getMonthKey()]?.photos || []).length}/{MAX_MONTHLY_PHOTOS} pics
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    <TouchableOpacity
                      style={[styles.primaryButton, { flex: 1, marginRight: 8, opacity: photoPicking ? 0.6 : 1 }]}
                      disabled={photoPicking}
                      onPress={() => pickMonthlyPhoto(true, getMonthKey())}
                    >
                      <Text style={styles.primaryButtonText}>{photoPicking ? 'Opening…' : 'Camera'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.primaryButton, { flex: 1, backgroundColor: THEME.surfaceLight, opacity: photoPicking ? 0.6 : 1 }]}
                      disabled={photoPicking}
                      onPress={() => pickMonthlyPhoto(false, getMonthKey())}
                    >
                      <Text style={[styles.primaryButtonText, { color: THEME.text }]}>
                        {photoPicking ? 'Opening…' : 'Gallery'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                    {(monthlyPhotos[getMonthKey()]?.photos || []).map((photo) => (
                      <View key={photo.id} style={styles.photoThumbWrap}>
                        <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                        <TouchableOpacity
                          style={styles.photoDeleteBtn}
                          onPress={() => removeMonthlyPhoto(getMonthKey(), photo.id)}
                        >
                          <Ionicons name="trash" size={14} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>

                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    <TouchableOpacity style={[styles.proteinQuickBtn, { marginRight: 8 }]} onPress={() => setAlbumVisible(true)}>
                      <Text style={styles.proteinQuickBtnText}>Album</Text>
                    </TouchableOpacity>
                    {(monthlyPhotos[getPreviousMonthKey(getMonthKey())]?.photos || []).length > 0 ? (
                      <TouchableOpacity
                        style={styles.proteinQuickBtn}
                        onPress={() => openMonthlyCompare(getPreviousMonthKey(getMonthKey()))}
                      >
                        <Text style={styles.proteinQuickBtnText}>Compare</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                <View style={styles.recoveryPanelCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.recoveryPanelTitle}>Recovery</Text>
                    <TouchableOpacity onPress={() => setRecoverySettingsVisible(true)}>
                      <Text style={styles.recoveryDetailsLink}>Details</Text>
                    </TouchableOpacity>
                  </View>

                  {recoveryMatrix.map((item) => (
                    <View key={item.category} style={styles.recoveryLineRow}>
                      <Text style={styles.recoveryLineCategory}>{item.category}</Text>
                      <View style={styles.recoveryLineBarTrack}>
                        <View style={[styles.recoveryLineBarFill, { width: `${item.progress * 100}%`, backgroundColor: item.color }]} />
                      </View>
                      <View style={styles.recoveryLineRightCol}>
                        <Text style={[styles.recoveryLineStatus, { color: item.color }]}>{item.status}</Text>
                        <Text style={styles.recoveryLineTime}>
                          {item.hoursLeft <= 0 ? '0h left' : `${Math.ceil(item.hoursLeft)}h left`}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.weeklySetsCard}>
                  <Text style={styles.weeklySetsTitle}>Weighted sets this week</Text>
                  <Text style={styles.weeklySetsHint}>Resets every Monday</Text>

                  {weeklySetsMatrix.map((item) => (
                    <View key={item.category} style={styles.weeklySetsRow}>
                      <Text style={styles.weeklySetsCategory}>{item.category}</Text>
                      <View style={styles.weeklySetsBarTrack}>
                        <View
                          style={[
                            styles.weeklySetsBarFill,
                            {
                              width: `${item.barWidth * 100}%`,
                              backgroundColor: item.count > 0 ? item.color : 'transparent'
                            }
                          ]}
                        />
                      </View>
                      <Text style={styles.weeklySetsCount}>{item.count}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.healthCard}>
                  <Text style={styles.healthCardTitle}>Sleep</Text>
                  <Text style={styles.healthCardHint}>Log bedtime + wake time for today</Text>

                  {sleepStats.lastLogged ? (
                    <View style={styles.lastNightRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.lastNightLabel}>Last logged</Text>
                        <Text style={styles.lastNightHours}>{formatDurationHours(sleepStats.lastLogged.hours)}</Text>
                        <Text style={styles.lastNightRange}>
                          {formatMinutesAsTime(sleepStats.lastLogged.bedMin)} → {formatMinutesAsTime(sleepStats.lastLogged.wakeMin)}
                        </Text>
                      </View>
                      <Text style={styles.lastNightDate}>{sleepStats.lastLogged.dateStr}</Text>
                    </View>
                  ) : null}

                  <View style={styles.healthInputRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.inputLabel}>Go to sleep</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="23:30"
                        placeholderTextColor="#666"
                        value={sleepBedInput}
                        onChangeText={setSleepBedInput}
                        keyboardType="default"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Wake up</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="07:00"
                        placeholderTextColor="#666"
                        value={sleepWakeInput}
                        onChangeText={setSleepWakeInput}
                        keyboardType="default"
                      />
                    </View>
                  </View>
                  <TouchableOpacity style={[styles.primaryButton, { marginTop: 4 }]} onPress={handleSaveSleepToday}>
                    <Text style={styles.primaryButtonText}>Save Sleep</Text>
                  </TouchableOpacity>

                  <View style={styles.chartHeaderRow}>
                    <Text style={styles.chartSectionLabel}>PER NIGHT</Text>
                    <Text style={styles.chartSectionMeta}>
                      Average {sleepStats.avgHours != null ? formatDurationHours(sleepStats.avgHours) : '--'}
                    </Text>
                  </View>

                  <View style={styles.sleepChartArea}>
                    <View style={styles.sleepYAxis}>
                      {[10, 8, 6, 4, 2, 0].map((h) => (
                        <Text key={h} style={styles.sleepYLabel}>{h}h</Text>
                      ))}
                    </View>
                    <View style={styles.sleepBarsWrap}>
                      <View style={[styles.sleepTargetLine, { bottom: `${(SLEEP_TARGET_HOURS / 10) * 100}%` }]}>
                        <View style={styles.sleepTargetDash} />
                        <Text style={styles.sleepTargetText}>{SLEEP_TARGET_HOURS}h</Text>
                      </View>
                      <View style={styles.sleepBarsRow}>
                        {sleepStats.nights.map((n) => (
                          <View key={n.dateStr} style={styles.sleepBarCol}>
                            <View style={styles.sleepBarTrack}>
                              <View
                                style={[
                                  styles.sleepBarFill,
                                  {
                                    height: `${Math.max(0, Math.min(100, ((n.hours || 0) / 10) * 100))}%`,
                                    backgroundColor: n.hours != null ? n.color : 'transparent'
                                  }
                                ]}
                              />
                            </View>
                            <Text style={styles.sleepBarLabel}>{n.label}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  <Text style={[styles.chartSectionLabel, { marginTop: 14 }]}>RHYTHM</Text>
                  <View style={styles.rhythmGrid}>
                    <View style={styles.rhythmCell}>
                      <Text style={styles.rhythmLabel}>Average bedtime</Text>
                      <Text style={styles.rhythmValue}>{formatMinutesAsTime(sleepStats.avgBed)}</Text>
                    </View>
                    <View style={styles.rhythmCell}>
                      <Text style={styles.rhythmLabel}>Average wake-up</Text>
                      <Text style={styles.rhythmValue}>{formatMinutesAsTime(sleepStats.avgWake)}</Text>
                    </View>
                    <View style={styles.rhythmCell}>
                      <Text style={styles.rhythmLabel}>Nights on target</Text>
                      <Text style={styles.rhythmValue}>{sleepStats.onTarget}/{sleepStats.loggedCount || 0}</Text>
                      <Text style={styles.rhythmSub}>{SLEEP_TARGET_HOURS}h or more</Text>
                    </View>
                    <View style={styles.rhythmCell}>
                      <Text style={styles.rhythmLabel}>Longest night</Text>
                      <Text style={styles.rhythmValue}>
                        {sleepStats.longest != null ? formatDurationHours(sleepStats.longest) : '--'}
                      </Text>
                    </View>
                    <View style={[styles.rhythmCell, { width: '100%' }]}>
                      <Text style={styles.rhythmLabel}>Sleep debt (7 days)</Text>
                      <Text style={[styles.rhythmValue, { color: (sleepStats.sleepDebtHours || 0) < 0 ? '#EF4444' : '#22C55E' }]}>
                        {sleepStats.loggedCount
                          ? `${sleepStats.sleepDebtHours > 0 ? '+' : sleepStats.sleepDebtHours < 0 ? '-' : ''}${formatDurationHours(Math.abs(sleepStats.sleepDebtHours))}`
                          : '--'}
                      </Text>
                      <Text style={styles.rhythmSub}>vs {SLEEP_TARGET_HOURS}h / night</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.healthCard}>
                  <Text style={styles.healthCardTitle}>Weight</Text>
                  <Text style={styles.healthCardHint}>Log your weight once a day</Text>

                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={styles.inputLabel}>Today (kg)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 82,5"
                        placeholderTextColor="#666"
                        keyboardType="decimal-pad"
                        value={weightInput}
                        onChangeText={(val) => {
                          const cleaned = val.replace(/[^\d.,]/g, '');
                          const parts = cleaned.split(/[.,]/);
                          if (parts.length <= 1) {
                            setWeightInput(cleaned);
                            return;
                          }
                          const sep = cleaned.includes(',') ? ',' : '.';
                          setWeightInput(`${parts[0]}${sep}${parts.slice(1).join('')}`);
                        }}
                      />
                    </View>
                    <TouchableOpacity style={[styles.primaryButton, { marginTop: 22, paddingHorizontal: 16 }]} onPress={handleSaveWeightToday}>
                      <Text style={styles.primaryButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.chartHeaderRow}>
                    <Text style={styles.chartSectionLabel}>7-DAY TREND</Text>
                    <Text style={styles.chartSectionMeta}>
                      {weightStats.latest != null ? `${String(weightStats.latest).replace('.', ',')} kg` : 'No data'}
                      {weightStats.delta != null
                        ? ` · ${weightStats.delta > 0 ? '+' : ''}${String(Math.round(weightStats.delta * 10) / 10).replace('.', ',')} kg`
                        : ''}
                    </Text>
                  </View>

                  <View style={styles.weightBarsRow}>
                    {weightStats.points.map((p) => {
                      const heightPct = p.value == null
                        ? 0
                        : 20 + ((p.value - weightStats.minVal) / weightStats.range) * 80;
                      return (
                        <View key={p.dateStr} style={styles.weightBarCol}>
                          <Text style={styles.weightBarValue}>
                            {p.value != null ? String(Math.round(p.value * 10) / 10).replace('.', ',') : ''}
                          </Text>
                          <View style={styles.weightBarTrack}>
                            <View
                              style={[
                                styles.weightBarFill,
                                {
                                  height: `${heightPct}%`,
                                  backgroundColor: p.value != null ? '#8B5CF6' : 'transparent'
                                }
                              ]}
                            />
                          </View>
                          <Text style={styles.sleepBarLabel}>{p.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.healthCard}>
                  <Text style={styles.healthCardTitle}>Protein Goal</Text>
                  <Text style={styles.healthCardHint}>Adjustable daily target + today's intake</Text>

                  <View style={styles.rowBetween}>
                    <Text style={styles.proteinGoalLabel}>Daily goal</Text>
                    <View style={styles.proteinGoalControls}>
                      <TouchableOpacity style={styles.proteinGoalBtn} onPress={() => handleAdjustProteinGoal(-10)}>
                        <Text style={styles.proteinGoalBtnText}>-10</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.proteinGoalInput}
                        keyboardType="numeric"
                        value={String(proteinGoal)}
                        onChangeText={handleSetProteinGoal}
                      />
                      <Text style={styles.proteinGoalUnit}>g</Text>
                      <TouchableOpacity style={styles.proteinGoalBtn} onPress={() => handleAdjustProteinGoal(10)}>
                        <Text style={styles.proteinGoalBtnText}>+10</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.proteinProgressTrack}>
                    <View
                      style={[
                        styles.proteinProgressFill,
                        {
                          width: `${proteinProgress * 100}%`,
                          backgroundColor: proteinProgress >= 1 ? '#22C55E' : THEME.accent
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.proteinProgressText}>
                    {String(todayProtein).replace('.', ',')} / {proteinGoal}g
                    {proteinProgress >= 1 ? ' · Goal hit' : ''}
                  </Text>

                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={styles.inputLabel}>Today's protein (g)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 140"
                        placeholderTextColor="#666"
                        keyboardType="decimal-pad"
                        value={proteinInput}
                        onChangeText={(val) => {
                          const cleaned = val.replace(/[^\d.,]/g, '');
                          const parts = cleaned.split(/[.,]/);
                          if (parts.length <= 1) {
                            setProteinInput(cleaned);
                            return;
                          }
                          const sep = cleaned.includes(',') ? ',' : '.';
                          setProteinInput(`${parts[0]}${sep}${parts.slice(1).join('')}`);
                        }}
                      />
                    </View>
                    <TouchableOpacity style={[styles.primaryButton, { marginTop: 22, paddingHorizontal: 16 }]} onPress={handleSaveProteinToday}>
                      <Text style={styles.primaryButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.proteinQuickRow}>
                    {[20, 30, 40].map((amt) => (
                      <TouchableOpacity key={amt} style={styles.proteinQuickBtn} onPress={() => handleAddProteinQuick(amt)}>
                        <Text style={styles.proteinQuickBtnText}>+{amt}g</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.supplementsCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.supplementsTitle}>Supplements</Text>
                    <TouchableOpacity style={styles.suppAddBtn} onPress={openAddSupplementModal}>
                      <Ionicons name="add" size={18} color="#4F8DFF" />
                    </TouchableOpacity>
                  </View>

                  {supplements.length === 0 ? (
                    <Text style={styles.suppEmptyText}>No supplements yet. Tap + to add one.</Text>
                  ) : (
                    supplements.map((supp) => {
                      const taken = !!supplementLog[todayStr]?.[supp.id];
                      return (
                        <View key={supp.id} style={styles.suppRow}>
                          <TouchableOpacity
                            style={[styles.suppCheck, taken && styles.suppCheckTaken]}
                            onPress={() => handleToggleSupplementTaken(supp.id)}
                          >
                            {taken ? <Ionicons name="checkmark" size={14} color="#FFF" /> : null}
                          </TouchableOpacity>
                          <View style={styles.suppTextCol}>
                            <Text style={styles.suppName}>{supp.name}</Text>
                            <Text style={styles.suppDose}>{formatSuppDose(supp.doseMg)}</Text>
                          </View>
                          <TouchableOpacity onPress={() => openEditSupplementModal(supp)} style={{ padding: 6 }}>
                            <Ionicons name="pencil" size={16} color={THEME.textMuted} />
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  )}
                </View>
              </>
            ) : isSpontaneousMode ? (
              <View style={[styles.card, { borderLeftWidth: 5, borderLeftColor: THEME.accent }]}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>
                      {isEditingSavedWorkout ? 'Editing Workout' : 'Spontaneous Session'}
                    </Text>
                    <Text style={styles.cardMutedText}>
                      {isEditingSavedWorkout
                        ? `Updating ${editingHistoryDate || todayStr}`
                        : 'Build a freestyle workout'}
                    </Text>
                  </View>
                </View>

                {renderWorkoutClock()}
                {renderTimerBanner()}

                {spontaneousExercises.length === 0 ? (
                  <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                    <Text style={{ color: THEME.textMuted }}>No exercises yet. Search below to add one.</Text>
                  </View>
                ) : (
                  <View style={{ marginTop: 8 }}>
                    {spontaneousExercises.map((ex) => (
                      <ExerciseSetLogger
                        key={ex.id}
                        exercise={ex}
                        sets={activeWorkoutLogs[ex.id]}
                        pastSets={getPreviousPerformance(ex.name, editingHistoryDate || todayStr)}
                        {...loggerProps}
                      />
                    ))}
                  </View>
                )}

                {renderSessionExerciseAdder()}

                {spontaneousExercises.length > 0 ? (
                  <View>
                    <Text style={styles.noteLabel}>Note (optional)</Text>
                    <TextInput
                      style={styles.noteInput}
                      placeholder="How did the session feel?"
                      placeholderTextColor="#666"
                      multiline
                      value={workoutNote}
                      onChangeText={setWorkoutNote}
                    />

                    <TouchableOpacity style={[styles.primaryButton, { marginTop: 12 }]} onPress={handleSaveSpontaneousSession}>
                      <Text style={styles.primaryButtonText}>
                        {isEditingSavedWorkout ? 'Save Changes' : 'Finish & Save Workout'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.clearImpromptuBtn, { marginTop: 8 }]}
                      onPress={cancelEditingSession}
                    >
                      <Text style={{ color: '#FF4444', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                        {isEditingSavedWorkout ? 'Cancel Edit' : 'Cancel Session'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.clearImpromptuBtn, { marginTop: 4 }]}
                    onPress={cancelEditingSession}
                  >
                    <Text style={{ color: '#FF4444', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                      {isEditingSavedWorkout ? 'Cancel Edit' : 'Cancel Session'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (isTodayCompleted && !impromptuRoutine) ? (
              <>
                <View style={styles.completedBannerCard}>
                  <Ionicons name="checkmark-circle" size={44} color={THEME.success} style={{ marginBottom: 10 }} />
                  <Text style={styles.completedBannerTitle}>Workout Saved</Text>
                  <Text style={styles.completedBannerMuted}>
                    {todayHistoryEntry?.routineName || 'Today'} is saved in history. You can still edit it or start another session.
                  </Text>
                  <TouchableOpacity
                    style={[styles.primaryButton, { marginTop: 16 }]}
                    onPress={handleEditTodayWorkout}
                  >
                    <Text style={styles.primaryButtonText}>Edit Today's Workout</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryButton, { marginTop: 10, backgroundColor: THEME.surfaceLight }]}
                    onPress={() => setCurrentTab('history')}
                  >
                    <Text style={[styles.primaryButtonText, { color: THEME.text, fontSize: 13 }]}>View History</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Start Another Workout</Text>
                  <Text style={styles.cardMutedText}>Do a second session today:</Text>

                  <TouchableOpacity
                    style={[styles.spontaneousLaunchBtn, { marginTop: 12 }]}
                    onPress={handleStartSpontaneousSession}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="flash-sharp" size={18} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.spontaneousLaunchBtnText}>Start Spontaneous Session</Text>
                  </TouchableOpacity>

                  {routines.length === 0 ? (
                    <Text style={{ color: THEME.textMuted, marginTop: 10, textAlign: 'center' }}>
                      No routines yet. Create one in Routines.
                    </Text>
                  ) : (
                    <View style={{ marginTop: 8 }}>
                      {routines.map(r => (
                        <TouchableOpacity
                          key={r.id}
                          style={[styles.flexibleRoutineItem, { borderLeftColor: r.color }]}
                          onPress={() => handleStartExtraRoutine(r)}
                        >
                          <Text style={{ color: THEME.text, fontWeight: '600' }}>Start {r.name}</Text>
                          <Ionicons name="play-circle" size={20} color={r.color} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </>
            ) : (
              <>
                {currentActiveRoutine ? (
                  <View style={[styles.card, { borderLeftWidth: 5, borderLeftColor: currentActiveRoutine.color }]}>
                    <View style={styles.rowBetween}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.cardTitle}>{currentActiveRoutine.name}</Text>
                        <Text style={styles.cardMutedText}>
                          {impromptuRoutine
                            ? (isTodayCompleted ? 'Extra session for today' : 'Loaded for today')
                            : `Scheduled for ${getTodayDayName()}`}
                        </Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: currentActiveRoutine.color + '22' }]}>
                        <Text style={{ color: currentActiveRoutine.color, fontWeight: '700', fontSize: 12 }}>
                          {currentActiveRoutine.exercises.length + sessionExtraExercises.length} Exercises
                        </Text>
                      </View>
                    </View>
                    {impromptuRoutine && (
                      <TouchableOpacity
                        style={styles.clearImpromptuBtn}
                        onPress={() => {
                          setImpromptuRoutine(null);
                          resetLiveSessionExtras();
                          haltWorkoutClock(true);
                          setIsGymDayChecked(false);
                        }}
                      >
                        <Text style={{ color: '#FF4444', fontSize: 12, fontWeight: '600' }}>Clear Selection</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Rest / Flexible Day</Text>
                    <Text style={styles.cardMutedText}>Nothing scheduled. Pick a routine for today:</Text>

                    <View style={{ marginTop: 12 }}>
                      {routines.map(r => (
                        <TouchableOpacity
                          key={r.id}
                          style={[styles.flexibleRoutineItem, { borderLeftColor: r.color }]}
                          onPress={() => setImpromptuRoutine(r)}
                        >
                          <Text style={{ color: THEME.text, fontWeight: '600' }}>Start {r.name}</Text>
                          <Ionicons name="play-circle" size={20} color={r.color} />
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity style={[styles.primaryButton, { marginTop: 10, backgroundColor: THEME.surfaceLight }]} onPress={() => setCurrentTab('routines')}>
                        <Text style={[styles.primaryButtonText, { color: THEME.text }]}>Manage Routines</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {currentActiveRoutine && (
                  <View style={styles.toggleCard}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.toggleText}>Ready to log today's session?</Text>
                      <TouchableOpacity
                        style={[styles.checkbox, isGymDayChecked && styles.checkboxChecked]}
                        onPress={() => {
                          const next = !isGymDayChecked;
                          setIsGymDayChecked(next);
                          if (next) {
                            beginWorkoutClock(workoutElapsedSeconds);
                          } else {
                            haltWorkoutClock(false);
                          }
                        }}
                      >
                        {isGymDayChecked && <Ionicons name="checkmark" size={16} color={THEME.text} />}
                      </TouchableOpacity>
                    </View>

                    {isGymDayChecked && (
                      <View style={{ marginTop: 20 }}>
                        {renderWorkoutClock()}
                        {renderTimerBanner()}

                        {currentActiveRoutine.exercises.map((ex) => (
                          <ExerciseSetLogger
                            key={ex.id}
                            exercise={ex}
                            sets={activeWorkoutLogs[ex.id]}
                            pastSets={getPreviousPerformance(ex.name, todayStr)}
                            {...loggerProps}
                          />
                        ))}

                        {sessionExtraExercises.map((ex) => (
                          <ExerciseSetLogger
                            key={ex.id}
                            exercise={ex}
                            sets={activeWorkoutLogs[ex.id]}
                            pastSets={getPreviousPerformance(ex.name, todayStr)}
                            {...loggerProps}
                          />
                        ))}

                        {renderSessionExerciseAdder()}

                        <Text style={styles.noteLabel}>Note (optional)</Text>
                        <TextInput
                          style={styles.noteInput}
                          placeholder="How did the session feel?"
                          placeholderTextColor="#666"
                          multiline
                          value={workoutNote}
                          onChangeText={setWorkoutNote}
                        />

                        <TouchableOpacity style={[styles.primaryButton, { marginTop: 12 }]} onPress={handleSaveWorkoutSession}>
                          <Text style={styles.primaryButtonText}>Finish & Save Session</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.spontaneousLaunchBtn}
                  onPress={handleStartSpontaneousSession}
                  activeOpacity={0.7}
                >
                  <Ionicons name="flash-sharp" size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.spontaneousLaunchBtnText}>Start Spontaneous Session</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {currentTab === 'routines' && (
          <View>
            <View style={styles.rowBetween}>
              <Text style={styles.viewTitle}>Routines</Text>
              <TouchableOpacity style={styles.smallAccentBtn} onPress={() => setRoutineModalVisible(true)}>
                <Ionicons name="add-sharp" size={18} color="#FFF" />
                <Text style={styles.smallAccentBtnText}>New Routine</Text>
              </TouchableOpacity>
            </View>

            {routines.length === 0 ? (
              <View style={styles.card}>
                <Text style={{ color: THEME.textMuted, textAlign: 'center' }}>No routines yet. Create one to get started.</Text>
              </View>
            ) : (
              routines.map(r => (
                <View key={r.id} style={[styles.card, { borderLeftWidth: 5, borderLeftColor: r.color }]}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardTitle}>{r.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TouchableOpacity onPress={() => handleStartEditRoutine(r)} style={{ marginRight: 12 }}>
                        <Ionicons name="pencil" size={18} color={THEME.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteRoutine(r.id)}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{ marginTop: 10 }}>
                    {r.exercises.map((ex, idx) => (
                      <Text key={ex.id || idx} style={{ color: THEME.textMuted, fontSize: 13, marginBottom: 2 }}>
                        • {ex.name} ({ex.defaultSets} sets)
                      </Text>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {currentTab === 'schedule' && (
          <View>
            <Text style={styles.viewTitle}>Weekly Schedule</Text>
            {DAYS_OF_WEEK.map(day => {
              const assignedRoutineId = schedule[day];
              const routine = routines.find(r => r.id === assignedRoutineId);
              return (
                <View key={day} style={styles.scheduleRowCard}>
                  <View>
                    <Text style={styles.dayText}>{day}</Text>
                    <Text style={{ color: routine ? routine.color : THEME.textMuted, fontSize: 13, fontWeight: '600' }}>
                      {routine ? routine.name : 'Rest / Unassigned'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.assignBtn}
                    onPress={() => {
                      setSelectedScheduleDay(day);
                      setSchedulerModalVisible(true);
                    }}
                  >
                    <Text style={{ color: THEME.text, fontSize: 12, fontWeight: '600' }}>Assign</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {currentTab === 'history' && (
          <View>
            <View style={styles.rowBetween}>
              <Text style={styles.viewTitle}>History</Text>
            </View>

            <View style={styles.historyPaneRow}>
              <TouchableOpacity
                style={[styles.historyPaneBtn, historyPane === 'log' && styles.historyPaneBtnActive]}
                onPress={() => setHistoryPane('log')}
              >
                <Ionicons name="stats-chart" size={16} color={historyPane === 'log' ? '#FFF' : THEME.textMuted} />
                <Text style={[styles.historyPaneBtnText, historyPane === 'log' && styles.historyPaneBtnTextActive]}>
                  Workouts
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.historyPaneBtn, historyPane === 'prs' && styles.historyPaneBtnActive]}
                onPress={() => setHistoryPane('prs')}
              >
                <Ionicons name="trophy" size={16} color={historyPane === 'prs' ? '#FFF' : THEME.textMuted} />
                <Text style={[styles.historyPaneBtnText, historyPane === 'prs' && styles.historyPaneBtnTextActive]}>
                  PRs
                </Text>
              </TouchableOpacity>
            </View>

            {historyPane === 'log' ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Activity Heatmap</Text>
                  <Text style={styles.cardMutedText}>Last 15 weeks</Text>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: 'row' }}>
                      {generateHeatmapDates().map((week, wIdx) => (
                        <View key={wIdx} style={{ marginRight: 4 }}>
                          {week.map((dateStr) => {
                            const daySessions = getSessionsForDate(history, dateStr);
                            const latestSession = daySessions[daySessions.length - 1];
                            const isLogged = daySessions.length > 0;
                            const cellColor = isLogged ? (latestSession?.color || THEME.success) : THEME.surfaceLight;
                            return (
                              <TouchableOpacity
                                key={dateStr}
                                style={[
                                  styles.heatmapCell,
                                  { backgroundColor: cellColor }
                                ]}
                                onPress={() => openHistoryDay(dateStr)}
                              />
                            );
                          })}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <Text style={[styles.cardTitle, { marginTop: 16, marginBottom: 8 }]}>Workout Log</Text>
                {Object.keys(history).length === 0 ? (
                  <Text style={{ color: THEME.textMuted }}>No history yet.</Text>
                ) : (
                  Object.keys(history).sort((a, b) => (a < b ? 1 : -1)).flatMap(dateKey => {
                    const daySessions = getSessionsForDate(history, dateKey);
                    return daySessions.map((item, sessionIdx) => (
                      <View
                        key={`${dateKey}-${sessionIdx}`}
                        style={[styles.card, { borderLeftWidth: 4, borderLeftColor: item.color || THEME.accent }]}
                      >
                        <TouchableOpacity onPress={() => openHistoryDay(dateKey)} activeOpacity={0.8}>
                          <View style={styles.rowBetween}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                              <Text style={{ color: THEME.text, fontWeight: '700' }}>{dateKey}</Text>
                              {!!(item.note && String(item.note).trim()) && (
                                <Ionicons
                                  name="document-text"
                                  size={14}
                                  color={THEME.accent}
                                  style={{ marginLeft: 8 }}
                                />
                              )}
                            </View>
                            <Text style={{ color: item.color || THEME.accent, fontWeight: '700' }}>
                              {daySessions.length > 1 ? `${item.routineName} (${sessionIdx + 1}/${daySessions.length})` : item.routineName}
                            </Text>
                          </View>
                          <Text style={{ color: THEME.textMuted, fontSize: 12, marginTop: 4 }}>
                            {(item.exercises || []).filter(exerciseHasLoggedWork).length} Exercises
                            {formatWorkoutDurationLabel(item.durationSeconds)
                              ? ` · ${formatWorkoutDurationLabel(item.durationSeconds)}`
                              : ''}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleEditSavedWorkout(dateKey, sessionIdx)}
                          style={styles.historyEditBtn}
                        >
                          <Ionicons name="pencil" size={14} color={THEME.accent} style={{ marginRight: 4 }} />
                          <Text style={{ color: THEME.accent, fontSize: 12, fontWeight: '700' }}>Edit Workout</Text>
                        </TouchableOpacity>
                      </View>
                    ));
                  })
                )}
              </>
            ) : (
              <>
                <View style={styles.rowBetween}>
                  <Text style={[styles.cardTitle, { marginBottom: 8 }]}>Personal Records</Text>
                  <TouchableOpacity style={styles.smallAccentBtn} onPress={() => setPrModalVisible(true)}>
                    <Ionicons name="add-sharp" size={18} color="#FFF" />
                    <Text style={styles.smallAccentBtnText}>Add PR</Text>
                  </TouchableOpacity>
                </View>

                {prs.length === 0 ? (
                  <View style={styles.card}>
                    <Text style={{ color: THEME.textMuted, textAlign: 'center' }}>No PRs yet. Log your first max lift.</Text>
                  </View>
                ) : (
                  prs.map((pr) => (
                    <View key={pr.id} style={styles.card}>
                      <View style={styles.rowBetween}>
                        <View>
                          <Text style={styles.cardTitle}>{pr.exercise}</Text>
                          <Text style={styles.cardMutedText}>Logged on {pr.date}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ color: THEME.accent, fontSize: 20, fontWeight: '800', marginRight: 12 }}>
                            {pr.weight} KG
                          </Text>
                          <TouchableOpacity onPress={() => handleDeletePR(pr.id)}>
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}
          </View>
        )}

        {currentTab === 'addictions' && (
          <View>
            <View style={styles.rowBetween}>
              <Text style={styles.viewTitle}>Habits</Text>
              <TouchableOpacity style={styles.smallAccentBtn} onPress={() => setAddictionModalVisible(true)}>
                <Ionicons name="add-sharp" size={18} color="#FFF" />
                <Text style={styles.smallAccentBtnText}>New Habit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.habitStreakBoard}>
              <View style={styles.rowBetween}>
                <Text style={styles.habitStreakBoardTitle}>Streaks</Text>
                <Ionicons name="flame" size={18} color="#F59E0B" />
              </View>
              {addictions.length === 0 ? (
                <Text style={styles.habitStreakEmpty}>Add a habit to start a streak.</Text>
              ) : (
                addictions
                  .map((tracker) => ({
                    ...tracker,
                    streak: getHabitStreak(tracker.history)
                  }))
                  .sort((a, b) => b.streak - a.streak)
                  .map((tracker) => (
                    <View key={tracker.id} style={styles.habitStreakRow}>
                      <View style={[styles.habitStreakDot, { backgroundColor: tracker.color }]} />
                      <Text style={styles.habitStreakName} numberOfLines={1}>{tracker.name}</Text>
                      <Text style={styles.habitStreakValue}>
                        {tracker.streak} day{tracker.streak === 1 ? '' : 's'}
                      </Text>
                    </View>
                  ))
              )}
            </View>

            {addictions.length === 0 ? (
              <View style={styles.card}>
                <Text style={{ color: THEME.textMuted, textAlign: 'center' }}>No habits yet. Add one to start tracking.</Text>
              </View>
            ) : (
              addictions.map(tracker => {
                const isCleanToday = !!tracker.history[todayStr];
                const streak = getHabitStreak(tracker.history);
                const totalDays = Object.keys(tracker.history).length;
                return (
                  <View key={tracker.id} style={[styles.card, { borderLeftWidth: 5, borderLeftColor: tracker.color }]}>
                    <View style={styles.rowBetween}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{tracker.name}</Text>
                        <Text style={styles.cardMutedText}>
                          Streak: {streak} day{streak === 1 ? '' : 's'} · Total: {totalDays}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteAddiction(tracker.id)}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.cleanDayBtn,
                        isCleanToday ? { backgroundColor: tracker.color } : { backgroundColor: THEME.surfaceLight }
                      ]}
                      onPress={() => handleToggleCleanDay(tracker.id)}
                    >
                      <Ionicons
                        name={isCleanToday ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={THEME.text}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={{ color: THEME.text, fontWeight: '700' }}>
                        {isCleanToday ? 'Done Today' : 'Mark Done Today'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}

      </ScrollView>

      <Modal visible={recoverySettingsVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Recovery Settings</Text>
              <TouchableOpacity onPress={() => setRecoverySettingsVisible(false)}>
                <Ionicons name="close" size={22} color={THEME.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.cardMutedText, { marginBottom: 10 }]}>
              Set recovery hours per muscle group (default is 36h).
            </Text>

            {RECOVERY_CATEGORIES.map((category) => (
              <View key={category} style={styles.recoverySettingRow}>
                <Text style={styles.recoverySettingName}>{category}</Text>
                <TextInput
                  style={styles.recoverySettingInput}
                  keyboardType="numeric"
                  value={String(recoveryWindows[category] ?? 36)}
                  onChangeText={(val) => handleUpdateRecoveryWindow(category, val)}
                />
                <Text style={styles.recoverySettingSuffix}>h</Text>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: THEME.surfaceLight, marginTop: 12 }]}
              onPress={() => setRecoverySettingsVisible(false)}
            >
              <Text style={{ color: THEME.text, textAlign: 'center' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={suppModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{editingSuppId ? 'Edit Supplement' : 'Add Supplement'}</Text>
              <TouchableOpacity onPress={closeSuppModal}>
                <Ionicons name="close" size={22} color={THEME.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Name:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Creatine Monohydrate"
              placeholderTextColor="#666"
              value={suppNameInput}
              onChangeText={(val) => {
                setSuppNameInput(val);
                setShowSuppSuggestions(true);
              }}
            />

            {showSuppSuggestions && filteredSuppSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <ScrollView style={{ maxHeight: 140 }}>
                  {filteredSuppSuggestions.map((item) => (
                    <TouchableOpacity
                      key={item.name}
                      style={styles.suggestionItem}
                      onPress={() => {
                        setSuppNameInput(item.name);
                        if (!suppDoseInput.trim() && item.doseMg != null) {
                          setSuppDoseInput(String(item.doseMg));
                        }
                        setShowSuppSuggestions(false);
                      }}
                    >
                      <Text style={{ color: THEME.text, fontSize: 13 }}>{item.name}</Text>
                      <Text style={{ color: THEME.textMuted, fontSize: 11, marginTop: 2 }}>
                        Suggested: {formatSuppDose(item.doseMg)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.inputLabel}>Dose (mg):</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5000 or 0,025"
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
              value={suppDoseInput}
              onChangeText={(val) => {
                // Allow digits, one decimal separator ("," or "."), and optional leading zeros
                const cleaned = val.replace(/[^\d.,]/g, '');
                const parts = cleaned.split(/[.,]/);
                if (parts.length <= 1) {
                  setSuppDoseInput(cleaned);
                  return;
                }
                const sep = cleaned.includes(',') ? ',' : '.';
                setSuppDoseInput(`${parts[0]}${sep}${parts.slice(1).join('')}`);
              }}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              {editingSuppId ? (
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: 'rgba(239,68,68,0.2)', marginRight: 'auto' }]}
                  onPress={() => handleDeleteSupplement(editingSuppId)}
                >
                  <Text style={{ color: '#EF4444', fontWeight: '700' }}>Delete</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: THEME.surfaceLight }]} onPress={closeSuppModal}>
                <Text style={{ color: THEME.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: THEME.accent, marginLeft: 8 }]} onPress={handleSaveSupplement}>
                <Text style={{ color: THEME.text, fontWeight: '700' }}>{editingSuppId ? 'Save' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Routine creator / editor */}
      <Modal visible={routineModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '85%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{editingRoutineId ? 'Edit Routine' : 'Create Routine'}</Text>
              <TouchableOpacity onPress={handleCloseRoutineModal}>
                <Ionicons name="close" size={22} color={THEME.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.picInput}
                placeholder="Routine name (e.g. Push Day)"
                placeholderTextColor="#666"
                value={newRoutineName}
                onChangeText={setNewRoutineName}
              />

              <Text style={styles.picSectionLabel}>Color</Text>
              <View style={styles.picColorRow}>
                {Object.keys(ROUTINE_COLORS).map(cName => (
                  <TouchableOpacity
                    key={cName}
                    style={[
                      styles.picColorDot,
                      { backgroundColor: ROUTINE_COLORS[cName] },
                      newRoutineColor === cName && styles.picColorDotSelected
                    ]}
                    onPress={() => setNewRoutineColor(cName)}
                  />
                ))}
              </View>

              <Text style={styles.picSectionLabel}>Exercises</Text>
              <View style={styles.picAppendRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <TextInput
                    style={styles.picSearchInput}
                    placeholder="Search exercise..."
                    placeholderTextColor="#666"
                    value={exInput}
                    onChangeText={(val) => { setExInput(val); setShowSuggestions(true); }}
                  />
                </View>
                <TextInput
                  style={styles.picSetsInput}
                  placeholder="2"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={exSetsInput}
                  onChangeText={setExSetsInput}
                />
                <TouchableOpacity style={styles.picAddBtn} onPress={handleAddExerciseToCreator}>
                  <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>

              {showSuggestions && filteredSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <ScrollView style={{ maxHeight: 120 }}>
                    {filteredSuggestions.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.suggestionItem}
                        onPress={() => {
                          setExInput(item);
                          setShowSuggestions(false);
                        }}
                      >
                        <Text style={{ color: THEME.text, fontSize: 13 }}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={{ marginTop: 6 }}>
                {newRoutineExercises.map((ex, idx) => (
                  <View key={ex.id || idx} style={styles.picExerciseCard}>
                    <View style={styles.picExerciseCardControls}>
                      <TouchableOpacity onPress={() => handleMoveExerciseInCreator(idx, -1)}>
                        <Ionicons name="chevron-up" size={14} color={THEME.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleMoveExerciseInCreator(idx, 1)} style={{ marginTop: 2 }}>
                        <Ionicons name="chevron-down" size={14} color={THEME.textMuted} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.picExerciseTitleText} numberOfLines={1}>
                      {idx + 1}. {ex.name}
                    </Text>
                    <View style={styles.picExerciseSetsWrapper}>
                      <Text style={styles.picSetsLabelText}>Sets:</Text>
                      <TextInput
                        style={styles.picExerciseSetsInput}
                        keyboardType="numeric"
                        value={String(ex.defaultSets)}
                        onChangeText={(val) => handleUpdateExerciseSetsInCreator(idx, val)}
                      />
                    </View>
                    <TouchableOpacity onPress={() => setNewRoutineExercises(newRoutineExercises.filter((_, i) => i !== idx))} style={{ padding: 4 }}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={[styles.primaryButton, { marginTop: 16, marginBottom: 20 }]} onPress={handleCreateOrUpdateRoutine}>
                <Text style={styles.primaryButtonText}>Save Routine</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={prModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Record Personal Record</Text>

            <Text style={styles.inputLabel}>Exercise:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Back Squat"
              placeholderTextColor="#666"
              value={newPrExName}
              onChangeText={(val) => {
                setNewPrExName(val);
                setShowPrSuggestions(true);
              }}
            />

            {showPrSuggestions && filteredPrSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <ScrollView style={{ maxHeight: 120 }}>
                  {filteredPrSuggestions.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.suggestionItem}
                      onPress={() => {
                        setNewPrExName(item);
                        setShowPrSuggestions(false);
                      }}
                    >
                      <Text style={{ color: THEME.text, fontSize: 13 }}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.inputLabel}>Max Weight (KG):</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 140"
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
              value={newPrWeight}
              onChangeText={setNewPrWeight}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: THEME.surfaceLight }]} onPress={() => setPrModalVisible(false)}>
                <Text style={{ color: THEME.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: THEME.accent, marginLeft: 8 }]} onPress={() => { handleSavePR(); setPrModalVisible(false); }}>
                <Text style={{ color: THEME.text, fontWeight: '700' }}>Save PR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={schedulerModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Assign for {selectedScheduleDay}</Text>

            <TouchableOpacity style={styles.flexibleRoutineItem} onPress={() => handleAssignSchedule(null)}>
              <Text style={{ color: '#EF4444', fontWeight: '600' }}>None (Rest Day)</Text>
            </TouchableOpacity>

            {routines.map(r => (
              <TouchableOpacity key={r.id} style={[styles.flexibleRoutineItem, { borderLeftColor: r.color }]} onPress={() => handleAssignSchedule(r.id)}>
                <Text style={{ color: THEME.text, fontWeight: '600' }}>{r.name}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: THEME.surfaceLight, marginTop: 12 }]} onPress={() => setSchedulerModalVisible(false)}>
              <Text style={{ color: THEME.text, textAlign: 'center' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={historyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>{selectedHistoryDate}</Text>

            {selectedHistoryDate && history[selectedHistoryDate] ? (
              <ScrollView>
                {getSessionsForDate(history, selectedHistoryDate).map((session, sessionIdx, sessionArr) => (
                  <View key={`${selectedHistoryDate}-${sessionIdx}`} style={{ marginBottom: 14 }}>
                    <View style={styles.rowBetween}>
                      <Text style={{ color: session.color || THEME.accent, fontWeight: '700', fontSize: 16, flex: 1, marginRight: 8, marginBottom: 10 }}>
                        {sessionArr.length > 1 ? `Session ${sessionIdx + 1}: ${session.routineName}` : session.routineName}
                      </Text>
                      <TouchableOpacity
                        style={[styles.smallAccentBtn, { paddingVertical: 5 }]}
                        onPress={() => handleEditSavedWorkout(selectedHistoryDate, sessionIdx)}
                      >
                        <Ionicons name="pencil" size={14} color="#FFF" />
                        <Text style={styles.smallAccentBtnText}>Edit</Text>
                      </TouchableOpacity>
                    </View>

                    {formatWorkoutDurationLabel(session.durationSeconds) ? (
                      <View style={styles.historyDurationRow}>
                        <Ionicons name="time-outline" size={16} color={THEME.accent} style={{ marginRight: 6 }} />
                        <Text style={styles.historyDurationText}>
                          Duration {formatWorkoutDurationLabel(session.durationSeconds)}
                          {` (${formatWorkoutClock(session.durationSeconds)})`}
                        </Text>
                      </View>
                    ) : null}

                    {session.exercises?.filter(exerciseHasLoggedWork).map((ex, exIdx) => {
                      const pastSets = getPreviousPerformance(ex.name, selectedHistoryDate);
                      const loggedSets = getLoggedSets(ex.sets);

                      return (
                        <View key={exIdx} style={{ marginBottom: 16, padding: 10, backgroundColor: THEME.surfaceLight, borderRadius: 8 }}>
                          <TouchableOpacity
                            style={styles.historyExerciseTitleRow}
                            onPress={() => openExerciseChart(ex.name)}
                            activeOpacity={0.7}
                          >
                            <Text style={{ color: THEME.text, fontWeight: '700', flex: 1, marginRight: 8 }}>{ex.name}</Text>
                            <View style={styles.historyExerciseChartHint}>
                              <Ionicons name="stats-chart" size={14} color={THEME.accent} />
                              <Text style={styles.historyExerciseChartHintText}>Chart</Text>
                            </View>
                          </TouchableOpacity>

                          {loggedSets.map((set, sIdx) => {
                            let diffTag = null;

                            if (pastSets && pastSets[sIdx]) {
                              const prevSet = pastSets[sIdx];
                              const weightDiff = (set.weight || 0) - (prevSet.weight || 0);
                              const repsDiff = (set.reps || 0) - (prevSet.reps || 0);

                              const diffTexts = [];
                              if (weightDiff !== 0) {
                                diffTexts.push(`${weightDiff > 0 ? '+' : ''}${weightDiff} kg`);
                              }
                              if (repsDiff !== 0) {
                                diffTexts.push(`${repsDiff > 0 ? '+' : ''}${repsDiff} reps`);
                              }

                              if (diffTexts.length > 0) {
                                const isPositive = weightDiff >= 0 && repsDiff >= 0;
                                diffTag = (
                                  <View style={[styles.diffTag, { backgroundColor: isPositive ? THEME.successMuted : 'rgba(239, 68, 68, 0.15)' }]}>
                                    <Text style={[styles.diffTagText, { color: isPositive ? THEME.success : '#EF4444' }]}>
                                      {diffTexts.join(', ')}
                                    </Text>
                                  </View>
                                );
                              }
                            }

                            return (
                              <View key={sIdx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 2 }}>
                                <Text style={{ color: THEME.textMuted, fontSize: 13 }}>
                                  Set {sIdx + 1}: {set.weight} KG × {set.reps} reps
                                </Text>
                                {diffTag}
                              </View>
                            );
                          })}
                        </View>
                      );
                    })}

                    <Text style={styles.noteLabel}>Note</Text>
                    <TextInput
                      style={styles.noteInput}
                      placeholder="Add a note for this workout..."
                      placeholderTextColor="#666"
                      multiline
                      value={historyNoteEdits[sessionIdx] ?? session.note ?? ''}
                      onChangeText={(val) => setHistoryNoteEdits(prev => ({ ...prev, [sessionIdx]: val }))}
                    />
                    <TouchableOpacity
                      style={[styles.primaryButton, { marginTop: 8, marginBottom: 8, paddingVertical: 10 }]}
                      onPress={() => handleSaveHistoryNote(sessionIdx)}
                    >
                      <Text style={styles.primaryButtonText}>Save Note</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={{ color: THEME.textMuted }}>No workout on this date.</Text>
            )}

            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: THEME.surfaceLight, marginTop: 12 }]} onPress={() => setHistoryModalVisible(false)}>
              <Text style={{ color: THEME.text, textAlign: 'center' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={exerciseChartVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '88%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.modalTitle} numberOfLines={2}>{selectedExerciseChartName || 'Exercise'}</Text>
                <Text style={styles.cardMutedText}>Top-set weight over recent sessions</Text>
              </View>
              <TouchableOpacity onPress={() => setExerciseChartVisible(false)}>
                <Ionicons name="close" size={22} color={THEME.text} />
              </TouchableOpacity>
            </View>

            {exerciseProgressSeries.length === 0 ? (
              <Text style={{ color: THEME.textMuted, marginTop: 16 }}>No logged sets found for this exercise yet.</Text>
            ) : (
              <ScrollView style={{ marginTop: 10 }} showsVerticalScrollIndicator={false}>
                <View style={styles.exChartStatRow}>
                  <View style={styles.exChartStatCell}>
                    <Text style={styles.exChartStatLabel}>Best</Text>
                    <Text style={styles.exChartStatValue}>
                      {exerciseProgressStats.maxWeight != null ? `${exerciseProgressStats.maxWeight} kg` : '--'}
                    </Text>
                  </View>
                  <View style={styles.exChartStatCell}>
                    <Text style={styles.exChartStatLabel}>Latest</Text>
                    <Text style={styles.exChartStatValue}>
                      {exerciseProgressStats.latest
                        ? `${exerciseProgressStats.latest.maxWeight} kg × ${exerciseProgressStats.latest.bestReps}`
                        : '--'}
                    </Text>
                  </View>
                  <View style={[styles.exChartStatCell, styles.exChartStatCellLast]}>
                    <Text style={styles.exChartStatLabel}>Change</Text>
                    <Text style={[
                      styles.exChartStatValue,
                      {
                        color: exerciseProgressStats.delta == null
                          ? THEME.text
                          : exerciseProgressStats.delta >= 0 ? THEME.success : '#EF4444'
                      }
                    ]}>
                      {exerciseProgressStats.delta == null
                        ? '--'
                        : `${exerciseProgressStats.delta > 0 ? '+' : ''}${exerciseProgressStats.delta} kg`}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.chartSectionLabel, { marginTop: 8 }]}>WEIGHT TREND</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  <View style={styles.exChartBarsRow}>
                    {exerciseProgressSeries.map((point) => {
                      const maxW = Math.max(1, exerciseProgressStats.maxWeight || 1);
                      const heightPct = Math.max(8, Math.min(100, (point.maxWeight / maxW) * 100));
                      return (
                        <View key={point.id} style={styles.exChartBarCol}>
                          <Text style={styles.exChartBarValue}>{point.maxWeight}</Text>
                          <View style={styles.exChartBarTrack}>
                            <View
                              style={[
                                styles.exChartBarFill,
                                { height: `${heightPct}%` }
                              ]}
                            />
                          </View>
                          <Text style={styles.exChartBarDate}>{point.dateStr.slice(5)}</Text>
                          <Text style={styles.exChartBarReps}>{point.bestReps} reps</Text>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>

                <Text style={[styles.chartSectionLabel, { marginTop: 18 }]}>SESSIONS</Text>
                {exerciseProgressSeries.slice().reverse().map((point) => (
                  <View key={`list-${point.id}`} style={styles.exChartSessionRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.exChartSessionDate}>{point.dateStr}</Text>
                      <Text style={styles.exChartSessionMeta}>{point.routineName} · {point.setCount} sets</Text>
                    </View>
                    <Text style={styles.exChartSessionWeight}>
                      {point.maxWeight} kg × {point.bestReps}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: THEME.surfaceLight, marginTop: 12 }]}
              onPress={() => setExerciseChartVisible(false)}
            >
              <Text style={{ color: THEME.text, textAlign: 'center' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={addictionModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>New Habit</Text>

            <TextInput
              style={styles.input}
              placeholder="Habit name (e.g. No Sugar)"
              placeholderTextColor="#666"
              value={newAddictionName}
              onChangeText={setNewAddictionName}
            />

            <Text style={styles.inputLabel}>Color:</Text>
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              {Object.keys(ROUTINE_COLORS).map(cName => (
                <TouchableOpacity
                  key={cName}
                  style={[
                    styles.colorDot,
                    { backgroundColor: ROUTINE_COLORS[cName] },
                    newAddictionColor === cName && styles.colorDotSelected
                  ]}
                  onPress={() => setNewAddictionColor(cName)}
                />
              ))}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: THEME.surfaceLight }]} onPress={() => setAddictionModalVisible(false)}>
                <Text style={{ color: THEME.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: THEME.accent, marginLeft: 8 }]} onPress={handleCreateAddiction}>
                <Text style={{ color: THEME.text, fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={weeklyReportVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '85%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Weekly Report</Text>
              <TouchableOpacity onPress={() => setWeeklyReportVisible(false)}>
                <Ionicons name="close" size={22} color={THEME.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.cardMutedText}>
              {weeklyReport.weekStartStr} → {weeklyReport.weekEnd}
            </Text>

            <ScrollView style={{ marginTop: 12 }}>
              <View style={styles.reportStatGrid}>
                <View style={styles.reportStatCell}>
                  <Text style={styles.reportStatLabel}>Gym days</Text>
                  <Text style={styles.reportStatValue}>{weeklyReport.workoutDays}/7</Text>
                </View>
                <View style={styles.reportStatCell}>
                  <Text style={styles.reportStatLabel}>Sessions</Text>
                  <Text style={styles.reportStatValue}>{weeklyReport.totalSessions}</Text>
                </View>
                <View style={styles.reportStatCell}>
                  <Text style={styles.reportStatLabel}>Total sets</Text>
                  <Text style={styles.reportStatValue}>{weeklyReport.totalSets}</Text>
                </View>
                <View style={styles.reportStatCell}>
                  <Text style={styles.reportStatLabel}>Gym time</Text>
                  <Text style={styles.reportStatValue}>
                    {formatWorkoutDurationLabel(weeklyReport.totalWorkoutSeconds) || '--'}
                  </Text>
                </View>
                <View style={styles.reportStatCell}>
                  <Text style={styles.reportStatLabel}>Exercises</Text>
                  <Text style={styles.reportStatValue}>{weeklyReport.totalExercises}</Text>
                </View>
                <View style={styles.reportStatCell}>
                  <Text style={styles.reportStatLabel}>Avg sleep</Text>
                  <Text style={styles.reportStatValue}>
                    {weeklyReport.avgSleep != null ? formatDurationHours(weeklyReport.avgSleep) : '--'}
                  </Text>
                </View>
                <View style={styles.reportStatCell}>
                  <Text style={styles.reportStatLabel}>Sleep nights</Text>
                  <Text style={styles.reportStatValue}>{weeklyReport.sleepNights}</Text>
                </View>
                <View style={styles.reportStatCell}>
                  <Text style={styles.reportStatLabel}>Avg protein</Text>
                  <Text style={styles.reportStatValue}>
                    {weeklyReport.avgProtein != null ? `${Math.round(weeklyReport.avgProtein)}g` : '--'}
                  </Text>
                </View>
                <View style={styles.reportStatCell}>
                  <Text style={styles.reportStatLabel}>Protein goals</Text>
                  <Text style={styles.reportStatValue}>
                    {weeklyReport.proteinGoalHits}/{weeklyReport.proteinDays}
                  </Text>
                </View>
                <View style={[styles.reportStatCell, { width: '100%' }]}>
                  <Text style={styles.reportStatLabel}>Weight change</Text>
                  <Text style={styles.reportStatValue}>
                    {weeklyReport.weightDelta == null
                      ? '--'
                      : `${weeklyReport.weightDelta > 0 ? '+' : ''}${String(Math.round(weeklyReport.weightDelta * 10) / 10).replace('.', ',')} kg`}
                  </Text>
                </View>
              </View>

              <Text style={[styles.chartSectionLabel, { marginTop: 8 }]}>SETS BY MUSCLE</Text>
              {RECOVERY_CATEGORIES.map((cat) => {
                const count = weeklyReport.setsByMuscle[cat] || 0;
                const max = Math.max(1, weeklyReport.totalSets);
                return (
                  <View key={cat} style={styles.weeklySetsRow}>
                    <Text style={styles.weeklySetsCategory}>{cat}</Text>
                    <View style={styles.weeklySetsBarTrack}>
                      <View
                        style={[
                          styles.weeklySetsBarFill,
                          {
                            width: `${(count / max) * 100}%`,
                            backgroundColor: count > 0 ? '#22C55E' : 'transparent'
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.weeklySetsCount}>{count}</Text>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: THEME.surfaceLight, marginTop: 12 }]}
              onPress={() => setWeeklyReportVisible(false)}
            >
              <Text style={{ color: THEME.text, textAlign: 'center' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={monthlyCaptureVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '85%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                Photos · {formatMonthLabel(captureMonthKey || getMonthKey())}
              </Text>
              <TouchableOpacity onPress={() => setMonthlyCaptureVisible(false)}>
                <Ionicons name="close" size={22} color={THEME.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.cardMutedText}>
              Take up to {MAX_MONTHLY_PHOTOS} progress pics. Next month on the 1st you'll compare.
            </Text>

            <View style={{ flexDirection: 'row', marginTop: 12, marginBottom: 10 }}>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1, marginRight: 8, opacity: photoPicking ? 0.6 : 1 }]}
                disabled={photoPicking}
                onPress={() => pickMonthlyPhoto(true, captureMonthKey || getMonthKey())}
              >
                <Text style={styles.primaryButtonText}>{photoPicking ? 'Opening…' : 'Camera'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1, backgroundColor: THEME.surfaceLight, opacity: photoPicking ? 0.6 : 1 }]}
                disabled={photoPicking}
                onPress={() => pickMonthlyPhoto(false, captureMonthKey || getMonthKey())}
              >
                <Text style={[styles.primaryButtonText, { color: THEME.text }]}>
                  {photoPicking ? 'Opening…' : 'Gallery'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(monthlyPhotos[captureMonthKey || getMonthKey()]?.photos || []).map((photo) => (
                <View key={photo.id} style={styles.photoThumbWrap}>
                  <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                  <TouchableOpacity
                    style={styles.photoDeleteBtn}
                    onPress={() => removeMonthlyPhoto(captureMonthKey || getMonthKey(), photo.id)}
                  >
                    <Ionicons name="trash" size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: THEME.accent, marginTop: 12 }]}
              onPress={() => setMonthlyCaptureVisible(false)}
            >
              <Text style={{ color: '#FFF', textAlign: 'center', fontWeight: '700' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={monthlyCompareVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Compare</Text>
              <TouchableOpacity onPress={() => setMonthlyCompareVisible(false)}>
                <Ionicons name="close" size={22} color={THEME.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.chartSectionLabel}>
                LAST MONTH · {formatMonthLabel(compareMonthKey)}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                {(monthlyPhotos[compareMonthKey]?.photos || []).map((photo) => (
                  <Image key={photo.id} source={{ uri: photo.uri }} style={styles.photoCompare} />
                ))}
                {(monthlyPhotos[compareMonthKey]?.photos || []).length === 0 ? (
                  <Text style={{ color: THEME.textMuted }}>No photos</Text>
                ) : null}
              </ScrollView>

              <Text style={styles.chartSectionLabel}>
                THIS MONTH · {formatMonthLabel(getMonthKey())}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                {(monthlyPhotos[getMonthKey()]?.photos || []).map((photo) => (
                  <Image key={photo.id} source={{ uri: photo.uri }} style={styles.photoCompare} />
                ))}
                {(monthlyPhotos[getMonthKey()]?.photos || []).length === 0 ? (
                  <Text style={{ color: THEME.textMuted }}>No photos yet — tap Take photos</Text>
                ) : null}
              </ScrollView>
            </ScrollView>

            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1, marginRight: 8, backgroundColor: THEME.surfaceLight }]}
                onPress={() => setMonthlyCompareVisible(false)}
              >
                <Text style={[styles.primaryButtonText, { color: THEME.text }]}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1 }]}
                onPress={() => {
                  setMonthlyCompareVisible(false);
                  promptAddMonthlyPhoto(getMonthKey());
                }}
              >
                <Text style={styles.primaryButtonText}>Take photos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={albumVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '85%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Photo Album</Text>
              <TouchableOpacity onPress={() => setAlbumVisible(false)}>
                <Ionicons name="close" size={22} color={THEME.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {Object.keys(monthlyPhotos).sort((a, b) => (a < b ? 1 : -1)).length === 0 ? (
                <Text style={{ color: THEME.textMuted }}>No months saved yet.</Text>
              ) : (
                Object.keys(monthlyPhotos).sort((a, b) => (a < b ? 1 : -1)).map((monthKey) => (
                  <View key={monthKey} style={{ marginBottom: 16 }}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.cardTitle}>{formatMonthLabel(monthKey)}</Text>
                      <TouchableOpacity onPress={() => promptAddMonthlyPhoto(monthKey)}>
                        <Text style={{ color: THEME.accent, fontWeight: '700' }}>Add</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                      {(monthlyPhotos[monthKey]?.photos || []).map((photo) => (
                        <Image key={photo.id} source={{ uri: photo.uri }} style={styles.photoThumb} />
                      ))}
                    </ScrollView>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: THEME.surfaceLight, marginTop: 12 }]}
              onPress={() => setAlbumVisible(false)}
            >
              <Text style={{ color: THEME.text, textAlign: 'center' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('today')}>
          <Ionicons name="today" size={20} color={currentTab === 'today' ? THEME.accent : THEME.textMuted} />
          <Text style={[styles.tabLabel, currentTab === 'today' && styles.tabLabelActive]}>Today</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('routines')}>
          <Ionicons name="barbell" size={20} color={currentTab === 'routines' ? THEME.accent : THEME.textMuted} />
          <Text style={[styles.tabLabel, currentTab === 'routines' && styles.tabLabelActive]}>Routines</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('schedule')}>
          <Ionicons name="calendar" size={20} color={currentTab === 'schedule' ? THEME.accent : THEME.textMuted} />
          <Text style={[styles.tabLabel, currentTab === 'schedule' && styles.tabLabelActive]}>Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            setCurrentTab('history');
            setHistoryPane('log');
          }}
        >
          <Ionicons name="stats-chart" size={20} color={currentTab === 'history' ? THEME.accent : THEME.textMuted} />
          <Text style={[styles.tabLabel, currentTab === 'history' && styles.tabLabelActive]}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('addictions')}>
          <Ionicons name="flame" size={20} color={currentTab === 'addictions' ? THEME.accent : THEME.textMuted} />
          <Text style={[styles.tabLabel, currentTab === 'addictions' && styles.tabLabelActive]}>Habits</Text>
        </TouchableOpacity>
      </View>

    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootShell: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  statusBarFill: {
    width: '100%',
    backgroundColor: THEME.background,
    zIndex: 10,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    backgroundColor: THEME.background,
  },
  headerTitle: {
    color: THEME.text,
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: THEME.textMuted,
    fontSize: 12,
  },
  headerWorkoutTime: {
    color: THEME.accent,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  spontaneousLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.accent,
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 12,
    marginTop: 4,
  },
  spontaneousLaunchBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  historyPaneRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  historyPaneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  historyPaneBtnActive: {
    backgroundColor: THEME.accent,
    borderColor: THEME.accent,
  },
  historyPaneBtnText: {
    color: THEME.textMuted,
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },
  historyPaneBtnTextActive: {
    color: '#FFF',
  },
  todayPaneRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  todayPaneBtn: {
    flex: 1,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    marginRight: 8,
  },
  todayPaneBtnActive: {
    backgroundColor: THEME.accent,
    borderColor: THEME.accent,
  },
  todayPaneBtnText: {
    color: THEME.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  todayPaneBtnTextActive: {
    color: '#FFF',
  },
  recoveryPanelCard: {
    backgroundColor: '#1D1D26',
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  recoveryPanelTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: '800',
  },
  recoveryDetailsLink: {
    color: '#4F8DFF',
    fontSize: 15,
    fontWeight: '700',
  },
  recoveryLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  recoveryLineCategory: {
    width: 82,
    color: THEME.text,
    fontSize: 12,
    fontWeight: '600',
  },
  recoveryLineBarTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2C2C38',
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  recoveryLineBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  recoveryLineRightCol: {
    width: 90,
    alignItems: 'flex-end',
  },
  recoveryLineStatus: {
    fontSize: 13,
    fontWeight: '700',
  },
  recoveryLineTime: {
    color: THEME.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  recoverySettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: THEME.surfaceLight,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  recoverySettingName: {
    flex: 1,
    color: THEME.text,
    fontWeight: '600',
  },
  recoverySettingInput: {
    width: 54,
    backgroundColor: THEME.background,
    color: THEME.text,
    borderRadius: 6,
    textAlign: 'center',
    paddingVertical: 6,
    marginRight: 6,
  },
  recoverySettingSuffix: {
    color: THEME.textMuted,
    width: 12,
  },
  weeklySetsCard: {
    backgroundColor: '#1D1D26',
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  weeklySetsTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: '800',
  },
  weeklySetsHint: {
    color: THEME.textMuted,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 4,
  },
  weeklySetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  weeklySetsCategory: {
    width: 82,
    color: THEME.text,
    fontSize: 12,
    fontWeight: '600',
  },
  weeklySetsBarTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2C2C38',
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  weeklySetsBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  weeklySetsCount: {
    width: 28,
    textAlign: 'right',
    color: THEME.text,
    fontSize: 14,
    fontWeight: '700',
  },
  healthCard: {
    backgroundColor: '#1D1D26',
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  motivationCard: {
    backgroundColor: '#1D1D26',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  reportCard: {
    backgroundColor: '#1D1D26',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  reportCardTitle: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '800',
  },
  reportCardHint: {
    color: THEME.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  reportPreviewLine: {
    color: THEME.textMuted,
    fontSize: 12,
    marginTop: 10,
  },
  reportStatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  reportStatCell: {
    width: '50%',
    marginBottom: 12,
    paddingRight: 8,
  },
  reportStatLabel: {
    color: THEME.textMuted,
    fontSize: 11,
  },
  reportStatValue: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  photoThumbWrap: {
    marginRight: 10,
    position: 'relative',
  },
  photoThumb: {
    width: 92,
    height: 122,
    borderRadius: 10,
    backgroundColor: THEME.surfaceLight,
    marginRight: 8,
  },
  photoCompare: {
    width: 140,
    height: 190,
    borderRadius: 12,
    backgroundColor: THEME.surfaceLight,
    marginRight: 10,
  },
  photoDeleteBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  motivationTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  motivationRow: {
    flexDirection: 'row',
  },
  motivationPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surfaceLight,
    borderRadius: 12,
    padding: 10,
    marginRight: 8,
  },
  motivationPillLabel: {
    color: THEME.textMuted,
    fontSize: 11,
  },
  motivationPillValue: {
    color: THEME.text,
    fontSize: 15,
    fontWeight: '800',
  },
  motivationPillSub: {
    color: THEME.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  proteinGoalLabel: {
    color: THEME.text,
    fontWeight: '600',
    fontSize: 13,
  },
  proteinGoalControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proteinGoalBtn: {
    backgroundColor: THEME.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  proteinGoalBtnText: {
    color: THEME.text,
    fontWeight: '700',
    fontSize: 12,
  },
  proteinGoalInput: {
    width: 58,
    marginHorizontal: 8,
    backgroundColor: THEME.background,
    color: THEME.text,
    borderRadius: 8,
    textAlign: 'center',
    paddingVertical: 6,
    fontWeight: '700',
  },
  proteinGoalUnit: {
    color: THEME.textMuted,
    marginRight: 8,
    fontWeight: '600',
  },
  proteinProgressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2C2C38',
    overflow: 'hidden',
    marginTop: 12,
  },
  proteinProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  proteinProgressText: {
    color: THEME.textMuted,
    fontSize: 12,
    marginTop: 6,
    marginBottom: 4,
  },
  proteinQuickRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  proteinQuickBtn: {
    flex: 1,
    backgroundColor: THEME.surfaceLight,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  proteinQuickBtnText: {
    color: THEME.text,
    fontWeight: '700',
    fontSize: 12,
  },
  habitStreakBoard: {
    backgroundColor: '#1D1D26',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  habitStreakBoardTitle: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '800',
  },
  habitStreakEmpty: {
    color: THEME.textMuted,
    fontSize: 12,
    marginTop: 10,
  },
  habitStreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  habitStreakDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  habitStreakName: {
    flex: 1,
    color: THEME.text,
    fontSize: 13,
    fontWeight: '600',
  },
  habitStreakValue: {
    color: '#F59E0B',
    fontWeight: '800',
    fontSize: 13,
  },
  healthCardTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: '800',
  },
  healthCardHint: {
    color: THEME.textMuted,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10,
  },
  lastNightRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  lastNightLabel: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '600',
  },
  lastNightHours: {
    color: '#F59E0B',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 2,
  },
  lastNightRange: {
    color: THEME.text,
    fontSize: 13,
    marginTop: 2,
  },
  lastNightDate: {
    color: THEME.textMuted,
    fontSize: 11,
  },
  healthInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  chartSectionLabel: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  chartSectionMeta: {
    color: THEME.textMuted,
    fontSize: 12,
  },
  sleepChartArea: {
    flexDirection: 'row',
    height: 160,
  },
  sleepYAxis: {
    width: 28,
    justifyContent: 'space-between',
    paddingBottom: 18,
  },
  sleepYLabel: {
    color: THEME.textMuted,
    fontSize: 10,
  },
  sleepBarsWrap: {
    flex: 1,
    position: 'relative',
  },
  sleepTargetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  sleepTargetDash: {
    flex: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#22C55E',
  },
  sleepTargetText: {
    color: '#22C55E',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  sleepBarsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 18,
  },
  sleepBarCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  sleepBarTrack: {
    width: 14,
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  sleepBarFill: {
    width: '100%',
    borderRadius: 6,
    minHeight: 2,
  },
  sleepBarLabel: {
    color: THEME.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
  rhythmGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  rhythmCell: {
    width: '50%',
    marginBottom: 12,
    paddingRight: 8,
  },
  rhythmLabel: {
    color: THEME.textMuted,
    fontSize: 11,
  },
  rhythmValue: {
    color: THEME.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  rhythmSub: {
    color: THEME.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  weightBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    marginTop: 4,
  },
  weightBarCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  weightBarValue: {
    color: THEME.textMuted,
    fontSize: 9,
    marginBottom: 4,
    height: 12,
  },
  weightBarTrack: {
    width: 14,
    flex: 1,
    justifyContent: 'flex-end',
  },
  weightBarFill: {
    width: '100%',
    borderRadius: 6,
    minHeight: 2,
  },
  noteLabel: {
    color: THEME.textMuted,
    fontSize: 12,
    marginTop: 10,
    marginBottom: 6,
  },
  noteInput: {
    backgroundColor: THEME.surfaceLight,
    color: THEME.text,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  historyEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  supplementsCard: {
    backgroundColor: '#1D1D26',
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  supplementsTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: '800',
  },
  suppAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(79, 141, 255, 0.15)',
  },
  suppEmptyText: {
    color: THEME.textMuted,
    fontSize: 13,
    marginTop: 14,
    textAlign: 'center',
  },
  suppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  suppCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suppCheckTaken: {
    backgroundColor: '#4F8DFF',
    borderColor: '#4F8DFF',
  },
  suppTextCol: {
    flex: 1,
  },
  suppName: {
    color: THEME.text,
    fontSize: 15,
    fontWeight: '700',
  },
  suppDose: {
    color: THEME.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  viewTitle: {
    color: THEME.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    backgroundColor: THEME.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  cardTitle: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '700',
  },
  cardMutedText: {
    color: THEME.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  flexibleRoutineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.surfaceLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  clearImpromptuBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  toggleCard: {
    backgroundColor: THEME.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  toggleText: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: '600',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: THEME.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: THEME.accent,
  },
  completedBannerCard: {
    backgroundColor: THEME.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.success,
  },
  completedBannerTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: '700',
  },
  completedBannerMuted: {
    color: THEME.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: THEME.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  smallAccentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  smallAccentBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  scheduleRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  dayText: {
    color: THEME.text,
    fontWeight: '700',
    fontSize: 15,
  },
  assignBtn: {
    backgroundColor: THEME.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  heatmapCell: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: THEME.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: '700',
  },
  inputLabel: {
    color: THEME.textMuted,
    fontSize: 12,
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    backgroundColor: THEME.surfaceLight,
    color: THEME.text,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
  },
  colorDotSelected: {
    borderWidth: 2,
    borderColor: '#FFF',
  },
  picInput: {
    backgroundColor: THEME.surfaceLight,
    color: THEME.text,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  picSectionLabel: {
    color: THEME.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  picColorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  picColorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  picColorDotSelected: {
    borderWidth: 2,
    borderColor: '#FFF',
  },
  picAppendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  picSearchInput: {
    backgroundColor: THEME.surfaceLight,
    color: THEME.text,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  picSetsInput: {
    backgroundColor: THEME.surfaceLight,
    color: THEME.text,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    width: 45,
    textAlign: 'center',
    marginRight: 8,
  },
  picAddBtn: {
    backgroundColor: THEME.accent,
    width: 42,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  picExerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surfaceLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  picExerciseCardControls: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  picExerciseTitleText: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  picExerciseSetsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.background,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  picSetsLabelText: {
    color: THEME.textMuted,
    fontSize: 11,
    marginRight: 4,
  },
  picExerciseSetsInput: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
  },
  suggestionsContainer: {
    backgroundColor: THEME.surfaceLight,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  modalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  exerciseLogBlock: {
    marginBottom: 16,
  },
  exerciseLogName: {
    color: THEME.text,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 8,
  },
  prevHint: {
    color: THEME.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  prevSetLine: {
    color: '#666',
    fontSize: 10,
    marginLeft: 43,
    marginBottom: 6,
  },
  setAdjustBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.surfaceLight,
  },
  logMetricsRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  columnLabel: {
    color: THEME.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  rowCompletedHighlight: {
    opacity: 0.6,
  },
  setCheckBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  setCheckBtnActive: {
    backgroundColor: THEME.success,
    borderColor: THEME.success,
  },
  setCheckText: {
    color: THEME.textMuted,
    fontSize: 12,
  },
  logInputCompact: {
    backgroundColor: THEME.surfaceLight,
    color: THEME.text,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    textAlign: 'center',
  },
  logInputDisabled: {
    backgroundColor: '#222',
  },
  timerTriggerBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerPresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 8,
  },
  timerPresetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: THEME.surfaceLight,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  timerPresetBtnActive: {
    backgroundColor: THEME.accentMuted,
    borderColor: THEME.accent,
  },
  timerPresetText: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  timerPresetTextActive: {
    color: THEME.accent,
  },
  timerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.accentMuted,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  timerBannerText: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: '600',
  },
  workoutClockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.surfaceLight,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  workoutClockLabel: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  workoutClockValue: {
    color: THEME.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginTop: 1,
  },
  workoutClockHint: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  workoutLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.accentMuted,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  workoutLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: THEME.accent,
    marginRight: 5,
  },
  workoutLiveText: {
    color: THEME.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sessionAddBlock: {
    marginTop: 8,
    marginBottom: 8,
  },
  sessionAddLabel: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  historyDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: -4,
  },
  historyDurationText: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: '700',
  },
  historyExerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyExerciseChartHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.accentMuted,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  historyExerciseChartHintText: {
    color: THEME.accent,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  exChartStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  exChartStatCell: {
    flex: 1,
    backgroundColor: THEME.surfaceLight,
    borderRadius: 10,
    padding: 10,
    marginRight: 8,
  },
  exChartStatCellLast: {
    marginRight: 0,
  },
  exChartStatLabel: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  exChartStatValue: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  exChartBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingRight: 8,
    minHeight: 170,
  },
  exChartBarCol: {
    width: 52,
    alignItems: 'center',
    marginRight: 8,
    height: 170,
    justifyContent: 'flex-end',
  },
  exChartBarValue: {
    color: THEME.text,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  exChartBarTrack: {
    width: 22,
    height: 110,
    justifyContent: 'flex-end',
    backgroundColor: THEME.background,
    borderRadius: 8,
    overflow: 'hidden',
  },
  exChartBarFill: {
    width: '100%',
    backgroundColor: THEME.accent,
    borderRadius: 8,
    minHeight: 4,
  },
  exChartBarDate: {
    color: THEME.textMuted,
    fontSize: 10,
    marginTop: 6,
    fontWeight: '600',
  },
  exChartBarReps: {
    color: THEME.textMuted,
    fontSize: 9,
    marginTop: 1,
  },
  exChartSessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 8,
  },
  exChartSessionDate: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: '700',
  },
  exChartSessionMeta: {
    color: THEME.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  exChartSessionWeight: {
    color: THEME.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  timerCancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cleanDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  recoveryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  recoveryBadge: {
    width: '48%',
    backgroundColor: THEME.surfaceLight,
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  recoveryCategory: {
    color: THEME.text,
    fontWeight: '700',
    fontSize: 12,
  },
  recoveryStatus: {
    fontWeight: '700',
    fontSize: 11,
    marginTop: 2,
  },
  recoveryVolume: {
    color: THEME.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  diffTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  diffTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: THEME.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingVertical: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabItem: {
    alignItems: 'center',
  },
  tabLabel: {
    color: THEME.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  tabLabelActive: {
    color: THEME.accent,
    fontWeight: '700',
  },
});
