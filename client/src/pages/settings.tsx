import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBusinessProfileSchema, type InsertBusinessProfile } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Building2 } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();

  const { data: businessProfile, isLoading } = useQuery({
    queryKey: ["/api/business-profile"],
  });

  const form = useForm<InsertBusinessProfile>({
    resolver: zodResolver(insertBusinessProfileSchema),
    defaultValues: {
      businessName: "",
      registrationNumber: "",
      address: "",
      phone: "",
      email: "",
      tagline: "",
      bankName: "",
      accountNumber: "",
      accountName: "",
    },
    values: businessProfile ? {
      businessName: businessProfile.businessName ?? "",
      registrationNumber: businessProfile.registrationNumber ?? "",
      address: businessProfile.address ?? "",
      phone: businessProfile.phone ?? "",
      email: businessProfile.email ?? "",
      tagline: businessProfile.tagline ?? "",
      bankName: businessProfile.bankName ?? "",
      accountNumber: businessProfile.accountNumber ?? "",
      accountName: businessProfile.accountName ?? "",
    } : undefined,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: InsertBusinessProfile) => {
      return apiRequest("POST", "/api/business-profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-profile"] });
      toast({
        title: "Berjaya!",
        description: "Maklumat perniagaan telah disimpan.",
      });
    },
    onError: () => {
      toast({
        title: "Ralat",
        description: "Gagal menyimpan maklumat perniagaan",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertBusinessProfile) => {
    saveMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">Tetapan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Urus maklumat perniagaan untuk invois & penyata
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Maklumat Perniagaan</CardTitle>
          </div>
          <CardDescription>
            Maklumat ini akan dipaparkan pada invois dan penyata tuntutan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Perniagaan *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ManisBizz" 
                        {...field} 
                        data-testid="input-business-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tagline (Pilihan)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Kuih-Muih Sedap & Berkualiti" 
                        {...field} 
                        data-testid="input-tagline"
                      />
                    </FormControl>
                    <FormDescription>
                      Slogan perniagaan (akan dipaparkan di bawah nama)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. Pendaftaran (Pilihan)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="SSM123456789" 
                        {...field} 
                        data-testid="input-registration"
                      />
                    </FormControl>
                    <FormDescription>
                      No. pendaftaran SSM/ROC/ROB
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat (Pilihan)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="No. 123, Jalan Manis, Taman Sedap, 50000 Kuala Lumpur" 
                        {...field} 
                        rows={3}
                        data-testid="input-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon (Pilihan)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="012-345 6789" 
                          {...field} 
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Pilihan)</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="info@manisbizz.com" 
                          {...field} 
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-4">Maklumat Akaun Bank</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Bank (Pilihan)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Maybank / CIMB / Public Bank" 
                            {...field} 
                            data-testid="input-bank-name"
                          />
                        </FormControl>
                        <FormDescription>
                          Nama bank untuk tuntutan pembayaran
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>No. Akaun (Pilihan)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="1234567890" 
                              {...field} 
                              data-testid="input-account-number"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accountName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Pemegang Akaun (Pilihan)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Nama seperti di kad bank" 
                              {...field} 
                              data-testid="input-account-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={saveMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
