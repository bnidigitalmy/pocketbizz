import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Percent } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CommissionRange {
  min: string;
  max: string;
  amount: string;
}

interface CommissionDialogProps {
  vendorId: string;
  vendorName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommissionDialog({ vendorId, vendorName, open, onOpenChange }: CommissionDialogProps) {
  const { toast } = useToast();
  const [commissionType, setCommissionType] = useState<"fixed_range" | "percentage">("percentage");
  const [percentage, setPercentage] = useState("");
  const [ranges, setRanges] = useState<CommissionRange[]>([
    { min: "", max: "", amount: "" }
  ]);

  const { data: existingCommission } = useQuery<any>({
    queryKey: ["/api/vendors", vendorId, "commission"],
    enabled: open && !!vendorId,
  });

  useEffect(() => {
    if (existingCommission) {
      setCommissionType(existingCommission.commissionType);
      if (existingCommission.commissionType === "percentage") {
        setPercentage(existingCommission.percentage || "");
      } else if (existingCommission.ranges) {
        try {
          const parsedRanges = JSON.parse(existingCommission.ranges);
          setRanges(parsedRanges.length > 0 ? parsedRanges : [{ min: "", max: "", amount: "" }]);
        } catch {
          setRanges([{ min: "", max: "", amount: "" }]);
        }
      }
    } else {
      // Reset to defaults
      setCommissionType("percentage");
      setPercentage("");
      setRanges([{ min: "", max: "", amount: "" }]);
    }
  }, [existingCommission, open]);

  const validateRanges = (): string | null => {
    if (commissionType !== "fixed_range") return null;

    const validRanges = ranges.filter(r => r.min && r.max && r.amount);
    
    if (validRanges.length === 0) {
      return "Sila tambah sekurang-kurangnya satu range komisyen";
    }

    for (const range of validRanges) {
      const min = parseFloat(range.min);
      const max = parseFloat(range.max);
      const amount = parseFloat(range.amount);

      if (isNaN(min) || isNaN(max) || isNaN(amount)) {
        return "Semua nilai mesti nombor yang sah";
      }
      if (min < 0 || max < 0 || amount < 0) {
        return "Nilai tidak boleh negatif";
      }
      if (min >= max) {
        return "Nilai Min mesti kurang dari Max";
      }
    }

    // Sort ranges by min value for consistency
    validRanges.sort((a, b) => parseFloat(a.min) - parseFloat(b.min));

    return null;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Validate percentage
      if (commissionType === "percentage") {
        const pct = parseFloat(percentage);
        if (isNaN(pct) || pct < 0 || pct > 100) {
          throw new Error("Peratusan mesti antara 0 dan 100");
        }
      }

      // Validate ranges
      const rangeError = validateRanges();
      if (rangeError) {
        throw new Error(rangeError);
      }

      const data: any = {
        commissionType,
      };

      if (commissionType === "percentage") {
        data.percentage = percentage;
        data.ranges = null;
      } else {
        data.percentage = null;
        // Filter and sort ranges before saving
        const validRanges = ranges
          .filter(r => r.min && r.max && r.amount)
          .sort((a, b) => parseFloat(a.min) - parseFloat(b.min));
        data.ranges = JSON.stringify(validRanges);
      }

      return apiRequest("POST", `/api/vendors/${vendorId}/commission`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "commission"] });
      toast({
        title: "Berjaya!",
        description: "Setup komisyen telah disimpan.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal menyimpan setup komisyen.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/vendors/${vendorId}/commission`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "commission"] });
      toast({
        title: "Berjaya!",
        description: "Setup komisyen telah dipadam.",
      });
      onOpenChange(false);
    },
  });

  const addRange = () => {
    setRanges([...ranges, { min: "", max: "", amount: "" }]);
  };

  const removeRange = (index: number) => {
    setRanges(ranges.filter((_, i) => i !== index));
  };

  const updateRange = (index: number, field: keyof CommissionRange, value: string) => {
    const newRanges = [...ranges];
    newRanges[index][field] = value;
    setRanges(newRanges);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Setup Komisyen - {vendorName}</DialogTitle>
          <DialogDescription>
            Tetapkan komisyen yang akan dicaj oleh vendor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Jenis Komisyen</Label>
            <Select value={commissionType} onValueChange={(val: any) => setCommissionType(val)}>
              <SelectTrigger data-testid="select-commission-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Peratusan (%)</SelectItem>
                <SelectItem value="fixed_range">Tetap Mengikut Range Harga</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {commissionType === "percentage" ? (
            <div className="space-y-2">
              <Label>Peratusan Komisyen (%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="cth: 10, 15, 20"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  data-testid="input-percentage"
                  className="pr-8"
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Komisyen akan dikira sebagai {percentage || "0"}% dari jumlah jualan
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Range Harga & Komisyen</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRange}
                  data-testid="button-add-range"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Range
                </Button>
              </div>

              <div className="space-y-3">
                {ranges.map((range, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-4">
                          <Label className="text-xs">Min (RM)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="1.00"
                            value={range.min}
                            onChange={(e) => updateRange(index, "min", e.target.value)}
                            data-testid={`input-range-min-${index}`}
                          />
                        </div>
                        <div className="col-span-4">
                          <Label className="text-xs">Max (RM)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="5.00"
                            value={range.max}
                            onChange={(e) => updateRange(index, "max", e.target.value)}
                            data-testid={`input-range-max-${index}`}
                          />
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs">Komisyen (RM)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="1.00"
                            value={range.amount}
                            onChange={(e) => updateRange(index, "amount", e.target.value)}
                            data-testid={`input-range-amount-${index}`}
                          />
                        </div>
                        <div className="col-span-1">
                          {ranges.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRange(index)}
                              data-testid={`button-remove-range-${index}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Contoh: RM1-5 = RM1, RM5.01-10 = RM1.50, RM10.01-13 = RM2
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {existingCommission && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-commission"
            >
              {deleteMutation.isPending ? "Memadam..." : "Padam"}
            </Button>
          )}
          <Button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            data-testid="button-save-commission"
          >
            {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
