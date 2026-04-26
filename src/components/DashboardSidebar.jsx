import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth.js";
import { LayoutDashboard, BarChart3, Package, ShoppingCart, Settings, Users, X } from "lucide-react";
import "./DashboardSidebar.css";

export default function DashboardSidebar({ isOpen, onClose }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth <= 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { path: "/analytics", label: "Analytics", icon: <BarChart3 size={20} /> },
    { path: "/products", label: "Products", icon: <Package size={20} /> },
    { path: "/orders", label: "Orders", icon: <ShoppingCart size={20} /> },
    { path: "/customers", label: "Customers", icon: <Users size={20} /> },
    { path: "/settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  const handleNavClick = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        className={`sidebar-overlay ${isOpen ? "visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar - FIXED position */}
      <aside className={`dashboard-sidebar ${isOpen ? "open" : ""}`} role="navigation">
        {/* Header */}
        <div className="sidebar-header">
          <h3>Dashboard</h3>
          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close menu"
            title="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav" role="menu">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`sidebar-nav-item ${pathname === item.path ? "active" : ""}`}
              onClick={() => handleNavClick(item.path)}
              title={item.label}
              role="menuitem"
              aria-current={pathname === item.path ? "page" : undefined}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={handleLogout} title="Logout">
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}
