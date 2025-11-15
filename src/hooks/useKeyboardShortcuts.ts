import { useEffect } from 'react';
import type { KeyboardShortcuts } from '@/lib/pomodoro-types';

export interface KeyboardShortcutHandlers {
  onStartTimer?: () => void;
  onResetTimer?: () => void;
  onSwitchToPomodoro?: () => void;
  onSwitchToShortBreak?: () => void;
  onSwitchToLongBreak?: () => void;
  onToggleSettings?: () => void;
  onOpenTasks?: () => void;
  onOpenReports?: () => void;
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcuts | undefined,
  handlers: KeyboardShortcutHandlers,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled || !shortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Check for space key (special case)
      if (e.code === 'Space' && shortcuts.start_timer === 'space') {
        e.preventDefault();
        handlers.onStartTimer?.();
        return;
      }

      // Check other shortcuts
      if (shortcuts.reset_timer && key === shortcuts.reset_timer.toLowerCase()) {
        e.preventDefault();
        handlers.onResetTimer?.();
      } else if (shortcuts.switch_to_pomodoro && key === shortcuts.switch_to_pomodoro.toLowerCase()) {
        e.preventDefault();
        handlers.onSwitchToPomodoro?.();
      } else if (shortcuts.switch_to_short_break && key === shortcuts.switch_to_short_break.toLowerCase()) {
        e.preventDefault();
        handlers.onSwitchToShortBreak?.();
      } else if (shortcuts.switch_to_long_break && key === shortcuts.switch_to_long_break.toLowerCase()) {
        e.preventDefault();
        handlers.onSwitchToLongBreak?.();
      } else if (shortcuts.toggle_settings && key === shortcuts.toggle_settings.toLowerCase()) {
        e.preventDefault();
        handlers.onToggleSettings?.();
      } else if (shortcuts.open_tasks && key === shortcuts.open_tasks.toLowerCase()) {
        e.preventDefault();
        handlers.onOpenTasks?.();
      } else if (shortcuts.open_reports && key === shortcuts.open_reports.toLowerCase()) {
        e.preventDefault();
        handlers.onOpenReports?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, handlers, enabled]);
}
