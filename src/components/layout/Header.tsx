import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-card px-3 sm:px-4 lg:px-6 flex items-center justify-between">
      <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
        <SidebarTrigger className="lg:hidden" />
        {/* Page title will be added here later */}
      </div>
      
      <div className="flex items-center space-x-2 sm:space-x-4">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 sm:w-56">
            <DropdownMenuItem className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout} className="flex items-center space-x-2 text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};