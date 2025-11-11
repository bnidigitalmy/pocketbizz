import { 
  LayoutDashboard, 
  ShoppingBag, 
  PlusCircle, 
  Bell, 
  Menu,
  X,
  Search,
  Package,
  ChefHat,
  BoxIcon,
  Warehouse,
  ShoppingCart,
  FileText,
  Building2,
  Store,
  Truck,
  Receipt,
  Users,
  Megaphone,
  Ticket,
  UserPlus,
  RefreshCw,
  TrendingUp,
  Cake,
  DollarSign
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  path?: string;
  onClick?: () => void;
  badge?: number;
  isSpecial?: boolean;
}

interface MobileBottomNavProps {
  className?: string;
}

export function MobileBottomNav({ className }: MobileBottomNavProps) {
  const [location] = useLocation();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Get pending orders count for badge
  const { data: bookings } = useQuery({
    queryKey: ['/api/bookings'],
    staleTime: 30 * 1000, // Refresh every 30s
  });

  const pendingCount = Array.isArray(bookings) 
    ? bookings.filter((b: any) => b.status === 'pending' || b.status === 'confirmed').length 
    : 0;

  // TODO: Get unread notifications count
  const notificationCount = 0; // Placeholder for now

  const navItems: NavItem[] = [
    {
      icon: LayoutDashboard,
      label: 'Home',
      path: '/dashboard',
    },
    {
      icon: ShoppingBag,
      label: 'Tempah',
      path: '/bookings',
      badge: pendingCount,
    },
    {
      icon: PlusCircle,
      label: 'Tambah',
      onClick: () => setShowQuickAdd(true),
      isSpecial: true,
    },
    {
      icon: Bell,
      label: 'Notis',
      path: '/notifications',
      badge: notificationCount,
    },
    {
      icon: Menu,
      label: 'Lagi',
      onClick: () => setShowMoreMenu(true),
    },
  ];

  return (
    <>
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-white border-t border-gray-200",
          "safe-area-inset-bottom",
          "lg:hidden", // Hide on desktop
          "transition-transform duration-200",
          // Hide bottom nav when Quick Add or More Menu is open
          (showQuickAdd || showMoreMenu) && "translate-y-full",
          className
        )}
      >
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = item.path && location === item.path;

            if (item.isSpecial) {
              // Special center button (elevated)
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className={cn(
                    "relative -top-6",
                    "w-14 h-14",
                    "bg-gradient-to-r from-orange-500 to-amber-600",
                    "rounded-full",
                    "shadow-lg shadow-orange-500/50",
                    "flex items-center justify-center",
                    "text-white",
                    "active:scale-95",
                    "transition-transform duration-150"
                  )}
                  aria-label={item.label}
                >
                  <Icon className="w-7 h-7" />
                </button>
              );
            }

            if (item.path) {
              // Regular nav item with link
              return (
                <Link key={index} href={item.path}>
                  <button
                    className={cn(
                      "flex flex-col items-center justify-center",
                      "min-w-[64px] h-full",
                      "relative",
                      "transition-colors duration-150",
                      isActive 
                        ? "text-orange-600" 
                        : "text-gray-600 hover:text-gray-800"
                    )}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className="relative">
                      <Icon className="w-6 h-6" />
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={cn(
                          "absolute -top-1 -right-1",
                          "min-w-[18px] h-[18px]",
                          "bg-red-500",
                          "text-white text-[10px] font-semibold",
                          "rounded-full",
                          "flex items-center justify-center",
                          "border-2 border-white"
                        )}>
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs mt-1",
                      isActive && "font-semibold"
                    )}>
                      {item.label}
                    </span>
                  </button>
                </Link>
              );
            }

            // Nav item with onClick handler
            return (
              <button
                key={index}
                onClick={item.onClick}
                className={cn(
                  "flex flex-col items-center justify-center",
                  "min-w-[64px] h-full",
                  "relative",
                  "text-gray-600 hover:text-gray-800",
                  "transition-colors duration-150"
                )}
                aria-label={item.label}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={cn(
                      "absolute -top-1 -right-1",
                      "min-w-[18px] h-[18px]",
                      "bg-red-500",
                      "text-white text-[10px] font-semibold",
                      "rounded-full",
                      "flex items-center justify-center",
                      "border-2 border-white"
                    )}>
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Quick Add Sheet */}
      {showQuickAdd && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden animate-in fade-in duration-200"
          onClick={() => setShowQuickAdd(false)}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-6 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle + Close button */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
              <button 
                onClick={() => setShowQuickAdd(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <h3 className="text-lg font-semibold mb-4">Tambah Cepat</h3>
            <div className="space-y-3">
              <Link href="/bookings">
                <button 
                  className="w-full p-4 text-left border rounded-lg hover:bg-orange-50/50 hover:border-orange-200 transition-colors"
                  onClick={() => setShowQuickAdd(false)}
                >
                  <div className="font-medium flex items-center gap-2">
                    <Cake className="w-5 h-5 text-orange-600" />
                    <span>Tempahan Baru</span>
                  </div>
                  <div className="text-sm text-gray-600 ml-7">Customer tempah kek/desert</div>
                </button>
              </Link>
              <Link href="/stock">
                <button 
                  className="w-full p-4 text-left border rounded-lg hover:bg-orange-50/50 hover:border-orange-200 transition-colors"
                  onClick={() => setShowQuickAdd(false)}
                >
                  <div className="font-medium flex items-center gap-2">
                    <Package className="w-5 h-5 text-orange-600" />
                    <span>Stok Masuk</span>
                  </div>
                  <div className="text-sm text-gray-600 ml-7">Beli bahan mentah baru</div>
                </button>
              </Link>
              <Link href="/pos">
                <button 
                  className="w-full p-4 text-left border rounded-lg hover:bg-orange-50/50 hover:border-orange-200 transition-colors"
                  onClick={() => setShowQuickAdd(false)}
                >
                  <div className="font-medium flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-orange-600" />
                    <span>Jualan POS</span>
                  </div>
                  <div className="text-sm text-gray-600 ml-7">Customer datang terus</div>
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* More Menu Drawer - Complete feature list from sidebar */}
      {showMoreMenu && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden animate-in fade-in duration-200"
          onClick={() => setShowMoreMenu(false)}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-6 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle + Close button */}
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-2 -mt-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <h3 className="text-lg font-semibold mb-4">Semua Menu</h3>
            
            {/* Search bar for quick find */}
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari menu..."
                className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              {/* Pengurusan Stok */}
              <div className="font-semibold text-xs text-gray-500 px-3 py-2 mt-2">PENGURUSAN STOK</div>
              <Link href="/products">
                <button className={cn(
                  "w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3 text-sm",
                  location === "/products" ? "bg-orange-50 text-orange-700" : "hover:bg-orange-50/50"
                )} onClick={() => setShowMoreMenu(false)}>
                  <Cake className="w-4 h-4" />
                  <span>Produk & Resepi</span>
                </button>
              </Link>
              <Link href="/production">
                <button className={cn(
                  "w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3 text-sm",
                  location === "/production" ? "bg-orange-50 text-orange-700" : "hover:bg-orange-50/50"
                )} onClick={() => setShowMoreMenu(false)}>
                  <ChefHat className="w-4 h-4" />
                  <span>Produksi</span>
                </button>
              </Link>
              <Link href="/finished-products">
                <button className={cn(
                  "w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3 text-sm",
                  location === "/finished-products" ? "bg-orange-50 text-orange-700" : "hover:bg-orange-50/50"
                )} onClick={() => setShowMoreMenu(false)}>
                  <BoxIcon className="w-4 h-4" />
                  <span>Stok Siap</span>
                </button>
              </Link>
              <Link href="/stock">
                <button className={cn(
                  "w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3 text-sm",
                  location === "/stock" ? "bg-orange-50 text-orange-700" : "hover:bg-orange-50/50"
                )} onClick={() => setShowMoreMenu(false)}>
                  <Warehouse className="w-4 h-4" />
                  <span>Stok Gudang</span>
                </button>
              </Link>
              <Link href="/shopping-list">
                <button className={cn(
                  "w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3 text-sm",
                  location === "/shopping-list" ? "bg-orange-50 text-orange-700" : "hover:bg-orange-50/50"
                )} onClick={() => setShowMoreMenu(false)}>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Senarai Belian</span>
                </button>
              </Link>
              <Link href="/purchase-orders">
                <button className={cn(
                  "w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3 text-sm",
                  location === "/purchase-orders" ? "bg-orange-50 text-orange-700" : "hover:bg-orange-50/50"
                )} onClick={() => setShowMoreMenu(false)}>
                  <FileText className="w-4 h-4" />
                  <span>Purchase Order</span>
                </button>
              </Link>
              <Link href="/suppliers">
                <button className={cn(
                  "w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3 text-sm",
                  location === "/suppliers" ? "bg-orange-50 text-orange-700" : "hover:bg-orange-50/50"
                )} onClick={() => setShowMoreMenu(false)}>
                  <Building2 className="w-4 h-4" />
                  <span>Suppliers</span>
                </button>
              </Link>
              
              {/* Vendor (Konsainan) */}
              <div className="font-semibold text-xs text-gray-500 px-3 py-2 mt-4">VENDOR (KONSAINAN)</div>
              <Link href="/vendors">
                <button className={cn(
                  "w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3 text-sm",
                  location === "/vendors" ? "bg-orange-50 text-orange-700" : "hover:bg-orange-50/50"
                )} onClick={() => setShowMoreMenu(false)}>
                  <Store className="w-4 h-4" />
                  <span>Senarai Vendor</span>
                </button>
              </Link>
              <Link href="/deliveries">
                <button className={cn(
                  "w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3 text-sm",
                  location === "/deliveries" ? "bg-orange-50 text-orange-700" : "hover:bg-orange-50/50"
                )} onClick={() => setShowMoreMenu(false)}>
                  <Truck className="w-4 h-4" />
                  <span>Hantar ke Kedai</span>
                </button>
              </Link>
              <Link href="/claims">
                <button className={cn(
                  "w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3 text-sm",
                  location === "/claims" ? "bg-orange-50 text-orange-700" : "hover:bg-orange-50/50"
                )} onClick={() => setShowMoreMenu(false)}>
                  <Receipt className="w-4 h-4" />
                  <span>Bayaran & Invoice</span>
                </button>
              </Link>
              
              {/* Direct Sales */}
              <div className="font-semibold text-xs text-gray-500 px-3 py-2 mt-4">JUALAN TERUS</div>
              <Link href="/customers">
                <button className={cn(
                  "w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3 text-sm",
                  location === "/customers" ? "bg-orange-50 text-orange-700" : "hover:bg-orange-50/50"
                )} onClick={() => setShowMoreMenu(false)}>
                  <Users className="w-4 h-4" />
                  <span>Pelanggan Setia</span>
                </button>
              </Link>
              <Link href="/broadcast">
                <button className={cn(
                  "w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3 text-sm",
                  location === "/broadcast" ? "bg-orange-50 text-orange-700" : "hover:bg-orange-50/50"
                )} onClick={() => setShowMoreMenu(false)}>
                  <Megaphone className="w-4 h-4" />
                  <span>Broadcast</span>
                </button>
              </Link>
              <Link href="/vouchers">
                <button className={cn(
                  "w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3 text-sm",
                  location === "/vouchers" ? "bg-orange-50 text-orange-700" : "hover:bg-orange-50/50"
                )} onClick={() => setShowMoreMenu(false)}>
                  <Ticket className="w-4 h-4" />
                  <span>Voucher</span>
                </button>
              </Link>
              
              {/* Ejen Reseller */}
              <div className="font-semibold text-xs text-gray-500 px-3 py-2 mt-4">EJEN RESELLER</div>
              <Link href="/resellers">
                <button className={cn(
                  "w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3 text-sm",
                  location === "/resellers" ? "bg-orange-50 text-orange-700" : "hover:bg-orange-50/50"
                )} onClick={() => setShowMoreMenu(false)}>
                  <UserPlus className="w-4 h-4" />
                  <span>Senarai Ejen</span>
                </button>
              </Link>
              <Link href="/reseller-transfer">
                <button className={cn(
                  "w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3 text-sm",
                  location === "/reseller-transfer" ? "bg-orange-50 text-orange-700" : "hover:bg-orange-50/50"
                )} onClick={() => setShowMoreMenu(false)}>
                  <RefreshCw className="w-4 h-4" />
                  <span>Transfer Stok</span>
                </button>
              </Link>
              <Link href="/reseller-performance">
                <button className={cn(
                  "w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3 text-sm",
                  location === "/reseller-performance" ? "bg-orange-50 text-orange-700" : "hover:bg-orange-50/50"
                )} onClick={() => setShowMoreMenu(false)}>
                  <TrendingUp className="w-4 h-4" />
                  <span>Prestasi Ejen</span>
                </button>
              </Link>
              <Link href="/pricing-tiers">
                <button className="w-full p-3 text-left rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-3 text-sm" onClick={() => setShowMoreMenu(false)}>
                  🏷️ <span>Tetapan Tier</span>
                </button>
              </Link>
              
              {/* Kewangan */}
              <div className="font-semibold text-xs text-gray-500 px-3 py-2 mt-4">KEWANGAN</div>
              <Link href="/sales">
                <button className="w-full p-3 text-left rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-3 text-sm" onClick={() => setShowMoreMenu(false)}>
                  💰 <span>Jualan</span>
                </button>
              </Link>
              <Link href="/expenses">
                <button className="w-full p-3 text-left rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-3 text-sm" onClick={() => setShowMoreMenu(false)}>
                  💵 <span>Perbelanjaan</span>
                </button>
              </Link>
              <Link href="/reports">
                <button className="w-full p-3 text-left rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-3 text-sm" onClick={() => setShowMoreMenu(false)}>
                  📊 <span>Laporan</span>
                </button>
              </Link>
              
              {/* Sistem */}
              <div className="font-semibold text-xs text-gray-500 px-3 py-2 mt-4">SISTEM & TETAPAN</div>
              <Link href="/store-catalog">
                <button className="w-full p-3 text-left rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-3 text-sm" onClick={() => setShowMoreMenu(false)}>
                  🌐 <span>Katalog Kedai</span>
                </button>
              </Link>
              <Link href="/drive-sync">
                <button className="w-full p-3 text-left rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-3 text-sm" onClick={() => setShowMoreMenu(false)}>
                  ☁️ <span>Google Drive</span>
                </button>
              </Link>
              <Link href="/settings">
                <button className="w-full p-3 text-left rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-3 text-sm" onClick={() => setShowMoreMenu(false)}>
                  ⚙️ <span>Tetapan</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
