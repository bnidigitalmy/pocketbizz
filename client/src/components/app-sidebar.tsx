import {
  LayoutDashboard,
  Cake,
  ChefHat,
  Truck,
  DollarSign,
  Receipt,
  BarChart3,
  Store,
  ClipboardCheck,
  Settings,
  Cloud,
} from "lucide-react";
import { Link, useLocation } from "wouter";
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
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
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
    title: "Jualan",
    url: "/sales",
    icon: DollarSign,
  },
  {
    title: "Perbelanjaan",
    url: "/expenses",
    icon: Receipt,
  },
  {
    title: "Tuntutan",
    url: "/claims",
    icon: ClipboardCheck,
  },
  {
    title: "Laporan",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "Google Drive",
    url: "/drive-sync",
    icon: Cloud,
  },
  {
    title: "Tetapan",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Cake className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">ManisBizz</h2>
            <p className="text-xs text-muted-foreground">Dessert Manager</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.url.slice(1) || 'dashboard'}`}>
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
    </Sidebar>
  );
}
