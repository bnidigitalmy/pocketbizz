import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Package, Loader2, Eye, EyeOff } from "lucide-react";

export default function AuthLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Check for return URL in query params
  const params = new URLSearchParams(window.location.search);
  const returnUrl = params.get('returnUrl') || '/dashboard';

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Login berjaya!",
        description: returnUrl !== '/dashboard' ? "Anda akan dibawa ke halaman checkout." : "Anda akan dibawa ke dashboard.",
      });
      // Redirect to return URL or dashboard
      navigate(returnUrl);
    },
    onError: (error: any) => {
      toast({
        title: "Login gagal",
        description: error.message || "Email atau password tidak sah",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.svg" 
              alt="PocketBizz" 
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl">Log Masuk ke PocketBizz</CardTitle>
          <CardDescription>
            Masukkan email dan password anda untuk log masuk
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto text-xs text-primary hover:text-primary/80 hover:bg-transparent"
                  onClick={() => navigate("/auth/forgot-password")}
                  type="button"
                >
                  Lupa password?
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Log Masuk...
                </>
              ) : (
                "Log Masuk"
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Belum ada akaun? </span>
            <Button
              variant="ghost"
              className="p-0 h-auto"
              onClick={() => navigate("/auth/register")}
              data-testid="link-register"
            >
              Daftar Sekarang
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
