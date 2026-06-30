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
  Blue: '#3B82F6',   // Chest / Push
  Red: '#EF4444',    // Back / Pull
  Green: '#10B981',  // Legs
  Purple: '#8B5CF6', // Arms / Shoulders
  Yellow: '#F59E0B', // Cardio / Core
  Gray: '#6B7280',   // Flexible / Custom / Rest
};

const EXERCISE_POOL = [
  // Chest
  'Chest Press (Machine)',
  'Incline Dumbbell Press',
  'Flat Bench Press (Barbell)',
  'Butterfly (Pec Deck)',
  'Cable Crossover',
  // Back
  'Seated Row (Wide Grip)',
  'Seated Row (Close Grip)',
  'Lat Pulldown (Wide Grip)',
  'Barbell Row',
  'Reverse Butterfly (Rear Delt Fly)',
  // Shoulders
  'Shoulder Press (Dumbbell)',
  'Lateral Raise (Dumbbell)',
  'Overhead Press (Barbell)',
  // Biceps
  'Dumbbell Curl',
  'Hammer Curl',
  'Barbell Curl',
  // Triceps
  'Tricep Extension (Cable Rope)',
  'Tricep Extension (Cable V-Bar)', // V-bar grip attachment from image.png
  'Skull Crushers (EZ Bar)',
  'Dips (Bodyweight/Weighted)',
  // Legs & Core
  'Squat (Barbell)',
  'Leg Press',
  'Romanian Deadlift',
  'Plank',
  'Hanging Knee Raise'
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const STORAGE_KEYS = {
  ROUTINES: '@kat_tracker_routines_v3',
  SCHEDULE: '@kat_tracker_schedule_v3',
  HISTORY: '@kat_tracker_history_v3',
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
  const [loading, setLoading] = useState(true);

  // --- SUB-SCREEN CONTROLLER STATES ---
  const [isGymDayChecked, setIsGymDayChecked] = useState(false);
  const [activeWorkoutLogs, setActiveWorkoutLogs] = useState({}); 
  const [impromptuRoutine, setImpromptuRoutine] = useState(null); 

  // Creator state
  const [routineModalVisible, setRoutineModalVisible] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineColor, setNewRoutineColor] = useState('Blue');
  const [newRoutineExercises, setNewRoutineExercises] = useState([]);
  
  // Exercise entry sub-state (Standard Set Amount configured to '3')
  const [exInput, setExInput] = useState('');
  const [exSetsInput, setExSetsInput] = useState('3'); 
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Scheduler assignment state
  const [schedulerModalVisible, setSchedulerModalVisible] = useState(false);
  const [selectedScheduleDay, setSelectedScheduleDay] = useState(null);

  // History viewer state
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedRoutines = await AsyncStorage.getItem(STORAGE_KEYS.ROUTINES);
      const storedSchedule = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULE);
      const storedHistory = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);

      if (storedRoutines) setRoutines(JSON.parse(storedRoutines));
      if (storedSchedule) setSchedule(JSON.parse(storedSchedule));
      if (storedHistory) setHistory(JSON.parse(storedHistory));
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

  // --- BUSINESS ENGINE HANDLERS ---
  const handleCreateRoutine = () => {
    if (!newRoutineName.trim()) return Alert.alert('Invalid Input', 'Provide a name for your routine.');

    const newRoutine = {
      id: Date.now().toString(),
      name: newRoutineName,
      color: ROUTINE_COLORS[newRoutineColor],
      colorName: newRoutineColor,
      exercises: newRoutineExercises // Not forced to add exercises anymore (perfect for tracking rest/stretching days!)
    };

    const updated = [...routines, newRoutine];
    setRoutines(updated);
    saveData(STORAGE_KEYS.ROUTINES, updated);

    setNewRoutineName('');
    setNewRoutineColor('Blue');
    setNewRoutineExercises([]);
    setRoutineModalVisible(false);
  };

  const handleDeleteRoutine = (id) => {
    Alert.alert('Delete Routine', 'Are you sure? This unlinks the routine from your schedule metrics.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
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
      }}
    ]);
  };

  const handleAddExerciseToCreator = () => {
    if (!exInput.trim()) return;
    const setsCount = parseInt(exSetsInput) || 3; // Standard set fallback changed to 3
    const newEx = {
      id: Date.now().toString() + Math.random().toString(),
      name: exInput.trim(),
      defaultSets: setsCount
    };
    setNewRoutineExercises([...newRoutineExercises, newEx]);
    setExInput('');
    setExSetsInput('3'); // Resets cleanly to standard 3 sets
    setShowSuggestions(false);
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
  }, [schedule, routines, impromptuRoutine, currentTab]);

  useEffect(() => {
    if (currentActiveRoutine) {
      const initialLogs = {};
      currentActiveRoutine.exercises.forEach(ex => {
        initialLogs[ex.id] = Array.from({ length: ex.defaultSets }, () => ({ weight: '', reps: '', done: false }));
      });
      setActiveWorkoutLogs(initialLogs);
    } else {
      setActiveWorkoutLogs({});
    }
    setIsGymDayChecked(false);
  }, [currentActiveRoutine]);

  const handleUpdateLogCell = (exId, setIndex, field, value) => {
    const updated = { ...activeWorkoutLogs };
    if (!updated[exId]) updated[exId] = [];
    if (!updated[exId][setIndex]) updated[exId][setIndex] = { weight: '', reps: '', done: false };
    updated[exId][setIndex][field] = value;
    setActiveWorkoutLogs(updated);
  };

  // Toggle state checkmarks directly inside active exercise logs
  const handleToggleSetComplete = (exId, setIndex) => {
    const updated = { ...activeWorkoutLogs };
    if (!updated[exId]) updated[exId] = [];
    if (!updated[exId][setIndex]) updated[exId][setIndex] = { weight: '', reps: '', done: false };
    updated[exId][setIndex].done = !updated[exId][setIndex].done;
    setActiveWorkoutLogs(updated);
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
    setCurrentTab('history');
  };

  const filteredSuggestions = useMemo(() => {
    if (!exInput.trim()) return [];
    return EXERCISE_POOL.filter(item => 
      item.toLowerCase().includes(exInput.toLowerCase()) && 
      !newRoutineExercises.some(e => e.name.toLowerCase() === item.toLowerCase())
    );
  }, [exInput, newRoutineExercises]);

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
            <Text style={styles.viewTitle}>Today's Execution</Text>
            
            {currentActiveRoutine ? (
              <View style={[styles.card, { borderLeftWidth: 5, borderLeftColor: currentActiveRoutine.color }]}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.cardTitle}>{currentActiveRoutine.name}</Text>
                    <Text style={styles.cardMutedText}>
                      {improwRoutine = impromptuRoutine ? 'Loaded on-the-fly session' : `Scheduled for execution this ${getTodayDayName()}`}
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
                <Text style={styles.cardMutedText}>No routine is locked into today's matrix. Want to train or run a rest check-in? Select a blueprint configuration on-the-fly below:</Text>
                
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
                    {currentActiveRoutine.exercises.length === 0 ? (
                      <Text style={[styles.cardMutedText, { textAlign: 'center', marginVertical: 20 }]}>
                        This is an empty rest/recovery block routine blueprint. You can commit it instantly below to log your active recovery tracking sequence!
                      </Text>
                    ) : (
                      currentActiveRoutine.exercises.map((ex) => (
                        <View key={ex.id} style={styles.exerciseLogBlock}>
                          <Text style={styles.exerciseLogName}>{ex.name}</Text>
                          
                          <View style={[styles.row, { marginBottom: 6, opacity: 0.6 }]}>
                            <Text style={[styles.setCell, { width: 50, textAlign: 'center' }]}>Status</Text>
                            <Text style={[styles.setCell, { flex: 1 }]}>Weight (kg)</Text>
                            <Text style={[styles.setCell, { flex: 1 }]}>Reps</Text>
                          </View>

                          {Array.from({ length: ex.defaultSets }).map((_, setIndex) => {
                            const isSetDone = activeWorkoutLogs[ex.id]?.[setIndex]?.done || false;
                            return (
                              <View key={setIndex} style={[styles.row, { marginBottom: 8, alignItems: 'center' }, isSetDone && styles.rowCompletedHighlight]}>
                                {/* ACTUAL CLICKABLE LOGGING BUTTON FOR EXERCISES */}
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

                                <TextInput
                                  style={[styles.logInput, isSetDone && styles.logInputDisabled]}
                                  placeholder="0"
                                  placeholderTextColor="#555"
                                  keyboardType="numeric"
                                  editable={!isSetDone}
                                  value={activeWorkoutLogs[ex.id]?.[setIndex]?.weight || ''}
                                  onChangeText={(val) => handleUpdateLogCell(ex.id, setIndex, 'weight', val)}
                                />
                                <TextInput
                                  style={[styles.logInput, isSetDone && styles.logInputDisabled]}
                                  placeholder="0"
                                  placeholderTextColor="#555"
                                  keyboardType="numeric"
                                  editable={!isSetDone}
                                  value={activeWorkoutLogs[ex.id]?.[setIndex]?.reps || ''}
                                  onChangeText={(val) => handleUpdateLogCell(ex.id, setIndex, 'reps', val)}
                                />
                              </View>
                            );
                          })}
                        </View>
                      ))
                    )}

                    <TouchableOpacity style={styles.primaryButton} onPress={handleSaveWorkoutSession}>
                      <Text style={styles.primaryButtonText}>Commit & Save Workout Metrics</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
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
                <Text style={[styles.cardMutedText, { textAlign: 'center' }]}>Create target training configs using the create button above. Empty sets can represent structural Rest Days!</Text>
              </View>
            ) : (
              routines.map(item => (
                <View key={item.id} style={[styles.card, { borderLeftWidth: 5, borderLeftColor: item.color }]}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <TouchableOpacity onPress={() => handleDeleteRoutine(item.id)}>
                      <Ionicons name="trash-outline" size={20} color={THEME.textMuted} />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
                    {item.exercises.length === 0 ? (
                      <View style={styles.tagBlockRest}>
                        <Text style={{ color: THEME.textMuted, fontSize: 12 }}>Pure Rest / Recovery Target Block</Text>
                      </View>
                    ) : (
                      item.exercises.map(e => (
                        <View key={e.id} style={styles.tagBlock}>
                          <Text style={styles.tagBlockText}>{e.name} ({e.defaultSets}S)</Text>
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
            <Text style={[styles.cardMutedText, { marginBottom: 16 }]}>Map specific routine items to target days. Days without explicit maps remain flexible on-the-fly tracks.</Text>
            
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
              
              <View style={[styles.row, { marginTop: 12, justifyContent: 'flex-start', flexWrap: 'wrap' }]}>
                {Object.keys(ROUTINE_COLORS).map(key => (
                  <View key={key} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, marginTop: 4 }}>
                    <View style={[styles.heatmapSquare, { width: 10, height: 10, margin: 0, marginRight: 4, backgroundColor: ROUTINE_COLORS[key] }]} />
                    <Text style={{ color: THEME.textMuted, fontSize: 11 }}>{key}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={[styles.viewTitle, { fontSize: 16, marginTop: 12 }]}>Chronological Records</Text>
            {Object.keys(history).length === 0 ? (
              <Text style={[styles.cardMutedText, { marginTop: 8 }]}>No completed workout tracks saved inside system memory storage files.</Text>
            ) : (
              Object.keys(history).sort((a,b) => b.localeCompare(a)).map(dateStr => (
                <TouchableOpacity 
                  key={dateStr} 
                  style={[styles.card, { borderLeftWidth: 4, borderLeftColor: history[dateStr].color }]}
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
      </ScrollView>

      {/* --- MODAL CONFIGURATION PLATFORMS --- */}

      {/* 1. BLUEPRINT CREATOR MODAL */}
      <Modal animationType="slide" transparent visible={routineModalVisible} onRequestClose={() => setRoutineModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Workout Blueprint</Text>
              <TouchableOpacity onPress={() => setRoutineModalVisible(false)}>
                <Ionicons name="close" size={24} color={THEME.text} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>Routine Identification Name</Text>
              <TextInput 
                style={styles.textInput} 
                placeholder="e.g. Legs or Recovery Restday" 
                placeholderTextColor="#666"
                value={newRoutineName}
                onChangeText={setNewRoutineName}
              />

              <Text style={styles.inputLabel}>Theme Display Color Map Tag</Text>
              <View style={[styles.row, { justifyContent: 'space-around', marginVertical: 10 }]}>
                {Object.keys(ROUTINE_COLORS).map((colorKey) => (
                  <TouchableOpacity
                    key={colorKey}
                    style={[
                      styles.colorSelectorCircle, 
                      { backgroundColor: ROUTINE_COLORS[colorKey] },
                      newRoutineColor === colorKey && styles.colorSelectorCircleSelected
                    ]}
                    onPress={() => setNewRoutineColor(colorKey)}
                  />
                ))}
              </View>

              <Text style={styles.inputLabel}>Append Component Exercises ({newRoutineExercises.length} staged)</Text>
              
              <View style={{ zIndex: 999 }}>
                <View style={styles.row}>
                  <View style={{ flex: 2, marginRight: 8 }}>
                    <TextInput 
                      style={styles.textInput} 
                      placeholder="Type or search item..." 
                      placeholderTextColor="#666"
                      value={exInput}
                      onChangeText={(txt) => { setExInput(txt); setShowSuggestions(true); }}
                      onFocus={() => setShowSuggestions(true)}
                    />
                  </View>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <TextInput 
                      style={styles.textInput} 
                      placeholder="Sets" 
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      value={exSetsInput}
                      onChangeText={setExSetsInput}
                    />
                  </View>
                  {/* BUTTON ACTION: ADD EXERCISE TO STAGE LIST */}
                  <TouchableOpacity style={styles.inlineAddBtn} onPress={handleAddExerciseToCreator}>
                    <Ionicons name="add" size={24} color={THEME.text} />
                  </TouchableOpacity>
                </View>

                {/* AUTOCOMPLETE SUGGESTION EXPANSIONS */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <View style={styles.suggestionsBox}>
                    {filteredSuggestions.slice(0, 5).map((suggestion) => (
                      <TouchableOpacity 
                        key={suggestion} 
                        style={styles.suggestionItem}
                        onPress={() => {
                          setExInput(suggestion);
                          setShowSuggestions(false);
                        }}
                      >
                        <Text style={{ color: THEME.text }}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* PRESSABLE STAGING LIST BUTTONS (Tap to remove exercise from template creation) */}
              <View style={{ marginTop: 12 }}>
                {newRoutineExercises.length > 0 && (
                  <Text style={[styles.cardMutedText, { marginBottom: 6, fontSize: 11 }]}>Tip: Tap an added exercise to remove it.</Text>
                )}
                {newRoutineExercises.map((ex, index) => (
                  <TouchableOpacity 
                    key={ex.id} 
                    style={styles.stagingExRowInteractive} 
                    onPress={() => {
                      setNewRoutineExercises(newRoutineExercises.filter(e => e.id !== ex.id));
                    }}
                  >
                    <Text style={{ color: THEME.text, fontWeight: '500' }}>{index + 1}. {ex.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ color: THEME.accent, fontWeight: '700', marginRight: 6 }}>{ex.defaultSets}S</Text>
                      <Ionicons name="close-circle-sharp" size={16} color="#EF4444" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[styles.primaryButton, { marginTop: 24 }]} onPress={handleCreateRoutine}>
                <Text style={styles.primaryButtonText}>Compile Blueprint Routine</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 2. SCHEDULER ATTACHMENT ACTION SHEET */}
      <Modal animationType="fade" transparent visible={schedulerModalVisible} onRequestClose={() => setSchedulerModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Link Assignment to {selectedScheduleDay}</Text>
              <TouchableOpacity onPress={() => setSchedulerModalVisible(false)}>
                <Ionicons name="close" size={24} color={THEME.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <TouchableOpacity 
                style={[styles.scheduleRow, { backgroundColor: THEME.surfaceLight }]}
                onPress={() => handleAssignSchedule(null)}
              >
                <Text style={{ color: THEME.textMuted, fontWeight: '600' }}>Clear Track Mappings (Keep Day Flexible)</Text>
              </TouchableOpacity>
              
              {routines.map(r => (
                <TouchableOpacity 
                  key={r.id} 
                  style={[styles.scheduleRow, { borderLeftWidth: 4, borderLeftColor: r.color }]}
                  onPress={() => handleAssignSchedule(r.id)}
                >
                  <Text style={{ color: THEME.text, fontWeight: '600' }}>{r.name}</Text>
                  <Ionicons name="checkmark-circle-outline" size={20} color={r.color} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 3. HISTORICAL METRICS MODAL INSPECTOR */}
      <Modal animationType="slide" transparent visible={historyModalVisible} onRequestClose={() => setHistoryModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Historical Performance Log</Text>
                <Text style={{ color: THEME.textMuted, fontSize: 13, marginTop: 2 }}>{selectedHistoryDate}</Text>
              </View>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <Ionicons name="close" size={24} color={THEME.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {selectedHistoryDate && history[selectedHistoryDate] ? (
                <View>
                  <View style={[styles.badge, { backgroundColor: history[selectedHistoryDate].color, alignSelf: 'flex-start', marginBottom: 16 }]}>
                    <Text style={{ color: '#121212', fontWeight: '800' }}>{history[selectedHistoryDate].routineName}</Text>
                  </View>

                  {history[selectedHistoryDate].exercises.length === 0 ? (
                    <Text style={[styles.cardMutedText, { textAlign: 'center', marginVertical: 20 }]}>
                      Logged as a dedicated structural rest and recovery milestone window! 🌱
                    </Text>
                  ) : (
                    history[selectedHistoryDate].exercises.map((ex, eIdx) => (
                      <View key={eIdx} style={{ marginBottom: 16, borderBottomWidth: 1, borderColor: THEME.border, paddingBottom: 12 }}>
                        <Text style={{ color: THEME.text, fontSize: 16, fontWeight: '600', marginBottom: 6 }}>{ex.name}</Text>
                        {ex.sets.map((set, sIdx) => (
                          <Text key={sIdx} style={{ color: THEME.textMuted, fontSize: 14, marginVertical: 2 }}>
                            Set {sIdx + 1}:  <Text style={{ color: THEME.text, fontWeight: '600' }}>{set.weight} kg</Text>  ×  <Text style={{ color: THEME.text, fontWeight: '600' }}>{set.reps} reps</Text> {set.done && ' ✓'}
                          </Text>
                        ))}
                      </View>
                    ))
                  )}
                </View>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                  <Ionicons name="ellipse-outline" size={44} color={THEME.textMuted} />
                  <Text style={{ color: THEME.text, fontSize: 16, fontWeight: '600', marginTop: 12 }}>No Record On This Date</Text>
                  <Text style={{ color: THEME.textMuted, textAlign: 'center', marginTop: 4 }}>This calendar graph block shows an unlogged tracking cell window.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- BOTTOM NAVIGATION LAYOUT STRIP --- */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('today')}>
          <Ionicons name="barbell-outline" size={22} color={currentTab === 'today' ? THEME.accent : THEME.textMuted} />
          <Text style={[styles.tabLabel, currentTab === 'today' && styles.tabLabelActive]}>Today</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('routines')}>
          <Ionicons name="list-outline" size={22} color={currentTab === 'routines' ? THEME.accent : THEME.textMuted} />
          <Text style={[styles.tabLabel, currentTab === 'routines' && styles.tabLabelActive]}>Routines</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('schedule')}>
          <Ionicons name="calendar-outline" size={22} color={currentTab === 'schedule' ? THEME.accent : THEME.textMuted} />
          <Text style={[styles.tabLabel, currentTab === 'schedule' && styles.tabLabelActive]}>Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('history')}>
          <Ionicons name="analytics-outline" size={22} color={currentTab === 'history' ? THEME.accent : THEME.textMuted} />
          <Text style={[styles.tabLabel, currentTab === 'history' && styles.tabLabelActive]}>History</Text>
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
    marginBottom: 12,
  },
  setCell: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  setCheckBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
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
    opacity: 0.8,
  },
  logInput: {
    flex: 1,
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderWidth: 1,
    borderRadius: 6,
    color: THEME.text,
    paddingVertical: 6,
    paddingHorizontal: 10,
    textAlign: 'center',
    marginHorizontal: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  logInputDisabled: {
    backgroundColor: THEME.successMuted,
    borderColor: THEME.success,
    color: THEME.success,
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
    fontSize: 11,
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
    alignItems: 'center',
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
  stagingExRowInteractive: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.surfaceLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: THEME.border,
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
