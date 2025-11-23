import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, UserCog, CheckCircle, XCircle, Clock, KeyRound, Copy, Check, Trash2, Ban, ShieldAlert, DollarSign, Download, Mail, MoreHorizontal, CheckCheck } from "lucide-react";
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
  suspended?: boolean;
  currentPlan: string;
  subscriptionStatus: string;
  createdAt: string;
}

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [durationMonths, setDurationMonths] = useState("1");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("manual");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: usersData, isLoading } = useQuery({ 
    queryKey: ['admin-users', page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users?page=${page}&limit=20`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
  });

  const { data: plansData } = useQuery({ 
    queryKey: ['/api/subscription-plans'],
  });

  const manageMutation = useMutation({
    mutationFn: async ({ userId, action, planId, duration }: any) => {
      return await apiRequest(
        'PATCH',
        `/api/admin/users/${userId}/subscription`,
        {
          action,
          planId,
          durationMonths: duration,
        }
      );
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

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('POST', `/api/admin/users/${userId}/reset-password`);
    },
    onSuccess: (data: any) => {
      setTempPassword(data.tempPassword);
      toast({
        title: "Password Reset Successful",
        description: "Temporary password generated. Share with user securely.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
      setShowResetPasswordDialog(false);
      setSelectedUser(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('DELETE', `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User Deleted",
        description: "User account has been permanently deleted.",
      });
      setShowDeleteDialog(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const toggleSuspendMutation = useMutation({
    mutationFn: async ({ userId, suspended }: { userId: string; suspended: boolean }) => {
      return await apiRequest(
        'POST',
        `/api/admin/users/${userId}/toggle-status`,
        { suspended }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User Status Updated",
        description: "User status has been changed successfully.",
      });
      setShowSuspendDialog(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const changePlanMutation = useMutation({
    mutationFn: async ({ userId, planId, durationMonths }: any) => {
      return await apiRequest(
        'POST',
        `/api/admin/users/${userId}/change-plan`,
        { planId, durationMonths }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Plan Changed",
        description: "User subscription plan has been updated.",
      });
      setShowChangePlanDialog(false);
      setSelectedUser(null);
      setSelectedPlan("");
      setDurationMonths("1");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change plan",
        variant: "destructive",
      });
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: async ({ userId, amount, method, notes }: any) => {
      return await apiRequest(
        'POST',
        `/api/admin/users/${userId}/add-payment`,
        { amount, method, notes }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Payment Added",
        description: "Manual payment record has been added.",
      });
      setShowAddPaymentDialog(false);
      setSelectedUser(null);
      setPaymentAmount("");
      setPaymentMethod("manual");
      setPaymentNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add payment",
        variant: "destructive",
      });
    },
  });

  const handleActivateSubscription = () => {
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "No user selected",
        variant: "destructive",
      });
      return;
    }

    // Auto-use first plan (we only have 1 plan)
    const defaultPlanId = plansData?.[0]?.id || 'default';

    manageMutation.mutate({
      userId: selectedUser.id,
      action: 'activate',
      planId: defaultPlanId,
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

  const handleResetPassword = () => {
    if (!selectedUser) return;
    resetPasswordMutation.mutate(selectedUser.id);
  };

  const handleCopyPassword = async () => {
    await navigator.clipboard.writeText(tempPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleCloseResetDialog = () => {
    setShowResetPasswordDialog(false);
    setSelectedUser(null);
    setTempPassword("");
    setCopiedPassword(false);
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(user);
                                setShowManageDialog(true);
                              }}>
                                <UserCog className="h-4 w-4 mr-2" />
                                Urus Subscription
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(user);
                                setShowResetPasswordDialog(true);
                              }}>
                                <KeyRound className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(user);
                                setShowChangePlanDialog(true);
                              }}>
                                <ShieldAlert className="h-4 w-4 mr-2" />
                                Tukar Plan
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(user);
                                setShowAddPaymentDialog(true);
                              }}>
                                <DollarSign className="h-4 w-4 mr-2" />
                                Tambah Bayaran
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(user);
                                setShowSuspendDialog(true);
                              }}>
                                <Ban className="h-4 w-4 mr-2" />
                                {user.suspended ? 'Aktifkan' : 'Suspend'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus Pengguna
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
            <DialogTitle>Manage Subscription</DialogTitle>
            <DialogDescription>
              Activate or cancel subscription for {selectedUser?.name}
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

            <div className="p-3 bg-gray-50 rounded-lg border">
              <div className="text-sm font-medium text-gray-700">Plan</div>
              <div className="text-lg font-bold">PocketBizz</div>
              <div className="text-xs text-muted-foreground mt-1">
                Single plan with duration packages
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration-select">Duration Package</Label>
              <Select value={durationMonths} onValueChange={setDurationMonths}>
                <SelectTrigger id="duration-select" data-testid="select-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Bulan - RM27</SelectItem>
                  <SelectItem value="3">3 Bulan - RM79 (Save 3%)</SelectItem>
                  <SelectItem value="6">6 Bulan - RM146 (Save 10%)</SelectItem>
                  <SelectItem value="12">12 Bulan - RM259 (Save 20%)</SelectItem>
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
              disabled={manageMutation.isPending}
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

      {/* Reset Password Dialog */}
      <AlertDialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tempPassword ? "Password Telah Direset" : "Reset Password Pengguna"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tempPassword ? (
                <div className="space-y-4 pt-4">
                  <p>Password sementara untuk <strong>{selectedUser?.email}</strong>:</p>
                  
                  <div className="bg-muted p-4 rounded-md border-2 border-primary/20">
                    <div className="flex items-center justify-between gap-4">
                      <code className="text-2xl font-bold tracking-wider">{tempPassword}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyPassword}
                        data-testid="button-copy-password"
                      >
                        {copiedPassword ? (
                          <>
                            <Check className="h-4 w-4 mr-2 text-green-600" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ <strong>Penting:</strong> Kongsi password ini dengan pengguna secara selamat (WhatsApp, SMS, atau secara langsung). 
                      Password ini tidak akan dipaparkan lagi selepas ditutup.
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💡 Pengguna digalakkan menukar password ini kepada password pilihan mereka selepas log masuk.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  Adakah anda pasti mahu mereset password untuk <strong>{selectedUser?.email}</strong>?
                  <br /><br />
                  Password sementara akan dijana dan dipaparkan kepada anda untuk dikongsi dengan pengguna.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {tempPassword ? (
              <AlertDialogAction onClick={handleCloseResetDialog} data-testid="button-close-reset">
                Tutup
              </AlertDialogAction>
            ) : (
              <>
                <AlertDialogCancel data-testid="button-cancel-reset">Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleResetPassword}
                  disabled={resetPasswordMutation.isPending}
                  data-testid="button-confirm-reset"
                >
                  {resetPasswordMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Mereset...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengguna</AlertDialogTitle>
            <AlertDialogDescription>
              Adakah anda pasti mahu menghapus pengguna <strong>{selectedUser?.email}</strong>?
              <br /><br />
              <span className="text-destructive font-semibold">⚠️ Amaran: Tindakan ini tidak boleh dibatalkan!</span>
              <br /><br />
              Semua data pengguna termasuk produk, stok, pesanan, dan rekod lain akan dihapus sepenuhnya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser.id)}
              disabled={deleteUserMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus Pengguna
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend/Activate User Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.suspended ? 'Aktifkan Pengguna' : 'Suspend Pengguna'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.suspended ? (
                <>
                  Adakah anda pasti mahu mengaktifkan semula pengguna <strong>{selectedUser?.email}</strong>?
                  <br /><br />
                  Pengguna akan dapat log masuk dan menggunakan sistem seperti biasa.
                </>
              ) : (
                <>
                  Adakah anda pasti mahu menyuspend pengguna <strong>{selectedUser?.email}</strong>?
                  <br /><br />
                  Pengguna tidak akan dapat log masuk sehingga akaun diaktifkan semula.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && toggleSuspendMutation.mutate({ 
                userId: selectedUser.id, 
                suspended: !selectedUser.suspended 
              })}
              disabled={toggleSuspendMutation.isPending}
            >
              {toggleSuspendMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  {selectedUser?.suspended ? (
                    <>
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Aktifkan
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4 mr-2" />
                      Suspend
                    </>
                  )}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Plan Dialog */}
      <Dialog open={showChangePlanDialog} onOpenChange={setShowChangePlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate/Change Subscription</DialogTitle>
            <DialogDescription>
              Change subscription for {selectedUser?.email}. Current: <strong>{selectedUser?.currentPlan}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg border">
              <div className="text-sm font-medium text-gray-700">Plan</div>
              <div className="text-lg font-bold">PocketBizz</div>
              <div className="text-xs text-muted-foreground mt-1">
                Single plan with duration-based pricing
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Duration Package</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose duration..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Bulan - RM27</SelectItem>
                  <SelectItem value="3">3 Bulan - RM79 (Save 3%)</SelectItem>
                  <SelectItem value="6">6 Bulan - RM146 (Save 10%)</SelectItem>
                  <SelectItem value="12">12 Bulan - RM259 (Save 20%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 Subscription will be activated/updated immediately for the selected duration.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePlanDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={() => selectedUser && changePlanMutation.mutate({
                userId: selectedUser.id,
                planId: plansData?.[0]?.id || 'default',
                durationMonths: parseInt(selectedPlan || '1')
              })}
              disabled={changePlanMutation.isPending || !selectedPlan}
            >
              {changePlanMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Update Subscription
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Manual Payment Dialog */}
      <Dialog open={showAddPaymentDialog} onOpenChange={setShowAddPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Bayaran Manual</DialogTitle>
            <DialogDescription>
              Rekod bayaran manual untuk {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amaun (RM)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="29.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Kaedah Bayaran</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual/Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="fpx">FPX</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="other">Lain-lain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nota (optional)</Label>
              <Textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Contoh: Bayaran melalui bank transfer, rujukan #TXN123"
                rows={3}
              />
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Bayaran manual tidak akan mengaktifkan subscription secara automatik. 
                Gunakan "Tukar Plan" untuk mengaktifkan subscription pengguna.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPaymentDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={() => selectedUser && addPaymentMutation.mutate({
                userId: selectedUser.id,
                amount: parseFloat(paymentAmount),
                method: paymentMethod,
                notes: paymentNotes
              })}
              disabled={addPaymentMutation.isPending || !paymentAmount || parseFloat(paymentAmount) <= 0}
            >
              {addPaymentMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Menambah...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Tambah Bayaran
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
