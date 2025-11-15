import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import type { Task, TaskStatus } from '@/types/pomodoro';
import type { NostrEvent } from '@nostrify/nostrify';

function parseTask(event: NostrEvent): Task {
  const id = event.tags.find(([name]) => name === 'd')?.[1] || '';
  const title = event.tags.find(([name]) => name === 'title')?.[1] || 'Untitled Task';
  const projectId = event.tags.find(([name]) => name === 'project')?.[1];
  const status = (event.tags.find(([name]) => name === 'status')?.[1] || 'todo') as TaskStatus;
  const pomodoros = parseInt(event.tags.find(([name]) => name === 'pomodoros')?.[1] || '0');
  const estimatedPomodoros = event.tags.find(([name]) => name === 'estimatedPomodoros')?.[1];
  const created = parseInt(event.tags.find(([name]) => name === 'created')?.[1] || String(event.created_at));
  const completed = event.tags.find(([name]) => name === 'completed')?.[1];

  return {
    id,
    title,
    projectId,
    status,
    pomodoros,
    estimatedPomodoros: estimatedPomodoros ? parseInt(estimatedPomodoros) : undefined,
    created,
    completed: completed ? parseInt(completed) : undefined,
    description: event.content || undefined,
    event,
  };
}

export function useTasks(projectId?: string) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { mutateAsync: publishEvent } = useNostrPublish();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', user?.pubkey, projectId],
    queryFn: async (c) => {
      if (!user) return [];

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      const filter = projectId
        ? {
            kinds: [30101],
            authors: [user.pubkey],
            '#project': [projectId],
          }
        : {
            kinds: [30101],
            authors: [user.pubkey],
          };

      const events = await nostr.query([filter], { signal });

      return events.map(parseTask).sort((a, b) => {
        // Sort by status (todo, in-progress, completed) then by creation date
        const statusOrder = { 'todo': 0, 'in-progress': 1, 'completed': 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        return b.created - a.created;
      });
    },
    enabled: !!user,
  });

  const createTask = useMutation({
    mutationFn: async (data: {
      title: string;
      projectId?: string;
      estimatedPomodoros?: number;
      description?: string;
    }) => {
      if (!user) throw new Error('User not logged in');

      const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const tags: string[][] = [
        ['d', id],
        ['title', data.title],
        ['status', 'todo'],
        ['pomodoros', '0'],
        ['created', String(Math.floor(Date.now() / 1000))],
      ];

      if (data.projectId) {
        tags.push(['project', data.projectId]);
      }

      if (data.estimatedPomodoros) {
        tags.push(['estimatedPomodoros', String(data.estimatedPomodoros)]);
      }

      await publishEvent({
        kind: 30101,
        tags,
        content: data.description || '',
      });

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.pubkey] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async (data: {
      id: string;
      title?: string;
      projectId?: string;
      status?: TaskStatus;
      pomodoros?: number;
      estimatedPomodoros?: number;
      description?: string;
    }) => {
      if (!user) throw new Error('User not logged in');

      const task = tasks.find((t) => t.id === data.id);
      if (!task) throw new Error('Task not found');

      const tags: string[][] = [
        ['d', data.id],
        ['title', data.title !== undefined ? data.title : task.title],
        ['status', data.status !== undefined ? data.status : task.status],
        ['pomodoros', String(data.pomodoros !== undefined ? data.pomodoros : task.pomodoros)],
        ['created', String(task.created)],
      ];

      const projectId = data.projectId !== undefined ? data.projectId : task.projectId;
      if (projectId) {
        tags.push(['project', projectId]);
      }

      const estimatedPomodoros = data.estimatedPomodoros !== undefined ? data.estimatedPomodoros : task.estimatedPomodoros;
      if (estimatedPomodoros) {
        tags.push(['estimatedPomodoros', String(estimatedPomodoros)]);
      }

      // Add completed timestamp if status is changing to completed
      if (data.status === 'completed' && task.status !== 'completed') {
        tags.push(['completed', String(Math.floor(Date.now() / 1000))]);
      } else if (task.completed && data.status !== 'completed') {
        // Remove completed timestamp if status is changing from completed
        // (don't add the tag)
      } else if (task.completed) {
        tags.push(['completed', String(task.completed)]);
      }

      await publishEvent({
        kind: 30101,
        tags,
        content: data.description !== undefined ? data.description : task.description || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.pubkey] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      if (!user) throw new Error('User not logged in');

      // Delete by publishing an empty event with same d tag
      await publishEvent({
        kind: 30101,
        tags: [
          ['d', taskId],
          ['title', ''],
          ['status', 'todo'],
          ['pomodoros', '0'],
        ],
        content: '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.pubkey] });
    },
  });

  const incrementTaskPomodoros = useMutation({
    mutationFn: async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) throw new Error('Task not found');

      return updateTask.mutateAsync({
        id: taskId,
        pomodoros: task.pomodoros + 1,
      });
    },
  });

  return {
    tasks,
    isLoading,
    createTask: createTask.mutateAsync,
    updateTask: updateTask.mutateAsync,
    deleteTask: deleteTask.mutateAsync,
    incrementTaskPomodoros: incrementTaskPomodoros.mutateAsync,
    isCreating: createTask.isPending,
    isUpdating: updateTask.isPending,
    isDeleting: deleteTask.isPending,
  };
}
