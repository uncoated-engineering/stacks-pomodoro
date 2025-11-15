import { useSeoMeta } from '@unhead/react';
import { PomodoroLayout } from '@/components/pomodoro/PomodoroLayout';

const Index = () => {
  useSeoMeta({
    title: 'Focus & Achieve - Nostr Pomodoro Timer',
    description: 'A Nostr-powered Pomodoro timer with task management, analytics, and productivity tracking.',
  });

  return <PomodoroLayout />;
};

export default Index;
