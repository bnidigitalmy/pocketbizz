import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonShimmerProps {
  className?: string;
}

export function SkeletonShimmer({ className }: SkeletonShimmerProps) {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{
          translateX: ["-100%", "100%"],
        }}
        transition={{
          duration: 1.5,
          ease: "linear",
          repeat: Infinity,
        }}
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
        }}
      />
    </motion.div>
  );
}

// Common skeleton components with shimmer
export function SkeletonCard() {
  return (
    <div className="space-y-3">
      <SkeletonShimmer className="h-32 w-full" />
      <SkeletonShimmer className="h-4 w-3/4" />
      <SkeletonShimmer className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-2">
      <SkeletonShimmer className="h-12 w-full" />
      <SkeletonShimmer className="h-16 w-full" />
      <SkeletonShimmer className="h-16 w-full" />
      <SkeletonShimmer className="h-16 w-full" />
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <SkeletonShimmer className="h-4 w-24" />
        <SkeletonShimmer className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <SkeletonShimmer className="h-4 w-24" />
        <SkeletonShimmer className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <SkeletonShimmer className="h-4 w-24" />
        <SkeletonShimmer className="h-24 w-full" />
      </div>
      <SkeletonShimmer className="h-10 w-32" />
    </div>
  );
}
