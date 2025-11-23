import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { pageVariants } from "@/lib/motion";

interface MotionWrapperProps {
  children: React.ReactNode;
}

export function MotionWrapper({ children }: MotionWrapperProps) {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
