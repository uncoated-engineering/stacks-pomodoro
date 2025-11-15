import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, RotateCcw, SkipForward, X } from 'lucide-react';
import { usePomodoroTimer } from '@/contexts/PomodoroTimerContext';
import { usePomodoroSettings } from '@/hooks/usePomodoroSettings';
import { useTasks } from '@/hooks/useTasks';

interface FocusModeProps {
  onExit: () => void;
}

export function FocusMode({ onExit }: FocusModeProps) {
  const {
    timerState,
    currentTaskId,
    handleStart,
    handlePause,
    handleReset,
    handleSkip,
    formatTime,
    getSessionLabel,
  } = usePomodoroTimer();
  const { settings } = usePomodoroSettings();
  const { tasks } = useTasks();

  const currentTask = tasks.find((t) => t.id === currentTaskId);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-4">
      {/* Exit button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4"
        onClick={onExit}
      >
        <X className="h-5 w-5" />
      </Button>

      <div className="w-full max-w-2xl space-y-8 text-center">
        {/* Current task */}
        {currentTask && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Working on</p>
            <h2 className="text-2xl font-bold">{currentTask.title}</h2>
            {currentTask.description && (
              <p className="text-muted-foreground">{currentTask.description}</p>
            )}
            <div className="text-sm text-muted-foreground">
              {currentTask.pomodoros}{' '}
              {currentTask.estimatedPomodoros && `/ ${currentTask.estimatedPomodoros}`} pomodoros
            </div>
          </div>
        )}

        {/* Timer */}
        <Card className="border-2">
          <CardContent className="pt-12 pb-12">
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-medium text-muted-foreground mb-4">{getSessionLabel()}</h3>
                <div className="text-9xl font-bold tabular-nums tracking-tight">
                  {formatTime(timerState.timeRemaining)}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                {!timerState.isRunning || timerState.isPaused ? (
                  <Button size="lg" onClick={handleStart} className="px-12 text-lg h-14">
                    <Play className="mr-2 h-6 w-6" />
                    Start
                  </Button>
                ) : (
                  <Button size="lg" onClick={handlePause} className="px-12 text-lg h-14" variant="secondary">
                    <Pause className="mr-2 h-6 w-6" />
                    Pause
                  </Button>
                )}

                <Button size="lg" onClick={handleReset} variant="outline" className="h-14 w-14">
                  <RotateCcw className="h-6 w-6" />
                </Button>

                <Button size="lg" onClick={handleSkip} variant="outline" className="h-14 w-14">
                  <SkipForward className="h-6 w-6" />
                </Button>
              </div>

              {timerState.currentSessionType === 'work' && (
                <div className="text-base text-muted-foreground">
                  Session {timerState.sessionsCompleted + 1} of {settings.sessionsUntilLongBreak}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">
          Press <kbd className="px-2 py-1 text-xs font-semibold bg-muted border rounded">Esc</kbd> to exit focus mode
        </p>
      </div>
    </div>
  );
}
