import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Schedule } from './api';

interface SchedulePreferences {
  // Soft preferences array format: [prof_importance, rmp_weight, excellence_weight, diff_importance, prof_gpa_weight, class_gpa_weight, acceptable_gpa_weight, min_acceptable_gpa, softbreak_importance]
  professorImportance: number;
  rmpScoreWeight: number;
  professorExcellenceWeight: number;
  difficultyImportance: number;
  professorGpaWeight: number;
  classGpaWeight: number;
  acceptableGpaWeight: number;
  minAcceptableGpa: string;
  softbreakImportance: number;

  // Additional logistics preferences
  walkingDistance: number;
  latenessTolerance: number;
  preferredArea: string;
  maxBlockDistance: number;
}

interface AppState {
  // Selected courses
  selectedCourses: string[];
  selectedCRNs: number[];

  // Time breaks (5 days x 90 time slots)
  timeBreaks: number[][];

  // Soft preferences
  preferences: SchedulePreferences;

  // Generated schedules
  generatedSchedules: Schedule[];
}

interface AppContextType {
  state: AppState;
  addCourse: (course: string) => void;
  removeCourse: (course: string) => void;
  addCRN: (crn: number) => void;
  removeCRN: (crn: number) => void;
  setTimeBreaks: (breaks: number[][]) => void;
  updatePreference: <K extends keyof SchedulePreferences>(
    key: K,
    value: SchedulePreferences[K]
  ) => void;
  setGeneratedSchedules: (schedules: Schedule[]) => void;
  resetState: () => void;
  saveState: () => void;
}

const defaultPreferences: SchedulePreferences = {
  professorImportance: 3,
  rmpScoreWeight: 3,
  professorExcellenceWeight: 3,
  difficultyImportance: 3,
  professorGpaWeight: 3,
  classGpaWeight: 3,
  acceptableGpaWeight: 3,
  minAcceptableGpa: 'B+',
  softbreakImportance: 3,
  walkingDistance: 10,
  latenessTolerance: 5,
  preferredArea: 'North Campus',
  maxBlockDistance: 3,
};

// Initialize empty time breaks (5 days x 90 slots)
const defaultTimeBreaks = Array(5).fill(null).map(() => Array(90).fill(0));

const defaultState: AppState = {
  selectedCourses: [],
  selectedCRNs: [],
  timeBreaks: defaultTimeBreaks,
  preferences: defaultPreferences,
  generatedSchedules: [],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'schedule-planner-state';

// Helper to load state from localStorage
const loadStateFromStorage = (): AppState | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
  }
  return null;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    // Initialize from localStorage if available
    const stored = loadStateFromStorage();
    return stored || defaultState;
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
    }
  }, [state]);

  const addCourse = (course: string) => {
    setState((prev) => ({
      ...prev,
      selectedCourses: [...prev.selectedCourses, course],
    }));
  };

  const removeCourse = (course: string) => {
    setState((prev) => ({
      ...prev,
      selectedCourses: prev.selectedCourses.filter((c) => c !== course),
    }));
  };

  const addCRN = (crn: number) => {
    setState((prev) => ({
      ...prev,
      selectedCRNs: [...prev.selectedCRNs, crn],
    }));
  };

  const removeCRN = (crn: number) => {
    setState((prev) => ({
      ...prev,
      selectedCRNs: prev.selectedCRNs.filter((c) => c !== crn),
    }));
  };

  const setTimeBreaks = (breaks: number[][]) => {
    setState((prev) => ({
      ...prev,
      timeBreaks: breaks,
    }));
  };

  const updatePreference = <K extends keyof SchedulePreferences>(
    key: K,
    value: SchedulePreferences[K]
  ) => {
    setState((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }));
  };

  const setGeneratedSchedules = (schedules: Schedule[]) => {
    setState((prev) => ({
      ...prev,
      generatedSchedules: schedules,
    }));
  };

  const resetState = () => {
    setState(defaultState);
    localStorage.removeItem(STORAGE_KEY);
  };

  const saveState = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        state,
        addCourse,
        removeCourse,
        addCRN,
        removeCRN,
        setTimeBreaks,
        updatePreference,
        setGeneratedSchedules,
        resetState,
        saveState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
