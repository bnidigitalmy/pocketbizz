import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, DollarSign, Trophy } from "lucide-react";

export default function ResellerPerformancePage() {
  // Fetch resellers
  const { data: resellers = [], isLoading: resellersLoading } = useQuery<any[]>({
    queryKey: ["/api/resellers"],
  });

  // Fetch reseller transfers
  const { data: transfersResponse } = useQuery<{ data: any[], hasMore: boolean, total: number }>({
    queryKey: ["/api/reseller-transfers"],
  });

  const transfers = transfersResponse?.data || [];

  // Calculate stats
  const activeResellers = resellers.filter(r => r.isActive === 1);
  const totalResellers = resellers.length;
  
  // Get current month transfers
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyTransfers = transfers.filter(t => 
    t.transferDate?.startsWith(currentMonth)
  );
  const monthlyTotal = monthlyTransfers.reduce((sum, t) => sum + parseFloat(t.totalAmount || '0'), 0);

  // Sort resellers by total purchases
  const rankedResellers = [...resellers]
    .filter(r => r.isActive === 1)
    .sort((a, b) => parseFloat(b.totalPurchases) - parseFloat(a.totalPurchases))
    .slice(0, 10);

  const topPerformer = rankedResellers[0];

  if (resellersLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Prestasi Ejen</h1>
          <p className="text-muted-foreground">Pantau prestasi ejen jualan anda</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Prestasi Ejen</h1>
        <p className="text-muted-foreground">Pantau prestasi ejen jualan anda</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ejen Aktif</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeResellers.length}</div>
            <p className="text-xs text-muted-foreground">
              daripada {totalResellers} ejen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jualan Bulan Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {monthlyTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {monthlyTransfers.length} transfer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topPerformer ? topPerformer.name : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {topPerformer && `RM ${parseFloat(topPerformer.totalPurchases).toFixed(2)}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rankings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking Ejen</CardTitle>
        </CardHeader>
        <CardContent>
          {rankedResellers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Tiada data prestasi. Tambah ejen dan buat transfer untuk melihat ranking.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Rank</TableHead>
                  <TableHead>Nama Ejen</TableHead>
                  <TableHead>Negeri</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Total Pembelian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedResellers.map((reseller, index) => {
                  // Get latest transfer for this reseller
                  const lastTransfer = transfers
                    .filter(t => t.resellerId === reseller.id)
                    .sort((a, b) => new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime())[0];

                  return (
                    <TableRow key={reseller.id}>
                      <TableCell className="font-bold">
                        {index === 0 && <Trophy className="h-5 w-5 inline mr-2 text-yellow-500" />}
                        #{index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{reseller.name}</TableCell>
                      <TableCell>{reseller.area || "-"}</TableCell>
                      <TableCell>
                        {reseller.pricingTier ? (
                          <Badge variant="secondary">{reseller.pricingTier.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        RM {parseFloat(reseller.totalPurchases).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
