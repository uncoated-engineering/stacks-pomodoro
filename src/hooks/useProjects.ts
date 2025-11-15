import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import type { Project } from '@/types/pomodoro';
import type { NostrEvent } from '@nostrify/nostrify';

function parseProject(event: NostrEvent): Project {
  const id = event.tags.find(([name]) => name === 'd')?.[1] || '';
  const title = event.tags.find(([name]) => name === 'title')?.[1] || 'Untitled Project';
  const color = event.tags.find(([name]) => name === 'color')?.[1];
  const created = parseInt(event.tags.find(([name]) => name === 'created')?.[1] || String(event.created_at));

  return {
    id,
    title,
    color,
    created,
    description: event.content || undefined,
    event,
  };
}

export function useProjects() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { mutateAsync: publishEvent } = useNostrPublish();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', user?.pubkey],
    queryFn: async (c) => {
      if (!user) return [];

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query(
        [
          {
            kinds: [30100],
            authors: [user.pubkey],
          },
        ],
        { signal }
      );

      return events.map(parseProject).sort((a, b) => b.created - a.created);
    },
    enabled: !!user,
  });

  const createProject = useMutation({
    mutationFn: async (data: { title: string; color?: string; description?: string }) => {
      if (!user) throw new Error('User not logged in');

      const id = `project-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const tags: string[][] = [
        ['d', id],
        ['title', data.title],
        ['created', String(Math.floor(Date.now() / 1000))],
      ];

      if (data.color) {
        tags.push(['color', data.color]);
      }

      await publishEvent({
        kind: 30100,
        tags,
        content: data.description || '',
      });

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.pubkey] });
    },
  });

  const updateProject = useMutation({
    mutationFn: async (data: { id: string; title?: string; color?: string; description?: string }) => {
      if (!user) throw new Error('User not logged in');

      const project = projects.find((p) => p.id === data.id);
      if (!project) throw new Error('Project not found');

      const tags: string[][] = [
        ['d', data.id],
        ['title', data.title || project.title],
        ['created', String(project.created)],
      ];

      const color = data.color !== undefined ? data.color : project.color;
      if (color) {
        tags.push(['color', color]);
      }

      await publishEvent({
        kind: 30100,
        tags,
        content: data.description !== undefined ? data.description : project.description || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.pubkey] });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      if (!user) throw new Error('User not logged in');

      // Delete by publishing an empty event with same d tag
      await publishEvent({
        kind: 30100,
        tags: [
          ['d', projectId],
          ['title', ''],
        ],
        content: '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.pubkey] });
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.pubkey] });
    },
  });

  return {
    projects,
    isLoading,
    createProject: createProject.mutateAsync,
    updateProject: updateProject.mutateAsync,
    deleteProject: deleteProject.mutateAsync,
    isCreating: createProject.isPending,
    isUpdating: updateProject.isPending,
    isDeleting: deleteProject.isPending,
  };
}
