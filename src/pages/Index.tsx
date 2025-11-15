import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { TasksDialog } from '@/components/TasksDialog';
import { SettingsDialog } from '@/components/SettingsDialog';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [tasksOpen, setTasksOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();

  useSeoMeta({
    title: 'Pomodoro Focus Timer - Stay Productive',
    description: 'A beautiful pomodoro timer with task management, statistics, and Nostr integration.',
  });

  return (
    <>
      <PomodoroTimer
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenTasks={() => setTasksOpen(true)}
        onOpenReports={() => navigate('/reports')}
      />

      <TasksDialog open={tasksOpen} onOpenChange={setTasksOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
};

export default Index;
