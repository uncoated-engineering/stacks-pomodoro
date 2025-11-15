import { useMemo } from 'react';
import { useSessions } from './useSessions';
import { useTasks } from './useTasks';
import type { ActivitySummary, FocusHours } from '@/types/pomodoro';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, format } from 'date-fns';

export function useReports() {
  const { sessions, isLoading: isLoadingSessions } = useSessions(1000); // Get more sessions for better analytics
  const { tasks, isLoading: isLoadingTasks } = useTasks();

  const activitySummary = useMemo<ActivitySummary>(() => {
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.completed).length;
    const totalFocusTime = sessions
      .filter((s) => s.sessionType === 'work' && s.completed)
      .reduce((acc, s) => acc + s.duration / 60, 0);
    const totalBreakTime = sessions
      .filter((s) => s.sessionType !== 'work' && s.completed)
      .reduce((acc, s) => acc + s.duration / 60, 0);
    const tasksCompleted = tasks.filter((t) => t.status === 'completed').length;

    // Calculate current streak (consecutive days with at least one completed session)
    const workSessions = sessions
      .filter((s) => s.sessionType === 'work' && s.completed)
      .sort((a, b) => b.timestamp - a.timestamp);

    let currentStreak = 0;
    const today = startOfDay(new Date());
    const sessionDates = new Set(
      workSessions.map((s) => format(startOfDay(new Date(s.timestamp * 1000)), 'yyyy-MM-dd'))
    );

    let checkDate = today;
    while (sessionDates.has(format(checkDate, 'yyyy-MM-dd'))) {
      currentStreak++;
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000); // Go back one day
    }

    return {
      totalSessions,
      completedSessions,
      totalFocusTime: Math.round(totalFocusTime),
      totalBreakTime: Math.round(totalBreakTime),
      tasksCompleted,
      currentStreak,
    };
  }, [sessions, tasks]);

  const focusHours = useMemo<FocusHours>(() => {
    const daily: Record<string, number> = {};
    const weekly: Record<string, number> = {};
    const monthly: Record<string, number> = {};
    const yearly: Record<string, number> = {};

    const workSessions = sessions.filter((s) => s.sessionType === 'work' && s.completed);

    workSessions.forEach((session) => {
      const date = new Date(session.timestamp * 1000);
      const minutes = session.duration / 60;

      // Daily
      const dayKey = format(date, 'yyyy-MM-dd');
      daily[dayKey] = (daily[dayKey] || 0) + minutes;

      // Weekly (starting Monday)
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      weekly[weekKey] = (weekly[weekKey] || 0) + minutes;

      // Monthly
      const monthKey = format(startOfMonth(date), 'yyyy-MM');
      monthly[monthKey] = (monthly[monthKey] || 0) + minutes;

      // Yearly
      const yearKey = format(startOfYear(date), 'yyyy');
      yearly[yearKey] = (yearly[yearKey] || 0) + minutes;
    });

    return { daily, weekly, monthly, yearly };
  }, [sessions]);

  const getWeekFocusHours = (): number => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekKey = format(weekStart, 'yyyy-MM-dd');
    return Math.round(focusHours.weekly[weekKey] || 0);
  };

  const getMonthFocusHours = (): number => {
    const monthKey = format(startOfMonth(new Date()), 'yyyy-MM');
    return Math.round(focusHours.monthly[monthKey] || 0);
  };

  const getYearFocusHours = (): number => {
    const yearKey = format(startOfYear(new Date()), 'yyyy');
    return Math.round(focusHours.yearly[yearKey] || 0);
  };

  const getTodayFocusHours = (): number => {
    const dayKey = format(new Date(), 'yyyy-MM-dd');
    return Math.round(focusHours.daily[dayKey] || 0);
  };

  return {
    activitySummary,
    focusHours,
    getWeekFocusHours,
    getMonthFocusHours,
    getYearFocusHours,
    getTodayFocusHours,
    isLoading: isLoadingSessions || isLoadingTasks,
  };
}
