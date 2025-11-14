import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Rocket, Clock } from "lucide-react";

export default function ComingSoon() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Clock className="h-7 w-7 text-primary" />
          </div>
          <Badge variant="secondary" className="mx-auto">Segera Hadir</Badge>
          <CardTitle className="text-2xl mt-2">Fungsi Akan Dibuka Tidak Lama Lagi</CardTitle>
          <CardDescription>
            Terima kasih atas minat anda. Kami sedang menyiapkan fungsi ini untuk pengalaman terbaik.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate("/dashboard")}>
              Kembali ke Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate("/pricing")}
              className="gap-2">
              <Rocket className="h-4 w-4" />
              Lihat Harga
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
