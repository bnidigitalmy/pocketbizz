import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  ArrowRight, 
  Package, 
  Truck, 
  Receipt, 
  BarChart3,
  Smartphone,
  Cloud,
  Zap,
  Shield,
  Star,
  Crown,
  ChevronRight
} from "lucide-react";
import type { User } from "@shared/schema";
import heroImage from "@assets/stock_images/small_business_owner_9704c9ed.jpg";
import dashboardImage from "@assets/stock_images/business_dashboard_a_ffb04572.jpg";

export default function Landing() {
  const [, navigate] = useLocation();

  // Check if user is already logged in
  const { data } = useQuery<{ user: User }>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    if (data?.user) {
      navigate("/dashboard");
    }
  }, [data, navigate]);

  const features = [
    {
      icon: <Package className="h-8 w-8" />,
      title: "Pengurusan Stok Pintar",
      description: "Jejak stok real-time, alert stok rendah, pengiraan kos auto, resit bahan lengkap dengan keuntungan. Sistem FIFO untuk finished goods.",
      image: dashboardImage,
    },
    {
      icon: <Truck className="h-8 w-8" />,
      title: "Penghantaran & Konsainan",
      description: "Rekod penghantaran, tracking status (hantar → tuntut → bayar), pengurusan tolakan/reject, pengiraan komisyen auto.",
      image: dashboardImage,
    },
    {
      icon: <Receipt className="h-8 w-8" />,
      title: "Tuntutan & Invois Profesional",
      description: "Jana invois PDF auto, tuntutan multi-vendor, breakdown terperinci (bruto → tolakan → bersih → komisyen), WhatsApp share.",
      image: dashboardImage,
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Laporan P&L Lengkap",
      description: "Dashboard real-time, carta interaktif, profit/loss analysis, track prestasi produk, laporan bulanan auto.",
      image: dashboardImage,
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "Mobile-First Design",
      description: "Fully responsive, optimized untuk mobile, touch gestures (swipe-to-pay), quick actions FAB, installable PWA.",
      image: dashboardImage,
    },
    {
      icon: <Cloud className="h-8 w-8" />,
      title: "Google Drive Auto-Sync",
      description: "Backup auto ke Google Drive, sync invoices & reports, access dari mana-mana, disaster recovery ready.",
      image: dashboardImage,
    },
  ];

  const plans = [
    {
      name: "Basic",
      icon: Star,
      price: "RM 20",
      period: "/bulan",
      description: "Perfect untuk perniagaan kecil",
      features: [
        "Unlimited produk & stok",
        "Penghantaran & tuntutan",
        "Laporan basic",
        "1 pengguna",
        "Mobile app",
      ],
      popular: false,
    },
    {
      name: "Pro",
      icon: Zap,
      price: "RM 35",
      period: "/bulan",
      description: "Untuk perniagaan sederhana",
      features: [
        "Semua features Basic",
        "Google Drive sync",
        "Laporan advance",
        "3 pengguna",
        "Priority support",
        "Custom reports",
      ],
      popular: true,
    },
    {
      name: "Premium",
      icon: Crown,
      price: "RM 50",
      period: "/bulan",
      description: "Untuk perniagaan besar",
      features: [
        "Semua features Pro",
        "Unlimited pengguna",
        "API access",
        "White-label option",
        "Dedicated support",
        "Custom integration",
      ],
      popular: false,
    },
  ];

  const faqs = [
    {
      q: "Berapa lama trial percuma?",
      a: "Trial percuma selama 7 hari dengan semua features (had 10 produk sahaja). Tiada credit card diperlukan untuk trial!",
    },
    {
      q: "Boleh cancel bila-bila masa?",
      a: "Ya! Tiada kontrak jangka panjang. Anda boleh cancel bila-bila masa. Data anda akan disimpan selama 30 hari selepas cancel.",
    },
    {
      q: "Ada diskaun untuk bayaran tahunan?",
      a: "Ya! Jimat 10% untuk 6 bulan, jimat 20% untuk 12 bulan. Early bird special: 70% OFF untuk 100 pengguna pertama!",
    },
    {
      q: "Data saya selamat ke?",
      a: "Sangat selamat! Kami guna enkripsi SSL, backup harian auto, dan server di Malaysia. Data anda adalah milik anda 100%.",
    },
    {
      q: "Boleh import data existing?",
      a: "Ya! Kami sediakan template Excel untuk import stok, produk, dan vendor. Team kami akan bantu setup awal percuma.",
    },
    {
      q: "Ada training atau tutorial?",
      a: "Ada! Kami sediakan video tutorial Bahasa Melayu, documentation lengkap, dan support team yang sedia membantu via WhatsApp.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header / Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">PocketBizz</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/pricing")}
              data-testid="link-pricing"
            >
              Harga
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/auth/login")}
              data-testid="link-login"
            >
              Log Masuk
            </Button>
            <Button
              onClick={() => navigate("/auth/register")}
              data-testid="button-register-hero"
            >
              Cuba Percuma
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="text-sm" data-testid="badge-early-bird">
                🎉 Early Bird: 70% OFF untuk 100 pengguna pertama!
              </Badge>
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Sistem Pengurusan Perniagaan{" "}
                <span className="text-primary">Paling Mudah</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Uruskan stok, penghantaran, tuntutan & laporan dalam satu platform. 
                Direka khas untuk peniaga kecil Malaysia. 100% Bahasa Melayu.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={() => navigate("/auth/register")}
                data-testid="button-start-trial"
              >
                Mula Percuma 7 Hari
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/pricing")}
                data-testid="button-view-pricing"
              >
                Lihat Harga
              </Button>
            </div>

            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Tiada credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Setup dalam 5 minit</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Cancel bila-bila masa</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-3xl blur-3xl" />
            <img
              src={heroImage}
              alt="Peniaga guna PocketBizz"
              className="relative rounded-3xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20 bg-muted/50">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="text-sm">
            Features Lengkap
          </Badge>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Semua Yang Anda Perlukan Untuk Uruskan Perniagaan
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Dari pengurusan stok hingga laporan kewangan, semua ada dalam satu platform yang mudah digunakan.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="hover-elevate" data-testid={`card-feature-${index}`}>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                  {feature.icon}
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container py-20">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div className="order-2 lg:order-1">
            <img
              src={dashboardImage}
              alt="Dashboard PocketBizz"
              className="rounded-2xl shadow-xl"
            />
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <Badge variant="outline">Kenapa PocketBizz?</Badge>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Direka Khas Untuk Peniaga Malaysia
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Setup Pantas</h3>
                  <p className="text-muted-foreground">
                    Mula guna dalam 5 minit. Import data existing dengan mudah. Tutorial Bahasa Melayu disediakan.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Mobile-Friendly</h3>
                  <p className="text-muted-foreground">
                    Akses dari mana-mana - phone, tablet, atau computer. Kerja on-the-go dengan mudah.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Data Selamat</h3>
                  <p className="text-muted-foreground">
                    Backup auto ke Google Drive. Enkripsi SSL. Server di Malaysia. Data anda 100% selamat.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="container py-20 bg-muted/50">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="text-sm">
            Harga Berpatutan
          </Badge>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Pilih Pakej Yang Sesuai
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Jimat sehingga 20% dengan bayaran tahunan. Early bird special: 70% OFF!
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <Card
                key={index}
                className={`relative hover-elevate ${
                  plan.popular ? "border-primary shadow-lg" : ""
                }`}
                data-testid={`card-plan-${plan.name.toLowerCase()}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="text-sm">Paling Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => navigate("/pricing")}
                  >
                    Pilih {plan.name}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button
            variant="ghost"
            onClick={() => navigate("/pricing")}
            data-testid="link-full-pricing"
          >
            Lihat perbandingan lengkap
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container py-20">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="text-sm">
            FAQ
          </Badge>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Soalan Lazim
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
          {faqs.map((faq, index) => (
            <Card key={index} className="hover-elevate" data-testid={`card-faq-${index}`}>
              <CardHeader>
                <CardTitle className="text-lg">{faq.q}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container py-20 bg-primary text-primary-foreground rounded-3xl">
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Mula Uruskan Perniagaan Dengan Lebih Mudah Hari Ini
          </h2>
          <p className="text-xl opacity-90">
            Join ribuan peniaga Malaysia yang dah guna PocketBizz untuk uruskan perniagaan mereka.
            Trial percuma 7 hari. Tiada credit card diperlukan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/auth/register")}
              data-testid="button-final-cta"
            >
              Cuba Percuma Sekarang
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/pricing")}
              className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
            >
              Lihat Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container py-12 border-t mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <span className="font-semibold">PocketBizz</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <button onClick={() => navigate("/pricing")}>Harga</button>
            <button>Hubungi Kami</button>
            <button>Terms</button>
            <button>Privacy</button>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 PocketBizz. Hak Cipta Terpelihara.
          </p>
        </div>
      </footer>
    </div>
  );
}
