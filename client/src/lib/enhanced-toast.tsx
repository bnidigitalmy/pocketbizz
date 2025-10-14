import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { CheckCircle, AlertCircle, Info, AlertTriangle, Loader2 } from "lucide-react";

interface UndoableToastOptions {
  title: string;
  description?: string;
  onUndo: () => void;
  undoText?: string;
  duration?: number;
}

interface LoadingToastOptions {
  title: string;
  description?: string;
}

export const enhancedToast = {
  success: (title: string, description?: string) => {
    return toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span>{title}</span>
        </div>
      ),
      description,
      variant: "default",
    });
  },

  error: (title: string, description?: string) => {
    return toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{title}</span>
        </div>
      ),
      description,
      variant: "destructive",
    });
  },

  warning: (title: string, description?: string) => {
    return toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <span>{title}</span>
        </div>
      ),
      description,
    });
  },

  info: (title: string, description?: string) => {
    return toast({
      title: (
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          <span>{title}</span>
        </div>
      ),
      description,
    });
  },

  loading: (options: LoadingToastOptions) => {
    return toast({
      title: (
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{options.title}</span>
        </div>
      ),
      description: options.description,
      duration: 999999, // Keep loading toast visible
    });
  },

  undoable: (options: UndoableToastOptions) => {
    return toast({
      title: options.title,
      description: options.description,
      action: (
        <ToastAction
          altText={options.undoText || "Undo"}
          onClick={(e) => {
            e.preventDefault();
            options.onUndo();
          }}
        >
          {options.undoText || "Undo"}
        </ToastAction>
      ),
      duration: options.duration || 5000,
    });
  },

  withAction: (
    title: string,
    description: string,
    actionText: string,
    onAction: () => void
  ) => {
    return toast({
      title,
      description,
      action: (
        <ToastAction
          altText={actionText}
          onClick={(e) => {
            e.preventDefault();
            onAction();
          }}
        >
          {actionText}
        </ToastAction>
      ),
    });
  },
};
