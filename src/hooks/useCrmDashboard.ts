import { useQuery } from "@tanstack/react-query";
import { crmDashboardService } from "@/api/services/crm-dashboard.service";

export const useCrmDashboard = (windowDays = 14) => {
  const my = useQuery({
    queryKey: ["crm-dashboard-my", windowDays],
    queryFn: () => crmDashboardService.my(windowDays),
  });

  const manager = useQuery({
    queryKey: ["crm-dashboard-manager", windowDays],
    queryFn: () => crmDashboardService.manager(windowDays),
  });

  return { my, manager };
};
