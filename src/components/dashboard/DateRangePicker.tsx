import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { DashboardQueryDto } from "@/api/types/dashboard.types";

interface DateRangePickerProps {
  dateRange: DashboardQueryDto;
  onDateRangeChange: (dateRange: DashboardQueryDto) => void;
}

export const DateRangePicker = ({
  dateRange,
  onDateRangeChange,
}: DateRangePickerProps) => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: dateRange.startDate ? new Date(dateRange.startDate) : undefined,
    to: dateRange.endDate ? new Date(dateRange.endDate) : undefined,
  });

  const handleDateSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      const payload = {
        startDate: selectedDate.from
          ? format(selectedDate.from, "yyyy-MM-dd")
          : undefined,
        endDate: selectedDate.to
          ? format(selectedDate.to, "yyyy-MM-dd")
          : undefined,
      };

      console.log("📅 Raw selectedDate:", selectedDate);
      console.log("📦 Payload sent:", payload);

      onDateRangeChange(payload);
    }
  };

  const handlePresetSelect = (preset: string) => {
    const today = new Date();
    let startDate: Date;
    let endDate = today;

    switch (preset) {
      case "today":
        startDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        ); // midnight
        endDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          23,
          59,
          59,
          999
        ); // end of day
        break;
      case "yesterday":
        startDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        endDate = startDate;
        break;
      case "last7days":
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "last30days":
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "thisMonth":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "lastMonth":
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "thisYear":
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        return;
    }

    const newDateRange = { from: startDate, to: endDate };
    setDate(newDateRange);

    const payload = {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    };
    onDateRangeChange(payload);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Select onValueChange={handlePresetSelect}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Quick select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="last7days">Last 7 days</SelectItem>
          <SelectItem value="last30days">Last 30 days</SelectItem>
          <SelectItem value="thisMonth">This month</SelectItem>
          <SelectItem value="lastMonth">Last month</SelectItem>
          <SelectItem value="thisYear">This year</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className="w-full sm:w-80 justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
