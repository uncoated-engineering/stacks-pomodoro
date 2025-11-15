import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Circle } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { AddTaskDialog } from './AddTaskDialog';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/pomodoro';

interface TaskListProps {
  onTaskSelect?: (taskId: string | undefined) => void;
  selectedTaskId?: string;
  className?: string;
}

export function TaskList({ onTaskSelect, selectedTaskId, className }: TaskListProps) {
  const { tasks, updateTask, deleteTask, isUpdating, isDeleting } = useTasks();
  const { projects } = useProjects();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const getProjectById = (projectId: string | undefined) => {
    if (!projectId) return undefined;
    return projects.find((p) => p.id === projectId);
  };

  const handleToggleComplete = async (task: Task) => {
    await updateTask({
      id: task.id,
      status: task.status === 'completed' ? 'todo' : 'completed',
    });
  };

  const handleDelete = async (taskId: string) => {
    if (selectedTaskId === taskId) {
      onTaskSelect?.(undefined);
    }
    await deleteTask(taskId);
  };

  const todoTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const renderTask = (task: Task) => {
    const project = getProjectById(task.projectId);
    const progress = task.estimatedPomodoros ? (task.pomodoros / task.estimatedPomodoros) * 100 : 0;
    const isSelected = selectedTaskId === task.id;

    return (
      <div
        key={task.id}
        className={cn(
          'group flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-accent',
          isSelected && 'bg-accent border-primary'
        )}
        onClick={() => onTaskSelect?.(isSelected ? undefined : task.id)}
      >
        <Checkbox
          checked={task.status === 'completed'}
          onCheckedChange={() => handleToggleComplete(task)}
          disabled={isUpdating}
          className="mt-0.5"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-sm font-medium',
                task.status === 'completed' && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </span>
            {project && (
              <Badge variant="outline" className="text-xs" style={{ borderColor: project.color }}>
                <Circle
                  className="mr-1 h-2 w-2"
                  fill={project.color || 'currentColor'}
                  color={project.color || 'currentColor'}
                />
                {project.title}
              </Badge>
            )}
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {task.pomodoros} {task.estimatedPomodoros && `/ ${task.estimatedPomodoros}`} pomodoros
            </span>
            {task.estimatedPomodoros && task.estimatedPomodoros > 0 && (
              <Progress value={progress} className="h-1.5 flex-1" />
            )}
          </div>
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(task.id);
          }}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    );
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Tasks</CardTitle>
            <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {todoTasks.length === 0 && completedTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No tasks yet. Click "Add Task" to get started!
            </div>
          ) : (
            <>
              {todoTasks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    To Do
                  </h3>
                  {todoTasks.map(renderTask)}
                </div>
              )}

              {completedTasks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Completed
                  </h3>
                  {completedTasks.map(renderTask)}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AddTaskDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </>
  );
}
