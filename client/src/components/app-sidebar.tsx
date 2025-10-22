import {
  LayoutDashboard,
  Cake,
  ChefHat,
  Package,
  Box,
  ShoppingCart,
  Truck,
  DollarSign,
  Receipt,
  BarChart3,
  Store,
  ClipboardCheck,
  Settings,
  Cloud,
  CreditCard,
  Users,
  TrendingUp,
  Tag,
  LogOut,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
];

// Jualan & Operasi
const salesOperationsItems = [
  {
    title: "Vendor",
    url: "/vendors",
    icon: Store,
  },
  {
    title: "Hantar",
    url: "/deliveries",
    icon: Truck,
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
    title: "Tuntutan",
    url: "/claims",
    icon: ClipboardCheck,
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
  },
  {
    title: "Transfer Stok",
    url: "/reseller-transfer",
    icon: Truck,
  },
  {
    title: "Prestasi Ejen",
    url: "/reseller-performance",
    icon: TrendingUp,
  },
  {
    title: "Tetapan Tier",
    url: "/pricing-tiers",
    icon: Tag,
  },
];

// Sistem
const systemItems = [
  {
    title: "Google Drive",
    url: "/drive-sync",
    icon: Cloud,
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

export function AppSidebar() {
  const [location, navigate] = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();
  const { toast } = useToast();

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
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Cake className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">PocketBizz</h2>
            <p className="text-xs text-muted-foreground">Business Manager</p>
          </div>
        </div>
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

        {/* Jualan & Operasi */}
        <SidebarGroup>
          <SidebarGroupLabel>Jualan & Operasi</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {salesOperationsItems.map((item) => (
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
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
