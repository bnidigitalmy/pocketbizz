import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Users, MessageSquare, Mail, MessageCircle, FileText, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Channel = "whatsapp" | "sms" | "email";
type Segment = "all" | "high_points" | "recent_buyers" | "custom";

export default function Broadcast() {
  const { toast} = useToast();
  
  // Form state
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [segment, setSegment] = useState<Segment>("all");
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ["/api/broadcast/templates", channel],
    queryFn: async () => {
      const res = await fetch(`/api/broadcast/templates?channel=${channel}`);
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });

  // Fetch campaigns
  const { data: campaigns = [] } = useQuery({
    queryKey: ["/api/broadcast/campaigns"],
  });

  // Fetch segment preview
  const { data: segmentData, refetch: refetchSegment } = useQuery({
    queryKey: ["/api/broadcast/segments", segment],
    queryFn: async () => {
      const res = await fetch(`/api/broadcast/segments/${segment}`);
      if (!res.ok) throw new Error("Failed to fetch segment");
      return res.json();
    },
    enabled: !!segment,
  });

  // Create and send campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/broadcast/campaigns", data);
      return await response.json();
    },
    onSuccess: (campaign: any) => {
      toast({
        title: "Kempen Dibuat",
        description: `Kempen ${campaign.name} berjaya dibuat`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/broadcast/campaigns"] });
      
      // Send immediately
      sendCampaignMutation.mutate(campaign.id);
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal membuat kempen",
        variant: "destructive",
      });
    },
  });

  // Send campaign mutation
  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest("POST", `/api/broadcast/campaigns/${campaignId}/send`, {});
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Broadcast Dihantar",
        description: data.message || `Broadcast telah dihantar kepada ${data.campaign?.totalRecipients || 0} pelanggan`,
      });
      
      // Reset form
      setCampaignName("");
      setSubject("");
      setMessage("");
      setSelectedTemplate("");
      
      queryClient.invalidateQueries({ queryKey: ["/api/broadcast/campaigns"] });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal menghantar broadcast",
        variant: "destructive",
      });
    },
  });

  // Apply template
  const applyTemplate = (templateId: string) => {
    const template = templates.find((t: any) => t.id === templateId);
    if (template) {
      setMessage(template.message);
      if (template.subject) setSubject(template.subject);
      setSelectedTemplate(templateId);
      toast({
        title: "Template Digunakan",
        description: `Template "${template.name}" telah digunakan`,
      });
    }
  };

  // Handle send broadcast
  const handleSendBroadcast = () => {
    if (!campaignName || !message) {
      toast({
        title: "Ralat",
        description: "Sila lengkapkan semua maklumat",
        variant: "destructive",
      });
      return;
    }

    if (channel === "email" && !subject) {
      toast({
        title: "Ralat",
        description: "Subjek email diperlukan",
        variant: "destructive",
      });
      return;
    }

    // Validate custom segment
    if (segment === "custom" && selectedCustomerIds.length === 0) {
      toast({
        title: "Ralat",
        description: "Sila pilih pelanggan untuk segmen custom",
        variant: "destructive",
      });
      return;
    }

    createCampaignMutation.mutate({
      name: campaignName,
      channel,
      subject: channel === "email" ? subject : undefined,
      message,
      targetSegment: segment,
      targetCustomerIds: segment === "custom" ? selectedCustomerIds : undefined,
      status: "pending",
    });
  };

  const channelIcons: Record<Channel, any> = {
    whatsapp: MessageCircle,
    sms: MessageSquare,
    email: Mail,
  };

  const ChannelIcon = channelIcons[channel];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Broadcast Pelanggan</h1>
          <p className="text-muted-foreground mt-1">
            Hantar promosi, produk baru, dan voucher kepada pelanggan setia anda
          </p>
        </div>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList>
          <TabsTrigger value="create" data-testid="tab-create-broadcast">
            <Send className="w-4 h-4 mr-2" />
            Hantar Broadcast
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-broadcast-history">
            <FileText className="w-4 h-4 mr-2" />
            Sejarah Kempen
          </TabsTrigger>
        </TabsList>

        {/* Create Broadcast Tab */}
        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Channel Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ChannelIcon className="w-5 h-5 mr-2" />
                    Saluran Komunikasi
                  </CardTitle>
                  <CardDescription>Pilih cara untuk menghubungi pelanggan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      variant={channel === "whatsapp" ? "default" : "outline"}
                      className="flex flex-col h-auto py-4"
                      onClick={() => setChannel("whatsapp")}
                      data-testid="button-channel-whatsapp"
                    >
                      <MessageCircle className="w-8 h-8 mb-2" />
                      <span>WhatsApp</span>
                    </Button>
                    <Button
                      variant={channel === "sms" ? "default" : "outline"}
                      className="flex flex-col h-auto py-4"
                      onClick={() => setChannel("sms")}
                      data-testid="button-channel-sms"
                    >
                      <MessageSquare className="w-8 h-8 mb-2" />
                      <span>SMS</span>
                    </Button>
                    <Button
                      variant={channel === "email" ? "default" : "outline"}
                      className="flex flex-col h-auto py-4"
                      onClick={() => setChannel("email")}
                      data-testid="button-channel-email"
                    >
                      <Mail className="w-8 h-8 mb-2" />
                      <span>Email</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Message Composition */}
              <Card>
                <CardHeader>
                  <CardTitle>Tulis Mesej</CardTitle>
                  <CardDescription>
                    Gunakan template atau tulis mesej sendiri
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Templates */}
                  {templates.length > 0 && (
                    <div className="space-y-2">
                      <Label>Template Mesej</Label>
                      <Select value={selectedTemplate} onValueChange={applyTemplate}>
                        <SelectTrigger data-testid="select-template">
                          <SelectValue placeholder="Pilih template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template: any) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Campaign Name */}
                  <div className="space-y-2">
                    <Label htmlFor="campaign-name">Nama Kempen</Label>
                    <Input
                      id="campaign-name"
                      placeholder="Cth: Promosi Raya 2024"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      data-testid="input-campaign-name"
                    />
                  </div>

                  {/* Subject (Email only) */}
                  {channel === "email" && (
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subjek Email</Label>
                      <Input
                        id="subject"
                        placeholder="Cth: Promosi Istimewa Untuk Anda!"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        data-testid="input-email-subject"
                      />
                    </div>
                  )}

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Mesej</Label>
                    <Textarea
                      id="message"
                      placeholder={
                        channel === "sms"
                          ? "Tulis mesej ringkas (maks 160 aksara)..."
                          : "Tulis mesej anda di sini...\n\nGunakan {name} untuk nama pelanggan dan {points} untuk mata ganjaran."
                      }
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={channel === "sms" ? 4 : 8}
                      maxLength={channel === "sms" ? 160 : undefined}
                      data-testid="textarea-message"
                    />
                    {channel === "sms" && (
                      <p className="text-sm text-muted-foreground">
                        {message.length}/160 aksara
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Target & Preview */}
            <div className="space-y-6">
              {/* Target Audience */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Sasaran Pelanggan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Segmen</Label>
                    <Select value={segment} onValueChange={(v: Segment) => {
                      setSegment(v);
                      if (v !== "custom") {
                        setSelectedCustomerIds([]);
                      }
                    }}>
                      <SelectTrigger data-testid="select-segment">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Pelanggan</SelectItem>
                        <SelectItem value="high_points">Mata Ganjaran Tinggi (500+)</SelectItem>
                        <SelectItem value="recent_buyers">Pembeli Baru-baru Ini (30 hari)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {segment === "all" && "Hantar kepada semua pelanggan"}
                      {segment === "high_points" && "Pelanggan dengan 500+ mata ganjaran"}
                      {segment === "recent_buyers" && "Pelanggan yang membeli dalam 30 hari lepas"}
                    </p>
                  </div>

                  {/* Segment Stats */}
                  {segmentData && (
                    <div className="rounded-lg border p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Jumlah Penerima</span>
                        <Badge variant="secondary" className="text-lg" data-testid="badge-recipient-count">
                          {segmentData.count}
                        </Badge>
                      </div>
                      <Separator />
                      <Dialog open={showPreview} onOpenChange={setShowPreview}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full" data-testid="button-preview-recipients">
                            <Users className="w-4 h-4 mr-2" />
                            Lihat Senarai Pelanggan
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Senarai Penerima ({segmentData.count})</DialogTitle>
                            <DialogDescription>
                              Pelanggan yang akan menerima broadcast ini
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-2">
                            {segmentData.customers.map((customer: any) => (
                              <div
                                key={customer.id}
                                className="flex items-center justify-between p-3 rounded-lg border"
                              >
                                <div>
                                  <p className="font-medium">{customer.name}</p>
                                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                                </div>
                                <Badge variant="outline">{customer.loyaltyPoints} mata</Badge>
                              </div>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Send Button */}
              <Button
                className="w-full h-12 text-lg"
                onClick={handleSendBroadcast}
                disabled={createCampaignMutation.isPending || sendCampaignMutation.isPending}
                data-testid="button-send-broadcast"
              >
                {createCampaignMutation.isPending || sendCampaignMutation.isPending ? (
                  "Menghantar..."
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Hantar Broadcast
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Sejarah Kempen</CardTitle>
              <CardDescription>Lihat semua kempen broadcast yang telah dihantar</CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Tiada kempen lagi. Mulakan kempen pertama anda!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign: any) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{campaign.name}</h3>
                          <Badge variant={campaign.status === "sent" ? "default" : "secondary"}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {campaign.channel.toUpperCase()} • {campaign.totalRecipients} penerima
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(campaign.createdAt).toLocaleDateString("ms-MY", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" data-testid={`button-view-campaign-${campaign.id}`}>
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
