import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AppProvider } from "./lib/store";
import { Toaster } from "./components/ui/sonner";
import { Forbidden, RequireAuth, RequireAdmin } from "./components/Guards";

import CustomerLayout from "./layouts/CustomerLayout";
import AdminLayout from "./layouts/AdminLayout";

import LoginPage from "./pages/customer/Login";
import RegisterPage from "./pages/customer/Register";
import Shop from "./pages/customer/Shop";
import ProductDetail from "./pages/customer/ProductDetail";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import MyOrders from "./pages/customer/MyOrders";
import RefundRequests from "./pages/customer/RefundRequests";
import Account from "./pages/customer/Account";

import Overview from "./pages/admin/Overview";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminRefunds from "./pages/admin/AdminRefunds";
import AdminEvents from "./pages/admin/AdminEvents";
import SecurityOps from "./pages/admin/SecurityOps";
import AuditTrail from "./pages/admin/AuditTrail";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("App error:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <pre
          style={{
            margin: 16,
            padding: 12,
            background: "#fef2f2",
            color: "#991b1b",
            borderRadius: 8,
            whiteSpace: "pre-wrap",
            fontSize: 12,
          }}
        >
          {String(this.state.error.stack ?? this.state.error.message)}
        </pre>
      );
    }
    return this.props.children;
  }
}

export default function Root() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forbidden" element={<Forbidden />} />

            <Route element={<CustomerLayout />}>
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route
                path="/checkout/:orderId"
                element={
                  <RequireAuth>
                    <Checkout />
                  </RequireAuth>
                }
              />
              <Route
                path="/orders"
                element={
                  <RequireAuth>
                    <MyOrders />
                  </RequireAuth>
                }
              />
              <Route
                path="/refund-requests"
                element={
                  <RequireAuth>
                    <RefundRequests />
                  </RequireAuth>
                }
              />
              <Route path="/transactions" element={<Navigate to="/orders" replace />} />
              <Route path="/receipts" element={<Navigate to="/orders" replace />} />
              <Route
                path="/account"
                element={
                  <RequireAuth>
                    <Account />
                  </RequireAuth>
                }
              />
            </Route>

            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<Overview />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="transactions" element={<AdminTransactions />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="refunds" element={<AdminRefunds />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="security" element={<SecurityOps />} />
              <Route path="audit" element={<AuditTrail />} />
            </Route>

            <Route path="*" element={<Navigate to="/shop" replace />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
