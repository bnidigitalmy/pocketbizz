import {
  LayoutDashboard,
  Cake,
  ChefHat,
  Package,
  Box,
  ShoppingCart,
  FileText,
  Truck,
  DollarSign,
  Receipt,
  BarChart3,
  Store,
  ClipboardCheck,
  Settings,
  Cloud,
  CreditCard,
  Crown,
  Users,
  TrendingUp,
  Tag,
  LogOut,
  Shield,
  UserCog,
  Award,
  Send,
  Ticket,
  CalendarCheck,
  Building2,
  AlertTriangle,
  Globe,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

// Overview
const overviewItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
];

// Pengurusan Stok
const stockManagementItems = [
  {
    title: "Produk & Resepi",
    url: "/products",
    icon: Cake,
  },
  {
    title: "Produksi",
    url: "/production",
    icon: ChefHat,
  },
  {
    title: "Stok Siap",
    url: "/finished-products",
    icon: Box,
  },
  {
    title: "Stok Gudang",
    url: "/stock",
    icon: Package,
  },
  {
    title: "Senarai Belian",
    url: "/shopping-list",
    icon: ShoppingCart,
  },
  {
    title: "Purchase Order",
    url: "/purchase-orders",
    icon: FileText,
  },
  {
    title: "Suppliers",
    url: "/suppliers",
    icon: Building2,
  },
];

// Vendor (Jualan melalui kedai)
const vendorItems = [
  {
    title: "Vendor",
    url: "/vendors",
    icon: Store,
  },
  {
    title: "Hantar ke Kedai",
    url: "/deliveries",
    icon: Truck,
  },
  {
    title: "Bayaran & Invoice",
    url: "/claims",
    icon: ClipboardCheck,
  },
];

// Direct Sales (Jualan terus)
const directSalesItems = [
  {
    title: "Tempahan",
    url: "/bookings",
    icon: CalendarCheck,
  },
  {
    title: "POS - Kaunter",
    url: "/pos",
    icon: CreditCard,
  },
  {
    title: "Jualan",
    url: "/sales",
    icon: DollarSign,
  },
  {
    title: "Pelanggan Setia",
    url: "/customers",
    icon: Award,
    comingSoon: true,
  },
  {
    title: "Broadcast",
    url: "/broadcast",
    icon: Send,
    comingSoon: true,
  },
  {
    title: "Voucher",
    url: "/vouchers",
    icon: Ticket,
    comingSoon: true,
  },
];

// Kewangan
const financeItems = [
  {
    title: "Perbelanjaan",
    url: "/expenses",
    icon: Receipt,
  },
  {
    title: "Laporan",
    url: "/reports",
    icon: BarChart3,
  },
];

// Ejen Jualan
const resellerItems = [
  {
    title: "Senarai Ejen",
    url: "/resellers",
    icon: Users,
    comingSoon: true,
  },
  {
    title: "Transfer Stok",
    url: "/reseller-transfer",
    icon: Truck,
    comingSoon: true,
  },
  {
    title: "Prestasi Ejen",
    url: "/reseller-performance",
    icon: TrendingUp,
    comingSoon: true,
  },
  {
    title: "Tetapan Tier",
    url: "/pricing-tiers",
    icon: Tag,
    comingSoon: true,
  },
];

// Sistem
const systemItems = [
  {
    title: "Katalog Kedai",
    url: "/store-catalog",
    icon: Globe,
    comingSoon: true,
  },
  {
    title: "Google Drive",
    url: "/drive-sync",
    icon: Cloud,
  },
  {
    title: "Subscription",
    url: "/subscription",
    icon: Crown,
  },
  {
    title: "Pricing Plans",
    url: "/pricing",
    icon: CreditCard,
  },
  {
    title: "Tetapan",
    url: "/settings",
    icon: Settings,
  },
];

// Admin (only for admin users)
const adminItems = [
  {
    title: "Admin Dashboard",
    url: "/admin",
    icon: Shield,
  },
  {
    title: "Pengurusan User",
    url: "/admin/users",
    icon: UserCog,
  },
];

export function AppSidebar() {
  const [location, navigate] = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();
  const { toast } = useToast();

  // Fetch current user to check if admin
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const isAdmin = (currentUser as any)?.isAdmin === 1;

  const handleMenuClick = () => {
    // Auto-close sidebar on mobile after navigation
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      
      // Close sidebar on mobile after logout
      if (isMobile) {
        setOpenMobile(false);
      }
      
      toast({
        title: "Logout Berjaya",
        description: "Anda telah log keluar dengan selamat.",
      });
      navigate("/auth/login");
    },
    onError: () => {
      toast({
        title: "Logout Gagal",
        description: "Sila cuba lagi.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <a 
          href="https://www.pocketbizz.my" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Cake className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">PocketBizz</h2>
            <p className="text-xs text-muted-foreground">Business Manager</p>
          </div>
        </a>
      </SidebarHeader>

      <SidebarContent>
        {/* Overview */}
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {overviewItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link 
                      href={item.url} 
                      onClick={handleMenuClick}
                      data-testid={`link-${item.url.slice(1) || 'dashboard'}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Pengurusan Stok */}
        <SidebarGroup>
          <SidebarGroupLabel>Pengurusan Stok</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {stockManagementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link 
                      href={item.url} 
                      onClick={handleMenuClick}
                      data-testid={`link-${item.url.slice(1)}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Vendor (Jualan melalui kedai) */}
        <SidebarGroup>
          <SidebarGroupLabel>Vendor</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {vendorItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link 
                      href={item.url} 
                      onClick={handleMenuClick}
                      data-testid={`link-${item.url.slice(1)}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Direct Sales (Jualan terus) */}
        <SidebarGroup>
          <SidebarGroupLabel>Direct Sales</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {directSalesItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link 
                      href={item.url} 
                      onClick={handleMenuClick}
                      data-testid={`link-${item.url.slice(1)}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {(item as any).comingSoon && (
                        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">Soon</Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Kewangan */}
        <SidebarGroup>
          <SidebarGroupLabel>Kewangan</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financeItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link 
                      href={item.url} 
                      onClick={handleMenuClick}
                      data-testid={`link-${item.url.slice(1)}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Ejen Jualan */}
        <SidebarGroup>
          <SidebarGroupLabel>Ejen Jualan</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resellerItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link 
                      href={item.url} 
                      onClick={handleMenuClick}
                      data-testid={`link-${item.url.slice(1)}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {(item as any).comingSoon && (
                        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">Soon</Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sistem */}
        <SidebarGroup>
          <SidebarGroupLabel>Sistem</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link 
                      href={item.url} 
                      onClick={handleMenuClick}
                      data-testid={`link-${item.url.slice(1)}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {(item as any).comingSoon && (
                        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">Soon</Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin - Only visible to admin users */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link 
                        href={item.url} 
                        onClick={handleMenuClick}
                        data-testid={`link-${item.url.slice(1)}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Logout Footer */}
      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              <span>{logoutMutation.isPending ? "Logging out..." : "Log Keluar"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
