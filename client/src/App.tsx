import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { InstallPWA } from "@/components/install-pwa";
import { GlobalSearch } from "@/components/global-search";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { RenewalReminder } from "@/components/renewal-reminder";
import { TrialBanner } from "@/components/trial-banner";
import { MotionWrapper } from "@/components/motion-wrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingCart } from "lucide-react";

import Landing from "@/pages/landing";
import AuthLogin from "@/pages/auth-login";
import AuthRegister from "@/pages/auth-register";
import AuthForgotPassword from "@/pages/auth-forgot-password";
import AuthResetPassword from "@/pages/auth-reset-password";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Production from "@/pages/production";
import FinishedProducts from "@/pages/finished-products";
import Stock from "@/pages/stock";
import StockHistory from "@/pages/stock-history";
import ShoppingList from "@/pages/shopping-list";
import PurchaseOrders from "@/pages/purchase-orders";
import Suppliers from "@/pages/suppliers";
import Vendors from "@/pages/vendors";
import Deliveries from "@/pages/deliveries";
import Sales from "@/pages/sales";
import POSPage from "@/pages/pos";
import Expenses from "@/pages/expenses";
import Claims from "@/pages/claims";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Subscription from "@/pages/subscription";
import StoreCatalog from "@/pages/store-catalog";
import DriveSync from "@/pages/drive-sync";
import PricingSimple from "@/pages/pricing-simple";
import Checkout from "@/pages/checkout";
import PaymentCallback from "@/pages/payment-callback";
import PaymentSuccess from "@/pages/payment-success";
import Resellers from "@/pages/resellers";
import ResellerTransfer from "@/pages/reseller-transfer";
import ResellerPerformance from "@/pages/reseller-performance";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminUsers from "@/pages/admin-users";
import AdminSubscriptions from "@/pages/admin-subscriptions";
import Customers from "@/pages/customers";
import Broadcast from "@/pages/broadcast";
import Vouchers from "@/pages/vouchers";
import Bookings from "@/pages/bookings";
import VendorClaims from "@/pages/vendor-claims";
import { PaymentClaimsPage } from "@/pages/payment-claims";
import Notifications from "@/pages/notifications";
import ComingSoon from "@/pages/coming-soon";
import PublicStore from "@/pages/public-store";
import NotFound from "@/pages/not-found";

function PublicRouter() {
  return (
    <MotionWrapper>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/auth/login" component={AuthLogin} />
        <Route path="/auth/register" component={AuthRegister} />
        <Route path="/auth/forgot-password" component={AuthForgotPassword} />
        <Route path="/auth/reset-password" component={AuthResetPassword} />
        <Route path="/pricing" component={PricingSimple} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/payment/callback" component={PaymentCallback} />
        <Route path="/payment/success" component={PaymentSuccess} />
        <Route path="/store/:slug" component={PublicStore} />
        <Route component={NotFound} />
      </Switch>
    </MotionWrapper>
  );
}

function AppRouter() {
  const [, navigate] = useLocation();
  
  return (
    <MotionWrapper>
      <ErrorBoundary level="page" onReset={() => navigate('/dashboard')}>
        <Switch>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/products" component={Products} />
          <Route path="/production" component={Production} />
          <Route path="/finished-products" component={FinishedProducts} />
          <Route path="/stock" component={Stock} />
          <Route path="/stock/:id/history" component={StockHistory} />
          <Route path="/shopping-list" component={ShoppingList} />
          <Route path="/purchase-orders" component={PurchaseOrders} />
          <Route path="/suppliers" component={Suppliers} />
          <Route path="/vendors" component={Vendors} />
          <Route path="/deliveries" component={Deliveries} />
          <Route path="/sales" component={Sales} />
          <Route path="/pos" component={POSPage} />
          <Route path="/customers" component={ComingSoon} />
          <Route path="/broadcast" component={ComingSoon} />
          <Route path="/vouchers" component={ComingSoon} />
          <Route path="/bookings" component={Bookings} />
          <Route path="/expenses" component={Expenses} />
          <Route path="/claims" component={Claims} />
          <Route path="/vendor-claims" component={VendorClaims} />
          <Route path="/payment-claims" component={PaymentClaimsPage} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/reports" component={Reports} />
          <Route path="/settings" component={Settings} />
          <Route path="/subscription" component={Subscription} />
          <Route path="/store-catalog" component={ComingSoon} />
          <Route path="/drive-sync" component={DriveSync} />
          <Route path="/resellers" component={ComingSoon} />
          <Route path="/reseller-transfer" component={ComingSoon} />
          <Route path="/reseller-performance" component={ComingSoon} />
          <Route path="/pricing-tiers" component={ComingSoon} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/subscriptions" component={AdminSubscriptions} />
          <Route component={NotFound} />
        </Switch>
      </ErrorBoundary>
    </MotionWrapper>
  );
}

interface CartItem {
  id: string;
  stockItemId: string;
  stockItemName: string;
  shortageQty: string;
  unit: string;
  productionBatchId: string | null;
  productName: string | null;
  notes: string | null;
  createdAt: string;
}

function Header() {
  const [location, navigate] = useLocation();
  const isDashboard = location === "/dashboard";

  // Fetch shopping cart items count
  const { data: cartItems = [] } = useQuery<CartItem[]>({
    queryKey: ["/api/shopping-cart"],
  });

  const cartCount = cartItems.length;

  const handleBack = () => {
    // Check if there's history to go back to
    // If user came from external link (no history), go to dashboard instead
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <header className="flex items-center gap-2 p-4 border-b bg-background sticky top-0 z-10">
      <div className="flex items-center gap-2">
        {/* Hide sidebar trigger on mobile - use bottom nav More menu instead */}
        <div className="hidden lg:block">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
        </div>
        {!isDashboard && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="md:hidden"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex-1 flex justify-center px-4">
        <GlobalSearch />
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/shopping-list")}
        className="relative"
        title="Senarai Belian"
      >
        <ShoppingCart className="h-5 w-5" />
        {cartCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {cartCount}
          </Badge>
        )}
      </Button>
      <ThemeToggle />
    </header>
  );
}

function AppContent() {
  const [location] = useLocation();
  
  // Public pages don't need sidebar
  const publicPaths = ["/", "/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password", "/pricing", "/checkout", "/payment/callback", "/payment/success"];
  const isPublicPage = publicPaths.includes(location) || location.startsWith("/store/");

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isPublicPage) {
    return <PublicRouter />;
  }

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        {/* Sidebar - Desktop Only */}
        <div className="hidden lg:block">
          <AppSidebar />
        </div>
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <TrialBanner />
          {/* Mobile needs extra padding for bottom nav (h-16) + FAB elevation (~24px) = ~100px total */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6">
            <AppRouter />
          </main>
          
          {/* Bottom Nav - Mobile Only */}
          <MobileBottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AppContent />
          <Toaster />
          <InstallPWA />
          <KeyboardShortcuts />
          <UpgradePrompt />
          <RenewalReminder />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
