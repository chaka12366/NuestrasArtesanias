import { useState, useEffect, useCallback } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../src/contexts/auth.js";
import { useCart } from "../src/contexts/CartContext.jsx";
import { getStoreSettings, getStoreSettingsSync } from "../src/utils/storeSettingsCache.js";
import { fetchCategories } from "../src/lib/products.js";
import "./Navbar.css";
import logo from "../src/assets/logo.png";
import { User, Key, Sparkles, ShoppingCart, Menu, X } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropTimeout, setDropTimeout] = useState(null);
  const [categories, setCategories] = useState([]);

  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  const [store, setStore] = useState(() => getStoreSettingsSync());

  useEffect(() => {
    setMenuOpen(false);
    setDropOpen(false);
    if (dropTimeout) clearTimeout(dropTimeout);
  }, [location]);

  useEffect(() => {
    getStoreSettings()
      .then(data => {
        if (data) setStore(data);
      })
      .catch(err => console.error("Failed to fetch store settings:", err));

    fetchCategories()
      .then(data => {
        if (data && data.length > 0) {
          setCategories(data);
        }
      })
      .catch(err => console.error("Failed to fetch categories:", err));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (dropTimeout) clearTimeout(dropTimeout);
    };
  }, [dropTimeout]);

  useEffect(() => {
    if (menuOpen && window.innerWidth <= 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [menuOpen]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/", { replace: true });
    setMenuOpen(false);
  }, [logout, navigate]);

  const handleLogin = useCallback(() => {
    navigate("/login");
    setMenuOpen(false);
  }, [navigate]);

  const handleDropEnter = useCallback(() => {
    if (dropTimeout) clearTimeout(dropTimeout);
    setDropOpen(true);
  }, [dropTimeout]);

  const handleDropLeave = useCallback(() => {
    const timeout = setTimeout(() => setDropOpen(false), 200);
    setDropTimeout(timeout);
  }, []);

  const productLinks = categories.map(c => ({
    to: `/${c.slug}`,
    label: c.name
  }));

  return (
    <>
      <header className={`navbar-header ${scrolled ? "scrolled" : ""}`}>

      <div className="navbar-topbar">
        <span>
          <Sparkles size={16} style={{display:'inline',marginRight:4,verticalAlign:'text-top'}} /> Welcome to {store.name} — {store.tagline}
        </span>
      </div>

      <nav className="navbar-nav">

        <button
          className={`hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          title="Menu"
        >
          <span />
          <span />
          <span />
        </button>

        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-circle">
            <img src={logo} alt={store.name} />
          </div>
          <span className="navbar-brand-text">{store.name}</span>
        </Link>

        <ul className="navbar-links">

          <li>
            <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>
              Home
            </NavLink>
          </li>

          <li
            className="has-dropdown"
            onMouseEnter={handleDropEnter}
            onMouseLeave={handleDropLeave}
          >
            <button
              className="dropdown-trigger"
              onClick={() => setDropOpen(!dropOpen)}
              aria-expanded={dropOpen}
            >
              Products <span className="chevron" style={{fontSize: '1.0em', marginLeft: '3px'}}>{dropOpen ? "▲" : "▼"}</span>
            </button>

            <div
              className={`dropdown-menu ${dropOpen ? "open" : ""}`}
            >
              {productLinks.map(l => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) => isActive ? "active" : ""}
                  onClick={() => setDropOpen(false)}
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </li>

          <li>
            <NavLink to="/about" className={({ isActive }) => isActive ? "active" : ""}>
              About Us
            </NavLink>
          </li>

          <li>
            <NavLink to="/contact" className={({ isActive }) => isActive ? "active" : ""}>
              Contact
            </NavLink>
          </li>

        </ul>

        <div className="navbar-right">
          <button
            className="auth-icon-btn cart-icon"
            onClick={() => navigate("/cart")}
            aria-label={`View shopping cart with ${itemCount} items`}
            title="Cart"
            style={{ position: "relative" }}
          >
            <ShoppingCart size={20} />{itemCount > 0 && (
              <span className="cart-nav-badge" aria-live="polite">{itemCount > 99 ? "99+" : itemCount}</span>
            )}
          </button>

          {user ? (
            <button
              className="auth-icon-btn profile-icon"
              onClick={() => navigate(user.role === 'owner' ? '/dashboard' : '/customer-dashboard')}
              aria-label="Dashboard"
              title={`Dashboard (${user.email})`}
            >
              <User size={20} />
            </button>
          ) : (
            <button
              className="auth-icon-btn login-icon"
              onClick={handleLogin}
              aria-label="Login"
              title="Login"
            >
              <Key size={20} />
            </button>
          )}
        </div>

      </nav>

      {menuOpen && (
        <div
          className="nav-overlay"
          onClick={() => setMenuOpen(false)}
          role="presentation"
          aria-hidden="true"
        />
      )}
      <div className={`sidebar-nav ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-nav-header">
          <Link
            to="/"
            className="sidebar-nav-logo"
            onClick={() => setMenuOpen(false)}
          >
            <div className="sidebar-logo-circle">
              <img src={logo} alt={store.name} />
            </div>
            <span>{store.name}</span>
          </Link>
          <button
            className="sidebar-nav-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            title="Close"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav-links" role="navigation">
          <NavLink
            to="/"
            className={({ isActive }) => `sidebar-nav-link ${isActive ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            Home
          </NavLink>

          <div className="sidebar-nav-section">
            <p className="sidebar-nav-label">Products</p>
            {productLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `sidebar-nav-link ${isActive ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <NavLink
            to="/about"
            className={({ isActive }) => `sidebar-nav-link ${isActive ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            About Us
          </NavLink>

          <NavLink
            to="/contact"
            className={({ isActive }) => `sidebar-nav-link ${isActive ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            Contact
          </NavLink>
        </nav>

        <div className="sidebar-nav-footer">
          {user ? (
            <button
              className="sidebar-nav-auth-btn profile-btn"
              onClick={() => {
                navigate(user.role === 'owner' ? '/dashboard' : '/customer-dashboard');
                setMenuOpen(false);
              }}
              title={`Dashboard (${user.email})`}
            >
              <User size={18} />
              <span>Dashboard</span>
            </button>
          ) : (
            <button
              className="sidebar-nav-auth-btn login-btn"
              onClick={handleLogin}
              title="Login"
            >
              <Key size={18} />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>

      <button
        className="mobile-fab-cart"
        onClick={() => {
          navigate("/cart");
          setMenuOpen(false);
        }}
        aria-label={`View shopping cart with ${itemCount} items`}
        title="View Cart"
      >
        <ShoppingCart size={24} />
        {itemCount > 0 && (
          <span className="mobile-fab-badge">{itemCount > 99 ? "99+" : itemCount}</span>
        )}
      </button>
    </>
  );
}