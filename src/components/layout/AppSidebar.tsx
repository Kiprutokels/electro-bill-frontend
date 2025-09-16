import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  Shield,
  LogOut
} from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS, ROUTES } from '@/utils/constants';

const navigation = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard, permission: null },
  { name: 'Customers', href: ROUTES.CUSTOMERS, icon: Users, permission: PERMISSIONS.CUSTOMERS_READ },
  { name: 'Products', href: ROUTES.PRODUCTS, icon: Package, permission: PERMISSIONS.PRODUCTS_READ },
  { name: 'Inventory', href: ROUTES.INVENTORY, icon: Warehouse, permission: PERMISSIONS.INVENTORY_READ },
  { name: 'Quotations', href: ROUTES.QUOTATIONS, icon: FileText, permission: PERMISSIONS.SALES_READ },
  { name: 'Orders', href: ROUTES.INVOICES, icon: FileText, permission: PERMISSIONS.SALES_READ },
  { name: 'Payments', href: ROUTES.PAYMENTS, icon: CreditCard, permission: PERMISSIONS.PAYMENTS_READ },
  { name: 'Transactions', href: ROUTES.TRANSACTIONS, icon: Receipt, permission: PERMISSIONS.SALES_READ },
  { name: 'Users', href: '/users', icon: Users, permission: PERMISSIONS.USERS_READ },
  { name: 'Settings', href: ROUTES.SETTINGS, icon: Settings, permission: null },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { hasPermission, logout } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';
  const isMobile = useIsMobile();

  // Filter navigation based on user permissions
  const filteredNavigation = navigation.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" 
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  return (
    <Sidebar 
      className={`${collapsed ? "w-12" : "w-64"}`} 
      collapsible="icon" 
      variant="sidebar"
      side={isMobile ? "left" : "left"}
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={`flex items-center ${collapsed ? 'justify-center p-3' : 'space-x-3 p-4'}`}>
          <div className={`${collapsed ? 'p-1' : 'p-2'} bg-sidebar-primary rounded-lg flex-shrink-0`}>
            <Building2 className={`${collapsed ? 'h-4 w-4' : 'h-5 w-5 sm:h-6 sm:w-6'} text-sidebar-primary-foreground`} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-responsive-lg font-bold text-sidebar-foreground truncate">ElectroBill</h1>
              <p className="text-responsive-sm text-sidebar-foreground/70 truncate">Admin Panel</p>
            </div>
          )}
        </div>
        <div className={`flex pb-2 ${collapsed ? 'justify-center px-2' : 'justify-end px-4'}`}>
          <SidebarTrigger className="text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild className="w-full">
                    <NavLink 
                      to={item.href} 
                      className={getNavCls({ isActive: isActive(item.href) })}
                    >
                      <item.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      {!collapsed && <span className="truncate text-responsive-sm">{item.name}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={logout}
              className="w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              {!collapsed && <span className="truncate text-responsive-sm">Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
