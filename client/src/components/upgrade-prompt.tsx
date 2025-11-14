import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import type { UserSubscription } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Sparkles } from "lucide-react";
import type { User } from "@shared/schema";
import { PlanRecommendation } from "@/components/plan-recommendation";

export function UpgradePrompt() {
  const [, navigate] = useLocation();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const { data } = useQuery<{ user: User }>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const user = data?.user;

  // Get user's subscriptions to check for active paid subscription
  const { data: subscriptions } = useQuery<UserSubscription[]>({
    queryKey: ["/api/user-subscriptions"],
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (!user) return;

    // Check if user has an active paid subscription
    const hasActiveSubscription = subscriptions?.some(sub => 
      sub.status === 'active' && 
      sub.subscriptionEndsAt && 
      new Date(sub.subscriptionEndsAt) > new Date()
    );

    // Don't show prompt if user has active subscription
    if (hasActiveSubscription) {
      setShowPrompt(false);
      return;
    }

    // Check if user is on active trial
    const isOnActiveTrial = user.isOnTrial && user.trialEndsAt && new Date(user.trialEndsAt) > new Date();
    
    // Check if trial has expired
    const trialExpired = user.trialEndsAt && new Date(user.trialEndsAt) < new Date();
    
    // For active trials, check if user has dismissed the reminder
    if (isOnActiveTrial) {
      // Check localStorage for dismissal
      const dismissedUntil = localStorage.getItem('trial_reminder_dismissed');
      if (dismissedUntil && new Date(dismissedUntil) > new Date()) {
        setShowPrompt(false);
        return;
      }
      setShowPrompt(!isDismissed);
    } else if (trialExpired) {
      // Expired trial: always show (forced upgrade)
      setShowPrompt(true);
    } else {
      setShowPrompt(false);
    }
  }, [user, subscriptions, isDismissed]);

  if (!user || !showPrompt) return null;

  const isTrialExpired = user.isOnTrial === 0 && user.trialEndsAt && new Date(user.trialEndsAt) < new Date();
  const daysLeft = user.trialEndsAt ? Math.ceil((new Date(user.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <AlertDialog open={showPrompt}>
      <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-upgrade-prompt">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
          </div>
          <AlertDialogTitle className="text-2xl">
            {isTrialExpired ? "Trial Tamat - Pilih Plan Anda!" : "Pilih Plan yang Sesuai"}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 text-base">
            {isTrialExpired ? (
              <p className="font-medium text-base">
                Tempoh percubaan 7 hari anda telah tamat. Pilih plan berdasarkan data yang anda dah masukkan:
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Lihat plan yang paling sesuai dengan penggunaan anda
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Show Plan Recommendation Component */}
        <div className="py-4">
          <PlanRecommendation />
        </div>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          {!isTrialExpired && (
            <Button
              variant="outline"
              onClick={() => {
                // Dismiss for 24 hours
                const dismissUntil = new Date();
                dismissUntil.setHours(dismissUntil.getHours() + 24);
                localStorage.setItem('trial_reminder_dismissed', dismissUntil.toISOString());
                setIsDismissed(true);
                setShowPrompt(false);
              }}
              className="w-full sm:w-auto"
              data-testid="button-remind-later"
            >
              Ingatkan Kemudian
            </Button>
          )}
          <Button
            onClick={() => {
              setShowPrompt(false);
              navigate("/pricing");
            }}
            className="w-full sm:w-auto"
            data-testid="button-view-plans"
          >
            Lihat Pakej
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
