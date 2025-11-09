import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Package, Loader2, ArrowLeft, Mail } from "lucide-react";

export default function AuthForgotPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", { email });
      return response.json();
    },
    onSuccess: () => {
      setEmailSent(true);
      toast({
        title: "Email telah dihantar!",
        description: "Sila semak email anda untuk reset password.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal menghantar email. Sila cuba lagi.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotPasswordMutation.mutate(email);
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
          <CardTitle className="text-2xl">Lupa Password?</CardTitle>
          <CardDescription>
            {emailSent 
              ? "Kami telah menghantar link reset password ke email anda."
              : "Masukkan email anda dan kami akan hantar link untuk reset password."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg text-center space-y-3">
                <Mail className="h-12 w-12 text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Email telah dihantar ke <strong>{email}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Link akan expire dalam 1 jam. Kalau tak dapat email, sila check spam folder.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
              >
                Hantar semula
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <Button
                type="submit"
                className="w-full"
                disabled={forgotPasswordMutation.isPending}
                data-testid="button-submit"
              >
                {forgotPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menghantar...
                  </>
                ) : (
                  "Hantar Reset Link"
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => navigate("/auth/login")}
              data-testid="link-back-login"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Log Masuk
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
