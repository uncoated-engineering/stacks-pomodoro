import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useSettings } from './useSettings';
import { usePublishSession } from './usePomodoroMutations';
import type { SessionType, TimerState } from '@/lib/pomodoro-types';

export function usePomodoroTimer() {
  const { data: settings } = useSettings();
  const { mutate: publishSession } = usePublishSession();

  // Persist timer state to localStorage
  const [timerState, setTimerState] = useLocalStorage<TimerState>('pomodoro-timer-state', {
    mode: 'pomodoro',
    timeRemaining: settings?.pomodoroDuration ?? 1500,
    isRunning: false,
    isPaused: false,
    completedPomodoros: 0,
  });

  const [startTime, setStartTime] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get duration for current mode
  const getDuration = useCallback(
    (mode: SessionType): number => {
      if (!settings) return 1500;

      switch (mode) {
        case 'pomodoro':
          return settings.pomodoroDuration;
        case 'short_break':
          return settings.shortBreakDuration;
        case 'long_break':
          return settings.longBreakDuration;
      }
    },
    [settings]
  );

  // Start or resume timer
  const start = useCallback(() => {
    if (!timerState.isRunning) {
      setStartTime(Math.floor(Date.now() / 1000));
    }

    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
    }));
  }, [timerState.isRunning, setTimerState]);

  // Pause timer
  const pause = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: true,
    }));
  }, [setTimerState]);

  // Reset timer
  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setStartTime(null);

    setTimerState(prev => ({
      ...prev,
      timeRemaining: getDuration(prev.mode),
      isRunning: false,
      isPaused: false,
    }));
  }, [getDuration, setTimerState]);

  // Switch mode
  const switchMode = useCallback(
    (mode: SessionType) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setStartTime(null);

      setTimerState({
        mode,
        timeRemaining: getDuration(mode),
        isRunning: false,
        isPaused: false,
        completedPomodoros: timerState.completedPomodoros,
        currentTaskNaddr: timerState.currentTaskNaddr,
      });
    },
    [getDuration, setTimerState, timerState.completedPomodoros, timerState.currentTaskNaddr]
  );

  // Set current task
  const setCurrentTask = useCallback(
    (taskNaddr?: string) => {
      setTimerState(prev => ({
        ...prev,
        currentTaskNaddr: taskNaddr,
      }));
    },
    [setTimerState]
  );

  // Handle timer completion
  const handleComplete = useCallback(() => {
    if (!settings || !startTime) return;

    const completedAt = Math.floor(Date.now() / 1000);
    const duration = getDuration(timerState.mode);

    // Publish session to Nostr
    publishSession({
      sessionType: timerState.mode,
      duration,
      startedAt: startTime,
      completedAt,
      taskNaddr: timerState.currentTaskNaddr,
    });

    // Play notification sound
    if (settings.notificationSound) {
      const audio = new Audio('/notification.mp3');
      audio.volume = settings.notificationVolume / 100;
      audio.play().catch(() => {
        // Ignore errors if audio fails to play
      });
    }

    // Update completed pomodoros count
    let newCompletedPomodoros = timerState.completedPomodoros;
    if (timerState.mode === 'pomodoro') {
      newCompletedPomodoros += 1;
    }

    // Determine next mode
    let nextMode: SessionType = timerState.mode;
    if (timerState.mode === 'pomodoro') {
      // After a pomodoro, take a break
      if (newCompletedPomodoros % settings.longBreakInterval === 0) {
        nextMode = 'long_break';
      } else {
        nextMode = 'short_break';
      }
    } else {
      // After a break, reset to pomodoro
      nextMode = 'pomodoro';
    }

    // Auto-start next session or reset
    const shouldAutoStart =
      (nextMode === 'pomodoro' && settings.autoStartPomodoros) ||
      (nextMode !== 'pomodoro' && settings.autoStartBreaks);

    if (shouldAutoStart) {
      setStartTime(Math.floor(Date.now() / 1000));
      setTimerState({
        mode: nextMode,
        timeRemaining: getDuration(nextMode),
        isRunning: true,
        isPaused: false,
        completedPomodoros: newCompletedPomodoros,
        currentTaskNaddr: timerState.currentTaskNaddr,
      });
    } else {
      setStartTime(null);
      setTimerState({
        mode: nextMode,
        timeRemaining: getDuration(nextMode),
        isRunning: false,
        isPaused: false,
        completedPomodoros: newCompletedPomodoros,
        currentTaskNaddr: timerState.currentTaskNaddr,
      });
    }
  }, [
    settings,
    startTime,
    timerState,
    getDuration,
    publishSession,
    setTimerState,
  ]);

  // Timer tick effect
  useEffect(() => {
    if (timerState.isRunning) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          const newTimeRemaining = prev.timeRemaining - 1;

          if (newTimeRemaining <= 0) {
            handleComplete();
            return prev;
          }

          return {
            ...prev,
            timeRemaining: newTimeRemaining,
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerState.isRunning, handleComplete, setTimerState]);

  // Update duration when settings change or mode changes
  useEffect(() => {
    if (!timerState.isRunning && !timerState.isPaused) {
      setTimerState(prev => ({
        ...prev,
        timeRemaining: getDuration(prev.mode),
      }));
    }
  }, [settings, timerState.mode, timerState.isRunning, timerState.isPaused, getDuration, setTimerState]);

  return {
    ...timerState,
    start,
    pause,
    reset,
    switchMode,
    setCurrentTask,
  };
}
