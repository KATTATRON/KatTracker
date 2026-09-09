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
  SafeAreaView,
  StatusBar,
  Platform,
  Vibration
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

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
  SUPPLEMENT_LOG: '@kat_tracker_supplement_log_v1'
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

const emptySet = (weight = '', reps = '') => ({ weight, reps, done: false });

const buildSetsFromPrevious = (count, pastSets) =>
  Array.from({ length: count }, (_, i) => {
    const past = pastSets?.[i];
    return emptySet(
      past?.weight != null && past.weight !== 0 ? String(past.weight) : (past?.weight === 0 ? '0' : ''),
      past?.reps != null && past.reps !== 0 ? String(past.reps) : (past?.reps === 0 ? '0' : '')
    );
  });

const formatTimerString = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const getSessionsForDate = (historyObj, dateStr) => {
  const dayEntry = historyObj?.[dateStr];
  if (!dayEntry) return [];
  return Array.isArray(dayEntry) ? dayEntry : [dayEntry];
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
                  placeholder={past ? String(past.weight ?? '0') : '0.0'}
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
                  placeholder={past ? String(past.reps ?? '0') : '0'}
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

  const [isSpontaneousMode, setIsSpontaneousMode] = useState(false);
  const [spontaneousExercises, setSpontaneousExercises] = useState([]);
  const [spontaneousModalVisible, setSpontaneousModalVisible] = useState(false);
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
          counts[category] += Array.isArray(ex.sets) ? ex.sets.length : 0;
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
        if (foundEx && foundEx.sets) {
          return foundEx.sets;
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

  const handleStartSpontaneousSession = () => {
    setIsEditingSavedWorkout(false);
    setEditingSessionIndex(null);
    setEditingHistoryDate(null);
    setIsSpontaneousMode(true);
    setSpontaneousExercises([]);
    setActiveWorkoutLogs({});
    setWorkoutNote('');
    setIsGymDayChecked(true);
    setCurrentTab('today');
    setTodayPane('workout');
  };

  const handleAddSpontaneousExercise = () => {
    const exName = spontaneousExInput.trim();
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

    const pastSets = getPreviousPerformance(exName, todayStr);
    setSpontaneousExercises([...spontaneousExercises, newEx]);
    setActiveWorkoutLogs(prev => ({
      ...prev,
      [newExId]: buildSetsFromPrevious(setsCount, pastSets)
    }));

    setSpontaneousExInput('');
    setSpontaneousSetsInput(String(DEFAULT_SETS));
    setShowSpontaneousSuggestions(false);
    setSpontaneousModalVisible(false);
  };

  const persistWorkoutToHistory = (routineName, color, exercisesList) => {
    const structuredExercises = exercisesList.map(ex => {
      const setsFilled = activeWorkoutLogs[ex.id] || [];
      return {
        name: ex.name,
        sets: setsFilled.map(s => ({
          weight: parseFloat(s.weight) || 0,
          reps: parseInt(s.reps, 10) || 0,
          done: !!s.done
        }))
      };
    });

    const targetDate = (isEditingSavedWorkout && editingHistoryDate) ? editingHistoryDate : todayStr;

    const newSession = {
      routineName,
      color,
      exercises: structuredExercises,
      timestamp: Date.now(),
      note: workoutNote.trim()
    };

    const existingSessions = getSessionsForDate(history, targetDate);
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
    return foundScheduled || impromptuRoutine;
  }, [schedule, routines, impromptuRoutine]);

  // Init logs for scheduled/impromptu routine without wiping in-progress sets
  useEffect(() => {
    if (!currentActiveRoutine || isSpontaneousMode || isEditingSavedWorkout) return;

    setActiveWorkoutLogs((prev) => {
      const next = {};
      currentActiveRoutine.exercises.forEach((ex) => {
        if (prev[ex.id]?.length) {
          next[ex.id] = prev[ex.id];
        } else {
          const pastSets = getPreviousPerformance(ex.name, todayStr);
          next[ex.id] = buildSetsFromPrevious(ex.defaultSets || DEFAULT_SETS, pastSets);
        }
      });
      return next;
    });
    setIsGymDayChecked(false);
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
      currentActiveRoutine.exercises
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

  const filteredSpontaneousSuggestions = useMemo(() => {
    if (!spontaneousExInput.trim()) return [];
    return combinedExercisePool.filter(item =>
      item.toLowerCase().includes(spontaneousExInput.toLowerCase())
    );
  }, [spontaneousExInput, combinedExercisePool]);

  const filteredPrSuggestions = useMemo(() => {
    if (!newPrExName.trim()) return [];
    return combinedExercisePool.filter(item =>
      item.toLowerCase().includes(newPrExName.toLowerCase())
    );
  }, [newPrExName, combinedExercisePool]);

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
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle="light-content" />
        <Text style={{ color: THEME.text, fontSize: 18, fontWeight: '600' }}>Loading KatTracker...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="flash" size={26} color={THEME.accent} style={{ marginRight: 6 }} />
          <Text style={styles.headerTitle}>KatTracker</Text>
        </View>
        <Text style={styles.headerSubtitle}>{todayStr}</Text>
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
            ) : isTodayCompleted ? (
              <View style={styles.completedBannerCard}>
                <Ionicons name="checkmark-circle" size={44} color={THEME.success} style={{ marginBottom: 10 }} />
                <Text style={styles.completedBannerTitle}>Workout Saved</Text>
                <Text style={styles.completedBannerMuted}>
                  {todayHistoryEntry?.routineName || 'Today'} is saved in history. You can still edit it.
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
                  <TouchableOpacity
                    style={[styles.primaryButton, { paddingHorizontal: 12, paddingVertical: 6 }]}
                    onPress={() => setSpontaneousModalVisible(true)}
                  >
                    <Text style={{ color: THEME.text, fontWeight: '700', fontSize: 12 }}>+ Add Exercise</Text>
                  </TouchableOpacity>
                </View>

                {renderTimerBanner()}

                {spontaneousExercises.length === 0 ? (
                  <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                    <Text style={{ color: THEME.textMuted }}>No exercises yet. Tap + Add Exercise to start.</Text>
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
                )}
              </View>
            ) : (
              <>
                {currentActiveRoutine ? (
                  <View style={[styles.card, { borderLeftWidth: 5, borderLeftColor: currentActiveRoutine.color }]}>
                    <View style={styles.rowBetween}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.cardTitle}>{currentActiveRoutine.name}</Text>
                        <Text style={styles.cardMutedText}>
                          {impromptuRoutine ? 'Loaded for today' : `Scheduled for ${getTodayDayName()}`}
                        </Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: currentActiveRoutine.color + '22' }]}>
                        <Text style={{ color: currentActiveRoutine.color, fontWeight: '700', fontSize: 12 }}>
                          {currentActiveRoutine.exercises.length} Exercises
                        </Text>
                      </View>
                    </View>
                    {impromptuRoutine && (
                      <TouchableOpacity style={styles.clearImpromptuBtn} onPress={() => setImpromptuRoutine(null)}>
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
                        onPress={() => setIsGymDayChecked(!isGymDayChecked)}
                      >
                        {isGymDayChecked && <Ionicons name="checkmark" size={16} color={THEME.text} />}
                      </TouchableOpacity>
                    </View>

                    {isGymDayChecked && (
                      <View style={{ marginTop: 20 }}>
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
                            {item.exercises ? item.exercises.length : 0} Exercises
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

      <Modal visible={spontaneousModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add Exercise</Text>

            <Text style={styles.inputLabel}>Search or type exercise:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Bench Press"
              placeholderTextColor="#666"
              value={spontaneousExInput}
              onChangeText={(val) => {
                setSpontaneousExInput(val);
                setShowSpontaneousSuggestions(true);
              }}
            />

            {showSpontaneousSuggestions && filteredSpontaneousSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <ScrollView style={{ maxHeight: 120 }}>
                  {filteredSpontaneousSuggestions.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
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

            <Text style={styles.inputLabel}>Sets:</Text>
            <TextInput
              style={styles.input}
              placeholder="2"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={spontaneousSetsInput}
              onChangeText={setSpontaneousSetsInput}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: THEME.surfaceLight }]} onPress={() => setSpontaneousModalVisible(false)}>
                <Text style={{ color: THEME.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: THEME.accent, marginLeft: 8 }]} onPress={handleAddSpontaneousExercise}>
                <Text style={{ color: THEME.text, fontWeight: '700' }}>Add</Text>
              </TouchableOpacity>
            </View>
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

                    {session.exercises?.map((ex, exIdx) => {
                      const pastSets = getPreviousPerformance(ex.name, selectedHistoryDate);

                      return (
                        <View key={exIdx} style={{ marginBottom: 16, padding: 10, backgroundColor: THEME.surfaceLight, borderRadius: 8 }}>
                          <Text style={{ color: THEME.text, fontWeight: '700', marginBottom: 6 }}>{ex.name}</Text>

                          {ex.sets?.map((set, sIdx) => {
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

      <View style={styles.tabBar}>
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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
