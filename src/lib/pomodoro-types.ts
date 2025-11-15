import type { NostrEvent } from '@nostrify/nostrify';

// Pomodoro Event Kinds
export const POMODORO_KINDS = {
  SESSION: 3100,
  SETTINGS: 10100,
  TASK: 30100,
  PROJECT: 30101,
} as const;

// Session Types
export type SessionType = 'pomodoro' | 'short_break' | 'long_break';

// Pomodoro Session (Kind 3100)
export interface PomodoroSession {
  id: string; // event id
  sessionType: SessionType;
  duration: number; // in seconds
  startedAt: number; // unix timestamp
  completedAt: number; // unix timestamp
  taskNaddr?: string; // naddr1 identifier
  projectNaddr?: string; // naddr1 identifier
  notes?: string;
  author: string; // pubkey
  event: NostrEvent;
}

// Pomodoro Settings (Kind 10100)
export interface PomodoroSettings {
  pomodoroDuration: number; // in seconds (default: 1500 = 25 min)
  shortBreakDuration: number; // in seconds (default: 300 = 5 min)
  longBreakDuration: number; // in seconds (default: 900 = 15 min)
  longBreakInterval: number; // number of pomodoros before long break (default: 4)
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  notificationSound: boolean;
  notificationVolume: number; // 0-100
  theme?: string;
  shortcuts?: KeyboardShortcuts;
  author: string; // pubkey
  event?: NostrEvent;
}

// Keyboard Shortcuts
export interface KeyboardShortcuts {
  start_timer?: string;
  reset_timer?: string;
  switch_to_pomodoro?: string;
  switch_to_short_break?: string;
  switch_to_long_break?: string;
  toggle_settings?: string;
  open_tasks?: string;
  open_reports?: string;
}

// Default Settings
export const DEFAULT_SETTINGS: Omit<PomodoroSettings, 'author' | 'event'> = {
  pomodoroDuration: 1500, // 25 minutes
  shortBreakDuration: 300, // 5 minutes
  longBreakDuration: 900, // 15 minutes
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  notificationSound: true,
  notificationVolume: 50,
  theme: 'default',
  shortcuts: {
    start_timer: 'space',
    reset_timer: 'r',
    switch_to_pomodoro: '1',
    switch_to_short_break: '2',
    switch_to_long_break: '3',
    toggle_settings: 's',
    open_tasks: 't',
    open_reports: 'o',
  },
};

// Pomodoro Task (Kind 30100)
export interface PomodoroTask {
  id: string; // d tag value
  naddr: string; // naddr1 identifier
  title: string;
  projectNaddr?: string;
  estimatedPomodoros?: number;
  completedPomodoros: number;
  completed: boolean;
  completedAt?: number; // unix timestamp
  createdAt: number; // unix timestamp
  order?: number;
  author: string; // pubkey
  event: NostrEvent;
}

// Pomodoro Project (Kind 30101)
export interface PomodoroProject {
  id: string; // d tag value
  naddr: string; // naddr1 identifier
  name: string;
  color?: string; // hex color
  createdAt: number; // unix timestamp
  order?: number;
  author: string; // pubkey
  event: NostrEvent;
}

// Timer State
export interface TimerState {
  mode: SessionType;
  timeRemaining: number; // in seconds
  isRunning: boolean;
  isPaused: boolean;
  completedPomodoros: number; // in current cycle
  currentTaskNaddr?: string;
}

// Stats for Reports
export interface PomodoroStats {
  totalSessions: number;
  totalFocusTime: number; // in seconds
  totalBreakTime: number; // in seconds
  averageSessionDuration: number; // in seconds
  completedTasks: number;
  activeTasks: number;
  sessionsPerDay: { [date: string]: number };
  focusTimePerDay: { [date: string]: number };
  focusTimePerProject: { [projectNaddr: string]: number };
  focusTimePerTask: { [taskNaddr: string]: number };
}

// Time Period for Reports
export type TimePeriod = 'today' | 'week' | 'month' | 'year';

// Theme Options
export interface PomodoroTheme {
  id: string;
  name: string;
  colors: {
    pomodoro: string;
    shortBreak: string;
    longBreak: string;
    background: string;
    text: string;
  };
}

export const POMODORO_THEMES: PomodoroTheme[] = [
  {
    id: 'default',
    name: 'Default',
    colors: {
      pomodoro: '#dc2626',
      shortBreak: '#16a34a',
      longBreak: '#2563eb',
      background: '#ffffff',
      text: '#1f2937',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      pomodoro: '#15803d',
      shortBreak: '#84cc16',
      longBreak: '#059669',
      background: '#f0fdf4',
      text: '#14532d',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      pomodoro: '#0284c7',
      shortBreak: '#06b6d4',
      longBreak: '#0891b2',
      background: '#f0f9ff',
      text: '#0c4a6e',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      pomodoro: '#ea580c',
      shortBreak: '#f59e0b',
      longBreak: '#dc2626',
      background: '#fff7ed',
      text: '#7c2d12',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      pomodoro: '#7c3aed',
      shortBreak: '#a78bfa',
      longBreak: '#6366f1',
      background: '#1e1b4b',
      text: '#e0e7ff',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    colors: {
      pomodoro: '#e11d48',
      shortBreak: '#f472b6',
      longBreak: '#be123c',
      background: '#fff1f2',
      text: '#881337',
    },
  },
];
