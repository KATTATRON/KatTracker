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

// FULL 75-EXERCISE DICTIONARY WITH CATEGORY TAGS
const EXERCISE_DICTIONARY = [
  // CHEST
  { name: 'Pull-ups (Bodyweight / Weighted)', category: 'Pull' },
  { name: 'Chin-ups (Bodyweight / Weighted)', category: 'Pull' },
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
  // SHOULDERS
  { name: 'Overhead Press (Barbell)', category: 'Shoulders' },
  { name: 'Seated Dumbbell Shoulder Press', category: 'Shoulders' },
  { name: 'Lateral Raises (Dumbbell)', category: 'Shoulders' },
  { name: 'Cable Lateral Raises', category: 'Shoulders' },
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
  // TRICEPS
  { name: 'Overhead Tricep Extension (Dumbbell)', category: 'Triceps' },
  { name: 'Tricep Rope Pushdowns', category: 'Triceps' },
  { name: 'Skull Crushers (EZ Bar)', category: 'Triceps' },
  { name: 'Close-Grip Bench Press', category: 'Triceps' },
  { name: 'Diamond Push-ups', category: 'Triceps' },
  { name: 'Cable V-Bar Pushdowns', category: 'Triceps' },
  { name: 'Tricep Dumbbell Kickbacks', category: 'Triceps' },
  { name: 'Bench Dips', category: 'Triceps' },
  { name: 'Machine Tricep Pressdown', category: 'Triceps' },
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
  { name: 'Bird Dog', category: 'Core' }
];

const BASE_EXERCISE_POOL = EXERCISE_DICTIONARY.map(e => e.name);
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

  // --- RECOVERY MATRIX COMPUTATION ---
  const recoveryMatrix = useMemo(() => {
    const now = Date.now();
    const categories = { Chest: 0, Back: 0, Shoulders: 0, Biceps: 0, Triceps: 0, Legs: 0, Core: 0 };
    
    Object.values(history).forEach((entry) => {
      const timestamp = entry.timestamp || 0;
      const hoursAgo = (now - timestamp) / (1000 * 60 * 60);
      
      if (hoursAgo >= 0 && hoursAgo <= 48) {
        (entry.exercises || []).forEach((ex) => {
          const match = EXERCISE_DICTIONARY.find(
            d => d.name.toLowerCase() === ex.name.toLowerCase()
          );
          if (match && categories.hasOwnProperty(match.category)) {
            categories[match.category] += ex.sets ? ex.sets.length : 0;
          }
        });
      }
    });

    return Object.entries(categories).map(([category, volume]) => {
      let status = 'Fresh';
      let color = THEME.success;
      if (volume > 12) {
        status = 'Exhausted';
        color = '#EF4444';
      } else if (volume > 5) {
        status = 'Fatigued';
        color = '#F59E0B';
      } else if (volume > 0) {
        status = 'Recovering';
        color = '#3B82F6';
      }
      return { category, volume, status, color };
    });
  }, [history]);

  // --- PROGRESSIVE OVERLOAD DIFFERENTIAL HELPER ---
  const getPreviousPerformance = (exerciseName, currentDateStr) => {
    const sortedDates = Object.keys(history)
      .filter(d => d < currentDateStr)
      .sort((a, b) => new Date(b) - new Date(a));

    for (const d of sortedDates) {
      const pastEntry = history[d];
      const foundEx = pastEntry.exercises?.find(
        e => e.name.toLowerCase() === exerciseName.toLowerCase()
      );
      if (foundEx && foundEx.sets) {
        return foundEx.sets;
      }
    }
    return null;
  };

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
  const handleStartSpontaneousSession = () => {
    setIsSpontaneousMode(true);
    setSpontaneousExercises([]);
    setActiveWorkoutLogs({});
    setCurrentTab('today');
  };

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
        color: THEME.accent,
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

  // --- PR HANDLERS ---
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            style={styles.lightningBtn} 
            onPress={handleStartSpontaneousSession}
            activeOpacity={0.7}
          >
            <Ionicons name="flash-sharp" size={20} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerSubtitle}>{getLocalDateString()}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        {/* --- VIEW 1: TODAY WORKOUT ENGINE --- */}
        {currentTab === 'today' && (
          <View>
            <Text style={styles.viewTitle}>Today's Workout</Text>
            
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>48-Hour Recovery Matrix 🧬</Text>
                <Text style={styles.cardMutedText}>Auto-calculated</Text>
              </View>
              <View style={styles.recoveryGrid}>
                {recoveryMatrix.map((item) => (
                  <View key={item.category} style={styles.recoveryBadge}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.recoveryCategory}>{item.category}</Text>
                      <View style={[styles.statusDot, { backgroundColor: item.color }]} />
                    </View>
                    <Text style={[styles.recoveryStatus, { color: item.color }]}>{item.status}</Text>
                    <Text style={styles.recoveryVolume}>{item.volume} sets / 48h</Text>
                  </View>
                ))}
              </View>
            </View>

            {isTodayCompleted ? (
              <View style={styles.completedBannerCard}>
                <Ionicons name="checkmark-circle" size={44} color={THEME.success} style={{ marginBottom: 10 }} />
                <Text style={styles.completedBannerTitle}>Workout Saved & Locked! 🎉</Text>
                <Text style={styles.completedBannerMuted}>Today's tracking metrics are loaded securely into history logs.</Text>
                <TouchableOpacity style={[styles.primaryButton, { marginTop: 16, backgroundColor: THEME.surfaceLight }]} onPress={() => setCurrentTab('history')}>
                  <Text style={[styles.primaryButtonText, { color: THEME.text, fontSize: 13 }]}>Review Performance Log</Text>
                </TouchableOpacity>
              </View>
            ) : isSpontaneousMode ? (
              <View style={[styles.card, { borderLeftWidth: 5, borderLeftColor: THEME.accent }]}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>⚡ Spontaneous Session</Text>
                    <Text style={styles.cardMutedText}>Freestyle workout session on the fly</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.primaryButton, { paddingHorizontal: 12, paddingVertical: 6 }]}
                    onPress={() => setSpontaneousModalVisible(true)}
                  >
                    <Text style={{ color: THEME.text, fontWeight: '700', fontSize: 12 }}>+ Add Exercise</Text>
                  </TouchableOpacity>
                </View>

                {spontaneousExercises.length === 0 ? (
                  <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                    <Text style={{ color: THEME.textMuted }}>No exercises added yet. Tap "+ Add Exercise" to build your session!</Text>
                  </View>
                ) : (
                  <View style={{ marginTop: 16 }}>
                    {spontaneousExercises.map((ex) => (
                      <View key={ex.id} style={styles.exerciseLogBlock}>
                        <Text style={styles.exerciseLogName}>{ex.name}</Text>
                        <View style={[styles.logMetricsRowHeader, { marginBottom: 4 }]}>
                          <Text style={[styles.columnLabel, { width: 35, textAlign: 'left' }]}>Set</Text>
                          <Text style={[styles.columnLabel, { flex: 1, marginRight: 8 }]}>KG Weight</Text>
                          <Text style={[styles.columnLabel, { flex: 1, marginRight: 8 }]}>Reps Done</Text>
                          <Text style={[styles.columnLabel, { width: 35 }]}>Done</Text>
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
                              <TouchableOpacity style={styles.timerTriggerBtn} onPress={handleTriggerTimer}>
                                <Ionicons name="stopwatch-outline" size={16} color={THEME.accent} />
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    ))}

                    <TouchableOpacity style={[styles.primaryButton, { marginTop: 16 }]} onPress={handleSaveSpontaneousSession}>
                      <Text style={styles.primaryButtonText}>Finish & Lock Spontaneous Workout</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.clearImpromptuBtn, { marginTop: 8 }]} onPress={() => setIsSpontaneousMode(false)}>
                      <Text style={{ color: '#FF4444', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>Cancel Spontaneous Session</Text>
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
                          {impromptuRoutine ? 'Loaded on-the-fly session' : `Scheduled for today, ${getTodayDayName()}`}
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

                                  <TouchableOpacity style={styles.timerTriggerBtn} onPress={handleTriggerTimer}>
                                    <Ionicons name="stopwatch-outline" size={16} color={THEME.accent} />
                                  </TouchableOpacity>
                                </View>
                              );
                            })}
                          </View>
                        ))}

                        <TouchableOpacity style={[styles.primaryButton, { marginTop: 10 }]} onPress={handleSaveWorkoutSession}>
                          <Text style={styles.primaryButtonText}>Finish & Save Session</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* --- VIEW 2: BLUEPRINTS / ROUTINES --- */}
        {currentTab === 'routines' && (
          <View>
            <View style={styles.rowBetween}>
              <Text style={styles.viewTitle}>Workout Blueprints</Text>
              <TouchableOpacity style={styles.smallAccentBtn} onPress={() => setRoutineModalVisible(true)}>
                <Ionicons name="add-sharp" size={18} color="#FFF" />
                <Text style={styles.smallAccentBtnText}>New Routine</Text>
              </TouchableOpacity>
            </View>

            {routines.map(r => (
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
            ))}
          </View>
        )}

        {/* --- VIEW 3: WEEKLY SCHEDULER --- */}
        {currentTab === 'schedule' && (
          <View>
            <Text style={styles.viewTitle}>Weekly Matrix Schedule</Text>
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
                    <Text style={{ color: THEME.text, fontSize: 12, fontWeight: '600' }}>Assign Blueprint</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* --- VIEW 4: PERFORMANCE LOG & HEATMAP HISTORY --- */}
        {currentTab === 'history' && (
          <View>
            <Text style={styles.viewTitle}>History & Metrics</Text>
            
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Activity Matrix Heatmap</Text>
              <Text style={styles.cardMutedText}>Past 15 Weeks Consistent Grid Performance</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                <View style={{ flexDirection: 'row' }}>
                  {generateHeatmapDates().map((week, wIdx) => (
                    <View key={wIdx} style={{ marginRight: 4 }}>
                      {week.map((dateStr) => {
                        const historyItem = history[dateStr];
                        const isLogged = !!historyItem;
                        const cellColor = isLogged ? (historyItem.color || THEME.success) : THEME.surfaceLight;
                        return (
                          <TouchableOpacity 
                            key={dateStr}
                            style={[
                              styles.heatmapCell, 
                              { backgroundColor: cellColor }
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

            <Text style={[styles.cardTitle, { marginTop: 16, marginBottom: 8 }]}>Log Records Timeline</Text>
            {Object.keys(history).length === 0 ? (
              <Text style={{ color: THEME.textMuted }}>No history recorded yet.</Text>
            ) : (
              Object.keys(history).sort((a,b) => new Date(b) - new Date(a)).map(dateKey => {
                const item = history[dateKey];
                return (
                  <TouchableOpacity 
                    key={dateKey} 
                    style={[styles.card, { borderLeftWidth: 4, borderLeftColor: item.color || THEME.accent }]}
                    onPress={() => {
                      setSelectedHistoryDate(dateKey);
                      setHistoryModalVisible(true);
                    }}
                  >
                    <View style={styles.rowBetween}>
                      <Text style={{ color: THEME.text, fontWeight: '700' }}>{dateKey}</Text>
                      <Text style={{ color: item.color || THEME.accent, fontWeight: '700' }}>{item.routineName}</Text>
                    </View>
                    <Text style={{ color: THEME.textMuted, fontSize: 12, marginTop: 4 }}>
                      {item.exercises ? item.exercises.length : 0} Exercises Completed
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* --- VIEW 5: PR TRACKER ENGINE --- */}
        {currentTab === 'prs' && (
          <View>
            <View style={styles.rowBetween}>
              <Text style={styles.viewTitle}>Personal Records 🏆</Text>
              <TouchableOpacity style={styles.smallAccentBtn} onPress={() => setPrModalVisible(true)}>
                <Ionicons name="add-sharp" size={18} color="#FFF" />
                <Text style={styles.smallAccentBtnText}>Add PR</Text>
              </TouchableOpacity>
            </View>

            {prs.length === 0 ? (
              <View style={styles.card}>
                <Text style={{ color: THEME.textMuted, textAlign: 'center' }}>No PRs logged yet. Hit a new max today!</Text>
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
          </View>
        )}

        {/* --- VIEW 6: HABITS & ADDICTIONS --- */}
        {currentTab === 'addictions' && (
          <View>
            <View style={styles.rowBetween}>
              <Text style={styles.viewTitle}>Habit Tracker Matrix</Text>
              <TouchableOpacity style={styles.smallAccentBtn} onPress={() => setAddictionModalVisible(true)}>
                <Ionicons name="add-sharp" size={18} color="#FFF" />
                <Text style={styles.smallAccentBtnText}>New Tracker</Text>
              </TouchableOpacity>
            </View>

            {addictions.map(tracker => {
              const isCleanToday = !!tracker.history[getLocalDateString()];
              const cleanDaysCount = Object.keys(tracker.history).length;
              return (
                <View key={tracker.id} style={[styles.card, { borderLeftWidth: 5, borderLeftColor: tracker.color }]}>
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{tracker.name}</Text>
                      <Text style={styles.cardMutedText}>Streak Volume: {cleanDaysCount} Days Completed</Text>
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
                      name={isCleanToday ? "checkmark-circle" : "ellipse-outline"} 
                      size={20} 
                      color={THEME.text} 
                      style={{ marginRight: 8 }} 
                    />
                    <Text style={{ color: THEME.text, fontWeight: '700' }}>
                      {isCleanToday ? "Completed Today!" : "Mark Completed Today"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>

      {/* --- MODAL 1: ROUTINE BLUEPRINT CREATOR / EDITOR (PIC 1 STYLING) --- */}
      <Modal visible={routineModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '85%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{editingRoutineId ? 'Modify Plan Blueprint' : 'Create Plan Blueprint'}</Text>
              <TouchableOpacity onPress={handleCloseRoutineModal}>
                <Ionicons name="close" size={22} color={THEME.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.picInput}
                placeholder="Routine Name (e.g., Chest Day 💪❤️)"
                placeholderTextColor="#666"
                value={newRoutineName}
                onChangeText={setNewRoutineName}
              />

              <Text style={styles.picSectionLabel}>Theme Display Color Map Tag</Text>
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

              <Text style={styles.picSectionLabel}>Append Component Exercises</Text>
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
                  placeholder="3"
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
                <Text style={styles.primaryButtonText}>Save Blueprint Configuration</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- MODAL 2: SPONTANEOUS EXERCISE ADDER --- */}
      <Modal visible={spontaneousModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add Spontaneous Exercise</Text>

            <Text style={styles.inputLabel}>Search or Type Exercise:</Text>
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

            <Text style={styles.inputLabel}>Default Sets Count:</Text>
            <TextInput
              style={styles.input}
              placeholder="3"
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
                <Text style={{ color: THEME.text, fontWeight: '700' }}>Add Exercise</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL 3: PR CREATOR --- */}
      <Modal visible={prModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Record Personal Record</Text>

            <Text style={styles.inputLabel}>Exercise Name:</Text>
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

      {/* --- MODAL 4: WEEKLY SCHEDULER SELECTION --- */}
      <Modal visible={schedulerModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Assign Routine for {selectedScheduleDay}</Text>

            <TouchableOpacity style={styles.flexibleRoutineItem} onPress={() => handleAssignSchedule(null)}>
              <Text style={{ color: '#EF4444', fontWeight: '600' }}>None (Rest / Flexible Day)</Text>
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

      {/* --- MODAL 5: HISTORY DETAIL MODAL --- */}
      <Modal visible={historyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Details for {selectedHistoryDate}</Text>
            
            {selectedHistoryDate && history[selectedHistoryDate] ? (
              <ScrollView>
                <Text style={{ color: THEME.accent, fontWeight: '700', fontSize: 16, marginBottom: 12 }}>
                  {history[selectedHistoryDate].routineName}
                </Text>

                {history[selectedHistoryDate].exercises?.map((ex, exIdx) => {
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

                          let diffTexts = [];
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
              </ScrollView>
            ) : (
              <Text style={{ color: THEME.textMuted }}>No workout recorded on this date.</Text>
            )}

            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: THEME.surfaceLight, marginTop: 12 }]} onPress={() => setHistoryModalVisible(false)}>
              <Text style={{ color: THEME.text, textAlign: 'center' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- MODAL 6: ADDICTION TRACKER CREATOR --- */}
      <Modal visible={addictionModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create Habit Tracker</Text>

            <TextInput
              style={styles.input}
              placeholder="Tracker Name (e.g. No Sugar)"
              placeholderTextColor="#666"
              value={newAddictionName}
              onChangeText={setNewAddictionName}
            />

            <Text style={styles.inputLabel}>Theme Color:</Text>
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

      {/* BOTTOM TAB BAR */}
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

        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('history')}>
          <Ionicons name="stats-chart" size={20} color={currentTab === 'history' ? THEME.accent : THEME.textMuted} />
          <Text style={[styles.tabLabel, currentTab === 'history' && styles.tabLabelActive]}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('prs')}>
          <Ionicons name="trophy" size={20} color={currentTab === 'prs' ? THEME.accent : THEME.textMuted} />
          <Text style={[styles.tabLabel, currentTab === 'prs' && styles.tabLabelActive]}>PRs</Text>
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
  lightningBtn: {
    backgroundColor: THEME.accent,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
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
  // PIC 1 MATCHING MODAL STYLING
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
  addExBtn: {
    backgroundColor: THEME.accent,
    width: 42,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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