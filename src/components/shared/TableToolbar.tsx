import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type PageSizeOption = { label: string; value: number };

interface TableToolbarProps {
  title?: string;
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (v: string) => void;
  pageSize: number;
  pageSizeOptions: PageSizeOption[];
  onPageSizeChange: (v: number) => void;
  refreshing?: boolean;
  onRefresh: () => void;
  rightSlot?: React.ReactNode;
}

const TableToolbar: React.FC<TableToolbarProps> = ({
  title,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  refreshing = false,
  onRefresh,
  rightSlot,
}) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const currentPageSizeLabel = pageSizeOptions.find(
    (opt) => opt.value === pageSize
  )?.label;

  return (
    <div className="w-full">
      {/* Main Toolbar Row */}
      <div className="flex items-center justify-between gap-3 px-0">
        {/* Left Section: Title - Hidden on Mobile */}
        <div className="hidden sm:block min-w-fit">
          {title ? (
            <h2 className="font-semibold text-sm md:text-base whitespace-nowrap">
              {title}
            </h2>
          ) : (
            <div />
          )}
        </div>

        {/* Center Section: Search */}
        <div className="flex-1 min-w-0">
          <div className="relative transition-all duration-200">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none flex-shrink-0" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchExpanded(true)}
              onBlur={() => {
                if (!searchValue) setIsSearchExpanded(false);
              }}
              className="pl-10 w-full text-sm"
            />
          </div>
        </div>

        {/* Right Slot - Hidden on Small/Medium screens */}
        {rightSlot && (
          <div className="hidden lg:flex flex-shrink-0">
            {rightSlot}
          </div>
        )}

        {/* Page Size Selector - Desktop Version */}
        <div className="hidden sm:block flex-shrink-0">
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger className="w-24 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page Size Selector - Mobile Dropdown Version */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="sm:hidden h-9 px-2 text-xs flex-shrink-0"
            >
              {currentPageSizeLabel && <span className="mr-1">{currentPageSizeLabel}</span>}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            {pageSizeOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => onPageSizeChange(opt.value)}
                className={`cursor-pointer ${pageSize === opt.value ? "bg-accent" : ""}`}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Refresh Button - Always visible */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
          className="h-9 px-2 flex-shrink-0"
          title="Refresh"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* Mobile Title Section - Below toolbar on mobile */}
      {title && (
        <div className="block sm:hidden mt-4 px-0">
          <h2 className="font-semibold text-sm">{title}</h2>
        </div>
      )}

      {/* Mobile Right Slot - Below toolbar on smaller screens */}
      {rightSlot && (
        <div className="lg:hidden mt-4">
          {rightSlot}
        </div>
      )}
    </div>
  );
};

export default TableToolbar;
export { TableToolbar };