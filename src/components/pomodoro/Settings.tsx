import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/useToast';
import { usePomodoroSettings } from '@/hooks/usePomodoroSettings';
import { THEME_COLORS } from '@/types/pomodoro';
import { cn } from '@/lib/utils';

interface SettingsProps {
  className?: string;
}

export function Settings({ className }: SettingsProps) {
  const { settings, updateSettings, isUpdating } = usePomodoroSettings();
  const { toast } = useToast();

  const [workDuration, setWorkDuration] = useState(settings.workDuration);
  const [shortBreakDuration, setShortBreakDuration] = useState(settings.shortBreakDuration);
  const [longBreakDuration, setLongBreakDuration] = useState(settings.longBreakDuration);
  const [sessionsUntilLongBreak, setSessionsUntilLongBreak] = useState(settings.sessionsUntilLongBreak);
  const [autoStartBreaks, setAutoStartBreaks] = useState(settings.autoStartBreaks);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(settings.autoStartPomodoros);
  const [selectedTheme, setSelectedTheme] = useState(settings.theme);

  useEffect(() => {
    setWorkDuration(settings.workDuration);
    setShortBreakDuration(settings.shortBreakDuration);
    setLongBreakDuration(settings.longBreakDuration);
    setSessionsUntilLongBreak(settings.sessionsUntilLongBreak);
    setAutoStartBreaks(settings.autoStartBreaks);
    setAutoStartPomodoros(settings.autoStartPomodoros);
    setSelectedTheme(settings.theme);
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings({
        workDuration,
        shortBreakDuration,
        longBreakDuration,
        sessionsUntilLongBreak,
        autoStartBreaks,
        autoStartPomodoros,
        theme: selectedTheme,
      });

      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <Tabs defaultValue="timer" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timer">Timer</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timer Settings</CardTitle>
              <CardDescription>Configure your pomodoro timer durations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="work-duration">Work Duration (minutes)</Label>
                  <Input
                    id="work-duration"
                    type="number"
                    min="1"
                    max="60"
                    value={workDuration}
                    onChange={(e) => setWorkDuration(parseInt(e.target.value) || 25)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short-break">Short Break (minutes)</Label>
                  <Input
                    id="short-break"
                    type="number"
                    min="1"
                    max="30"
                    value={shortBreakDuration}
                    onChange={(e) => setShortBreakDuration(parseInt(e.target.value) || 5)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="long-break">Long Break (minutes)</Label>
                  <Input
                    id="long-break"
                    type="number"
                    min="1"
                    max="60"
                    value={longBreakDuration}
                    onChange={(e) => setLongBreakDuration(parseInt(e.target.value) || 15)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessions">Sessions Until Long Break</Label>
                  <Input
                    id="sessions"
                    type="number"
                    min="2"
                    max="10"
                    value={sessionsUntilLongBreak}
                    onChange={(e) => setSessionsUntilLongBreak(parseInt(e.target.value) || 4)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-breaks">Auto-start Breaks</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically start break timers after work sessions
                    </p>
                  </div>
                  <Switch
                    id="auto-breaks"
                    checked={autoStartBreaks}
                    onCheckedChange={setAutoStartBreaks}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-pomodoros">Auto-start Pomodoros</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically start work timers after breaks
                    </p>
                  </div>
                  <Switch
                    id="auto-pomodoros"
                    checked={autoStartPomodoros}
                    onCheckedChange={setAutoStartPomodoros}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Color Theme</CardTitle>
              <CardDescription>Choose your preferred color scheme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(THEME_COLORS).map(([key, colors]) => (
                  <button
                    key={key}
                    className={cn(
                      'relative rounded-lg border-2 p-4 transition-all hover:scale-105',
                      selectedTheme === key ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                    )}
                    onClick={() => setSelectedTheme(key)}
                  >
                    <div
                      className="h-12 rounded-md mb-2"
                      style={{ backgroundColor: colors.primary }}
                    />
                    <p className="text-sm font-medium capitalize">{key}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shortcuts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Keyboard Shortcuts</CardTitle>
              <CardDescription>Quick actions for better productivity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Start / Pause Timer</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border rounded">
                    Space
                  </kbd>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Reset Timer</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border rounded">
                    R
                  </kbd>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Skip Timer</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border rounded">
                    S
                  </kbd>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Open Settings</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border rounded">
                    ,
                  </kbd>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Open Tasks</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border rounded">
                    T
                  </kbd>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Open Reports</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border rounded">
                    H
                  </kbd>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isUpdating} size="lg">
          {isUpdating ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
