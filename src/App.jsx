import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, Suspense, lazy } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
import { useAuth } from "./contexts/auth.js";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getStoreSettings } from "./utils/storeSettingsCache.js";

// ── Eagerly loaded (critical path) ──────────────────────────
import Home from "./pages/Home.jsx";

// ── Lazy loaded (code-split) ────────────────────────────────
const Login = lazy(() => import("./pages/login.jsx"));
const CreateAccount = lazy(() => import("./pages/CreateAccount.jsx"));
const CheckoutForm = lazy(() => import("./pages/CheckoutForm.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const CartPage = lazy(() => import("./pages/CartPage.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const CategoryPage = lazy(() => import("./pages/products/CategoryPage.jsx"));
const Analytics = lazy(() => import("./pages/products/Analytics.jsx"));
const Products = lazy(() => import("./pages/products/Products.jsx"));
const Orders = lazy(() => import("./pages/products/Orders.jsx"));
const Customers = lazy(() => import("./pages/products/Customers.jsx"));
const Settings = lazy(() => import("./pages/products/Settings.jsx"));

const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard.jsx"));
const ProductDetail = lazy(() => import("./pages/ProductDetail.jsx"));

import "./App.css";

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function FullScreenLoader() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(t);
  }, []);
  if (!show) return <div style={{ minHeight: "100vh", backgroundColor: "#faf4ee" }} />;
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#faf4ee" }}>
      <p style={{ color: "#7c3d26", fontFamily: "'Jost', sans-serif", fontWeight: 500 }}>Loading...</p>
    </div>
  );
}

/** Lightweight fallback for lazy-loaded routes */
function RouteFallback() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#faf4ee" }}>
      <div style={{ 
        width: 36, height: 36, borderRadius: "50%",
        border: "3px solid rgba(201,149,106,0.2)",
        borderTopColor: "#c9956a",
        animation: "spin 0.7s linear infinite"
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/**
 * RoleBasedRedirect — Automatically redirects users on initial load based on their role
 * ✅ Owner → /dashboard
 * ✅ Customer → / (home)
 * ✅ Not logged in → stays on current page
 * 
 * This runs ONCE when the app loads (after auth state is determined)
 * Uses a ref to prevent double redirects
 */
function RoleBasedRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only run after loading is complete and user state is known
    if (loading || hasRedirected.current) return;

    // Fetch store settings for document title (uses shared cache)
    getStoreSettings().then(data => {
      if (data && data.name) {
        document.title = `${data.name} | ${data.tagline || 'Handcrafted Products'}`;
      }
    }).catch(console.error);

    // Get current location
    const currentPath = window.location.pathname;

    // Mark that we've processed the initial load redirect check
    hasRedirected.current = true;

    // Don't redirect if user is already on a specific page (protect manual navigation)
    const protectedPaths = ["/login", "/create-account", "/checkout", "/dashboard", "/products", "/orders", "/analytics", "/customers", "/settings"];
    if (protectedPaths.includes(currentPath)) return;

    // Automatic redirect logic:
    if (user && currentPath === "/") {
      if (user.role === "owner") {
        // Owner on home → redirect to dashboard
        navigate("/dashboard", { replace: true });
      } else if (user.role === "customer") {
        // Customer on home → redirect to customer dashboard
        navigate("/customer-dashboard", { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return null;
}

/**
 * PublicLayout - Used for all publicly accessible pages
 * All pages are accessible whether user is authenticated or not
 */
function PublicLayout() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <div className="page-body">
        <Outlet />
      </div>
      <Footer />
    </>
  );
}

/**
 * LoginLayout - Used only for login page
 * Navbar yes, but no Footer
 */
function LoginLayout() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Outlet />
    </>
  );
}

/**
 * OwnerProtectionLayout - Permission wrapper for owner dashboard
 * Checks authentication and owner role, then renders DashboardLayout with sidebar
 */
function OwnerProtectionLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "owner") {
    return <Navigate to="/" replace />;
  }

  // User is authenticated and is an owner - render dashboard with fixed sidebar layout
  return <DashboardLayout />;
}

function CustomerDashboardLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "customer") {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}
/**
 * Main App Router
 * 
 * Routing structure:
 * / → Home (public)
 * /about → About (public)
 * /contact → Contact (public)
 * /cart → Cart (public)
 * /bracklets, /anklets, /waistchains, /necklaces, /earrings → Jewelry Products (public)
 * /product/:category/:id → Product Detail (public)
 * /login → Login (public, redirects to home if already logged in)
 * /create-account → Create Account (public, redirects to home after successful registration)
 * /dashboard, /products, /orders, /analytics, /settings → Owner Dashboard (protected)
 * /customer-dashboard → Customer Dashboard (protected)
 * /* → 404 Page (public)
 */
export default function App() {
  const { loading } = useAuth();

  useEffect(() => {
    // Apply global appearance settings from cache/DB
    getStoreSettings().then(settings => {
      if (settings) {
        const doc = document.documentElement;
        
        // Set data attributes
        doc.setAttribute('data-theme', settings.theme || 'warm');
        doc.setAttribute('data-style', settings.cardStyle || 'rounded');
      }
    }).catch(console.error);
  }, []);

  if (loading) {
    return <FullScreenLoader />;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <BrowserRouter>
        <RoleBasedRedirect />
        <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* PUBLIC ROUTES - Accessible to all users */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/:categorySlug" element={<CategoryPage />} />

          {/* ✅ Product Detail Page */}
          <Route path="/product/:category/:id" element={<ProductDetail />} />

          {/* 404 fallback */}
          <Route path="*" element={
            <div className="not-found">
              <span style={{ fontSize: '48px', display: 'inline-block' }}>🔎</span>
              <h2>Page Not Found</h2>
              <a href="/">Go Home</a>
            </div>
          } />
        </Route>

        {/* LOGIN & ACCOUNT CREATION & CHECKOUT ROUTES - Public routes, Navbar but no Footer */}
        <Route element={<LoginLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/checkout" element={<CheckoutForm />} />
        </Route>

        {/* OWNER DASHBOARD - Protected route, only owners can access */}
        <Route element={<OwnerProtectionLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/products" element={<Products />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* CUSTOMER DASHBOARD - Protected route, only customers can access */}
        <Route element={<CustomerDashboardLayout />}>
          <Route path="/customer-dashboard" element={<CustomerDashboard />} />
        </Route>
      </Routes>
        </Suspense>
    </BrowserRouter>
    </>
  );
}