import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth.js";
import Sidebar from "./Sidebar.jsx";
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  Settings,
} from "lucide-react";
import "./DashboardLayout.css";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Determine active sidebar item based on current path
  const getActiveItem = () => {
    if (pathname === "/dashboard") return "dashboard";
    if (pathname === "/analytics") return "analytics";
    if (pathname === "/products") return "products";
    if (pathname === "/orders") return "orders";
    if (pathname === "/customers") return "customers";
    if (pathname === "/settings") return "settings";
    return "dashboard";
  };

  const handleNavClick = (itemId) => {
    const paths = {
      dashboard: "/dashboard",
      analytics: "/analytics",
      products: "/products",
      orders: "/orders",
      customers: "/customers",
      settings: "/settings",
    };
    navigate(paths[itemId]);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const handleViewStore = () => {
    navigate("/", { replace: true });
  };

  const sidebarItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "orders", icon: ShoppingCart, label: "Orders" },
    { id: "customers", icon: Users, label: "Customers" },
    { id: "products", icon: Package, label: "Products" },
    { id: "analytics", icon: TrendingUp, label: "Analytics" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="dashboard-container dashboard-container--admin">
      {/* Fixed Sidebar */}
      <Sidebar
        variant="admin"
        items={sidebarItems}
        activeItem={getActiveItem()}
        onItemClick={handleNavClick}
        userEmail={user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}
        onLogout={handleLogout}
        onViewStore={handleViewStore}
        showBranding={true}
      />

      {/* Main Content Area */}
      <main className="dashboard-main dashboard-main--admin">
        {/* Page Content */}
        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
