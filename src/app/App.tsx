import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AppProvider } from "./lib/store";
import { Toaster } from "./components/ui/sonner";

import CustomerLayout from "./layouts/CustomerLayout";
import AdminLayout from "./layouts/AdminLayout";

import LoginPage from "./pages/customer/Login";
import RegisterPage from "./pages/customer/Register";
import ShopPage from "./pages/customer/Shop";
import ProductDetail from "./pages/customer/ProductDetail";
import CartPage from "./pages/customer/Cart";
import CheckoutPage from "./pages/customer/Checkout";
import MyOrders from "./pages/customer/MyOrders";
import TransactionsPage from "./pages/customer/Transactions";
import ReceiptsPage from "./pages/customer/Receipts";
import AccountPage from "./pages/customer/Account";

import AdminOverview from "./pages/admin/Overview";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminRefunds from "./pages/admin/AdminRefunds";
import AdminEvents from "./pages/admin/AdminEvents";
import SecurityOps from "./pages/admin/SecurityOps";
import AuditTrail from "./pages/admin/AuditTrail";
import AdminSettings from "./pages/admin/AdminSettings";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<CustomerLayout />}>
            <Route index element={<Navigate to="/shop" replace />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout/:orderId" element={<CheckoutPage />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/receipts" element={<ReceiptsPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="refunds" element={<AdminRefunds />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="security" element={<SecurityOps />} />
            <Route path="audit" element={<AuditTrail />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/shop" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AppProvider>
  );
}
