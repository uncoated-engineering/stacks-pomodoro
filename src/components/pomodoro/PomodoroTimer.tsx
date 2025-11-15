import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { usePomodoroSettings } from '@/hooks/usePomodoroSettings';
import { useSessions } from '@/hooks/useSessions';
import { useTasks } from '@/hooks/useTasks';
import type { SessionType, TimerState } from '@/types/pomodoro';
import { cn } from '@/lib/utils';

interface PomodoroTimerProps {
  currentTaskId?: string;
  onSessionComplete?: (sessionType: SessionType) => void;
  className?: string;
}

export function PomodoroTimer({ currentTaskId, onSessionComplete, className }: PomodoroTimerProps) {
  const { settings } = usePomodoroSettings();
  const { createSession } = useSessions();
  const { incrementTaskPomodoros } = useTasks();

  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    currentSessionType: 'work',
    timeRemaining: settings.workDuration * 60,
    sessionsCompleted: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

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
    // Create a simple beep sound using Web Audio API
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

      // Create session record
      await createSession({
        sessionType,
        duration: actualDuration,
        taskId: currentTaskId,
        completed,
      });

      // Increment task pomodoros if work session was completed
      if (completed && sessionType === 'work' && currentTaskId) {
        await incrementTaskPomodoros(currentTaskId);
      }

      if (completed) {
        playNotificationSound();
        onSessionComplete?.(sessionType);

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
      onSessionComplete,
    ]
  );

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
      // Record interrupted session
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
    <Card className={cn('w-full', className)}>
      <CardContent className="pt-8 pb-8">
        <div className="text-center space-y-6">
          <div>
            <h2 className="text-lg font-medium text-muted-foreground mb-2">{getSessionLabel()}</h2>
            <div className="text-7xl font-bold tabular-nums tracking-tight">
              {formatTime(timerState.timeRemaining)}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            {!timerState.isRunning || timerState.isPaused ? (
              <Button size="lg" onClick={handleStart} className="px-8">
                <Play className="mr-2 h-5 w-5" />
                Start
              </Button>
            ) : (
              <Button size="lg" onClick={handlePause} className="px-8" variant="secondary">
                <Pause className="mr-2 h-5 w-5" />
                Pause
              </Button>
            )}

            <Button size="lg" onClick={handleReset} variant="outline">
              <RotateCcw className="h-5 w-5" />
            </Button>

            <Button size="lg" onClick={handleSkip} variant="outline">
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          {timerState.currentSessionType === 'work' && (
            <div className="text-sm text-muted-foreground">
              Session {timerState.sessionsCompleted + 1} of {settings.sessionsUntilLongBreak}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
