import { useState } from "react";

interface UpgradeInfo {
  message?: string;
  currentPlan?: string;
  requiredPlan?: string;
}

export function useUpgradePrompt() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo>({});

  const checkUpgradeError = (error: any) => {
    // Check if error response indicates upgrade required
    const errorData = error?.response?.data || error?.data || {};
    
    if (errorData.requiresUpgrade || error?.message?.includes("upgrade")) {
      setUpgradeInfo({
        message: errorData.message || error?.message || "This feature requires an upgrade.",
        currentPlan: errorData.currentPlan,
        requiredPlan: errorData.requiredPlan || "pro",
      });
      setShowUpgrade(true);
      return true; // Error is upgrade-related
    }
    
    return false; // Error is not upgrade-related
  };

  const closeUpgradePrompt = () => {
    setShowUpgrade(false);
    setUpgradeInfo({});
  };

  return {
    showUpgrade,
    upgradeInfo,
    checkUpgradeError,
    closeUpgradePrompt,
  };
}
