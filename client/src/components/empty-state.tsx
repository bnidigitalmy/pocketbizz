import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  Truck,
  DollarSign,
  Receipt,
  BarChart3,
  ChefHat,
  type LucideIcon
} from "lucide-react";
import { PocketBizzIcon } from "@/components/pocketbizz-logo";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: 'default' | 'compact';
}

const iconMap: Record<string, LucideIcon> = {
  Package,
  ShoppingCart,
  Users,
  FileText,
  Truck,
  DollarSign,
  Receipt,
  BarChart3,
  ChefHat,
};

export function EmptyState({
  icon: IconComponent = Package,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default',
}: EmptyStateProps) {
  
  if (variant === 'compact') {
    return (
      <div className="text-center py-8" data-testid="empty-state">
        <IconComponent className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
        <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground/70 mb-4">{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction} size="sm" data-testid="empty-state-action">
            {actionLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="border-dashed" data-testid="empty-state">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-muted p-6 mb-4">
          <IconComponent className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
          {description}
        </p>
        <div className="flex gap-2">
          {actionLabel && onAction && (
            <Button onClick={onAction} data-testid="empty-state-action">
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button 
              onClick={onSecondaryAction} 
              variant="outline"
              data-testid="empty-state-secondary-action"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Preset empty states for common scenarios
export const EmptyStates = {
  Products: (onAdd?: () => void) => {
    const ProductIcon = () => <PocketBizzIcon className="h-12 w-12 text-muted-foreground" size={48} />;
    return (
      <EmptyState
        icon={ProductIcon as any}
        title="Belum Ada Produk"
        description="Jom tambah produk pertama untuk mulakan perniagaan anda. Masukkan resepi dan kos untuk pengiraan automatik."
        actionLabel="Tambah Produk Pertama"
        onAction={onAdd}
      />
    );
  },
  
  Stock: (onAdd?: () => void) => (
    <EmptyState
      icon={Package}
      title="Stok Kosong"
      description="Tiada bahan dalam stok. Tambah bahan mentah untuk mulakan produksi."
      actionLabel="Tambah Stok"
      onAction={onAdd}
    />
  ),
  
  Vendors: (onAdd?: () => void) => (
    <EmptyState
      icon={Users}
      title="Belum Ada Vendor"
      description="Tambah vendor untuk uruskan penghantaran dan pembayaran dengan lebih mudah."
      actionLabel="Tambah Vendor"
      onAction={onAdd}
    />
  ),
  
  Sales: (onAdd?: () => void) => (
    <EmptyState
      icon={DollarSign}
      title="Tiada Jualan Hari Ini"
      description="Belum ada rekod jualan. Jom rekod jualan pertama anda!"
      actionLabel="Rekod Jualan"
      onAction={onAdd}
    />
  ),
  
  Deliveries: (onAdd?: () => void) => (
    <EmptyState
      icon={Truck}
      title="Tiada Penghantaran"
      description="Belum ada penghantaran direkod. Hantar produk ke vendor dan jana invois automatik."
      actionLabel="Buat Penghantaran"
      onAction={onAdd}
    />
  ),
  
  Expenses: (onAdd?: () => void) => (
    <EmptyState
      icon={Receipt}
      title="Tiada Perbelanjaan"
      description="Rekod perbelanjaan untuk jejak kos dan kira untung rugi dengan tepat."
      actionLabel="Tambah Perbelanjaan"
      onAction={onAdd}
    />
  ),
  
  Production: (onAdd?: () => void) => (
    <EmptyState
      icon={ChefHat}
      title="Belum Ada Produksi"
      description="Mulakan produksi untuk tolak stok dan jejak kos pembuatan."
      actionLabel="Rekod Produksi"
      onAction={onAdd}
    />
  ),
  
  Reports: () => (
    <EmptyState
      icon={BarChart3}
      title="Tiada Data untuk Tempoh Ini"
      description="Tiada aktiviti dijumpai untuk tempoh yang dipilih. Cuba tukar tarikh atau tambah data baharu."
      variant="compact"
    />
  ),
  
  ShoppingList: () => (
    <EmptyState
      icon={ShoppingCart}
      title="Senarai Belian Kosong"
      description="Tiada item dalam senarai belian. Sistem akan menambah item automatik berdasarkan stok rendah."
      variant="compact"
    />
  ),
  
  Search: (query: string) => (
    <EmptyState
      icon={FileText}
      title="Tiada Hasil Ditemui"
      description={`Tiada hasil untuk "${query}". Cuba cari dengan nama lain atau periksa ejaan.`}
      variant="compact"
    />
  ),
};
