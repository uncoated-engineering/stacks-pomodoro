# Nostr Pomodoro Protocol

This NIP defines event kinds for a Nostr-based Pomodoro timer application with task management and analytics.

## Event Kinds

| Kind | Type | Description |
|------|------|-------------|
| 30078 | Addressable (NIP-78) | Application settings and preferences |
| 30100 | Addressable | Projects |
| 30101 | Addressable | Tasks |
| 1100 | Regular | Pomodoro session records |

## Settings (Kind 30078)

Uses NIP-78 for storing user preferences. The `d` tag MUST be set to `"pomodoro-settings"`.

### Tags
- `d`: `"pomodoro-settings"` (required)

### Content
JSON object with the following optional fields:
- `workDuration`: number (minutes, default: 25)
- `shortBreakDuration`: number (minutes, default: 5)
- `longBreakDuration`: number (minutes, default: 15)
- `sessionsUntilLongBreak`: number (default: 4)
- `autoStartBreaks`: boolean (default: false)
- `autoStartPomodoros`: boolean (default: false)
- `theme`: string (color theme identifier)
- `shortcuts`: object (keyboard shortcut mappings)

### Example
```json
{
  "kind": 30078,
  "tags": [["d", "pomodoro-settings"]],
  "content": "{\"workDuration\":25,\"shortBreakDuration\":5,\"longBreakDuration\":15,\"sessionsUntilLongBreak\":4,\"theme\":\"tomato\",\"autoStartBreaks\":false,\"shortcuts\":{\"startTimer\":\"space\",\"skipTimer\":\"s\",\"resetTimer\":\"r\"}}"
}
```

## Projects (Kind 30100)

Addressable events for organizing tasks into projects. Each project is identified by a unique `d` tag.

### Tags
- `d`: unique project identifier (required)
- `title`: project name (required)
- `color`: hex color code for visual identification (optional)
- `created`: unix timestamp of project creation (optional)

### Content
Optional description or notes about the project (plaintext or empty string).

### Example
```json
{
  "kind": 30100,
  "tags": [
    ["d", "work-project-1"],
    ["title", "Q1 Marketing Campaign"],
    ["color", "#ff6b6b"],
    ["created", "1704067200"]
  ],
  "content": "Major marketing push for new product launch"
}
```

## Tasks (Kind 30101)

Addressable events representing individual tasks. Each task is identified by a unique `d` tag.

### Tags
- `d`: unique task identifier (required)
- `title`: task title (required)
- `project`: project identifier (d tag of kind 30100 event, optional)
- `status`: `"todo"`, `"in-progress"`, or `"completed"` (required)
- `pomodoros`: number of completed pomodoro sessions for this task (optional)
- `estimatedPomodoros`: estimated number of pomodoros needed (optional)
- `created`: unix timestamp of task creation (optional)
- `completed`: unix timestamp when task was completed (optional)

### Content
Optional description or notes about the task (plaintext or empty string).

### Example
```json
{
  "kind": 30101,
  "tags": [
    ["d", "task-abc123"],
    ["title", "Design landing page mockups"],
    ["project", "work-project-1"],
    ["status", "in-progress"],
    ["pomodoros", "3"],
    ["estimatedPomodoros", "5"],
    ["created", "1704067200"]
  ],
  "content": "Focus on mobile-first design with conversion optimization"
}
```

## Pomodoro Sessions (Kind 1100)

Regular events recording completed pomodoro sessions. These events create a historical log for analytics and reporting.

### Tags
- `session-type`: `"work"`, `"short-break"`, or `"long-break"` (required)
- `duration`: actual duration in seconds (required)
- `task`: task identifier if associated with a task (d tag of kind 30101, optional)
- `project`: project identifier if associated with a project (d tag of kind 30100, optional)
- `completed`: whether the session was completed or interrupted (`"true"` or `"false"`, required)
- `alt`: human-readable description of the event per NIP-31 (required)

### Content
Optional notes or reflections about the session (plaintext or empty string).

### Example
```json
{
  "kind": 1100,
  "tags": [
    ["session-type", "work"],
    ["duration", "1500"],
    ["task", "task-abc123"],
    ["project", "work-project-1"],
    ["completed", "true"],
    ["alt", "Completed 25-minute work session on task: Design landing page mockups"]
  ],
  "content": "Made good progress on the mobile layouts",
  "created_at": 1704068700
}
```

## Implementation Notes

### Task Completion Tracking
When a task's status changes to `"completed"`, clients SHOULD:
1. Add a `completed` tag with the current unix timestamp
2. Publish the updated kind 30101 event

### Session Recording
Clients SHOULD publish a kind 1100 event:
- When a pomodoro session completes successfully
- When a session is interrupted (with `completed: "false"`)

### Task Pomodoro Counter
When a work session (kind 1100) is completed for a task:
1. Clients SHOULD increment the task's `pomodoros` tag value
2. Publish the updated kind 30101 event

### Privacy Considerations
All events defined in this NIP are public by default. Users should be aware that:
- Task titles and descriptions are publicly visible
- Work patterns and focus times can be analyzed from session records
- For privacy-sensitive use cases, consider using generic task names or deploying private relays

### Querying Best Practices

**Get user settings:**
```javascript
const settings = await nostr.query([{
  kinds: [30078],
  authors: [userPubkey],
  '#d': ['pomodoro-settings'],
  limit: 1
}], { signal });
```

**Get all projects:**
```javascript
const projects = await nostr.query([{
  kinds: [30100],
  authors: [userPubkey]
}], { signal });
```

**Get tasks for a specific project:**
```javascript
const tasks = await nostr.query([{
  kinds: [30101],
  authors: [userPubkey],
  '#project': [projectId]
}], { signal });
```

**Get session history for analytics:**
```javascript
// Get last 100 sessions
const sessions = await nostr.query([{
  kinds: [1100],
  authors: [userPubkey],
  limit: 100
}], { signal });
```

## License

This NIP is released under the MIT License.
