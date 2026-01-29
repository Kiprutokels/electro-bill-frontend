import React, { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown, Loader2, User, Phone, Mail } from "lucide-react";
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
  placeholder = "Search customer...",
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
    ? `${selectedCustomer.businessName || selectedCustomer.contactPerson}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-11 px-4 text-base font-medium transition-all duration-200",
            "hover:bg-slate-50 hover:border-slate-300 dark:hover:bg-slate-900 dark:hover:border-slate-600",
            open && "ring-2 ring-blue-500 ring-opacity-30 border-blue-500",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
        >
          <div className="flex items-center flex-1 min-w-0">
            <User className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
            <span className="truncate text-slate-900 dark:text-slate-100">
              {displayValue}
            </span>
            {selectedCustomer && (
              <span className="ml-2 text-sm text-slate-500 dark:text-slate-400 flex-shrink-0">
                ({selectedCustomer.customerCode})
              </span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50 transition-transform duration-200" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-screen max-w-2xl" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name, code, phone, email..."
            className="h-11 text-base"
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500 mb-3" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Searching customers...
                </span>
              </div>
            ) : searchQuery.length > 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <User className="h-5 w-5 text-slate-300 dark:text-slate-600 mb-3" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  No customers found
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Try searching with different keywords
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <User className="h-5 w-5 text-slate-300 dark:text-slate-600 mb-3" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Start typing to search
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Search by name, code, phone or email
                </p>
              </div>
            )}
          </CommandEmpty>
          <CommandGroup className="max-h-96 overflow-auto">
            {customers.map((customer) => (
              <CommandItem
                key={customer.id}
                value={customer.id}
                onSelect={() => handleSelect(customer)}
                className="px-4 py-4 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors duration-150 border-b border-slate-100 dark:border-slate-700 last:border-b-0"
              >
                <Check
                  className={cn(
                    "mr-4 h-5 w-5 flex-shrink-0 transition-all duration-200",
                    value === customer.id
                      ? "opacity-100 text-blue-600"
                      : "opacity-0"
                  )}
                />
                <div className="flex flex-1 items-center gap-6 min-w-0">
                  {/* Business Name & Code */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-base">
                      {customer.businessName || customer.contactPerson}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {customer.customerCode}
                    </p>
                  </div>

                  {/* Contact Info - Hidden on very small screens */}
                  <div className="flex-1 min-w-0 hidden sm:block">
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {customer.contactPerson}
                    </p>
                  </div>

                  {/* Phone - Always visible */}
                  {customer.phone && (
                    <div className="flex-1 min-w-0 hidden md:block">
                      <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{customer.phone}</span>
                      </p>
                    </div>
                  )}

                  {/* Email - Always visible */}
                  {customer.email && (
                    <div className="flex-1 min-w-0 hidden lg:block">
                      <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Mail className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </p>
                    </div>
                  )}
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