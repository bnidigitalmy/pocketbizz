import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { InstallPWA } from "@/components/install-pwa";
import { GlobalSearch } from "@/components/global-search";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Production from "@/pages/production";
import FinishedProducts from "@/pages/finished-products";
import Stock from "@/pages/stock";
import ShoppingList from "@/pages/shopping-list";
import Vendors from "@/pages/vendors";
import Deliveries from "@/pages/deliveries";
import Sales from "@/pages/sales";
import Expenses from "@/pages/expenses";
import Claims from "@/pages/claims";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import DriveSync from "@/pages/drive-sync";
import Pricing from "@/pages/pricing";
import Checkout from "@/pages/checkout";
import PaymentCallback from "@/pages/payment-callback";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/products" component={Products} />
      <Route path="/production" component={Production} />
      <Route path="/finished-products" component={FinishedProducts} />
      <Route path="/stock" component={Stock} />
      <Route path="/shopping-list" component={ShoppingList} />
      <Route path="/vendors" component={Vendors} />
      <Route path="/deliveries" component={Deliveries} />
      <Route path="/sales" component={Sales} />
      <Route path="/expenses" component={Expenses} />
      <Route path="/claims" component={Claims} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/drive-sync" component={DriveSync} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/payment/callback" component={PaymentCallback} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Header() {
  const [location, navigate] = useLocation();
  const isHomePage = location === "/";

  const handleBack = () => {
    // Check if there's history to go back to
    // If user came from external link (no history), go to home instead
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate("/");
    }
  };

  return (
    <header className="flex items-center gap-2 p-4 border-b bg-background sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        {!isHomePage && (
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
      <ThemeToggle />
    </header>
  );
}

export default function App() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <SidebarProvider style={sidebarStyle as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
          <InstallPWA />
          <KeyboardShortcuts />
          <UpgradePrompt />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
