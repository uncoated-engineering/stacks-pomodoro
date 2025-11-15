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
  focusMode: string;
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

export interface TaskWorkHistory {
  taskId: string;
  taskTitle: string;
  projectId?: string;
  totalSessions: number; // number of completed work sessions
  totalTime: number; // total time in minutes
  pomodoros: number; // number of pomodoros completed for this task
}

export const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  shortcuts: {
    startTimer: 'ctrl+space',
    pauseTimer: 'ctrl+space',
    resetTimer: 'ctrl+r',
    skipTimer: 'ctrl+s',
    openSettings: 'ctrl+,',
    openTasks: 'ctrl+t',
    openReports: 'ctrl+h',
    focusMode: 'ctrl+f',
  },
};
