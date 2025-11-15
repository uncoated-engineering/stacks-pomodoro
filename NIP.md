# NIP-XX: Pomodoro Technique Time Management

`draft` `optional`

This NIP defines event kinds for implementing the Pomodoro Technique time management method on Nostr, enabling users to track work sessions, manage tasks, organize projects, and analyze productivity patterns.

## Event Kinds

- `3100`: Pomodoro Session (regular event)
- `10100`: Pomodoro Settings (replaceable event)
- `30100`: Pomodoro Task (addressable event)
- `30101`: Pomodoro Project (addressable event)

## Pomodoro Session (Kind 3100)

A regular event that records a completed pomodoro session. These events create a permanent history of work sessions.

```json
{
  "kind": 3100,
  "content": "",
  "tags": [
    ["session_type", "pomodoro|short_break|long_break"],
    ["duration", "<seconds>"],
    ["started_at", "<unix_timestamp>"],
    ["completed_at", "<unix_timestamp>"],
    ["task", "<task_naddr>"],
    ["project", "<project_naddr>"],
    ["notes", "<optional_session_notes>"]
  ]
}
```

### Tags

- `session_type` (required): Type of session - "pomodoro", "short_break", or "long_break"
- `duration` (required): Session duration in seconds (e.g., "1500" for 25 minutes)
- `started_at` (required): Unix timestamp when the session started
- `completed_at` (required): Unix timestamp when the session completed
- `task` (optional): naddr1 identifier of the associated task (kind 30100)
- `project` (optional): naddr1 identifier of the associated project (kind 30101)
- `notes` (optional): Free-form notes about the session

### Usage

Only completed sessions should be published. Sessions that were abandoned or cancelled should not create events.

## Pomodoro Settings (Kind 10100)

A replaceable event that stores user preferences for the pomodoro timer. Only the most recent event is kept.

```json
{
  "kind": 10100,
  "content": "",
  "tags": [
    ["pomodoro_duration", "<seconds>"],
    ["short_break_duration", "<seconds>"],
    ["long_break_duration", "<seconds>"],
    ["long_break_interval", "<number>"],
    ["auto_start_breaks", "true|false"],
    ["auto_start_pomodoros", "true|false"],
    ["notification_sound", "true|false"],
    ["notification_volume", "<0-100>"],
    ["theme", "<theme_identifier>"],
    ["shortcuts", "<json_object>"]
  ]
}
```

### Tags

- `pomodoro_duration` (required): Duration of a pomodoro session in seconds (default: 1500 = 25 minutes)
- `short_break_duration` (required): Duration of a short break in seconds (default: 300 = 5 minutes)
- `long_break_duration` (required): Duration of a long break in seconds (default: 900 = 15 minutes)
- `long_break_interval` (required): Number of pomodoros before a long break (default: 4)
- `auto_start_breaks` (required): Whether to automatically start break timers (default: "false")
- `auto_start_pomodoros` (required): Whether to automatically start pomodoro timers after breaks (default: "false")
- `notification_sound` (required): Whether to play notification sounds (default: "true")
- `notification_volume` (required): Volume level 0-100 (default: "50")
- `theme` (optional): Color theme identifier (e.g., "default", "dark", "forest", "ocean")
- `shortcuts` (optional): JSON object mapping action names to keyboard shortcuts

### Shortcuts JSON Format

```json
{
  "start_timer": "space",
  "reset_timer": "r",
  "switch_to_pomodoro": "1",
  "switch_to_short_break": "2",
  "switch_to_long_break": "3",
  "toggle_settings": "s"
}
```

## Pomodoro Task (Kind 30100)

An addressable event representing a task that can be worked on during pomodoro sessions.

```json
{
  "kind": 30100,
  "content": "",
  "tags": [
    ["d", "<task_identifier>"],
    ["title", "<task_title>"],
    ["project", "<project_naddr>"],
    ["estimated_pomodoros", "<number>"],
    ["completed_pomodoros", "<number>"],
    ["completed", "true|false"],
    ["completed_at", "<unix_timestamp>"],
    ["created_at_timestamp", "<unix_timestamp>"],
    ["order", "<number>"]
  ]
}
```

### Tags

- `d` (required): Unique identifier for the task (e.g., UUID)
- `title` (required): Task title or description
- `project` (optional): naddr1 identifier of the associated project (kind 30101)
- `estimated_pomodoros` (optional): Estimated number of pomodoros to complete the task
- `completed_pomodoros` (required): Number of pomodoros completed for this task (default: "0")
- `completed` (required): Whether the task is marked as completed (default: "false")
- `completed_at` (optional): Unix timestamp when the task was completed
- `created_at_timestamp` (required): Unix timestamp when the task was created (for sorting)
- `order` (optional): Display order within the project (lower numbers first)

### Task Updates

To update a task, publish a new event with the same `d` tag and updated field values. The most recent event replaces previous versions.

## Pomodoro Project (Kind 30101)

An addressable event representing a project that contains multiple tasks.

```json
{
  "kind": 30101,
  "content": "",
  "tags": [
    ["d", "<project_identifier>"],
    ["name", "<project_name>"],
    ["color", "<color_hex>"],
    ["created_at_timestamp", "<unix_timestamp>"],
    ["order", "<number>"]
  ]
}
```

### Tags

- `d` (required): Unique identifier for the project (e.g., UUID)
- `name` (required): Project name
- `color` (optional): Hex color code for visual identification (e.g., "#FF5733")
- `created_at_timestamp` (required): Unix timestamp when the project was created (for sorting)
- `order` (optional): Display order (lower numbers first)

### Project Updates

To update a project, publish a new event with the same `d` tag and updated field values. The most recent event replaces previous versions.

### Deleting Projects

When a project is deleted, all associated tasks should also be deleted or moved to another project. Use NIP-09 deletion events to remove projects and tasks.

## Querying Events

### Get User's Settings

```typescript
const settings = await nostr.query([
  { kinds: [10100], authors: [userPubkey], limit: 1 }
]);
```

### Get All User's Projects

```typescript
const projects = await nostr.query([
  { kinds: [30101], authors: [userPubkey] }
]);
```

### Get Tasks for a Specific Project

```typescript
const tasks = await nostr.query([
  { kinds: [30100], authors: [userPubkey], '#project': [projectNaddr] }
]);
```

### Get Recent Pomodoro Sessions

```typescript
const sessions = await nostr.query([
  { kinds: [3100], authors: [userPubkey], limit: 100 }
]);
```

### Get Sessions for a Specific Task

```typescript
const sessions = await nostr.query([
  { kinds: [3100], authors: [userPubkey], '#task': [taskNaddr] }
]);
```

### Get Sessions Within a Time Range

```typescript
const sessions = await nostr.query([
  {
    kinds: [3100],
    authors: [userPubkey],
    since: startTimestamp,
    until: endTimestamp
  }
]);
```

## Analytics and Reports

Applications can generate analytics by:

1. **Focus Hours**: Sum the `duration` of all pomodoro sessions (session_type="pomodoro") within a time range
2. **Task Progress**: Compare `completed_pomodoros` to `estimated_pomodoros` for each task
3. **Project Statistics**: Aggregate sessions by `project` tag to show time spent per project
4. **Daily Patterns**: Group sessions by day/week/month for trend analysis
5. **Completion Rates**: Calculate percentage of completed tasks vs total tasks

## Security and Privacy

- All events are signed by the user's private key
- Sessions, tasks, and projects are publicly visible by default
- Users should be aware that their productivity data is public
- Future extensions could add NIP-44 encryption for private task management

## Implementation Notes

1. Applications should validate that `completed_at` > `started_at` for sessions
2. The `completed_pomodoros` count should be incremented when a session completes
3. Applications should handle missing or malformed tags gracefully
4. Time ranges for analytics should use the `completed_at` timestamp
5. When displaying tasks, filter out events marked as `completed: "true"` unless showing completed tasks

## Examples

### Creating a Project

```json
{
  "kind": 30101,
  "content": "",
  "pubkey": "user_pubkey...",
  "created_at": 1705234567,
  "tags": [
    ["d", "550e8400-e29b-41d4-a716-446655440000"],
    ["name", "Website Redesign"],
    ["color", "#3B82F6"],
    ["created_at_timestamp", "1705234567"],
    ["order", "1"]
  ]
}
```

### Creating a Task

```json
{
  "kind": 30100,
  "content": "",
  "pubkey": "user_pubkey...",
  "created_at": 1705234600,
  "tags": [
    ["d", "660e8400-e29b-41d4-a716-446655440001"],
    ["title", "Design homepage mockup"],
    ["project", "naddr1..."],
    ["estimated_pomodoros", "4"],
    ["completed_pomodoros", "0"],
    ["completed", "false"],
    ["created_at_timestamp", "1705234600"],
    ["order", "1"]
  ]
}
```

### Recording a Pomodoro Session

```json
{
  "kind": 3100,
  "content": "",
  "pubkey": "user_pubkey...",
  "created_at": 1705236100,
  "tags": [
    ["session_type", "pomodoro"],
    ["duration", "1500"],
    ["started_at", "1705234600"],
    ["completed_at", "1705236100"],
    ["task", "naddr1..."],
    ["project", "naddr1..."],
    ["notes", "Made good progress on the hero section"],
    ["alt", "Completed a 25-minute pomodoro session"]
  ]
}
```

### Updating Settings

```json
{
  "kind": 10100,
  "content": "",
  "pubkey": "user_pubkey...",
  "created_at": 1705234567,
  "tags": [
    ["pomodoro_duration", "1500"],
    ["short_break_duration", "300"],
    ["long_break_duration", "900"],
    ["long_break_interval", "4"],
    ["auto_start_breaks", "true"],
    ["auto_start_pomodoros", "false"],
    ["notification_sound", "true"],
    ["notification_volume", "75"],
    ["theme", "ocean"],
    ["shortcuts", "{\"start_timer\":\"space\",\"reset_timer\":\"r\"}"]
  ]
}
```

## References

- [NIP-01: Basic protocol flow description](https://github.com/nostr-protocol/nips/blob/master/01.md)
- [NIP-09: Event Deletion](https://github.com/nostr-protocol/nips/blob/master/09.md)
- [NIP-31: Unknown Event Kinds](https://github.com/nostr-protocol/nips/blob/master/31.md)
- [Pomodoro Technique](https://en.wikipedia.org/wiki/Pomodoro_Technique)
