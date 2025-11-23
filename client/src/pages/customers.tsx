import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Award, History, Phone, Mail } from "lucide-react";

export default function CustomersPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { data: customers = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/loyalty/customers"],
  });

  const { data: pointsHistory = [] } = useQuery<any[]>({
    queryKey: ["/api/loyalty/history", selectedCustomer?.id],
    enabled: !!selectedCustomer?.id && showHistory,
  });

  const totalCustomers = customers.length;
  const totalPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
  const avgPoints = totalCustomers > 0 ? Math.round(totalPoints / totalCustomers) : 0;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Pelanggan Setia</h1>
          <p className="text-muted-foreground">
            Urus pelanggan dan program mata ganjaran
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Jumlah Pelanggan
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-customers">
                {totalCustomers}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Jumlah Mata
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-points">
                {totalPoints.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Purata Mata
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-avg-points">
                {avgPoints}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customers List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Senarai Pelanggan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Memuatkan...
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium mb-2">Tiada Pelanggan</p>
                <p className="text-sm text-muted-foreground">
                  Pelanggan akan dipaparkan di sini apabila mereka mendaftar di POS
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    data-testid={`customer-card-${customer.id}`}
                    className="flex items-center justify-between p-4 border rounded-lg hover-elevate active-elevate-2"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1" data-testid={`customer-name-${customer.id}`}>
                        {customer.name}
                      </h3>
                      <div className="flex flex-col md:flex-row md:items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </span>
                        {customer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge 
                          variant="default" 
                          className="text-base px-3 py-1"
                          data-testid={`badge-points-${customer.id}`}
                        >
                          {customer.loyaltyPoints} mata
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          ≈ RM{Math.floor(customer.loyaltyPoints / 100) * 10} diskaun
                        </p>
                      </div>

                      <Button
                        data-testid={`button-history-${customer.id}`}
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowHistory(true);
                        }}
                      >
                        <History className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Points History Dialog */}
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Sejarah Mata Ganjaran - {selectedCustomer?.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-accent/20 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Baki Semasa:</span>
                  <Badge variant="default" className="text-base px-3 py-1">
                    {selectedCustomer?.loyaltyPoints} mata
                  </Badge>
                </div>
              </div>

              {pointsHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Tiada sejarah transaksi</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pointsHistory.map((record: any) => (
                    <div
                      key={record.id}
                      data-testid={`history-record-${record.id}`}
                      className="flex justify-between items-start p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {record.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(record.createdAt).toLocaleString('ms-MY', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-semibold ${
                            record.pointsChange >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                          data-testid={`points-change-${record.id}`}
                        >
                          {record.pointsChange >= 0 ? "+" : ""}
                          {record.pointsChange}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          Baki: {record.balanceAfter}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
