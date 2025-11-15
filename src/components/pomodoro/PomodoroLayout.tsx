import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Clock, ListTodo, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PomodoroTimer } from './PomodoroTimer';
import { TaskList } from './TaskList';
import { Reports } from './Reports';
import { Settings } from './Settings';
import { ProjectManager } from './ProjectManager';
import { cn } from '@/lib/utils';

interface PomodoroLayoutProps {
  className?: string;
}

export function PomodoroLayout({ className }: PomodoroLayoutProps) {
  const { user } = useCurrentUser();
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('timer');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Focus & Achieve</h1>
            <p className="text-lg text-muted-foreground">
              A Nostr-powered Pomodoro timer to boost your productivity
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-card border">
                <Clock className="h-5 w-5 mb-2 text-primary" />
                <p className="font-medium">Pomodoro Timer</p>
              </div>
              <div className="p-3 rounded-lg bg-card border">
                <ListTodo className="h-5 w-5 mb-2 text-primary" />
                <p className="font-medium">Task Management</p>
              </div>
              <div className="p-3 rounded-lg bg-card border">
                <BarChart3 className="h-5 w-5 mb-2 text-primary" />
                <p className="font-medium">Progress Reports</p>
              </div>
              <div className="p-3 rounded-lg bg-card border">
                <SettingsIcon className="h-5 w-5 mb-2 text-primary" />
                <p className="font-medium">Customizable</p>
              </div>
            </div>

            <div className="pt-4">
              <LoginArea className="w-full" />
            </div>

            <p className="text-xs text-muted-foreground">
              Built with{' '}
              <a
                href="https://soapbox.pub/mkstack"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                MKStack
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-background via-background to-primary/5', className)}>
      <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Focus & Achieve</h1>
              <p className="text-muted-foreground">Stay focused and productive with Pomodoro technique</p>
            </div>
            <LoginArea className="max-w-60" />
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="timer" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Timer</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <ListTodo className="h-4 w-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timer" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3 space-y-6">
                <PomodoroTimer currentTaskId={selectedTaskId} />
                {selectedTaskId && (
                  <div className="flex justify-center">
                    <Button variant="outline" onClick={() => setSelectedTaskId(undefined)}>
                      Clear Selected Task
                    </Button>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2">
                <TaskList selectedTaskId={selectedTaskId} onTaskSelect={setSelectedTaskId} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <TaskList selectedTaskId={selectedTaskId} onTaskSelect={setSelectedTaskId} />
              <ProjectManager />
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="max-w-4xl">
              <Reports />
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="max-w-4xl">
              <Settings />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
