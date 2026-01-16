import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

import Login from "./pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Roles from "./pages/Roles";
import Users from "./pages/Users";
import Categories from "./pages/Categories";
import Brands from "./pages/Brands";
import AdminLayout from "./components/layout/AdminLayout";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";
import Invoices from "./pages/Invoices";
import InvoiceView from "./pages/InvoiceView";
import Inventory from "./pages/Inventory";
import Quotations from "./pages/Quotations";
import ProductBatches from "./pages/Inventory/Batches";
import Payments from "./pages/Payments";
import NewPayment from "./pages/NewPayment";
import Settings from "./pages/Settings";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import Subscriptions from "./pages/Subscriptions";
import ProcessingFees from "./pages/ProcessingFees";
import AdvanceRequests from "./pages/AdvanceRequests";
import Profile from "./pages/Profile";

// Vehicle Tracking
import Vehicles from "./pages/Vehicles";
import Technicians from "./pages/Technicians";
import Jobs from "./pages/Jobs";
import Requisitions from "./pages/Requisitions";
import InspectionChecklist from "./pages/InspectionChecklist";

// Technician Views
import TechnicianJobs from "./pages/Technician/MyJobs";
import TechnicianActiveJob from "./pages/Technician/ActiveJob";
import TechnicianJobDetails from "./pages/Technician/JobDetails";
import TechnicianJobWork from "./pages/Technician/JobWork";
import JobWorkflow from "./pages/JobWorkflow";
import NotificationsPage from "./pages/Notifications";
import CustomerDetail from "./pages/CustomerDetail";
import MigrationUpload from "./pages/MigrationUpload";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  const isTechnician = user?.role === "TECHNICIAN";
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Redirect root based on role */}
      <Route
        path="/"
        element={
          isTechnician ? (
            <Navigate to="/technician/jobs" replace />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* Admin Routes */}
        {!isTechnician && (
          <>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="roles" element={<Roles />} />
            <Route path="products" element={<Products />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:customerId/detail" element={<CustomerDetail />} />
            <Route path="users" element={<Users />} />
            <Route path="categories" element={<Categories />} />
            <Route path="brands" element={<Brands />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="inventory/batches" element={<ProductBatches />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/:id" element={<InvoiceView />} />
            <Route path="payments" element={<Payments />} />
            <Route path="payments/new" element={<NewPayment />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="settings/*" element={<Settings />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="reports" element={<Reports />} />
            <Route path="processing-fees" element={<ProcessingFees />} />
            <Route path="advance-requests" element={<AdvanceRequests />} />
            <Route path="profile" element={<Profile />} />

            {/* Vehicle Tracking */}
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="technicians" element={<Technicians />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="requisitions" element={<Requisitions />} />
            <Route path="inspections" element={<InspectionChecklist />} />
            <Route path="jobs/:id/workflow" element={<JobWorkflow />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="migration-upload" element={<MigrationUpload />} />
          </>
        )}

        {/* Technician Routes */}
        {isTechnician && (
          <>
            <Route path="technician/jobs" element={<TechnicianJobs />} />

            {/* Read-only details page (works for completed/in-progress) */}
            <Route
              path="technician/jobs/:id"
              element={<TechnicianJobDetails />}
            />

            {/* Work page (tabs + mutations + start/continue) */}
            <Route
              path="technician/jobs/:id/work"
              element={<TechnicianJobWork />}
            />

            {/* Keep legacy route, but it should open WORK page using query param jobId */}
            <Route
              path="technician/active-job"
              element={<TechnicianActiveJob />}
            />

            <Route path="technician/profile" element={<Profile />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </>
        )}

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="electrobill-theme">
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
