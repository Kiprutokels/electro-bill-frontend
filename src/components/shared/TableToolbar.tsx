import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {title ? <div className="font-semibold">{title}</div> : <div />}

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {rightSlot}

        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="w-full sm:w-28">
            <SelectValue placeholder="Page size" />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>
    </div>
  );
};

export default TableToolbar;
export { TableToolbar };