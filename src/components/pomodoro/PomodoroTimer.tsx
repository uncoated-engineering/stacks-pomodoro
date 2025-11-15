import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { usePomodoroTimer } from '@/contexts/PomodoroTimerContext';
import { usePomodoroSettings } from '@/hooks/usePomodoroSettings';
import { cn } from '@/lib/utils';

interface PomodoroTimerProps {
  className?: string;
}

export function PomodoroTimer({ className }: PomodoroTimerProps) {
  const { timerState, handleStart, handlePause, handleReset, handleSkip, formatTime, getSessionLabel } = usePomodoroTimer();
  const { settings } = usePomodoroSettings();

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
