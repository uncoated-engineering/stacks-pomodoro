import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import type { PomodoroSettings } from '@/types/pomodoro';
import { DEFAULT_SETTINGS } from '@/types/pomodoro';

export function usePomodoroSettings() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { mutateAsync: publishEvent } = useNostrPublish();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['pomodoro-settings', user?.pubkey],
    queryFn: async (c) => {
      if (!user) return DEFAULT_SETTINGS;

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query(
        [
          {
            kinds: [30078],
            authors: [user.pubkey],
            '#d': ['pomodoro-settings'],
            limit: 1,
          },
        ],
        { signal }
      );

      if (events.length === 0) return DEFAULT_SETTINGS;

      try {
        const content = JSON.parse(events[0].content);
        // Deep merge to ensure shortcuts are properly merged with defaults
        return {
          ...DEFAULT_SETTINGS,
          ...content,
          shortcuts: {
            ...DEFAULT_SETTINGS.shortcuts,
            ...content.shortcuts,
          },
        } as PomodoroSettings;
      } catch {
        return DEFAULT_SETTINGS;
      }
    },
    enabled: !!user,
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<PomodoroSettings>) => {
      if (!user) throw new Error('User not logged in');

      const mergedSettings = { ...DEFAULT_SETTINGS, ...settings, ...newSettings };

      await publishEvent({
        kind: 30078,
        tags: [['d', 'pomodoro-settings']],
        content: JSON.stringify(mergedSettings),
      });

      return mergedSettings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['pomodoro-settings', user?.pubkey], data);
    },
  });

  return {
    settings: settings || DEFAULT_SETTINGS,
    isLoading,
    updateSettings: updateSettings.mutateAsync,
    isUpdating: updateSettings.isPending,
  };
}
