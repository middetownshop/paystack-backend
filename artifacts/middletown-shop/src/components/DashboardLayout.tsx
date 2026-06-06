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
  Sparkles,
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

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  /* =====================================================
     REDIRECT IF NOT LOGGED IN
  ===================================================== */

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  /* =====================================================
     LIVE CLOCK
  ===================================================== */

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>

          <div className="h-4 w-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  /* =====================================================
     GREETING
  ===================================================== */

  const getGreeting = () => {
    const h = time.getHours();

    if (h < 12) return "Good morning";

    if (h < 18) return "Good afternoon";

    return "Good evening";
  };

  /* =====================================================
     RESET TIMER
  ===================================================== */

  const getTimeToMidnight = () => {
    const midnight = new Date(time);

    midnight.setHours(24, 0, 0, 0);

    const diff =
      midnight.getTime() - time.getTime();

    const hours = Math.floor(diff / 3600000);

    const mins = Math.floor(
      (diff % 3600000) / 60000
    );

    const secs = Math.floor(
      (diff % 60000) / 1000
    );

    return `${hours
      .toString()
      .padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },

    {
      href: "/dashboard/shop",
      label: "Shop Products",
      icon: Store,
    },

    {
      href: "/dashboard/bundles",
      label: "Data Bundles",
      icon: Wifi,
    },

    {
      href: "/dashboard/orders",
      label: "Orders",
      icon: ShoppingBag,
    },

    {
      href: "/dashboard/quick-sell",
      label: "Quick Sell",
      icon: Zap,
    },

    {
      href: "/dashboard/wallet",
      label: "Wallet",
      icon: Wallet,
    },

    {
      href: "/dashboard/deposit",
      label: "Deposit",
      icon: ArrowDownToLine,
    },

    {
      href: "/dashboard/withdraw",
      label: "Withdraw",
      icon: ArrowUpFromLine,
    },

    {
      href: "/dashboard/transactions",
      label: "Transactions",
      icon: History,
    },
  ];

  /* =====================================================
     USER COMPLAINTS
  ===================================================== */

  if (profile.role !== "admin") {
    navItems.push({
      href: "/dashboard/complaints/new",
      label: "Submit Complaint",
      icon: MessageSquareWarning,
    });

    navItems.push({
      href: "/dashboard/complaints",
      label: "My Complaints",
      icon: MessageSquareWarning,
    });
  }

  /* =====================================================
     BECOME AGENT
  ===================================================== */

  if (
    profile.role !== "agent" &&
    profile.role !== "admin"
  ) {
    navItems.push({
      href: "/dashboard/agent-register",
      label: "Become Agent",
      icon: Users,
    });
  }

  /* =====================================================
     AGENT PANEL
  ===================================================== */

  if (
    profile.role === "agent" ||
    profile.role === "admin"
  ) {
    navItems.push({
      href: "/dashboard/agent",
      label: "Agent Panel",
      icon: Users,
    });
  }

  /* =====================================================
     ADMIN PANEL
  ===================================================== */

  if (profile.role === "admin") {
    navItems.push({
      href: "/dashboard/admin",
      label: "Admin Panel",
      icon: ShieldAlert,
    });

    navItems.push({
      href: "/admin/complaints",
      label: "User Complaints",
      icon: MessageSquareWarning,
    });
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-black">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 md:px-6 shadow-sm">

        {/* LEFT */}
        <div className="flex items-center gap-3">

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="h-6 w-6 text-black" />
          </button>

          {/* LOGO */}
          <div className="flex flex-col">
            <span className="font-black text-sm md:text-lg tracking-wide">
              <span className="text-red-600">
                Middle
              </span>

              <span className="text-yellow-500">
                Town
              </span>

              <span className="text-black">
                Shop
              </span>
            </span>

            <span className="text-[10px] sm:hidden text-gray-600">
              {getGreeting()}, {profile.name}
            </span>
          </div>
        </div>

        {/* CENTER */}
        <div className="hidden md:flex flex-col">
          <span className="text-sm font-medium">
            {getGreeting()},

            <span className="text-red-600 ml-1">
              {profile.name}
            </span>
          </span>

          <span className="text-xs text-gray-500">
            {profile.role?.toUpperCase()}
          </span>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 md:gap-4">

          {/* DATE */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] md:text-xs text-gray-500">
              {format(time, "EEE MMM d yyyy")}
            </span>

            <span className="text-[11px] md:text-sm font-semibold text-black">
              {format(time, "HH:mm:ss")}
            </span>
          </div>

          {/* RESET TIMER */}
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-[10px] text-gray-500">
              Reset Timer
            </span>

            <span className="text-xs font-bold text-yellow-600">
              {getTimeToMidnight()}
            </span>
          </div>

          {/* BELL */}
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-red-50"
          >
            <Bell className="h-5 w-5 text-red-600" />
          </Button>
        </div>
      </header>

      <div className="flex pt-16">

        {/* MOBILE OVERLAY */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() =>
              setSidebarOpen(false)
            }
          />
        )}

        {/* =====================================================
            SIDEBAR
        ===================================================== */}

        <aside
          className={`
            fixed top-0 left-0 z-50 h-screen w-72 bg-white border-r border-gray-200
            transform transition-transform duration-300 overflow-y-auto
            ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full"
            }
            md:translate-x-0 md:top-16 md:h-[calc(100vh-64px)]
          `}
        >

          {/* MOBILE CLOSE */}
          <div className="md:hidden flex items-center justify-between px-4 h-16 border-b">
            <span className="font-bold text-lg">
              Menu
            </span>

            <button
              onClick={() =>
                setSidebarOpen(false)
              }
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* PROFILE */}
          <div className="px-5 py-5 border-b border-gray-100">

            <div className="bg-black text-white rounded-2xl p-4 shadow-lg">

              <p className="text-xs text-gray-300">
                Logged in as
              </p>

              <h2 className="font-bold text-lg mt-1">
                {profile.name}
              </h2>

              <div className="mt-2 inline-flex px-2 py-1 rounded-md bg-red-600 text-xs font-medium">
                {profile.role?.toUpperCase()}
              </div>

              {/* WALLET */}
              <div className="mt-4 bg-red-600 rounded-xl p-3">

                <p className="text-[11px] uppercase tracking-wide text-red-100">
                  Wallet Balance
                </p>

                <h3 className="text-2xl font-black text-white mt-1">
                  GHS{" "}
                  {profile.walletBalance?.toFixed(
                    2
                  ) || "0.00"}
                </h3>
              </div>
            </div>
          </div>

          {/* =====================================================
              NAVIGATION
          ===================================================== */}

          <nav className="p-4 space-y-1">

            {navItems.map((item) => {
              const active =
                location === item.href ||
                (item.href !== "/dashboard" &&
                  location.startsWith(
                    item.href
                  ));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setSidebarOpen(false)
                  }
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all
                    ${
                      active
                        ? "bg-gradient-to-r from-red-600 to-yellow-500 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />

                  <span className="font-medium">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* PREMIUM CARD */}
          <div className="px-4 mt-4">

            <div className="rounded-2xl bg-gradient-to-br from-yellow-100 to-red-100 p-4 border border-yellow-200">

              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-red-600" />

                <span className="font-semibold text-sm">
                  Premium Tools
                </span>
              </div>

              <p className="text-xs text-gray-600 mt-2">
                Manage your products,
                bundles and sales easily.
              </p>

              <button className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-sm font-medium">
                Upgrade Plan
              </button>
            </div>
          </div>

          {/* LOGOUT */}
          <div className="p-4 mt-6 border-t">

            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="h-5 w-5" />

              <span className="font-medium">
                Sign Out
              </span>
            </button>
          </div>
        </aside>

        {/* =====================================================
            MAIN CONTENT
        ===================================================== */}

        <main className="flex-1 md:ml-72 p-3 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* =====================================================
          MOBILE BOTTOM NAV
      ===================================================== */}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 h-16 flex items-center justify-around">

        {navItems.slice(0, 5).map((item) => {
          const active =
            location === item.href ||
            (item.href !== "/dashboard" &&
              location.startsWith(
                item.href
              ));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center text-[10px] ${
                active
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              <item.icon className="h-5 w-5 mb-1" />

              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}