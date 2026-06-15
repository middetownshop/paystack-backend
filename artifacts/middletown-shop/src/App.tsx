import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/useAuth";
import { DashboardLayout } from "./components/DashboardLayout";

import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AgentRegister from "@/pages/agent-register";
import Dashboard from "@/pages/Dashboard";
import Wallet from "@/pages/Wallet";
import Deposit from "@/pages/Deposit";
import Withdraw from "@/pages/Withdraw";
import Transactions from "@/pages/Transactions";
import Complaints from "@/pages/Complaints";
import AdminComplaints from "@/pages/admin-complaints";
import NewComplaint from "@/pages/NewComplaint";
import Shop from "@/pages/Shop";
import Bundles from "@/pages/Bundles";
import Orders from "@/pages/Orders";
import QuickSell from "@/pages/QuickSell";
import AgentPanel from "@/pages/AgentPanel";
import AdminPanel from "@/pages/AdminPanel";

const queryClient = new QueryClient();

/* ---------------- LOADING SCREEN ---------------- */
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen">
      Loading...
    </div>
  );
}

/* ---------------- AUTH ROUTE ---------------- */
function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) return <Redirect to="/dashboard" />;

  return <Component />;
}

/* ---------------- DASHBOARD + LAYOUT ROUTE ---------------- */
function DashboardRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;

  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

/* ---------------- ROUTER ---------------- */
function Router() {
  return (
    <Switch>
      {/* PUBLIC */}
      <Route path="/" component={() => <Redirect to="/login" />} />

      {/* AUTH */}
      <Route path="/login" component={() => <AuthRoute component={Login} />} />
      <Route path="/register" component={() => <AuthRoute component={Register} />} />
      <Route path="/agent-register" component={AgentRegister} />

      {/* DASHBOARD CORE */}
      <Route path="/dashboard/agent-register" component={() => <DashboardRoute component={AgentRegister} />} />
      <Route path="/dashboard" component={() => <DashboardRoute component={Dashboard} />} />
      <Route path="/dashboard/wallet" component={() => <DashboardRoute component={Wallet} />} />
      <Route path="/dashboard/deposit" component={() => <DashboardRoute component={Deposit} />} />
      <Route path="/dashboard/withdraw" component={() => <DashboardRoute component={Withdraw} />} />
      <Route path="/dashboard/transactions" component={() => <DashboardRoute component={Transactions} />} />
      <Route path="/dashboard/complaints" component={() => <DashboardRoute component={Complaints} />} />
      <Route path="/dashboard/complaints/new" component={() => <DashboardRoute component={NewComplaint} />} />
      <Route path="/dashboard/shop" component={() => <DashboardRoute component={Shop} />} />
      <Route path="/dashboard/bundles" component={() => <DashboardRoute component={Bundles} />} />
      <Route path="/dashboard/orders" component={() => <DashboardRoute component={Orders} />} />
      <Route path="/dashboard/quick-sell" component={() => <DashboardRoute component={QuickSell} />} />
      <Route path="/dashboard/agent" component={() => <DashboardRoute component={AgentPanel} />} />
      <Route path="/dashboard/admin" component={() => <DashboardRoute component={AdminPanel} />} />

      {/* ADMIN OUTSIDE DASHBOARD */}
      <Route path="/admin/complaints" component={() => <DashboardRoute component={AdminComplaints} />} />

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

/* ---------------- APP WRAPPER ---------------- */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Toaster />
            <Router />
          </WouterRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;