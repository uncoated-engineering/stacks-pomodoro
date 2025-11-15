import { useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { PomodoroLayout } from '@/components/pomodoro/PomodoroLayout';

const Index = () => {
  useSeoMeta({
    title: 'Focus & Achieve - Nostr Pomodoro Timer',
    description: 'A Nostr-powered Pomodoro timer with task management, analytics, and productivity tracking.',
  });

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Prevent default for our shortcuts
      const shortcuts = [' ', 'r', 's', ',', 't', 'h'];
      if (shortcuts.includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      // Note: Keyboard shortcuts will be implemented in a future enhancement
      // The shortcuts would trigger actions on the timer and navigation
      // For now, this prevents default behavior so shortcuts don't interfere with the UI
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return <PomodoroLayout />;
};

export default Index;
