import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Settings, Shield, Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useNavigate } from "react-router-dom";
import NotificationBell from "@/components/notifications/NotificationBell";

export const Header = () => {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "destructive";
      case "manager":
        return "default";
      case "staff":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatRoleName = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  const isAdminOrManager =
    user?.role === "ADMIN" || user?.role === "MANAGER";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-muted/50 backdrop-blur supports-[backdrop-filter]:bg-muted/50">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Custom mobile sidebar trigger */}
          <Button
            variant="outline"
            size="icon"
            className="md:hidden h-9 w-9 bg-background border-border shadow-sm hover:bg-accent hover:text-foreground"
            onClick={toggleSidebar}
          >
            <Menu className="h-4 w-4 text-foreground" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
          {/* Page title could be added here later */}
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative rounded-full hover:bg-accent h-8 w-8"
                size="icon"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={undefined}
                    alt={`${user?.firstName} ${user?.lastName}`}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium leading-none truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    {user?.role && (
                      <Badge
                        variant={getRoleBadgeVariant(user.role)}
                        className="text-xs"
                      >
                        {formatRoleName(user.role)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                  {user?.username && (
                    <p className="text-xs text-muted-foreground truncate">
                      @{user.username}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleProfile}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <User className="h-4 w-4" />
                <span>Profile Settings</span>
              </DropdownMenuItem>

              {isAdminOrManager && (
                <DropdownMenuItem
                  onClick={() => navigate("/settings")}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                  <span>System Settings</span>
                </DropdownMenuItem>
              )}

              {user?.role === "ADMIN" && (
                <DropdownMenuItem
                  onClick={() => navigate("/roles")}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Shield className="h-4 w-4" />
                  <span>Role Management</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center space-x-2 text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};