import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Sparkles, X } from "lucide-react";
import type { User, UserSubscription } from "@shared/schema";

export function RenewalReminder() {
  const [, navigate] = useLocation();
  const [showReminder, setShowReminder] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const { data } = useQuery<{ user: User }>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const user = data?.user;

  // Get user's subscriptions
  const { data: subscriptions } = useQuery<UserSubscription[]>({
    queryKey: ["/api/user-subscriptions"],
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (!user || !subscriptions) return;

    // Don't show for trial users
    if (user.isOnTrial) {
      setShowReminder(false);
      return;
    }

    // Find active subscription approaching expiry
    const now = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    const approachingExpiry = subscriptions.find(sub => {
      if (sub.status !== 'active' || !sub.subscriptionEndsAt) return false;
      
      const endDate = new Date(sub.subscriptionEndsAt);
      // Show if expiry is within next 14 days and hasn't expired yet
      return endDate > now && endDate <= twoWeeksFromNow;
    });

    if (approachingExpiry) {
      // Check localStorage for dismissal
      const dismissedUntil = localStorage.getItem('renewal_reminder_dismissed');
      if (dismissedUntil && new Date(dismissedUntil) > new Date()) {
        setShowReminder(false);
        return;
      }
      setShowReminder(!isDismissed);
    } else {
      setShowReminder(false);
    }
  }, [user, subscriptions, isDismissed]);

  if (!user || !subscriptions || !showReminder) return null;

  // Find the subscription approaching expiry
  const now = new Date();
  const approachingSub = subscriptions.find(sub => {
    if (sub.status !== 'active' || !sub.subscriptionEndsAt) return false;
    const endDate = new Date(sub.subscriptionEndsAt);
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    return endDate > now && endDate <= twoWeeksFromNow;
  });

  if (!approachingSub) return null;

  const daysLeft = Math.ceil(
    (new Date(approachingSub.subscriptionEndsAt!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleDismiss = () => {
    // Dismiss for 24 hours
    const dismissUntil = new Date();
    dismissUntil.setHours(dismissUntil.getHours() + 24);
    localStorage.setItem('renewal_reminder_dismissed', dismissUntil.toISOString());
    setIsDismissed(true);
    setShowReminder(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <div className="max-w-7xl mx-auto pointer-events-auto">
        <Card className="border-primary/20 bg-primary/5 shadow-lg" data-testid="banner-renewal-reminder">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-base">Langganan Akan Tamat</h3>
                  <Badge variant="outline" className="text-sm">
                    {daysLeft} hari lagi
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Langganan {approachingSub.planName} anda akan tamat. Perbaharui sekarang untuk akses tanpa gangguan.
                </p>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={() => {
                      setShowReminder(false);
                      navigate("/pricing?renew=true");
                    }}
                    size="sm"
                    data-testid="button-renew-subscription"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Perbaharui Sekarang
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    data-testid="button-dismiss-renewal"
                  >
                    Kemudian
                  </Button>
                </div>
              </div>

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleDismiss}
                data-testid="button-close-renewal"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
