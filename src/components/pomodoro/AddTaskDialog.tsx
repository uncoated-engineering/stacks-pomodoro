import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/useToast';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLOR_OPTIONS = [
  '#ff6b6b', // red
  '#4ecdc4', // teal
  '#45b7d1', // blue
  '#96ceb4', // green
  '#ffeaa7', // yellow
  '#dfe6e9', // gray
  '#a29bfe', // purple
  '#fd79a8', // pink
];

export function AddTaskDialog({ open, onOpenChange }: AddTaskDialogProps) {
  const { createTask, isCreating } = useTasks();
  const { projects, createProject, isCreating: isCreatingProject } = useProjects();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [estimatedPomodoros, setEstimatedPomodoros] = useState('');

  // New project dialog states
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(COLOR_OPTIONS[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Task title is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        projectId: projectId || undefined,
        estimatedPomodoros: estimatedPomodoros ? parseInt(estimatedPomodoros) : undefined,
      });

      toast({
        title: 'Success',
        description: 'Task created successfully',
      });

      // Reset form
      setTitle('');
      setDescription('');
      setProjectId(undefined);
      setEstimatedPomodoros('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create task',
        variant: 'destructive',
      });
    }
  };

  const handleCreateNewProject = async () => {
    if (!newProjectTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Project title is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newProjectId = await createProject({
        title: newProjectTitle.trim(),
        color: newProjectColor,
      });

      toast({
        title: 'Success',
        description: 'Project created successfully',
      });

      // Set the newly created project as selected
      setProjectId(newProjectId);

      // Reset new project form
      setNewProjectTitle('');
      setNewProjectColor(COLOR_OPTIONS[0]);
      setIsNewProjectDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create project',
        variant: 'destructive',
      });
    }
  };

  const handleProjectChange = (value: string) => {
    if (value === 'create-new') {
      setIsNewProjectDialogOpen(true);
    } else {
      setProjectId(value === 'none' ? undefined : value);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
              <DialogDescription>
                Create a new task to work on during your pomodoro sessions.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter task title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add details about this task..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isCreating}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select
                    value={projectId || 'none'}
                    onValueChange={handleProjectChange}
                    disabled={isCreating}
                  >
                    <SelectTrigger id="project">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="create-new">
                        <div className="flex items-center gap-2">
                          <Plus className="h-3 w-3" />
                          <span>Create New Project...</span>
                        </div>
                      </SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated">Estimated Pomodoros</Label>
                  <Input
                    id="estimated"
                    type="number"
                    min="1"
                    placeholder="0"
                    value={estimatedPomodoros}
                    onChange={(e) => setEstimatedPomodoros(e.target.value)}
                    disabled={isCreating}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Project Dialog */}
      <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a project to organize your tasks.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-title">Project Name *</Label>
              <Input
                id="project-title"
                placeholder="Enter project name"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                disabled={isCreatingProject}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-8 gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-10 w-10 rounded-md border-2 transition-all hover:scale-110 ${
                      newProjectColor === color ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewProjectColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewProjectDialogOpen(false)}
              disabled={isCreatingProject}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateNewProject} disabled={isCreatingProject}>
              {isCreatingProject ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
