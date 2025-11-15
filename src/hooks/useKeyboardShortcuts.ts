import { useEffect } from 'react';
import { usePomodoroSettings } from './usePomodoroSettings';

type ShortcutHandler = () => void;

interface ShortcutHandlers {
  startTimer?: ShortcutHandler;
  pauseTimer?: ShortcutHandler;
  resetTimer?: ShortcutHandler;
  skipTimer?: ShortcutHandler;
  openSettings?: ShortcutHandler;
  openTasks?: ShortcutHandler;
  openReports?: ShortcutHandler;
  focusMode?: ShortcutHandler;
}

function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);

  // Check if the pressed key matches
  const keyMatches = event.key.toLowerCase() === key ||
                     (key === 'space' && event.key === ' ');

  if (!keyMatches) return false;

  // Check modifiers
  const ctrlPressed = event.ctrlKey || event.metaKey; // metaKey for Mac
  const shiftPressed = event.shiftKey;
  const altPressed = event.altKey;

  const needsCtrl = modifiers.includes('ctrl') || modifiers.includes('cmd');
  const needsShift = modifiers.includes('shift');
  const needsAlt = modifiers.includes('alt');

  return (
    ctrlPressed === needsCtrl &&
    shiftPressed === needsShift &&
    altPressed === needsAlt
  );
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const { settings } = usePomodoroSettings();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Check each shortcut
      if (handlers.startTimer && matchesShortcut(event, settings.shortcuts.startTimer)) {
        event.preventDefault();
        handlers.startTimer();
      } else if (handlers.pauseTimer && matchesShortcut(event, settings.shortcuts.pauseTimer)) {
        event.preventDefault();
        handlers.pauseTimer();
      } else if (handlers.resetTimer && matchesShortcut(event, settings.shortcuts.resetTimer)) {
        event.preventDefault();
        handlers.resetTimer();
      } else if (handlers.skipTimer && matchesShortcut(event, settings.shortcuts.skipTimer)) {
        event.preventDefault();
        handlers.skipTimer();
      } else if (handlers.openSettings && matchesShortcut(event, settings.shortcuts.openSettings)) {
        event.preventDefault();
        handlers.openSettings();
      } else if (handlers.openTasks && matchesShortcut(event, settings.shortcuts.openTasks)) {
        event.preventDefault();
        handlers.openTasks();
      } else if (handlers.openReports && matchesShortcut(event, settings.shortcuts.openReports)) {
        event.preventDefault();
        handlers.openReports();
      } else if (handlers.focusMode && matchesShortcut(event, settings.shortcuts.focusMode)) {
        event.preventDefault();
        handlers.focusMode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settings.shortcuts, handlers]);
}
