import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

import { DashboardLayout } from "@/components/DashboardLayout";

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
import AgentRegister from "@/pages/agent-register";

const queryClient = new QueryClient();

const pay = async () => {
  const res = await fetch("http://localhost:5000/api/paystack/initialize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "test@gmail.com",
      amount: 1000,
    }),
  });

  const data = await res.json();

  // THIS IS THE MOST IMPORTANT LINE
  window.location.href = data.data.authorization_url;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>

            {/* Redirect */}
            <Route
              path="/"
              component={() => <Redirect to="/login" />}
            />

            {/* Auth Pages */}
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/agent-register" component={AgentRegister} />
            
            {/* Dashboard */}
            <Route
              path="/dashboard"
              component={() => (
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              )}
            />

            {/* Wallet */}
            <Route
              path="/dashboard/wallet"
              component={() => (
                <DashboardLayout>
                  <Wallet />
                </DashboardLayout>
              )}
            />

            {/* Deposit */}
            <Route
              path="/dashboard/deposit"
              component={() => (
                <DashboardLayout>
                  <Deposit />
                </DashboardLayout>
              )}
            />

            {/* Withdraw */}
            <Route
              path="/dashboard/withdraw"
              component={() => (
                <DashboardLayout>
                  <Withdraw />
                </DashboardLayout>
              )}
            />

            {/* Transactions */}
            <Route
              path="/dashboard/transactions"
              component={() => (
                <DashboardLayout>
                  <Transactions />
                </DashboardLayout>
              )}
            />

            {/* Complaints */}
            <Route
              path="/dashboard/complaints"
              component={() => (
                <DashboardLayout>
                  <Complaints />
                </DashboardLayout>
              )}
            />

            {/* New Complaint */}
            <Route
              path="/dashboard/complaints/new"
              component={() => (
                <DashboardLayout>
                  <NewComplaint />
                </DashboardLayout>
              )}
            />

            {/* Admin Complaints */}
            <Route
              path="/admin/complaints"
              component={() => (
                <DashboardLayout>
                  <AdminComplaints />
                </DashboardLayout>
              )}
            />

            {/* Shop Products */}
            <Route
              path="/dashboard/shop"
              component={() => (
                <DashboardLayout>
                  <Shop />
                </DashboardLayout>
              )}
            />

            {/* Data Bundles */}
            <Route
              path="/dashboard/bundles"
              component={() => (
                <DashboardLayout>
                  <Bundles />
                </DashboardLayout>
              )}
            />

            {/* Orders */}
            <Route
              path="/dashboard/orders"
              component={() => (
                <DashboardLayout>
                  <Orders />
                </DashboardLayout>
              )}
            />

            {/* Quick Sell */}
            <Route
              path="/dashboard/quick-sell"
              component={() => (
                <DashboardLayout>
                  <QuickSell />
                </DashboardLayout>
              )}
            />

            {/* Agent Panel */}
            <Route
              path="/dashboard/agent"
              component={() => (
                <DashboardLayout>
                  <AgentPanel />
                </DashboardLayout>
              )}
            />

            {/* Agent Register */}
            <Route
              path="/dashboard/agent-register"
              component={() => (
                <DashboardLayout>
                  <AgentRegister />
                </DashboardLayout>
              )}
            />
            
            {/* Admin Panel */}
            <Route
              path="/dashboard/admin"
              component={() => (
                <DashboardLayout>
                  <AdminPanel />
                </DashboardLayout>
              )}
            />

            {/* 404 */}
            <Route component={NotFound} />

          </Switch>

          <Toaster />
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;