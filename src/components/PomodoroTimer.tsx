import { useState } from 'react';
import { Play, Pause, RotateCcw, Settings, BarChart3, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { usePomodoroTimer } from '@/hooks/usePomodoroTimer';
import { useSettings } from '@/hooks/useSettings';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { formatTime } from '@/lib/pomodoro-utils';
import { POMODORO_THEMES } from '@/lib/pomodoro-types';
import type { SessionType } from '@/lib/pomodoro-types';

interface PomodoroTimerProps {
  onOpenSettings?: () => void;
  onOpenTasks?: () => void;
  onOpenReports?: () => void;
}

export function PomodoroTimer({ onOpenSettings, onOpenTasks, onOpenReports }: PomodoroTimerProps) {
  const timer = usePomodoroTimer();
  const { data: settings } = useSettings();

  // Get theme colors
  const theme = POMODORO_THEMES.find(t => t.id === settings?.theme) ?? POMODORO_THEMES[0];
  const modeColor = {
    pomodoro: theme.colors.pomodoro,
    short_break: theme.colors.shortBreak,
    long_break: theme.colors.longBreak,
  }[timer.mode];

  // Mode labels
  const modeLabels: Record<SessionType, string> = {
    pomodoro: 'Pomodoro',
    short_break: 'Short Break',
    long_break: 'Long Break',
  };

  // Keyboard shortcuts
  useKeyboardShortcuts(
    settings?.shortcuts,
    {
      onStartTimer: () => {
        if (timer.isRunning) {
          timer.pause();
        } else {
          timer.start();
        }
      },
      onResetTimer: () => timer.reset(),
      onSwitchToPomodoro: () => timer.switchMode('pomodoro'),
      onSwitchToShortBreak: () => timer.switchMode('short_break'),
      onSwitchToLongBreak: () => timer.switchMode('long_break'),
      onToggleSettings: onOpenSettings,
      onOpenTasks: onOpenTasks,
      onOpenReports: onOpenReports,
    },
    true
  );

  // Calculate progress percentage
  const getDurationForMode = (mode: SessionType): number => {
    if (!settings) return 1500;
    switch (mode) {
      case 'pomodoro':
        return settings.pomodoroDuration;
      case 'short_break':
        return settings.shortBreakDuration;
      case 'long_break':
        return settings.longBreakDuration;
    }
  };

  const totalDuration = getDurationForMode(timer.mode);
  const progress = ((totalDuration - timer.timeRemaining) / totalDuration) * 100;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center transition-colors duration-500"
      style={{ backgroundColor: modeColor }}
    >
      <div className="w-full max-w-2xl px-4">
        {/* Header with action buttons */}
        <div className="flex justify-end gap-2 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenReports}
            className="text-white/90 hover:text-white hover:bg-white/10"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Reports
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenTasks}
            className="text-white/90 hover:text-white hover:bg-white/10"
          >
            <ListTodo className="w-4 h-4 mr-2" />
            Tasks
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSettings}
            className="text-white/90 hover:text-white hover:bg-white/10"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Main timer card */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <div className="p-8">
            {/* Mode selector */}
            <div className="flex gap-2 mb-8">
              <Button
                variant={timer.mode === 'pomodoro' ? 'default' : 'ghost'}
                onClick={() => timer.switchMode('pomodoro')}
                className={cn(
                  'flex-1 text-white',
                  timer.mode === 'pomodoro'
                    ? 'bg-white/20 hover:bg-white/30'
                    : 'hover:bg-white/10'
                )}
              >
                Pomodoro
              </Button>
              <Button
                variant={timer.mode === 'short_break' ? 'default' : 'ghost'}
                onClick={() => timer.switchMode('short_break')}
                className={cn(
                  'flex-1 text-white',
                  timer.mode === 'short_break'
                    ? 'bg-white/20 hover:bg-white/30'
                    : 'hover:bg-white/10'
                )}
              >
                Short Break
              </Button>
              <Button
                variant={timer.mode === 'long_break' ? 'default' : 'ghost'}
                onClick={() => timer.switchMode('long_break')}
                className={cn(
                  'flex-1 text-white',
                  timer.mode === 'long_break'
                    ? 'bg-white/20 hover:bg-white/30'
                    : 'hover:bg-white/10'
                )}
              >
                Long Break
              </Button>
            </div>

            {/* Timer display */}
            <div className="text-center mb-8">
              {/* Circular progress */}
              <div className="relative inline-block mb-6">
                <svg className="w-64 h-64 transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="rgba(255, 255, 255, 0.9)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 120}`}
                    strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                {/* Time display */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-7xl font-bold text-white tracking-wider">
                    {formatTime(timer.timeRemaining)}
                  </span>
                </div>
              </div>

              {/* Mode label */}
              <p className="text-white/80 text-xl font-medium mb-2">{modeLabels[timer.mode]}</p>

              {/* Completed pomodoros indicator */}
              {timer.mode === 'pomodoro' && timer.completedPomodoros > 0 && (
                <div className="flex justify-center gap-2 mt-4">
                  {Array.from({ length: timer.completedPomodoros % 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full bg-white/60"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                onClick={timer.isRunning ? timer.pause : timer.start}
                className="bg-white text-gray-900 hover:bg-white/90 px-12 text-lg font-semibold shadow-lg"
              >
                {timer.isRunning ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={timer.reset}
                className="text-white hover:bg-white/10"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="mt-8 text-center">
              <p className="text-white/60 text-sm">
                Press <kbd className="px-2 py-1 bg-white/10 rounded">Space</kbd> to start/pause,{' '}
                <kbd className="px-2 py-1 bg-white/10 rounded">R</kbd> to reset
              </p>
            </div>
          </div>
        </Card>

        {/* Footer attribution */}
        <div className="mt-8 text-center">
          <p className="text-white/40 text-sm">
            Vibed with{' '}
            <a
              href="https://soapbox.pub/mkstack"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white/80 underline"
            >
              MKStack
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
