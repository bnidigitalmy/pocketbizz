import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Circle, AlertTriangle, ShoppingCart, Package, DollarSign, Clock } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";

interface DailyTask {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  actionUrl: string;
}

// Get today's date key for localStorage
const getTodayKey = () => {
  return `daily-tasks-${new Date().toISOString().split('T')[0]}`;
};

export function DailyTaskWidget() {
  const { data: tasks = [] } = useQuery<DailyTask[]>({
    queryKey: ["/api/tasks/daily"],
  });

  // Load completed tasks from localStorage (today only)
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(getTodayKey());
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Save to localStorage whenever completedTasks changes
  useEffect(() => {
    localStorage.setItem(getTodayKey(), JSON.stringify([...completedTasks]));
  }, [completedTasks]);

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const completedCount = [...completedTasks].filter(id => tasks.some(t => t.id === id)).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  if (tasks.length === 0) {
    return (
      <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50">
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-900 dark:text-green-100">
            Tahniah! Tiada tugasan penting hari ini.
          </p>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            Semua on track!
          </p>
        </CardContent>
      </Card>
    );
  }

  const highPriority = tasks.filter(t => t.priority === "high" && !completedTasks.has(t.id)).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "restock":
        return <ShoppingCart className="w-4 h-4" />;
      case "production":
        return <Package className="w-4 h-4" />;
      case "claims":
        return <DollarSign className="w-4 h-4" />;
      case "expiry":
        return <Clock className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card className="border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/10">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <div className="flex-1">
          <CardTitle className="text-base font-semibold flex items-center gap-2 mb-2">
            <Circle className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            <span>Tugasan Hari Ini</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Progress value={progress} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground font-mono" data-testid="text-task-progress">
              {completedCount}/{totalTasks}
            </span>
          </div>
        </div>
        {highPriority > 0 && (
          <Badge variant="destructive" className="text-xs" data-testid="badge-high-priority-count">
            {highPriority} penting
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((task) => {
          const isCompleted = completedTasks.has(task.id);
          return (
            <div
              key={task.id}
              className={`flex items-start gap-3 p-3 bg-background rounded-md border border-border/50 ${isCompleted ? "opacity-50" : ""}`}
              data-testid={`task-${task.id}`}
            >
              <Checkbox
                checked={isCompleted}
                onCheckedChange={() => toggleTask(task.id)}
                className="mt-1"
                data-testid={`checkbox-task-${task.id}`}
              />
              <div className={`mt-0.5 ${task.priority === "high" && !isCompleted ? "text-destructive" : "text-primary"}`}>
                {getIcon(task.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <Link href={task.actionUrl}>
                    <a className={`text-sm font-medium hover:underline ${isCompleted ? "line-through" : ""}`}>
                      {task.title}
                    </a>
                  </Link>
                  <Badge variant={getPriorityColor(task.priority)} className="text-xs shrink-0">
                    {task.priority === "high" ? "Penting" : task.priority === "medium" ? "Sederhana" : "Rendah"}
                  </Badge>
                </div>
                <p className={`text-xs text-muted-foreground ${isCompleted ? "line-through" : ""}`}>
                  {task.description}
                </p>
              </div>
            </div>
          );
        })}
        
        {progress === 100 && (
          <div className="pt-2 mt-2 border-t bg-green-50 dark:bg-green-950/20 p-3 rounded-md text-center">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              🎉 Semua tugasan selesai! Kerja bagus!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
