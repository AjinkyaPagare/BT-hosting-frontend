import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  MessageSquare,
  Users,
  Calendar as CalendarIcon,
  FolderOpen,
  UserPlus,
  Bell,
  Settings as SettingsIcon,
  User,
  Menu,
  X,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigation = [
  { name: "Chats", href: "/app/chats", icon: MessageSquare },
  { name: "Groups", href: "/app/groups", icon: Users },
  { name: "Calendar", href: "/app/calendar", icon: CalendarIcon },
  { name: "Files", href: "/app/files", icon: FolderOpen },
  { name: "Friends", href: "/app/friends", icon: UserPlus },
  { name: "Notifications", href: "/app/notifications", icon: Bell },
  { name: "Settings", href: "/app/settings", icon: SettingsIcon },
];

const AppLayout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsAuthenticated(!!token);
  }, [location]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex w-full bg-background min-h-screen md:h-screen md:overflow-hidden">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X /> : <Menu />}
      </Button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-56 md:w-20 transform bg-sidebar border-r border-sidebar-border transition-transform duration-200 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <MessageSquare className="h-5 w-5" />
              <span className="sr-only">Baap Teams</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className="flex items-center justify-start rounded-lg px-2 py-2 text-sidebar-foreground transition-colors border border-transparent hover:bg-primary/10"
                activeClassName="border-primary bg-primary/15 text-primary font-semibold shadow-sm"
                title={item.name}
                aria-label={item.name}
                end
              >
                <item.icon className="h-5 w-5" />
                <span className="sr-only">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Profile */}
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-2">
              <NavLink
                to="/app/profile"
                className="flex flex-1 items-center justify-center rounded-lg p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                title="Profile"
                aria-label="Profile"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">View profile</span>
              </NavLink>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
