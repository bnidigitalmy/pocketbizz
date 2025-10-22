import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Target, TrendingUp, Edit2, Plus, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ms } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function GoalTrackerWidget() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);

  // Get current month (YYYY-MM-01 format)
  const currentMonth = format(new Date(), "yyyy-MM-01");

  // Fetch goal progress for current month
  const { data: progressData, isLoading } = useQuery({
    queryKey: ["/api/goals", currentMonth, "progress"],
    queryFn: async () => {
      const response = await fetch(`/api/goals/${currentMonth}/progress`);
      if (!response.ok) throw new Error("Failed to fetch goal progress");
      return response.json();
    },
  });

  // Create/Update goal mutation
  const saveMutation = useMutation({
    mutationFn: async (goalData: any) => {
      if (editingGoal?.id) {
        const response = await fetch(`/api/goals/${editingGoal.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(goalData),
        });
        if (!response.ok) throw new Error("Failed to update goal");
        return response.json();
      } else {
        const response = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(goalData),
        });
        if (!response.ok) throw new Error("Failed to create goal");
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setIsDialogOpen(false);
      setEditingGoal(null);
      toast({
        title: "Sasaran Disimpan",
        description: "Sasaran bulanan anda telah dikemaskini",
      });
    },
    onError: () => {
      toast({
        title: "Ralat",
        description: "Gagal menyimpan sasaran",
        variant: "destructive",
      });
    },
  });

  const handleSaveGoal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const goalData = {
      targetMonth: currentMonth,
      revenueTarget: Number(formData.get("revenueTarget")) || 0,
      profitTarget: Number(formData.get("profitTarget")) || 0,
      salesVolumeTarget: Number(formData.get("salesVolumeTarget")) || 0,
      notes: formData.get("notes") as string,
    };
    saveMutation.mutate(goalData);
  };

  const openEditDialog = () => {
    setEditingGoal(progressData?.goal || null);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  const { goal, progress } = progressData || {};
  const hasGoal = goal && (parseFloat(goal.revenueTarget) > 0 || parseFloat(goal.profitTarget) > 0);

  // Calculate overall progress (average of all targets)
  let overallProgress = 0;
  let progressCount = 0;
  if (hasGoal && progress) {
    if (parseFloat(goal.revenueTarget) > 0) {
      overallProgress += progress.revenueProgress;
      progressCount++;
    }
    if (parseFloat(goal.profitTarget) > 0) {
      overallProgress += progress.profitProgress;
      progressCount++;
    }
    if (goal.salesVolumeTarget > 0) {
      overallProgress += progress.salesVolumeProgress;
      progressCount++;
    }
    overallProgress = progressCount > 0 ? overallProgress / progressCount : 0;
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "text-green-600";
    if (progress >= 70) return "text-blue-600";
    if (progress >= 40) return "text-yellow-600";
    return "text-orange-600";
  };

  const getProgressIcon = (progress: number) => {
    if (progress >= 100) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (progress >= 70) return <TrendingUp className="h-5 w-5 text-blue-600" />;
    return <AlertCircle className="h-5 w-5 text-orange-600" />;
  };

  const getMotivationalMessage = () => {
    if (!hasGoal) return "Tetapkan sasaran bulan ini untuk fokus perniagaan anda!";
    if (overallProgress >= 100) return "Tahniah! Anda capai sasaran bulan ini!";
    if (overallProgress >= 80) return "Hampir sampai! Teruskan usaha!";
    if (overallProgress >= 50) return "Separuh jalan sudah ditempuh!";
    if (overallProgress >= 25) return "Langkah kecil, impian besar!";
    return "Setiap usaha anda membawa perubahan!";
  };

  return (
    <Card className="border-t-4 border-t-primary" data-testid="card-goal-tracker">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Sasaran Bulanan
          </CardTitle>
          <Button
            size="sm"
            variant={hasGoal ? "outline" : "default"}
            onClick={openEditDialog}
            data-testid="button-set-goal"
          >
            {hasGoal ? (
              <>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Tetapkan
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Month Badge */}
        <div className="flex items-center justify-between">
          <Badge variant="outline">
            {format(new Date(currentMonth), "MMMM yyyy", { locale: ms })}
          </Badge>
          {hasGoal && (
            <div className="flex items-center gap-2">
              {getProgressIcon(overallProgress)}
              <span className={`text-sm font-semibold ${getProgressColor(overallProgress)}`}>
                {overallProgress.toFixed(0)}% selesai
              </span>
            </div>
          )}
        </div>

        {hasGoal ? (
          <>
            {/* Progress Bars */}
            <div className="space-y-4">
              {parseFloat(goal.revenueTarget) > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sasaran Hasil</span>
                    <span className="font-medium" data-testid="text-revenue-progress">
                      RM {progress?.actualRevenue?.toFixed(0) || 0} / RM {parseFloat(goal.revenueTarget).toFixed(0)}
                    </span>
                  </div>
                  <Progress value={Math.min(progress?.revenueProgress || 0, 100)} className="h-2" />
                </div>
              )}

              {parseFloat(goal.profitTarget) > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sasaran Untung</span>
                    <span className="font-medium" data-testid="text-profit-progress">
                      RM {progress?.actualProfit?.toFixed(0) || 0} / RM {parseFloat(goal.profitTarget).toFixed(0)}
                    </span>
                  </div>
                  <Progress value={Math.min(progress?.profitProgress || 0, 100)} className="h-2" />
                </div>
              )}

              {goal.salesVolumeTarget > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sasaran Jualan</span>
                    <span className="font-medium" data-testid="text-sales-progress">
                      {progress?.actualSalesVolume || 0} / {goal.salesVolumeTarget} transaksi
                    </span>
                  </div>
                  <Progress value={Math.min(progress?.salesVolumeProgress || 0, 100)} className="h-2" />
                </div>
              )}
            </div>

            {/* Motivational Message */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <p className="text-sm font-medium" data-testid="text-motivation">
                  {getMotivationalMessage()}
                </p>
              </div>
            </div>

            {/* User Notes */}
            {goal.notes && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground italic">"{goal.notes}"</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">
              Tetapkan sasaran bulanan untuk pantau kemajuan perniagaan anda
            </p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-goal">
              <Plus className="h-4 w-4 mr-2" />
              Tetapkan Sasaran
            </Button>
          </div>
        )}
      </CardContent>

      {/* Goal Setting Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="dialog-goal-form">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? "Edit Sasaran Bulanan" : "Tetapkan Sasaran Bulanan"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveGoal} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="revenueTarget">Sasaran Hasil (RM)</Label>
              <Input
                id="revenueTarget"
                name="revenueTarget"
                type="number"
                step="0.01"
                placeholder="Contoh: 5000"
                defaultValue={editingGoal?.revenueTarget || ""}
                data-testid="input-revenue-target"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profitTarget">Sasaran Untung (RM)</Label>
              <Input
                id="profitTarget"
                name="profitTarget"
                type="number"
                step="0.01"
                placeholder="Contoh: 2000"
                defaultValue={editingGoal?.profitTarget || ""}
                data-testid="input-profit-target"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salesVolumeTarget">Sasaran Jumlah Jualan</Label>
              <Input
                id="salesVolumeTarget"
                name="salesVolumeTarget"
                type="number"
                placeholder="Contoh: 50"
                defaultValue={editingGoal?.salesVolumeTarget || ""}
                data-testid="input-sales-volume-target"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Nota / Motivasi (Pilihan)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Contoh: Sasaran untuk tambah modal perniagaan"
                defaultValue={editingGoal?.notes || ""}
                data-testid="input-goal-notes"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingGoal(null);
                }}
                data-testid="button-cancel"
              >
                Batal
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-goal">
                {saveMutation.isPending ? "Menyimpan..." : "Simpan Sasaran"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
