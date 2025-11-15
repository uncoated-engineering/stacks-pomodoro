import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from './useNostrPublish';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import {
  createSessionEvent,
  createSettingsEvent,
  createTaskEvent,
  createProjectEvent,
  updateTaskEvent,
  updateProjectEvent,
  type CreateSessionParams,
  type CreateTaskParams,
  type CreateProjectParams,
} from '@/lib/pomodoro-utils';
import type { PomodoroSettings, PomodoroTask, PomodoroProject } from '@/lib/pomodoro-types';

// Publish a completed pomodoro session
export function usePublishSession() {
  const { mutate: publish } = useNostrPublish();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: CreateSessionParams) => {
      if (!user) {
        throw new Error('User not logged in');
      }

      const event = createSessionEvent(params);
      publish(event);

      return params;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-sessions', user?.pubkey] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to save session: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

// Update settings
export function useUpdateSettings() {
  const { mutate: publish } = useNostrPublish();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: Omit<PomodoroSettings, 'author' | 'event'>) => {
      if (!user) {
        throw new Error('User not logged in');
      }

      const event = createSettingsEvent(settings);
      publish(event);

      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-settings', user?.pubkey] });
      toast({
        title: 'Settings saved',
        description: 'Your pomodoro settings have been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to save settings: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

// Create a new task
export function useCreateTask() {
  const { mutate: publish } = useNostrPublish();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: CreateTaskParams) => {
      if (!user) {
        throw new Error('User not logged in');
      }

      const event = createTaskEvent(params);
      publish(event);

      return params;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-tasks', user?.pubkey] });
      toast({
        title: 'Task created',
        description: 'Your task has been added.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create task: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

// Update an existing task
export function useUpdateTask() {
  const { mutate: publish } = useNostrPublish();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ task, updates }: { task: PomodoroTask; updates: Partial<CreateTaskParams> }) => {
      if (!user) {
        throw new Error('User not logged in');
      }

      const event = updateTaskEvent(task, updates);
      publish(event);

      return { task, updates };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-tasks', user?.pubkey] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update task: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

// Complete a task
export function useCompleteTask() {
  const { mutate: publish } = useNostrPublish();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (task: PomodoroTask) => {
      if (!user) {
        throw new Error('User not logged in');
      }

      const event = updateTaskEvent(task, {
        completed: true,
        completedAt: Math.floor(Date.now() / 1000),
      });
      publish(event);

      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-tasks', user?.pubkey] });
      toast({
        title: 'Task completed',
        description: 'Great job! Task marked as complete.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to complete task: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

// Create a new project
export function useCreateProject() {
  const { mutate: publish } = useNostrPublish();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: CreateProjectParams) => {
      if (!user) {
        throw new Error('User not logged in');
      }

      const event = createProjectEvent(params);
      publish(event);

      return params;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-projects', user?.pubkey] });
      toast({
        title: 'Project created',
        description: 'Your project has been added.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create project: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

// Update an existing project
export function useUpdateProject() {
  const { mutate: publish } = useNostrPublish();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ project, updates }: { project: PomodoroProject; updates: Partial<CreateProjectParams> }) => {
      if (!user) {
        throw new Error('User not logged in');
      }

      const event = updateProjectEvent(project, updates);
      publish(event);

      return { project, updates };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-projects', user?.pubkey] });
      toast({
        title: 'Project updated',
        description: 'Your project has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update project: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}
