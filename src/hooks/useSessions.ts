import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import type { PomodoroSession, SessionType } from '@/types/pomodoro';
import type { NostrEvent } from '@nostrify/nostrify';

function parseSession(event: NostrEvent): PomodoroSession {
  const sessionType = event.tags.find(([name]) => name === 'session-type')?.[1] as SessionType || 'work';
  const duration = parseInt(event.tags.find(([name]) => name === 'duration')?.[1] || '0');
  const taskId = event.tags.find(([name]) => name === 'task')?.[1];
  const projectId = event.tags.find(([name]) => name === 'project')?.[1];
  const completed = event.tags.find(([name]) => name === 'completed')?.[1] === 'true';

  return {
    id: event.id,
    sessionType,
    duration,
    taskId,
    projectId,
    completed,
    notes: event.content || undefined,
    timestamp: event.created_at,
    event,
  };
}

export function useSessions(limit = 100) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { mutateAsync: publishEvent } = useNostrPublish();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions', user?.pubkey, limit],
    queryFn: async (c) => {
      if (!user) return [];

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query(
        [
          {
            kinds: [1100],
            authors: [user.pubkey],
            limit,
          },
        ],
        { signal }
      );

      return events.map(parseSession).sort((a, b) => b.timestamp - a.timestamp);
    },
    enabled: !!user,
  });

  const createSession = useMutation({
    mutationFn: async (data: {
      sessionType: SessionType;
      duration: number;
      taskId?: string;
      projectId?: string;
      completed: boolean;
      notes?: string;
    }) => {
      if (!user) throw new Error('User not logged in');

      const tags: string[][] = [
        ['session-type', data.sessionType],
        ['duration', String(data.duration)],
        ['completed', String(data.completed)],
      ];

      if (data.taskId) {
        tags.push(['task', data.taskId]);
      }

      if (data.projectId) {
        tags.push(['project', data.projectId]);
      }

      // Get task title for alt tag
      let altDescription = `${data.completed ? 'Completed' : 'Interrupted'} ${data.duration / 60}-minute ${data.sessionType.replace('-', ' ')} session`;

      if (data.taskId) {
        // We could fetch the task here, but to keep it simple, we'll just use the task ID
        altDescription += ` on task ${data.taskId}`;
      }

      tags.push(['alt', altDescription]);

      await publishEvent({
        kind: 1100,
        tags,
        content: data.notes || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', user?.pubkey] });
    },
  });

  return {
    sessions,
    isLoading,
    createSession: createSession.mutateAsync,
    isCreating: createSession.isPending,
  };
}
