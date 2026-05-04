import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, Suspense, lazy } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
import { useAuth } from "./contexts/auth.js";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getStoreSettings } from "./utils/storeSettingsCache.js";
import { queryCache, CACHE_TTL } from "./lib/cache.middlware.js";
import { fetchCategories, fetchFeaturedProducts } from "./lib/products.js";
import Home from "./pages/Home.jsx";
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
function RoleBasedRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (loading || hasRedirected.current) return;

    getStoreSettings().then(data => {
      if (data && data.name) {
        document.title = `${data.name} | ${data.tagline || 'Handcrafted Products'}`;
      }
    }).catch(console.error);
    const currentPath = window.location.pathname;

    hasRedirected.current = true;
    const protectedPaths = ["/login", "/create-account", "/checkout", "/dashboard", "/products", "/orders", "/analytics", "/customers", "/settings"];
    if (protectedPaths.includes(currentPath)) return;
    if (user && currentPath === "/") {
      if (user.role === "owner") {
        navigate("/dashboard", { replace: true });
      } else if (user.role === "customer") {
        navigate("/customer-dashboard", { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return null;
}
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
function LoginLayout() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Outlet />
    </>
  );
}
function OwnerProtectionLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (user.role !== "owner") {
    return <Navigate to="/" replace />;
  }
  return <DashboardLayout />;
}

function CustomerDashboardLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
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
export default function App() {
  const { loading } = useAuth();

  useEffect(() => {
    // Warm the cache: pre-fetch critical data in parallel for instant page loads
    queryCache.warmup([
      { key: 'categories', fetcher: fetchCategories, ttl: CACHE_TTL.CATEGORIES },
      { key: queryCache.key('featured', 5), fetcher: () => fetchFeaturedProducts(5), ttl: CACHE_TTL.FEATURED },
    ]);

    getStoreSettings().then(settings => {
      if (settings) {
        const doc = document.documentElement;
        doc.setAttribute('data-theme', settings.theme || 'warm');
        doc.setAttribute('data-style', settings.cardStyle || 'rounded');
      }
    }).catch(console.error);
    const handleGlobalClick = (e) => {
      const button = e.target.closest('button, .nav-item, .cd-order-item, .activity-item');
      if (button) {
        console.log("clicked", button.className || button.tagName);
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
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
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/:categorySlug" element={<CategoryPage />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="*" element={
            <div className="not-found">
              <span style={{ fontSize: '48px', display: 'inline-block' }}>🔎</span>
              <h2>Page Not Found</h2>
              <a href="/">Go Home</a>
            </div>
          } />
        </Route>
        <Route element={<LoginLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/checkout" element={<CheckoutForm />} />
        </Route>
        <Route element={<OwnerProtectionLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/products" element={<Products />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route element={<CustomerDashboardLayout />}>
          <Route path="/customer-dashboard" element={<CustomerDashboard />} />
        </Route>
      </Routes>
        </Suspense>
    </BrowserRouter>
    </>
  );
}