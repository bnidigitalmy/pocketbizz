/**
 * PocketBizz Logo Component
 * Uses the official PocketBizz brand logo with turquoise gradient
 */

interface PocketBizzLogoProps {
  className?: string;
  size?: number;
}

export function PocketBizzLogo({ className = "", size = 120 }: PocketBizzLogoProps) {
  return (
    <img 
      src="/pocketbizz-logo.png" 
      alt="PocketBizz"
      style={{ height: size }}
      className={className}
    />
  );
}

/**
 * Simplified icon version for smaller sizes (favicon, mobile nav, sidebar)
 */
export function PocketBizzIcon({ className = "", size = 24 }: PocketBizzLogoProps) {
  return (
    <img 
      src="/pocketbizz-logo-icon.png" 
      alt="PocketBizz"
      style={{ width: size, height: size }}
      className={className}
    />
  );
}
