import type { NostrEvent } from '@nostrify/nostrify';

export type SessionType = 'work' | 'short-break' | 'long-break';
export type TaskStatus = 'todo' | 'in-progress' | 'completed';

export interface PomodoroSettings {
  workDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  theme: string;
  shortcuts: KeyboardShortcuts;
}

export interface KeyboardShortcuts {
  startTimer: string;
  pauseTimer: string;
  resetTimer: string;
  skipTimer: string;
  openSettings: string;
  openTasks: string;
  openReports: string;
}

export interface Project {
  id: string; // d tag value
  title: string;
  color?: string;
  created: number; // unix timestamp
  description?: string;
  event?: NostrEvent; // raw Nostr event
}

export interface Task {
  id: string; // d tag value
  title: string;
  projectId?: string;
  status: TaskStatus;
  pomodoros: number;
  estimatedPomodoros?: number;
  created: number; // unix timestamp
  completed?: number; // unix timestamp
  description?: string;
  event?: NostrEvent; // raw Nostr event
}

export interface PomodoroSession {
  id: string; // event id
  sessionType: SessionType;
  duration: number; // seconds
  taskId?: string;
  projectId?: string;
  completed: boolean;
  notes?: string;
  timestamp: number; // created_at from event
  event?: NostrEvent; // raw Nostr event
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  currentSessionType: SessionType;
  timeRemaining: number; // seconds
  sessionsCompleted: number;
  currentTaskId?: string;
}

export interface ActivitySummary {
  totalSessions: number;
  completedSessions: number;
  totalFocusTime: number; // minutes
  totalBreakTime: number; // minutes
  tasksCompleted: number;
  currentStreak: number; // days
}

export interface FocusHours {
  daily: Record<string, number>; // date -> minutes
  weekly: Record<string, number>; // week start date -> minutes
  monthly: Record<string, number>; // month (YYYY-MM) -> minutes
  yearly: Record<string, number>; // year (YYYY) -> minutes
}

export const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  theme: 'tomato',
  shortcuts: {
    startTimer: ' ', // space
    pauseTimer: ' ', // space
    resetTimer: 'r',
    skipTimer: 's',
    openSettings: ',',
    openTasks: 't',
    openReports: 'h', // h for history
  },
};

export const THEME_COLORS = {
  tomato: {
    primary: 'hsl(4, 92%, 58%)',
    primaryDark: 'hsl(4, 92%, 48%)',
    light: 'hsl(4, 92%, 95%)',
  },
  blue: {
    primary: 'hsl(217, 91%, 60%)',
    primaryDark: 'hsl(217, 91%, 50%)',
    light: 'hsl(217, 91%, 95%)',
  },
  green: {
    primary: 'hsl(142, 71%, 45%)',
    primaryDark: 'hsl(142, 71%, 35%)',
    light: 'hsl(142, 71%, 95%)',
  },
  purple: {
    primary: 'hsl(271, 76%, 53%)',
    primaryDark: 'hsl(271, 76%, 43%)',
    light: 'hsl(271, 76%, 95%)',
  },
  pink: {
    primary: 'hsl(340, 82%, 52%)',
    primaryDark: 'hsl(340, 82%, 42%)',
    light: 'hsl(340, 82%, 95%)',
  },
};
