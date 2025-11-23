import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Shortcut {
  key: string;
  description: string;
  global?: boolean;
}

const shortcuts: Shortcut[] = [
  { key: "⌘ K / Ctrl K", description: "Buka Carian Global", global: true },
  { key: "?", description: "Tunjuk Bantuan Keyboard", global: true },
  { key: "N", description: "Tambah Item Baharu (dalam page)", global: false },
  { key: "F", description: "Fokus pada Filter/Search", global: false },
  { key: "E", description: "Export/Download Data", global: false },
  { key: "Esc", description: "Tutup Dialog/Modal", global: true },
  { key: "←/→", description: "Navigate dalam Table/List", global: false },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Show help dialog with ?
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Don't trigger if user is typing in an input
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
          return;
        }
        e.preventDefault();
        setOpen((open) => !open);
      }

      // ESC to close
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl" data-testid="keyboard-shortcuts-dialog">
        <DialogHeader>
          <DialogTitle>Pintasan Papan Kekunci</DialogTitle>
          <DialogDescription>
            Gunakan pintasan ini untuk navigasi yang lebih pantas
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
              Pintasan Global
            </h4>
            <div className="space-y-2">
              {shortcuts
                .filter((s) => s.global)
                .map((shortcut, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-md hover-elevate"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {shortcut.key}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
              Pintasan Page-Specific
            </h4>
            <div className="space-y-2">
              {shortcuts
                .filter((s) => !s.global)
                .map((shortcut, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-md hover-elevate"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {shortcut.key}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              💡 Tip: Tekan <Badge variant="outline" className="font-mono text-xs mx-1">?</Badge> pada bila-bila masa untuk tunjuk bantuan ini
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for page-specific shortcuts
export function useKeyboardShortcuts({
  onNew,
  onFilter,
  onExport,
}: {
  onNew?: () => void;
  onFilter?: () => void;
  onExport?: () => void;
}) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Don't trigger if user is typing
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      // N for New
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && onNew) {
        e.preventDefault();
        onNew();
      }

      // F for Filter
      if (e.key === "f" && !e.metaKey && !e.ctrlKey && onFilter) {
        e.preventDefault();
        onFilter();
      }

      // E for Export
      if (e.key === "e" && !e.metaKey && !e.ctrlKey && onExport) {
        e.preventDefault();
        onExport();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onNew, onFilter, onExport]);
}
