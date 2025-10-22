import { Variants } from "framer-motion";

// Page transition variants
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1], // Custom easing for smooth feel
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// Stagger children animation
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

// Fade in up for list items
export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// Scale tap animation (haptic-like feedback)
export const tapScale = {
  whileTap: { scale: 0.97 },
  transition: { duration: 0.1, ease: "easeInOut" },
};

// Card hover animation
export const cardHover = {
  whileHover: { 
    y: -2,
    transition: { duration: 0.2, ease: "easeOut" }
  },
  whileTap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  },
};

// Smooth scale in
export const scaleIn: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// Slide from right (for sidebar/drawer)
export const slideFromRight: Variants = {
  initial: {
    x: "100%",
  },
  animate: {
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    x: "100%",
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// Smooth spring animation
export const springConfig = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

// Shimmer effect keyframes (for skeletons)
export const shimmerVariants: Variants = {
  initial: {
    backgroundPosition: "-200% 0",
  },
  animate: {
    backgroundPosition: "200% 0",
    transition: {
      duration: 1.5,
      ease: "linear",
      repeat: Infinity,
    },
  },
};

// Button press feedback
export const buttonPress = {
  whileTap: { 
    scale: 0.96,
    transition: { 
      duration: 0.1,
      ease: "easeInOut" 
    }
  },
};

// Icon rotation on hover
export const iconRotate = {
  whileHover: { 
    rotate: 5,
    transition: { duration: 0.2 }
  },
};

// Smooth fade
export const fade: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  },
};
