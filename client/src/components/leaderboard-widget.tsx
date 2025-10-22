import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Award, Star, TrendingUp, Users, UserCog } from "lucide-react";

export function LeaderboardWidget() {
  const { data: vendorLeaderboard, isLoading: isLoadingVendors } = useQuery<any[]>({
    queryKey: ["/api/analytics/vendor-leaderboard"],
  });

  const { data: agentLeaderboard, isLoading: isLoadingAgents } = useQuery<any[]>({
    queryKey: ["/api/analytics/agent-leaderboard"],
  });

  if (isLoadingVendors && isLoadingAgents) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    );
  }

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Award className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Star className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground text-sm">#{index + 1}</span>;
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    if (index === 1) return "bg-gray-100 text-gray-800 border-gray-300";
    if (index === 2) return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-muted";
  };

  return (
    <Card data-testid="card-leaderboard">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Papan Pendahulu Prestasi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="vendors" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vendors" className="gap-2" data-testid="tab-vendors">
              <Users className="h-4 w-4" />
              Vendor
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-2" data-testid="tab-agents">
              <UserCog className="h-4 w-4" />
              Ejen
            </TabsTrigger>
          </TabsList>

          {/* Vendor Leaderboard */}
          <TabsContent value="vendors" className="space-y-3 mt-4">
            {vendorLeaderboard && vendorLeaderboard.length > 0 ? (
              vendorLeaderboard.slice(0, 5).map((vendor, index) => (
                <div
                  key={vendor.vendorId}
                  className={`flex items-center justify-between p-3 rounded-lg border ${getRankBadge(index)} hover-elevate`}
                  data-testid={`item-vendor-${vendor.vendorId}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-10 h-10">
                      {getMedalIcon(index)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium" data-testid={`text-vendor-name-${vendor.vendorId}`}>
                        {vendor.vendorName}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{vendor.state}</span>
                        <span>•</span>
                        <span>{vendor.totalDeliveries} hantar</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary" data-testid={`text-vendor-amount-${vendor.vendorId}`}>
                      RM {vendor.totalAmount}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {vendor.paymentRate}% bayar
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        ~{vendor.avgDaysToPayment} hari
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Belum ada data vendor</p>
              </div>
            )}
          </TabsContent>

          {/* Agent Leaderboard */}
          <TabsContent value="agents" className="space-y-3 mt-4">
            {agentLeaderboard && agentLeaderboard.length > 0 ? (
              agentLeaderboard.slice(0, 5).map((agent, index) => (
                <div
                  key={agent.resellerId}
                  className={`flex items-center justify-between p-3 rounded-lg border ${getRankBadge(index)} hover-elevate`}
                  data-testid={`item-agent-${agent.resellerId}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-10 h-10">
                      {getMedalIcon(index)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium" data-testid={`text-agent-name-${agent.resellerId}`}>
                        {agent.resellerName}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{agent.state}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {agent.pricingTier}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary" data-testid={`text-agent-amount-${agent.resellerId}`}>
                      RM {agent.totalAmount}
                    </p>
                    <div className="flex gap-2 mt-1 justify-end">
                      <Badge variant="outline" className="text-xs">
                        {agent.totalQty} unit
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {agent.paymentRate}% bayar
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UserCog className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Belum ada data ejen</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
