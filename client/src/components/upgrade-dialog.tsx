import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message?: string;
  currentPlan?: string;
  requiredPlan?: string;
}

export function UpgradeDialog({
  open,
  onOpenChange,
  title = "Premium Feature",
  message = "This feature requires a Pro or Premium plan.",
  currentPlan,
  requiredPlan = "pro",
}: UpgradeDialogProps) {
  const [, navigate] = useLocation();

  const handleUpgrade = () => {
    navigate("/pricing");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="dialog-upgrade">
        <AlertDialogHeader>
          <AlertDialogTitle data-testid="text-upgrade-title">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription data-testid="text-upgrade-message">
            {message}
            {currentPlan && (
              <div className="mt-2 text-sm">
                <span className="font-medium">Current Plan:</span>{" "}
                <span className="capitalize">{currentPlan}</span>
                <br />
                <span className="font-medium">Required Plan:</span>{" "}
                <span className="capitalize">{requiredPlan}</span>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-upgrade">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUpgrade}
            data-testid="button-upgrade"
          >
            Upgrade Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
