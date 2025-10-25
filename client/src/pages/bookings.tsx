import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, MapPin, Phone, User, Package, Clock, CheckCircle, XCircle, AlertCircle, Minus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export default function Bookings() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  
  // Booking items
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState("1");
  const [bookingItems, setBookingItems] = useState<Array<{productId: string, productName: string, quantity: number}>>([]);

  // Fetch bookings
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["/api/bookings"],
  });

  // Fetch products for item selection
  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/bookings", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tempahan Berjaya",
        description: "Tempahan baru telah ditambah",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      resetForm();
      setShowCreateDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal membuat tempahan",
        variant: "destructive",
      });
    },
  });

  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const response = await apiRequest("PUT", `/api/bookings/${id}`, { status });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Dikemaskini",
        description: "Status tempahan telah dikemaskini",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal mengemaskini status",
        variant: "destructive",
      });
    },
  });

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/bookings/${id}`, {});
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tempahan Dipadam",
        description: "Tempahan telah dipadam",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal memadam tempahan",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setEventType("");
    setEventDate("");
    setDeliveryDate("");
    setDeliveryTime("");
    setDeliveryLocation("");
    setNotes("");
    setTotalAmount("");
    setDepositAmount("");
    setBookingItems([]);
    setSelectedProductId("");
    setSelectedQuantity("1");
  };

  const handleAddItem = () => {
    if (!selectedProductId) {
      toast({
        title: "Ralat",
        description: "Sila pilih produk",
        variant: "destructive",
      });
      return;
    }

    const product = products.find((p: any) => p.id === selectedProductId);
    if (!product) return;

    const existingItem = bookingItems.find(item => item.productId === selectedProductId);
    if (existingItem) {
      toast({
        title: "Produk Sudah Ditambah",
        description: "Sila edit kuantiti dari senarai",
        variant: "destructive",
      });
      return;
    }

    setBookingItems([
      ...bookingItems,
      {
        productId: product.id,
        productName: product.name,
        quantity: parseInt(selectedQuantity) || 1,
      }
    ]);

    setSelectedProductId("");
    setSelectedQuantity("1");

    toast({
      title: "Produk Ditambah",
      description: `${product.name} ditambah ke tempahan`,
    });
  };

  const handleRemoveItem = (productId: string) => {
    setBookingItems(bookingItems.filter(item => item.productId !== productId));
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setBookingItems(bookingItems.map(item => {
      if (item.productId === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const handleCreateBooking = () => {
    if (!customerName || !customerPhone || !eventType || !deliveryDate) {
      toast({
        title: "Ralat",
        description: "Sila lengkapkan maklumat wajib",
        variant: "destructive",
      });
      return;
    }

    createBookingMutation.mutate({
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      eventType,
      eventDate: eventDate || null,
      deliveryDate,
      deliveryTime: deliveryTime || null,
      deliveryLocation: deliveryLocation || null,
      notes: notes || null,
      totalAmount: totalAmount ? parseFloat(totalAmount) : null,
      depositAmount: depositAmount ? parseFloat(depositAmount) : null,
      status: "pending",
      items: bookingItems,
    });
  };

  const getStatusBadge = (status: BookingStatus) => {
    const config = {
      pending: { label: "Menunggu", variant: "secondary" as const, icon: Clock },
      confirmed: { label: "Disahkan", variant: "default" as const, icon: CheckCircle },
      completed: { label: "Selesai", variant: "default" as const, icon: CheckCircle },
      cancelled: { label: "Dibatalkan", variant: "destructive" as const, icon: XCircle },
    };
    const { label, variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  const filteredBookings = selectedStatus === "all" 
    ? bookings 
    : bookings.filter((b: any) => b.status === selectedStatus);

  const pendingCount = bookings.filter((b: any) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b: any) => b.status === "confirmed").length;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Tempahan & Reservasi</h1>
          <p className="text-muted-foreground mt-1">
            Urus tempahan majlis - perkahwinan, kenduri, door gifts
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-booking">
              <Plus className="w-4 h-4 mr-2" />
              Tempahan Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tempahan Baru</DialogTitle>
              <DialogDescription>
                Tambah tempahan pelanggan untuk majlis
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-3 border rounded-lg p-4 bg-accent/5">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Maklumat Pelanggan
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-name">Nama Pelanggan *</Label>
                    <Input
                      id="customer-name"
                      placeholder="Cth: Ahmad bin Ali"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      data-testid="input-customer-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-phone">Nombor Telefon *</Label>
                    <Input
                      id="customer-phone"
                      type="tel"
                      placeholder="0123456789"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      data-testid="input-customer-phone"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-email">Email (Pilihan)</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    placeholder="ahmad@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    data-testid="input-customer-email"
                  />
                </div>
              </div>

              <div className="space-y-3 border rounded-lg p-4 bg-accent/5">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Maklumat Majlis
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-type">Jenis Majlis *</Label>
                    <Select value={eventType} onValueChange={setEventType}>
                      <SelectTrigger id="event-type" data-testid="select-event-type">
                        <SelectValue placeholder="Pilih jenis majlis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="perkahwinan">Perkahwinan</SelectItem>
                        <SelectItem value="kenduri">Kenduri</SelectItem>
                        <SelectItem value="door_gifts">Door Gifts</SelectItem>
                        <SelectItem value="birthday">Hari Jadi</SelectItem>
                        <SelectItem value="aqiqah">Aqiqah</SelectItem>
                        <SelectItem value="lain-lain">Lain-lain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-date">Tarikh Majlis</Label>
                    <Input
                      id="event-date"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      data-testid="input-event-date"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 border rounded-lg p-4 bg-accent/5">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Penghantaran
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="delivery-date">Tarikh Hantar *</Label>
                    <Input
                      id="delivery-date"
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      data-testid="input-delivery-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery-time">Masa Hantar</Label>
                    <Input
                      id="delivery-time"
                      type="time"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      data-testid="input-delivery-time"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-location">Lokasi Penghantaran</Label>
                  <Textarea
                    id="delivery-location"
                    placeholder="Alamat lengkap..."
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    data-testid="input-delivery-location"
                    rows={2}
                  />
                </div>
              </div>

              <div className="space-y-3 border rounded-lg p-4 bg-accent/5">
                <h3 className="font-semibold text-sm">Bayaran</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="total-amount">Jumlah Keseluruhan (RM)</Label>
                    <Input
                      id="total-amount"
                      type="number"
                      placeholder="0.00"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      data-testid="input-total-amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deposit-amount">Deposit (RM)</Label>
                    <Input
                      id="deposit-amount"
                      type="number"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      data-testid="input-deposit-amount"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 border rounded-lg p-4 bg-accent/5">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Produk Tempahan
                </h3>
                <div className="flex gap-2">
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="flex-1" data-testid="select-product">
                      <SelectValue placeholder="Pilih produk" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product: any) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(e.target.value)}
                    className="w-20"
                    data-testid="input-quantity"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddItem}
                    data-testid="button-add-item"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {bookingItems.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <Label className="text-xs text-muted-foreground">Item Ditempah:</Label>
                    {bookingItems.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between bg-background p-2 rounded border">
                        <span className="text-sm font-medium">{item.productName}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.productId, -1)}
                            className="h-7 w-7 p-0"
                            data-testid={`button-decrease-${item.productId}`}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm w-8 text-center">{item.quantity}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.productId, 1)}
                            className="h-7 w-7 p-0"
                            data-testid={`button-increase-${item.productId}`}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.productId)}
                            className="h-7 w-7 p-0 text-destructive"
                            data-testid={`button-remove-${item.productId}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Nota Tambahan</Label>
                <Textarea
                  id="notes"
                  placeholder="Sebarang nota atau permintaan khas..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  data-testid="input-notes"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleCreateBooking}
                className="w-full"
                disabled={createBookingMutation.isPending}
                data-testid="button-submit-booking"
              >
                {createBookingMutation.isPending ? "Mencipta..." : "Cipta Tempahan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Perlu disahkan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disahkan</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedCount}</div>
            <p className="text-xs text-muted-foreground">Tempahan aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jumlah</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-xs text-muted-foreground">Semua tempahan</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Senarai Tempahan</CardTitle>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="confirmed">Disahkan</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Memuat...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                Tiada tempahan {selectedStatus !== "all" && `dengan status "${selectedStatus}"`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking: any) => (
                <Card key={booking.id} className="hover-elevate" data-testid={`booking-card-${booking.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{booking.bookingNumber}</h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {booking.eventType.charAt(0).toUpperCase() + booking.eventType.slice(1)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {booking.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: booking.id, status: "confirmed" })}
                            data-testid={`button-confirm-${booking.id}`}
                          >
                            Sahkan
                          </Button>
                        )}
                        {booking.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ id: booking.id, status: "completed" })}
                            data-testid={`button-complete-${booking.id}`}
                          >
                            Selesai
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm("Adakah anda pasti untuk batalkan tempahan ini?")) {
                              updateStatusMutation.mutate({ id: booking.id, status: "cancelled" });
                            }
                          }}
                          data-testid={`button-cancel-${booking.id}`}
                        >
                          Batal
                        </Button>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{booking.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{booking.customerPhone}</span>
                        </div>
                        {booking.customerEmail && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">📧</span>
                            <span>{booking.customerEmail}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>Hantar: {new Date(booking.deliveryDate).toLocaleDateString("ms-MY")}</span>
                          {booking.deliveryTime && <span className="text-muted-foreground">• {booking.deliveryTime}</span>}
                        </div>
                        {booking.deliveryLocation && (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <span className="text-muted-foreground">{booking.deliveryLocation}</span>
                          </div>
                        )}
                        {booking.totalAmount && (
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <span>Jumlah: RM{parseFloat(booking.totalAmount).toFixed(2)}</span>
                            {booking.depositAmount && (
                              <span className="text-xs text-muted-foreground">
                                (Deposit: RM{parseFloat(booking.depositAmount).toFixed(2)})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {booking.items && booking.items.length > 0 && (
                      <>
                        <Separator className="my-4" />
                        <div className="text-sm">
                          <span className="font-medium flex items-center gap-2 mb-2">
                            <Package className="w-4 h-4" />
                            Produk Ditempah:
                          </span>
                          <div className="space-y-1">
                            {booking.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{item.productName}</span>
                                <Badge variant="secondary">{item.quantity}x</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {booking.notes && (
                      <>
                        <Separator className="my-4" />
                        <div className="text-sm">
                          <span className="font-medium">Nota:</span>
                          <p className="text-muted-foreground mt-1">{booking.notes}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
