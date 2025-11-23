import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowUpCircle, Package, Users, Network, Database } from "lucide-react";
import { useLocation } from "wouter";

interface UsageStats {
  plan: string;
  usage: {
    products: ResourceUsage;
    vendors: ResourceUsage;
    resellers: ResourceUsage;
    stockItems: ResourceUsage;
  };
}

interface ResourceUsage {
  current: number;
  limit: number;
  percentage: number;
  canAdd: boolean;
}

async function fetchUsageStats(): Promise<UsageStats> {
  const response = await fetch('/api/subscription/usage', {
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch usage stats');
  }
  
  return response.json();
}

const RESOURCE_CONFIG = {
  products: {
    icon: Package,
    label: "Products",
    color: "blue"
  },
  vendors: {
    icon: Users,
    label: "Vendors",
    color: "green"
  },
  resellers: {
    icon: Network,
    label: "Resellers",
    color: "purple"
  },
  stockItems: {
    icon: Database,
    label: "Stock Items",
    color: "orange"
  }
};

function ResourceBar({ 
  resource, 
  data 
}: { 
  resource: keyof typeof RESOURCE_CONFIG; 
  data: ResourceUsage 
}) {
  const config = RESOURCE_CONFIG[resource];
  const Icon = config.icon;
  const isNearLimit = data.percentage >= 80;
  const isAtLimit = !data.canAdd;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 text-${config.color}-600`} />
          <span className="text-sm font-medium">{config.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {data.current} / {data.limit}
          </span>
          {isAtLimit && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Full
            </Badge>
          )}
          {isNearLimit && !isAtLimit && (
            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
              {data.percentage}%
            </Badge>
          )}
        </div>
      </div>
      <Progress 
        value={data.percentage} 
        className={`h-2 ${
          isAtLimit 
            ? 'bg-red-100 [&>div]:bg-red-500' 
            : isNearLimit 
            ? 'bg-orange-100 [&>div]:bg-orange-500'
            : `bg-${config.color}-100 [&>div]:bg-${config.color}-500`
        }`}
      />
    </div>
  );
}

export function UsageStatsCard() {
  const [, navigate] = useLocation();
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/subscription/usage'],
    queryFn: fetchUsageStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Usage</CardTitle>
          <CardDescription>Loading your plan limits...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-2 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null; // Silently fail - not critical
  }

  const hasNearLimitResource = Object.values(data.usage).some(
    r => r.percentage >= 80 && r.canAdd
  );
  const hasFullResource = Object.values(data.usage).some(r => !r.canAdd);

  return (
    <Card className={hasFullResource ? "border-red-200 bg-red-50/30" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Subscription Usage</CardTitle>
            <CardDescription>
              Current plan: <span className="font-semibold">{data.plan}</span>
            </CardDescription>
          </div>
          {(hasNearLimitResource || hasFullResource) && (
            <Button 
              size="sm" 
              variant={hasFullResource ? "default" : "outline"}
              onClick={() => navigate('/pricing')}
              className="gap-2"
            >
              <ArrowUpCircle className="h-4 w-4" />
              Upgrade
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(data.usage).map(([resource, resourceData]) => (
          <ResourceBar
            key={resource}
            resource={resource as keyof typeof RESOURCE_CONFIG}
            data={resourceData}
          />
        ))}

        {hasFullResource && (
          <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              You've reached your limit. Upgrade to add more.
            </p>
          </div>
        )}

        {hasNearLimitResource && !hasFullResource && (
          <div className="mt-4 p-3 bg-orange-100 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              You're approaching your plan limits. Consider upgrading soon.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
