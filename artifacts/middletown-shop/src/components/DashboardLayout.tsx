import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

import {
  LayoutDashboard,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  MessageSquareWarning,
  Users,
  ShieldAlert,
  LogOut,
  Bell,
  Store,
  ShoppingBag,
  Zap,
  Wifi,
  Menu,
  X,
} from "lucide-react";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, profile, signOut, loading } = useAuth();

  const [location, setLocation] = useLocation();
  const [time, setTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* REDIRECT IF NOT LOGGED IN */
  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  /* LIVE CLOCK */
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* LOADING */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="h-4 w-40 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  /* SAFE PROFILE (IMPORTANT FIX) */
  const safeProfile = profile ?? {
    name: "User",
    role: "user",
    walletBalance: 0,
  };

  const getGreeting = () => {
    const h = time.getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const getTimeToMidnight = () => {
    const midnight = new Date(time);
    midnight.setHours(24, 0, 0, 0);

    const diff = midnight.getTime() - time.getTime();

    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);

    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/shop", label: "Shop Products", icon: Store },
    { href: "/dashboard/bundles", label: "Data Bundles", icon: Wifi },
    { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
    { href: "/dashboard/quick-sell", label: "Quick Sell", icon: Zap },
    { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
    { href: "/dashboard/deposit", label: "Deposit", icon: ArrowDownToLine },
    { href: "/dashboard/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
    { href: "/dashboard/transactions", label: "Transactions", icon: History },
  ];

  if (safeProfile.role !== "admin") {
    navItems.push(
      {
        href: "/dashboard/complaints/new",
        label: "Submit Complaint",
        icon: MessageSquareWarning,
      },
      {
        href: "/dashboard/complaints",
        label: "My Complaints",
        icon: MessageSquareWarning,
      }
    );
  }

  if (
    safeProfile.role !== "agent" &&
    safeProfile.role !== "admin"
  ) {
    navItems.push({
      href: "/dashboard/agent-register",
      label: "Become Agent",
      icon: Users,
    });
  }

  if (
    safeProfile.role === "agent" ||
    safeProfile.role === "admin"
  ) {
    navItems.push({
      href: "/dashboard/agent",
      label: "Agent Panel",
      icon: Users,
    });
  }

  if (safeProfile.role === "admin") {
    navItems.push(
      {
        href: "/dashboard/admin",
        label: "Admin Panel",
        icon: ShieldAlert,
      },
      {
        href: "/admin/complaints",
        label: "User Complaints",
        icon: MessageSquareWarning,
      }
    );
  }

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = location === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }`}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="font-bold text-foreground">
            MiddletownShop
          </div>
        </div>

        <div className="hidden md:block text-sm text-muted-foreground">
          {getGreeting()}, {safeProfile.name}
        </div>

        <Button variant="ghost" size="icon">
          <Bell className="w-4 h-4" />
        </Button>
      </header>

      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar text-sidebar-foreground flex flex-col p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="font-bold text-sidebar-foreground">
                {safeProfile.name}
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex flex-col gap-1 flex-1">
              {navItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </nav>

            <button
              onClick={signOut}
              className="mt-6 flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 transition-colors rounded-lg hover:bg-sidebar-accent"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </aside>
        </div>
      )}

      <div className="flex pt-16">
        {/* DESKTOP SIDEBAR */}
        <aside className="w-64 hidden md:flex flex-col fixed top-16 bottom-0 left-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border overflow-y-auto">
          <div className="p-4 flex-1">
            <div className="mb-5 px-3">
              <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-1">
                Account
              </p>
              <p className="text-sm font-semibold text-sidebar-foreground">
                {safeProfile.name}
              </p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">
                {safeProfile.role}
              </p>
            </div>

            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </nav>
          </div>

          <div className="p-4 border-t border-sidebar-border">
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-2 w-full text-sm text-red-400 hover:text-red-300 transition-colors rounded-lg hover:bg-sidebar-accent"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 md:ml-64 p-4 md:p-6 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
