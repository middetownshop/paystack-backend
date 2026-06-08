import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";

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

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect to="/login" />;
  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Redirect to="/dashboard" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/login" />} />

      <Route path="/login" component={() => <AuthRoute component={Login} />} />
      <Route path="/register" component={() => <AuthRoute component={Register} />} />
      <Route path="/agent-register" component={AgentRegister} />

      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/dashboard/wallet" component={() => <ProtectedRoute component={Wallet} />} />
      <Route path="/dashboard/deposit" component={() => <ProtectedRoute component={Deposit} />} />
      <Route path="/dashboard/withdraw" component={() => <ProtectedRoute component={Withdraw} />} />
      <Route path="/dashboard/transactions" component={() => <ProtectedRoute component={Transactions} />} />
      <Route path="/dashboard/complaints" component={() => <ProtectedRoute component={Complaints} />} />
      <Route path="/dashboard/complaints/new" component={() => <ProtectedRoute component={NewComplaint} />} />
      <Route path="/admin/complaints" component={() => <ProtectedRoute component={AdminComplaints} />} />
      <Route path="/dashboard/shop" component={() => <ProtectedRoute component={Shop} />} />
      <Route path="/dashboard/bundles" component={() => <ProtectedRoute component={Bundles} />} />
      <Route path="/dashboard/orders" component={() => <ProtectedRoute component={Orders} />} />
      <Route path="/dashboard/quick-sell" component={() => <ProtectedRoute component={QuickSell} />} />
      <Route path="/dashboard/agent" component={() => <ProtectedRoute component={AgentPanel} />} />
      <Route path="/dashboard/agent-register" component={() => <ProtectedRoute component={AgentRegister} />} />
      <Route path="/dashboard/admin" component={() => <ProtectedRoute component={AdminPanel} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
            <Toaster />
          </WouterRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
