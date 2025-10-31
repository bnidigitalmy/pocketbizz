import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Building2, QrCode, User, Lock, Palette, Check } from "lucide-react";
import { z } from "zod";
import { useTheme } from "@/components/theme-provider";

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
      paymentQrCode: "",
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
      paymentQrCode: businessProfile.paymentQrCode ?? "",
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

  // User Profile Management
  const { data: userProfile } = useQuery({
    queryKey: ["/api/user/profile"],
  });

  const userForm = useForm({
    defaultValues: {
      fullName: "",
      email: "",
    },
    values: userProfile ? {
      fullName: (userProfile as any).name || "", // Database field is 'name' not 'fullName'
      email: userProfile.email || "",
    } : undefined,
  });

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { fullName: string; email: string }) => {
      return apiRequest("PATCH", "/api/user/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "Berjaya!",
        description: "Profil anda telah dikemaskini.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal mengemaskini profil",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return apiRequest("POST", "/api/user/change-password", data);
    },
    onSuccess: () => {
      toast({
        title: "Berjaya!",
        description: "Kata laluan anda telah dikemaskini.",
      });
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal menukar kata laluan",
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: { fullName: string; email: string }) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    if (data.newPassword !== data.confirmPassword) {
      toast({
        title: "Ralat",
        description: "Kata laluan baru tidak sepadan",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
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
          Urus akaun, perniagaan dan tetapan aplikasi
        </p>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList>
          <TabsTrigger value="business">
            <Building2 className="h-4 w-4 mr-2" />
            Perniagaan
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profil Saya
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Penampilan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business">
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

                  <FormField
                    control={form.control}
                    name="paymentQrCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <QrCode className="w-4 h-4" />
                          QR Code Bayaran (Pilihan)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/qr-code.png" 
                            {...field} 
                            data-testid="input-payment-qr"
                          />
                        </FormControl>
                        <FormDescription>
                          URL gambar QR Code DuitNow / Bank untuk POS. <br />
                          Boleh upload ke Imgur atau Google Drive dan salin link.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Maklumat Profil</CardTitle>
              </div>
              <CardDescription>
                Kemaskini maklumat peribadi anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...userForm}>
                <form onSubmit={userForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Nama Penuh</label>
                      <Input
                        {...userForm.register("fullName")}
                        placeholder="Masukkan nama penuh"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        {...userForm.register("email")}
                        type="email"
                        placeholder="email@example.com"
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Menyimpan..." : "Simpan Profil"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <CardTitle>Tukar Kata Laluan</CardTitle>
              </div>
              <CardDescription>
                Pastikan kata laluan sekurang-kurangnya 8 aksara
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Kata Laluan Semasa</label>
                      <Input
                        {...passwordForm.register("currentPassword")}
                        type="password"
                        placeholder="Masukkan kata laluan semasa"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Kata Laluan Baru</label>
                      <Input
                        {...passwordForm.register("newPassword")}
                        type="password"
                        placeholder="Minimum 8 aksara"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Sahkan Kata Laluan Baru</label>
                      <Input
                        {...passwordForm.register("confirmPassword")}
                        type="password"
                        placeholder="Masukkan semula kata laluan baru"
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending ? "Menukar..." : "Tukar Kata Laluan"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <AppearanceTab />
      </Tabs>
    </div>
  );
}

// Appearance Tab Component
function AppearanceTab() {
  const { theme, setTheme, colorTheme, setColorTheme } = useTheme();

  const colorThemes = [
    { 
      value: "default" as const, 
      label: "Lalai", 
      description: "Oren hangat (tema asal)",
      colors: { light: "bg-orange-500", dark: "bg-orange-600" }
    },
    { 
      value: "pink" as const, 
      label: "Pink", 
      description: "Lembut dan manis",
      colors: { light: "bg-pink-500", dark: "bg-pink-600" }
    },
    { 
      value: "blue" as const, 
      label: "Biru", 
      description: "Profesional dan tenang",
      colors: { light: "bg-blue-500", dark: "bg-blue-600" }
    },
    { 
      value: "purple" as const, 
      label: "Ungu", 
      description: "Kreatif dan anggun",
      colors: { light: "bg-purple-500", dark: "bg-purple-600" }
    },
    { 
      value: "green" as const, 
      label: "Hijau", 
      description: "Semula jadi dan segar",
      colors: { light: "bg-green-500", dark: "bg-green-600" }
    },
    { 
      value: "orange" as const, 
      label: "Oren Terang", 
      description: "Bertenaga dan hangat",
      colors: { light: "bg-orange-600", dark: "bg-orange-500" }
    },
  ];

  return (
    <TabsContent value="appearance" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tema Warna</CardTitle>
          <CardDescription>
            Pilih warna tema yang sesuai dengan citarasa anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {colorThemes.map((ct) => (
              <button
                key={ct.value}
                onClick={() => setColorTheme(ct.value)}
                className={`
                  relative p-4 rounded-lg border-2 transition-all text-left
                  hover:border-primary/50 hover:shadow-md
                  ${colorTheme === ct.value 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : 'border-border bg-card'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="flex gap-1.5 mt-1">
                    <div className={`w-8 h-8 rounded-md ${ct.colors.light} shadow-sm`} />
                    <div className={`w-8 h-8 rounded-md ${ct.colors.dark} shadow-sm`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {ct.label}
                      {colorTheme === ct.value && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {ct.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mod Gelap / Terang</CardTitle>
          <CardDescription>
            Pilih penampilan paparan yang selesa untuk mata anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <button
              onClick={() => setTheme("light")}
              className={`
                flex-1 p-4 rounded-lg border-2 transition-all
                hover:border-primary/50 hover:shadow-md
                ${theme === "light" 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : 'border-border bg-card'
                }
              `}
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-md bg-white border-2 border-gray-300 shadow-sm" />
                <div className="font-medium flex items-center justify-center gap-2">
                  Terang
                  {theme === "light" && <Check className="h-4 w-4 text-primary" />}
                </div>
              </div>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`
                flex-1 p-4 rounded-lg border-2 transition-all
                hover:border-primary/50 hover:shadow-md
                ${theme === "dark" 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : 'border-border bg-card'
                }
              `}
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-md bg-gray-900 border-2 border-gray-700 shadow-sm" />
                <div className="font-medium flex items-center justify-center gap-2">
                  Gelap
                  {theme === "dark" && <Check className="h-4 w-4 text-primary" />}
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
