import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Receipt } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const expenseFormSchema = insertExpenseSchema.extend({
  category: z.enum(["bahan", "minyak", "upah", "plastik", "lain"]),
  amount: z.string().min(1, "Jumlah diperlukan"),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

const categoryLabels = {
  bahan: "Bahan Mentah",
  minyak: "Minyak & Petrol",
  upah: "Upah Pekerja",
  plastik: "Plastik & Pembungkusan",
  lain: "Lain-lain",
};

const categoryColors = {
  bahan: "bg-chart-1",
  minyak: "bg-chart-2",
  upah: "bg-chart-3",
  plastik: "bg-chart-4",
  lain: "bg-chart-5",
};

export default function Expenses() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["/api/expenses"],
  });

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      category: "bahan",
      description: "",
      amount: "",
      expenseDate: new Date().toISOString().split('T')[0],
      receiptUrl: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ExpenseFormValues) => {
      return apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Berjaya!",
        description: "Perbelanjaan telah direkod.",
      });
      setDialogOpen(false);
      form.reset();
    },
  });

  const filteredExpenses = selectedCategory
    ? expenses?.filter((exp: any) => exp.category === selectedCategory)
    : expenses;

  const categoryTotals = expenses?.reduce((acc: any, exp: any) => {
    acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">Perbelanjaan</h1>
          <p className="text-sm text-muted-foreground mt-1">Rekod semua kos perniagaan</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-expense">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Perbelanjaan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rekod Perbelanjaan Baru</DialogTitle>
              <DialogDescription>
                Masukkan maklumat perbelanjaan
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-expense-category">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(categoryLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Penerangan</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Penerangan perbelanjaan"
                          {...field}
                          data-testid="input-expense-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah (RM)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          data-testid="input-expense-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expenseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarikh</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-expense-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-submit-expense"
                  >
                    {createMutation.isPending ? "Menyimpan..." : "Simpan Perbelanjaan"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Summary */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        {Object.entries(categoryLabels).map(([key, label]) => (
          <Card 
            key={key}
            className={`hover-elevate cursor-pointer ${selectedCategory === key ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
            data-testid={`category-${key}`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-mono font-semibold">
                RM {(categoryTotals?.[key] || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!filteredExpenses || filteredExpenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Receipt className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-medium mb-1">Tiada Perbelanjaan</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedCategory ? "Tiada perbelanjaan untuk kategori ini" : "Mulakan dengan merekod perbelanjaan pertama"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredExpenses.map((expense: any) => (
            <Card key={expense.id} className="hover-elevate" data-testid={`expense-card-${expense.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">
                        {categoryLabels[expense.category as keyof typeof categoryLabels]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(expense.expenseDate).toLocaleDateString('ms-MY')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{expense.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-lg text-destructive">
                      -RM {expense.amount}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
