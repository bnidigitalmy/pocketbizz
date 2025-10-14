import { useState, useRef, type ReactNode, type TouchEvent } from "react";
import { Trash2, Check, X } from "lucide-react";

export interface SwipeAction {
  type: "delete" | "confirm" | "reject" | "custom";
  label: string;
  icon?: ReactNode;
  color: "destructive" | "success" | "warning" | "secondary";
  onAction: () => void;
}

interface SwipeableItemProps {
  children: ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  threshold?: number;
  disabled?: boolean;
}

const colorClasses = {
  destructive: "bg-destructive text-destructive-foreground",
  success: "bg-green-500 text-white",
  warning: "bg-amber-500 text-white",
  secondary: "bg-secondary text-secondary-foreground",
};

export function SwipeableItem({
  children,
  leftAction,
  rightAction,
  threshold = 80,
  disabled = false,
}: SwipeableItemProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    setSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (disabled || !swiping) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Limit swipe distance
    const maxSwipe = 120;
    const limitedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    
    // Only allow left swipe if rightAction exists, right swipe if leftAction exists
    if (limitedDiff < 0 && rightAction) {
      setOffsetX(limitedDiff);
    } else if (limitedDiff > 0 && leftAction) {
      setOffsetX(limitedDiff);
    }
  };

  const handleTouchEnd = () => {
    if (disabled || !swiping) return;
    setSwiping(false);

    const swipeDistance = Math.abs(offsetX);
    
    if (swipeDistance >= threshold) {
      // Trigger action
      if (offsetX > 0 && leftAction) {
        leftAction.onAction();
      } else if (offsetX < 0 && rightAction) {
        rightAction.onAction();
      }
    }
    
    // Reset position
    setOffsetX(0);
  };

  const getActionIcon = (action?: SwipeAction) => {
    if (!action) return null;
    if (action.icon) return action.icon;
    
    switch (action.type) {
      case "delete":
        return <Trash2 className="h-5 w-5" />;
      case "confirm":
        return <Check className="h-5 w-5" />;
      case "reject":
        return <X className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const showLeftAction = offsetX > threshold * 0.3 && leftAction;
  const showRightAction = offsetX < -threshold * 0.3 && rightAction;

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden"
      data-testid="swipeable-container"
    >
      {/* Left action background */}
      {leftAction && (
        <div
          className={`absolute inset-y-0 left-0 flex items-center justify-start px-4 transition-opacity ${
            colorClasses[leftAction.color]
          } ${showLeftAction ? "opacity-100" : "opacity-0"}`}
          style={{ width: Math.max(0, offsetX) }}
        >
          <div className="flex items-center gap-2">
            {getActionIcon(leftAction)}
            <span className="text-sm font-medium">{leftAction.label}</span>
          </div>
        </div>
      )}

      {/* Right action background */}
      {rightAction && (
        <div
          className={`absolute inset-y-0 right-0 flex items-center justify-end px-4 transition-opacity ${
            colorClasses[rightAction.color]
          } ${showRightAction ? "opacity-100" : "opacity-0"}`}
          style={{ width: Math.max(0, -offsetX) }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{rightAction.label}</span>
            {getActionIcon(rightAction)}
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        className={`relative transition-transform ${
          swiping ? "duration-0" : "duration-300"
        }`}
        style={{
          transform: `translateX(${offsetX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid="swipeable-content"
      >
        {children}
      </div>
    </div>
  );
}
