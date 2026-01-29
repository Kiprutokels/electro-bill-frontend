import React from "react";
import { Button } from "@/components/ui/button";

interface PaginationFooterProps {
  totalItems: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  loading?: boolean;
  onPrev: () => void;
  onNext: () => void;
}

const PaginationFooter: React.FC<PaginationFooterProps> = ({
  totalItems,
  currentPage,
  totalPages,
  pageSize,
  loading = false,
  onPrev,
  onNext,
}) => {
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between pt-4 px-4 sm:px-0 gap-4">
      <p className="text-sm text-muted-foreground">
        Showing {from} to {to} of {totalItems} entries
      </p>

      {totalPages > 1 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={currentPage === 1 || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={currentPage === totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaginationFooter;
export { PaginationFooter };