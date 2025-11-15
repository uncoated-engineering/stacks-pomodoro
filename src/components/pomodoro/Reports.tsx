import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useReports } from '@/hooks/useReports';
import { Clock, Target, TrendingUp, Calendar, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportsProps {
  className?: string;
}

export function Reports({ className }: ReportsProps) {
  const {
    activitySummary,
    getWeekFocusHours,
    getMonthFocusHours,
    getYearFocusHours,
    getTodayFocusHours,
    isLoading,
  } = useReports();

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

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
          <CardTitle>Activity Summary</CardTitle>
          <CardDescription>Your overall pomodoro statistics</CardDescription>
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
    </div>
  );
}
