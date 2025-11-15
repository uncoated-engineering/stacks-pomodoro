import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { usePomodoroSettings } from '@/hooks/usePomodoroSettings';
import { useSessions } from '@/hooks/useSessions';
import { useTasks } from '@/hooks/useTasks';
import type { SessionType, TimerState } from '@/types/pomodoro';

interface PomodoroTimerContextType {
  timerState: TimerState;
  currentTaskId?: string;
  setCurrentTaskId: (taskId: string | undefined) => void;
  handleStart: () => void;
  handlePause: () => void;
  handleReset: () => void;
  handleSkip: () => void;
  formatTime: (seconds: number) => string;
  getSessionLabel: () => string;
}

interface PersistedTimerState {
  timerState: TimerState;
  startTime: number;
  currentTaskId?: string;
}

const TIMER_STORAGE_KEY = 'pomodoro-timer-state';

const PomodoroTimerContext = createContext<PomodoroTimerContextType | undefined>(undefined);

export function usePomodoroTimer() {
  const context = useContext(PomodoroTimerContext);
  if (!context) {
    throw new Error('usePomodoroTimer must be used within PomodoroTimerProvider');
  }
  return context;
}

export function PomodoroTimerProvider({ children }: { children: ReactNode }) {
  const { settings } = usePomodoroSettings();
  const { createSession } = useSessions();
  const { incrementTaskPomodoros } = useTasks();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Initialize state from localStorage or defaults
  const getInitialState = useCallback((): { timerState: TimerState; currentTaskId?: string; startTime: number } => {
    try {
      const stored = localStorage.getItem(TIMER_STORAGE_KEY);
      if (stored) {
        const parsed: PersistedTimerState = JSON.parse(stored);

        // If timer was running, calculate elapsed time
        if (parsed.timerState.isRunning && parsed.startTime > 0) {
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - parsed.startTime) / 1000);
          const newTimeRemaining = Math.max(0, parsed.timerState.timeRemaining - elapsedSeconds);

          return {
            timerState: {
              ...parsed.timerState,
              timeRemaining: newTimeRemaining,
              // If time ran out while page was closed, mark as not running
              isRunning: newTimeRemaining > 0,
            },
            currentTaskId: parsed.currentTaskId,
            startTime: parsed.startTime,
          };
        }

        return {
          timerState: parsed.timerState,
          currentTaskId: parsed.currentTaskId,
          startTime: parsed.startTime,
        };
      }
    } catch (error) {
      console.error('Failed to load timer state from localStorage:', error);
    }

    return {
      timerState: {
        isRunning: false,
        isPaused: false,
        currentSessionType: 'work',
        timeRemaining: settings.workDuration * 60,
        sessionsCompleted: 0,
      },
      currentTaskId: undefined,
      startTime: 0,
    };
  }, [settings.workDuration]);

  const initialState = getInitialState();
  const [currentTaskId, setCurrentTaskId] = useState<string | undefined>(initialState.currentTaskId);
  const [timerState, setTimerState] = useState<TimerState>(initialState.timerState);

  // Update startTimeRef with loaded value
  useEffect(() => {
    startTimeRef.current = initialState.startTime;
  }, [initialState.startTime]);

  const getDuration = useCallback(
    (sessionType: SessionType): number => {
      switch (sessionType) {
        case 'work':
          return settings.workDuration * 60;
        case 'short-break':
          return settings.shortBreakDuration * 60;
        case 'long-break':
          return settings.longBreakDuration * 60;
      }
    },
    [settings]
  );

  const getNextSessionType = useCallback(
    (currentType: SessionType, sessionsCompleted: number): SessionType => {
      if (currentType === 'work') {
        return sessionsCompleted > 0 && sessionsCompleted % settings.sessionsUntilLongBreak === 0
          ? 'long-break'
          : 'short-break';
      }
      return 'work';
    },
    [settings]
  );

  const playNotificationSound = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }, []);

  const handleSessionComplete = useCallback(
    async (sessionType: SessionType, completed: boolean) => {
      const duration = getDuration(sessionType);
      const actualDuration = completed ? duration : startTimeRef.current > 0 ? duration - timerState.timeRemaining : 0;

      await createSession({
        sessionType,
        duration: actualDuration,
        taskId: currentTaskId,
        completed,
      });

      if (completed && sessionType === 'work' && currentTaskId) {
        await incrementTaskPomodoros(currentTaskId);
      }

      if (completed) {
        playNotificationSound();

        const newSessionsCompleted = sessionType === 'work' ? timerState.sessionsCompleted + 1 : timerState.sessionsCompleted;
        const nextSessionType = getNextSessionType(sessionType, newSessionsCompleted);
        const autoStart =
          (nextSessionType === 'work' && settings.autoStartPomodoros) ||
          (nextSessionType !== 'work' && settings.autoStartBreaks);

        setTimerState({
          isRunning: autoStart,
          isPaused: false,
          currentSessionType: nextSessionType,
          timeRemaining: getDuration(nextSessionType),
          sessionsCompleted: newSessionsCompleted,
        });

        if (autoStart) {
          startTimeRef.current = Date.now();
        }
      }
    },
    [
      timerState,
      getDuration,
      getNextSessionType,
      createSession,
      incrementTaskPomodoros,
      currentTaskId,
      settings,
      playNotificationSound,
    ]
  );

  // Persist timer state to localStorage
  useEffect(() => {
    try {
      const persistedState: PersistedTimerState = {
        timerState,
        startTime: startTimeRef.current,
        currentTaskId,
      };
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(persistedState));
    } catch (error) {
      console.error('Failed to save timer state to localStorage:', error);
    }
  }, [timerState, currentTaskId]);

  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      intervalRef.current = setInterval(() => {
        setTimerState((prev) => {
          const newTimeRemaining = prev.timeRemaining - 1;

          if (newTimeRemaining <= 0) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            handleSessionComplete(prev.currentSessionType, true);
            return { ...prev, isRunning: false, timeRemaining: 0 };
          }

          return { ...prev, timeRemaining: newTimeRemaining };
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning, timerState.isPaused, timerState.currentSessionType, handleSessionComplete]);

  const handleStart = () => {
    if (!timerState.isRunning) {
      startTimeRef.current = Date.now();
    }
    setTimerState((prev) => ({ ...prev, isRunning: true, isPaused: false }));
  };

  const handlePause = () => {
    setTimerState((prev) => ({ ...prev, isPaused: true }));
  };

  const handleReset = async () => {
    if (timerState.isRunning || startTimeRef.current > 0) {
      await handleSessionComplete(timerState.currentSessionType, false);
    }

    startTimeRef.current = 0;
    setTimerState((prev) => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      timeRemaining: getDuration(prev.currentSessionType),
    }));
  };

  const handleSkip = async () => {
    if (timerState.isRunning) {
      await handleSessionComplete(timerState.currentSessionType, false);
    } else {
      const nextSessionType = getNextSessionType(
        timerState.currentSessionType,
        timerState.currentSessionType === 'work' ? timerState.sessionsCompleted + 1 : timerState.sessionsCompleted
      );
      setTimerState({
        isRunning: false,
        isPaused: false,
        currentSessionType: nextSessionType,
        timeRemaining: getDuration(nextSessionType),
        sessionsCompleted:
          timerState.currentSessionType === 'work' ? timerState.sessionsCompleted + 1 : timerState.sessionsCompleted,
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionLabel = (): string => {
    switch (timerState.currentSessionType) {
      case 'work':
        return 'Focus Time';
      case 'short-break':
        return 'Short Break';
      case 'long-break':
        return 'Long Break';
    }
  };

  return (
    <PomodoroTimerContext.Provider
      value={{
        timerState,
        currentTaskId,
        setCurrentTaskId,
        handleStart,
        handlePause,
        handleReset,
        handleSkip,
        formatTime,
        getSessionLabel,
      }}
    >
      {children}
    </PomodoroTimerContext.Provider>
  );
}
