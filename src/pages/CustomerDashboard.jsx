
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../contexts/auth.js";
import { useNavigate } from "react-router-dom";
import { fetchMyOrders } from "../lib/orders.js";
import { supabase } from "../lib/supabase.js";
import Sidebar from "../components/Sidebar.jsx";
import EmptyState from "../components/EmptyState.jsx";
import {
  LayoutDashboard, ShoppingBag, History,
  CheckCircle2, Circle,
  Search, Package, Filter, Star, AlertCircle,
  TrendingUp, Clock, ChevronRight, Sparkles, X, User, Eye, EyeOff, Key, Loader,
} from "lucide-react";

/* ─── CONSTANTS ─────────────────────────────────────────────── */
const STATUS_CONFIG = {
  pending:       { label: "Pending",     color: "#92400e", bg: "#fef3c7", dot: "#f59e0b" },
  "in-progress": { label: "In Progress", color: "#1e40af", bg: "#dbeafe", dot: "#3b82f6" },
  ready:         { label: "Ready",       color: "#065f46", bg: "#d1fae5", dot: "#10b981" },
  delivered:     { label: "Delivered",   color: "#4b5563", bg: "#f3f4f6", dot: "#9ca3af" },
};

/* ─── HELPERS ───────────────────────────────────────────────── */
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-BZ", { year: "numeric", month: "short", day: "numeric" });
const fmtMoney = (n) => `BZD $${Number(n).toFixed(2)}`;
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

/* ─── DESIGN TOKENS ─────────────────────────────────────────── */
const T = {
  brown:      "#7c3d26",
  brownLight: "#a0522d",
  gold:       "#c9956a",
  goldLight:  "#e8c49a",
  cream:      "#faf4ee",
  cream2:     "#f5ece0",
  blush:      "#fdf0ea",
  text:       "#2d1a0e",
  muted:      "#9a7060",
  serif:      "'Cormorant Garamond', Georgia, serif",
  sans:       "'Jost', 'DM Sans', sans-serif",
};

const STAT_BG    = { pending: "#fef3c7", inprog: "#dbeafe", ready: "#d1fae5", delivered: "#f3f4f6" };
const STAT_COLOR = { pending: "#92400e", inprog: "#1e40af", ready: "#065f46", delivered: "#4b5563" };

/* ─── SMALL REUSABLE BITS ────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap", fontFamily: T.sans }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function SectionTitle({ children, mt = 0 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, marginTop: mt }}>
      <h3 style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 600, color: T.text, whiteSpace: "nowrap", margin: 0 }}>{children}</h3>
      <div style={{ flex: 1, height: 1, background: "rgba(201,149,106,0.22)" }} />
    </div>
  );
}

function PayBadge({ status }) {
  const paid = status === "paid";
  return (
    <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 20, fontFamily: T.sans, background: paid ? "#d1fae5" : "#fee2e2", color: paid ? "#065f46" : "#991b1b", display: "inline-flex", alignItems: "center", gap: 4 }}>
      {paid ? <><CheckCircle2 size={10} /> Paid</> : <><AlertCircle size={10} /> Unpaid</>}
    </span>
  );
}

/* ─── STATUS TIMELINE ────────────────────────────────────────── */
function StatusTimeline({ current }) {
  const steps = ["pending", "in-progress", "ready", "delivered"];
  const currentIdx = steps.indexOf(current);
  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      {steps.map((step, i) => {
        const done = i <= currentIdx;
        return (
          <div key={step} style={{ display: "flex", alignItems: "flex-start", flex: i < steps.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: done ? T.brown : T.cream2, border: `2px solid ${done ? T.brown : T.goldLight}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {done ? <CheckCircle2 size={13} color="#fff" strokeWidth={2.5} /> : <Circle size={12} color={T.goldLight} />}
              </div>
              <span style={{ fontSize: 9, fontWeight: done ? 600 : 400, color: done ? T.brown : "#bbb", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: T.sans }}>
                {STATUS_CONFIG[step].label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < currentIdx ? T.brown : T.cream2, margin: "12px 4px 0" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── ORDER DETAIL MODAL ─────────────────────────────────────── */
function OrderModal({ order, onClose }) {
  if (!order) return null;
  return (
    <div className="cd-modal-backdrop" onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(45,26,14,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20, backdropFilter: "blur(3px)" }}>
      <div className="cd-modal-content" onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 22, padding: "32px 28px", width: "100%", maxWidth: 500, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 30px 80px rgba(45,26,14,0.2)", border: "1px solid rgba(201,149,106,0.15)", boxSizing: "border-box" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 10, color: T.gold, fontWeight: 600, marginBottom: 3, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: T.sans }}>Order ID</p>
            <h2 style={{ fontFamily: T.serif, fontSize: 24, color: T.text, margin: 0, fontWeight: 600 }}>{order.id}</h2>
          </div>
          <button onClick={onClose}
            style={{ background: T.blush, border: "none", borderRadius: 10, width: 36, height: 36, cursor: "pointer", color: T.brown, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <StatusBadge status={order.status} />
          <PayBadge status={order.paymentStatus} />
        </div>

        <div style={{ height: 1, background: "rgba(201,149,106,0.18)", marginBottom: 18 }} />

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ fontSize: 13, color: T.muted, fontFamily: T.sans }}>Order Date</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: T.text, fontFamily: T.sans }}>{fmtDate(order.date)}</span>
        </div>

        <p style={{ fontSize: 10, fontWeight: 600, color: T.gold, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, fontFamily: T.sans }}>Items Ordered</p>
        <div style={{ background: T.blush, borderRadius: 14, padding: "12px 16px", marginBottom: 20, border: "1px solid rgba(201,149,106,0.12)" }}>
          {order.items.map((item, i) => {
            const isCancelled = item.itemStatus === 'cancelled';
            return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < order.items.length - 1 ? "1px solid rgba(201,149,106,0.15)" : "none", opacity: isCancelled ? 0.5 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {item.image ? (
                  <img src={item.image} alt={item.name} loading="lazy" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(201,149,106,0.2)", filter: isCancelled ? 'grayscale(1)' : 'none' }} />
                ) : (
                  <div style={{ width: 40, height: 40, background: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(201,149,106,0.2)" }}>
                    <Package size={20} color={T.goldLight} />
                  </div>
                )}
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: T.text, margin: 0, fontFamily: T.sans, textDecoration: isCancelled ? 'line-through' : 'none' }}>{item.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <p style={{ fontSize: 12, color: T.muted, margin: 0, fontFamily: T.sans }}>Qty: {item.qty}</p>
                    {isCancelled && <span style={{ fontSize: 10, background: '#fee2e2', color: '#991b1b', padding: '1px 7px', borderRadius: 8, fontWeight: 500 }}>Cancelled</span>}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: isCancelled ? T.muted : T.brown, fontFamily: T.sans, textDecoration: isCancelled ? 'line-through' : 'none' }}>{fmtMoney(item.price * item.qty)}</span>
            </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, marginTop: 4, borderTop: "1px solid rgba(201,149,106,0.2)" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.sans }}>Total</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.brown, fontFamily: T.sans }}>{fmtMoney(order.total)}</span>
          </div>
        </div>

        {order.notes && (
          <>
            <p style={{ fontSize: 10, fontWeight: 600, color: T.gold, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8, fontFamily: T.sans }}>Your Notes</p>
            <div style={{ background: "#fffbf5", border: "1px solid rgba(201,149,106,0.25)", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: T.brownLight, margin: 0, lineHeight: 1.6, fontStyle: "italic", fontFamily: T.serif }}>{order.notes}</p>
            </div>
          </>
        )}

        <p style={{ fontSize: 10, fontWeight: 600, color: T.gold, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14, fontFamily: T.sans }}>Order Progress</p>
        <StatusTimeline current={order.status} />
      </div>
    </div>
  );
}

/* ─── SECTION: OVERVIEW ─────────────────────────────────────── */
function Overview({ orders, onViewOrder, user }) {
  const counts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});
  const active = orders.filter((o) => o.status !== "delivered");
  const recent = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
  const firstName = user?.firstName || user?.email?.split("@")[0] || "there";

  const stats = [
    { key: "pending",   label: "Pending",     val: counts.pending || 0,        Icon: Clock },
    { key: "inprog",    label: "In Progress", val: counts["in-progress"] || 0, Icon: TrendingUp },
    { key: "ready",     label: "Ready",       val: counts.ready || 0,          Icon: Package },
    { key: "delivered", label: "Delivered",   val: counts.delivered || 0,      Icon: CheckCircle2 },
  ];

  return (
    <div>
      {/* Welcome Banner */}
      <div className="cd-banner" style={{ background: "#fff", borderRadius: 20, padding: "26px 28px", marginBottom: 24, border: "1px solid rgba(201,149,106,0.18)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -30, top: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,196,154,0.22) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 100, bottom: -50, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(247,168,158,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
            <h2 className="cd-banner-title" style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 600, color: T.text, margin: 0, lineHeight: 1.1 }}>
              {getGreeting()}, {firstName}!
            </h2>
            <Sparkles size={18} color={T.gold} />
          </div>
          <p style={{ color: T.muted, fontSize: 14, margin: 0, fontFamily: T.sans }}>
            Your handcrafted pieces are being made with love in Corozal, Belize.
          </p>
        </div>
        <div style={{ background: T.blush, border: "1px solid rgba(201,149,106,0.28)", borderRadius: 12, padding: "9px 15px", display: "flex", alignItems: "center", gap: 7, flexShrink: 0, position: "relative" }}>
          <Star size={13} color={T.gold} fill={T.gold} />
          <span style={{ fontSize: 12, fontWeight: 500, color: T.brown, fontFamily: T.sans }}>Artisan Quality</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="cd-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 30 }}>
        {stats.map(({ key, label, val, Icon }) => (
          <div key={key} style={{ background: STAT_BG[key], borderRadius: 16, padding: "18px 16px" }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${STAT_BG[key]}`, border: `1px solid ${STAT_COLOR[key]}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={14} color={STAT_COLOR[key]} />
              </div>
            </div>
            <p style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 600, color: STAT_COLOR[key], margin: 0, lineHeight: 1 }}>{val}</p>
            <p style={{ fontSize: 11, color: STAT_COLOR[key], fontWeight: 500, marginTop: 5, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: T.sans }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Active orders */}
      {active.length > 0 && (
        <>
          <SectionTitle>Active Orders</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 30 }}>
            {active.map((o) => (
              <div key={o.id} className="cd-order-item" onClick={() => onViewOrder(o)}
                style={{ background: "#fff", border: "1px solid rgba(201,149,106,0.15)", borderLeft: `3px solid ${T.brown}`, borderRadius: "0 14px 14px 0", padding: "14px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.brown, margin: 0, fontFamily: T.sans }}>{o.id}</p>
                  <p style={{ fontSize: 12, color: T.muted, margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: T.sans }}>{o.items.map(i => i.name).join(", ")}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <StatusBadge status={o.status} />
                  <ChevronRight size={14} color={T.gold} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Recent activity */}
      <SectionTitle>Recent Activity</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {recent.map((o) => (
          <div key={o.id} className="cd-activity-item" onClick={() => onViewOrder(o)}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: T.blush, borderRadius: 12, cursor: "pointer" }}
          >
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text, display: "block", fontFamily: T.sans }}>{o.id}</span>
              <span style={{ fontSize: 12, color: T.muted, fontFamily: T.sans }}>{fmtDate(o.date)}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <StatusBadge status={o.status} />
              <span style={{ fontSize: 12, fontWeight: 600, color: T.brown, display: "block", marginTop: 4, fontFamily: T.sans }}>{fmtMoney(o.total)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── SECTION: MY ORDERS ─────────────────────────────────────── */
function MyOrders({ orders, onViewOrder }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const filtered = useMemo(() => orders.filter((o) => {
    const ms = o.id.toLowerCase().includes(search.toLowerCase()) || o.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    return ms && (filterStatus === "all" || o.status === filterStatus);
  }), [orders, search, filterStatus]);

  const inp = { padding: "9px 14px", borderRadius: 10, fontSize: 13, border: "1px solid rgba(201,149,106,0.25)", background: "#fff", color: T.text, outline: "none", fontFamily: T.sans };

  return (
    <div>
      <h2 style={{ fontFamily: T.serif, fontSize: 26, color: T.text, marginBottom: 4, fontWeight: 600 }}>My Orders</h2>
      <p style={{ color: T.muted, fontSize: 14, marginBottom: 22, fontFamily: T.sans }}>View and manage all your orders.</p>

      <div className="cd-filter-row" style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
          <Search size={13} color={T.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input type="text" placeholder="Search by order ID or item..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inp, width: "100%", paddingLeft: 34, boxSizing: "border-box" }} />
        </div>
        <div style={{ position: "relative" }}>
          <Filter size={12} color={T.muted} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...inp, paddingLeft: 30, appearance: "none", cursor: "pointer" }}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="ready">Ready for Pickup</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No Orders Yet"
          description="You haven't placed any orders yet. Start exploring our handcrafted artesanías collection and make your first purchase!"
          buttonText="Start Shopping"
          onClick={() => navigate("/products")}
          type="orders"
          compact={true}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((o) => (
            <div key={o.id} className="cd-order-item" onClick={() => onViewOrder(o)}
              style={{ background: "#fff", border: "1px solid rgba(201,149,106,0.15)", borderRadius: 16, padding: "18px 20px", cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.brown, fontFamily: T.sans }}>{o.id}</span>
                    <StatusBadge status={o.status} />
                    <PayBadge status={o.paymentStatus} />
                  </div>
                  <p style={{ fontSize: 13, color: T.muted, margin: 0, lineHeight: 1.5, fontFamily: T.sans }}>{o.items.map((i) => `${i.name} ×${i.qty}`).join(" · ")}</p>
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    {o.items.slice(0, 3).map((item, idx) => (
                      item.image ? (
                        <img key={idx} src={item.image} alt={item.name} loading="lazy" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 6, border: "1px solid rgba(201,149,106,0.2)" }} title={item.name} />
                      ) : (
                        <div key={idx} style={{ width: 32, height: 32, background: "#fff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(201,149,106,0.2)" }}>
                          <Package size={14} color={T.goldLight} />
                        </div>
                      )
                    ))}
                    {o.items.length > 3 && (
                      <div style={{ width: 32, height: 32, background: "#fff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: T.muted, border: "1px solid rgba(201,149,106,0.2)" }}>
                        +{o.items.length - 3}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: T.brown, margin: 0, fontFamily: T.sans }}>{fmtMoney(o.total)}</p>
                  <p style={{ fontSize: 12, color: T.muted, margin: "4px 0 0", fontFamily: T.sans }}>{fmtDate(o.date)}</p>
                </div>
              </div>
              {o.notes && (
                <p style={{ fontSize: 12, color: T.brownLight, background: "#fffbf5", border: "1px solid rgba(201,149,106,0.2)", borderRadius: 8, padding: "6px 10px", marginTop: 12, fontStyle: "italic", fontFamily: T.serif }}>
                  Note: {o.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── SECTION: ORDER HISTORY ─────────────────────────────────── */
function OrderHistory({ orders }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const delivered = orders.filter((o) => o.status === "delivered");
  const filtered = useMemo(() => delivered.filter((o) =>
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase())) ||
    fmtDate(o.date).toLowerCase().includes(search.toLowerCase())
  ), [delivered, search]);
  const totalSpent = delivered.reduce((s, o) => s + o.total, 0);
  const totalItems = delivered.reduce((s, o) => s + o.items.reduce((si, i) => si + i.qty, 0), 0);

  return (
    <div>
      <h2 style={{ fontFamily: T.serif, fontSize: 26, color: T.text, marginBottom: 4, fontWeight: 600 }}>Order History</h2>
      <p style={{ color: T.muted, fontSize: 14, marginBottom: 22, fontFamily: T.sans }}>All your completed and delivered orders.</p>

      <div className="cd-hist-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 26 }}>
        {[
          { Icon: History,    label: "Completed", val: delivered.length,      big: true },
          { Icon: Package,    label: "Items",     val: totalItems,            big: true },
          { Icon: TrendingUp, label: "Total Spent", val: fmtMoney(totalSpent), big: false },
        ].map(({ Icon, label, val, big }) => (
          <div key={label} style={{ background: T.blush, borderRadius: 16, padding: "18px 18px", border: "1px solid rgba(201,149,106,0.15)" }}>
            <Icon size={16} color={T.brownLight} style={{ marginBottom: 8 }} />
            <p style={{ fontFamily: T.serif, fontSize: big ? 28 : 20, fontWeight: 600, color: T.brown, margin: 0 }}>{val}</p>
            <p style={{ fontSize: 11, color: T.brownLight, fontWeight: 500, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: T.sans }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ position: "relative", marginBottom: 18 }}>
        <Search size={13} color={T.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input type="text" placeholder="Search by order ID, item, or date..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: "10px 14px 10px 34px", borderRadius: 10, fontSize: 13, border: "1px solid rgba(201,149,106,0.25)", background: "#fff", color: T.text, outline: "none", boxSizing: "border-box", fontFamily: T.sans }} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No Order History"
          description="Your completed orders will appear here once you place your first order."
          buttonText="Start Shopping"
          onClick={() => navigate("/products")}
          type="orders"
          compact={true}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((o) => (
            <div key={o.id} className="cd-order-item" style={{ background: "#fff", border: "1px solid rgba(201,149,106,0.12)", borderRadius: 14, padding: "16px 20px", borderLeft: `3px solid ${T.goldLight}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.brown, fontFamily: T.sans }}>{o.id}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <p style={{ fontSize: 13, color: T.muted, margin: 0, lineHeight: 1.5, fontFamily: T.sans }}>{o.items.map((i) => `${i.name} ×${i.qty}`).join(" · ")}</p>
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    {o.items.slice(0, 3).map((item, idx) => (
                      item.image ? (
                        <img key={idx} src={item.image} alt={item.name} loading="lazy" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 6, border: "1px solid rgba(201,149,106,0.2)" }} title={item.name} />
                      ) : (
                        <div key={idx} style={{ width: 32, height: 32, background: T.blush, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(201,149,106,0.2)" }}>
                          <Package size={14} color={T.goldLight} />
                        </div>
                      )
                    ))}
                    {o.items.length > 3 && (
                      <div style={{ width: 32, height: 32, background: "#fff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: T.muted, border: "1px solid rgba(201,149,106,0.2)" }}>
                        +{o.items.length - 3}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: T.brown, margin: 0, fontFamily: T.sans }}>{fmtMoney(o.total)}</p>
                  <p style={{ fontSize: 12, color: T.muted, margin: "3px 0 0", fontFamily: T.sans }}>{fmtDate(o.date)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── SECTION: MY PROFILE ────────────────────────────────────── */
function MyProfile({ user }) {
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: ""
  });
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [successPasswordMsg, setSuccessPasswordMsg] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setErrorMsg("");
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;
      
      if (authUser) {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, phone, address')
          .eq('id', authUser.id)
          .single();
          
        if (data && !error) {
          setProfile({
            first_name: data.first_name || user?.firstName || "",
            last_name: data.last_name || user?.lastName || "",
            email: data.email || authUser.email || user?.email || "",
            phone: data.phone || user?.phone || "",
            address: data.address || ""
          });
        } else {
          // Fallback to user object if profile data not found
          setProfile({
            first_name: user?.firstName || "",
            last_name: user?.lastName || "",
            email: authUser.email || user?.email || "",
            phone: user?.phone || "",
            address: ""
          });
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    if (!profile.first_name.trim()) {
      setErrorMsg("First name is a required field.");
      return;
    }
    if (profile.phone && !/^\+?[0-9\s\-()]{7,15}$/.test(profile.phone)) {
      setErrorMsg("Please enter a valid phone number.");
      return;
    }

    setSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          address: profile.address
        })
        .eq('id', authData.user.id);
        
      if (error) throw error;
      
      setSuccessMsg("Profile updated successfully");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    // Reset error
    setPasswordError("");

    // Validation
    if (!password.current || !password.next || !password.confirm) {
      setPasswordError("All fields are required");
      return;
    }

    if (password.next.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (password.next !== password.confirm) {
      setPasswordError("New passwords don't match");
      return;
    }

    try {
      setPasswordLoading(true);

      // Update password in Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: password.next
      });

      if (updateError) {
        setPasswordError(updateError.message || "Failed to update password");
      } else {
        setPassword({ current: "", next: "", confirm: "" });
        setSuccessPasswordMsg("Password updated successfully!");
        setTimeout(() => setSuccessPasswordMsg(""), 4000);
      }
    } catch (err) {
      setPasswordError("An error occurred while updating password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const inp = { width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 14, border: "1px solid rgba(201,149,106,0.25)", background: "#fff", color: T.text, outline: "none", fontFamily: T.sans, boxSizing: "border-box", transition: "border-color 0.2s" };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: T.gold, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6, fontFamily: T.sans };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <h2 style={{ fontFamily: T.serif, fontSize: 26, color: T.text, marginBottom: 4, fontWeight: 600 }}>My Profile</h2>
      <p style={{ color: T.muted, fontSize: 14, marginBottom: 26, fontFamily: T.sans }}>Manage your personal information and contact details.</p>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: T.muted }}>
          <p style={{ fontFamily: T.sans, fontSize: 14 }}>Loading profile data...</p>
        </div>
      ) : (
        <div className="cd-profile-card" style={{ background: "#fff", border: "1px solid rgba(201,149,106,0.15)", borderRadius: 16, padding: "28px", boxShadow: "0 4px 20px rgba(124, 61, 38, 0.05)" }}>
          
          {errorMsg && (
            <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14, fontFamily: T.sans, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", color: "#065f46", padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14, fontFamily: T.sans, display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={16} />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSave}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 20 }}>
              <div style={{ flex: "1 1 200px" }}>
                <label style={labelStyle}>First Name *</label>
                <input type="text" name="first_name" value={profile.first_name} onChange={handleChange} style={inp} placeholder="Your first name" required />
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <label style={labelStyle}>Last Name</label>
                <input type="text" name="last_name" value={profile.last_name} onChange={handleChange} style={inp} placeholder="Your last name" />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Email Address</label>
              <input type="email" name="email" value={profile.email} onChange={handleChange} style={{...inp, background: "#f9f9f9"}} placeholder="Your email address" disabled />
              <p style={{ fontSize: 11, color: T.muted, marginTop: 4, fontFamily: T.sans }}>Email address is used for login and cannot be changed here.</p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Phone Number</label>
              <input type="tel" name="phone" value={profile.phone} onChange={handleChange} style={inp} placeholder="e.g. +501 123-4567" />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid rgba(201,149,106,0.15)", paddingTop: 20 }}>
              <button 
                type="submit" 
                disabled={saving}
                style={{ background: T.brown, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 10, fontSize: 15, fontWeight: 600, fontFamily: T.sans, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, opacity: saving ? 0.7 : 1, transition: "all 0.2s" }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Change Section */}
      {!loading && (
        <div className="cd-password-card" style={{ background: "#fff", border: "1px solid rgba(201,149,106,0.15)", borderRadius: 16, padding: "28px", boxShadow: "0 4px 20px rgba(124, 61, 38, 0.05)", marginTop: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: T.blush, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Key size={20} color={T.brown} />
            </div>
            <div>
              <h3 style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 600, color: T.text, margin: 0 }}>Change Password</h3>
              <p style={{ fontSize: 13, color: T.muted, margin: "4px 0 0", fontFamily: T.sans }}>Update your account password</p>
            </div>
          </div>

          {successPasswordMsg && (
            <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", color: "#065f46", padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14, fontFamily: T.sans, display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={16} />
              {successPasswordMsg}
            </div>
          )}

          {passwordError && (
            <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14, fontFamily: T.sans, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={16} />
              {passwordError}
            </div>
          )}

          {/* Current Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Current Password</label>
            <div style={{ position: "relative" }}>
              <input 
                type={showPasswords.current ? "text" : "password"}
                value={password.current || ""}
                onChange={e => setPassword({...password, current: e.target.value})}
                placeholder="••••••••"
                style={{...inp, paddingRight: "2.5rem"}}
              />
              <button
                type="button"
                tabIndex="-1"
                onMouseDown={e => e.preventDefault()}
                onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#999",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  pointerEvents: "auto",
                }}
              >
                {showPasswords.current ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>New Password</label>
            <div style={{ position: "relative" }}>
              <input 
                type={showPasswords.next ? "text" : "password"}
                value={password.next || ""}
                onChange={e => setPassword({...password, next: e.target.value})}
                placeholder="••••••••"
                style={{...inp, paddingRight: "2.5rem"}}
              />
              <button
                type="button"
                tabIndex="-1"
                onMouseDown={e => e.preventDefault()}
                onClick={() => setShowPasswords({...showPasswords, next: !showPasswords.next})}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#999",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  pointerEvents: "auto",
                }}
              >
                {showPasswords.next ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>Confirm Password</label>
            <div style={{ position: "relative" }}>
              <input 
                type={showPasswords.confirm ? "text" : "password"}
                value={password.confirm || ""}
                onChange={e => setPassword({...password, confirm: e.target.value})}
                placeholder="••••••••"
                style={{...inp, paddingRight: "2.5rem"}}
              />
              <button
                type="button"
                tabIndex="-1"
                onMouseDown={e => e.preventDefault()}
                onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#999",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  pointerEvents: "auto",
                }}
              >
                {showPasswords.confirm ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid rgba(201,149,106,0.15)", paddingTop: 20 }}>
            <button 
              onClick={handleUpdatePassword}
              disabled={passwordLoading}
              style={{ background: T.brown, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 10, fontSize: 15, fontWeight: 600, fontFamily: T.sans, cursor: passwordLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, opacity: passwordLoading ? 0.7 : 1, transition: "all 0.2s" }}
            >
              {passwordLoading ? (
                <><Loader size={14} style={{display:'inline', animation: 'spin 1s linear infinite'}} /> Updating...</>
              ) : (
                <><Key size={14} /> Update Password</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────── */
export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
    else if (user.role !== "customer") navigate("/", { replace: true });
  }, [user, navigate]);

  const handleNavClick = (sectionId) => {
    setActiveSection(sectionId);
  };

  const handleLogout = () => { 
    logout(); 
    navigate("/login", { replace: true }); 
  };

  const handleReturnShopping = () => {
    navigate("/", { replace: true });
  };
  
  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updateNotification, setUpdateNotification] = useState(null);

  // Fetch real orders from Supabase + set up real-time listener
  useEffect(() => {
    if (!user) return;
    
    // 1. Reset state to avoid showing previous user's data
    setMyOrders([]);
    setLoadingOrders(true);

    // Initial fetch
    fetchMyOrders().then(data => {
      const transformed = (data || []).map(o => ({
        id: o.id,
        customerName: o.delivery_name,
        items: (o.order_items || []).map(i => ({
          name: i.product_name || 'Unknown Item',
          qty: i.quantity,
          price: Number(i.unit_price) || 0,
          image: i.product_image,
          itemStatus: i.status || 'active',
        })),
        status: o.status,
        paymentStatus: o.payment_status,
        date: o.created_at,
        notes: o.delivery_notes || "",
        total: Number(o.total) || 0,
      }));
      setMyOrders(transformed);
      setLoadingOrders(false);
    }).catch(err => {
      console.error('Failed to load orders:', err);
      setLoadingOrders(false);
    });

    // Real-time subscription for order updates
    const orderSubscription = supabase
      .channel(`orders_customer_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user.id}`
        },
        (payload) => {
          // When an order is updated (e.g., payment status changed)
          if (payload.eventType === 'UPDATE') {
            const oldPaymentStatus = payload.old?.payment_status;
            const newPaymentStatus = payload.new?.payment_status;
            
            setMyOrders(prevOrders =>
              prevOrders.map(order =>
                order.id === payload.new.id
                  ? {
                      ...order,
                      status: payload.new.status || order.status,
                      paymentStatus: payload.new.payment_status || order.paymentStatus,
                      notes: payload.new.delivery_notes || order.notes,
                    }
                  : order
              )
            );

            // Show notification if payment status changed
            if (oldPaymentStatus !== newPaymentStatus && newPaymentStatus) {
              const message = newPaymentStatus === 'paid' 
                ? `✓ Order ${payload.new.id} marked as Paid!`
                : `Order ${payload.new.id} payment status updated`;
              setUpdateNotification(message);
              setTimeout(() => setUpdateNotification(null), 4000);
            }
            
            // Show notification if order status changed
            if (payload.old?.status !== payload.new?.status) {
              const statusLabel = {
                pending: 'Pending',
                'in-progress': 'In Progress',
                ready: 'Ready for Delivery',
                delivered: 'Delivered'
              }[payload.new.status] || payload.new.status;
              setUpdateNotification(`Order ${payload.new.id} is now ${statusLabel}`);
              setTimeout(() => setUpdateNotification(null), 4000);
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(orderSubscription);
    };
  }, [user]);
  if (!user || user.role !== "customer") return null;

  const pendingCount = myOrders.filter((o) => o.status === "pending" || o.status === "in-progress").length;

  const NAV_ITEMS = [
    { id: "overview", icon: LayoutDashboard, label: "Overview" },
    { id: "orders",   icon: ShoppingBag,     label: "My Orders" },
    { id: "history",  icon: History,         label: "Order History" },
    { id: "profile",  icon: User,            label: "My Profile" },
  ];

  // Safety fallback if activeSection gets stuck on "track" somehow
  useEffect(() => {
    if (activeSection === "track") setActiveSection("orders");
  }, [activeSection]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { font-family: 'Jost', sans-serif; background: #faf4ee; }
        
        .cd-main { 
          flex: 1;
          margin-left: 280px;
          height: 100vh;
          height: 100dvh;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          min-height: 0;
        }
        
        @media (max-width: 768px) {
          .cd-main {
            height: auto !important;
            min-height: 100dvh;
            overflow: visible !important;
            margin-left: 0 !important;
          }
        }
        
        .cd-header {
          animation: slideDown 0.4s ease-out;
        }
        
        .cd-content {
          animation: fadeIn 0.5s ease-out 0.1s backwards;
        }
        
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInCard {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Section fade-up animation */
        .cd-section {
          animation: fadeUp 0.4s ease-out;
        }
        
        /* Scrollbar styling */
        .cd-main::-webkit-scrollbar { width: 8px; }
        .cd-main::-webkit-scrollbar-track { background: transparent; }
        .cd-main::-webkit-scrollbar-thumb {
          background: rgba(123, 61, 38, 0.2);
          border-radius: 4px;
          transition: background 0.2s ease;
        }
        .cd-main::-webkit-scrollbar-thumb:hover {
          background: rgba(123, 61, 38, 0.4);
        }
        
        /* Banner animation */
        .cd-banner {
          animation: slideInCard 0.5s ease-out;
        }
        
        /* Stat cards - staggered */
        [class*="stat-card"], .cd-stats > div {
          animation: slideInCard 0.4s ease-out;
          animation-fill-mode: both;
        }
        
        .cd-stats > div:nth-child(1) { animation-delay: 0.1s; }
        .cd-stats > div:nth-child(2) { animation-delay: 0.15s; }
        .cd-stats > div:nth-child(3) { animation-delay: 0.2s; }
        .cd-stats > div:nth-child(4) { animation-delay: 0.25s; }
        
        /* Order cards - staggered */
        .cd-order-item {
          animation: slideInCard 0.4s ease-out;
          animation-fill-mode: both;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .cd-order-item:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 16px rgba(123, 61, 38, 0.12) !important;
        }
        
        /* Recent activity items */
        .cd-activity-item {
          animation: slideInCard 0.4s ease-out;
          animation-fill-mode: both;
          transition: all 0.2s ease;
        }
        
        .cd-activity-item:hover {
          transform: translateX(4px);
        }
        
        /* Modal animation */
        .cd-modal-backdrop {
          animation: fadeIn 0.3s ease-out;
        }
        
        .cd-modal-content {
          animation: slideInCard 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        /* Smooth color transitions */
        button, [role="button"], input, select, textarea {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @media (max-width: 1024px) {
          .cd-main { margin-left: 240px; }
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          /* Sidebar becomes overlay → main takes full width */
          .cd-main { margin-left: 0 !important; }

          /* Header: leave left room for the hamburger toggle (fixed at left:14px, width:42px) */
          .cd-header {
            padding: 0 16px 0 68px !important;
            height: 56px;
          }

          /* Tighten content padding */
          .cd-content { padding: 16px !important; }

          /* Stats: 2 columns */
          .cd-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .cd-hist-stats { grid-template-columns: repeat(2, 1fr) !important; }

          /* Shrink stat number so it doesn't overflow on 2-col */
          .cd-stats > div p:first-of-type { font-size: 26px !important; }

          /* Banner: stack vertically, tighten padding */
          .cd-banner {
            padding: 18px 16px !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .cd-banner h2, .cd-banner-title { font-size: 20px !important; line-height: 1.2 !important; }
          .cd-banner p  { font-size: 13px !important; }

          /* Modal: full-width, safe padding */
          .cd-modal-content {
            padding: 20px 16px !important;
            border-radius: 16px !important;
            max-height: 92vh !important;
          }

          /* Disable hover slide on mobile (no hover on touch) */
          .cd-activity-item:hover { transform: none !important; }
          .cd-order-item:hover    { transform: none !important; box-shadow: none !important; }
        }

        /* ── Small phones ── */
        @media (max-width: 480px) {
          .cd-header { padding: 0 12px 0 64px !important; }
          .cd-content { padding: 12px !important; }
          .cd-stats { gap: 8px !important; }
          .cd-stats > div { padding: 14px 12px !important; }
          .cd-stats > div p:first-of-type { font-size: 24px !important; }
          .cd-hist-stats { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .cd-filter-row { flex-direction: column !important; }
          .cd-filter-row > div, .cd-filter-row > div > select { width: 100% !important; }
        }
      `}</style>

      <div className="cd-root-container" style={{ display: "flex", background: "#faf4ee" }}>
        <style>{`
          .cd-root-container {
            height: 100vh;
            height: 100dvh;
            overflow: hidden;
          }
          @media (max-width: 768px) {
            .cd-root-container {
              height: auto;
              min-height: 100dvh;
              overflow: visible;
              display: block;
            }
          }
        `}</style>

        {/* ══ SIDEBAR ══ */}
        <Sidebar
          variant="customer"
          items={NAV_ITEMS}
          activeItem={activeSection}
          onItemClick={handleNavClick}
          userEmail={user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}
          onLogout={handleLogout}
          onReturnShopping={handleReturnShopping}
          badgeCount={activeSection === "orders" ? pendingCount : 0}
        />

        {/* ══ MAIN ══ */}
        <main className="cd-main" style={{ display: "flex", flexDirection: "column" }}>
          <header className="cd-header" style={{ background: "#fff", borderBottom: "1px solid rgba(201,149,106,0.12)", padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, gap: 12 }}>
            <p style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 600, color: T.text, margin: 0 }}>
              {NAV_ITEMS.find((n) => n.id === activeSection)?.label}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              {pendingCount > 0 && (
                <div style={{ background: "#fef3c7", color: "#92400e", fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 20, display: "flex", alignItems: "center", gap: 5, fontFamily: T.sans }}>
                  <Clock size={11} /> {pendingCount} active order{pendingCount > 1 ? "s" : ""}
                </div>
              )}
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold} 0%, #d4a077 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: T.brown, fontFamily: T.sans }}>
                {(user.firstName || user.email || "C")[0].toUpperCase()}
              </div>
            </div>
          </header>

          <div className="cd-content" style={{ flex: 1, padding: "28px", width: "100%", display: "flex", flexDirection: "column" }}>
            {loadingOrders && (activeSection === "overview" || activeSection === "orders" || activeSection === "history") ? (
              <div className="cd-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', flexDirection: 'column', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${T.cream2}`, borderTopColor: T.gold, animation: 'spin 0.7s linear infinite' }} />
                <p style={{ color: T.muted, fontSize: 14, fontFamily: T.sans }}>Loading your orders...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              <>
                {activeSection === "overview" && <div className="cd-section"><Overview orders={myOrders} onViewOrder={setSelectedOrder} user={user} /></div>}
                {activeSection === "orders"   && <div className="cd-section"><MyOrders orders={myOrders} onViewOrder={setSelectedOrder} /></div>}
                {activeSection === "history"  && <div className="cd-section"><OrderHistory orders={myOrders} /></div>}
              </>
            )}
            {activeSection === "profile"  && <div className="cd-section"><MyProfile user={user} /></div>}
          </div>
        </main>
      </div>

      <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />

      {/* Real-time Update Notification Toast */}
      {updateNotification && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: '#10b981',
            color: '#fff',
            padding: '14px 18px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 500,
            fontFamily: T.sans,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            zIndex: 2000,
            animation: 'slideInRight 0.3s ease-out',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            maxWidth: 300,
          }}
        >
          <CheckCircle2 size={18} />
          <span>{updateNotification}</span>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}