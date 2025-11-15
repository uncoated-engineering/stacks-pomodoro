import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettings } from '@/hooks/useSettings';
import { useUpdateSettings } from '@/hooks/usePomodoroMutations';
import { DEFAULT_SETTINGS, POMODORO_THEMES } from '@/lib/pomodoro-types';
import type { PomodoroSettings, KeyboardShortcuts } from '@/lib/pomodoro-types';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { data: currentSettings } = useSettings();
  const { mutate: updateSettings } = useUpdateSettings();

  const [settings, setSettings] = useState<Omit<PomodoroSettings, 'author' | 'event'>>(
    currentSettings ?? DEFAULT_SETTINGS
  );

  // Update local state when settings change
  useEffect(() => {
    if (currentSettings) {
      setSettings({
        pomodoroDuration: currentSettings.pomodoroDuration,
        shortBreakDuration: currentSettings.shortBreakDuration,
        longBreakDuration: currentSettings.longBreakDuration,
        longBreakInterval: currentSettings.longBreakInterval,
        autoStartBreaks: currentSettings.autoStartBreaks,
        autoStartPomodoros: currentSettings.autoStartPomodoros,
        notificationSound: currentSettings.notificationSound,
        notificationVolume: currentSettings.notificationVolume,
        theme: currentSettings.theme,
        shortcuts: currentSettings.shortcuts,
      });
    }
  }, [currentSettings]);

  const handleSave = () => {
    updateSettings(settings);
    onOpenChange(false);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your pomodoro experience.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="timer" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timer">Timer</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
          </TabsList>

          <TabsContent value="timer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Timer Durations</CardTitle>
                <CardDescription>Set the length of each session type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pomodoro-duration">Pomodoro (minutes)</Label>
                  <Input
                    id="pomodoro-duration"
                    type="number"
                    min="1"
                    max="60"
                    value={Math.floor(settings.pomodoroDuration / 60)}
                    onChange={(e) =>
                      setSettings({ ...settings, pomodoroDuration: parseInt(e.target.value) * 60 })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="short-break-duration">Short Break (minutes)</Label>
                  <Input
                    id="short-break-duration"
                    type="number"
                    min="1"
                    max="30"
                    value={Math.floor(settings.shortBreakDuration / 60)}
                    onChange={(e) =>
                      setSettings({ ...settings, shortBreakDuration: parseInt(e.target.value) * 60 })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="long-break-duration">Long Break (minutes)</Label>
                  <Input
                    id="long-break-duration"
                    type="number"
                    min="1"
                    max="60"
                    value={Math.floor(settings.longBreakDuration / 60)}
                    onChange={(e) =>
                      setSettings({ ...settings, longBreakDuration: parseInt(e.target.value) * 60 })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="long-break-interval">Long Break Interval</Label>
                  <Input
                    id="long-break-interval"
                    type="number"
                    min="2"
                    max="10"
                    value={settings.longBreakInterval}
                    onChange={(e) =>
                      setSettings({ ...settings, longBreakInterval: parseInt(e.target.value) })
                    }
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Number of pomodoros before a long break
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Auto Start</CardTitle>
                <CardDescription>Automatically start timers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-start-breaks">Auto-start breaks</Label>
                  <Switch
                    id="auto-start-breaks"
                    checked={settings.autoStartBreaks}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, autoStartBreaks: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-start-pomodoros">Auto-start pomodoros</Label>
                  <Switch
                    id="auto-start-pomodoros"
                    checked={settings.autoStartPomodoros}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, autoStartPomodoros: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Sound notifications when timer completes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notification-sound">Notification sound</Label>
                  <Switch
                    id="notification-sound"
                    checked={settings.notificationSound}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, notificationSound: checked })
                    }
                  />
                </div>

                {settings.notificationSound && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Volume</Label>
                      <span className="text-sm text-muted-foreground">{settings.notificationVolume}%</span>
                    </div>
                    <Slider
                      value={[settings.notificationVolume]}
                      onValueChange={([value]) =>
                        setSettings({ ...settings, notificationVolume: value })
                      }
                      max={100}
                      step={5}
                    />
                  </div>
                )}
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
                <div className="grid grid-cols-2 gap-4">
                  {POMODORO_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSettings({ ...settings, theme: theme.id })}
                      className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                        settings.theme === theme.id ? 'border-primary' : 'border-border'
                      }`}
                    >
                      <div className="flex gap-2 mb-2">
                        <div
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: theme.colors.pomodoro }}
                        />
                        <div
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: theme.colors.shortBreak }}
                        />
                        <div
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: theme.colors.longBreak }}
                        />
                      </div>
                      <p className="font-medium">{theme.name}</p>
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
                <CardDescription>Customize keyboard shortcuts for quick actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Start/Pause Timer</Label>
                    <kbd className="px-3 py-1 bg-muted rounded font-mono text-sm">Space</kbd>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="shortcut-reset">Reset Timer</Label>
                    <Input
                      id="shortcut-reset"
                      className="w-20 text-center font-mono"
                      maxLength={1}
                      value={settings.shortcuts?.reset_timer ?? 'r'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          shortcuts: { ...settings.shortcuts, reset_timer: e.target.value.toLowerCase() },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="shortcut-pomodoro">Switch to Pomodoro</Label>
                    <Input
                      id="shortcut-pomodoro"
                      className="w-20 text-center font-mono"
                      maxLength={1}
                      value={settings.shortcuts?.switch_to_pomodoro ?? '1'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          shortcuts: { ...settings.shortcuts, switch_to_pomodoro: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="shortcut-short-break">Switch to Short Break</Label>
                    <Input
                      id="shortcut-short-break"
                      className="w-20 text-center font-mono"
                      maxLength={1}
                      value={settings.shortcuts?.switch_to_short_break ?? '2'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          shortcuts: { ...settings.shortcuts, switch_to_short_break: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="shortcut-long-break">Switch to Long Break</Label>
                    <Input
                      id="shortcut-long-break"
                      className="w-20 text-center font-mono"
                      maxLength={1}
                      value={settings.shortcuts?.switch_to_long_break ?? '3'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          shortcuts: { ...settings.shortcuts, switch_to_long_break: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="shortcut-settings">Toggle Settings</Label>
                    <Input
                      id="shortcut-settings"
                      className="w-20 text-center font-mono"
                      maxLength={1}
                      value={settings.shortcuts?.toggle_settings ?? 's'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          shortcuts: { ...settings.shortcuts, toggle_settings: e.target.value.toLowerCase() },
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between gap-2 pt-4">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
