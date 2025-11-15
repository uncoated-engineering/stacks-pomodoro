import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { parseProject } from '@/lib/pomodoro-utils';
import { POMODORO_KINDS, type PomodoroProject } from '@/lib/pomodoro-types';

export function useProjects() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['pomodoro-projects', user?.pubkey],
    queryFn: async (c) => {
      if (!user) {
        return [];
      }

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(2000)]);

      const events = await nostr.query(
        [{ kinds: [POMODORO_KINDS.PROJECT], authors: [user.pubkey] }],
        { signal }
      );

      const projects = events
        .map(parseProject)
        .filter((p): p is PomodoroProject => p !== null);

      // Sort by order, then by createdAt
      projects.sort((a, b) => {
        if (a.order !== b.order) {
          return (a.order ?? 999999) - (b.order ?? 999999);
        }
        return a.createdAt - b.createdAt;
      });

      return projects;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
