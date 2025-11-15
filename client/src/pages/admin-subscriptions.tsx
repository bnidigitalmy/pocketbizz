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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, Plus, Clock, CheckCircle, XCircle, Calendar, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/motion";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Subscription {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  planName: string;
  status: string;
  durationMonths: number;
  subscriptionStartsAt: string;
  subscriptionEndsAt: string;
  totalPaid: string;
  paymentProvider?: string;
  activationSource?: string;
  isExpired: boolean;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  fullName?: string;
  businessName?: string;
  isOnTrial: number;
}

interface Plan {
  id: string;
  name: string;
  displayName: string;
  monthlyPrice: string;
}

export default function AdminSubscriptions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  
  // Activate form state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [activateDuration, setActivateDuration] = useState("3");
  const [activateNotes, setActivateNotes] = useState("");
  
  // Extend form state
  const [extendDuration, setExtendDuration] = useState("3");
  const [extendNotes, setExtendNotes] = useState("");

  const { toast } = useToast();

  // Fetch all subscriptions
  const { data: subscriptions = [], isLoading } = useQuery<Subscription[]>({ 
    queryKey: ['/api/admin/subscriptions'],
    queryFn: async () => {
      const res = await fetch('/api/admin/subscriptions', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch subscriptions');
      return res.json();
    },
  });

  // Fetch all users
  const { data: usersData } = useQuery({ 
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users?limit=1000', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
  });

  // Fetch subscription plans
  const { data: plans = [] } = useQuery<Plan[]>({ 
    queryKey: ['/api/subscription-plans'],
  });

  // Manual activation mutation
  const activateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/subscriptions/manual-activate', {
        userId: selectedUserId,
        planId: selectedPlanId,
        durationMonths: parseInt(activateDuration),
        notes: activateNotes,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "✅ Subscription Activated",
        description: data.message,
      });
      setShowActivateDialog(false);
      resetActivateForm();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Activation Failed",
        description: error.message || "Failed to activate subscription",
        variant: "destructive",
      });
    },
  });

  // Extend subscription mutation
  const extendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubscription) return;
      const response = await apiRequest(
        'PATCH', 
        `/api/admin/subscriptions/${selectedSubscription.id}/extend`,
        {
          extensionMonths: parseInt(extendDuration),
          notes: extendNotes,
        }
      );
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "✅ Subscription Extended",
        description: data.message,
      });
      setShowExtendDialog(false);
      resetExtendForm();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Extension Failed",
        description: error.message || "Failed to extend subscription",
        variant: "destructive",
      });
    },
  });

  const resetActivateForm = () => {
    setSelectedUserId("");
    setSelectedPlanId("");
    setActivateDuration("3");
    setActivateNotes("");
  };

  const resetExtendForm = () => {
    setSelectedSubscription(null);
    setExtendDuration("3");
    setExtendNotes("");
  };

  const handleExtendClick = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowExtendDialog(true);
  };

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter((sub) =>
    sub.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.planName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (subscription: Subscription) => {
    if (subscription.isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (subscription.status === 'active') {
      return <Badge variant="default" className="bg-green-600">Active</Badge>;
    }
    if (subscription.status === 'canceled') {
      return <Badge variant="secondary">Canceled</Badge>;
    }
    return <Badge variant="outline">{subscription.status}</Badge>;
  };

  const getProviderBadge = (provider?: string, source?: string) => {
    const label = source || provider || 'Unknown';
    if (label.includes('manual')) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Manual Admin</Badge>;
    }
    if (label.includes('bcl')) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">BCL Auto</Badge>;
    }
    if (label.includes('toyyibpay')) {
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">ToyyibPay</Badge>;
    }
    return <Badge variant="outline">{label}</Badge>;
  };

  const users = usersData?.users || [];

  return (
    <motion.div 
      className="p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manual Subscription Control</h1>
            <p className="text-muted-foreground mt-1">
              Backup system untuk activate dan extend langganan secara manual
            </p>
          </div>
          <Button onClick={() => setShowActivateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Activate New Subscription
          </Button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Subscriptions</CardTitle>
                <CardDescription>
                  Total: {subscriptions.length} | Active: {subscriptions.filter(s => s.status === 'active' && !s.isExpired).length}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by email, name, or plan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Total Paid</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        No subscriptions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{subscription.userEmail}</div>
                            {subscription.userName && (
                              <div className="text-sm text-muted-foreground">{subscription.userName}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{subscription.planName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            {subscription.durationMonths} month{subscription.durationMonths > 1 ? 's' : ''}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(subscription.subscriptionStartsAt).toLocaleDateString('en-MY')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {new Date(subscription.subscriptionEndsAt).toLocaleDateString('en-MY')}
                            {subscription.isExpired && (
                              <Badge variant="destructive" className="text-xs">Expired</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            RM {subscription.totalPaid}
                          </div>
                        </TableCell>
                        <TableCell>{getProviderBadge(subscription.paymentProvider, subscription.activationSource)}</TableCell>
                        <TableCell>{getStatusBadge(subscription)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExtendClick(subscription)}
                            disabled={subscription.status === 'canceled'}
                          >
                            Extend
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Activate New Subscription Dialog */}
      <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Activate Manual Subscription</DialogTitle>
            <DialogDescription>
              Backup method untuk activate subscription bila payment BCL tak berjaya
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user">Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose user..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: User) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email} {user.fullName ? `(${user.fullName})` : ''}
                      {user.isOnTrial === 1 && ' - 🎯 On Trial'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Subscription Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose plan..." />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.displayName} - RM {plan.monthlyPrice}/month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select value={activateDuration} onValueChange={setActivateDuration}>
                <SelectTrigger>
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

            {selectedPlanId && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-900">Total Amount</div>
                <div className="text-2xl font-bold text-blue-700">
                  RM {(parseFloat(plans.find(p => p.id === selectedPlanId)?.monthlyPrice || '0') * parseInt(activateDuration)).toFixed(2)}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  RM {plans.find(p => p.id === selectedPlanId)?.monthlyPrice} × {activateDuration} month{parseInt(activateDuration) > 1 ? 's' : ''}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Admin Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="e.g., Customer paid via bank transfer on 15/11/2025"
                value={activateNotes}
                onChange={(e) => setActivateNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => activateMutation.mutate()}
              disabled={!selectedUserId || !selectedPlanId || activateMutation.isPending}
            >
              {activateMutation.isPending ? "Activating..." : "Activate Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Subscription Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Extend Subscription</DialogTitle>
            <DialogDescription>
              Extend langganan untuk pelanggan yang dah bayar
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubscription && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">User:</span>
                  <span className="font-medium">{selectedSubscription.userEmail}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Plan:</span>
                  <span className="font-medium">{selectedSubscription.planName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current End Date:</span>
                  <span className="font-medium">
                    {new Date(selectedSubscription.subscriptionEndsAt).toLocaleDateString('en-MY')}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="extend-duration">Extension Duration</Label>
                <Select value={extendDuration} onValueChange={setExtendDuration}>
                  <SelectTrigger>
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

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm font-medium text-green-900">New End Date</div>
                <div className="text-lg font-bold text-green-700">
                  {(() => {
                    const currentEnd = new Date(selectedSubscription.subscriptionEndsAt);
                    const newEnd = new Date(currentEnd);
                    newEnd.setMonth(newEnd.getMonth() + parseInt(extendDuration));
                    return newEnd.toLocaleDateString('en-MY');
                  })()}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Extended by {extendDuration} month{parseInt(extendDuration) > 1 ? 's' : ''}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="extend-notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="extend-notes"
                  placeholder="e.g., Payment received via bank transfer"
                  value={extendNotes}
                  onChange={(e) => setExtendNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => extendMutation.mutate()}
              disabled={extendMutation.isPending}
            >
              {extendMutation.isPending ? "Extending..." : "Extend Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
