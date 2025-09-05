import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  FileText, 
  Receipt, 
  Settings,
  Building2
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
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

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Receipts', href: '/receipts', icon: Receipt },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" 
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  return (
    <Sidebar className={collapsed ? "w-12" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={`flex items-center ${collapsed ? 'justify-center p-2' : 'space-x-3 p-4'}`}>
          <div className={`${collapsed ? 'p-1' : 'p-2'} bg-sidebar-primary rounded-lg flex-shrink-0`}>
            <Building2 className={`${collapsed ? 'h-4 w-4' : 'h-6 w-6'} text-sidebar-primary-foreground`} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-sidebar-foreground truncate">ElectroBill</h1>
              <p className="text-sm text-sidebar-foreground/70 truncate">Admin Panel</p>
            </div>
          )}
        </div>
        {!collapsed && <SidebarTrigger className="ml-auto mr-4 mb-2" />}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild className="w-full">
                    <NavLink 
                      to={item.href} 
                      className={getNavCls({ isActive: isActive(item.href) })}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.name}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}