import { useEffect, useMemo, useState, type ComponentType, type SVGProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
 
type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;
 
type FilterValue = "unread" | "read";
 
interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  leadingIcon?: IconComponent;
  selectedFilter?: FilterValue | null;
  onFilterChange?: (value: FilterValue | null) => void;
  className?: string;
}
 
export function Search({
  value,
  onChange,
  placeholder = "Search...",
  leadingIcon: LeadingIcon,
  selectedFilter,
  onFilterChange,
  className,
}: SearchProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [internalFilter, setInternalFilter] = useState<FilterValue | null>(null);
 
  const isPanelVisible = isHovered || isFocused;
 
  const activeFilter = useMemo(() => {
    return selectedFilter !== undefined ? selectedFilter : internalFilter;
  }, [selectedFilter, internalFilter]);
 
  const handleFilterSelect = (value: FilterValue) => {
    const nextValue = activeFilter === value ? null : value;
    if (onFilterChange) {
      onFilterChange(nextValue);
    } else {
      setInternalFilter(nextValue);
    }
    setIsHovered(false);
    setIsFocused(false);
  };
 
  useEffect(() => {
      if (!value) return; // avoid empty calls
 
      fetch(`http://127.0.0.1:8000/search?q=${encodeURIComponent(value)}`)
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error(error));
 
         fetch(`http://127.0.0.1:8000/docs#/Search/search_groups_search_groups_get=${encodeURIComponent(value)}`)
    .then(response => response.json())
    .then(data => console.log("Users API:", data))
    .catch(error => console.error("Users API Error:", error));
    }, [value]);
 
  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {LeadingIcon && (
        <LeadingIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <Input
        placeholder={placeholder}
        className={cn("pr-10", LeadingIcon && "pl-9")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
     
      />
      <div
        className={cn(
          "absolute left-0 right-0 top-full z-20 mt-2 rounded-md border bg-popover text-popover-foreground shadow-md transition-all duration-150",
          isPanelVisible ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0",
        )}
      >
        <div className="flex gap-2 px-3 py-2">
          {(["unread", "read"] as FilterValue[]).map((value) => {
            const isActive = activeFilter === value;
            const label = value === "unread" ? "Unread" : "Read";
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleFilterSelect(value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/60 hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}