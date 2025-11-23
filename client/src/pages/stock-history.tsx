import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Clock, TrendingUp, TrendingDown, RefreshCw, Package, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface StockMovement {
  id: string;
  userId: string;
  stockItemId: string;
  movementType: string;
  quantityBefore: string;
  quantityChange: string;
  quantityAfter: string;
  reason: string | null;
  referenceId: string | null;
  referenceType: string | null;
  createdBy: string | null;
  createdAt: string;
}

interface StockItem {
  id: string;
  name: string;
  unit: string;
  currentQuantity: string;
  lowStockThreshold: string;
}

const movementTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  purchase: { label: "Pembelian", icon: Package, color: "bg-blue-100 text-blue-700" },
  replenish: { label: "Tambah Stok", icon: TrendingUp, color: "bg-green-100 text-green-700" },
  adjust: { label: "Pelarasan", icon: RefreshCw, color: "bg-yellow-100 text-yellow-700" },
  production_use: { label: "Guna Produksi", icon: TrendingDown, color: "bg-orange-100 text-orange-700" },
  waste: { label: "Rosak/Buang", icon: Trash2, color: "bg-red-100 text-red-700" },
  return: { label: "Pulangan", icon: ArrowLeft, color: "bg-purple-100 text-purple-700" },
  transfer: { label: "Pindah", icon: ArrowRight, color: "bg-indigo-100 text-indigo-700" },
  correction: { label: "Pembetulan", icon: RefreshCw, color: "bg-gray-100 text-gray-700" },
};

export default function StockHistory() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: stockItem, isLoading: itemLoading } = useQuery<StockItem>({
    queryKey: [`/api/stock/${id}`],
    enabled: !!id,
  });

  const { data: movements = [], isLoading: movementsLoading } = useQuery<StockMovement[]>({
    queryKey: [`/api/stock/${id}/movements`],
    enabled: !!id,
  });

  if (itemLoading || movementsLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!stockItem) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Item tidak dijumpai</CardTitle>
            <CardDescription>Item stok yang anda cari tidak wujud.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/stock")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Stok
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalIncrease = movements
    .filter((m) => parseFloat(m.quantityChange) > 0)
    .reduce((sum, m) => sum + parseFloat(m.quantityChange), 0);

  const totalDecrease = movements
    .filter((m) => parseFloat(m.quantityChange) < 0)
    .reduce((sum, m) => sum + Math.abs(parseFloat(m.quantityChange)), 0);

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => setLocation("/stock")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Stok
          </Button>
          <h1 className="text-3xl font-bold">Sejarah Pergerakan Stok</h1>
          <p className="text-muted-foreground mt-1">
            Rekod lengkap perubahan kuantiti untuk {stockItem.name}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stok Semasa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parseFloat(stockItem.currentQuantity).toFixed(2)} {stockItem.unit}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Threshold: {parseFloat(stockItem.lowStockThreshold).toFixed(2)} {stockItem.unit}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jumlah Pergerakan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{movements.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Rekod transaksi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jumlah Masuk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{totalIncrease.toFixed(2)} {stockItem.unit}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pembelian & tambahan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jumlah Keluar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{totalDecrease.toFixed(2)} {stockItem.unit}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Guna produksi & buang</p>
          </CardContent>
        </Card>
      </div>

      {/* Movement History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rekod Pergerakan</CardTitle>
          <CardDescription>
            Sejarah lengkap semua perubahan kuantiti dengan tarikh dan masa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Tiada rekod pergerakan lagi.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarikh & Masa</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead className="text-right">Sebelum</TableHead>
                    <TableHead className="text-right">Perubahan</TableHead>
                    <TableHead className="text-right">Selepas</TableHead>
                    <TableHead>Sebab</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => {
                    const config = movementTypeConfig[movement.movementType] || movementTypeConfig.adjust;
                    const Icon = config.icon;
                    const change = parseFloat(movement.quantityChange);
                    const isIncrease = change > 0;

                    return (
                      <TableRow key={movement.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(movement.createdAt), "dd/MM/yyyy HH:mm")}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={config.color}>
                            <Icon className="mr-1 h-3 w-3" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {parseFloat(movement.quantityBefore).toFixed(2)}
                        </TableCell>
                        <TableCell className={`text-right font-mono font-bold ${isIncrease ? "text-green-600" : "text-red-600"}`}>
                          {isIncrease ? "+" : ""}
                          {change.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {parseFloat(movement.quantityAfter).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {movement.reason || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
