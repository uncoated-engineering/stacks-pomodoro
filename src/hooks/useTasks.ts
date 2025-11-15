import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { parseTask } from '@/lib/pomodoro-utils';
import { POMODORO_KINDS, type PomodoroTask } from '@/lib/pomodoro-types';

export interface UseTasksOptions {
  projectNaddr?: string;
  includeCompleted?: boolean;
}

export function useTasks(options: UseTasksOptions = {}) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['pomodoro-tasks', user?.pubkey, options],
    queryFn: async (c) => {
      if (!user) {
        return [];
      }

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(2000)]);

      const filter: any = {
        kinds: [POMODORO_KINDS.TASK],
        authors: [user.pubkey],
      };

      if (options.projectNaddr) {
        filter['#project'] = [options.projectNaddr];
      }

      const events = await nostr.query([filter], { signal });

      let tasks = events
        .map(parseTask)
        .filter((t): t is PomodoroTask => t !== null);

      // Filter out completed tasks unless requested
      if (!options.includeCompleted) {
        tasks = tasks.filter(t => !t.completed);
      }

      // Sort by order, then by createdAt
      tasks.sort((a, b) => {
        if (a.order !== b.order) {
          return (a.order ?? 999999) - (b.order ?? 999999);
        }
        return a.createdAt - b.createdAt;
      });

      return tasks;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}
