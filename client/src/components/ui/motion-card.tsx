import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cardHover } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface MotionCardProps extends React.ComponentProps<typeof Card> {
  enableHover?: boolean;
}

export function MotionCard({ 
  enableHover = true, 
  className, 
  children, 
  ...props 
}: MotionCardProps) {
  const hoverProps = enableHover ? cardHover : {};

  return (
    <motion.div
      {...hoverProps}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className={className} {...props}>
        {children}
      </Card>
    </motion.div>
  );
}
