import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ThermalInvoice } from "./thermal-invoice";
import { shareInvoiceViaWhatsApp, printThermalInvoice } from "@/lib/thermal-print";
import { useToast } from "@/hooks/use-toast";
import { Printer, Share2, Loader2, FileText } from "lucide-react";

interface DeliveryInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: {
    id: string;
    vendorId: string;
    vendorName: string;
    vendorAddress?: string;
    vendorPhone?: string;
    deliveryDate: string;
    invoiceNumber: string;
    totalAmount: string;
    items: Array<{
      productName: string;
      quantity: number;
      unitPrice: string;
      totalPrice: string;
    }>;
  };
}

export function DeliveryInvoiceDialog({
  open,
  onOpenChange,
  delivery,
}: DeliveryInvoiceDialogProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSharing, setIsSharing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleWhatsAppShare = async () => {
    if (!delivery.vendorPhone) {
      toast({
        title: "Tiada Nombor Telefon",
        description: "Vendor tidak mempunyai nombor telefon. Sila kemaskini dalam profil vendor.",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);
    try {
      await shareInvoiceViaWhatsApp(
        "thermal-invoice",
        delivery.vendorPhone,
        delivery.vendorName,
        delivery.invoiceNumber
      );
      
      toast({
        title: "Invois Dikongsi",
        description: `Invois telah dikongsi kepada ${delivery.vendorName}`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error sharing invoice:", error);
      toast({
        title: "Ralat",
        description: "Gagal kongsi invois. Cuba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    try {
      printThermalInvoice("thermal-invoice");
      
      toast({
        title: "Print Dialog Dibuka",
        description: "Pilih printer dan tekan Print",
      });
      
      // Keep dialog open so user can see the invoice
      // onOpenChange(false);
    } catch (error) {
      console.error("Error printing invoice:", error);
      toast({
        title: "Ralat",
        description: "Gagal buka print dialog. Pastikan popup tidak disekat.",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invois Penghantaran</DialogTitle>
          <DialogDescription>
            Preview invois & pilih cara untuk hantar ke vendor
          </DialogDescription>
        </DialogHeader>

        {/* Invoice Preview */}
        <div className="border rounded-lg overflow-hidden bg-white">
          <ThermalInvoice
            vendor={{
              name: delivery.vendorName,
              address: delivery.vendorAddress,
            }}
            items={delivery.items}
            invoiceNumber={delivery.invoiceNumber}
            deliveryDate={delivery.deliveryDate}
            totalAmount={delivery.totalAmount}
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4 border-t">
          <Button
            onClick={handleWhatsAppShare}
            disabled={isSharing || isPrinting}
            className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {isSharing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Sedang Kongsi...
              </>
            ) : (
              <>
                <Share2 className="h-5 w-5 mr-2" />
                Kongsi via WhatsApp
              </>
            )}
          </Button>

          <Button
            onClick={handlePrint}
            disabled={isSharing || isPrinting}
            variant="outline"
            className="w-full h-12 text-base"
            size="lg"
          >
            {isPrinting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Membuka Print...
              </>
            ) : (
              <>
                <Printer className="h-5 w-5 mr-2" />
                Print (Thermal/Biasa)
              </>
            )}
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                onOpenChange(false);
                navigate("/claims");
              }}
              variant="outline"
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Bayaran & Invoice
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="ghost"
              className="flex-1"
            >
              Tutup
            </Button>
          </div>
        </div>

        {/* Helper Text */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>💡 <strong>WhatsApp:</strong> Hantar invois sebagai gambar terus ke vendor</p>
          <p>🖨️ <strong>Print:</strong> Cetak guna printer thermal atau printer biasa</p>
          <p>📋 Nak semak invois lagi? Pergi ke <strong>Bayaran & Invoice</strong></p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
