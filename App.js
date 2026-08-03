import React, { useState, useEffect, useMemo } from 'react';
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
  KeyboardAvoidingView,
  Platform
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

const BASE_EXERCISE_POOL = [
  'Pull-ups (Bodyweight / Weighted)',
  'Chin-ups (Bodyweight / Weighted)',
  'Dips (Chest Focus)',
  'Dips (Triceps Focus)',
  'Flat Bench Press (Barbell)',
  'Incline Dumbbell Press',
  'Decline Barbell Press',
  'Dumbbell Chest Flys',
  'Cable Crossover Flys',
  'Push-ups (Standard / Deficit)',
  'Machine Chest Press',
  'Pec Deck Flys',
  'Incline Barbell Press',
  'Hammer Strength Chest Press',
  'Lat Pulldown (Wide Grip)',
  'Barbell Rows',
  'One-Arm Dumbbell Rows',
  'Seated Cable Rows (Close Grip)',
  'T-Bar Rows',
  'Conventional Deadlift',
  'Hyperextensions (Back Extensions)',
  'Rack Pulls',
  'Straight-Arm Cable Pulldowns',
  'Seated Row (Wide Grip)',
  'Overhead Press (Barbell)',
  'Seated Dumbbell Shoulder Press',
  'Lateral Raises (Dumbbell)',
  'Front Raises (Dumbbell / Cable)',
  'Rear Delt Flys (Pec Deck)',
  'Arnold Press',
  'Dumbbell Shrugs',
  'Upright Rows (Barbell / Cable)',
  'Face Pulls (Rope)',
  'Push Press',
  'Barbell Curls',
  'Dumbbell Alternating Curls',
  'Hammer Curls',
  'Preacher Curls (EZ Bar)',
  'Concentration Curls',
  'Incline Dumbbell Curls',
  'Cable Curls (Rope / Straight Bar)',
  'Spider Curls',
  'Bayesian Curls',
  'Zottman Curls',
  'Overhead Tricep Extension (Dumbbell)',
  'Tricep Rope Pushdowns',
  'Skull Crushers (EZ Bar)',
  'Close-Grip Bench Press',
  'Diamond Push-ups',
  'Cable V-Bar Pushdowns',
  'Tricep Dumbbell Kickbacks',
  'Bench Dips',
  'Machine Tricep Pressdown',
  'Back Squat (Barbell)',
  'Leg Press',
  'Romanian Deadlift (Barbell / Dumbbell)',
  'Leg Extensions (Machine)',
  'Seated Leg Curl',
  'Lying Leg Curl',
  'Walking Lunges',
  'Bulgarian Split Squats',
  'Standing Calf Raises',
  'Hip Thrusts (Barbell)',
  'Plank (Standard / Weighted)',
  'Abdominal Crunches',
  'Hanging Leg Raises',
  'Russian Twists',
  'Ab Wheel Rollouts',
  'Reverse Crunches',
  'Cable Woodchoppers',
  'Hanging Knee Raises',
  'Bicycle Crunches',
  'Bird Dog'
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const STORAGE_KEYS = {
  ROUTINES: '@kat_tracker_routines_v3',
  SCHEDULE: '@kat_tracker_schedule_v3',
  HISTORY: '@kat_tracker_history_v3',
  CUSTOM_EX_POOL: '@kat_tracker_custom_pool_v3',
  ADDICTIONS: '@kat_tracker_addictions_v3',
  PRS: '@kat_tracker_prs_v3'
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

export default function App() {
  // --- CORE APP STATES ---
  const [currentTab, setCurrentTab] = useState('today'); 
  const [routines, setRoutines] = useState([]);
  const [schedule, setSchedule] = useState({
    Monday: null, Tuesday: null, Wednesday: null, Thursday: null, Friday: null, Saturday: null, Sunday: null
  });
  const [history, setHistory] = useState({});
  const [customExercisePool, setCustomExercisePool] = useState([]);
  const [addictions, setAddictions] = useState([]); 
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- REST TIMER STATE ENGINE ---
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // --- SUB-SCREEN CONTROLLER STATES ---
  const [isGymDayChecked, setIsGymDayChecked] = useState(false);
  const [activeWorkoutLogs, setActiveWorkoutLogs] = useState({}); 
  const [impromptuRoutine, setImpromptuRoutine] = useState(null); 

  // --- SPONTANEOUS WORKOUT STATE ---
  const [isSpontaneousMode, setIsSpontaneousMode] = useState(false);
  const [spontaneousExercises, setSpontaneousExercises] = useState([]);
  const [spontaneousModalVisible, setSpontaneousModalVisible] = useState(false);
  const [spontaneousExInput, setSpontaneousExInput] = useState('');
  const [spontaneousSetsInput, setSpontaneousSetsInput] = useState('3');
  const [showSpontaneousSuggestions, setShowSpontaneousSuggestions] = useState(false);

  // --- PR MODAL STATES ---
  const [prModalVisible, setPrModalVisible] = useState(false);
  const [newPrExName, setNewPrExName] = useState('');
  const [newPrWeight, setNewPrWeight] = useState('');
  const [showPrSuggestions, setShowPrSuggestions] = useState(false);

  // Creator / Editor state
  const [routineModalVisible, setRoutineModalVisible] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState(null); 
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineColor, setNewRoutineColor] = useState('Blue');
  const [newRoutineExercises, setNewRoutineExercises] = useState([]);
  
  // Exercise entry sub-state
  const [exInput, setExInput] = useState('');
  const [exSetsInput, setExSetsInput] = useState('3'); 
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Scheduler assignment state
  const [schedulerModalVisible, setSchedulerModalVisible] = useState(false);
  const [selectedScheduleDay, setSelectedScheduleDay] = useState(null);

  // History viewer state
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);

  // Addiction Creator State
  const [addictionModalVisible, setAddictionModalVisible] = useState(false);
  const [newAddictionName, setNewAddictionName] = useState('');
  const [newAddictionColor, setNewAddictionColor] = useState('Red');

  // Timer Countdown Effect Loop
  useEffect(() => {
    let interval = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
      if (timerSeconds === 0) {
        setTimerActive(false);
      }
    }
    return () => clearInterval(interval);
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

      if (storedRoutines) setRoutines(JSON.parse(storedRoutines));
      if (storedSchedule) setSchedule(JSON.parse(storedSchedule));
      if (storedHistory) setHistory(JSON.parse(storedHistory));
      if (storedCustomEx) setCustomExercisePool(JSON.parse(storedCustomEx));
      if (storedAddictions) setAddictions(JSON.parse(storedAddictions));
      if (storedPrs) setPrs(JSON.parse(storedPrs));
    } catch (e) {
      Alert.alert('Error', 'Failed to load local tracking data.');
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      Alert.alert('Save Error', 'System storage failure writing states.');
    }
  };

  const combinedExercisePool = useMemo(() => {
    return [...new Set([...BASE_EXERCISE_POOL, ...customExercisePool])];
  }, [customExercisePool]);

  const isTodayCompleted = useMemo(() => {
    const todayStr = getLocalDateString();
    return !!history[todayStr];
  }, [history]);

  // --- ROUTINE & EXERCISE ORDERING / EDITING ---
  const handleMoveExerciseInCreator = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newRoutineExercises.length) return;
    const updated = [...newRoutineExercises];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedItem);
    setNewRoutineExercises(updated);
  };

  const handleUpdateExerciseSetsInCreator = (index, newSets) => {
    const setsVal = parseInt(newSets) || 1;
    const updated = [...newRoutineExercises];
    updated[index].defaultSets = setsVal;
    setNewRoutineExercises(updated);
  };

  const handleCreateOrUpdateRoutine = () => {
    if (!newRoutineName.trim()) return Alert.alert('Invalid Input', 'Provide a name for your routine.');

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
    setExSetsInput('3');
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
      if (window.confirm('Are you sure you want to delete this blueprint?')) performDelete();
    } else {
      Alert.alert('Delete Routine', 'Are you sure? This unlinks the routine from your schedule metrics.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete }
      ]);
    }
  };

  const handleAddExerciseToCreator = () => {
    const exerciseName = exInput.trim();
    if (!exerciseName) return;
    
    const setsCount = parseInt(exSetsInput) || 3; 
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
    setExSetsInput('3'); 
    setShowSuggestions(false);
  };

  // --- SPONTANEOUS SESSION HANDLERS ---
  const handleAddSpontaneousExercise = () => {
    const exName = spontaneousExInput.trim();
    if (!exName) return;

    const setsCount = parseInt(spontaneousSetsInput) || 3;
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

    setSpontaneousExercises([...spontaneousExercises, newEx]);
    setActiveWorkoutLogs(prev => ({
      ...prev,
      [newExId]: Array.from({ length: setsCount }, () => ({ weight: '', reps: '', done: false }))
    }));

    setSpontaneousExInput('');
    setSpontaneousSetsInput('3');
    setShowSpontaneousSuggestions(false);
    setSpontaneousModalVisible(false);
  };

  const handleSaveSpontaneousSession = () => {
    if (spontaneousExercises.length === 0) {
      return Alert.alert('Empty Session', 'Add at least one exercise before saving.');
    }

    const structuredExercises = spontaneousExercises.map(ex => {
      const setsFilled = activeWorkoutLogs[ex.id] || [];
      return {
        name: ex.name,
        sets: setsFilled.map(s => ({
          weight: parseFloat(s.weight) || 0,
          reps: parseInt(s.reps) || 0,
          done: s.done
        }))
      };
    });

    const dateStr = getLocalDateString();
    const updatedHistory = {
      ...history,
      [dateStr]: {
        routineName: 'Spontaneous Session',
        color: '#FFFFFF', // WHITE TILE FOR SPONTANEOUS SESSION
        exercises: structuredExercises,
        timestamp: Date.now()
      }
    };

    setHistory(updatedHistory);
    saveData(STORAGE_KEYS.HISTORY, updatedHistory);
    Alert.alert('Success!', 'Spontaneous workout saved to history!');
    setIsSpontaneousMode(false);
    setSpontaneousExercises([]);
    setActiveWorkoutLogs({});
    setCurrentTab('history');
  };

  // --- PR (PERSONAL RECORD) HANDLERS ---
  const handleSavePR = () => {
    if (!newPrExName.trim() || !newPrWeight.trim()) {
      return Alert.alert('Invalid Input', 'Please provide an exercise name and weight.');
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
    Alert.alert('PR Saved!', 'Personal record recorded successfully.');
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

  useEffect(() => {
    if (currentActiveRoutine && !isSpontaneousMode) {
      const initialLogs = {};
      currentActiveRoutine.exercises.forEach(ex => {
        initialLogs[ex.id] = Array.from({ length: ex.defaultSets }, () => ({ weight: '', reps: '', done: false }));
      });
      setActiveWorkoutLogs(initialLogs);
    }
    setIsGymDayChecked(false);
  }, [currentActiveRoutine, isSpontaneousMode]);

  const handleUpdateLogCell = (exId, setIndex, field, value) => {
    const updated = { ...activeWorkoutLogs };
    if (!updated[exId]) updated[exId] = [];
    if (!updated[exId][setIndex]) updated[exId][setIndex] = { weight: '', reps: '', done: false };
    updated[exId][setIndex][field] = value;
    setActiveWorkoutLogs(updated);
  };

  const handleToggleSetComplete = (exId, setIndex) => {
    const updated = { ...activeWorkoutLogs };
    if (!updated[exId]) updated[exId] = [];
    if (!updated[exId][setIndex]) updated[exId][setIndex] = { weight: '', reps: '', done: false };
    updated[exId][setIndex].done = !updated[exId][setIndex].done;
    setActiveWorkoutLogs(updated);
  };

  const handleTriggerTimer = () => {
    setTimerSeconds(180); 
    setTimerActive(true);
  };

  const formatTimerString = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSaveWorkoutSession = () => {
    if (!currentActiveRoutine) return;
    
    const structuredExercises = currentActiveRoutine.exercises.map(ex => {
      const setsFilled = activeWorkoutLogs[ex.id] || [];
      return {
        name: ex.name,
        sets: setsFilled.map(s => ({
          weight: parseFloat(s.weight) || 0,
          reps: parseInt(s.reps) || 0,
          done: s.done
        }))
      };
    });

    const dateStr = getLocalDateString();
    const updatedHistory = {
      ...history,
      [dateStr]: {
        routineName: currentActiveRoutine.name,
        color: currentActiveRoutine.color,
        exercises: structuredExercises,
        timestamp: Date.now()
      }
    };

    setHistory(updatedHistory);
    saveData(STORAGE_KEYS.HISTORY, updatedHistory);
    Alert.alert('Success!', 'Workout metrics appended safely to history logs.');
    setIsGymDayChecked(false);
    setImpromptuRoutine(null);
    setTimerSeconds(0);
    setTimerActive(false);
    setCurrentTab('history');
  };

  // --- ADDICTIONS ENGINE HANDLERS ---
  const handleCreateAddiction = () => {
    if (!newAddictionName.trim()) return Alert.alert('Invalid Input', 'Please state your tracker focus name.');

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
    const todayStr = getLocalDateString();
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
      if (window.confirm('Delete this clean record tracker permanently?')) confirmWipe();
    } else {
      Alert.alert('Remove Tracker', 'This will delete this habit track record completely.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Track', style: 'destructive', onPress: confirmWipe }
      ]);
    }
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

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle="light-content" />
        <Text style={{ color: THEME.text, fontSize: 18, fontWeight: '600' }}>Initializing KatTracker...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER BAR */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="flash" size={26} color={THEME.accent} style={{ marginRight: 6 }} />
          <Text style={styles.headerTitle}>KatTracker</Text>
        </View>
        <Text style={styles.headerSubtitle}>{getLocalDateString()}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        {/* --- VIEW 1: TODAY WORKOUT ENGINE --- */}
        {currentTab === 'today' && (
          <View>
            <Text style={styles.viewTitle}>Today's Workout</Text>
            
            {isTodayCompleted ? (
              <View style={styles.completedBannerCard}>
                <Ionicons name="checkmark-circle" size={44} color={THEME.success} style={{ marginBottom: 10 }} />
                <Text style={styles.completedBannerTitle}>Workout Saved & Locked! 🎉</Text>
                <Text style={styles.completedBannerMuted}>Today's tracking metrics are loaded securely into history logs.</Text>
                <TouchableOpacity style={[styles.primaryButton, { marginTop: 16, backgroundColor: THEME.surfaceLight }]} onPress={() => setCurrentTab('history')}>
                  <Text style={[styles.primaryButtonText, { color: THEME.text, fontSize: 13 }]}>Review Performance Log</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {!isSpontaneousMode ? (
                  <>
                    {/* STANDARD / SCHEDULED WORKOUT CARD */}
                    {currentActiveRoutine ? (
                      <View style={[styles.card, { borderLeftWidth: 5, borderLeftColor: currentActiveRoutine.color }]}>
                        <View style={styles.rowBetween}>
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.cardTitle}>{currentActiveRoutine.name}</Text>
                            <Text style={styles.cardMutedText}>
                              {impromptuRoutine ? 'Loaded on-the-fly session' : `Scheduled for Workout this ${getTodayDayName()}`}
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
                            <Text style={{ color: '#FF4444', fontSize: 12, fontWeight: '600' }}>Cancel Custom Choice</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : (
                      <View style={styles.card}>
                        <Text style={styles.cardTitle}>Unscheduled / Flexible Day 🔓</Text>
                        <Text style={styles.cardMutedText}>No routine is locked into today's matrix. Select a blueprint configuration on-the-fly below:</Text>
                        
                        <View style={{ marginTop: 12 }}>
                          {routines.map(r => (
                            <TouchableOpacity 
                              key={r.id} 
                              style={[styles.flexibleRoutineItem, { borderLeftColor: r.color }]}
                              onPress={() => setImpromptuRoutine(r)}
                            >
                              <Text style={{ color: THEME.text, fontWeight: '600' }}>Launch {r.name}</Text>
                              <Ionicons name="play-circle" size={20} color={r.color} />
                            </TouchableOpacity>
                          ))}
                          <TouchableOpacity style={[styles.primaryButton, { marginTop: 10, backgroundColor: THEME.surfaceLight }]} onPress={() => setCurrentTab('routines')}>
                            <Text style={[styles.primaryButtonText, { color: THEME.text }]}>+ Manage Blueprint Blueprints</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* TOGGLE WORKOUT LOGGING BLOCKS */}
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
                            {timerSeconds > 0 && (
                              <View style={styles.timerBanner}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <Ionicons name="stopwatch" size={18} color={THEME.accent} style={{ marginRight: 6 }} />
                                  <Text style={styles.timerBannerText}>
                                    Satzpause läuft: <Text style={{ color: THEME.accent }}>{formatTimerString(timerSeconds)}</Text>
                                  </Text>
                                </View>
                                <TouchableOpacity style={styles.timerCancelBtn} onPress={() => { setTimerSeconds(0); setTimerActive(false); }}>
                                  <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 12 }}>Skip</Text>
                                </TouchableOpacity>
                              </View>
                            )}

                            {currentActiveRoutine.exercises.map((ex) => (
                              <View key={ex.id} style={styles.exerciseLogBlock}>
                                <Text style={styles.exerciseLogName}>{ex.name}</Text>
                                
                                <View style={[styles.logMetricsRowHeader, { marginBottom: 4 }]}>
                                  <Text style={[styles.columnLabel, { width: 35, textAlign: 'left' }]}>Set</Text>
                                  <Text style={[styles.columnLabel, { flex: 1, marginRight: 8 }]}>KG Weight</Text>
                                  <Text style={[styles.columnLabel, { flex: 1, marginRight: 8 }]}>Reps Done</Text>
                                  <Text style={[styles.columnLabel, { width: 35 }]}>Timer</Text>
                                </View>

                                {Array.from({ length: ex.defaultSets }).map((_, setIndex) => {
                                  const isSetDone = activeWorkoutLogs[ex.id]?.[setIndex]?.done || false;
                                  return (
                                    <View key={setIndex} style={[styles.logMetricsRowHeader, { marginBottom: 8 }, isSetDone && styles.rowCompletedHighlight]}>
                                      <TouchableOpacity 
                                        style={[styles.setCheckBtn, isSetDone && styles.setCheckBtnActive]}
                                        onPress={() => handleToggleSetComplete(ex.id, setIndex)}
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
                                          value={activeWorkoutLogs[ex.id]?.[setIndex]?.weight || ''}
                                          onChangeText={(val) => handleUpdateLogCell(ex.id, setIndex, 'weight', val)}
                                        />
                                      </View>
                                      
                                      <View style={{ flex: 1, marginRight: 8 }}>
                                        <TextInput
                                          style={[styles.logInputCompact, isSetDone && styles.logInputDisabled]}
                                          placeholder="0"
                                          placeholderTextColor="#555"
                                          keyboardType="numeric"
                                          editable={!isSetDone}
                                          value={activeWorkoutLogs[ex.id]?.[setIndex]?.reps || ''}
                                          onChangeText={(val) => handleUpdateLogCell(ex.id, setIndex, 'reps', val)}
                                        />
                                      </View>

                                      <TouchableOpacity 
                                        style={[styles.inlineTimerBtn, timerActive && { borderColor: THEME.accentMuted }]} 
                                        onPress={handleTriggerTimer}
                                      >
                                        <Ionicons name="stopwatch-outline" size={16} color={THEME.accent} />
                                      </TouchableOpacity>
                                    </View>
                                  );
                                })}
                              </View>
                            ))}

                            <TouchableOpacity style={styles.primaryButton} onPress={handleSaveWorkoutSession}>
                              <Text style={styles.primaryButtonText}>Commit & Save Workout Metrics</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}

                    {/* FEATURE 3: SPONTANEOUS / UNPLANNED SESSION BUTTON */}
                    <TouchableOpacity 
                      style={styles.spontaneousLaunchBtn} 
                      onPress={() => {
                        setIsSpontaneousMode(true);
                        setSpontaneousExercises([]);
                        setActiveWorkoutLogs({});
                      }}
                    >
                      <Ionicons name="flash-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.spontaneousLaunchBtnText}>⚡ Start Spontaneous Session</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  /* SPONTANEOUS SESSION LIVE LOGGING INTERFACE */
                  <View style={[styles.card, { borderColor: '#FFFFFF', borderWidth: 1.5 }]}>
                    <View style={styles.rowBetween}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="flame" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={[styles.cardTitle, { color: '#FFFFFF' }]}>Spontaneous Session</Text>
                      </View>
                      <TouchableOpacity onPress={() => setIsSpontaneousMode(false)}>
                        <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 13 }}>Exit</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <Text style={[styles.cardMutedText, { marginBottom: 16 }]}>
                      Unplanned session active. Add exercises freely below and log your reps/weights!
                    </Text>

                    {/* ADD EXERCISE BUTTON */}
                    <TouchableOpacity 
                      style={styles.addExSpontaneousBtn} 
                      onPress={() => setSpontaneousModalVisible(true)}
                    >
                      <Ionicons name="add-circle-outline" size={20} color={THEME.text} style={{ marginRight: 6 }} />
                      <Text style={{ color: THEME.text, fontWeight: '700', fontSize: 14 }}>+ Add Exercise</Text>
                    </TouchableOpacity>

                    {/* DYNAMIC SPONTANEOUS EXERCISE LIST */}
                    {spontaneousExercises.map((ex) => (
                      <View key={ex.id} style={[styles.exerciseLogBlock, { marginTop: 14 }]}>
                        <View style={styles.rowBetween}>
                          <Text style={styles.exerciseLogName}>{ex.name}</Text>
                          <TouchableOpacity onPress={() => setSpontaneousExercises(spontaneousExercises.filter(e => e.id !== ex.id))}>
                            <Ionicons name="close-circle-sharp" size={18} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                        
                        <View style={[styles.logMetricsRowHeader, { marginBottom: 4, marginTop: 6 }]}>
                          <Text style={[styles.columnLabel, { width: 35, textAlign: 'left' }]}>Set</Text>
                          <Text style={[styles.columnLabel, { flex: 1, marginRight: 8 }]}>KG Weight</Text>
                          <Text style={[styles.columnLabel, { flex: 1, marginRight: 8 }]}>Reps Done</Text>
                          <Text style={[styles.columnLabel, { width: 35 }]}>Timer</Text>
                        </View>

                        {Array.from({ length: ex.defaultSets }).map((_, setIndex) => {
                          const isSetDone = activeWorkoutLogs[ex.id]?.[setIndex]?.done || false;
                          return (
                            <View key={setIndex} style={[styles.logMetricsRowHeader, { marginBottom: 8 }, isSetDone && styles.rowCompletedHighlight]}>
                              <TouchableOpacity 
                                style={[styles.setCheckBtn, isSetDone && styles.setCheckBtnActive]}
                                onPress={() => handleToggleSetComplete(ex.id, setIndex)}
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
                                  value={activeWorkoutLogs[ex.id]?.[setIndex]?.weight || ''}
                                  onChangeText={(val) => handleUpdateLogCell(ex.id, setIndex, 'weight', val)}
                                />
                              </View>
                              
                              <View style={{ flex: 1, marginRight: 8 }}>
                                <TextInput
                                  style={[styles.logInputCompact, isSetDone && styles.logInputDisabled]}
                                  placeholder="0"
                                  placeholderTextColor="#555"
                                  keyboardType="numeric"
                                  editable={!isSetDone}
                                  value={activeWorkoutLogs[ex.id]?.[setIndex]?.reps || ''}
                                  onChangeText={(val) => handleUpdateLogCell(ex.id, setIndex, 'reps', val)}
                                />
                              </View>

                              <TouchableOpacity 
                                style={[styles.inlineTimerBtn, timerActive && { borderColor: THEME.accentMuted }]} 
                                onPress={handleTriggerTimer}
                              >
                                <Ionicons name="stopwatch-outline" size={16} color={THEME.accent} />
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    ))}

                    {spontaneousExercises.length > 0 && (
                      <TouchableOpacity 
                        style={[styles.primaryButton, { marginTop: 16, backgroundColor: '#FFFFFF' }]} 
                        onPress={handleSaveSpontaneousSession}
                      >
                        <Text style={[styles.primaryButtonText, { color: '#121212' }]}>Save Spontaneous Workout</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* --- VIEW 2: ROUTINE BLUEPRINTS LIST --- */}
        {currentTab === 'routines' && (
          <View>
            <View style={styles.rowBetween}>
              <Text style={styles.viewTitle}>Workout Blueprints</Text>
              <TouchableOpacity style={styles.addButtonSmall} onPress={() => setRoutineModalVisible(true)}>
                <Ionicons name="add" size={20} color={THEME.text} />
                <Text style={{ color: THEME.text, fontWeight: '600', marginLeft: 2 }}>Create</Text>
              </TouchableOpacity>
            </View>

            {routines.length === 0 ? (
              <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
                <Ionicons name="layers-outline" size={48} color={THEME.textMuted} />
                <Text style={[styles.cardTitle, { marginTop: 12 }]}>No Blueprints Found</Text>
              </View>
            ) : (
              routines.map(item => (
                <View key={item.id} style={[styles.card, { borderLeftWidth: 5, borderLeftColor: item.color }]}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TouchableOpacity onPress={() => handleStartEditRoutine(item)} style={{ marginRight: 14, padding: 4 }}>
                        <Ionicons name="create-outline" size={22} color={THEME.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteRoutine(item.id)} style={{ padding: 4 }}>
                        <Ionicons name="trash-outline" size={20} color={THEME.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
                    {item.exercises.length === 0 ? (
                      <View style={styles.tagBlockRest}>
                        <Text style={{ color: THEME.textMuted, fontSize: 12 }}>Pure Rest / Recovery Target Block</Text>
                      </View>
                    ) : (
                      item.exercises.map((e, idx) => (
                        <View key={e.id || idx} style={styles.tagBlock}>
                          <Text style={styles.tagBlockText}>{idx + 1}. {e.name} ({e.defaultSets}S)</Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* --- VIEW 3: WEEKLY PLANNER MATRIX --- */}
        {currentTab === 'schedule' && (
          <View>
            <Text style={styles.viewTitle}>Weekly Planner Calendar</Text>
            {DAYS_OF_WEEK.map(day => {
              const assignedId = schedule[day];
              const routine = routines.find(r => r.id === assignedId);
              return (
                <TouchableOpacity 
                  key={day} 
                  style={styles.scheduleRow}
                  onPress={() => {
                    setSelectedScheduleDay(day);
                    setSchedulerModalVisible(true);
                  }}
                >
                  <Text style={styles.scheduleDayName}>{day}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {routine ? (
                      <View style={[styles.badge, { backgroundColor: routine.color }]}>
                        <Text style={{ color: '#000', fontWeight: '700', fontSize: 12 }}>{routine.name}</Text>
                      </View>
                    ) : (
                      <View style={[styles.badge, { backgroundColor: THEME.surfaceLight }]}>
                        <Text style={{ color: THEME.textMuted, fontWeight: '500', fontSize: 12 }}>Flexible Slot</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={16} color={THEME.textMuted} style={{ marginLeft: 8 }} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* --- VIEW 4: PERFORMANCE GRAPH HISTORY --- */}
        {currentTab === 'history' && (
          <View>
            <Text style={styles.viewTitle}>Performance Analytics</Text>

            {/* FEATURE 1: PR DASHBOARD BUTTON ABOVE GRID */}
            <TouchableOpacity 
              style={styles.prDashboardBtn}
              onPress={() => setPrModalVisible(true)}
            >
              <Ionicons name="trophy" size={22} color="#F59E0B" style={{ marginRight: 8 }} />
              <Text style={styles.prDashboardBtnText}>PR Dashboard</Text>
              <View style={styles.prBadgeCount}>
                <Text style={{ color: '#000', fontWeight: '800', fontSize: 11 }}>{prs.length}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.card}>
              <Text style={[styles.cardTitle, { fontSize: 14, marginBottom: 12 }]}>Consistency Heatmap Graph</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
                <View style={{ flexDirection: 'row' }}>
                  {generateHeatmapDates().map((weekArray, wIdx) => (
                    <View key={wIdx} style={{ flexDirection: 'column' }}>
                      {weekArray.map((dateStr) => {
                        const metrics = history[dateStr];
                        const squareColor = metrics ? metrics.color : THEME.surfaceLight;
                        const isCurrentDay = dateStr === getLocalDateString();
                        return (
                          <TouchableOpacity
                            key={dateStr}
                            style={[
                              styles.heatmapSquare, 
                              { backgroundColor: squareColor },
                              isCurrentDay && { borderWidth: 1.5, borderColor: THEME.accent }
                            ]}
                            onPress={() => {
                              setSelectedHistoryDate(dateStr);
                              setHistoryModalVisible(true);
                            }}
                          />
                        );
                      })}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            <Text style={[styles.viewTitle, { fontSize: 16, marginTop: 12 }]}>Chronological Records</Text>
            {Object.keys(history).length === 0 ? (
              <Text style={[styles.cardMutedText, { marginTop: 8 }]}>No completed workout tracks saved inside system memory.</Text>
            ) : (
              Object.keys(history).sort((a,b) => b.localeCompare(a)).map(dateStr => (
                <TouchableOpacity 
                  key={dateStr} 
                  style={[styles.card, { borderLeftWidth: 4, borderLeftColor: history[dateStr].color || THEME.accent }]}
                  onPress={() => {
                    setSelectedHistoryDate(dateStr);
                    setHistoryModalVisible(true);
                  }}
                >
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardTitle}>{history[dateStr].routineName}</Text>
                    <Text style={styles.cardMutedText}>{dateStr}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* --- VIEW 5: CLEAN HABIT TRACKER TAB --- */}
        {currentTab === 'clean' && (
          <View>
            <View style={styles.rowBetween}>
              <Text style={styles.viewTitle}>Clean Trackers</Text>
              <TouchableOpacity style={styles.addButtonSmall} onPress={() => setAddictionModalVisible(true)}>
                <Ionicons name="add" size={20} color={THEME.text} />
                <Text style={{ color: THEME.text, fontWeight: '600', marginLeft: 2 }}>Add New</Text>
              </TouchableOpacity>
            </View>

            {addictions.length === 0 ? (
              <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
                <Ionicons name="shield-checkmark-outline" size={48} color={THEME.textMuted} />
                <Text style={[styles.cardTitle, { marginTop: 12 }]}>No Clean Trackers Active</Text>
              </View>
            ) : (
              addictions.map((item) => {
                const todayStr = getLocalDateString();
                const isCleanToday = !!item.history[todayStr];
                const cleanDaysCount = Object.keys(item.history).length;
                return (
                  <View key={item.id} style={[styles.card, { borderLeftWidth: 5, borderLeftColor: item.color }]}>
                    <View style={styles.rowBetween}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <Text style={[styles.cardMutedText, { color: item.color, fontWeight: '700' }]}>
                          Total Logged Safe Days: {cleanDaysCount}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteAddiction(item.id)} style={{ padding: 6 }}>
                        <Ionicons name="trash-outline" size={18} color={THEME.textMuted} />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                      style={[styles.cleanCheckInBtn, { borderColor: item.color }, isCleanToday && { backgroundColor: item.color + '22' }]}
                      onPress={() => handleToggleCleanDay(item.id)}
                    >
                      <Ionicons name={isCleanToday ? "checkmark-circle" : "ellipse-outline"} size={20} color={isCleanToday ? item.color : THEME.textMuted} style={{ marginRight: 8 }} />
                      <Text style={{ color: isCleanToday ? THEME.text : THEME.textMuted, fontWeight: '700', fontSize: 13 }}>
                        {isCleanToday ? "Safe & Clean Today!" : "Mark Clean For Today"}
                      </Text>
                    </TouchableOpacity>

                    <Text style={[styles.cardMutedText, { fontSize: 11, marginTop: 14, marginBottom: 6, fontWeight: '600' }]}>
                      Sobriety Consistency Matrix Grid:
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row' }}>
                        {generateHeatmapDates().map((weekArray, wIdx) => (
                          <View key={wIdx} style={{ flexDirection: 'column' }}>
                            {weekArray.map((dateStr) => {
                              const markedClean = !!item.history[dateStr];
                              const cellBg = markedClean ? item.color : THEME.surfaceLight;
                              return (
                                <View key={dateStr} style={[styles.heatmapSquare, { backgroundColor: cellBg, width: 12, height: 12, margin: 1.5 }, dateStr === todayStr && { borderWidth: 1, borderColor: THEME.text }]} />
                              );
                            })}
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* --- MODALS --- */}

      {/* FEATURE 1: PR DASHBOARD MODAL */}
      <Modal animationType="slide" transparent visible={prModalVisible} onRequestClose={() => setPrModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="trophy" size={24} color="#F59E0B" style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Personal Record (PR) Menu</Text>
              </View>
              <TouchableOpacity onPress={() => setPrModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={THEME.text} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              {/* ADD NEW PR FORM */}
              <View style={[styles.card, { backgroundColor: THEME.surfaceLight, marginTop: 4 }]}>
                <Text style={[styles.cardTitle, { fontSize: 14, marginBottom: 8 }]}>+ Add New Personal Record</Text>
                
                <View style={{ zIndex: 9999 }}>
                  <TextInput 
                    style={styles.textInput} 
                    placeholder="Exercise Name..." 
                    placeholderTextColor="#666" 
                    value={newPrExName} 
                    onChangeText={(txt) => { setNewPrExName(txt); setShowPrSuggestions(true); }} 
                    onFocus={() => setShowPrSuggestions(true)} 
                  />
                  {showPrSuggestions && filteredPrSuggestions.length > 0 && (
                    <View style={styles.suggestionsBox}>
                      {filteredPrSuggestions.slice(0, 5).map((suggestion) => (
                        <TouchableOpacity key={suggestion} style={styles.suggestionItem} onPress={() => { setNewPrExName(suggestion); setShowPrSuggestions(false); }}>
                          <Text style={{ color: THEME.text }}>{suggestion}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <TextInput 
                  style={[styles.textInput, { marginTop: 10 }]} 
                  placeholder="Record Weight (KG, e.g. 100.5)..." 
                  placeholderTextColor="#666" 
                  keyboardType="decimal-pad" 
                  value={newPrWeight} 
                  onChangeText={setNewPrWeight} 
                />

                <TouchableOpacity style={[styles.primaryButton, { marginTop: 12, backgroundColor: '#F59E0B' }]} onPress={handleSavePR}>
                  <Text style={[styles.primaryButtonText, { color: '#000' }]}>Save PR Record</Text>
                </TouchableOpacity>
              </View>

              {/* LIST OF SAVED PRs */}
              <Text style={[styles.inputLabel, { fontSize: 14, marginTop: 12 }]}>Saved Personal Records ({prs.length})</Text>
              {prs.length === 0 ? (
                <Text style={[styles.cardMutedText, { textAlign: 'center', marginVertical: 14 }]}>No PRs added yet. Log your heavy lifts above!</Text>
              ) : (
                prs.map(pr => (
                  <View key={pr.id} style={styles.prCardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: THEME.text, fontWeight: '700', fontSize: 15 }}>{pr.exercise}</Text>
                      <Text style={{ color: THEME.textMuted, fontSize: 12 }}>Achieved: {pr.date}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={styles.prWeightBadge}>
                        <Text style={{ color: '#F59E0B', fontWeight: '900', fontSize: 15 }}>{pr.weight} KG</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeletePR(pr.id)} style={{ marginLeft: 10, padding: 4 }}>
                        <Ionicons name="trash-outline" size={18} color={THEME.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* FEATURE 3: SPONTANEOUS EXERCISE PICKER MODAL */}
      <Modal animationType="fade" transparent visible={spontaneousModalVisible} onRequestClose={() => setSpontaneousModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Exercise to Spontaneous Session</Text>
              <TouchableOpacity onPress={() => setSpontaneousModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={THEME.text} />
              </TouchableOpacity>
            </View>

            <View style={{ zIndex: 9999 }}>
              <TextInput 
                style={styles.textInput} 
                placeholder="Exercise Name..." 
                placeholderTextColor="#666" 
                value={spontaneousExInput} 
                onChangeText={(txt) => { setSpontaneousExInput(txt); setShowSpontaneousSuggestions(true); }} 
                onFocus={() => setShowSpontaneousSuggestions(true)} 
              />
              {showSpontaneousSuggestions && filteredSpontaneousSuggestions.length > 0 && (
                <View style={styles.suggestionsBox}>
                  {filteredSpontaneousSuggestions.slice(0, 5).map((sug) => (
                    <TouchableOpacity key={sug} style={styles.suggestionItem} onPress={() => { setSpontaneousExInput(sug); setShowSpontaneousSuggestions(false); }}>
                      <Text style={{ color: THEME.text }}>{sug}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <Text style={styles.inputLabel}>Sets Target</Text>
            <TextInput 
              style={styles.textInput} 
              placeholder="3" 
              placeholderTextColor="#666" 
              keyboardType="numeric" 
              value={spontaneousSetsInput} 
              onChangeText={setSpontaneousSetsInput} 
            />

            <TouchableOpacity style={[styles.primaryButton, { marginTop: 16 }]} onPress={handleAddSpontaneousExercise}>
              <Text style={styles.primaryButtonText}>Add to Spontaneous Session</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* FEATURE 2: ROUTINE BLUEPRINT CREATOR / EDITOR MODAL WITH REORDERING & SET EDITING */}
      <Modal animationType="slide" transparent visible={routineModalVisible} onRequestClose={handleCloseRoutineModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingRoutineId ? 'Modify Plan Blueprint' : 'New Workout Blueprint'}</Text>
              <TouchableOpacity onPress={handleCloseRoutineModal} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={THEME.text} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>Routine Identification Name</Text>
              <TextInput style={styles.textInput} placeholder="e.g. Legs" placeholderTextColor="#666" value={newRoutineName} onChangeText={setNewRoutineName} />
              <Text style={styles.inputLabel}>Theme Display Color Map Tag</Text>
              <View style={[styles.row, { justifyContent: 'space-around', marginVertical: 10 }]}>
                {Object.keys(ROUTINE_COLORS).map((colorKey) => (
                  <TouchableOpacity key={colorKey} style={[styles.colorSelectorCircle, { backgroundColor: ROUTINE_COLORS[colorKey] }, newRoutineColor === colorKey && styles.colorSelectorCircleSelected]} onPress={() => setNewRoutineColor(colorKey)} />
                ))}
              </View>

              <Text style={styles.inputLabel}>Append Component Exercises</Text>
              <View style={{ zIndex: 999 }}>
                <View style={styles.row}>
                  <View style={{ flex: 2, marginRight: 8 }}>
                    <TextInput style={styles.textInput} placeholder="Search exercise..." placeholderTextColor="#666" value={exInput} onChangeText={(txt) => { setExInput(txt); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} />
                  </View>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <TextInput style={styles.textInput} placeholder="Sets" placeholderTextColor="#666" keyboardType="numeric" value={exSetsInput} onChangeText={setExSetsInput} />
                  </View>
                  <TouchableOpacity style={styles.inlineAddBtn} onPress={handleAddExerciseToCreator}>
                    <Ionicons name="add" size={24} color={THEME.text} />
                  </TouchableOpacity>
                </View>
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <View style={styles.suggestionsBox}>
                    {filteredSuggestions.slice(0, 5).map((suggestion) => (
                      <TouchableOpacity key={suggestion} style={styles.suggestionItem} onPress={() => { setExInput(suggestion); setShowSuggestions(false); }}>
                        <Text style={{ color: THEME.text }}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* EDITABLE & REORDERABLE EXERCISE LIST */}
              <View style={{ marginTop: 14 }}>
                {newRoutineExercises.map((ex, index) => (
                  <View key={ex.id || index} style={styles.reorderableExRow}>
                    {/* ORDER CONTROLS */}
                    <View style={{ flexDirection: 'column', marginRight: 8 }}>
                      <TouchableOpacity 
                        onPress={() => handleMoveExerciseInCreator(index, -1)} 
                        disabled={index === 0}
                        style={{ opacity: index === 0 ? 0.3 : 1, padding: 2 }}
                      >
                        <Ionicons name="chevron-up" size={18} color={THEME.text} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleMoveExerciseInCreator(index, 1)} 
                        disabled={index === newRoutineExercises.length - 1}
                        style={{ opacity: index === newRoutineExercises.length - 1 ? 0.3 : 1, padding: 2 }}
                      >
                        <Ionicons name="chevron-down" size={18} color={THEME.text} />
                      </TouchableOpacity>
                    </View>

                    {/* EXERCISE NAME */}
                    <Text style={{ color: THEME.text, fontWeight: '600', flex: 1, fontSize: 13 }}>{index + 1}. {ex.name}</Text>

                    {/* INLINE SET COUNT EDIT FIELD */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
                      <Text style={{ color: THEME.textMuted, fontSize: 12, marginRight: 4 }}>Sets:</Text>
                      <TextInput 
                        style={styles.setsInputInline}
                        keyboardType="numeric"
                        value={String(ex.defaultSets)}
                        onChangeText={(txt) => handleUpdateExerciseSetsInCreator(index, txt)}
                      />
                    </View>

                    {/* DELETE EXERCISE */}
                    <TouchableOpacity onPress={() => setNewRoutineExercises(newRoutineExercises.filter((_, i) => i !== index))}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={[styles.primaryButton, { marginTop: 24 }]} onPress={handleCreateOrUpdateRoutine}>
                <Text style={styles.primaryButtonText}>Compile Blueprint Routine</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* SCHEDULER MODAL */}
      <Modal animationType="fade" transparent visible={schedulerModalVisible} onRequestClose={() => setSchedulerModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Link Assignment to {selectedScheduleDay}</Text>
              <TouchableOpacity onPress={() => setSchedulerModalVisible(false)} style={{ padding: 4 }}><Ionicons name="close" size={24} color={THEME.text} /></TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity style={[styles.scheduleRow, { backgroundColor: THEME.surfaceLight }]} onPress={() => handleAssignSchedule(null)}>
                <Text style={{ color: THEME.textMuted, fontWeight: '600' }}>Clear Track Mappings</Text>
              </TouchableOpacity>
              {routines.map(r => (
                <TouchableOpacity key={r.id} style={[styles.scheduleRow, { borderLeftWidth: 4, borderLeftColor: r.color }]} onPress={() => handleAssignSchedule(r.id)}>
                  <Text style={{ color: THEME.text, fontWeight: '600' }}>{r.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* HISTORY INSPECTOR MODAL */}
      <Modal animationType="slide" transparent visible={historyModalVisible} onRequestClose={() => setHistoryModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Historical Performance Log</Text>
                <Text style={{ color: THEME.textMuted, fontSize: 13 }}>{selectedHistoryDate}</Text>
              </View>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)} style={{ padding: 4 }}><Ionicons name="close" size={24} color={THEME.text} /></TouchableOpacity>
            </View>
            <ScrollView>
              {selectedHistoryDate && history[selectedHistoryDate] ? (
                <View>
                  <View style={[styles.badge, { backgroundColor: history[selectedHistoryDate].color || THEME.accent, alignSelf: 'flex-start', marginBottom: 16 }]}>
                    <Text style={{ color: '#121212', fontWeight: '800' }}>{history[selectedHistoryDate].routineName}</Text>
                  </View>
                  {history[selectedHistoryDate].exercises.map((ex, eIdx) => (
                    <View key={eIdx} style={{ marginBottom: 16, borderBottomWidth: 1, borderColor: THEME.border, paddingBottom: 12 }}>
                      <Text style={{ color: THEME.text, fontSize: 16, fontWeight: '600', marginBottom: 6 }}>{ex.name}</Text>
                      {ex.sets.map((set, sIdx) => (
                        <Text key={sIdx} style={{ color: THEME.textMuted, fontSize: 14 }}>Set {sIdx + 1}: {set.weight} kg × {set.reps} reps</Text>
                      ))}
                    </View>
                  ))}
                </View>
              ) : <Text style={{ color: THEME.textMuted }}>No record saved for this date.</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ADDICTIONS GENERATOR MODAL */}
      <Modal animationType="slide" transparent visible={addictionModalVisible} onRequestClose={() => setAddictionModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Launch Sobriety Clean Tracker</Text>
              <TouchableOpacity onPress={() => setAddictionModalVisible(false)} style={{ padding: 4 }}><Ionicons name="close" size={24} color={THEME.text} /></TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.inputLabel}>Tracker Focus Goal Name</Text>
              <TextInput style={styles.textInput} placeholder="e.g. Alcohol" placeholderTextColor="#666" value={newAddictionName} onChangeText={setNewAddictionName} />
              <Text style={styles.inputLabel}>Grid Matrix Color Tag Identity</Text>
              <View style={[styles.row, { justifyContent: 'space-around', marginVertical: 14 }]}>
                {Object.keys(ROUTINE_COLORS).map((colorKey) => (
                  <TouchableOpacity key={colorKey} style={[styles.colorSelectorCircle, { backgroundColor: ROUTINE_COLORS[colorKey] }, newAddictionColor === colorKey && styles.colorSelectorCircleSelected]} onPress={() => setNewAddictionColor(colorKey)} />
                ))}
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={handleCreateAddiction}><Text style={styles.primaryButtonText}>Initialize Clean Track Grid</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('today')}>
          <Ionicons name="barbell-outline" size={20} color={currentTab === 'today' ? THEME.accent : THEME.textMuted} />
          <Text style={[styles.tabLabel, currentTab === 'today' && styles.tabLabelActive]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('routines')}>
          <Ionicons name="list-outline" size={20} color={currentTab === 'routines' ? THEME.accent : THEME.textMuted} />
          <Text style={[styles.tabLabel, currentTab === 'routines' && styles.tabLabelActive]}>Routines</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('schedule')}>
          <Ionicons name="calendar-outline" size={20} color={currentTab === 'schedule' ? THEME.accent : THEME.textMuted} />
          <Text style={[styles.tabLabel, currentTab === 'schedule' && styles.tabLabelActive]}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('history')}>
          <Ionicons name="analytics-outline" size={20} color={currentTab === 'history' ? THEME.accent : THEME.textMuted} />
          <Text style={[styles.tabLabel, currentTab === 'history' && styles.tabLabelActive]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('clean')}>
          <Ionicons name="shield-checkmark-outline" size={20} color={currentTab === 'clean' ? THEME.accent : THEME.textMuted} />
          <Text style={[styles.tabLabel, currentTab === 'clean' && styles.tabLabelActive]}>Clean</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- STYLE SHEET LAYOUT ENGINE ---
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.surface,
  },
  headerTitle: {
    color: THEME.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: THEME.textMuted,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  viewTitle: {
    color: THEME.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  card: {
    backgroundColor: THEME.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  cardTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: '700',
  },
  cardMutedText: {
    color: THEME.textMuted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  flexibleRoutineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.surfaceLight,
    padding: 14,
    borderRadius: 10,
    marginTop: 8,
    borderLeftWidth: 4,
  },
  clearImpromptuBtn: {
    marginTop: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  spontaneousLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.surfaceLight,
    borderWidth: 1.5,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 6,
    marginBottom: 16,
  },
  spontaneousLaunchBtnText: {
    color: THEME.text,
    fontSize: 15,
    fontWeight: '800',
  },
  addExSpontaneousBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.surfaceLight,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingVertical: 10,
  },
  completedBannerCard: {
    backgroundColor: THEME.surface,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.success,
    marginBottom: 14,
  },
  completedBannerTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  completedBannerMuted: {
    color: THEME.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  toggleCard: {
    backgroundColor: THEME.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  toggleText: {
    color: THEME.text,
    fontSize: 15,
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: THEME.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: THEME.accent,
    borderColor: THEME.accent,
  },
  exerciseLogBlock: {
    backgroundColor: THEME.surfaceLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  exerciseLogName: {
    color: THEME.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  logMetricsRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  columnLabel: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    opacity: 0.6,
  },
  setCheckBtn: {
    width: 35,
    height: 32,
    borderRadius: 6,
    backgroundColor: THEME.surface,
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
    fontWeight: '700',
  },
  rowCompletedHighlight: {
    opacity: 0.65,
  },
  logInputCompact: {
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderWidth: 1,
    borderRadius: 6,
    color: THEME.text,
    paddingVertical: 8,
    paddingHorizontal: 4,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    width: '100%',
  },
  logInputDisabled: {
    backgroundColor: THEME.successMuted,
    borderColor: THEME.success,
    color: THEME.success,
  },
  timerBanner: {
    backgroundColor: THEME.surfaceLight,
    borderColor: THEME.accent,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerBannerText: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: '700',
  },
  timerCancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 6,
  },
  inlineTimerBtn: {
    width: 35,
    height: 32,
    borderRadius: 6,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagBlock: {
    backgroundColor: THEME.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginTop: 6,
  },
  tagBlockText: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  tagBlockRest: {
    borderColor: THEME.border,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 6,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  scheduleDayName: {
    color: THEME.text,
    fontSize: 15,
    fontWeight: '600',
  },
  heatmapSquare: {
    width: 14,
    height: 14,
    borderRadius: 3,
    margin: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cleanCheckInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 14,
  },
  prDashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.surface,
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 14,
  },
  prDashboardBtnText: {
    color: THEME.text,
    fontSize: 15,
    fontWeight: '800',
  },
  prBadgeCount: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 8,
  },
  prCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.surfaceLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  prWeightBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  reorderableExRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surfaceLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  setsInputInline: {
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderWidth: 1,
    borderRadius: 6,
    color: THEME.text,
    paddingVertical: 4,
    paddingHorizontal: 8,
    width: 44,
    textAlign: 'center',
    fontWeight: '700',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: THEME.surface,
    borderTopWidth: 1,
    borderColor: THEME.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 12 : 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelActive: {
    color: THEME.accent,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: '800',
  },
  inputLabel: {
    color: THEME.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: THEME.surfaceLight,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    color: THEME.text,
    padding: 12,
    fontSize: 14,
  },
  colorSelectorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSelectorCircleSelected: {
    borderColor: THEME.text,
    transform: [{ scale: 1.15 }],
  },
  inlineAddBtn: {
    backgroundColor: THEME.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  suggestionsBox: {
    backgroundColor: THEME.surfaceLight,
    borderColor: THEME.border,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  primaryButton: {
    backgroundColor: THEME.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: THEME.text,
    fontSize: 15,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
