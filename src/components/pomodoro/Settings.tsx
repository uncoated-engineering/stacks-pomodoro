import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { usePomodoroSettings } from '@/hooks/usePomodoroSettings';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import type { KeyboardShortcuts } from '@/types/pomodoro';

interface SettingsProps {
  className?: string;
}

function formatShortcut(shortcut: string): string {
  return shortcut
    .split('+')
    .map((part) => {
      if (part === 'ctrl') return 'Ctrl';
      if (part === 'shift') return 'Shift';
      if (part === 'alt') return 'Alt';
      if (part === 'space') return 'Space';
      if (part === ',') return ',';
      return part.toUpperCase();
    })
    .join(' + ');
}

export function Settings({ className }: SettingsProps) {
  const { settings, updateSettings, isUpdating } = usePomodoroSettings();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [workDuration, setWorkDuration] = useState(settings.workDuration);
  const [shortBreakDuration, setShortBreakDuration] = useState(settings.shortBreakDuration);
  const [longBreakDuration, setLongBreakDuration] = useState(settings.longBreakDuration);
  const [sessionsUntilLongBreak, setSessionsUntilLongBreak] = useState(settings.sessionsUntilLongBreak);
  const [autoStartBreaks, setAutoStartBreaks] = useState(settings.autoStartBreaks);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(settings.autoStartPomodoros);
  const [shortcuts, setShortcuts] = useState<KeyboardShortcuts>(settings.shortcuts);
  const [recordingShortcut, setRecordingShortcut] = useState<keyof KeyboardShortcuts | null>(null);

  useEffect(() => {
    setWorkDuration(settings.workDuration);
    setShortBreakDuration(settings.shortBreakDuration);
    setLongBreakDuration(settings.longBreakDuration);
    setSessionsUntilLongBreak(settings.sessionsUntilLongBreak);
    setAutoStartBreaks(settings.autoStartBreaks);
    setAutoStartPomodoros(settings.autoStartPomodoros);
    setShortcuts(settings.shortcuts);
  }, [settings]);

  useEffect(() => {
    if (!recordingShortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push('ctrl');
      if (e.shiftKey) parts.push('shift');
      if (e.altKey) parts.push('alt');

      const key = e.key === ' ' ? 'space' : e.key.toLowerCase();
      if (key !== 'control' && key !== 'shift' && key !== 'alt' && key !== 'meta') {
        parts.push(key);
        const shortcutString = parts.join('+');
        setShortcuts((prev) => ({ ...prev, [recordingShortcut]: shortcutString }));
        setRecordingShortcut(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [recordingShortcut]);

  const handleSave = async () => {
    try {
      await updateSettings({
        workDuration,
        shortBreakDuration,
        longBreakDuration,
        sessionsUntilLongBreak,
        autoStartBreaks,
        autoStartPomodoros,
        shortcuts,
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

  const ShortcutInput = ({
    label,
    shortcutKey,
  }: {
    label: string;
    shortcutKey: keyof KeyboardShortcuts;
  }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setRecordingShortcut(shortcutKey)}
        className={cn(
          'font-mono text-xs min-w-[120px]',
          recordingShortcut === shortcutKey && 'border-primary ring-2 ring-primary/20'
        )}
      >
        {recordingShortcut === shortcutKey ? 'Press keys...' : formatShortcut(shortcuts[shortcutKey])}
      </Button>
    </div>
  );

  return (
    <div className={cn('space-y-6', className)}>
      <Tabs defaultValue="timer" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timer">Timer</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
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

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}>
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose between light and dark themes, or use your system preference
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shortcuts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Keyboard Shortcuts</CardTitle>
              <CardDescription>
                Click on a shortcut to record a new key combination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <ShortcutInput label="Start / Pause Timer" shortcutKey="startTimer" />
                <Separator />
                <ShortcutInput label="Reset Timer" shortcutKey="resetTimer" />
                <Separator />
                <ShortcutInput label="Skip Timer" shortcutKey="skipTimer" />
                <Separator />
                <ShortcutInput label="Focus Mode" shortcutKey="focusMode" />
                <Separator />
                <ShortcutInput label="Open Settings" shortcutKey="openSettings" />
                <Separator />
                <ShortcutInput label="Open Tasks" shortcutKey="openTasks" />
                <Separator />
                <ShortcutInput label="Open Reports" shortcutKey="openReports" />
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
