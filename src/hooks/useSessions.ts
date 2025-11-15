import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { parseSession } from '@/lib/pomodoro-utils';
import { POMODORO_KINDS, type PomodoroSession } from '@/lib/pomodoro-types';

export interface UseSessionsOptions {
  limit?: number;
  since?: number;
  until?: number;
  taskNaddr?: string;
  projectNaddr?: string;
}

export function useSessions(options: UseSessionsOptions = {}) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['pomodoro-sessions', user?.pubkey, options],
    queryFn: async (c) => {
      if (!user) {
        return [];
      }

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(2000)]);

      const filter: any = {
        kinds: [POMODORO_KINDS.SESSION],
        authors: [user.pubkey],
        limit: options.limit ?? 100,
      };

      if (options.since) {
        filter.since = options.since;
      }

      if (options.until) {
        filter.until = options.until;
      }

      if (options.taskNaddr) {
        filter['#task'] = [options.taskNaddr];
      }

      if (options.projectNaddr) {
        filter['#project'] = [options.projectNaddr];
      }

      const events = await nostr.query([filter], { signal });

      const sessions = events
        .map(parseSession)
        .filter((s): s is PomodoroSession => s !== null)
        .sort((a, b) => b.completedAt - a.completedAt);

      return sessions;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}
