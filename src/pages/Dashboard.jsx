import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth.js";
import { fetchDashboardStats, fetchNotifications } from "../lib/dashboard.js";
import { getStoreSettings, getStoreSettingsSync } from "../utils/storeSettingsCache.js";
import "./Dashboard.css";
import { ShoppingBag, Star, Package, Bell, DollarSign, Flower, TrendingUp, ShoppingCart, Sparkles, Wallet, Package2, Users } from "lucide-react";

/* ── tiny hook: count up animation ── */
function useCountUp(target, duration = 1200, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

/* ── stat card ── */
function StatCard({ icon, label, value, prefix = "", suffix = "", color, delay, animate }) {
  const count = useCountUp(value, 1400, animate);
  return (
    <div className="stat-card" style={{ "--delay": `${delay}ms`, "--accent": color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <span className="stat-value">{prefix}{count.toLocaleString()}{suffix}</span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-bar" />
    </div>
  );
}

/* ── nav item ── */
function NavItem({ icon, label, desc, to, delay, onClick }) {
  return (
    <button
      className="nav-item"
      style={{ "--delay": `${delay}ms` }}
      onClick={onClick}
    >
      <div className="nav-item-icon">{icon}</div>
      <div className="nav-item-text">
        <span className="nav-item-label">{label}</span>
        <span className="nav-item-desc">{desc}</span>
      </div>
      <div className="nav-item-arrow">→</div>
    </button>
  );
}

/* ── recent activity (loaded from Supabase) ── */
const activityIcons = {
  new_order:  <ShoppingBag size={20} />,
  low_stock:  <Sparkles size={20} />,
};
const activityColors = {
  new_order: "#e8f5e9",
  low_stock: "#fff3e0",
};

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [animate, setAnimate] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0 });
  const [activities, setActivities] = useState([]);
  const heroRef = useRef(null);

  const [storeName, setStoreName] = useState(() => getStoreSettingsSync().name || "Nuestras Artesanías");

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    // Fetch store settings (uses shared cache)
    getStoreSettings().then(data => {
      if (data && data.name) setStoreName(data.name);
    });

    // Fetch real data from Supabase (static imports, no dynamic import)
    fetchDashboardStats().then(data => {
      const totalRevenue = data.monthlyRevenue.reduce((s, m) => s + Number(m.revenue || 0), 0);
      const totalOrders = data.monthlyRevenue.reduce((s, m) => s + Number(m.order_count || 0), 0);
      setStats({ revenue: Math.round(totalRevenue), orders: totalOrders, products: 0 });
    });

    fetchNotifications(5).then(data => {
      setActivities(data.map(n => ({
        id: n.id,
        icon: activityIcons[n.type] || <Bell size={20} />,
        text: n.message,
        time: new Date(n.created_at).toLocaleString(),
        color: activityColors[n.type] || "#f3f4f6",
      })));
    });

    const t = setTimeout(() => setAnimate(true), 400);
    return () => clearTimeout(t);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="dash-root">
      {/* Background orbs */}
      <div className="dash-orb dash-orb-1" />
      <div className="dash-orb dash-orb-2" />
      <div className="dash-orb dash-orb-3" />

      {/* Header */}
      <header className="dash-header">
        <div className="dash-header-inner">
          <div className="dash-logo">
            <Flower size={24} className="dash-logo-icon" />
            <span className="dash-logo-text">{storeName}</span>
          </div>
          <div className="dash-header-right">
            <div className="dash-avatar" title={user?.email}>
              {user?.email?.[0]?.toUpperCase() ?? "O"}
            </div>
            <button className="dash-logout-btn" onClick={handleLogout}>
              <span>Logout</span>
              <span className="logout-icon-arrow">↗</span>
            </button>
          </div>
        </div>
      </header>

      <main className="dash-main">

        {/* Hero welcome */}
        <section className="dash-hero" ref={heroRef}>
          <div className="dash-hero-text">
            <p className="dash-greeting">{greeting},</p>
            <h1 className="dash-title">
              Owner <span className="dash-title-accent">Dashboard</span>
            </h1>
            <p className="dash-subtitle">
              <span className="dash-pill">● Live</span>
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email} &nbsp;·&nbsp; Owner Access
            </p>
          </div>
          <div className="dash-hero-badge">
            <div className="dash-badge-ring" />
            <Flower size={32} className="dash-badge-emoji" />
          </div>
        </section>

        {/* Stats row */}
        <section className="dash-stats">
          <StatCard icon={<Wallet size={28} />} label="Revenue (BZD)"  value={stats.revenue}  prefix="$" color="#8b4513" delay={0}   animate={animate} />
          <StatCard icon={<Package2 size={28} />} label="Total Orders"   value={stats.orders}              color="#a0522d" delay={80}  animate={animate} />
          <StatCard icon={<ShoppingBag size={28} />} label="Products Live"  value={stats.products}               color="#cd853f" delay={160} animate={animate} />
          <StatCard icon={<Star size={28} />} label="Avg Rating"     value={48}   suffix="/50" color="#d2691e" delay={240} animate={animate} />
        </section>

        {/* Main grid */}
        <div className="dash-grid">

          {/* Activity feed - removed Quick Access section since navigation is now in sidebar */}
          <section className="dash-activity-section dash-activity-full">
            <h2 className="dash-section-title">
              Recent Activity
              <span className="dash-live-dot" />
            </h2>
            <div className="dash-activity-list">
              {activities.map((a, i) => (
                <div
                  key={a.id}
                  className="activity-item"
                  style={{ "--delay": `${i * 80 + 200}ms`, "--bg": a.color }}
                >
                  <div className="activity-icon">{a.icon}</div>
                  <div className="activity-text">
                    <span className="activity-msg">{a.text}</span>
                    <span className="activity-time">{a.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Footer note */}
        <p className="dash-footer-note">
          Handcrafted with love from Corozal, Belize 🌺
        </p>
      </main>
    </div>
  );
}