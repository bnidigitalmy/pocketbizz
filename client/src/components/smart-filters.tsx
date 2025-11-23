import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, X, ChevronDown } from "lucide-react";

export interface FilterOption {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface FilterConfig {
  type: "select" | "range" | "date" | "text";
  label: string;
  key: string;
  options?: FilterOption[];
  placeholder?: string;
}

interface SmartFiltersProps {
  quickFilters?: FilterOption[];
  advancedFilters?: FilterConfig[];
  activeFilters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
  onClearAll?: () => void;
}

export function SmartFilters({
  quickFilters = [],
  advancedFilters = [],
  activeFilters,
  onFilterChange,
  onClearAll,
}: SmartFiltersProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<Record<string, any>>({});

  const activeCount = Object.values(activeFilters).filter(Boolean).length;

  const handleQuickFilter = (filterId: string) => {
    const newFilters = { ...activeFilters };
    if (newFilters[filterId]) {
      delete newFilters[filterId];
    } else {
      newFilters[filterId] = true;
    }
    onFilterChange(newFilters);
  };

  const handleAdvancedApply = () => {
    onFilterChange({ ...activeFilters, ...tempFilters });
    setAdvancedOpen(false);
    setTempFilters({});
  };

  const handleClearAll = () => {
    onFilterChange({});
    setTempFilters({});
    onClearAll?.();
  };

  const renderAdvancedFilter = (config: FilterConfig) => {
    switch (config.type) {
      case "select":
        return (
          <Select
            value={tempFilters[config.key] || activeFilters[config.key] || ""}
            onValueChange={(value) =>
              setTempFilters({ ...tempFilters, [config.key]: value })
            }
          >
            <SelectTrigger data-testid={`select-filter-${config.key}`}>
              <SelectValue placeholder={config.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {config.options?.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "range":
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={tempFilters[`${config.key}Min`] || activeFilters[`${config.key}Min`] || ""}
              onChange={(e) =>
                setTempFilters({
                  ...tempFilters,
                  [`${config.key}Min`]: e.target.value,
                })
              }
              data-testid={`input-filter-${config.key}-min`}
            />
            <Input
              type="number"
              placeholder="Max"
              value={tempFilters[`${config.key}Max`] || activeFilters[`${config.key}Max`] || ""}
              onChange={(e) =>
                setTempFilters({
                  ...tempFilters,
                  [`${config.key}Max`]: e.target.value,
                })
              }
              data-testid={`input-filter-${config.key}-max`}
            />
          </div>
        );

      case "date":
        return (
          <div className="flex gap-2">
            <Input
              type="date"
              value={tempFilters[`${config.key}From`] || activeFilters[`${config.key}From`] || ""}
              onChange={(e) =>
                setTempFilters({
                  ...tempFilters,
                  [`${config.key}From`]: e.target.value,
                })
              }
              data-testid={`input-filter-${config.key}-from`}
            />
            <Input
              type="date"
              value={tempFilters[`${config.key}To`] || activeFilters[`${config.key}To`] || ""}
              onChange={(e) =>
                setTempFilters({
                  ...tempFilters,
                  [`${config.key}To`]: e.target.value,
                })
              }
              data-testid={`input-filter-${config.key}-to`}
            />
          </div>
        );

      case "text":
        return (
          <Input
            type="text"
            placeholder={config.placeholder}
            value={tempFilters[config.key] || activeFilters[config.key] || ""}
            onChange={(e) =>
              setTempFilters({ ...tempFilters, [config.key]: e.target.value })
            }
            data-testid={`input-filter-${config.key}`}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Quick Filters */}
      {quickFilters.map((filter) => (
        <Badge
          key={filter.id}
          variant={activeFilters[filter.id] ? "default" : "outline"}
          className="cursor-pointer hover-elevate active-elevate-2"
          onClick={() => handleQuickFilter(filter.id)}
          data-testid={`badge-quick-filter-${filter.id}`}
        >
          {filter.icon && <span className="mr-1">{filter.icon}</span>}
          {filter.label}
          {activeFilters[filter.id] && <X className="ml-1 h-3 w-3" />}
        </Badge>
      ))}

      {/* Advanced Filters */}
      {advancedFilters.length > 0 && (
        <Popover open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              data-testid="button-advanced-filters"
            >
              <Filter className="h-4 w-4" />
              Advanced
              {activeCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                  {activeCount}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="font-medium">Advanced Filters</div>
              {advancedFilters.map((config) => (
                <div key={config.key} className="space-y-2">
                  <Label>{config.label}</Label>
                  {renderAdvancedFilter(config)}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleAdvancedApply}
                  className="flex-1"
                  data-testid="button-apply-filters"
                >
                  Apply
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTempFilters({});
                    setAdvancedOpen(false);
                  }}
                  data-testid="button-cancel-filters"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Clear All */}
      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="gap-1"
          data-testid="button-clear-filters"
        >
          <X className="h-3 w-3" />
          Clear All
        </Button>
      )}
    </div>
  );
}
