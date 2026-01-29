import React, { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { customersService, CustomerSearchResult } from "@/api/services/customers.service";
import { toast } from "sonner";

interface CustomerSearchComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const CustomerSearchCombobox: React.FC<CustomerSearchComboboxProps> = ({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select customer...",
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<CustomerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);

  const searchCustomers = useCallback(async (query: string) => {
    if (!query || query.trim().length === 0) {
      setCustomers([]);
      return;
    }

    setLoading(true);
    try {
      const results = await customersService.searchCustomers(query, 20);
      setCustomers(results);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to search customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCustomers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchCustomers]);

  useEffect(() => {
    if (value && !selectedCustomer) {
      customersService.getCustomerById(value).then((customer) => {
        setSelectedCustomer({
          id: customer.id,
          customerCode: customer.customerCode,
          businessName: customer.businessName,
          contactPerson: customer.contactPerson,
          phone: customer.phone,
          email: customer.email,
        });
      }).catch(() => {
        // Silently fail
      });
    }
  }, [value, selectedCustomer]);

  const handleSelect = (customer: CustomerSearchResult) => {
    setSelectedCustomer(customer);
    onValueChange(customer.id);
    setOpen(false);
  };

  const displayValue = selectedCustomer
    ? `${selectedCustomer.businessName || selectedCustomer.contactPerson} (${selectedCustomer.customerCode})`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name, code, phone, email..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Searching...</span>
              </div>
            ) : searchQuery.length > 0 ? (
              "No customers found."
            ) : (
              "Start typing to search customers..."
            )}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {customers.map((customer) => (
              <CommandItem
                key={customer.id}
                value={customer.id}
                onSelect={() => handleSelect(customer)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === customer.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span className="font-medium">
                    {customer.businessName || customer.contactPerson}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {customer.customerCode} • {customer.phone}
                    {customer.email && ` • ${customer.email}`}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CustomerSearchCombobox;