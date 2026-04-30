import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Menu, X, ShoppingBag } from "lucide-react";
import "./Sidebar.css";

export default function Sidebar({
  variant = "customer",
  items = [],
  activeItem = null,
  onItemClick = () => {},
  userEmail = "",
  onLogout = () => {},
  onReturnShopping = () => {},
  onViewStore = () => {},
  badgeCount = 0,
  showBranding = false,
}) {
  const [isOpen, setIsOpen] = useState(false);

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

  const handleItemClick = (id) => {
    onItemClick(id);
    setIsOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setIsOpen(false);
  };

  const userInitial = (userEmail || "U")[0].toUpperCase();

  return (
    <>
      {}
      <div
        className={`sidebar-overlay ${isOpen ? "visible" : ""}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {}
      <aside
        className={`sidebar sidebar--${variant} ${isOpen ? "open" : ""}`}
        role="navigation"
      >
        {}
        <div className="sidebar__header">
          {variant === "customer" || showBranding ? (
            <>
              <div>
                <p className="sidebar__brand-subtitle">Nuestras</p>
                <p className="sidebar__brand-title">Artesanías</p>
                <p className="sidebar__brand-label">{variant === "customer" ? "Customer Portal" : "Admin Dashboard"}</p>
              </div>
            </>
          ) : (
            <>
              <h3 className="sidebar__title">Dashboard</h3>
            </>
          )}
          <button
            className="sidebar__close"
            onClick={() => setIsOpen(false)}
            aria-label="Close sidebar"
            title="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {}
        {(variant === "customer" || showBranding) && (
          <div className="sidebar__profile">
            <div className="sidebar__avatar">{userInitial}</div>
            <div className="sidebar__user-info">
              <p className="sidebar__user-email">{userEmail || (variant === "customer" ? "Customer" : "Admin")}</p>
              <p className="sidebar__user-role">{variant === "customer" ? "Customer Account" : "Admin Access"}</p>
            </div>
          </div>
        )}

        {}
        <nav className="sidebar__nav" role="menu">
          {items.map(({ id, icon: Icon, label }) => {
            const isActive = activeItem === id;
            return (
              <button
                key={id}
                className={`sidebar__nav-item ${isActive ? "active" : ""}`}
                onClick={() => handleItemClick(id)}
                title={label}
                role="menuitem"
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="sidebar__nav-label">{label}</span>
                {id === items[0]?.id && badgeCount > 0 && (
                  <span className="sidebar__badge">{badgeCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        {}
        <div className="sidebar__footer">
          {variant === "customer" && (
            <button
              className="sidebar__continue-shopping"
              onClick={onReturnShopping}
              title="Continue Shopping"
            >
              <ShoppingBag size={14} />
              Continue Shopping
            </button>
          )}
          {variant === "admin" && (
            <button
              className="sidebar__view-store"
              onClick={onViewStore}
              title="View Store"
            >
              <ShoppingBag size={14} />
              View Store
            </button>
          )}
          <button
            className="sidebar__logout"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {}
      {!isOpen && (
        <button
          className="sidebar__toggle"
          onClick={() => setIsOpen(true)}
          aria-label="Open sidebar"
          title="Menu"
        >
          <Menu size={20} />
        </button>
      )}
    </>
  );
}