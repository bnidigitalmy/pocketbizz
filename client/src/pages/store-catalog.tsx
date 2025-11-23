import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStoreSettingsSchema, type InsertStoreSettings } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Store, Eye, EyeOff, ExternalLink, Copy, Check, Globe, Instagram, Facebook, Phone, MapPin, Clock, Package, Palette } from "lucide-react";
import { z } from "zod";

export default function StoreCatalog() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: storeSettings, isLoading } = useQuery({
    queryKey: ["/api/store-settings"],
  });

  const form = useForm<InsertStoreSettings>({
    resolver: zodResolver(insertStoreSettingsSchema),
    defaultValues: {
      slug: "",
      businessName: "",
      description: "",
      logoUrl: "",
      coverImageUrl: "",
      whatsappNumber: "",
      instagramHandle: "",
      facebookUrl: "",
      businessHours: "",
      address: "",
      deliveryInfo: "",
      pickupInfo: "",
      theme: "light",
      accentColor: "#f97316",
      isActive: 1,
      showOutOfStock: 0,
    },
    values: storeSettings ? {
      slug: storeSettings.slug ?? "",
      businessName: storeSettings.businessName ?? "",
      description: storeSettings.description ?? "",
      logoUrl: storeSettings.logoUrl ?? "",
      coverImageUrl: storeSettings.coverImageUrl ?? "",
      whatsappNumber: storeSettings.whatsappNumber ?? "",
      instagramHandle: storeSettings.instagramHandle ?? "",
      facebookUrl: storeSettings.facebookUrl ?? "",
      businessHours: storeSettings.businessHours ?? "",
      address: storeSettings.address ?? "",
      deliveryInfo: storeSettings.deliveryInfo ?? "",
      pickupInfo: storeSettings.pickupInfo ?? "",
      theme: storeSettings.theme ?? "light",
      accentColor: storeSettings.accentColor ?? "#f97316",
      isActive: storeSettings.isActive ?? 1,
      showOutOfStock: storeSettings.showOutOfStock ?? 0,
    } : undefined,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: InsertStoreSettings) => {
      if (storeSettings) {
        return apiRequest("PUT", "/api/store-settings", data);
      } else {
        return apiRequest("POST", "/api/store-settings", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-settings"] });
      toast({
        title: "Success!",
        description: storeSettings ? "Store settings updated successfully." : "Store created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save store settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertStoreSettings) => {
    saveMutation.mutate(data);
  };

  const storeUrl = storeSettings?.slug 
    ? `${window.location.origin}/store/${storeSettings.slug}`
    : form.watch("slug") 
    ? `${window.location.origin}/store/${form.watch("slug")}`
    : "";

  const copyStoreUrl = () => {
    if (storeUrl) {
      navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Store URL copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openStore = () => {
    if (storeUrl) {
      window.open(storeUrl, "_blank");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Store className="h-8 w-8" />
              Online Store Catalog
            </h1>
            <p className="text-muted-foreground mt-1">
              Create a simple online catalog for customers to browse and order via WhatsApp
            </p>
          </div>
          {storeSettings && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyStoreUrl}
                className="gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy Link
              </Button>
              <Button
                size="sm"
                onClick={openStore}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View Store
              </Button>
            </div>
          )}
        </div>

        {storeUrl && (
          <Card className="mt-4 bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <code className="text-sm font-mono">{storeUrl}</code>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contact">Contact & Social</TabsTrigger>
              <TabsTrigger value="business">Business Details</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Store Identity</CardTitle>
                  <CardDescription>
                    Basic information about your online store
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store URL (Slug) *</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 rounded-l-md">
                              /store/
                            </span>
                            <Input
                              {...field}
                              placeholder="fiq-sweet-bakery"
                              disabled={!!storeSettings}
                              className="rounded-l-none"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          {storeSettings 
                            ? "Store URL cannot be changed after creation" 
                            : "Use lowercase letters, numbers, and hyphens only. This cannot be changed later."}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Fiq Sweet Bakery" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            placeholder="Tell customers about your business..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="https://example.com/logo.png"
                          />
                        </FormControl>
                        <FormDescription>
                          Upload your logo to an image hosting service and paste the URL here
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="coverImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Image URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="https://example.com/cover.jpg"
                          />
                        </FormControl>
                        <FormDescription>
                          Banner image displayed at the top of your store
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact & Social Tab */}
            <TabsContent value="contact" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    How customers can reach you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          WhatsApp Number *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="60123456789"
                            type="tel"
                          />
                        </FormControl>
                        <FormDescription>
                          Include country code (e.g., 60 for Malaysia). No spaces or dashes.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instagramHandle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Instagram className="h-4 w-4" />
                          Instagram Handle
                        </FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 rounded-l-md">
                              @
                            </span>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="fiqsweetbakery"
                              className="rounded-l-none"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="facebookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Facebook className="h-4 w-4" />
                          Facebook Page URL
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="https://facebook.com/fiqsweetbakery"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Business Details Tab */}
            <TabsContent value="business" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Business Details</CardTitle>
                  <CardDescription>
                    Operating hours, location, and delivery information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="businessHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Business Hours
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="Mon-Sat: 9AM-6PM, Closed Sunday"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Business Address
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            placeholder="123 Jalan Bakery, Taman Kek, 50000 Kuala Lumpur"
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliveryInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Delivery Information
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            placeholder="Free delivery for orders above RM50. Delivery within Klang Valley only."
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Delivery areas, minimum order, delivery fees, etc.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pickupInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup Information</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            placeholder="Self-pickup available daily 9AM-6PM. Please order 1 day in advance."
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Store Appearance</CardTitle>
                  <CardDescription>
                    Customize how your store looks to customers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Theme
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a theme" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accentColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accent Color</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              {...field}
                              value={field.value || "#f97316"}
                              type="color"
                              className="w-20 h-10"
                            />
                            <Input
                              value={field.value || "#f97316"}
                              onChange={(e) => field.onChange(e.target.value)}
                              placeholder="#f97316"
                              className="flex-1"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Primary brand color for buttons and highlights
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="flex items-center gap-2">
                            {field.value ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            )}
                            Store Visibility
                          </FormLabel>
                          <FormDescription>
                            {field.value 
                              ? "Your store is visible to customers"
                              : "Your store is hidden from customers"}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value === 1}
                            onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="showOutOfStock"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Show Out of Stock Items</FormLabel>
                          <FormDescription>
                            Display products even when they're out of stock
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value === 1}
                            onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              {saveMutation.isPending 
                ? "Saving..." 
                : storeSettings 
                ? "Update Store" 
                : "Create Store"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
