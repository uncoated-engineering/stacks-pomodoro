import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useReports } from '@/hooks/useReports';
import { useProjects } from '@/hooks/useProjects';
import { Clock, Target, TrendingUp, Calendar, Flame, ListChecks, BarChart3, PieChart, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

interface ReportsProps {
  className?: string;
}

export function Reports({ className }: ReportsProps) {
  const {
    activitySummary,
    taskWorkHistory,
    getWeekFocusHours,
    getMonthFocusHours,
    getYearFocusHours,
    getTodayFocusHours,
    focusHours,
    isLoading,
  } = useReports();
  const { projects } = useProjects();
  const [chartDialogOpen, setChartDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Prepare data for focus time trend chart (last 14 days)
  const focusTrendData = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dateKey = format(date, 'yyyy-MM-dd');
    return {
      date: format(date, 'MMM dd'),
      minutes: focusHours.daily[dateKey] || 0,
    };
  });

  // Prepare data for session completion pie chart
  const sessionCompletionData = [
    { name: 'Completed', value: activitySummary.completedSessions, color: '#10b981' },
    { name: 'Incomplete', value: activitySummary.totalSessions - activitySummary.completedSessions, color: '#ef4444' },
  ];

  // Prepare data for weekly activity bar chart (last 7 days)
  const weeklyActivityData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateKey = format(date, 'yyyy-MM-dd');
    return {
      day: format(date, 'EEE'),
      minutes: focusHours.daily[dateKey] || 0,
    };
  });

  // Prepare data for project distribution pie chart
  const projectDistributionData = projects.map((project) => {
    const projectTime = taskWorkHistory
      .filter((task) => task.projectId === project.id)
      .reduce((acc, task) => acc + task.totalTime, 0);
    return {
      name: project.title,
      value: projectTime,
      color: project.color || '#8b5cf6',
    };
  }).filter((p) => p.value > 0);

  const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

  const StatCard = ({
    title,
    value,
    unit,
    icon: Icon,
    description,
  }: {
    title: string;
    value: number;
    unit: string;
    icon: React.ElementType;
    description?: string;
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{value}</span>
              <span className="text-sm text-muted-foreground">{unit}</span>
            </div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity Summary</CardTitle>
              <CardDescription>Your overall pomodoro statistics</CardDescription>
            </div>
            <Dialog open={chartDialogOpen} onOpenChange={setChartDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Charts
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Visual Analytics</DialogTitle>
                  <DialogDescription>
                    Explore your productivity data with interactive charts
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="trend" className="w-full mt-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="trend">
                      <LineChart className="mr-2 h-4 w-4" />
                      Trend
                    </TabsTrigger>
                    <TabsTrigger value="weekly">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Weekly
                    </TabsTrigger>
                    <TabsTrigger value="completion">
                      <PieChart className="mr-2 h-4 w-4" />
                      Completion
                    </TabsTrigger>
                    {projectDistributionData.length > 0 && (
                      <TabsTrigger value="projects">
                        <Target className="mr-2 h-4 w-4" />
                        Projects
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="trend" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Focus Time Trend (Last 14 Days)</CardTitle>
                        <CardDescription>Track your daily focus time over the past two weeks</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsLineChart data={focusTrendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="minutes"
                              stroke="#8b5cf6"
                              strokeWidth={2}
                              name="Focus Time"
                              dot={{ fill: '#8b5cf6' }}
                            />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="weekly" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Weekly Activity (Last 7 Days)</CardTitle>
                        <CardDescription>Your focus time distribution across the week</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsBarChart data={weeklyActivityData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="minutes" fill="#3b82f6" name="Focus Time" />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="completion" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Session Completion Rate</CardTitle>
                        <CardDescription>Ratio of completed to incomplete sessions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsPieChart>
                            <Pie
                              data={sessionCompletionData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {sessionCompletionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-green-500">{activitySummary.completedSessions}</p>
                            <p className="text-sm text-muted-foreground">Completed Sessions</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-red-500">
                              {activitySummary.totalSessions - activitySummary.completedSessions}
                            </p>
                            <p className="text-sm text-muted-foreground">Incomplete Sessions</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {projectDistributionData.length > 0 && (
                    <TabsContent value="projects" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Time Distribution by Project</CardTitle>
                          <CardDescription>How your time is distributed across different projects</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <RechartsPieChart>
                              <Pie
                                data={projectDistributionData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {projectDistributionData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => `${value} min`} />
                              <Legend />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                          <div className="mt-4 space-y-2">
                            {projectDistributionData.map((project, index) => (
                              <div key={index} className="flex items-center justify-between p-2 rounded-lg border">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: project.color || CHART_COLORS[index % CHART_COLORS.length] }}
                                  />
                                  <span className="font-medium">{project.name}</span>
                                </div>
                                <span className="text-muted-foreground">{project.value} min</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Sessions</span>
            </div>
            <p className="text-2xl font-bold">{activitySummary.totalSessions}</p>
            <p className="text-xs text-muted-foreground">
              {activitySummary.completedSessions} completed
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Focus Time</span>
            </div>
            <p className="text-2xl font-bold">{activitySummary.totalFocusTime}</p>
            <p className="text-xs text-muted-foreground">minutes</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tasks Completed</span>
            </div>
            <p className="text-2xl font-bold">{activitySummary.tasksCompleted}</p>
            <p className="text-xs text-muted-foreground">total</p>
          </div>
        </CardContent>
      </Card>

      {activitySummary.currentStreak > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-500/10 p-3">
                  <Flame className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold">{activitySummary.currentStreak} days</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                Keep it up!
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Focus Hours</CardTitle>
          <CardDescription>Time spent in focused work sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="week" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="space-y-4 pt-4">
              <StatCard
                title="Today's Focus Time"
                value={getTodayFocusHours()}
                unit="minutes"
                icon={Calendar}
                description="Time spent focusing today"
              />
            </TabsContent>

            <TabsContent value="week" className="space-y-4 pt-4">
              <StatCard
                title="This Week's Focus Time"
                value={getWeekFocusHours()}
                unit="minutes"
                icon={Calendar}
                description={`${(getWeekFocusHours() / 60).toFixed(1)} hours total`}
              />
            </TabsContent>

            <TabsContent value="month" className="space-y-4 pt-4">
              <StatCard
                title="This Month's Focus Time"
                value={getMonthFocusHours()}
                unit="minutes"
                icon={Calendar}
                description={`${(getMonthFocusHours() / 60).toFixed(1)} hours total`}
              />
            </TabsContent>

            <TabsContent value="year" className="space-y-4 pt-4">
              <StatCard
                title="This Year's Focus Time"
                value={getYearFocusHours()}
                unit="minutes"
                icon={Calendar}
                description={`${(getYearFocusHours() / 60).toFixed(1)} hours total`}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            Task Work History
          </CardTitle>
          <CardDescription>Time spent and pomodoros completed per task</CardDescription>
        </CardHeader>
        <CardContent>
          {taskWorkHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No task work history yet. Start a timer with a task selected to track your progress!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {taskWorkHistory.map((taskHistory) => {
                const project = projects.find((p) => p.id === taskHistory.projectId);
                const hours = Math.floor(taskHistory.totalTime / 60);
                const minutes = taskHistory.totalTime % 60;
                const timeDisplay = hours > 0
                  ? `${hours}h ${minutes}m`
                  : `${minutes}m`;

                return (
                  <div
                    key={taskHistory.taskId}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{taskHistory.taskTitle}</h4>
                        {project && (
                          <Badge
                            variant="outline"
                            style={{ borderColor: project.color, color: project.color }}
                          >
                            {project.title}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeDisplay}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {taskHistory.pomodoros} pomodoro{taskHistory.pomodoros !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold">{taskHistory.totalSessions}</div>
                      <div className="text-xs text-muted-foreground">session{taskHistory.totalSessions !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
