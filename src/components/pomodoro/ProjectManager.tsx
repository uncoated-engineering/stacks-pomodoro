import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Circle } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/useToast';

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

export function ProjectManager() {
  const { projects, createProject, deleteProject, isCreating, isDeleting } = useProjects();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Project title is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createProject({
        title: projectTitle.trim(),
        color: selectedColor,
      });

      toast({
        title: 'Success',
        description: 'Project created successfully',
      });

      setProjectTitle('');
      setSelectedColor(COLOR_OPTIONS[0]);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create project',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      toast({
        title: 'Success',
        description: 'Project deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete project',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Projects</CardTitle>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Project
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No projects yet. Create one to organize your tasks!
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="group flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Circle
                    className="h-4 w-4 flex-shrink-0"
                    fill={project.color || 'currentColor'}
                    color={project.color || 'currentColor'}
                  />
                  <span className="font-medium text-sm truncate">{project.title}</span>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={() => handleDeleteProject(project.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateProject}>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Organize your tasks into projects for better focus.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="project-title">Project Name *</Label>
                <Input
                  id="project-title"
                  placeholder="Enter project name"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  disabled={isCreating}
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
                        selectedColor === color ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
