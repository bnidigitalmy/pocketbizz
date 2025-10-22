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
  ChevronDown,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type SectionKey = "overview" | "stock" | "sales" | "finance" | "reseller" | "system";

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

// Helper function to determine which section a URL belongs to
function getSectionForUrl(url: string): SectionKey {
  if (url === "/dashboard") return "overview";
  
  const stockUrls = ["/products", "/production", "/finished-products", "/stock", "/shopping-list"];
  if (stockUrls.includes(url)) return "stock";
  
  const salesUrls = ["/vendors", "/deliveries", "/pos", "/sales", "/claims"];
  if (salesUrls.includes(url)) return "sales";
  
  const financeUrls = ["/expenses", "/reports"];
  if (financeUrls.includes(url)) return "finance";
  
  const resellerUrls = ["/resellers", "/reseller-transfer", "/reseller-performance", "/pricing-tiers"];
  if (resellerUrls.includes(url)) return "reseller";
  
  const systemUrls = ["/drive-sync", "/pricing", "/settings"];
  if (systemUrls.includes(url)) return "system";
  
  return "overview"; // default
}

export function AppSidebar() {
  const [location, navigate] = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();
  const { toast } = useToast();

  // Track which section is currently expanded (only one at a time - accordion behavior)
  // Can be undefined when all sections are collapsed
  const [activeSection, setActiveSection] = useState<SectionKey | undefined>("overview");

  // Auto-expand the section containing the current route
  useEffect(() => {
    const section = getSectionForUrl(location);
    setActiveSection(section);
  }, [location]);

  const handleMenuClick = () => {
    // Auto-close sidebar on mobile after navigation
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const toggleSection = (section: SectionKey, isOpen: boolean) => {
    // If clicking to close (isOpen = false), collapse by setting to undefined
    // If clicking to open (isOpen = true), expand that section
    setActiveSection(isOpen ? section : undefined);
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
        <Collapsible open={activeSection === "overview"} onOpenChange={(open) => toggleSection("overview", open)}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover-elevate">
                <span>Overview</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    activeSection === "overview" ? "rotate-180" : ""
                  }`}
                />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Pengurusan Stok */}
        <Collapsible open={activeSection === "stock"} onOpenChange={(open) => toggleSection("stock", open)}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover-elevate">
                <span>Pengurusan Stok</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    activeSection === "stock" ? "rotate-180" : ""
                  }`}
                />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Jualan & Operasi */}
        <Collapsible open={activeSection === "sales"} onOpenChange={(open) => toggleSection("sales", open)}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover-elevate">
                <span>Jualan & Operasi</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    activeSection === "sales" ? "rotate-180" : ""
                  }`}
                />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Kewangan */}
        <Collapsible open={activeSection === "finance"} onOpenChange={(open) => toggleSection("finance", open)}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover-elevate">
                <span>Kewangan</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    activeSection === "finance" ? "rotate-180" : ""
                  }`}
                />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Ejen Jualan */}
        <Collapsible open={activeSection === "reseller"} onOpenChange={(open) => toggleSection("reseller", open)}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover-elevate">
                <span>Ejen Jualan</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    activeSection === "reseller" ? "rotate-180" : ""
                  }`}
                />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Sistem */}
        <Collapsible open={activeSection === "system"} onOpenChange={(open) => toggleSection("system", open)}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover-elevate">
                <span>Sistem</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    activeSection === "system" ? "rotate-180" : ""
                  }`}
                />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
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
