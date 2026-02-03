import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  Receipt,
  Settings,
  Building2,
  Warehouse,
  CreditCard,
  LogOut,
  BarChart3,
  Car,
  Wrench,
  ClipboardCheck,
  Briefcase,
  PackageSearch,
  DollarSign,
  User,
  Upload,
  MessageSquare,
  ClipboardList,
  Megaphone,
  PhoneCall,
  ShieldAlert,
  Ticket,
  Users2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS, ROUTES } from "@/utils/constants";

const adminNavigation = [
  {
    name: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    permission: null,
    section: "main",
  },

  // Sales & Inventory Section
  {
    name: "Customers",
    href: ROUTES.CUSTOMERS,
    icon: Users,
    permission: PERMISSIONS.CUSTOMERS_READ,
    section: "sales",
  },
  {
    name: "Products",
    href: ROUTES.PRODUCTS,
    icon: Package,
    permission: PERMISSIONS.PRODUCTS_READ,
    section: "sales",
  },
  {
    name: "Inventory",
    href: ROUTES.INVENTORY,
    icon: Warehouse,
    permission: PERMISSIONS.INVENTORY_READ,
    section: "sales",
  },
  {
    name: "Quotations",
    href: ROUTES.QUOTATIONS,
    icon: FileText,
    permission: PERMISSIONS.SALES_READ,
    section: "sales",
  },
  {
    name: "Invoices",
    href: ROUTES.INVOICES,
    icon: Receipt,
    permission: PERMISSIONS.SALES_READ,
    section: "sales",
  },
  {
    name: "Payments",
    href: ROUTES.PAYMENTS,
    icon: CreditCard,
    permission: PERMISSIONS.PAYMENTS_READ,
    section: "sales",
  },
  {
    name: "Transactions",
    href: ROUTES.TRANSACTIONS,
    icon: Receipt,
    permission: PERMISSIONS.SALES_READ,
    section: "sales",
  },

  // Vehicle Tracking Section
  {
    name: "Vehicles",
    href: "/vehicles",
    icon: Car,
    permission: PERMISSIONS.VEHICLES_READ,
    section: "tracking",
  },
  {
    name: "Jobs/Tickets",
    href: "/jobs",
    icon: Briefcase,
    permission: PERMISSIONS.JOBS_READ,
    section: "tracking",
  },
  {
    name: "Technicians",
    href: "/technicians",
    icon: Wrench,
    permission: PERMISSIONS.TECHNICIANS_READ,
    section: "tracking",
  },
  {
    name: "Requisitions",
    href: "/requisitions",
    icon: PackageSearch,
    permission: null,
    section: "tracking",
  },
  {
    name: "Advance Requests",
    href: "/advance-requests",
    icon: DollarSign,
    permission: null,
    section: "tracking",
  },
  {
    name: "Inspections",
    href: "/inspections",
    icon: ClipboardCheck,
    permission: null,
    section: "tracking",
  },
  {
    name: "Subscriptions",
    href: "/subscriptions",
    icon: CreditCard,
    permission: PERMISSIONS.SUBSCRIPTIONS_READ,
    section: "system",
  },
  {
    name: "Processing Fees",
    href: "/processing-fees",
    icon: DollarSign,
    permission: PERMISSIONS.PROCESSING_FEES_READ,
    section: "system",
  },

  // System Section
  // {
  //   name: "Reports",
  //   href: ROUTES.REPORTS,
  //   icon: BarChart3,
  //   permission: PERMISSIONS.REPORTS_VIEW,
  //   section: "system",
  // },
  {
    name: "Users",
    href: "/users",
    icon: Users,
    permission: PERMISSIONS.USERS_READ,
    section: "system",
  },
  {
    name: "Settings",
    href: ROUTES.SETTINGS,
    icon: Settings,
    permission: null,
    section: "system",
  },
  {
    name: "My Profile",
    href: "/profile",
    icon: User,
    permission: null,
    section: "system",
  },
  {
    name: "Migrations",
    href: "/migration-upload",
    icon: Upload,
    section: "system",
    permission: PERMISSIONS.CUSTOMERS_CREATE,
  },
  {
    name: "SMS Management",
    icon: MessageSquare,
    href: "/sms",
    section: "system",
    permission: PERMISSIONS.SMS_READ,
  },
  {
  name: "CRM Dashboard",
  href: "/crm/dashboard",
  icon: ClipboardList,
  permission: PERMISSIONS.CRM_DASHBOARD_READ,
  section: "system",
},
{
  name: "Follow-ups",
  href: "/crm/followups",
  icon: ClipboardList,
  permission: PERMISSIONS.CRM_FOLLOWUPS_READ,
  section: "system",
},
{
  name: "Interactions",
  href: "/crm/interactions",
  icon: PhoneCall,
  permission: PERMISSIONS.CRM_INTERACTIONS_READ,
  section: "system",
},
{
  name: "CRM Alerts",
  href: "/crm/alerts",
  icon: ShieldAlert,
  permission: PERMISSIONS.CRM_ALERTS_READ,
  section: "system",
},
{
  name: "Tickets",
  href: "/tickets",
  icon: Ticket,
  permission: PERMISSIONS.TICKETS_READ,
  section: "system",
},
{
  name: "Feedback",
  href: "/feedback",
  icon: ShieldAlert,
  permission: PERMISSIONS.FEEDBACK_READ,
  section: "system",
},
{
  name: "Campaigns",
  href: "/campaigns",
  icon: Megaphone,
  permission: PERMISSIONS.CAMPAIGNS_READ,
  section: "system",
},
{
  name: "Departments",
  href: "/departments",
  icon: Users2,
  permission: PERMISSIONS.DEPARTMENTS_READ,
  section: "system",
},
{
  name: "My Subscriptions",
  href: "/crm/my-subscriptions",
  icon: ClipboardList,
  permission: PERMISSIONS.SUBSCRIPTIONS_READ,
  section: "system",
},
{
  name: "CRM Manager Tools",
  href: "/crm/manager-tools",
  icon: Users2,
  permission: PERMISSIONS.SUBSCRIPTIONS_UPDATE,
  section: "system",
},
];

// Technician-specific navigation
const technicianNavigation = [
  {
    name: "My Jobs",
    href: "/technician/jobs",
    icon: Briefcase,
    permission: PERMISSIONS.JOBS_READ,
    section: "main",
  },
  {
    name: "Active Job",
    href: "/technician/active-job",
    icon: Wrench,
    permission: PERMISSIONS.JOBS_UPDATE,
    section: "main",
  },
  // {
  //   name: "Requisitions",
  //   href: "/technician/requisitions",
  //   icon: PackageSearch,
  //   permission: null,
  //   section: "field",
  // },
  // {
  //   name: "Inspections",
  //   href: "/technician/inspections",
  //   icon: ClipboardCheck,
  //   permission: null,
  //   section: "field",
  // },
  // {
  //   name: "Vehicles",
  //   href: "/technician/vehicles",
  //   icon: Car,
  //   permission: PERMISSIONS.VEHICLES_CREATE,
  //   section: "field",
  // },
  // {
  //   name: "Location Check-In",
  //   href: "/technician/location",
  //   icon: MapPin,
  //   permission: null,
  //   section: "field",
  // },
  {
    name: "Profile",
    href: "/technician/profile",
    icon: Users,
    permission: null,
    section: "account",
  },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const { hasPermission, logout, user } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const isMobile = useIsMobile();

  // Determine if user is technician
  const isTechnician = user?.role === "TECHNICIAN";

  // Select navigation based on role
  const navigation = isTechnician ? technicianNavigation : adminNavigation;

  // Filter navigation based on user permissions
  const filteredNavigation = navigation.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  // Group navigation by section
  const mainItems = filteredNavigation.filter(
    (item) => item.section === "main",
  );
  const salesItems = filteredNavigation.filter(
    (item) => item.section === "sales",
  );
  const trackingItems = filteredNavigation.filter(
    (item) => item.section === "tracking",
  );
  const fieldItems = filteredNavigation.filter(
    (item) => item.section === "field",
  );
  const systemItems = filteredNavigation.filter(
    (item) => item.section === "system",
  );
  const accountItems = filteredNavigation.filter(
    (item) => item.section === "account",
  );

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  const handleNavClick = () => {
    // Close mobile sidebar when navigation item is clicked
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const renderMenuItems = (items: typeof navigation) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.name}>
          <SidebarMenuButton asChild className="w-full">
            <NavLink
              to={item.href}
              className={getNavCls({ isActive: isActive(item.href) })}
              onClick={handleNavClick}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && (
                <span className="truncate text-xs">{item.name}</span>
              )}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar
      className={`${collapsed ? "w-12" : "w-56"}`}
      collapsible="icon"
      variant="sidebar"
      side={isMobile ? "left" : "left"}
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <div
          className={`flex items-center ${
            collapsed ? "justify-center p-2" : "space-x-2 p-3"
          }`}
        >
          <div
            className={`${
              collapsed ? "p-1.5" : "p-2"
            } bg-sidebar-primary rounded-lg flex-shrink-0`}
          >
            <Building2
              className={`${
                collapsed ? "h-4 w-4" : "h-5 w-5"
              } text-sidebar-primary-foreground`}
            />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-sidebar-foreground truncate">
                Automile
              </h1>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                {isTechnician ? "Field Portal" : "Tracking System"}
              </p>
            </div>
          )}
        </div>
        <div
          className={`flex pb-1.5 ${
            collapsed ? "justify-center px-2" : "justify-end px-3"
          }`}
        >
          <SidebarTrigger className="text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent" />
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        {/* Main Navigation */}
        {mainItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
              {isTechnician ? "Jobs" : "Main"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {renderMenuItems(mainItems)}
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Sales & Inventory (Admin only) */}
        {salesItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
              Sales & Inventory
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {renderMenuItems(salesItems)}
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Vehicle Tracking (Admin only) */}
        {trackingItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
              Vehicle Tracking
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {renderMenuItems(trackingItems)}
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Field Operations (Technician only) */}
        {fieldItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
              Field Operations
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {renderMenuItems(fieldItems)}
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* System (Admin only) */}
        {systemItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
              System
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {renderMenuItems(systemItems)}
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Account (Technician only) */}
        {accountItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
              Account
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {renderMenuItems(accountItems)}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className="w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="truncate text-xs">Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
