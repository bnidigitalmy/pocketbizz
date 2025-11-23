import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, TrendingUp, UserCheck, Settings, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/motion";
import { useLocation } from "wouter";

interface AdminStats {
  users: {
    total: number;
    activeTrial: number;
    expiredTrial: number;
    paid: number;
  };
  subscriptions: {
    active: number;
    total: number;
  };
  revenue: {
    mrr: string;
    currency: string;
  };
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  
  const { data: stats, isLoading } = useQuery<AdminStats>({ 
    queryKey: ['/api/admin/stats'],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Jumlah Pengguna",
      value: stats?.users?.total || 0,
      description: `${stats?.users?.paid || 0} pengguna berbayar`,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Trial Aktif",
      value: stats?.users?.activeTrial || 0,
      description: `${stats?.users?.expiredTrial || 0} trial tamat tempoh`,
      icon: UserCheck,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Subscription Aktif",
      value: stats?.subscriptions?.active || 0,
      description: `${stats?.subscriptions?.total || 0} jumlah subscription`,
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "MRR (Bulanan)",
      value: `RM ${stats?.revenue?.mrr || "0.00"}`,
      description: "Pendapatan berulang bulanan",
      icon: DollarSign,
      color: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <motion.div
      className="p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Pantau prestasi sistem dan pengguna PocketBizz
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/users")}>
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Button>
            <Button onClick={() => navigate("/admin/subscriptions")}>
              <CreditCard className="w-4 h-4 mr-2" />
              Subscriptions
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div key={stat.title} variants={itemVariants}>
            <Card className="hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Additional Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Status Pengguna</CardTitle>
              <CardDescription>
                Pecahan status pengguna semasa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pengguna Berbayar</span>
                <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                  {stats?.users?.paid || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Trial Aktif</span>
                <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                  {stats?.users?.activeTrial || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Trial Tamat Tempoh</span>
                <span className="font-mono font-semibold text-orange-600 dark:text-orange-400">
                  {stats?.users?.expiredTrial || 0}
                </span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Jumlah</span>
                  <span className="font-mono font-bold">
                    {stats?.users?.total || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>
                Statistik langganan pengguna
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Subscription Aktif</span>
                <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                  {stats?.subscriptions?.active || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Jumlah Subscription</span>
                <span className="font-mono font-semibold">
                  {stats?.subscriptions?.total || 0}
                </span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">MRR</span>
                  <span className="font-mono font-bold text-primary">
                    RM {stats?.revenue?.mrr || "0.00"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
