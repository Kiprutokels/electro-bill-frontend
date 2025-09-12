import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
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
import Inventory from "./pages/Inventory";
import Quotations from "./pages/Quotations";
import ProductBatches from "./pages/Inventory/Batches";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="electrobill-theme">
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="roles" element={<Roles />} />
                <Route path="products" element={<Products />} />
                <Route path="customers" element={<Customers />} />
                <Route path="users" element={<Users />} />
                <Route path="categories" element={<Categories />} />
                <Route path="brands" element={<Brands />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="inventory/batches" element={<ProductBatches />} />
                <Route path="quotations" element={<Quotations />} />
                <Route path="invoices" element={<Invoices />} />
                <Route
                  path="payments"
                  element={
                    <div className="p-8 text-center text-muted-foreground">
                      Payments - Coming Soon
                    </div>
                  }
                />
                <Route
                  path="transactions"
                  element={
                    <div className="p-8 text-center text-muted-foreground">
                      Transactions - Coming Soon
                    </div>
                  }
                />
                <Route
                  path="settings/*"
                  element={
                    <div className="p-8 text-center text-muted-foreground">
                      Settings - Coming Soon
                    </div>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;