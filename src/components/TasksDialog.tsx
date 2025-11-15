import { useState } from 'react';
import { Plus, Check, Trash2, Edit2, FolderPlus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import {
  useCreateTask,
  useUpdateTask,
  useCompleteTask,
  useCreateProject,
} from '@/hooks/usePomodoroMutations';
import { generateUUID } from '@/lib/pomodoro-utils';
import { POMODORO_THEMES } from '@/lib/pomodoro-types';
import type { PomodoroTask, PomodoroProject } from '@/lib/pomodoro-types';

interface TasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TasksDialog({ open, onOpenChange }: TasksDialogProps) {
  const [activeTab, setActiveTab] = useState('tasks');
  const [selectedProject, setSelectedProject] = useState<string | undefined>();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskEstimate, setNewTaskEstimate] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(POMODORO_THEMES[0].colors.pomodoro);
  const [showAddProject, setShowAddProject] = useState(false);

  const { data: tasks = [], isLoading: tasksLoading } = useTasks({
    projectNaddr: selectedProject,
    includeCompleted: false,
  });
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { mutate: createTask } = useCreateTask();
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: completeTask } = useCompleteTask();
  const { mutate: createProject } = useCreateProject();

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    createTask({
      id: generateUUID(),
      title: newTaskTitle,
      projectNaddr: selectedProject,
      estimatedPomodoros: newTaskEstimate ? parseInt(newTaskEstimate, 10) : undefined,
    });

    setNewTaskTitle('');
    setNewTaskEstimate('');
  };

  const handleCompleteTask = (task: PomodoroTask) => {
    completeTask(task);
  };

  const handleIncrementPomodoros = (task: PomodoroTask) => {
    updateTask({
      task,
      updates: {
        completedPomodoros: task.completedPomodoros + 1,
      },
    });
  };

  const handleAddProject = () => {
    if (!newProjectName.trim()) return;

    createProject({
      id: generateUUID(),
      name: newProjectName,
      color: newProjectColor,
    });

    setNewProjectName('');
    setShowAddProject(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Tasks & Projects</DialogTitle>
          <DialogDescription>
            Organize your work into tasks and track your progress.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            {/* Project filter */}
            <div className="flex gap-2">
              <Select value={selectedProject ?? 'all'} onValueChange={(v) => setSelectedProject(v === 'all' ? undefined : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.naddr}>
                      <div className="flex items-center gap-2">
                        {project.color && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                        )}
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add task form */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="What are you working on?"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTask();
                        }
                      }}
                    />
                  </div>
                  <Input
                    type="number"
                    placeholder="Est."
                    className="w-20"
                    value={newTaskEstimate}
                    onChange={(e) => setNewTaskEstimate(e.target.value)}
                    min="1"
                  />
                  <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tasks list */}
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {tasksLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="h-6 w-full" />
                      </CardContent>
                    </Card>
                  ))
                ) : tasks.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-12 px-8 text-center">
                      <p className="text-muted-foreground">
                        No tasks yet. Add your first task above to get started!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  tasks.map((task) => {
                    const project = projects.find((p) => p.naddr === task.projectNaddr);
                    return (
                      <Card key={task.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCompleteTask(task)}
                              className="h-8 w-8 rounded-full"
                            >
                              <Check className="w-4 h-4" />
                            </Button>

                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {project && project.color && (
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: project.color }}
                                  />
                                )}
                                <span className="font-medium">{task.title}</span>
                              </div>
                              {task.estimatedPomodoros && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {task.completedPomodoros} / {task.estimatedPomodoros} pomodoros
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleIncrementPomodoros(task)}
                              >
                                +1 Pomodoro
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            {/* Add project */}
            {showAddProject ? (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      placeholder="Enter project name"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="project-color">Color</Label>
                    <div className="flex gap-2 mt-2">
                      {POMODORO_THEMES.map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setNewProjectColor(theme.colors.pomodoro)}
                          className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                          style={{
                            backgroundColor: theme.colors.pomodoro,
                            borderColor: newProjectColor === theme.colors.pomodoro ? '#000' : 'transparent',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleAddProject} disabled={!newProjectName.trim()}>
                      Add Project
                    </Button>
                    <Button variant="ghost" onClick={() => setShowAddProject(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button onClick={() => setShowAddProject(true)} className="w-full">
                <FolderPlus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            )}

            {/* Projects list */}
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {projectsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="h-6 w-full" />
                      </CardContent>
                    </Card>
                  ))
                ) : projects.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-12 px-8 text-center">
                      <p className="text-muted-foreground">
                        No projects yet. Create a project to organize your tasks!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  projects.map((project) => {
                    const projectTasks = tasks.filter((t) => t.projectNaddr === project.naddr);
                    return (
                      <Card key={project.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            {project.color && (
                              <div
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: project.color }}
                              />
                            )}
                            <div className="flex-1">
                              <div className="font-medium">{project.name}</div>
                              <p className="text-sm text-muted-foreground">
                                {projectTasks.length} active tasks
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
