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
import { getRoleName, isMenuItemAllowedForRole } from "@/utils/rbac";

type NavItem = {
  key: string;
  name: string;
  href: string;
  icon: any;
  permission?: string | null;
  section:
    | "main"
    | "sales"
    | "tracking"
    | "crm"
    | "support"
    | "manager"
    | "system"
    | "account";
};

const technicianNavigation: NavItem[] = [
  {
    key: "tech_my_jobs",
    name: "My Jobs",
    href: "/technician/jobs",
    icon: Briefcase,
    permission: PERMISSIONS.JOBS_READ,
    section: "main",
  },
  {
    key: "tech_active_job",
    name: "Active Job",
    href: "/technician/active-job",
    icon: Wrench,
    permission: PERMISSIONS.JOBS_UPDATE,
    section: "main",
  },
  {
    key: "tech_profile",
    name: "Profile",
    href: "/technician/profile",
    icon: Users,
    permission: null,
    section: "account",
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
];

const appNavigation: NavItem[] = [
  // Main
  {
    key: "dashboard",
    name: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    permission: null,
    section: "main",
  },

  // Sales & Inventory
  { key: "customers", name: "Customers", href: ROUTES.CUSTOMERS, icon: Users, permission: PERMISSIONS.CUSTOMERS_READ, section: "sales" },
  { key: "products", name: "Products", href: ROUTES.PRODUCTS, icon: Package, permission: PERMISSIONS.PRODUCTS_READ, section: "sales" },
  { key: "inventory", name: "Inventory", href: ROUTES.INVENTORY, icon: Warehouse, permission: PERMISSIONS.INVENTORY_READ, section: "sales" },
  { key: "quotations", name: "Quotations", href: ROUTES.QUOTATIONS, icon: FileText, permission: PERMISSIONS.SALES_READ, section: "sales" },
  { key: "invoices", name: "Invoices", href: ROUTES.INVOICES, icon: Receipt, permission: PERMISSIONS.SALES_READ, section: "sales" },
  { key: "payments", name: "Payments", href: ROUTES.PAYMENTS, icon: CreditCard, permission: PERMISSIONS.PAYMENTS_READ, section: "sales" },
  { key: "transactions", name: "Transactions", href: ROUTES.TRANSACTIONS, icon: Receipt, permission: PERMISSIONS.SALES_READ, section: "sales" },
  { key: "subscriptions", name: "Subscriptions", href: "/subscriptions", icon: CreditCard, permission: PERMISSIONS.SUBSCRIPTIONS_READ, section: "sales" },

  // Vehicle Tracking (ADMIN/MANAGER typically)
  { key: "vehicles", name: "Vehicles", href: "/vehicles", icon: Car, permission: PERMISSIONS.VEHICLES_READ, section: "tracking" },
  { key: "jobs", name: "Jobs", href: "/jobs", icon: Briefcase, permission: PERMISSIONS.JOBS_READ, section: "tracking" },
  { key: "technicians", name: "Technicians", href: "/technicians", icon: Wrench, permission: PERMISSIONS.TECHNICIANS_READ, section: "tracking" },
  { key: "requisitions", name: "Requisitions", href: "/requisitions", icon: PackageSearch, permission: null, section: "tracking" },
  { key: "advance_requests", name: "Advance Requests", href: "/advance-requests", icon: DollarSign, permission: null, section: "tracking" },
  { key: "inspections", name: "Inspections", href: "/inspections", icon: ClipboardCheck, permission: null, section: "tracking" },

  // CRM
  { key: "crm_dashboard", name: "CRM Dashboard", href: "/crm/dashboard", icon: ClipboardList, permission: PERMISSIONS.CRM_DASHBOARD_READ, section: "crm" },
  { key: "crm_my_portfolio", name: "My Portfolio", href: "/crm/my-subscriptions", icon: ClipboardList, permission: PERMISSIONS.SUBSCRIPTIONS_READ, section: "crm" },
  { key: "crm_followups", name: "Follow-ups", href: "/crm/followups", icon: ClipboardList, permission: PERMISSIONS.CRM_FOLLOWUPS_READ, section: "crm" },
  { key: "crm_interactions", name: "Interactions", href: "/crm/interactions", icon: PhoneCall, permission: PERMISSIONS.CRM_INTERACTIONS_READ, section: "crm" },
  { key: "crm_alerts", name: "CRM Alerts", href: "/crm/alerts", icon: ShieldAlert, permission: PERMISSIONS.CRM_ALERTS_READ, section: "crm" },

  // Support
  { key: "tickets", name: "Tickets", href: "/tickets", icon: Ticket, permission: PERMISSIONS.TICKETS_READ, section: "support" },
  { key: "feedback", name: "Feedback", href: "/feedback", icon: ShieldAlert, permission: PERMISSIONS.FEEDBACK_READ, section: "support" },

  // Manager
  { key: "manager_tools", name: "CRM Manager Tools", href: "/crm/manager-tools", icon: Users2, permission: PERMISSIONS.SUBSCRIPTIONS_UPDATE, section: "manager" },
  { key: "departments", name: "Departments", href: "/departments", icon: Users2, permission: PERMISSIONS.DEPARTMENTS_READ, section: "manager" },

  // System
  { key: "settings", name: "Settings", href: ROUTES.SETTINGS, icon: Settings, permission: null, section: "system" },
  { key: "processing_fees", name: "Processing Fees", href: "/processing-fees", icon: DollarSign, permission: PERMISSIONS.PROCESSING_FEES_READ, section: "system" },
  { key: "users", name: "Users", href: "/users", icon: Users, permission: PERMISSIONS.USERS_READ, section: "system" },
  { key: "migration_upload", name: "Migrations", href: "/migration-upload", icon: Upload, permission: PERMISSIONS.CUSTOMERS_CREATE, section: "system" },
  { key: "sms", name: "SMS Management", href: "/sms", icon: MessageSquare, permission: PERMISSIONS.SMS_READ, section: "system" },
  { key: "campaigns", name: "Campaigns", href: "/campaigns", icon: Megaphone, permission: PERMISSIONS.CAMPAIGNS_READ, section: "system" },
  { key: "my_profile", name: "My Profile", href: "/profile", icon: User, permission: null, section: "system" },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const { hasPermission, logout, user } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const isMobile = useIsMobile();

  const roleName = getRoleName(user);
  const isTechnician = roleName === "TECHNICIAN";

  const navigation = isTechnician ? technicianNavigation : appNavigation;

  // Filter navigation by role rules first, then permissions
  const filteredNavigation = navigation
    .filter((item) => isMenuItemAllowedForRole(roleName, item.key))
    .filter((item) => !item.permission || hasPermission(item.permission));

  const bySection = (section: NavItem["section"]) =>
    filteredNavigation.filter((i) => i.section === section);

  const mainItems = bySection("main");
  const salesItems = bySection("sales");
  const trackingItems = bySection("tracking");
  const managerItems = bySection("manager");
  const crmItems = bySection("crm");
  const supportItems = bySection("support");
  const systemItems = bySection("system");
  const accountItems = bySection("account");

  const isActive = (path: string) => currentPath === path;

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const renderMenuItems = (items: NavItem[]) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.key}>
          <SidebarMenuButton asChild className="w-full">
            <NavLink
              to={item.href}
              className={getNavCls({ isActive: isActive(item.href) })}
              onClick={handleNavClick}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="truncate text-xs">{item.name}</span>}
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
      side="left"
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={`flex items-center ${collapsed ? "justify-center p-2" : "space-x-2 p-3"}`}>
          <div className={`${collapsed ? "p-1.5" : "p-2"} bg-sidebar-primary rounded-lg flex-shrink-0`}>
            <Building2 className={`${collapsed ? "h-4 w-4" : "h-5 w-5"} text-sidebar-primary-foreground`} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-sidebar-foreground truncate">Automile</h1>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                {isTechnician ? "Field Portal" : "CRM + Operations"}
              </p>
            </div>
          )}
        </div>
        <div className={`flex pb-1.5 ${collapsed ? "justify-center px-2" : "justify-end px-3"}`}>
          <SidebarTrigger className="text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent" />
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        {mainItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
              {isTechnician ? "Jobs" : "Main"}
            </SidebarGroupLabel>
            <SidebarGroupContent>{renderMenuItems(mainItems)}</SidebarGroupContent>
          </SidebarGroup>
        )}

        {salesItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Sales & Inventory</SidebarGroupLabel>
            <SidebarGroupContent>{renderMenuItems(salesItems)}</SidebarGroupContent>
          </SidebarGroup>
        )}

        {trackingItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Vehicle Tracking</SidebarGroupLabel>
            <SidebarGroupContent>{renderMenuItems(trackingItems)}</SidebarGroupContent>
          </SidebarGroup>
        )}

        {crmItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>CRM</SidebarGroupLabel>
            <SidebarGroupContent>{renderMenuItems(crmItems)}</SidebarGroupContent>
          </SidebarGroup>
        )}

        {supportItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Support</SidebarGroupLabel>
            <SidebarGroupContent>{renderMenuItems(supportItems)}</SidebarGroupContent>
          </SidebarGroup>
        )}

        {managerItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Manager</SidebarGroupLabel>
            <SidebarGroupContent>{renderMenuItems(managerItems)}</SidebarGroupContent>
          </SidebarGroup>
        )}

        {systemItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>System</SidebarGroupLabel>
            <SidebarGroupContent>{renderMenuItems(systemItems)}</SidebarGroupContent>
          </SidebarGroup>
        )}

        {accountItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Account</SidebarGroupLabel>
            <SidebarGroupContent>{renderMenuItems(accountItems)}</SidebarGroupContent>
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