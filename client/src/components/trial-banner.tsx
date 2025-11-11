import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Clock, Sparkles, X } from "lucide-react";
import { useState } from "react";
import type { User } from "@shared/schema";
import { Button } from "@/components/ui/button";

export function TrialBanner() {
  const [dismissed, setDismissed] = useState(false);
  
  const { data } = useQuery<{ user: User }>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const user = data?.user;

  if (!user || dismissed) return null;

  // Check if user is on active trial
  const isOnActiveTrial = user.isOnTrial && user.trialEndsAt && new Date(user.trialEndsAt) > new Date();
  
  // Check if in grace period (trial expired but grace period still active)
  const isInGracePeriod = !user.isOnTrial && user.graceEndsAt && new Date(user.graceEndsAt) > new Date();
  
  if (!isOnActiveTrial && !isInGracePeriod) return null;

  const daysLeft = isOnActiveTrial 
    ? Math.ceil((new Date(user.trialEndsAt!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : Math.ceil((new Date(user.graceEndsAt!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  // Show warning when 3 days or less OR in grace period
  const isUrgent = daysLeft <= 3 || isInGracePeriod;

  return (
    <div className={`${isUrgent ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'} border-b`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className={`h-10 w-10 rounded-full ${isUrgent ? 'bg-red-100' : 'bg-blue-100'} flex items-center justify-center`}>
              {isUrgent ? (
                <Clock className={`h-5 w-5 ${isUrgent ? 'text-red-600' : 'text-blue-600'}`} />
              ) : (
                <Sparkles className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${isUrgent ? 'text-red-900' : 'text-blue-900'}`}>
                {isInGracePeriod ? (
                  <>🚨 <strong>GRACE PERIOD</strong> - {daysLeft} hari lagi sebelum data diarkib!</>
                ) : isUrgent ? (
                  <>⚡ Trial anda tinggal <strong>{daysLeft} hari</strong> lagi!</>
                ) : (
                  <>✨ Anda sedang guna <strong>FULL ACCESS</strong> - {daysLeft} hari lagi!</>
                )}
              </p>
              <p className={`text-sm ${isUrgent ? 'text-red-700' : 'text-blue-700'}`}>
                {isInGracePeriod ? (
                  <>Subscribe sekarang untuk selamatkan semua data anda. Selepas ini data akan diarkib.</>
                ) : isUrgent ? (
                  <>Subscribe sekarang untuk terus guna semua features premium yang anda dah biasa</>
                ) : (
                  <>Cuba semua features premium - Analytics, Vendor Claims, Bookings & lebih lagi!</>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/pricing">
              <Button 
                size="sm" 
                className={isUrgent ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {isInGracePeriod || isUrgent ? 'Subscribe Sekarang' : 'Lihat Pakej'}
              </Button>
            </Link>
            {!isInGracePeriod && (
              <button
                onClick={() => setDismissed(true)}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
