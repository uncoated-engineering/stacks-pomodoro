import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { parseSettings } from '@/lib/pomodoro-utils';
import { POMODORO_KINDS, DEFAULT_SETTINGS, type PomodoroSettings } from '@/lib/pomodoro-types';

export function useSettings() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['pomodoro-settings', user?.pubkey],
    queryFn: async (c) => {
      if (!user) {
        return { ...DEFAULT_SETTINGS, author: '' };
      }

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(1500)]);
      const events = await nostr.query(
        [{ kinds: [POMODORO_KINDS.SETTINGS], authors: [user.pubkey], limit: 1 }],
        { signal }
      );

      if (events.length === 0) {
        return { ...DEFAULT_SETTINGS, author: user.pubkey };
      }

      return parseSettings(events[0], user.pubkey);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
