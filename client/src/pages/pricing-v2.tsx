import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap, TrendingUp, Clock, ShieldCheck, Gift, Users, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// BCL.my Payment Form URLs
const BCL_FORM_URLS = {
  basic: {
    3: "https://bnidigital.bcl.my/form/basic-3-bulan",
    6: "https://bnidigital.bcl.my/form/basic-6-bulan",
    12: "https://bnidigital.bcl.my/form/basic-12-bulan",
  },
  pro: {
    3: "https://bnidigital.bcl.my/form/pro-3-bulan",
    6: "https://bnidigital.bcl.my/form/pro-6-bulan",
    12: "https://bnidigital.bcl.my/form/pro-12-bulan",
  },
  premium: {
    3: "https://bnidigital.bcl.my/form/premium-3-bulan",
    6: "https://bnidigital.bcl.my/form/premium-6-bulan",
    12: "https://bnidigital.bcl.my/form/premium-12-bulan",
  },
} as const;

type SubscriptionPlan = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: string;
  discount6Months: string | null;
  discount12Months: string | null;
  currency: string;
  features: string[];
  maxUsers: number;
  maxProducts: number;
  isActive: number;
  sortOrder: number;
  createdAt: Date;
};

type TrialImpactStats = {
  daysUsed: number;
  daysRemaining: number;
  isOnTrial: boolean;
  trialEndsAt: string;
  stats: {
    totalSales: number;
    salesCount: number;
    productsCount: number;
    customersCount: number;
    timeSavedHours: number;
    weeklyTimeSaved: number;
    wastePreventionEstimate: number;
    projectedMonthlySales: number;
  };
};

export default function PricingV2() {
  const [, setLocation] = useLocation();
  const [selectedDuration, setSelectedDuration] = useState<3 | 6 | 12>(6);
  const [upgradeDeadline, setUpgradeDeadline] = useState<Date | null>(null);
  
  const urlParams = new URLSearchParams(window.location.search);
  const isRenewal = urlParams.get('renew') === 'true';
  
  // Check if user is logged in
  const { data: userData, isError: isAuthError } = useQuery<{ user: any }>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });
  
  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });
  
  const { data: earlyBirdData } = useQuery<{ remaining: number, total: number }>({
    queryKey: ["/api/subscription/early-bird-slots"],
  });

  // Get trial impact stats for logged-in users
  const { data: trialImpact } = useQuery<TrialImpactStats>({
    queryKey: ["/api/user/trial-impact"],
    enabled: !!userData?.user && !isAuthError,
  });

  const earlyBirdSlotsRemaining = earlyBirdData?.remaining ?? 0;
  const earlyBirdDiscount = 50;

  // Calculate upgrade deadline (48 hours after trial ends)
  useEffect(() => {
    if (trialImpact?.trialEndsAt) {
      const trialEnd = new Date(trialImpact.trialEndsAt);
      const deadline = new Date(trialEnd.getTime() + (48 * 60 * 60 * 1000)); // +48 hours
      setUpgradeDeadline(deadline);
    }
  }, [trialImpact]);
  
  const handleSelectPlan = (plan: SubscriptionPlan) => {
    const isLoggedIn = userData?.user && !isAuthError;
    
    if (!isLoggedIn) {
      const params = new URLSearchParams({
        plan: plan.name,
        duration: selectedDuration.toString(),
        returnTo: '/subscription',
      });
      
      window.location.href = `/auth/register?${params.toString()}`;
      return;
    }
    
    // Unified 4-duration flow: send users to Subscription page
    setLocation('/subscription');
  };

  const planIcons = {
    basic: Star,
    pro: Zap,
    premium: Crown,
  };

  const planColors = {
    basic: "bg-background",
    pro: "bg-accent/10 border-accent",
    premium: "bg-primary/10 border-primary",
  };

  const planTargets = {
    basic: {
      untuk: "Homebaker, Online Seller (1 orang)",
      jimat: "5-8 jam/minggu (takde lagi Excel chaos)",
      icon: "👨‍🍳",
    },
    pro: {
      untuk: "Kedai Fizikal, F&B dengan Vendor",
      jimat: "RM500-1,500/bulan + 10-15 jam/minggu",
      icon: "🏪",
    },
    premium: {
      untuk: "Multi-branch, Franchise",
      jimat: "RM3,000+/bulan (kontrol pusat, audit trail)",
      icon: "🏢",
    },
  };
  
  const calculatePrice = (plan: SubscriptionPlan) => {
    const monthlyPrice = parseFloat(plan.monthlyPrice);
    let totalPrice = monthlyPrice * selectedDuration;
    
    if (selectedDuration === 6 && plan.discount6Months) {
      const discount = parseFloat(plan.discount6Months);
      totalPrice = totalPrice * (1 - discount / 100);
    } else if (selectedDuration === 12 && plan.discount12Months) {
      const discount = parseFloat(plan.discount12Months);
      totalPrice = totalPrice * (1 - discount / 100);
    }
    
    return Math.round(totalPrice).toFixed(2);
  };

  // Calculate per month price (after discount)
  const calculatePerMonthPrice = (plan: SubscriptionPlan) => {
    const totalPrice = parseFloat(calculatePrice(plan));
    return (totalPrice / selectedDuration).toFixed(2);
  };

  // Calculate per day price (after discount)
  const calculatePerDayPrice = (plan: SubscriptionPlan) => {
    const perMonthPrice = parseFloat(calculatePerMonthPrice(plan));
    return (perMonthPrice / 30).toFixed(2);
  };
  
  const calculateSavings = (plan: SubscriptionPlan) => {
    const monthlyPrice = parseFloat(plan.monthlyPrice);
    const fullPrice = monthlyPrice * selectedDuration;
    const discountedPrice = parseFloat(calculatePrice(plan));
    const savings = fullPrice - discountedPrice;
    const percentage = (savings / fullPrice) * 100;
    
    return { amount: savings.toFixed(2), percentage: percentage.toFixed(0) };
  };

  // Calculate ROI for trial impact
  const calculateROI = () => {
    if (!trialImpact) return null;
    
    const monthlyInvestment = 210; // Average monthly cost (based on package rates)
    const monthlySavings = (trialImpact.stats.weeklyTimeSaved * 4 * 25) + // Time saved @ RM25/hour
                          trialImpact.stats.wastePreventionEstimate;
    
    const roi = monthlyInvestment > 0 ? (monthlySavings / monthlyInvestment) : 0;
    
    return {
      investment: monthlyInvestment,
      savings: Math.round(monthlySavings),
      roi: roi.toFixed(1),
    };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-12">
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
      </div>
    );
  }

  const roi = calculateROI();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
      {/* Trial Impact Banner - ONLY for logged-in trial users */}
      {trialImpact && trialImpact.isOnTrial && (
        <div className="bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 rounded-lg p-6 sm:p-8 mb-8 border-2 border-primary">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              🎉 Pencapaian Trial Anda ({trialImpact.daysUsed} Hari)
            </h2>
            <p className="text-muted-foreground">
              Lihat apa yang anda dah capai dengan PocketBizz. Bayangkan kalau teruskan!
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-green-600">
                  RM{trialImpact.stats.totalSales.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Jualan Direkod
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {trialImpact.stats.salesCount} transaksi
                </div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-blue-600">
                  {trialImpact.stats.timeSavedHours}j
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Masa Jimat
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  ~{trialImpact.stats.weeklyTimeSaved}j/minggu
                </div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <ShieldCheck className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-purple-600">
                  RM{trialImpact.stats.wastePreventionEstimate}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Stock Waste Dielak
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  FIFO tracking
                </div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-orange-600">
                  {trialImpact.stats.customersCount}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Customer Data
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Untuk repeat sales
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ROI Calculation */}
          {roi && roi.savings > 0 && (
            <div className="bg-primary/10 rounded-lg p-6 border border-primary/30">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">
                  ⚡ Kalau Teruskan 1 Bulan Penuh:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Potensi Jimat</div>
                    <div className="text-2xl font-bold text-green-600">RM{roi.savings}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Kos Langganan</div>
                    <div className="text-2xl font-bold">RM{roi.investment}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">ROI</div>
                    <div className="text-3xl font-bold text-primary">{roi.roi}X</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Setiap RM1 yang anda invest, anda dapat balik RM{roi.roi}. 
                  <span className="font-semibold text-primary"> Berbaloi sangat!</span>
                </p>
              </div>
            </div>
          )}

          {/* Upgrade Bonus Deadline */}
          {upgradeDeadline && new Date() < upgradeDeadline && (
            <div className="mt-6 bg-orange-500/20 rounded-lg p-4 border border-orange-500/50">
              <div className="flex items-center justify-center gap-2">
                <Gift className="h-5 w-5 text-orange-600" />
                <div className="text-center">
                  <div className="font-bold text-orange-900">
                    🎁 BONUS: Subscribe dalam 48 jam = EXTRA 1 BULAN FREE!
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Beli 3 bulan, dapat 4 bulan. Jimat lagi RM70!
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Early Bird Banner */}
      {earlyBirdSlotsRemaining > 0 && (
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-lg p-6 mb-8 border border-primary/20">
          <div className="text-center space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-2">🚀 Tawaran Early Bird: 50% OFF</h2>
              <p className="text-lg text-muted-foreground">
                100 peniaga pertama sahaja. Hanya <span className="font-bold text-primary">RM1-2 sehari</span> untuk sistem pengurusan lengkap.
              </p>
            </div>
            
            <div className="bg-background rounded-lg px-6 py-3 max-w-md mx-auto border border-border">
              <p className="text-sm text-muted-foreground mb-2">Kod kupon:</p>
              <code className="text-xl font-bold font-mono text-primary tracking-wider bg-primary/10 px-4 py-2 rounded inline-block">
                POCKETBIZZ100
              </code>
              <p className="text-xs text-muted-foreground mt-2">Masukkan kod ini semasa pembayaran</p>
            </div>
            
            <div className="inline-flex items-center gap-2 bg-background rounded-lg px-4 py-2 border border-border">
              <span className="text-sm text-muted-foreground">Slot berbaki:</span>
              <span className="text-2xl font-bold text-primary">
                {earlyBirdSlotsRemaining}/100
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Social Proof Section */}
      <div className="bg-muted/30 rounded-lg p-6 mb-8 border">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold mb-2">Dipercayai 1,200+ Peniaga Malaysia</h3>
          <div className="flex items-center justify-center gap-2">
            <div className="flex">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-sm font-semibold">4.8/5</span>
            <span className="text-sm text-muted-foreground">(350+ reviews)</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-2">⭐⭐⭐⭐⭐</div>
              <p className="text-sm italic mb-2">
                "Sejak guna PocketBizz, sales naik 40%. Stock takde missing lagi!"
              </p>
              <p className="text-xs font-semibold">- Sarah, HomeBaker KL</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="mb-2">⭐⭐⭐⭐⭐</div>
              <p className="text-sm italic mb-2">
                "Jimat 10 jam seminggu. Sekarang boleh fokus buat kuih je."
              </p>
              <p className="text-xs font-semibold">- Aiman, Kedai Runcit Subang</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="mb-2">⭐⭐⭐⭐⭐</div>
              <p className="text-sm italic mb-2">
                "Game changer! Vendor claim sendiri, aku approve je. Senang!"
              </p>
              <p className="text-xs font-semibold">- Fatin, Cafe Ampang</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Pilih Pakej Yang Sesuai Untuk Bisnes Anda
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Sistem yang memang dibuat untuk peniaga Malaysia. Pilih berdasarkan saiz bisnes anda.
        </p>
      </div>
      
      {/* Duration Selector */}
      <div className="flex justify-center mb-8">
        <Tabs value={selectedDuration.toString()} onValueChange={(v) => setSelectedDuration(parseInt(v) as 3 | 6 | 12)}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="3">
              3 Bulan
            </TabsTrigger>
            <TabsTrigger value="6">
              <div className="flex flex-col items-center">
                <span>6 Bulan</span>
                <Badge variant="secondary" className="mt-1 text-xs">Jimat 10%</Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger value="12">
              <div className="flex flex-col items-center">
                <span>12 Bulan</span>
                <Badge variant="secondary" className="mt-1 text-xs">Jimat 20%</Badge>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
        {plans?.sort((a, b) => a.sortOrder - b.sortOrder).map((plan) => {
          const Icon = planIcons[plan.name as keyof typeof planIcons] || Star;
          const colorClass = planColors[plan.name as keyof typeof planColors] || "bg-background";
          const isPro = plan.name === "pro";
          const hasEarlyBird = earlyBirdSlotsRemaining > 0;
          const price = calculatePrice(plan);
          const savings = calculateSavings(plan);
          const target = planTargets[plan.name as keyof typeof planTargets];

          return (
            <Card
              key={plan.id}
              className={`relative ${colorClass} ${isPro ? "md:scale-105 md:shadow-xl" : ""}`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-accent text-accent-foreground">
                    Paling Popular
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-6 w-6 text-primary" />
                  <CardTitle className="text-2xl">{plan.displayName}</CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>

                {/* Plan Target */}
                {target && (
                  <div className="bg-accent/20 rounded-lg p-3 mt-3 border border-accent/30">
                    <div className="text-2xl mb-1">{target.icon}</div>
                    <div className="text-sm font-semibold mb-1">
                      Untuk: {target.untuk}
                    </div>
                    <div className="text-xs text-primary font-bold">
                      💰 Jimat: {target.jimat}
                    </div>
                  </div>
                )}
                
                {/* Pricing Display */}
                <div className="mt-4 space-y-3">
                  {/* Main Price - Per Month */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold font-mono text-primary">
                        RM{calculatePerMonthPrice(plan)}
                      </span>
                      <span className="text-lg text-muted-foreground">/bulan</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Bayar {selectedDuration} bulan: RM{price}
                    </div>
                  </div>

                  {/* Per Day Price */}
                  <div className="bg-accent/20 rounded-lg p-3 border border-accent/30">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">Hanya</div>
                      <div className="text-2xl font-bold text-accent-foreground">
                        RM{calculatePerDayPrice(plan)} <span className="text-sm font-normal">/hari</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Murah dari harga kopi!</div>
                    </div>
                  </div>
                  
                  {/* Early Bird Reminder */}
                  {hasEarlyBird && (
                    <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                      <p className="text-sm font-medium text-primary mb-1">
                        🎁 Guna kod <code className="font-mono font-bold">POCKETBIZZ100</code> untuk 50% OFF
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Selepas diskaun: <span className="font-semibold text-primary">
                          RM{(parseFloat(calculatePerMonthPrice(plan)) * 0.5).toFixed(2)}/bulan
                        </span> atau <span className="font-semibold text-primary">
                          RM{(parseFloat(calculatePerDayPrice(plan)) * 0.5).toFixed(2)}/hari
                        </span>
                      </p>
                    </div>
                  )}
                  
                  {parseFloat(savings.amount) > 0 && (
                    <p className="text-sm text-green-600 font-semibold">
                      ✓ Jimat RM{savings.amount} berbanding bayar bulanan
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm border-b pb-2">
                    <span className="text-muted-foreground">Had Produk:</span>
                    <span className="font-semibold">
                      {plan.maxProducts >= 999999 ? "Unlimited" : plan.maxProducts}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-b pb-2">
                    <span className="text-muted-foreground">Had Pengguna:</span>
                    <span className="font-semibold">
                      {plan.maxUsers >= 999 ? "Unlimited" : plan.maxUsers}
                    </span>
                  </div>
                </div>

                <div className="text-sm font-semibold mb-2">Ciri-ciri Utama:</div>
                <ul className="space-y-2">
                  {(typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features)
                    .slice(0, 6)
                    .map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  {plan.features.length > 6 && (
                    <li className="text-xs text-muted-foreground italic">
                      + {plan.features.length - 6} lagi...
                    </li>
                  )}
                </ul>
              </CardContent>

              <CardFooter className="pt-6">
                <Button
                  className="w-full text-base font-semibold"
                  variant={isPro ? "default" : "outline"}
                  size="lg"
                  onClick={() => handleSelectPlan(plan)}
                >
                  Pilih {plan.displayName}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Money-Back Guarantee */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 mb-8 border-2 border-green-500/50">
        <div className="text-center">
          <ShieldCheck className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-2xl font-bold mb-2">Jaminan 30 Hari</h3>
          <p className="text-lg mb-4">
            Tak puas hati? <span className="font-bold">Refund penuh</span>, no question asked.
          </p>
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto text-sm">
            <div>
              <Award className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="font-semibold">Cancel Bila-Bila Masa</div>
              <div className="text-muted-foreground">Takde contract mengikat</div>
            </div>
            <div>
              <Award className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="font-semibold">Data Export Percuma</div>
              <div className="text-muted-foreground">Bawa data anda pergi</div>
            </div>
            <div>
              <Award className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="font-semibold">Support 24/7</div>
              <div className="text-muted-foreground">Kami sentiasa ready</div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Soalan Lazim</h2>
        <div className="space-y-4 text-left">
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Betul ke boleh refund kalau tak puas hati?</h3>
            <p className="text-sm text-muted-foreground">
              100% refund dalam 30 hari pertama, no question asked. Kami yakin dengan PocketBizz, 
              jadi kami bagi anda peluang try risk-free. Kalau rasa tak sesuai, email je kami.
            </p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Macam mana nak claim early bird discount?</h3>
            <p className="text-sm text-muted-foreground">
              Masukkan kod <code className="font-mono font-bold bg-primary/10 px-2 py-1 rounded">POCKETBIZZ100</code> semasa 
              checkout untuk dapat 50% OFF. Terhad untuk 100 pengguna pertama sahaja. First come first served!
            </p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Boleh upgrade atau downgrade pakej tak?</h3>
            <p className="text-sm text-muted-foreground">
              Boleh! Anda boleh tukar pakej bila-bila masa. Kalau upgrade, bayar perbezaan je. 
              Kalau downgrade, kredit balance akan digunakan untuk renewal.
            </p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Data saya selamat tak?</h3>
            <p className="text-sm text-muted-foreground">
              Sangat selamat! Kami guna enkripsi standard banking, auto backup setiap hari, 
              dan server di Malaysia. Data anda HANYA untuk anda. Kami takkan share dengan sesiapa pun.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
