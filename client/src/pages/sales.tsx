import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Receipt, Download, Eye, TrendingUp, DollarSign, ShoppingCart, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SalesListPage() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("semua");
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch all sales
  const { data: sales = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/sales"],
  });

  // Fetch selected sale details with items
  const { data: saleDetails } = useQuery<any>({
    queryKey: ["/api/sales", selectedSale?.id],
    enabled: !!selectedSale?.id && detailsOpen,
  });

  // Filter sales
  const filteredSales = sales.filter(sale => {
    // Date filter
    if (startDate && sale.saleDate < startDate) return false;
    if (endDate && sale.saleDate > endDate) return false;
    
    // Payment method filter
    if (paymentMethodFilter !== "semua" && sale.paymentMethod !== paymentMethodFilter) return false;
    
    return true;
  });

  // Calculate totals
  const totalRevenue = filteredSales.reduce((sum, s) => sum + parseFloat(s.totalAmount || 0), 0);
  const totalCost = filteredSales.reduce((sum, s) => sum + parseFloat(s.totalCost || 0), 0);
  const totalProfit = filteredSales.reduce((sum, s) => sum + parseFloat(s.profitAmount || 0), 0);
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["No Resit", "Tarikh", "Pelanggan", "Bayaran", "Jumlah (RM)", "Kos (RM)", "Untung (RM)"];
    const csvData = filteredSales.map(sale => [
      sale.receiptNumber,
      new Date(sale.saleDate).toLocaleDateString('ms-MY'),
      sale.customerName || "-",
      sale.paymentMethod.toUpperCase(),
      parseFloat(sale.totalAmount).toFixed(2),
      parseFloat(sale.totalCost).toFixed(2),
      parseFloat(sale.profitAmount).toFixed(2),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `jualan_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "CSV Dieksport",
      description: `${filteredSales.length} transaksi dieksport`,
    });
  };

  // View sale details
  const handleViewDetails = (sale: any) => {
    setSelectedSale(sale);
    setDetailsOpen(true);
  };

  // Reset filters
  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setPaymentMethodFilter("semua");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Sejarah Jualan</h1>
            <p className="text-sm text-muted-foreground mt-1">Senarai transaksi jualan POS</p>
          </div>
          <Button
            data-testid="button-export-csv"
            onClick={handleExportCSV}
            variant="outline"
            disabled={filteredSales.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Eksport CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jumlah Transaksi</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-transactions">
                {filteredSales.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jumlah Jualan</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-revenue">
                RM {totalRevenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jumlah Untung</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary" data-testid="text-total-profit">
                RM {totalProfit.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Margin Untung</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-profit-margin">
                {profitMargin.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Penapis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Tarikh Mula</Label>
                <Input
                  id="start-date"
                  data-testid="input-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">Tarikh Akhir</Label>
                <Input
                  id="end-date"
                  data-testid="input-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-filter">Kaedah Bayaran</Label>
                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger id="payment-filter" data-testid="select-payment-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semua">Semua</SelectItem>
                    <SelectItem value="tunai">Tunai</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="kredit">Kredit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  data-testid="button-reset-filters"
                  onClick={handleResetFilters}
                  variant="outline"
                  className="w-full"
                >
                  Reset Penapis
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaksi Jualan</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Memuatkan...</div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tiada transaksi dijumpai
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No Resit</TableHead>
                      <TableHead>Tarikh</TableHead>
                      <TableHead>Pelanggan</TableHead>
                      <TableHead>Bayaran</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead className="text-right">Kos</TableHead>
                      <TableHead className="text-right">Untung</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id} data-testid={`row-sale-${sale.id}`}>
                        <TableCell className="font-medium">{sale.receiptNumber}</TableCell>
                        <TableCell>
                          {new Date(sale.saleDate).toLocaleDateString('ms-MY')}
                        </TableCell>
                        <TableCell>{sale.customerName || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {sale.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          RM {parseFloat(sale.totalAmount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          RM {parseFloat(sale.totalCost).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-primary font-medium">
                          RM {parseFloat(sale.profitAmount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            data-testid={`button-view-${sale.id}`}
                            onClick={() => handleViewDetails(sale)}
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Lihat
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sale Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-sale-details">
          <DialogHeader>
            <DialogTitle>Butiran Jualan</DialogTitle>
          </DialogHeader>

          {selectedSale && saleDetails && (
            <div className="space-y-4">
              {/* Sale Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">No Resit</p>
                  <p className="font-medium">{selectedSale.receiptNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tarikh</p>
                  <p className="font-medium">
                    {new Date(selectedSale.saleDate).toLocaleDateString('ms-MY')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pelanggan</p>
                  <p className="font-medium">{selectedSale.customerName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bayaran</p>
                  <Badge variant="outline" className="capitalize">
                    {selectedSale.paymentMethod}
                  </Badge>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h3 className="font-semibold mb-3">Produk Dijual</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-center">Kuantiti</TableHead>
                      <TableHead className="text-right">Harga</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead className="text-right">Untung</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(saleDetails.items || []).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          RM {parseFloat(item.unitPrice).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          RM {parseFloat(item.totalPrice).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-primary">
                          RM {parseFloat(item.profitAmount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jumlah Kos:</span>
                  <span className="font-medium">RM {parseFloat(selectedSale.totalCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jumlah Jualan:</span>
                  <span className="font-medium">RM {parseFloat(selectedSale.totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Jumlah Untung:</span>
                  <span className="font-bold text-primary">
                    RM {parseFloat(selectedSale.profitAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                data-testid="button-close-details"
                onClick={() => setDetailsOpen(false)}
                className="w-full"
                variant="secondary"
              >
                Tutup
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
