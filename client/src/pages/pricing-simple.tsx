import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useNavigate } from "wouter";

export default function PricingSimple() {
  const [, navigate] = useNavigate();

  const features = [
    "Pengurusan stok & inventori",
    "Rekod jualan & penghantaran",
    "Vendor & reseller management",
    "Payment claims untuk vendor",
    "Laporan kewangan lengkap",
    "Thermal invoice printing",
    "WhatsApp sharing",
    "Export data ke Excel",
    "Unlimited products",
    "Unlimited users",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">PocketBizz</h1>
          <Button variant="outline" onClick={() => navigate("/auth/login")}>
            Log Masuk
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold mb-4">
          Sistem Pengurusan Bakeri<br />Yang <span className="text-blue-600">Paling Mudah</span>
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Sehari hanya RM0.90 - lebih murah dari teh tarik & roti canai!
        </p>
      </div>

      {/* Pricing Card */}
      <div className="container mx-auto px-4 pb-16 max-w-2xl">
        <Card className="border-2 border-blue-500 shadow-2xl">
          <CardHeader className="text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white py-8">
            <CardTitle className="text-3xl mb-2">PocketBizz</CardTitle>
            <CardDescription className="text-blue-50 text-lg">
              Satu harga, semua features
            </CardDescription>
            <div className="mt-6">
              <div className="text-6xl font-bold mb-2">RM27</div>
              <div className="text-blue-100 text-xl">/bulan</div>
              <div className="text-blue-200 text-sm mt-2">RM0.90/hari sahaja</div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            {/* Trial Badge */}
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-6 text-center">
              <div className="text-green-700 font-bold text-lg">🎁 7 HARI PERCUBAAN PERCUMA</div>
              <div className="text-green-600 text-sm mt-1">Tiada kad kredit diperlukan</div>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Button 
              size="lg" 
              className="w-full text-lg py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => navigate("/auth/register")}
            >
              Mula Percubaan Percuma 7 Hari
            </Button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Daftar sekarang dan cuba PERCUMA selama 7 hari.<br />
              Bayar hanya RM27/bulan selepas trial.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 pb-16 max-w-3xl">
        <h3 className="text-2xl font-bold text-center mb-8">Soalan Lazim</h3>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ada limit ke berapa produk boleh letak?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Tiada limit! Unlimited products dan unlimited users.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kena bayar masa trial ke?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                TIDAK! 7 hari percubaan adalah 100% PERCUMA. Tiada kad kredit diperlukan untuk trial.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kalau nak cancel macam mana?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Boleh cancel bila-bila masa. Tiada kontrak, tiada hidden charges.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bayar macam mana?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Online banking, kad kredit, atau FPX - semua payment method accepted.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 py-8 text-center text-gray-600">
        <p>© 2025 PocketBizz. Made with ❤️ for Malaysian bakeries.</p>
      </div>
    </div>
  );
}
