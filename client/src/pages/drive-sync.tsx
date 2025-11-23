import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cloud, FileText, ExternalLink, Calendar } from "lucide-react";

interface SyncLog {
  id: string;
  fileName: string;
  fileType: string;
  driveFileId: string;
  driveWebViewLink: string;
  syncedAt: string;
  vendorName: string | null;
}

export default function DriveSync() {
  const { data: syncLogs, isLoading, error } = useQuery<SyncLog[]>({
    queryKey: ["/api/google-drive/sync-logs"],
  });

  const getFileTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'invoice': 'Invois',
      'thermal_invoice': 'Invois Thermal',
      'claim_statement': 'Penyata Tuntutan',
      'thermal_claim': 'Penyata Thermal',
      'receipt_a5': 'Resit A5',
    };
    return labels[type] || type;
  };

  const getFileTypeBadgeVariant = (type: string) => {
    if (type.includes('thermal')) return 'secondary';
    if (type.includes('claim')) return 'default';
    return 'outline';
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold md:text-3xl">Dokumen Google Drive</h1>
        <Card>
          <CardContent className="p-12 text-center">
            <Cloud className="h-16 w-16 mx-auto text-destructive mb-4" />
            <p className="text-destructive font-medium">Ralat memuatkan sync logs</p>
            <p className="text-sm text-muted-foreground mt-2">Sila refresh halaman atau cuba lagi kemudian</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl flex items-center gap-3">
          <Cloud className="h-8 w-8 text-primary" />
          Dokumen Google Drive
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Senarai dokumen yang telah di-sync ke Google Drive anda
        </p>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ringkasan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-semibold font-mono">
                {(syncLogs ?? []).length}
              </div>
              <div className="text-xs text-muted-foreground">Total Dokumen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold font-mono text-blue-600 dark:text-blue-400">
                {(syncLogs?.filter(l => l.fileType.includes('invoice')) ?? []).length}
              </div>
              <div className="text-xs text-muted-foreground">Invois</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold font-mono text-green-600 dark:text-green-400">
                {(syncLogs?.filter(l => l.fileType.includes('claim')) ?? []).length}
              </div>
              <div className="text-xs text-muted-foreground">Penyata</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold font-mono text-orange-600 dark:text-orange-400">
                {(syncLogs?.filter(l => l.fileType.includes('thermal')) ?? []).length}
              </div>
              <div className="text-xs text-muted-foreground">Thermal</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Senarai Dokumen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {syncLogs?.map((log) => (
              <Card key={log.id} className="hover-elevate" data-testid={`card-sync-${log.id}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{log.fileName}</span>
                        <Badge variant={getFileTypeBadgeVariant(log.fileType)} size="sm">
                          {getFileTypeLabel(log.fileType)}
                        </Badge>
                      </div>
                      
                      {log.vendorName && (
                        <p className="text-sm text-muted-foreground">
                          Vendor: {log.vendorName}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(log.syncedAt).toLocaleDateString('ms-MY', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(log.driveWebViewLink, '_blank')}
                      data-testid={`button-view-drive-${log.id}`}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Buka di Drive
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {(!syncLogs || syncLogs.length === 0) && (
              <div className="text-center py-12">
                <Cloud className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Tiada dokumen di-sync lagi</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Dokumen akan auto-sync ke Google Drive selepas dijana
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
