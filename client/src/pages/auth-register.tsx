import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Package, Loader2, Check, Eye, EyeOff } from "lucide-react";

export default function AuthRegister() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Get URL params for plan selection
  const urlParams = new URLSearchParams(window.location.search);
  const selectedPlan = urlParams.get('plan');
  const selectedDuration = urlParams.get('duration');
  const returnTo = urlParams.get('returnTo');

  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string; phone?: string }) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Pendaftaran berjaya!",
        description: "Trial percuma 14 hari anda bermula sekarang.",
      });
      
      // Redirect back to pricing page if came from there
      if (returnTo === '/pricing') {
        navigate("/pricing");
      } else {
        navigate("/dashboard");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Pendaftaran gagal",
        description: error.message || "Sila cuba lagi",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ name, email, password, phone });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
          </div>
          <Badge className="mb-4 mx-auto">
            Trial Percuma 14 Hari
          </Badge>
          <CardTitle className="text-2xl">Daftar PocketBizz</CardTitle>
          <CardDescription>
            Tiada credit card diperlukan. Setup dalam 5 minit.
          </CardDescription>
          
          {/* Show plan selection info if came from pricing page */}
          {selectedPlan && selectedDuration && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">
                Pakej dipilih: <span className="font-semibold text-foreground capitalize">{selectedPlan}</span> ({selectedDuration} bulan)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Daftar sekarang untuk cuba trial 14 hari, kemudian boleh upgrade ke pakej pilihan anda
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Penuh</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ahmad Abdullah"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                data-testid="input-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ahmad@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">No. Telefon (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="01X-XXX XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="input-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 6 aksara"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  data-testid="input-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Trial percuma termasuk:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Semua features (had 10 produk)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Setup & tutorial percuma</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Tiada credit card diperlukan</span>
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
              data-testid="button-register"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mendaftar...
                </>
              ) : (
                "Daftar & Mula Trial Percuma"
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Sudah ada akaun? </span>
            <Button
              variant="ghost"
              className="p-0 h-auto text-primary hover:text-primary/80 hover:bg-transparent"
              onClick={() => navigate("/auth/login")}
              data-testid="link-login"
            >
              Log Masuk
            </Button>
          </div>
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => window.location.href = "https://www.pocketbizz.my"}
              data-testid="link-back-home"
            >
              Kembali ke Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
