import { motion } from "framer-motion";
import { Button, ButtonProps } from "@/components/ui/button";
import { buttonPress } from "@/lib/motion";
import { forwardRef } from "react";

export const MotionButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => {
    return (
      <motion.div {...buttonPress} className="inline-block">
        <Button ref={ref} {...props}>
          {children}
        </Button>
      </motion.div>
    );
  }
);

MotionButton.displayName = "MotionButton";
