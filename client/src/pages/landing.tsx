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
  ChevronRight,
  Sparkles,
  ShoppingCart,
  Users,
  TrendingUp,
  Factory
} from "lucide-react";
import type { User } from "@shared/schema";
import heroImage from "@assets/stock_images/small_business_owner_9704c9ed.jpg";
import dashboardImage from "@assets/stock_images/business_dashboard_a_ffb04572.jpg";
import ColorThemeSwitcher from "@/components/ColorThemeSwitcher";

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
      icon: <Package className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: "Pengurusan Stok Pintar",
      description: "Jejak stok real-time, alert stok rendah, pengiraan kos auto, resit bahan lengkap dengan keuntungan. Sistem FIFO untuk finished goods.",
      image: "PLACEHOLDER_STOCK_MANAGEMENT", // Screenshot: Stock dashboard with low stock alerts
      highlight: false,
    },
    {
      icon: <Factory className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: "Perancangan Pengeluaran",
      description: "Planning pengeluaran pintar dengan material calculation auto, validasi stok real-time, shortage alerts, dan batch tracking lengkap.",
      image: "PLACEHOLDER_PRODUCTION_PLANNING", // Screenshot: Production planning interface
      highlight: false,
    },
    {
      icon: <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: "Sistem POS (Point of Sale)",
      description: "Jualan mudah dengan receipt auto, tracking payment methods, profit tracking, FIFO stock deduction, dan PDF receipt generation.",
      image: "PLACEHOLDER_POS_SYSTEM", // Screenshot: POS interface with cart
      highlight: false,
    },
    {
      icon: <Receipt className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: "Invois Thermal 80mm + WhatsApp",
      description: "🔥 Print thermal invoice 80mm professional, auto-share via WhatsApp, QR payment code, bank details, breakdown lengkap expired/rosak.",
      image: "PLACEHOLDER_THERMAL_INVOICE", // Screenshot: Thermal invoice with QR code
      highlight: true,
    },
    {
      icon: <Truck className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: "Penghantaran & Konsainan Pintar",
      description: "Rekod penghantaran, tracking expired/rosak real-time, pengiraan komisyen auto, tuntutan vendor dengan breakdown terperinci (kasar → tolak → bersih → komisyen).",
      image: "PLACEHOLDER_DELIVERY_CLAIMS", // Screenshot: Claims page with calculation breakdown
      highlight: true,
    },
    {
      icon: <Users className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: "Modul Ejen Jualan",
      description: "Sistem distribution nationwide dengan multi-tier pricing, stock transfer auto-price, payment tracking, dan performance analytics.",
      image: "PLACEHOLDER_AGENT_MODULE", // Screenshot: Agent management interface
      highlight: false,
    },
    {
      icon: <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: "Dashboard Automation Pintar",
      description: "🔥 Low stock alerts auto, weekly profit summary, daily task checklist, motivational insights, auto-calculation instant updates tanpa reload.",
      image: "PLACEHOLDER_DASHBOARD_AUTOMATION", // Screenshot: Dashboard with alerts and insights
      highlight: true,
    },
    {
      icon: <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: "Laporan P&L Lengkap",
      description: "Dashboard real-time, carta interaktif, profit/loss analysis, track prestasi produk, laporan bulanan auto.",
      image: "PLACEHOLDER_PNL_REPORTS", // Screenshot: P&L dashboard with charts
      highlight: false,
    },
    {
      icon: <Smartphone className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: "Mobile-First Design",
      description: "Fully responsive, optimized untuk mobile, touch gestures (swipe-to-pay), quick actions FAB, installable PWA.",
      image: "PLACEHOLDER_MOBILE_DESIGN", // Screenshot: Mobile interface
      highlight: false,
    },
    {
      icon: <Cloud className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: "Google Drive Auto-Sync",
      description: "Backup auto ke Google Drive, sync invoices & reports, access dari mana-mana, disaster recovery ready.",
      image: "PLACEHOLDER_GOOGLE_DRIVE", // Screenshot: Google Drive sync interface
      highlight: false,
    },
  ];

  const plans = [
    {
      name: "Basic",
      icon: Star,
      monthlyPrice: 20,
      description: "Sesuai untuk perniagaan kecil",
      features: [
        "Unlimited produk & stok",
        "Penghantaran & tuntutan",
        "Laporan asas",
        "1 pengguna",
        "Aplikasi mobile",
      ],
      popular: false,
    },
    {
      name: "Pro",
      icon: Zap,
      monthlyPrice: 35,
      description: "Untuk perniagaan sederhana",
      features: [
        "Semua ciri Basic",
        "Google Drive sync",
        "Laporan terperinci",
        "3 pengguna",
        "Sokongan prioriti",
        "Laporan custom",
      ],
      popular: true,
    },
    {
      name: "Premium",
      icon: Crown,
      monthlyPrice: 50,
      description: "Untuk perniagaan besar",
      features: [
        "Semua ciri Pro",
        "Unlimited pengguna",
        "Akses API",
        "White-label pilihan",
        "Sokongan dedikasi",
        "Integrasi custom",
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
        <div className="max-w-7xl mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="text-lg sm:text-xl font-bold">PocketBizz</span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <button 
              onClick={() => navigate("/pricing")}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Harga
            </button>
            <button 
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Features
            </button>
            <button 
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Demo
            </button>
          </nav>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 hidden sm:flex"
              onClick={() => navigate("/auth/login")}
              data-testid="link-login"
            >
              Log Masuk
            </Button>
            <Button
              size="sm"
              className="h-9"
              onClick={() => navigate("/auth/register")}
              data-testid="button-register-hero"
            >
              Cuba Percuma
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-28">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-8 md:gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <Badge className="text-xs sm:text-sm gap-1.5 inline-flex" data-testid="badge-early-bird">
                <Sparkles className="h-3 w-3" />
                <span className="hidden xs:inline">Early Bird: 70% OFF untuk 100 pengguna pertama!</span>
                <span className="xs:hidden">70% OFF - Early Bird!</span>
              </Badge>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-tight">
                Peniaga Bakeri Jimat{" "}
                <span className="text-primary">10 Jam Seminggu</span>
                {" "}& Untung Naik 25%
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed">
                500+ peniaga dah transform bisnes dengan sistem auto yang handle stok, pengeluaran, jualan, vendor claims & laporan. 
                Semua dalam 1 platform. <span className="font-semibold text-foreground">100% Bahasa Melayu.</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                size="lg"
                className="w-full sm:w-auto min-h-[56px] sm:min-h-[48px] text-base sm:text-lg px-8 font-semibold"
                onClick={() => navigate("/auth/register")}
                data-testid="button-start-trial"
              >
                Mula Percuma 7 Hari
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto min-h-[56px] sm:min-h-[48px] text-base sm:text-lg px-8"
                onClick={() => navigate("/pricing")}
                data-testid="button-view-pricing"
              >
                Lihat Harga
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 xs:gap-6 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Tiada credit card</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Setup dalam 5 minit</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Cancel bila-bila masa</span>
                </div>
              </div>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
                <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm font-semibold text-foreground">💯 30-Hari Money Back Guarantee</span>
              </div>
            </div>
          </div>

          <div className="relative order-first lg:order-last">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl sm:rounded-3xl blur-3xl" />
            <img
              src={heroImage}
              alt="Peniaga guna PocketBizz"
              className="relative rounded-2xl sm:rounded-3xl shadow-2xl w-full"
            />
          </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 space-y-3 md:space-y-4 max-w-3xl mx-auto">
            <Badge variant="outline" className="text-xs sm:text-sm">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Testimonials
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              500+ Peniaga Dah Transform Bisnes
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Dengar sendiri pengalaman peniaga yang dah guna PocketBizz
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Testimonial 1 */}
            <Card className="hover-elevate">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      SN
                    </div>
                    <div>
                      <CardTitle className="text-base">Siti Nurhaliza</CardTitle>
                      <CardDescription className="text-sm">Kek Sedap Melaka</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "Before PocketBizz, aku spend <span className="font-semibold text-foreground">3 jam sehari</span> untuk kira stok manual. 
                  Sekarang <span className="font-semibold text-foreground">15 minit je</span>, auto semua. Untung naik <span className="font-semibold text-primary">30%</span> sebab tak lost track lagi!"
                </p>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="hover-elevate">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      AR
                    </div>
                    <div>
                      <CardTitle className="text-base">Ahmad Razali</CardTitle>
                      <CardDescription className="text-sm">Roti Canai Empire</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "Thermal invoice feature tu game changer! <span className="font-semibold text-foreground">Direct WhatsApp</span> lepas print, customer pun happy. 
                  Order naik <span className="font-semibold text-primary">40%</span> sebab nampak professional sangat."
                </p>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="hover-elevate">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      FZ
                    </div>
                    <div>
                      <CardTitle className="text-base">Fatimah Zahra</CardTitle>
                      <CardDescription className="text-sm">Donut Gebu KL</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "Vendor claims dulu memang pening kepala. Sekarang system auto calculate, <span className="font-semibold text-foreground">transparent</span> semua breakdown. 
                  Vendor pun happy, takde complain dah. <span className="font-semibold text-primary">Jimat 5 jam seminggu</span>!"
                </p>
              </CardContent>
            </Card>

            {/* Testimonial 4 */}
            <Card className="hover-elevate">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      MH
                    </div>
                    <div>
                      <CardTitle className="text-base">Mohd Hafiz</CardTitle>
                      <CardDescription className="text-sm">Kuih Tradisi Penang</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "Dashboard insights tu memang best! Tahu exactly mana produk laku, mana slow. 
                  Boleh plan production dengan <span className="font-semibold text-foreground">smart</span>. Waste turun <span className="font-semibold text-primary">60%</span>!"
                </p>
              </CardContent>
            </Card>

            {/* Testimonial 5 */}
            <Card className="hover-elevate">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      RA
                    </div>
                    <div>
                      <CardTitle className="text-base">Rosnah Ahmad</CardTitle>
                      <CardDescription className="text-sm">Biskut Raya Johor</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "Modul ejen tu perfect untuk expand business. <span className="font-semibold text-foreground">15 ejen</span> nationwide sekarang, 
                  semua tracking auto. Revenue <span className="font-semibold text-primary">3x ganda</span> dalam 6 bulan!"
                </p>
              </CardContent>
            </Card>

            {/* Testimonial 6 */}
            <Card className="hover-elevate border-primary bg-primary/5">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                      IK
                    </div>
                    <div>
                      <CardTitle className="text-base">Ismail Kamal</CardTitle>
                      <CardDescription className="text-sm">Murtabak Legend</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "Worth every sen! ROI <span className="font-semibold text-primary">balik dalam 2 minggu</span> je sebab efficie ncy naik drastik. 
                  Sekarang boleh focus <span className="font-semibold text-foreground">grow business</span>, bukan stuck dengan paperwork."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 md:mb-16 space-y-3 md:space-y-4 max-w-3xl mx-auto">
          <Badge variant="outline" className="text-xs sm:text-sm">
            Features Lengkap
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
            Semua Yang Anda Perlukan Untuk Uruskan Perniagaan
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
            Dari pengurusan stok hingga laporan kewangan, semua ada dalam satu platform yang mudah digunakan.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className={`hover-elevate ${feature.highlight ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : ''}`}
              data-testid={`card-feature-${index}`}
            >
              <CardHeader className="space-y-3 sm:space-y-4">
                <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center ${
                  feature.highlight ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                }`}>
                  {feature.icon}
                </div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  {feature.title}
                  {feature.highlight && (
                    <Badge variant="secondary" className="text-xs">NEW</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-sm sm:text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
                {/* Image Placeholder for screenshots */}
                {typeof feature.image === 'string' && feature.image.startsWith('PLACEHOLDER_') && (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                    <div className="text-center p-4">
                      <p className="text-xs text-muted-foreground font-mono">
                        {feature.image.replace('PLACEHOLDER_', '').replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        📸 Screenshot Coming Soon
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        </div>
      </section>

      {/* Highlighted Features Section - NEW FEATURES */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 space-y-3 md:space-y-4 max-w-3xl mx-auto px-4">
          <Badge className="text-xs sm:text-sm gap-1.5">
            <Sparkles className="h-3 w-3" />
            Features Terbaru 2025
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Features Yang Mengubah Cara Anda Bekerja
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Inovasi terkini yang direka untuk memudahkan operasi harian perniagaan anda
          </p>
        </div>

        {/* Feature 1: Thermal Invoice + WhatsApp */}
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-2 items-center mb-16">
          <div className="space-y-4 sm:space-y-6">
            <Badge variant="secondary" className="text-xs sm:text-sm">🔥 Paling Popular</Badge>
            <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Print Invois Thermal 80mm + WhatsApp Share
            </h3>
            <div className="space-y-3 text-muted-foreground">
              <p className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Print invois thermal 80mm professional - compatible dengan kebanyakan thermal printer</span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Share terus ke WhatsApp vendor - satu klik jer, auto-attach gambar invoice</span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>QR code payment DuitNow + bank details - vendor scan jer terus bayar</span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Breakdown lengkap: Kasar → Tolak Rosak → Bersih → Komisyen → Jumlah Keseluruhan</span>
              </p>
            </div>
          </div>
          <div className="order-first lg:order-last">
            <div className="aspect-[4/5] bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-dashed border-primary/20 flex items-center justify-center">
              <div className="text-center p-8">
                <Receipt className="h-16 w-16 text-primary mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">Thermal Invoice Screenshot</p>
                <p className="text-sm text-muted-foreground font-mono">THERMAL_INVOICE_80MM</p>
                <p className="text-xs text-muted-foreground mt-4">
                  📸 Screenshot invois thermal dengan<br/>
                  QR code, breakdown, dan bank details
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Claims & Commission System */}
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-2 items-center mb-16">
          <div className="order-2 lg:order-1">
            <div className="aspect-video bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border-2 border-dashed border-blue-500/20 flex items-center justify-center">
              <div className="text-center p-8">
                <BarChart3 className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">Claims Dashboard Screenshot</p>
                <p className="text-sm text-muted-foreground font-mono">CLAIMS_BREAKDOWN_INTERFACE</p>
                <p className="text-xs text-muted-foreground mt-4">
                  📸 Screenshot page tuntutan vendor dengan<br/>
                  calculation breakdown & rejected items tracking
                </p>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 space-y-4 sm:space-y-6">
            <Badge variant="secondary" className="text-xs sm:text-sm">🎯 Jimat Masa</Badge>
            <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Sistem Tuntutan & Komisyen Automatik
            </h3>
            <div className="space-y-3 text-muted-foreground">
              <p className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Tracking expired/rosak real-time - update jer qty, sistem auto-calculate semua</span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Komisyen vendor auto - setup sekali, lepas tu auto-potong untuk semua invoice</span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Breakdown transparent - vendor nampak jelas calculation dari kasar sampai final amount</span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Per-invoice actions - print atau WhatsApp individual invoice dengan satu klik</span>
              </p>
            </div>
          </div>
        </div>

        {/* Feature 3: Real-time Updates */}
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-2 items-center">
          <div className="space-y-4 sm:space-y-6">
            <Badge variant="secondary" className="text-xs sm:text-sm">⚡ Lightning Fast</Badge>
            <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Auto-Calculation Tanpa Reload
            </h3>
            <div className="space-y-3 text-muted-foreground">
              <p className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Instant updates - ubah expired qty, calculation auto-adjust realtime</span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>No page refresh - semua update smooth tanpa reload page, jimat data</span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Smart caching - data load cepat, calculation accurate, battery-friendly</span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Business header auto-sync - company info update sekali, semua invoice auto-update</span>
              </p>
            </div>
          </div>
          <div className="order-first lg:order-last">
            <div className="aspect-video bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl border-2 border-dashed border-green-500/20 flex items-center justify-center">
              <div className="text-center p-8">
                <Zap className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">Real-time Update Demo</p>
                <p className="text-sm text-muted-foreground font-mono">REALTIME_CALCULATION_DEMO</p>
                <p className="text-xs text-muted-foreground mt-4">
                  📸 Screenshot atau screen recording<br/>
                  showing real-time calculation updates
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 space-y-3 md:space-y-4 max-w-3xl mx-auto">
            <Badge variant="outline" className="text-xs sm:text-sm">
              Perbezaan Yang Jelas
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              PocketBizz vs Cara Lama
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Lihat sendiri macam mana PocketBizz jimatkan masa & tingkatkan keuntungan anda
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden rounded-xl border">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th scope="col" className="py-4 px-4 sm:px-6 text-left text-sm font-semibold">
                        Kerja Harian
                      </th>
                      <th scope="col" className="py-4 px-4 sm:px-6 text-left text-sm font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Manual / Excel</span>
                        </div>
                      </th>
                      <th scope="col" className="py-4 px-4 sm:px-6 text-left text-sm font-semibold bg-primary/10">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="text-primary">PocketBizz</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    <tr className="hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4 sm:px-6 text-sm font-medium">Update Stok</td>
                      <td className="py-4 px-4 sm:px-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="text-destructive">✍️ 30 minit</span>
                        </div>
                        <p className="text-xs mt-1">Manual key-in, typo biasa, slow</p>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-sm bg-primary/5">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-primary">⚡ 10 saat</span>
                        </div>
                        <p className="text-xs mt-1 text-muted-foreground">Auto-sync, zero errors</p>
                      </td>
                    </tr>

                    <tr className="hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4 sm:px-6 text-sm font-medium">Kira Untung Rugi</td>
                      <td className="py-4 px-4 sm:px-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="text-destructive">📊 2 jam</span>
                        </div>
                        <p className="text-xs mt-1">Manual calculation, prone to errors</p>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-sm bg-primary/5">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-primary">🎯 Auto Realtime</span>
                        </div>
                        <p className="text-xs mt-1 text-muted-foreground">Live dashboard, accurate 100%</p>
                      </td>
                    </tr>

                    <tr className="hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4 sm:px-6 text-sm font-medium">Thermal Invoice</td>
                      <td className="py-4 px-4 sm:px-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="text-destructive">❌ Takde</span>
                        </div>
                        <p className="text-xs mt-1">Manual receipt, tak professional</p>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-sm bg-primary/5">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-primary">✅ 80mm Pro</span>
                        </div>
                        <p className="text-xs mt-1 text-muted-foreground">Auto WhatsApp share, QR code</p>
                      </td>
                    </tr>

                    <tr className="hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4 sm:px-6 text-sm font-medium">Vendor Claims</td>
                      <td className="py-4 px-4 sm:px-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="text-destructive">😵 Kelam-kabut</span>
                        </div>
                        <p className="text-xs mt-1">Dispute banyak, calculation manual</p>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-sm bg-primary/5">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-primary">✨ Auto & Transparent</span>
                        </div>
                        <p className="text-xs mt-1 text-muted-foreground">Breakdown clear, vendor happy</p>
                      </td>
                    </tr>

                    <tr className="hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4 sm:px-6 text-sm font-medium">Production Planning</td>
                      <td className="py-4 px-4 sm:px-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="text-destructive">📝 1 jam</span>
                        </div>
                        <p className="text-xs mt-1">Kira manual, stok shortage surprise</p>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-sm bg-primary/5">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-primary">🚀 Smart Auto</span>
                        </div>
                        <p className="text-xs mt-1 text-muted-foreground">Material calculation + alerts</p>
                      </td>
                    </tr>

                    <tr className="hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4 sm:px-6 text-sm font-medium">Mobile Access</td>
                      <td className="py-4 px-4 sm:px-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="text-destructive">❌ Desktop Only</span>
                        </div>
                        <p className="text-xs mt-1">Stuck at office, tak flexible</p>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-sm bg-primary/5">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-primary">📱 Anywhere</span>
                        </div>
                        <p className="text-xs mt-1 text-muted-foreground">Phone/tablet/desktop, on-the-go</p>
                      </td>
                    </tr>

                    <tr className="bg-muted/30">
                      <td className="py-4 px-4 sm:px-6 text-sm font-bold">Total Masa/Minggu</td>
                      <td className="py-4 px-4 sm:px-6 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-destructive">~15 jam</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-sm bg-primary/10">
                        <div className="flex items-center gap-2">
                          <Crown className="h-5 w-5 text-primary" />
                          <span className="text-lg font-bold text-primary">~5 jam</span>
                        </div>
                        <p className="text-xs mt-1 font-semibold text-primary">Jimat 10 jam seminggu! 🎉</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Button
              size="lg"
              className="text-base sm:text-lg px-8 font-semibold"
              onClick={() => navigate("/auth/register")}
            >
              Cuba Percuma 7 Hari
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Join 500+ peniaga yang dah transform bisnes dengan PocketBizz
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-2 items-center">
          <div className="order-2 lg:order-1">
            <img
              src={dashboardImage}
              alt="Dashboard PocketBizz"
              className="rounded-xl sm:rounded-2xl shadow-xl w-full"
            />
          </div>
          <div className="order-1 lg:order-2 space-y-4 sm:space-y-6">
            <Badge variant="outline" className="text-xs sm:text-sm">Kenapa PocketBizz?</Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              Direka Khas Untuk Peniaga Malaysia
            </h2>
            <div className="space-y-4 sm:space-y-6">
              <div className="flex gap-3 sm:gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm sm:text-base">Setup Pantas</h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    Mula guna dalam 5 minit. Import data existing dengan mudah. Tutorial Bahasa Melayu disediakan.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm sm:text-base">Mobile-Friendly</h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    Akses dari mana-mana - phone, tablet, atau computer. Kerja on-the-go dengan mudah.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm sm:text-base">Data Selamat</h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    Backup auto ke Google Drive. Enkripsi SSL. Server di Malaysia. Data anda 100% selamat.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 md:mb-16 space-y-3 md:space-y-4 max-w-3xl mx-auto px-4">
          <Badge variant="outline" className="text-xs sm:text-sm">
            Harga Berpatutan
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
            Pilih Pakej Yang Sesuai
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
            Jimat sehingga 20% dengan bayaran tahunan. Early bird special: 70% OFF!
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
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
                  <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                    <Badge className="text-xs sm:text-sm">Paling Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-6 sm:pb-8 space-y-3 sm:space-y-4">
                  <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm sm:text-base">{plan.description}</CardDescription>
                  <div className="pt-2 sm:pt-4">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-lg sm:text-2xl font-medium text-muted-foreground">Dari</span>
                      <span className="text-3xl sm:text-4xl font-bold">RM {plan.monthlyPrice}</span>
                      <span className="text-sm sm:text-base text-muted-foreground">/bulan</span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                      Jimat 10-20% dengan pakej 6-12 bulan
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <ul className="space-y-2 sm:space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-xs sm:text-sm">{feature}</span>
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

        <div className="text-center mt-8 sm:mt-12">
          <Button
            variant="ghost"
            onClick={() => navigate("/pricing")}
            data-testid="link-full-pricing"
          >
            Lihat perbandingan lengkap
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 md:mb-16 space-y-3 md:space-y-4 max-w-3xl mx-auto px-4">
          <Badge variant="outline" className="text-xs sm:text-sm">
            FAQ
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
            Soalan Lazim
          </h2>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 max-w-5xl mx-auto">
          {faqs.map((faq, index) => (
            <Card key={index} className="hover-elevate" data-testid={`card-faq-${index}`}>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">{faq.q}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
        <div className="max-w-7xl mx-auto">
        <div className="py-12 sm:py-16 md:py-20 bg-primary text-primary-foreground rounded-2xl sm:rounded-3xl">
          <div className="text-center space-y-6 sm:space-y-8 max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl leading-tight">
              Mula Uruskan Perniagaan Dengan Lebih Mudah Hari Ini
            </h2>
            <p className="text-base sm:text-lg md:text-xl opacity-90 leading-relaxed">
              Join ribuan peniaga Malaysia yang dah guna PocketBizz untuk uruskan perniagaan mereka.
              Trial percuma 7 hari. Tiada credit card diperlukan.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => navigate("/auth/register")}
                data-testid="button-final-cta"
              >
                Cuba Percuma Sekarang
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => navigate("/pricing")}
              >
                Lihat Demo
              </Button>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 border-t">
        <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-6 sm:gap-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="font-semibold">PocketBizz</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              <button onClick={() => navigate("/pricing")} className="hover:text-foreground transition-colors">Harga</button>
              <button className="hover:text-foreground transition-colors">Hubungi Kami</button>
              <button className="hover:text-foreground transition-colors">Terms</button>
              <button className="hover:text-foreground transition-colors">Privacy</button>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 text-xs sm:text-sm text-muted-foreground text-center">
            <p>© 2025 PocketBizz. Hak Cipta Terpelihara.</p>
            <p className="font-medium">BNI Digital Enterprise (TR0323644-V)</p>
          </div>
        </div>
        </div>
      </footer>

      {/* Color Theme Switcher - floating button bottom right */}
      <ColorThemeSwitcher />
    </div>
  );
}
