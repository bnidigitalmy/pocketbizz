import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, UserCog, CheckCircle, XCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/motion";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  name: string;
  businessName?: string;
  phone?: string;
  isAdmin: number;
  currentPlan: string;
  subscriptionStatus: string;
  createdAt: string;
}

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [durationMonths, setDurationMonths] = useState("1");
  const { toast } = useToast();

  const { data: usersData, isLoading } = useQuery({ 
    queryKey: ['/api/admin/users', page],
  });

  const { data: plansData } = useQuery({ 
    queryKey: ['/api/subscription-plans'],
  });

  const manageMutation = useMutation({
    mutationFn: async ({ userId, action, planId, duration }: any) => {
      return await apiRequest(`/api/admin/users/${userId}/subscription`, {
        method: 'PATCH',
        body: JSON.stringify({
          action,
          planId,
          durationMonths: duration,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Subscription Updated",
        description: "User subscription has been updated successfully",
      });
      setShowManageDialog(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription",
        variant: "destructive",
      });
    },
  });

  const handleActivateSubscription = () => {
    if (!selectedUser || !selectedPlan) {
      toast({
        title: "Error",
        description: "Please select a plan",
        variant: "destructive",
      });
      return;
    }

    manageMutation.mutate({
      userId: selectedUser.id,
      action: 'activate',
      planId: selectedPlan,
      duration: parseInt(durationMonths),
    });
  };

  const handleCancelSubscription = () => {
    if (!selectedUser) return;

    manageMutation.mutate({
      userId: selectedUser.id,
      action: 'cancel',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "destructive" | "outline" | "secondary" } = {
      active: "default",
      trial: "secondary",
      inactive: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const filteredUsers = (usersData as any)?.users?.filter((user: User) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.businessName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      className="p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Urus pengguna dan subscription
        </p>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari email, nama, atau business name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-users"
          />
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Senarai Pengguna</CardTitle>
            <CardDescription>
              {(usersData as any)?.pagination?.total || 0} pengguna berdaftar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Tiada pengguna dijumpai
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user: User) => (
                      <TableRow key={user.id} className="hover-elevate">
                        <TableCell className="font-mono text-sm">{user.email}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.businessName || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.currentPlan}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(user.subscriptionStatus)}</TableCell>
                        <TableCell>
                          {user.isAdmin ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowManageDialog(true);
                            }}
                            data-testid={`button-manage-${user.id}`}
                          >
                            <UserCog className="h-4 w-4 mr-2" />
                            Urus
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {(usersData as any)?.pagination?.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Page {page} of {(usersData as any)?.pagination?.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= (usersData as any)?.pagination?.totalPages}
                  onClick={() => setPage(page + 1)}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Manage Subscription Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Urus Subscription</DialogTitle>
            <DialogDescription>
              Aktifkan atau batalkan subscription untuk {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Status</Label>
              <div className="flex gap-2 items-center">
                <Badge>{selectedUser?.currentPlan}</Badge>
                {getStatusBadge(selectedUser?.subscriptionStatus || "")}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-select">Select Plan</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger id="plan-select" data-testid="select-plan">
                  <SelectValue placeholder="Pilih plan" />
                </SelectTrigger>
                <SelectContent>
                  {(plansData as any[])?.map((plan: any) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.displayName} - RM {plan.monthlyPrice}/bulan
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration-select">Tempoh (Bulan)</Label>
              <Select value={durationMonths} onValueChange={setDurationMonths}>
                <SelectTrigger id="duration-select" data-testid="select-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Bulan</SelectItem>
                  <SelectItem value="3">3 Bulan</SelectItem>
                  <SelectItem value="6">6 Bulan</SelectItem>
                  <SelectItem value="12">12 Bulan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {selectedUser?.subscriptionStatus === 'active' && (
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={manageMutation.isPending}
                data-testid="button-cancel-subscription"
              >
                Cancel Subscription
              </Button>
            )}
            <Button
              onClick={handleActivateSubscription}
              disabled={!selectedPlan || manageMutation.isPending}
              data-testid="button-activate-subscription"
            >
              {manageMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Activate Subscription'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
