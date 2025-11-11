import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface QuickAction {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  color?: "default" | "destructive" | "secondary";
}

interface QuickActionsFabProps {
  actions: QuickAction[];
  mainIcon?: ReactNode;
  mainLabel?: string;
}

export function QuickActionsFab({
  actions,
  mainIcon = <Plus className="h-6 w-6" />,
  mainLabel = "Quick Actions",
}: QuickActionsFabProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (actions.length === 0) return null;

  const handleActionClick = (action: QuickAction) => {
    action.onClick();
    setIsOpen(false);
  };

  return (
    // Hide on mobile (lg:hidden) - mobile uses bottom nav Quick Add instead
    <div className="hidden lg:block fixed bottom-6 right-6 z-50 md:bottom-8 md:right-8">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-20 right-0 flex flex-col gap-3 z-50"
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant={action.color || "secondary"}
                  size="default"
                  onClick={() => handleActionClick(action)}
                  className="shadow-lg gap-2 min-w-[160px] justify-start"
                  data-testid={`fab-action-${action.id}`}
                >
                  {action.icon}
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full shadow-xl hover:shadow-2xl transition-shadow relative z-50"
        data-testid="fab-main-button"
        aria-label={mainLabel}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X className="h-6 w-6" /> : mainIcon}
        </motion.div>
      </Button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
            data-testid="fab-backdrop"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
