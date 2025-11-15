import type { NostrEvent } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';
import type {
  PomodoroSession,
  PomodoroSettings,
  PomodoroTask,
  PomodoroProject,
  SessionType,
  KeyboardShortcuts,
} from './pomodoro-types';
import { DEFAULT_SETTINGS } from './pomodoro-types';

// Helper to get tag value
function getTagValue(event: NostrEvent, tagName: string): string | undefined {
  return event.tags.find(([name]) => name === tagName)?.[1];
}

// Helper to get all tag values
function getTagValues(event: NostrEvent, tagName: string): string[] {
  return event.tags.filter(([name]) => name === tagName).map(([_, value]) => value);
}

// Parse Pomodoro Session from Nostr Event
export function parseSession(event: NostrEvent): PomodoroSession | null {
  if (event.kind !== 3100) return null;

  const sessionType = getTagValue(event, 'session_type') as SessionType;
  const duration = getTagValue(event, 'duration');
  const startedAt = getTagValue(event, 'started_at');
  const completedAt = getTagValue(event, 'completed_at');

  if (!sessionType || !duration || !startedAt || !completedAt) {
    return null;
  }

  return {
    id: event.id,
    sessionType,
    duration: parseInt(duration, 10),
    startedAt: parseInt(startedAt, 10),
    completedAt: parseInt(completedAt, 10),
    taskNaddr: getTagValue(event, 'task'),
    projectNaddr: getTagValue(event, 'project'),
    notes: getTagValue(event, 'notes'),
    author: event.pubkey,
    event,
  };
}

// Parse Pomodoro Settings from Nostr Event
export function parseSettings(event: NostrEvent, userPubkey: string): PomodoroSettings {
  if (event.kind !== 10100) {
    return { ...DEFAULT_SETTINGS, author: userPubkey };
  }

  const shortcutsStr = getTagValue(event, 'shortcuts');
  let shortcuts: KeyboardShortcuts | undefined;

  if (shortcutsStr) {
    try {
      shortcuts = JSON.parse(shortcutsStr);
    } catch (e) {
      shortcuts = DEFAULT_SETTINGS.shortcuts;
    }
  }

  return {
    pomodoroDuration: parseInt(getTagValue(event, 'pomodoro_duration') ?? '1500', 10),
    shortBreakDuration: parseInt(getTagValue(event, 'short_break_duration') ?? '300', 10),
    longBreakDuration: parseInt(getTagValue(event, 'long_break_duration') ?? '900', 10),
    longBreakInterval: parseInt(getTagValue(event, 'long_break_interval') ?? '4', 10),
    autoStartBreaks: getTagValue(event, 'auto_start_breaks') === 'true',
    autoStartPomodoros: getTagValue(event, 'auto_start_pomodoros') === 'true',
    notificationSound: getTagValue(event, 'notification_sound') !== 'false',
    notificationVolume: parseInt(getTagValue(event, 'notification_volume') ?? '50', 10),
    theme: getTagValue(event, 'theme') ?? 'default',
    shortcuts: shortcuts ?? DEFAULT_SETTINGS.shortcuts,
    author: event.pubkey,
    event,
  };
}

// Parse Pomodoro Task from Nostr Event
export function parseTask(event: NostrEvent): PomodoroTask | null {
  if (event.kind !== 30100) return null;

  const d = getTagValue(event, 'd');
  const title = getTagValue(event, 'title');
  const createdAtStr = getTagValue(event, 'created_at_timestamp');

  if (!d || !title || !createdAtStr) {
    return null;
  }

  // Generate naddr for this task
  const naddr = nip19.naddrEncode({
    kind: event.kind,
    pubkey: event.pubkey,
    identifier: d,
  });

  const completedAtStr = getTagValue(event, 'completed_at');

  return {
    id: d,
    naddr,
    title,
    projectNaddr: getTagValue(event, 'project'),
    estimatedPomodoros: parseInt(getTagValue(event, 'estimated_pomodoros') ?? '0', 10) || undefined,
    completedPomodoros: parseInt(getTagValue(event, 'completed_pomodoros') ?? '0', 10),
    completed: getTagValue(event, 'completed') === 'true',
    completedAt: completedAtStr ? parseInt(completedAtStr, 10) : undefined,
    createdAt: parseInt(createdAtStr, 10),
    order: parseInt(getTagValue(event, 'order') ?? '999999', 10),
    author: event.pubkey,
    event,
  };
}

// Parse Pomodoro Project from Nostr Event
export function parseProject(event: NostrEvent): PomodoroProject | null {
  if (event.kind !== 30101) return null;

  const d = getTagValue(event, 'd');
  const name = getTagValue(event, 'name');
  const createdAtStr = getTagValue(event, 'created_at_timestamp');

  if (!d || !name || !createdAtStr) {
    return null;
  }

  // Generate naddr for this project
  const naddr = nip19.naddrEncode({
    kind: event.kind,
    pubkey: event.pubkey,
    identifier: d,
  });

  return {
    id: d,
    naddr,
    name,
    color: getTagValue(event, 'color'),
    createdAt: parseInt(createdAtStr, 10),
    order: parseInt(getTagValue(event, 'order') ?? '999999', 10),
    author: event.pubkey,
    event,
  };
}

// Create Session Event Template
export interface CreateSessionParams {
  sessionType: SessionType;
  duration: number;
  startedAt: number;
  completedAt: number;
  taskNaddr?: string;
  projectNaddr?: string;
  notes?: string;
}

export function createSessionEvent(params: CreateSessionParams) {
  const tags: string[][] = [
    ['session_type', params.sessionType],
    ['duration', params.duration.toString()],
    ['started_at', params.startedAt.toString()],
    ['completed_at', params.completedAt.toString()],
    ['alt', `Completed a ${params.sessionType.replace('_', ' ')} session`],
  ];

  if (params.taskNaddr) {
    tags.push(['task', params.taskNaddr]);
  }

  if (params.projectNaddr) {
    tags.push(['project', params.projectNaddr]);
  }

  if (params.notes) {
    tags.push(['notes', params.notes]);
  }

  return {
    kind: 3100,
    content: '',
    tags,
  };
}

// Create Settings Event Template
export function createSettingsEvent(settings: Omit<PomodoroSettings, 'author' | 'event'>) {
  const tags: string[][] = [
    ['pomodoro_duration', settings.pomodoroDuration.toString()],
    ['short_break_duration', settings.shortBreakDuration.toString()],
    ['long_break_duration', settings.longBreakDuration.toString()],
    ['long_break_interval', settings.longBreakInterval.toString()],
    ['auto_start_breaks', settings.autoStartBreaks.toString()],
    ['auto_start_pomodoros', settings.autoStartPomodoros.toString()],
    ['notification_sound', settings.notificationSound.toString()],
    ['notification_volume', settings.notificationVolume.toString()],
  ];

  if (settings.theme) {
    tags.push(['theme', settings.theme]);
  }

  if (settings.shortcuts) {
    tags.push(['shortcuts', JSON.stringify(settings.shortcuts)]);
  }

  return {
    kind: 10100,
    content: '',
    tags,
  };
}

// Create Task Event Template
export interface CreateTaskParams {
  id: string; // UUID or unique identifier
  title: string;
  projectNaddr?: string;
  estimatedPomodoros?: number;
  completedPomodoros?: number;
  completed?: boolean;
  completedAt?: number;
  order?: number;
}

export function createTaskEvent(params: CreateTaskParams) {
  const now = Math.floor(Date.now() / 1000);

  const tags: string[][] = [
    ['d', params.id],
    ['title', params.title],
    ['completed_pomodoros', (params.completedPomodoros ?? 0).toString()],
    ['completed', (params.completed ?? false).toString()],
    ['created_at_timestamp', now.toString()],
  ];

  if (params.projectNaddr) {
    tags.push(['project', params.projectNaddr]);
  }

  if (params.estimatedPomodoros !== undefined) {
    tags.push(['estimated_pomodoros', params.estimatedPomodoros.toString()]);
  }

  if (params.completedAt) {
    tags.push(['completed_at', params.completedAt.toString()]);
  }

  if (params.order !== undefined) {
    tags.push(['order', params.order.toString()]);
  }

  return {
    kind: 30100,
    content: '',
    tags,
  };
}

// Update Task Event Template (preserves created_at_timestamp)
export function updateTaskEvent(task: PomodoroTask, updates: Partial<CreateTaskParams>) {
  const params: CreateTaskParams = {
    id: task.id,
    title: updates.title ?? task.title,
    projectNaddr: updates.projectNaddr ?? task.projectNaddr,
    estimatedPomodoros: updates.estimatedPomodoros ?? task.estimatedPomodoros,
    completedPomodoros: updates.completedPomodoros ?? task.completedPomodoros,
    completed: updates.completed ?? task.completed,
    completedAt: updates.completedAt ?? task.completedAt,
    order: updates.order ?? task.order,
  };

  const event = createTaskEvent(params);

  // Preserve original created_at_timestamp
  event.tags = event.tags.map(tag =>
    tag[0] === 'created_at_timestamp' ? ['created_at_timestamp', task.createdAt.toString()] : tag
  );

  return event;
}

// Create Project Event Template
export interface CreateProjectParams {
  id: string; // UUID or unique identifier
  name: string;
  color?: string;
  order?: number;
}

export function createProjectEvent(params: CreateProjectParams) {
  const now = Math.floor(Date.now() / 1000);

  const tags: string[][] = [
    ['d', params.id],
    ['name', params.name],
    ['created_at_timestamp', now.toString()],
  ];

  if (params.color) {
    tags.push(['color', params.color]);
  }

  if (params.order !== undefined) {
    tags.push(['order', params.order.toString()]);
  }

  return {
    kind: 30101,
    content: '',
    tags,
  };
}

// Update Project Event Template (preserves created_at_timestamp)
export function updateProjectEvent(project: PomodoroProject, updates: Partial<CreateProjectParams>) {
  const params: CreateProjectParams = {
    id: project.id,
    name: updates.name ?? project.name,
    color: updates.color ?? project.color,
    order: updates.order ?? project.order,
  };

  const event = createProjectEvent(params);

  // Preserve original created_at_timestamp
  event.tags = event.tags.map(tag =>
    tag[0] === 'created_at_timestamp' ? ['created_at_timestamp', project.createdAt.toString()] : tag
  );

  return event;
}

// Format time in MM:SS format
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Format duration in human-readable format
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

// Calculate focus hours from sessions
export function calculateFocusHours(sessions: PomodoroSession[]): number {
  const focusSeconds = sessions
    .filter(s => s.sessionType === 'pomodoro')
    .reduce((total, s) => total + s.duration, 0);

  return focusSeconds / 3600; // convert to hours
}

// Group sessions by date
export function groupSessionsByDate(sessions: PomodoroSession[]): Record<string, PomodoroSession[]> {
  const grouped: Record<string, PomodoroSession[]> = {};

  sessions.forEach(session => {
    const date = new Date(session.completedAt * 1000).toISOString().split('T')[0];
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(session);
  });

  return grouped;
}

// Get sessions for a time period
export function getSessionsForPeriod(
  sessions: PomodoroSession[],
  period: 'today' | 'week' | 'month' | 'year'
): PomodoroSession[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let cutoffTime: number;

  switch (period) {
    case 'today':
      cutoffTime = Math.floor(startOfToday.getTime() / 1000);
      break;
    case 'week':
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      cutoffTime = Math.floor(startOfWeek.getTime() / 1000);
      break;
    case 'month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      cutoffTime = Math.floor(startOfMonth.getTime() / 1000);
      break;
    case 'year':
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      cutoffTime = Math.floor(startOfYear.getTime() / 1000);
      break;
  }

  return sessions.filter(s => s.completedAt >= cutoffTime);
}

// Generate UUID v4
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
