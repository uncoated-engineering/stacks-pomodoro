import { useState, useMemo } from 'react';
import { ArrowLeft, Calendar, TrendingUp, Target, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useSessions } from '@/hooks/useSessions';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import {
  getSessionsForPeriod,
  calculateFocusHours,
  groupSessionsByDate,
  formatDuration,
} from '@/lib/pomodoro-utils';
import type { TimePeriod } from '@/lib/pomodoro-types';
import { Link } from 'react-router-dom';

const CHART_COLORS = ['#dc2626', '#16a34a', '#2563eb', '#f59e0b', '#8b5cf6', '#ec4899'];

export function Reports() {
  const [period, setPeriod] = useState<TimePeriod>('week');
  const { data: allSessions = [], isLoading: sessionsLoading } = useSessions({ limit: 500 });
  const { data: tasks = [] } = useTasks({ includeCompleted: true });
  const { data: projects = [] } = useProjects();

  const sessions = useMemo(() => {
    return getSessionsForPeriod(allSessions, period);
  }, [allSessions, period]);

  const pomodoroSessions = useMemo(() => {
    return sessions.filter((s) => s.sessionType === 'pomodoro');
  }, [sessions]);

  // Calculate statistics
  const stats = useMemo(() => {
    const focusHours = calculateFocusHours(sessions);
    const totalSessions = pomodoroSessions.length;
    const avgSessionDuration = totalSessions > 0
      ? pomodoroSessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions
      : 0;
    const completedTasks = tasks.filter((t) => t.completed).length;

    return {
      focusHours,
      totalSessions,
      avgSessionDuration,
      completedTasks,
    };
  }, [sessions, pomodoroSessions, tasks]);

  // Group sessions by date for chart
  const sessionsByDate = useMemo(() => {
    const grouped = groupSessionsByDate(pomodoroSessions);
    return Object.entries(grouped)
      .map(([date, sessions]) => ({
        date,
        sessions: sessions.length,
        hours: calculateFocusHours(sessions),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [pomodoroSessions]);

  // Sessions by project
  const sessionsByProject = useMemo(() => {
    const projectMap = new Map<string, number>();

    pomodoroSessions.forEach((session) => {
      if (session.projectNaddr) {
        const current = projectMap.get(session.projectNaddr) ?? 0;
        projectMap.set(session.projectNaddr, current + 1);
      }
    });

    return Array.from(projectMap.entries())
      .map(([naddr, count]) => {
        const project = projects.find((p) => p.naddr === naddr);
        return {
          name: project?.name ?? 'Unknown',
          count,
          color: project?.color ?? CHART_COLORS[0],
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [pomodoroSessions, projects]);

  // Sessions by task
  const sessionsByTask = useMemo(() => {
    const taskMap = new Map<string, number>();

    pomodoroSessions.forEach((session) => {
      if (session.taskNaddr) {
        const current = taskMap.get(session.taskNaddr) ?? 0;
        taskMap.set(session.taskNaddr, current + 1);
      }
    });

    return Array.from(taskMap.entries())
      .map(([naddr, count]) => {
        const task = tasks.find((t) => t.naddr === naddr);
        return {
          name: task?.title ?? 'Unknown',
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 tasks
  }, [pomodoroSessions, tasks]);

  if (sessionsLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link to="/">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Timer
              </Button>
            </Link>
            <h1 className="text-4xl font-bold">Reports</h1>
            <p className="text-muted-foreground">Track your productivity and progress</p>
          </div>

          <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Focus Hours</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.focusHours.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalSessions} pomodoro sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.avgSessionDuration)}</div>
              <p className="text-xs text-muted-foreground">Per pomodoro</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedTasks}</div>
              <p className="text-xs text-muted-foreground">Total tasks: {tasks.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionsByProject.length}</div>
              <p className="text-xs text-muted-foreground">Active projects</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily focus hours */}
          <Card>
            <CardHeader>
              <CardTitle>Focus Hours Over Time</CardTitle>
              <CardDescription>Daily breakdown of focus time</CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsByDate.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No data available for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sessionsByDate}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value as string).toLocaleDateString()}
                      formatter={(value: number) => [`${value.toFixed(1)}h`, 'Focus Hours']}
                    />
                    <Bar dataKey="hours" fill="#dc2626" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Sessions by project */}
          <Card>
            <CardHeader>
              <CardTitle>Sessions by Project</CardTitle>
              <CardDescription>Distribution of focus time across projects</CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsByProject.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No project data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sessionsByProject}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.name}: ${entry.count}`}
                    >
                      {sessionsByProject.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color ?? CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top tasks */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Top Tasks</CardTitle>
              <CardDescription>Most worked on tasks this {period}</CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsByTask.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  No task data available
                </div>
              ) : (
                <div className="space-y-4">
                  {sessionsByTask.map((task, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-8 text-center font-semibold text-muted-foreground">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{task.name}</span>
                          <span className="text-sm text-muted-foreground">{task.count} sessions</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{
                              width: `${(task.count / sessionsByTask[0].count) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
