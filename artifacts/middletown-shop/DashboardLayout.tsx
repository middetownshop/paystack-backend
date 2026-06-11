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

  /* REDIRECT */
  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  /* CLOCK */
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* LOADING */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  /* SAFE PROFILE */
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden"
          >
            <Menu />
          </button>

          <div className="font-bold">
            MiddletownShop
          </div>
        </div>

        <div className="hidden md:block">
          {getGreeting()}, {safeProfile.name}
        </div>

        <Button variant="ghost">
          <Bell />
        </Button>
      </header>

      <div className="flex pt-16">
        {/* SIDEBAR */}
        <aside className="w-72 hidden md:block border-r bg-white p-4">
          <div className="mb-4 font-bold">
            {safeProfile.name}
          </div>

          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 p-2 rounded hover:bg-gray-100"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}

          <button
            onClick={signOut}
            className="mt-6 text-red-500"
          >
            Logout
          </button>
        </aside>

        {/* MAIN */}
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}