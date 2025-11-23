/**
 * PocketBizz Logo Component
 * Concept: Rocket launching from a pocket - "Business dalam poket yang boleh terbang tinggi"
 * Universal design suitable for all types of SME businesses
 */

interface PocketBizzLogoProps {
  className?: string;
  size?: number;
}

export function PocketBizzLogo({ className = "", size = 24 }: PocketBizzLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Pocket outline */}
      <path
        d="M4 8C4 6.89543 4.89543 6 6 6H18C19.1046 6 20 6.89543 20 8V18C20 19.6569 18.6569 21 17 21H7C5.34315 21 4 19.6569 4 18V8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Pocket opening line */}
      <path
        d="M4 9H20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* Rocket body - launching from pocket */}
      <path
        d="M12 3L14 8L12 9L10 8L12 3Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      
      {/* Rocket fins */}
      <path
        d="M10 7L9 8.5L10 8L10 7Z"
        fill="currentColor"
      />
      <path
        d="M14 7L15 8.5L14 8L14 7Z"
        fill="currentColor"
      />
      
      {/* Rocket flame/exhaust coming from pocket */}
      <path
        d="M12 9C11.5 10 11 11 11 12C11 11.5 11.5 11 12 11C12.5 11 13 11.5 13 12C13 11 12.5 10 12 9Z"
        fill="currentColor"
        opacity="0.6"
      />
      
      {/* Growth sparkles */}
      <circle cx="7" cy="15" r="0.5" fill="currentColor" opacity="0.7" />
      <circle cx="17" cy="13" r="0.5" fill="currentColor" opacity="0.7" />
      <circle cx="8" cy="18" r="0.5" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

/**
 * Simplified icon version for smaller sizes (favicon, mobile nav)
 */
export function PocketBizzIcon({ className = "", size = 24 }: PocketBizzLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Simplified rocket in pocket */}
      <rect
        x="5"
        y="8"
        width="14"
        height="13"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <line
        x1="5"
        y1="11"
        x2="19"
        y2="11"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 3L14.5 9L12 10.5L9.5 9L12 3Z"
        fill="currentColor"
      />
    </svg>
  );
}
